/*
 * 🎭 Analogy: This is the "City Planner's Blueprint" — it defines the four
 *    behavioral districts (Development, Social, Productivity, Research),
 *    where each district sits on the map, and which sites orbit inside it.
 * ✅ Safe to change:
 *    1. Edit DISTRICT_POSITIONS to move a district (cx, cy are 0–1 fractions)
 *    2. Edit ORBITAL_CONFIG to change a node's angle or tier within its district
 *    3. Add a new node to a district's ORBITAL_CONFIG entry
 * ❌ Never touch: The buildStructureData() export — StructureGraph.tsx and
 *    the panel both call this. Changing its return shape breaks the map.
 */

import { ALL_EVENTS, CATEGORY_COLORS, type SiteCategory } from "../data/mockBrowsingEvents";
import { buildSessions } from "../utils/journey/buildSessions";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Cluster {
    id:       string;
    label:    string;
    category: SiteCategory;
    color:    string;       // nebula color
    nodes:    string[];     // node labels
    /** Centroid computed after layout — set by the renderer */
    cx?: number;
    cy?: number;
}

export interface StructureNode {
    id:        string;
    label:     string;
    category:  SiteCategory;
    clusterId: string;
    visits:    number;
    /** Bridge score 0–1: fraction of links going to other clusters */
    bridgeScore: number;
}

export interface StructureLink {
    source:    string;
    target:    string;
    weight:    number;
    crossCluster: boolean;
}

export interface BridgeNode {
    node:          StructureNode;
    connectedClusters: string[];
    bridgeStrength: number;
    interpretation: string;
}

export interface StructureData {
    clusters:  Cluster[];
    nodes:     StructureNode[];
    links:     StructureLink[];
    bridges:   BridgeNode[];
}

// ─── Static cluster definitions ──────────────────────────────────────────────
// Architecture note: swap `CLUSTER_DEFS` for dynamic co-occurrence clusters
// without touching the rendering system.

export const CLUSTER_DEFS: Omit<Cluster, "cx" | "cy">[] = [
    {
        id:       "dev",
        label:    "Development",
        category: "dev",
        color:    "#34d399",
        nodes:    ["GitHub", "Stack Overflow", "npm"],
    },
    {
        id:       "social",
        label:    "Social",
        category: "social",
        color:    "#a78bfa",
        nodes:    ["YouTube", "Reddit", "Twitter / X"],
    },
    {
        id:       "productivity",
        label:    "Productivity",
        category: "productivity",
        color:    "#f59e0b",
        nodes:    ["Notion", "Linear", "Figma"],
    },
    {
        id:       "research",
        label:    "Research",
        category: "search",
        color:    "#22d3ee",
        nodes:    ["Google", "Medium", "Hacker News"],
    },
];

const NODE_TO_CLUSTER = new Map<string, string>();
for (const c of CLUSTER_DEFS) {
    for (const n of c.nodes) NODE_TO_CLUSTER.set(n, c.id);
}

function getClusterDefs(): Omit<Cluster, "cx" | "cy">[] {
    const grouped = new Map<SiteCategory, Map<string, number>>();
    for (const event of ALL_EVENTS) {
        if (!grouped.has(event.category)) grouped.set(event.category, new Map());
        const nodes = grouped.get(event.category)!;
        nodes.set(event.label, (nodes.get(event.label) ?? 0) + 1);
    }

    if (grouped.size === 0) return CLUSTER_DEFS;

    const labels: Record<SiteCategory, string> = {
        dev: "Development",
        social: "Social",
        productivity: "Productivity",
        search: "Research",
        content: "Content",
    };

    return Array.from(grouped.entries()).map(([category, nodes]) => ({
        id: category === "search" ? "research" : category,
        label: labels[category],
        category,
        color: CATEGORY_COLORS[category],
        nodes: Array.from(nodes.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([label]) => label),
    }));
}

// ─── Builder ──────────────────────────────────────────────────────────────────

export function buildStructureData(): StructureData {
    const sessions = buildSessions(ALL_EVENTS);
    const clusterDefs = getClusterDefs();
    const nodeToCluster = new Map<string, string>();
    for (const cluster of clusterDefs) {
        for (const node of cluster.nodes) nodeToCluster.set(node, cluster.id);
    }

    // Visit counts
    const visitMap = new Map<string, number>();
    for (const ev of ALL_EVENTS) {
        visitMap.set(ev.label, (visitMap.get(ev.label) ?? 0) + 1);
    }

    // Link weights from session transitions
    const linkMap = new Map<string, number>();
    for (const sess of sessions) {
        for (let i = 0; i < sess.events.length - 1; i++) {
            const a = sess.events[i].label;
            const b = sess.events[i + 1].label;
            if (a === b) continue;
            // Only include nodes that belong to a cluster
            if (!nodeToCluster.has(a) || !nodeToCluster.has(b)) continue;
            const key = [a, b].sort().join("↔");
            linkMap.set(key, (linkMap.get(key) ?? 0) + 1);
        }
    }

    // Build links
    const links: StructureLink[] = Array.from(linkMap.entries()).map(([key, weight]) => {
        const [source, target] = key.split("↔");
        const srcCluster = nodeToCluster.get(source) ?? "";
        const tgtCluster = nodeToCluster.get(target) ?? "";
        return { source, target, weight, crossCluster: srcCluster !== tgtCluster };
    });

    // Bridge scoring: for each node, what fraction of its links are cross-cluster?
    const nodeLinkTotals  = new Map<string, number>();
    const nodeCrossLinks  = new Map<string, number>();
    const nodeClusterLinks = new Map<string, Set<string>>();

    for (const l of links) {
        nodeLinkTotals.set(l.source, (nodeLinkTotals.get(l.source) ?? 0) + l.weight);
        nodeLinkTotals.set(l.target, (nodeLinkTotals.get(l.target) ?? 0) + l.weight);
        if (l.crossCluster) {
            nodeCrossLinks.set(l.source, (nodeCrossLinks.get(l.source) ?? 0) + l.weight);
            nodeCrossLinks.set(l.target, (nodeCrossLinks.get(l.target) ?? 0) + l.weight);
            const srcC = nodeToCluster.get(l.source) ?? "";
            const tgtC = nodeToCluster.get(l.target) ?? "";
            if (!nodeClusterLinks.has(l.source)) nodeClusterLinks.set(l.source, new Set());
            if (!nodeClusterLinks.has(l.target)) nodeClusterLinks.set(l.target, new Set());
            nodeClusterLinks.get(l.source)!.add(tgtC);
            nodeClusterLinks.get(l.target)!.add(srcC);
        }
    }

    // Build nodes (only cluster members)
    const nodes: StructureNode[] = clusterDefs.flatMap((c) =>
        c.nodes.map((label) => {
            const total = nodeLinkTotals.get(label) ?? 1;
            const cross = nodeCrossLinks.get(label) ?? 0;
            return {
                id:          label,
                label,
                category:    c.category,
                clusterId:   c.id,
                visits:      visitMap.get(label) ?? 1,
                bridgeScore: total > 0 ? cross / total : 0,
            };
        })
    );

    // Build bridge nodes (score > 0.25)
    const bridges: BridgeNode[] = nodes
        .filter((n) => n.bridgeScore > 0.25)
        .sort((a, b) => b.bridgeScore - a.bridgeScore)
        .slice(0, 6)
        .map((n) => {
            const connectedClusters = [...(nodeClusterLinks.get(n.label) ?? [])];
            const clusterLabels = connectedClusters.map(
                (cid) => clusterDefs.find((c) => c.id === cid)?.label ?? cid
            );
            const ownCluster = clusterDefs.find((c) => c.id === n.clusterId)?.label ?? n.clusterId;
            const interpretation = clusterLabels.length > 0
                ? `${n.label} bridges ${ownCluster} ↔ ${clusterLabels.join(", ")}`
                : `${n.label} is a connector within ${ownCluster}`;
            return {
                node: n,
                connectedClusters,
                bridgeStrength: n.bridgeScore,
                interpretation,
            };
        });

    const clusters: Cluster[] = clusterDefs.map((c) => ({ ...c }));

    return { clusters, nodes, links, bridges };
}

// ─── Cluster insights ─────────────────────────────────────────────────────────

export interface ClusterInsight {
    strongestCluster:  string;
    isolatedClusters:  string[];
    dominantNode:      string;
    overlapInsight:    string;
    lateNightInsight:  string;
}

export function buildClusterInsights(data: StructureData): ClusterInsight {
    // Strongest cluster by total visits
    const clusterVisits = new Map<string, number>();
    for (const n of data.nodes) {
        clusterVisits.set(n.clusterId, (clusterVisits.get(n.clusterId) ?? 0) + n.visits);
    }
    const strongest = [...clusterVisits.entries()].sort((a, b) => b[1] - a[1])[0];
    const strongestCluster = data.clusters.find((c) => c.id === strongest?.[0])?.label ?? "Captured Activity";

    // Isolated clusters (few cross-cluster links)
    const clusterCrossLinks = new Map<string, number>();
    for (const l of data.links) {
        if (!l.crossCluster) continue;
        const srcC = data.nodes.find((n) => n.id === l.source)?.clusterId ?? "";
        const tgtC = data.nodes.find((n) => n.id === l.target)?.clusterId ?? "";
        clusterCrossLinks.set(srcC, (clusterCrossLinks.get(srcC) ?? 0) + l.weight);
        clusterCrossLinks.set(tgtC, (clusterCrossLinks.get(tgtC) ?? 0) + l.weight);
    }
    const isolatedClusters = data.clusters
        .filter((c) => (clusterCrossLinks.get(c.id) ?? 0) < 5)
        .map((c) => c.label);

    // Dominant node
    const dominantNode = [...data.nodes].sort((a, b) => b.visits - a.visits)[0]?.label ?? "Captured site";

    // Overlap insight
    const devResearchBridge = data.bridges.find(
        (b) => b.node.clusterId === "dev" && b.connectedClusters.includes("research")
    );
    const overlapInsight = devResearchBridge
        ? "Development and Research strongly overlap via search-driven discovery"
        : "Social and Development clusters show moderate cross-pollination";

    // Late night
    const lateEvs = ALL_EVENTS.filter((e) => e.timestamp.getHours() >= 21);
    const lateCatMap = new Map<SiteCategory, number>();
    for (const e of lateEvs) lateCatMap.set(e.category, (lateCatMap.get(e.category) ?? 0) + 1);
    const lateDom = [...lateCatMap.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    const lateNightInsight = lateDom === "social"
        ? "Social cluster forms isolated late-night activity patterns"
        : lateDom === "dev"
        ? "Development activity extends into late-night sessions"
        : "Content consumption dominates late-night browsing";

    return { strongestCluster, isolatedClusters, dominantNode, overlapInsight, lateNightInsight };
}

export { CATEGORY_COLORS };
