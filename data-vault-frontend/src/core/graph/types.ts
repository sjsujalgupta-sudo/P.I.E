export interface GraphNode {
  id: string; // Maps to MemoryObject.id
  type: string; // e.g. MemoryType
  group: string; // for clustering/coloring (e.g., category or first tag)
  importance: number; // to calculate node radius/mass
  title?: string;
}

export interface GraphEdge {
  id: string;
  source: string; // GraphNode.id
  target: string; // GraphNode.id
  weight: number;
  type: string; // RelationType
}
