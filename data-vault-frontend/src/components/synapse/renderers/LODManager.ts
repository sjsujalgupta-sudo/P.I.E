import { SpatialGraph } from '../../../core/graph/SpatialGraph';
import { InteractionState } from '../interactions/InteractionState';
import { NavigationState } from '../../../core/navigation/NavigationStore';

export class LODManager {
  /**
   * Updates opacity and edge visibility strictly based on Navigation Level and Interaction state.
   * Distance-based culling is removed in favor of semantic zooming.
   */
  public static updateLOD(
    graph: SpatialGraph, 
    navigation: NavigationState, 
    interaction: InteractionState
  ): SpatialGraph {
    
    // Determine related nodes if there is a hover
    const activeNodeId = interaction.hoveredNodeId;
    const relatedNodes = new Set<string>();
    if (activeNodeId) {
      relatedNodes.add(activeNodeId);
      for (const edge of graph.edges) {
        if (edge.source === activeNodeId) relatedNodes.add(edge.target);
        if (edge.target === activeNodeId) relatedNodes.add(edge.source);
      }
    }

    // Pass 1: Nodes
    for (const node of graph.nodes) {
      
      // LOD Level based on node class vs navigation level
      // level: 'overview' | 'domain' | 'district' | 'place' | 'trace'
      if (navigation.level === 'overview') {
        if (node.nodeClass === 'Hub' || node.nodeClass === 'Landmark') node.lodLevel = 2;
        else node.lodLevel = 1; // Show as faint dust instead of hiding completely
      } else if (navigation.level === 'domain') {
        if (node.nodeClass === 'Hub' || node.nodeClass === 'Landmark' || node.nodeClass === 'Important') node.lodLevel = 2;
        else node.lodLevel = 1;
      } else if (navigation.level === 'district') {
        if (node.nodeClass !== 'Background') node.lodLevel = 2;
        else node.lodLevel = 1;
      } else {
        node.lodLevel = 2; // In place or trace, show everything locally
      }

      // Base Opacity by NodeClass
      let baseOpacity = 1.0;
      if (node.nodeClass === 'Background') baseOpacity = 0.3;
      if (node.nodeClass === 'Normal') baseOpacity = 0.6;
      if (node.nodeClass === 'Important') baseOpacity = 0.8;
      if (node.nodeClass === 'Hub') baseOpacity = 1.0;
      if (node.nodeClass === 'Landmark') baseOpacity = 1.0;

      // Interaction Overrides (Hover is temporary preview)
      if (activeNodeId) {
        if (relatedNodes.has(node.id)) {
          // Highlight active and neighbors
          node.opacity = 1.0;
          node.lodLevel = 2; // Force detail for neighborhood preview
        } else {
          // Fade unrelated deeply
          node.opacity = baseOpacity * 0.05; 
        }
      } else {
        // Navigation-based visibility
        if (node.lodLevel === 0) {
          node.opacity = 0; // Completely hidden
        } else if (node.lodLevel === 1) {
          node.opacity = baseOpacity * 0.2;
        } else {
          node.opacity = baseOpacity;
        }
      }
    }

    // Pass 2: Edges (Highways vs Local vs Footpaths)
    for (const edge of graph.edges) {
      const sourceNode = graph.nodes.find(n => n.id === edge.source);
      const targetNode = graph.nodes.find(n => n.id === edge.target);
      if (!sourceNode || !targetNode) continue;
      
      // Determine road type based on endpoints (could be explicitly typed in graph, but we infer for now)
      let roadType = 'footpath';
      if ((sourceNode.nodeClass === 'Hub' || sourceNode.nodeClass === 'Landmark') && 
          (targetNode.nodeClass === 'Hub' || targetNode.nodeClass === 'Landmark')) {
        if (sourceNode.group !== targetNode.group) roadType = 'highway';
        else roadType = 'district_road';
      } else if (sourceNode.nodeClass === 'Important' || targetNode.nodeClass === 'Important') {
        roadType = 'district_road';
      }

      if (activeNodeId) {
        // Only show edges connected to the active node in preview mode
        if (edge.source === activeNodeId || edge.target === activeNodeId) {
          edge.isVisible = true;
          edge.opacity = 1.0;
        } else {
          edge.isVisible = false;
        }
      } else {
        // Navigation based
        if (navigation.level === 'overview') {
          // Highways and structural intra-domain roads
          edge.isVisible = roadType === 'highway' || roadType === 'district_road';
          edge.opacity = roadType === 'highway' ? 0.3 : 0.1;
        } else if (navigation.level === 'domain') {
          edge.isVisible = roadType === 'highway' || roadType === 'district_road';
          edge.opacity = roadType === 'highway' ? 0.1 : 0.4;
        } else if (navigation.level === 'district') {
          edge.isVisible = roadType === 'district_road' || (roadType === 'footpath' && edge.strength > 0.5);
          edge.opacity = 0.5;
        } else {
          // Place / Trace level
          edge.isVisible = true;
          edge.opacity = 0.6;
        }
      }
    }
    
    return graph;
  }
}
