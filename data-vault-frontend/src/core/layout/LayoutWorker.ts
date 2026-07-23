import { forceSimulation, forceLink, forceManyBody, forceCenter } from 'd3-force-3d';
import { LayoutWorkerMessage, SpatialNode, SpatialEdge } from './types';
import { GraphNode, GraphEdge } from '../graph/types';

let simulation: any = null;

self.onmessage = (event: MessageEvent<LayoutWorkerMessage>) => {
  const { type, nodes, edges } = event.data;

  if (type === 'INIT' && nodes && edges) {
    // Convert to mutable spatial objects
    const spatialNodes: SpatialNode[] = nodes.map(n => ({
      ...n,
      x: (Math.random() - 0.5) * 100,
      y: (Math.random() - 0.5) * 100,
      z: (Math.random() - 0.5) * 100,
    }));

    const spatialEdges: any[] = edges.map(e => ({
      ...e,
      source: e.source, // d3-force mutates this into an object reference
      target: e.target, // d3-force mutates this into an object reference
    }));

    if (simulation) {
      simulation.stop();
    }

    simulation = forceSimulation(spatialNodes, 3)
      .force('link', forceLink(spatialEdges).id((d: any) => d.id).distance(50))
      .force('charge', forceManyBody().strength(-100))
      .force('center', forceCenter(0, 0, 0))
      .on('tick', () => {
        // Send updated positions to main thread
        const tickMsg: LayoutWorkerMessage = {
          type: 'TICK',
          spatialNodes: spatialNodes,
          spatialEdges: spatialEdges as SpatialEdge[],
        };
        self.postMessage(tickMsg);
      })
      .on('end', () => {
        self.postMessage({ type: 'END' });
      });
  }
};
