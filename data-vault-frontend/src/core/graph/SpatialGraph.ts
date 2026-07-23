// Bounding Box for the graph
export interface BoundingBox {
  minX: number;
  minY: number;
  minZ: number;
  maxX: number;
  maxY: number;
  maxZ: number;
}

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export type NodeClass = 'Landmark' | 'Hub' | 'Important' | 'Normal' | 'Background';

export interface SpatialNode {
  id: string;
  position: Vector3;
  velocity?: Vector3;
  clusterId?: string;
  visualRadius: number;
  lodLevel: number; // 0 = far, 1 = med, 2 = near
  isPinned: boolean;
  opacity: number;
  heat: number;
  nodeClass: NodeClass;
  importance: number;
  
  // For renderer coloring
  colorHex?: string;
  group?: string; 
  title?: string;
}

export interface SpatialEdge {
  source: string;
  target: string;
  opacity: number;
  strength: number;
  isVisible: boolean; // Managed by LOD/Interaction
}

export interface SpatialGraph {
  nodes: SpatialNode[];
  edges: SpatialEdge[];
  bounds: BoundingBox;
  version: number;
}
