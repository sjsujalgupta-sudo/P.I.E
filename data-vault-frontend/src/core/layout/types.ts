import { GraphNode, GraphEdge } from '../graph/types';

export interface SpatialNode extends GraphNode {
  x: number;
  y: number;
  z: number;
  vx?: number;
  vy?: number;
  vz?: number;
}

export interface SpatialEdge extends GraphEdge {
  sourceNode: SpatialNode;
  targetNode: SpatialNode;
}

export interface SpatialGraph {
  nodes: SpatialNode[];
  edges: SpatialEdge[];
}

export interface LayoutWorkerMessage {
  type: 'INIT' | 'UPDATE' | 'TICK' | 'END';
  nodes?: GraphNode[];
  edges?: GraphEdge[];
  spatialNodes?: SpatialNode[];
  spatialEdges?: SpatialEdge[];
}
