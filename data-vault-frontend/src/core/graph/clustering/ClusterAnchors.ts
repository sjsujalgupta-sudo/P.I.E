import { Vector3 } from '../SpatialGraph';

export class ClusterAnchors {
  // Deterministic positions to build user spatial memory
  // Scaled by ~1.2 to push clusters apart for better "islands" separation
  private static predefinedAnchors: Record<string, Vector3> = {
    'Programming': { x: -120, y: 120, z: -60 },
    'AI': { x: 0, y: 180, z: 0 },
    'Entertainment': { x: 180, y: 60, z: 60 },
    'Finance': { x: -180, y: -60, z: -25 },
    'Science': { x: 120, y: -120, z: -60 },
    'Travel': { x: 60, y: -180, z: 96 },
    'Art': { x: -60, y: 0, z: 120 },
    'default': { x: 0, y: 0, z: 0 },
  };

  private static dynamicAnchors: Record<string, Vector3> = {};
  private static nextRadius = 200;
  private static nextAngle = 0;

  public static getAnchor(clusterId: string): Vector3 {
    if (this.predefinedAnchors[clusterId]) {
      return this.predefinedAnchors[clusterId];
    }
    
    if (this.dynamicAnchors[clusterId]) {
      return this.dynamicAnchors[clusterId];
    }

    // Generate deterministic fallback position in a spiral
    const x = Math.cos(this.nextAngle) * this.nextRadius;
    const y = Math.sin(this.nextAngle) * this.nextRadius;
    const z = (Math.random() - 0.5) * 50;

    const newAnchor = { x, y, z };
    this.dynamicAnchors[clusterId] = newAnchor;

    this.nextAngle += Math.PI / 4;
    if (this.nextAngle >= Math.PI * 2) {
      this.nextAngle = 0;
      this.nextRadius += 100;
    }

    return newAnchor;
  }
}
