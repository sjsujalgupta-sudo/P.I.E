/*
 * 🎭 Analogy: This file is the "Fake Internet" — it provides
 *   pretend website visit data so the Overview network graph
 *   has something to display before real data arrives.
 * ✅ Safe to change:
 *    1. The nodes array — add/remove domains or change their frequency
 *    2. The links array — add/remove connections between domains
 *    3. The CATEGORY_COLORS map — change the color for any category
 * ❌ Never touch: The MOCK_GRAPH_DATA export name and GraphNode/GraphLink
 *   types — NetworkGraph imports these exact names.
 */

/**
 * Mock network graph data for the Overview mode.
 * Each node represents a domain the user has visited.
 * Links represent co-occurrence / navigation flow between domains.
 */

export type NodeCategory = "social" | "dev" | "search" | "productivity" | "content";

export interface GraphNode {
    id: string;
    label: string;
    category: NodeCategory;
    /** Visit frequency — drives node size */
    frequency: number;
    url?: string;
}

export interface GraphLink {
    source: string;
    target: string;
    /** 1–10 — drives line thickness + opacity */
    weight: number;
}

export interface GraphData {
    nodes: GraphNode[];
    links: GraphLink[];
}

// ─── Category → color map ─────────────────────────────────────────────────────
// Single source of truth. Import this wherever you need category colors.

export const CATEGORY_COLORS: Record<NodeCategory, string> = {
    social:       "#a78bfa", // accent violet
    dev:          "#34d399", // emerald
    search:       "#22d3ee", // cyan
    productivity: "#f59e0b", // amber
    content:      "#f472b6", // pink
};

// ─── Mock data ────────────────────────────────────────────────────────────────

export const MOCK_GRAPH_DATA: GraphData = {
    nodes: [
        { id: "youtube",      label: "YouTube",      category: "social",       frequency: 95 },
        { id: "reddit",       label: "Reddit",       category: "social",       frequency: 78 },
        { id: "twitter",      label: "Twitter / X",  category: "social",       frequency: 55 },
        { id: "github",       label: "GitHub",       category: "dev",          frequency: 88 },
        { id: "stackoverflow", label: "Stack Overflow", category: "dev",       frequency: 62 },
        { id: "npm",          label: "npm",          category: "dev",          frequency: 40 },
        { id: "google",       label: "Google",       category: "search",       frequency: 100 },
        { id: "bing",         label: "Bing",         category: "search",       frequency: 22 },
        { id: "notion",       label: "Notion",       category: "productivity", frequency: 70 },
        { id: "linear",       label: "Linear",       category: "productivity", frequency: 45 },
    ],
    links: [
        { source: "google",       target: "youtube",       weight: 9 },
        { source: "google",       target: "github",        weight: 8 },
        { source: "google",       target: "stackoverflow", weight: 7 },
        { source: "youtube",      target: "reddit",        weight: 6 },
        { source: "reddit",       target: "twitter",       weight: 5 },
        { source: "github",       target: "stackoverflow", weight: 8 },
        { source: "github",       target: "npm",           weight: 7 },
        { source: "stackoverflow", target: "npm",          weight: 4 },
        { source: "notion",       target: "linear",        weight: 6 },
        { source: "notion",       target: "github",        weight: 5 },
        { source: "twitter",      target: "youtube",       weight: 4 },
        { source: "bing",         target: "google",        weight: 3 },
        { source: "linear",       target: "github",        weight: 5 },
    ],
};

export function replaceGraphData(data: GraphData) {
    MOCK_GRAPH_DATA.nodes.splice(0, MOCK_GRAPH_DATA.nodes.length, ...data.nodes);
    MOCK_GRAPH_DATA.links.splice(0, MOCK_GRAPH_DATA.links.length, ...data.links);
}
