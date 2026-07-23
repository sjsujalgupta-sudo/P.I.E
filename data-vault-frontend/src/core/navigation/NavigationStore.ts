import { create } from 'zustand';

export type NavigationLevel = 'overview' | 'domain' | 'district' | 'place' | 'trace';

export interface NavigationNode {
  id: string;
  name: string;
  level: NavigationLevel;
}

export interface NavigationState {
  level: NavigationLevel;
  currentNodeId: string | null;
  path: NavigationNode[]; // Breadcrumbs: e.g. [{id: 'root', name: 'World', level: 'overview'}, {id: 'domain-ai', name: 'AI', level: 'domain'}]
  
  setLevel: (level: NavigationLevel) => void;
  setCurrentNodeId: (id: string | null) => void;
  setPath: (path: NavigationNode[]) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  level: 'overview',
  currentNodeId: null,
  path: [{ id: 'root', name: 'World', level: 'overview' }],
  
  setLevel: (level) => set({ level }),
  setCurrentNodeId: (id) => set({ currentNodeId: id }),
  setPath: (path) => set({ path }),
}));
