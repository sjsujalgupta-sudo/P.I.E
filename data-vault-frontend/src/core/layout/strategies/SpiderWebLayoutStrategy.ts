import { LayoutStrategy } from '../LayoutStrategy';
import { GraphNode, GraphEdge } from '../../graph/types';
import { SpatialGraph, SpatialNode, SpatialEdge } from '../../graph/SpatialGraph';
import { WorldBuilder } from '../../world/WorldBuilder';
import { WorldStyler } from '../../world/WorldStyler';
import { WorldGraph } from '../../world/Contracts';
import * as THREE from 'three';

export class SpiderWebLayoutStrategy implements LayoutStrategy {
  private onUpdateCallback: ((graph: SpatialGraph) => void) | null = null;
  public worldGraph: WorldGraph | null = null;

  public setOnUpdate(callback: (graph: SpatialGraph) => void) {
    this.onUpdateCallback = callback;
  }

  public init(nodes: GraphNode[], edges: GraphEdge[]) {
    // 1. Build world graph to get node classes
    let world = WorldBuilder.build(nodes, edges);
    world = WorldStyler.style(world);
    this.worldGraph = world;

    const spatialNodes: SpatialNode[] = [];
    const spatialEdges: SpatialEdge[] = [];

    // Group nodes by class
    const landmarks = world.anchors.map(a => a.sourceNode);
    const clusters: typeof landmarks = []; // Clusters aren't explicitly provided, so we leave empty or populate if needed
    const tracesNodes = world.traces.map(t => t.sourceNode);

    const placeInRing = (nodeGroup: any[], radius: number, yOffset: number = 0, nodeClass: string) => {
      const count = nodeGroup.length;
      nodeGroup.forEach((n, i) => {
        const angle = (i / count) * Math.PI * 2;
        spatialNodes.push({
          id: n.id,
          group: n.group,
          nodeClass: nodeClass as any,
          position: new THREE.Vector3(
            Math.cos(angle) * radius,
            yOffset + (Math.random() * 20 - 10), // slight height variation
            Math.sin(angle) * radius
          ),
          velocity: new THREE.Vector3(0, 0, 0),
          mass: n.mass,
          isVisible: true,
          opacity: 1.0
        });
      });
    };

    // Construct the concentric spider web
    // Spider lives at 0,0,0
    placeInRing(landmarks, 80, 0, 'Landmark');
    placeInRing(clusters, 180, -20, 'Cluster');
    
    // Distribute traces across multiple outer rings
    const tracesRing1 = tracesNodes.slice(0, Math.floor(tracesNodes.length / 3));
    const tracesRing2 = tracesNodes.slice(Math.floor(tracesNodes.length / 3), Math.floor(tracesNodes.length * 2 / 3));
    const tracesRing3 = tracesNodes.slice(Math.floor(tracesNodes.length * 2 / 3));
    
    placeInRing(tracesRing1, 300, -40, 'Trace');
    placeInRing(tracesRing2, 450, -60, 'Trace');
    placeInRing(tracesRing3, 600, -80, 'Trace');

    // Map edges
    world.localRoads.forEach(e => {
      spatialEdges.push({
        source: e.sourceNodeId,
        target: e.targetNodeId,
        weight: e.strength,
        isVisible: true,
        opacity: 0.6
      });
    });

    if (this.onUpdateCallback) {
      this.onUpdateCallback({
        nodes: spatialNodes,
        edges: spatialEdges,
        bounds: { minX: -600, minY: -100, minZ: -600, maxX: 600, maxY: 100, maxZ: 600 },
        version: Date.now()
      });
    }
  }

  public terminate() {
    // No worker to terminate
  }
}
