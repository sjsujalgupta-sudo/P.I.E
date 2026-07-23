import { GraphNode } from '../types';

export interface ClusterAssignment {
  nodeId: string;
  clusterId: string;
}

export interface ClusteringStrategy {
  cluster(nodes: GraphNode[]): Record<string, string>;
}

export class CategoryClusterStrategy implements ClusteringStrategy {
  cluster(nodes: GraphNode[]): Record<string, string> {
    const assignments: Record<string, string> = {};
    for (const node of nodes) {
      // For V1, use the group (which maps to category) as the cluster
      assignments[node.id] = node.group || 'default';
    }
    return assignments;
  }
}
