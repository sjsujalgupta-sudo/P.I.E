/*
 * 🎭 Analogy: This is the "Roundabout Map" — unlike the one-way Sankey
 *    builder, this one keeps ALL transitions including loops and revisits.
 *    Google → GitHub → Google is valid here and shows as a cycle.
 * ✅ Safe to change:
 *    1. Change the self-loop filter (src === tgt) to allow self-loops
 *    2. Add a minimum count threshold to hide rare transitions
 *    3. Add a color field to LoopLink based on source category
 * ❌ Never touch: The LoopNode and LoopLink type shapes — LoopView.tsx
 *    and the panel components destructure these exact field names.
 */

import type { Session } from "./buildSessions";
import { SITE_META, CATEGORY_COLORS, type SiteCategory } from "../../data/mockBrowsingEvents";

export interface LoopNode {
    id:       string;
    label:    string;
    category: SiteCategory;
    visits:   number;
}

export interface LoopLink {
    source: string;
    target: string;
    count:  number;
}

export interface LoopGraphData {
    nodes: LoopNode[];
    links: LoopLink[];
}

export { CATEGORY_COLORS };

export function buildLoopGraphData(sessions: Session[]): LoopGraphData {
    const visitMap = new Map<string, number>();
    const linkMap  = new Map<string, number>();

    for (const session of sessions) {
        for (const ev of session.events) {
            visitMap.set(ev.label, (visitMap.get(ev.label) ?? 0) + 1);
        }
        for (let i = 0; i < session.events.length - 1; i++) {
            const src = session.events[i].label;
            const tgt = session.events[i + 1].label;
            if (src === tgt) continue; // skip self-loops only
            const key = `${src}→${tgt}`;
            linkMap.set(key, (linkMap.get(key) ?? 0) + 1);
        }
    }

    const links: LoopLink[] = Array.from(linkMap.entries()).map(([key, count]) => {
        const [source, target] = key.split("→");
        return { source, target, count };
    });

    if (links.length === 0) return { nodes: [], links: [] };

    const nodeSet = new Set<string>();
    links.forEach((l) => { nodeSet.add(l.source); nodeSet.add(l.target); });

    const nodes: LoopNode[] = Array.from(nodeSet).map((label) => {
        const meta = SITE_META.get(label);
        return {
            id:       label,
            label,
            category: meta?.category ?? "dev",
            visits:   visitMap.get(label) ?? 1,
        };
    });

    return { nodes, links };
}
