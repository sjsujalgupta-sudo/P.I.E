/*
 * 🎭 Analogy: This is the "One-Way Street Planner" — it takes browsing
 *    sessions and builds a map of roads (links) that only go forward.
 *    No U-turns allowed, because Sankey diagrams can't handle loops.
 * ✅ Safe to change:
 *    1. Adjust the DFS cycle-detection depth limit for performance
 *    2. Change the deduplication logic to allow revisits within a session
 *    3. Add a minimum link weight threshold (e.g., skip links with weight < 3)
 * ❌ Never touch: The canReach() DFS function — this is the cycle guard.
 *    Removing it causes "circular link" crashes in d3-sankey.
 */

import type { Session } from "./buildSessions";
import { SITE_META, CATEGORY_COLORS, type SiteCategory } from "../../data/mockBrowsingEvents";

export interface SankeyNode {
    id:       string;   // === label
    label:    string;
    category: SiteCategory;
}

export interface SankeyLink {
    source: string;
    target: string;
    value:  number;
}

export interface SankeyData {
    nodes: SankeyNode[];
    links: SankeyLink[];
}

export { CATEGORY_COLORS };

// ─── DFS reachability ─────────────────────────────────────────────────────────

function canReach(
    from: string,
    to: string,
    adj: Map<string, Set<string>>,
    visited = new Set<string>()
): boolean {
    if (from === to) return true;
    if (visited.has(from)) return false;
    visited.add(from);
    for (const neighbor of (adj.get(from) ?? [])) {
        if (canReach(neighbor, to, adj, visited)) return true;
    }
    return false;
}

// ─── Main builder ─────────────────────────────────────────────────────────────

export function buildSankeyData(sessions: Session[]): SankeyData {
    // Step 1: collect candidate links from all sessions
    const candidateMap = new Map<string, number>();

    for (const session of sessions) {
        // Deduplicate labels within session (first-occurrence order)
        const seen    = new Set<string>();
        const deduped: string[] = [];
        for (const ev of session.events) {
            if (!seen.has(ev.label)) {
                seen.add(ev.label);
                deduped.push(ev.label);
            }
        }

        // Consecutive pairs → candidate links
        for (let i = 0; i < deduped.length - 1; i++) {
            const src = deduped[i];
            const tgt = deduped[i + 1];
            if (src === tgt) continue;
            const key = `${src}→${tgt}`;
            candidateMap.set(key, (candidateMap.get(key) ?? 0) + 1);
        }
    }

    if (candidateMap.size === 0) return { nodes: [], links: [] };

    // Step 2: accept links only if they don't create a cycle (DFS check)
    const adj  = new Map<string, Set<string>>();
    const safe = new Map<string, number>();

    for (const [key, value] of candidateMap) {
        const [src, tgt] = key.split("→");
        if (src === tgt) continue;

        // Would adding src→tgt create a cycle? i.e. can tgt already reach src?
        if (canReach(tgt, src, adj)) {
            // Skip — would create a cycle
            continue;
        }

        // Accept
        if (!adj.has(src)) adj.set(src, new Set());
        adj.get(src)!.add(tgt);
        safe.set(key, value);
    }

    const links: SankeyLink[] = Array.from(safe.entries()).map(([key, value]) => {
        const [source, target] = key.split("→");
        return { source, target, value };
    });

    if (links.length === 0) return { nodes: [], links: [] };

    // Step 3: build nodes ONLY from link endpoints (id === label)
    const nodeSet = new Set<string>();
    links.forEach((l) => { nodeSet.add(l.source); nodeSet.add(l.target); });

    const nodes: SankeyNode[] = Array.from(nodeSet).map((label) => {
        const meta = SITE_META.get(label);
        return { id: label, label, category: meta?.category ?? "dev" };
    });

    return { nodes, links };
}
