/*
 * 🎭 Analogy: This is the "Sankey Kitchen Prep" — it holds the static
 *    node catalogue (GitHub, YouTube, etc.) and the getConnectedIds helper.
 *    The actual links are built dynamically in SankeyFlow.tsx.
 * ✅ Safe to change:
 *    1. Add a new node to SANKEY_NODES (give it id, label, category)
 *    2. Edit a node's category to change its color in the Sankey
 *    3. Change MOCK_SANKEY_DATA.links to pre-populate static links
 * ❌ Never touch: The SANKEY_NODES array order or the getConnectedIds
 *    function signature — SankeyFlow and the panel use these exact exports.
 */

import { CATEGORY_COLORS } from "../data/session-data";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SankeyRawNode {
    id: string;
    label: string;
    category: "search" | "social" | "dev" | "productivity" | "content";
}

export interface SankeyRawLink {
    source: string;
    target: string;
    value: number;
    timestamp?: Date;
}

export interface SankeyRawData {
    nodes: SankeyRawNode[];
    links: SankeyRawLink[];
}

// ─── Category colors ──────────────────────────────────────────────────────────

export const SANKEY_CATEGORY_COLORS = CATEGORY_COLORS;

// ─── Static node catalogue ────────────────────────────────────────────────────
// Used by SankeyFlow to enrich label→metadata lookups.
// The actual rendered nodes are always derived from link endpoints.

export const SANKEY_NODES: SankeyRawNode[] = [
    { id: "google",        label: "Google",         category: "search"       },
    { id: "bing",          label: "Bing",           category: "search"       },
    { id: "youtube",       label: "YouTube",        category: "social"       },
    { id: "reddit",        label: "Reddit",         category: "social"       },
    { id: "twitter",       label: "Twitter / X",    category: "social"       },
    { id: "github",        label: "GitHub",         category: "dev"          },
    { id: "stackoverflow", label: "Stack Overflow", category: "dev"          },
    { id: "npm",           label: "npm",            category: "dev"          },
    { id: "notion",        label: "Notion",         category: "productivity" },
    { id: "linear",        label: "Linear",         category: "productivity" },
];

// Convenience: full SankeyRawData shape used for metadata lookups only
export const MOCK_SANKEY_DATA: SankeyRawData = {
    nodes: SANKEY_NODES,
    links: [], // links are built dynamically in SankeyFlow
};

// ─── Helper ───────────────────────────────────────────────────────────────────

export function getConnectedIds(nodeId: string, links: SankeyRawLink[]): Set<string> {
    const connected = new Set<string>([nodeId]);
    for (const link of links) {
        if (link.source === nodeId) connected.add(link.target);
        if (link.target === nodeId) connected.add(link.source);
    }
    return connected;
}
