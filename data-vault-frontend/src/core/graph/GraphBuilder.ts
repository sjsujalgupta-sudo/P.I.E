import { MemoryStore } from '../memory/MemoryStore';
import { GraphNode, GraphEdge } from './types';
import { CategoryClusterStrategy } from './clustering/ClusteringStrategy';

export class GraphBuilder {
  /**
   * Deterministically converts traces from the store into agnostic graph nodes and edges.
   */
  public static build(store: MemoryStore): { nodes: GraphNode[], edges: GraphEdge[] } {
    const traces = store.getAllTraces();
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    
    // Track valid node IDs to prevent orphan edges
    const validNodeIds = new Set<string>();

    for (const trace of traces) {
      const metadata = store.getMetadata(trace.id);
      validNodeIds.add(trace.id);

      nodes.push({
        id: trace.id,
        type: trace.type,
        group: metadata && metadata.tags.length > 0 ? metadata.tags[0] : 'default',
        importance: metadata?.importance ?? 0.5,
        title: trace.title,
      });
    }

    for (const trace of traces) {
      const relations = store.getRelations(trace.id);
      for (const rel of relations) {
        // Enforce referential integrity
        if (validNodeIds.has(rel.targetId)) {
          edges.push({
            id: `${trace.id}-${rel.targetId}-${rel.type}`,
            source: trace.id,
            target: rel.targetId,
            weight: rel.weight,
            type: rel.type.toString(),
          });
        }
      }
    }

    // Apply Clustering Strategy
    const clustering = new CategoryClusterStrategy();
    const clusterAssignments = clustering.cluster(nodes);
    
    for (const node of nodes) {
      node.group = clusterAssignments[node.id] || 'default';
    }

    return { nodes, edges };
  }
}
