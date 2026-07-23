import { LayoutStrategy } from '../LayoutStrategy';
import { GraphNode, GraphEdge } from '../../graph/types';
import { SpatialGraph, SpatialNode, SpatialEdge } from '../../graph/SpatialGraph';

// Message types for the worker
export interface D3WorkerMessage {
  type: 'INIT' | 'UPDATE' | 'TICK' | 'END' | 'STABILIZED';
  nodes?: GraphNode[];
  edges?: GraphEdge[];
  spatialNodes?: SpatialNode[];
  spatialEdges?: SpatialEdge[];
}

export class D3LayoutStrategy implements LayoutStrategy {
  private worker: Worker | null = null;
  private onUpdateCallback: ((graph: SpatialGraph) => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.worker = new Worker(new URL('./D3LayoutWorker.ts', import.meta.url), { type: 'module' });
      this.worker.onmessage = this.handleWorkerMessage.bind(this);
    }
  }

  public setOnUpdate(callback: (graph: SpatialGraph) => void) {
    this.onUpdateCallback = callback;
  }

  public init(nodes: GraphNode[], edges: GraphEdge[]) {
    if (!this.worker) return;
    
    const msg: D3WorkerMessage = {
      type: 'INIT',
      nodes,
      edges,
    };
    
    this.worker.postMessage(msg);
  }

  private handleWorkerMessage(event: MessageEvent<D3WorkerMessage>) {
    const { type, spatialNodes, spatialEdges } = event.data;
    
    if ((type === 'TICK' || type === 'STABILIZED') && spatialNodes && spatialEdges) {
      if (this.onUpdateCallback) {
        this.onUpdateCallback({
          nodes: spatialNodes,
          edges: spatialEdges,
          bounds: { minX: 0, minY: 0, minZ: 0, maxX: 0, maxY: 0, maxZ: 0 }, // computed in renderer if needed
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
