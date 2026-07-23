import { forceSimulation, forceCollide, forceX, forceY, forceZ } from 'd3-force-3d';
import { HierarchicalWorkerMessage } from './HierarchicalLayoutStrategy';
import { SpatialNode, SpatialEdge } from '../../graph/SpatialGraph';
import { WorldGraph, Domain, District, SemanticAnchor, TraceNode } from '../../world/Contracts';
import { Vector3 } from 'three';
import { ClusterAnchors } from '../../graph/clustering/ClusterAnchors';

let simulation: any = null;

self.onmessage = (event: MessageEvent<HierarchicalWorkerMessage>) => {
  const { type, world } = event.data;

  if (type === 'INIT' && world) {
    
    const spatialNodesMap = new Map<string, SpatialNode>();
    const spatialEdges: SpatialEdge[] = [];
    
    // Deterministic placements
    // 1. Domains get positions from ClusterAnchors
    world.domains.forEach(domain => {
       const anchorPos = ClusterAnchors.getAnchor(domain.name);
       domain.position = new Vector3(anchorPos.x, anchorPos.y, anchorPos.z);
    });

    // 2. Districts relative to Domain
    world.districts.forEach(district => {
       const domain = world.domains.find(d => d.id === district.domainId)!;
       // For now, districts are centered on domain, but could be offset based on profile
       district.position = domain.position!.clone();
    });

    // 3. Anchors relative to District based on LayoutProfile
    world.districts.forEach(district => {
       const profile = district.layoutProfile || { density: 0.5, symmetry: 0.5, branching: 0.5, clustering: 0.5, curvature: 0.5, openness: 0.5 };
       
       district.anchors.forEach((anchor, i) => {
           const count = district.anchors.length;
           
           let offsetX = 0, offsetY = 0, offsetZ = 0;
           
           if (profile.curvature > 0.7) {
               // Spiral/Ring
               const angle = i * Math.PI * 2 / count;
               const radius = (1 - profile.density) * 60 + 30; // Wider spread
               offsetX = Math.cos(angle) * radius;
               offsetY = Math.sin(angle) * radius;
           } else if (profile.branching > 0.7) {
               // Branching (Linear spread)
               offsetX = (i - count / 2) * (1 - profile.density) * 40;
               offsetY = (Math.random() - 0.5) * 30 * (1 - profile.symmetry);
           } else {
               // Grid / Dense
               const cols = Math.max(1, Math.ceil(Math.sqrt(count)));
               const row = Math.floor(i / cols);
               const col = i % cols;
               const spacing = (1 - profile.density) * 30 + 15; // Wider spacing
               offsetX = (col - cols / 2) * spacing;
               offsetY = (row - cols / 2) * spacing;
           }
           
           anchor.position = district.position!.clone().add(new Vector3(offsetX, offsetY, offsetZ));
           
           spatialNodesMap.set(anchor.id, {
               ...anchor.sourceNode,
               position: { x: anchor.position.x, y: anchor.position.y, z: anchor.position.z },
               visualRadius: anchor.sourceNode.importance * 3 + 2, // Larger for anchors
               lodLevel: 0,
               isPinned: true, // Deterministically anchored
               opacity: 1,
               heat: 0,
               nodeClass: 'Landmark',
               group: anchor.domainId.replace('domain-', ''),
               title: anchor.name
           });
       });
    });

    // 4. Traces relative to Anchors
    world.traces.forEach(trace => {
        const anchor = world.anchors.find(a => a.id === trace.anchorId)!;
        const profile = world.domains.find(d => d.id === trace.domainId)?.layoutProfile || { density: 0.5 };
        
        // Traces orbit their anchor
        const radius = (1 - profile.density) * 30 + 10; // Wider footprint
        const angle = Math.random() * Math.PI * 2;
        const sphereZ = (Math.random() - 0.5) * radius;
        
        trace.position = anchor.position!.clone().add(new Vector3(
            Math.cos(angle) * radius,
            Math.sin(angle) * radius,
            sphereZ
        ));

        spatialNodesMap.set(trace.id, {
            ...trace.sourceNode,
            position: { x: trace.position.x, y: trace.position.y, z: trace.position.z },
            visualRadius: 1,
            lodLevel: 2,
            isPinned: false,
            opacity: 1,
            heat: 0,
            nodeClass: 'Normal',
            group: trace.domainId.replace('domain-', ''),
            title: trace.name
        });
    });

    // 5. Convert Roads and Highways to Edges
    world.localRoads.forEach(road => {
        spatialEdges.push({
            source: road.sourceNodeId,
            target: road.targetNodeId,
            opacity: 0.3,
            strength: 0.3,
            isVisible: true
        });
    });
    
    world.highways.forEach(highway => {
        // Connect the primary anchor (first anchor) of each domain
        const sourceAnchor = world.anchors.find(a => a.domainId === highway.sourceDomainId);
        const targetAnchor = world.anchors.find(a => a.domainId === highway.targetDomainId);
        if (sourceAnchor && targetAnchor) {
            spatialEdges.push({
                source: sourceAnchor.id,
                target: targetAnchor.id,
                opacity: 0.3,
                strength: highway.strength,
                isVisible: true
            });
        }
    });

    const spatialNodesArray = Array.from(spatialNodesMap.values());

    if (simulation) {
      simulation.stop();
    }

    try {
      // 6. Collision Relaxation ONLY
      (self as any)._t0 = performance.now();
      
      const targetPosMap = new Map<string, any>();
      world.anchors.forEach(a => targetPosMap.set(a.id, a.position));
      world.traces.forEach(t => targetPosMap.set(t.id, t.position));

      simulation = forceSimulation(spatialNodesArray, 3)
        .velocityDecay(0.8) // Less damping for softer relaxation
        .force('collide', forceCollide().radius((d: any) => {
           // Match the rendered scale in NeuralRenderer (which multiplies Landmark/Hub by 4)
           const renderScale = (d.nodeClass === 'Landmark' || d.nodeClass === 'Hub') ? d.visualRadius * 4 : d.visualRadius;
           return renderScale + 30; // +30 padding to guarantee vast separation for large spheres
        }).iterations(4))
        // Softer forces to maximize local readability instead of packing density
        .force('x', forceX((d: any) => targetPosMap.get(d.id)?.x || d.x).strength(0.2))
        .force('y', forceY((d: any) => targetPosMap.get(d.id)?.y || d.y).strength(0.2))
        .force('z', forceZ((d: any) => targetPosMap.get(d.id)?.z || d.z).strength(0.2))
        .on('tick', () => {
          try {
            const outputNodes = spatialNodesArray.map((n: any) => ({
              ...n,
              position: { x: n.x, y: n.y, z: n.z },
              velocity: { x: n.vx, y: n.vy, z: n.vz }
            }));
            
            self.postMessage({
              type: 'TICK',
              spatialNodes: outputNodes,
              spatialEdges
            } as HierarchicalWorkerMessage);
            
            // Stop extremely quickly, as it's just collision resolution
            if (simulation.alpha() < 0.1) {
              simulation.stop();
              const layoutTime = performance.now() - (self as any)._t0;
              self.postMessage({ type: 'STABILIZED', layoutTime, spatialNodes: outputNodes, spatialEdges } as HierarchicalWorkerMessage & { layoutTime: number });
            }
          } catch (err: any) {
             self.postMessage({ type: 'ERROR', error: err.message } as any);
          }
        });
    } catch (err: any) {
        self.postMessage({ type: 'ERROR', error: err.message } as any);
    }
  } // ends if (type === 'INIT' && world)
}; // ends self.onmessage
