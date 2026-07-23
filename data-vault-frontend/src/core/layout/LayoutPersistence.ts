import { Vector3 } from '../graph/SpatialGraph';

interface PersistedLayoutData {
  pinnedPositions: Record<string, Vector3>;
  collapsedClusters: string[];
  cameraPosition: Vector3;
}

export class LayoutPersistence {
  private static readonly STORAGE_KEY = 'synapse_layout_persistence';
  
  public static load(): PersistedLayoutData {
    if (typeof window === 'undefined') return this.getDefault();
    
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn("Failed to load layout persistence", e);
    }
    return this.getDefault();
  }

  public static save(data: PersistedLayoutData) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn("Failed to save layout persistence", e);
    }
  }

  private static getDefault(): PersistedLayoutData {
    return {
      pinnedPositions: {},
      collapsedClusters: [],
      cameraPosition: { x: 0, y: 0, z: 150 }
    };
  }
}
