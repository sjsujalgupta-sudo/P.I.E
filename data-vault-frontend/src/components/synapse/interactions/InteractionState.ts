import { create } from 'zustand';

export interface InteractionState {
  hoveredNodeId?: string;
  searchResults: string[];
  highlightedNodes: string[];
  highlightedEdges: string[];
  
  setHoveredNode: (id?: string) => void;
  clearInteraction: () => void;
}

export const useInteractionStore = create<InteractionState>((set) => ({
  searchResults: [],
  highlightedNodes: [],
  highlightedEdges: [],

  setHoveredNode: (id) => set({ hoveredNodeId: id }),
  
  clearInteraction: () => set({
    hoveredNodeId: undefined,
  })
}));
