import React, { useEffect } from 'react';
import { useNavigationStore } from '../../../core/navigation/NavigationStore';
import { NavigationController } from '../../../core/navigation/NavigationController';
import { SpatialGraph } from '../../../core/graph/SpatialGraph';

interface KeyboardControllerProps {
  graph: SpatialGraph | null;
}

export const KeyboardController: React.FC<KeyboardControllerProps> = ({ graph }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const { currentNodeId, level } = useNavigationStore.getState();

      if (e.key === 'Escape') {
        if (level === 'trace' || level === 'place') {
          // Go up a level
          const currentPath = useNavigationStore.getState().path;
          if (currentPath.length >= 2) {
             const parentId = currentPath[currentPath.length - 2].id;
             // If parent is a domain, just go to overview for now, or transition to it if possible
             if (parentId.startsWith('domain-')) {
               NavigationController.transitionToOverview();
             } else {
               NavigationController.transitionTo(parentId);
             }
          } else {
             NavigationController.transitionToOverview();
          }
        } else {
          NavigationController.transitionToOverview();
        }
        return;
      }

      if (e.key === '/' || e.key === 'f' && (e.ctrlKey || e.metaKey)) {
        // Future search
        e.preventDefault();
        console.log("Search requested");
        return;
      }

      // Arrow navigation
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        if (!graph || !currentNodeId) return;
        
        // Find connected nodes
        const edges = graph.edges.filter(e => e.source === currentNodeId || e.target === currentNodeId);
        const neighborIds = edges.map(e => e.source === currentNodeId ? e.target : e.source);
        
        if (neighborIds.length > 0) {
          // Simplistic selection: just pick the first neighbor for now or cycle through
          // A more advanced version would use screen-space direction
          const currentIndex = neighborIds.indexOf(currentNodeId);
          const nextIndex = (currentIndex + 1) % neighborIds.length;
          NavigationController.transitionTo(neighborIds[nextIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [graph]);

  return null;
};
