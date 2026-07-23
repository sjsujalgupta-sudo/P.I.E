import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide, forceX, forceY, forceZ } from 'd3-force-3d';
import { D3WorkerMessage } from './D3LayoutStrategy';
import { SpatialNode, SpatialEdge } from '../../graph/SpatialGraph';
import { ClusterAnchors } from '../../graph/clustering/ClusterAnchors';

let simulation: any = null;

self.onmessage = (event: MessageEvent<D3WorkerMessage>) => {
  const { type, nodes, edges } = event.data;

  if (type === 'INIT' && nodes && edges) {
    // Track indices within groups for patterned layouts
    const groupCounts: Record<string, number> = {};
    nodes.forEach(n => {
      const g = n.group || 'default';
      groupCounts[g] = (groupCounts[g] || 0) + 1;
    });
    const groupCounters: Record<string, number> = {};

    const spatialNodes: SpatialNode[] = nodes.map(n => {
      const g = n.group || 'default';
      const anchor = ClusterAnchors.getAnchor(g);
      
      const idx = groupCounters[g] || 0;
      groupCounters[g] = idx + 1;
      const count = groupCounts[g];

      let initX = anchor.x;
      let initY = anchor.y;
      let initZ = anchor.z;

      // Varied initial layouts to avoid uniform starbursts
      if (g === 'Programming') {
        // Grid-like
        const cols = Math.ceil(Math.sqrt(count));
        const row = Math.floor(idx / cols);
        const col = idx % cols;
        initX += (col - cols/2) * 15;
        initY += (row - cols/2) * 15;
        initZ += (Math.random() - 0.5) * 10;
      } else if (g === 'Finance') {
        // Linear/Branching (flat)
        initX += (idx - count/2) * 10;
        initY += (Math.random() - 0.5) * 5;
        initZ += (Math.random() - 0.5) * 5;
      } else if (g === 'Entertainment') {
        // Ring/Spiral
        const angle = idx * 0.5;
        const radius = Math.sqrt(idx) * 5;
        initX += Math.cos(angle) * radius;
        initY += Math.sin(angle) * radius;
        initZ += (Math.random() - 0.5) * 10;
      } else {
        // Default cluster (organic diffuse)
        initX += (Math.random() - 0.5) * 80;
        initY += (Math.random() - 0.5) * 80;
        initZ += (Math.random() - 0.5) * 80;
      }

      return {
        ...n,
        position: { x: initX, y: initY, z: initZ },
        visualRadius: n.importance * 3 + 1,
        lodLevel: 0,
        isPinned: false,
        opacity: 1,
        heat: 0,
        nodeClass: 'Normal',
        importance: n.importance,
        title: n.title,
        group: n.group
      };
    });

    const spatialEdges: any[] = edges.map(e => ({
      ...e,
      source: e.source, 
      target: e.target, 
      opacity: 0.3,
      strength: e.weight
    }));

    if (simulation) {
      simulation.stop();
    }

    // Heavy damping (velocityDecay) for stability, less strong global forces
    simulation = forceSimulation(spatialNodes, 3)
      .velocityDecay(0.85) // High inertia, less jelly-like movement
      .force('link', forceLink(spatialEdges).id((d: any) => d.id).distance(20).strength((d: any) => d.strength * 0.5))
      .force('charge', forceManyBody().strength(-30)) // Weaker repulsion for tighter, structured clusters
      .force('collide', forceCollide().radius((d: any) => d.visualRadius + 2).iterations(2))
      .force('clusterX', forceX((d: any) => ClusterAnchors.getAnchor(d.group || 'default').x).strength(0.02))
      .force('clusterY', forceY((d: any) => ClusterAnchors.getAnchor(d.group || 'default').y).strength(0.02))
      .force('clusterZ', forceZ((d: any) => ClusterAnchors.getAnchor(d.group || 'default').z).strength(0.02))
      .on('tick', () => {
        // Map back from d3 mutated objects to SpatialNode/SpatialEdge
        const outputNodes = spatialNodes.map((n: any) => ({
          ...n,
          position: { x: n.x, y: n.y, z: n.z },
          velocity: { x: n.vx, y: n.vy, z: n.vz }
        }));
        
        const outputEdges = spatialEdges.map((e: any) => ({
          ...e,
          source: e.source.id,
          target: e.target.id
        }));

        const tickMsg: D3WorkerMessage = {
          type: 'TICK',
          spatialNodes: outputNodes,
          spatialEdges: outputEdges,
        };
        self.postMessage(tickMsg);
        
        // Custom convergence check to freeze
        if (simulation.alpha() < 0.05) {
          simulation.stop();
          self.postMessage({ type: 'STABILIZED', spatialNodes: outputNodes, spatialEdges: outputEdges } as any);
        }
      })
      .on('end', () => {
        self.postMessage({ type: 'END' });
      });
  }
};
