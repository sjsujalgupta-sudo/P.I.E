import { GraphNode, GraphEdge } from '../graph/types';
import { SpatialGraph } from '../graph/SpatialGraph';

export interface LayoutStrategy {
  init(nodes: GraphNode[], edges: GraphEdge[]): void;
  setOnUpdate(callback: (graph: SpatialGraph) => void): void;
  terminate(): void;
}
