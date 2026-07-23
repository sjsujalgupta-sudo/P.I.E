import { GraphNode, GraphEdge } from '../graph/types';
import { 
    WorldGraph, Domain, District, SemanticAnchor, 
    TraceNode, Highway, LocalRoad, WorldMetadata 
} from './Contracts';

export class WorldBuilder {
    
    public static build(nodes: GraphNode[], edges: GraphEdge[]): WorldGraph {
        const domainsMap = new Map<string, Domain>();
        const districtsMap = new Map<string, District>();
        const anchorsMap = new Map<string, SemanticAnchor>();
        
        const anchors: SemanticAnchor[] = [];
        const traces: TraceNode[] = [];
        
        // 1. First Pass: Create Domains and Districts
        nodes.forEach(node => {
            const domainName = node.group || 'Unknown';
            let domain = domainsMap.get(domainName);
            
            if (!domain) {
                domain = {
                    id: `domain-${domainName}`,
                    name: domainName,
                    color: this.getColorForDomain(domainName),
                    districts: []
                };
                domainsMap.set(domainName, domain);
            }
            
            // District by type (e.g. Document, Website, Conversation)
            const districtName = node.type || 'General';
            const districtId = `district-${domainName}-${districtName}`;
            let district = districtsMap.get(districtId);
            
            if (!district) {
                district = {
                    id: districtId,
                    name: districtName,
                    domainId: domain.id,
                    anchors: []
                };
                districtsMap.set(districtId, district);
                domain.districts.push(district);
            }
        });
        
        // 2. Second Pass: Assign SemanticAnchors vs Traces
        // We'll define anchors as top N nodes by importance per district, or simply importance > threshold.
        // For a more structured world, we'll sort nodes by importance and take the top 10% or just those > 0.8.
        
        // Group nodes by district first to find local peaks
        const nodesByDistrict = new Map<string, GraphNode[]>();
        nodes.forEach(node => {
            const districtId = `district-${node.group || 'Unknown'}-${node.type || 'General'}`;
            if (!nodesByDistrict.has(districtId)) {
                nodesByDistrict.set(districtId, []);
            }
            nodesByDistrict.get(districtId)!.push(node);
        });
        
        nodesByDistrict.forEach((districtNodes, districtId) => {
            const district = districtsMap.get(districtId)!;
            // Sort by importance descending
            districtNodes.sort((a, b) => b.importance - a.importance);
            
            // Max 3 anchors per district, minimum 1 if nodes exist.
            const numAnchors = Math.max(1, Math.min(3, Math.ceil(districtNodes.length * 0.05)));
            
            districtNodes.forEach((node, index) => {
                if (index < numAnchors) {
                    const anchor: SemanticAnchor = {
                        id: node.id,
                        name: node.title || node.id,
                        districtId: district.id,
                        domainId: district.domainId,
                        sourceNode: node,
                        traces: []
                    };
                    anchorsMap.set(node.id, anchor);
                    anchors.push(anchor);
                    district.anchors.push(anchor);
                } else {
                    // It's a Trace. 
                    // Assign to the nearest/most important anchor in this district.
                    // For now, just attach to the primary anchor of the district [0].
                    const parentAnchor = district.anchors[0]; // Guaranteed to exist because we do anchors first
                    const trace: TraceNode = {
                        id: node.id,
                        name: node.title || node.id,
                        districtId: district.id,
                        domainId: district.domainId,
                        anchorId: parentAnchor.id,
                        sourceNode: node
                    };
                    traces.push(trace);
                    parentAnchor.traces.push(trace);
                }
            });
        });
        
        // 3. Third Pass: Roads and Highways
        const highways: Highway[] = [];
        const localRoads: LocalRoad[] = [];
        
        const nodeToDomainMap = new Map<string, string>();
        nodes.forEach(n => nodeToDomainMap.set(n.id, `domain-${n.group || 'Unknown'}`));
        
        // Aggregate highway strengths
        const highwayMap = new Map<string, Highway>();
        
        edges.forEach(edge => {
            const sourceDomain = nodeToDomainMap.get(edge.source);
            const targetDomain = nodeToDomainMap.get(edge.target);
            
            if (!sourceDomain || !targetDomain) return; // shouldn't happen
            
            if (sourceDomain !== targetDomain) {
                // Highway!
                // To prevent rendering 1000 highways, we aggregate them between domains
                const highwayId = [sourceDomain, targetDomain].sort().join('::');
                if (!highwayMap.has(highwayId)) {
                    highwayMap.set(highwayId, {
                        id: highwayId,
                        sourceDomainId: sourceDomain,
                        targetDomainId: targetDomain,
                        strength: edge.weight
                    });
                } else {
                    highwayMap.get(highwayId)!.strength += edge.weight;
                }
            } else {
                // Local Road!
                localRoads.push({
                    id: edge.id,
                    sourceNodeId: edge.source,
                    targetNodeId: edge.target,
                    strength: edge.weight,
                    sourceEdge: edge
                });
            }
        });
        
        highways.push(...highwayMap.values());
        
        return {
            domains: Array.from(domainsMap.values()),
            districts: Array.from(districtsMap.values()),
            anchors,
            traces,
            highways,
            localRoads,
            metadata: {
                totalDomains: domainsMap.size,
                totalDistricts: districtsMap.size,
                totalAnchors: anchors.length,
                totalTraces: traces.length,
                createdAt: Date.now()
            }
        };
    }
    
    // Very simple determinism for domain colors
    private static getColorForDomain(name: string): string {
        const colors = [
            '#ff4d4d', '#4dff4d', '#4d4dff', '#ffff4d', 
            '#ff4dff', '#4dffff', '#ff9933', '#9933ff'
        ];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    }
}
