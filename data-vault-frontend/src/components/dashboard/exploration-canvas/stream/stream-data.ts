/*
 * 🎭 Analogy: This is the "River Source" — it aggregates the master event
 *    log into time-bucketed category totals that feed the flowing streamgraph.
 *    Think of it as measuring how much water (attention) flows into each
 *    river channel (category) at each hour or day.
 * ✅ Safe to change:
 *    1. Add a new category to CATEGORIES array (must also add to CATEGORY_LABELS)
 *    2. Edit CATEGORY_LABELS to rename "dev" to "Engineering" for display
 *    3. Edit the insight text strings in buildStreamInsights()
 * ❌ Never touch: The StreamPoint type's index signature [key: string]: unknown
 *    — removing it causes TypeScript errors when indexing by SiteCategory.
 */

import { ALL_EVENTS, CATEGORY_COLORS, type SiteCategory } from "../data/mockBrowsingEvents";

export type Granularity = "hourly" | "daily";

export const CATEGORIES: SiteCategory[] = ["search", "social", "dev", "productivity", "content"];

export type { SiteCategory };

export const CATEGORY_LABELS: Record<SiteCategory, string> = {
    search:       "Search",
    social:       "Social",
    dev:          "Development",
    productivity: "Productivity",
    content:      "Content",
};

export { CATEGORY_COLORS };

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StreamPoint {
    key:      string;
    keyNum:   number;
    search:       number;
    social:       number;
    dev:          number;
    productivity: number;
    content:      number;
    total:        number;
    topNodes: Partial<Record<SiteCategory, string[]>>;
    [key: string]: unknown; // allow SiteCategory indexing
}

// ─── Builders ─────────────────────────────────────────────────────────────────

const DAY_NAMES = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"] as const;

export function buildStreamData(
    granularity: Granularity,
    selectedNodeId: string | null
): StreamPoint[] {
    // Filter events: if a node is selected, only include events from that node's
    // category (so the stream emphasises that category's rhythm)
    const nodeCategory = selectedNodeId
        ? ALL_EVENTS.find((e) => e.label === selectedNodeId)?.category ?? null
        : null;

    const events = ALL_EVENTS; // always use full dataset for stream shape

    if (granularity === "hourly") {
        // Aggregate by hour 0–23
        const buckets = new Map<number, Map<SiteCategory, { mins: number; nodes: Map<string, number> }>>();
        for (let h = 0; h < 24; h++) buckets.set(h, new Map());

        for (const ev of events) {
            const h = ev.timestamp.getHours();
            const bucket = buckets.get(h)!;
            if (!bucket.has(ev.category)) bucket.set(ev.category, { mins: 0, nodes: new Map() });
            const cat = bucket.get(ev.category)!;
            cat.mins += ev.duration;
            cat.nodes.set(ev.label, (cat.nodes.get(ev.label) ?? 0) + ev.duration);
        }

        return Array.from(buckets.entries()).map(([h, bucket]) => {
            const point: StreamPoint = {
                key: h === 0 ? "12AM" : h === 12 ? "12PM" : h < 12 ? `${h}AM` : `${h - 12}PM`,
                keyNum: h,
                search: 0, social: 0, dev: 0, productivity: 0, content: 0,
                total: 0, topNodes: {},
            };
            for (const cat of CATEGORIES) {
                const data = bucket.get(cat);
                if (data) {
                    point[cat] = data.mins;
                    point.total += data.mins;
                    point.topNodes[cat] = [...data.nodes.entries()]
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 3)
                        .map(([label]) => label);
                }
            }
            return point;
        });
    } else {
        // Aggregate by day Mon–Sun
        const buckets = new Map<number, Map<SiteCategory, { mins: number; nodes: Map<string, number> }>>();
        for (let d = 0; d < 7; d++) buckets.set(d, new Map());

        for (const ev of events) {
            const dow = ev.timestamp.getDay(); // 0=Sun
            const di  = dow === 0 ? 6 : dow - 1; // Mon=0
            const bucket = buckets.get(di)!;
            if (!bucket.has(ev.category)) bucket.set(ev.category, { mins: 0, nodes: new Map() });
            const cat = bucket.get(ev.category)!;
            cat.mins += ev.duration;
            cat.nodes.set(ev.label, (cat.nodes.get(ev.label) ?? 0) + ev.duration);
        }

        return Array.from(buckets.entries()).map(([di, bucket]) => {
            const point: StreamPoint = {
                key: DAY_NAMES[di],
                keyNum: di,
                search: 0, social: 0, dev: 0, productivity: 0, content: 0,
                total: 0, topNodes: {},
            };
            for (const cat of CATEGORIES) {
                const data = bucket.get(cat);
                if (data) {
                    point[cat] = data.mins;
                    point.total += data.mins;
                    point.topNodes[cat] = [...data.nodes.entries()]
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 3)
                        .map(([label]) => label);
                }
            }
            return point;
        });
    }
}

// ─── Insight generator ────────────────────────────────────────────────────────

export interface StreamInsight {
    dominantCategory:  SiteCategory;
    peakWindow:        string;
    trendShift:        string;
    behaviorSummary:   string;
    nodeInsight:       string | null;
}

export function buildStreamInsights(
    data: StreamPoint[],
    granularity: Granularity,
    selectedNodeId: string | null
): StreamInsight {
    // Dominant category overall
    const catTotals = new Map<SiteCategory, number>();
    for (const p of data) {
        for (const cat of CATEGORIES) {
            catTotals.set(cat, (catTotals.get(cat) ?? 0) + p[cat]);
        }
    }
    const dominantCategory = [...catTotals.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "dev";

    // Peak window
    const peakPoint = data.reduce((a, b) => b.total > a.total ? b : a, data[0]);
    const peakWindow = peakPoint?.key ?? "—";

    // Trend shift: compare first half vs second half
    const mid = Math.floor(data.length / 2);
    const firstHalf  = data.slice(0, mid);
    const secondHalf = data.slice(mid);
    const firstDom  = dominantInHalf(firstHalf);
    const secondDom = dominantInHalf(secondHalf);
    const trendShift = firstDom !== secondDom
        ? `Shifts from ${CATEGORY_LABELS[firstDom]} to ${CATEGORY_LABELS[secondDom]}`
        : `Consistently ${CATEGORY_LABELS[firstDom]}`;

    // Behavior summary
    const summaries: Record<SiteCategory, string> = {
        dev:          granularity === "hourly"
            ? "Development activity peaks in the afternoon"
            : "Development sessions dominate weekday patterns",
        social:       granularity === "hourly"
            ? "Social browsing spikes in the evening"
            : "Social activity increases on weekends",
        search:       "Research and discovery drive session starts",
        productivity: "Productivity tools anchor focused work blocks",
        content:      "Content consumption rises during off-hours",
    };
    const behaviorSummary = summaries[dominantCategory];

    // Node-specific insight
    let nodeInsight: string | null = null;
    if (selectedNodeId) {
        const nodeEvs = ALL_EVENTS.filter((e) => e.label === selectedNodeId);
        const hourMap = new Map<number, number>();
        for (const e of nodeEvs) hourMap.set(e.timestamp.getHours(), (hourMap.get(e.timestamp.getHours()) ?? 0) + 1);
        const peakH = [...hourMap.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
        if (peakH !== undefined) {
            const period = peakH < 12 ? "mornings" : peakH < 18 ? "afternoons" : "evenings";
            const cat = nodeEvs[0]?.category ?? "dev";
            nodeInsight = `${selectedNodeId} drives ${CATEGORY_LABELS[cat]} stream during ${period}`;
        }
    }

    return { dominantCategory, peakWindow, trendShift, behaviorSummary, nodeInsight };
}

function dominantInHalf(half: StreamPoint[]): SiteCategory {
    const totals = new Map<SiteCategory, number>();
    for (const p of half) {
        for (const cat of CATEGORIES) {
            totals.set(cat, (totals.get(cat) ?? 0) + p[cat]);
        }
    }
    return [...totals.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "dev";
}
