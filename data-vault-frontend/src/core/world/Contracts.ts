import { Vector3 } from 'three';
import { GraphNode, GraphEdge } from '../graph/types';

export interface LayoutProfile {
    density: number;        // 0-1
    symmetry: number;       // 0-1
    branching: number;      // 0-1
    clustering: number;     // 0-1
    curvature: number;      // 0-1
    openness: number;       // 0-1
    landmarkWeight: number; // 0-1
    edgeVisibility: number; // 0-1
}

export interface Domain {
    id: string;
    name: string;
    description?: string;
    layoutProfile?: LayoutProfile;
    color: string;
    position?: Vector3; // Base anchor for the domain
    districts: District[];
}

export interface District {
    id: string;
    name: string;
    domainId: string;
    layoutProfile?: LayoutProfile; // Can inherit/override domain profile
    position?: Vector3; // Relative to Domain or absolute
    anchors: SemanticAnchor[];
}

export interface SemanticAnchor {
    id: string;
    name: string;
    districtId: string;
    domainId: string;
    position?: Vector3;
    sourceNode: GraphNode; 
    traces: TraceNode[];
}

export interface TraceNode {
    id: string;
    name: string;
    anchorId: string;
    districtId: string;
    domainId: string;
    position?: Vector3;
    sourceNode: GraphNode;
}

export interface Highway {
    id: string;
    sourceDomainId: string;
    targetDomainId: string;
    strength: number;
    sourceEdge?: GraphEdge; // Optional, might be an aggregation
}

export interface LocalRoad {
    id: string;
    sourceNodeId: string;
    targetNodeId: string;
    strength: number;
    sourceEdge: GraphEdge;
}

export interface WorldMetadata {
    totalDomains: number;
    totalDistricts: number;
    totalAnchors: number;
    totalTraces: number;
    createdAt: number;
}

export interface WorldGraph {
    domains: Domain[];
    districts: District[];
    anchors: SemanticAnchor[];
    traces: TraceNode[];
    highways: Highway[];
    localRoads: LocalRoad[];
    metadata: WorldMetadata;
}
