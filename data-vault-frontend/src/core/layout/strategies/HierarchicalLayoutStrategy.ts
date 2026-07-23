import { LayoutStrategy } from '../LayoutStrategy';
import { GraphNode, GraphEdge } from '../../graph/types';
import { SpatialGraph, SpatialNode, SpatialEdge } from '../../graph/SpatialGraph';
import { WorldBuilder } from '../../world/WorldBuilder';
import { WorldStyler } from '../../world/WorldStyler';
import { WorldGraph } from '../../world/Contracts';

export interface HierarchicalWorkerMessage {
  type: 'INIT' | 'UPDATE' | 'TICK' | 'END' | 'STABILIZED';
  world?: WorldGraph;
  spatialNodes?: SpatialNode[];
  spatialEdges?: SpatialEdge[];
}

export class HierarchicalLayoutStrategy implements LayoutStrategy {
  private worker: Worker | null = null;
  private onUpdateCallback: ((graph: SpatialGraph) => void) | null = null;
  public worldGraph: WorldGraph | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.worker = new Worker(new URL('./HierarchicalLayoutWorker.ts', import.meta.url), { type: 'module' });
      this.worker.onmessage = this.handleWorkerMessage.bind(this);
    }
  }

  public setOnUpdate(callback: (graph: SpatialGraph) => void) {
    this.onUpdateCallback = callback;
  }

  public init(nodes: GraphNode[], edges: GraphEdge[]) {
    // 1. Memory -> WorldGraph (WorldBuilder)
    let world = WorldBuilder.build(nodes, edges);
    
    // 2. WorldGraph -> Styled WorldGraph (WorldStyler)
    world = WorldStyler.style(world);
    this.worldGraph = world;

    if (!this.worker) return;
    
    // 3. Pass WorldGraph to Layout Worker
    const msg: HierarchicalWorkerMessage = {
      type: 'INIT',
      world
    };
    
    this.worker.postMessage(msg);
  }

  private handleWorkerMessage(event: MessageEvent<HierarchicalWorkerMessage & { error?: string, layoutTime?: number }>) {
    const { type, spatialNodes, spatialEdges, error, layoutTime } = event.data;
    
    if (type === 'ERROR' as any) {
       console.error("WORKER ERROR:", error);
       return;
    }

    if ((type === 'TICK' || type === 'STABILIZED') && spatialNodes && spatialEdges) {
      if (type === 'STABILIZED') {
        const anchors = spatialNodes.filter(n => n.nodeClass === 'Landmark').length;
        const traces = spatialNodes.filter(n => n.nodeClass === 'Normal').length;
        const highways = spatialEdges.length;
        
        console.log(`[Stability Audit] Performance Verification:
- Number of traces: ${traces}
- Number of anchors: ${anchors}
- Number of edges (incl highways): ${highways}
- Layout generation time: ${layoutTime?.toFixed(2)}ms
- Memory usage: ${(performance as any).memory?.usedJSHeapSize ? ((performance as any).memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB' : 'N/A'}`);
      }

      if (this.onUpdateCallback) {
        this.onUpdateCallback({
          nodes: spatialNodes,
          edges: spatialEdges,
          bounds: { minX: 0, minY: 0, minZ: 0, maxX: 0, maxY: 0, maxZ: 0 },
          version: Date.now()
        });
      }
    }
  }

  public terminate() {
    if (this.worker) {
      this.worker.terminate();
    }
  }
}
