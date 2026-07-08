/*
 * 🎭 Analogy: This file is the "Fake Browser History" — it
 *   generates 3 days of realistic-looking website visits so
 *   every visualization has data to display.
 * ✅ Safe to change:
 *    1. The domain list — add/remove websites from the pool
 *    2. The hour range (8am–11pm) — extend to include late-night data
 *    3. The session gap threshold — controls how sessions are split
 * ❌ Never touch: The exported session array name — all canvas
 *   components import it as the single source of truth.
 */

/**
 * SINGLE SOURCE OF TRUTH — all time-aware browsing data.
 *
 * Generates 3 days of realistic session data (yesterday, today, tomorrow).
 * Every hour from 8am–11pm has at least one session.
 * Sessions follow realistic flow patterns with no cycles.
 *
 * ALL views (heatmap, timeline, sankey) derive from this one dataset.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type SiteCategory = "search" | "social" | "dev" | "productivity" | "content";

export interface BrowsingEvent {
    id: string;
    timestamp: Date;
    nodeId: string;    // stable id for Sankey node lookup
    label: string;     // display name (used as Sankey link key)
    category: SiteCategory;
    duration: number;  // minutes
    detail?: string;
}

export interface BrowsingSession {
    id: string;
    events: BrowsingEvent[];
}

// ─── Site catalogue ───────────────────────────────────────────────────────────

interface SiteSpec {
    nodeId: string;
    label: string;
    category: SiteCategory;
    details: string[];
}

const SITES: SiteSpec[] = [
    { nodeId: "google",        label: "Google",         category: "search",       details: ["react hooks tutorial", "d3 sankey diagram", "zustand vs jotai", "typescript generics", "next.js app router"] },
    { nodeId: "bing",          label: "Bing",           category: "search",       details: ["framer motion examples", "tailwind css grid", "svg animation react"] },
    { nodeId: "youtube",       label: "YouTube",        category: "social",       details: ["D3.js crash course", "React performance tips", "TypeScript advanced patterns", "CSS grid tutorial"] },
    { nodeId: "reddit",        label: "Reddit",         category: "social",       details: ["r/webdev — data viz", "r/reactjs — state management", "r/typescript — generics help", "r/programming — career advice"] },
    { nodeId: "twitter",       label: "Twitter / X",    category: "social",       details: ["trending: #dataviz", "trending: #reactjs", "following: @dan_abramov"] },
    { nodeId: "github",        label: "GitHub",         category: "dev",          details: ["d3/d3-sankey repo", "vasturiano/react-force-graph", "pmndrs/zustand", "vercel/next.js issues"] },
    { nodeId: "stackoverflow", label: "Stack Overflow", category: "dev",          details: ["sankey diagram react", "framer motion svg", "zustand persist middleware", "d3 force simulation stop"] },
    { nodeId: "npm",           label: "npm",            category: "dev",          details: ["react-force-graph-2d", "d3-sankey", "zustand", "framer-motion"] },
    { nodeId: "notion",        label: "Notion",         category: "productivity", details: ["Project notes — dashboard spec", "Architecture decisions", "Weekly review", "Feature backlog"] },
    { nodeId: "linear",        label: "Linear",         category: "productivity", details: ["Issue: implement Sankey", "Issue: heatmap filtering", "Issue: timeline panel", "Sprint planning"] },
];

const SITE_BY_ID = new Map(SITES.map((s) => [s.nodeId, s]));

// ─── Flow patterns (DAG — no reverse edges) ───────────────────────────────────
// Each entry: [source, [...valid next sites]]
// Designed so no cycle is possible following these patterns.

const FLOW_PATTERNS: Record<string, string[]> = {
    google:        ["youtube", "github", "stackoverflow", "reddit"],
    bing:          ["youtube", "stackoverflow", "github"],
    youtube:       ["github", "reddit", "twitter"],
    reddit:        ["github", "stackoverflow", "twitter"],
    twitter:       ["github", "youtube"],
    github:        ["stackoverflow", "npm", "notion", "linear"],
    stackoverflow: ["npm", "notion"],
    npm:           ["notion", "linear"],
    notion:        ["linear"],
    linear:        [],  // terminal node
};

// ─── Time-of-day entry points ─────────────────────────────────────────────────

function entryPointsForHour(hour: number): SiteSpec[] {
    if (hour >= 8 && hour < 12) {
        // Morning: search + learning
        return SITES.filter((s) => s.category === "search" || s.nodeId === "youtube");
    }
    if (hour >= 12 && hour < 18) {
        // Afternoon: dev work
        return SITES.filter((s) => s.category === "dev" || s.category === "search");
    }
    // Evening: social
    return SITES.filter((s) => s.category === "social" || s.category === "dev");
}

// ─── Deterministic-ish helpers ────────────────────────────────────────────────

let _seed = 42;
function seededRand(): number {
    _seed = (_seed * 1664525 + 1013904223) & 0xffffffff;
    return ((_seed >>> 0) / 0xffffffff);
}

function pickFrom<T>(arr: T[]): T {
    return arr[Math.floor(seededRand() * arr.length)];
}

function addMinutes(d: Date, m: number): Date {
    return new Date(d.getTime() + m * 60_000);
}

// ─── Session builder ──────────────────────────────────────────────────────────

let _eid = 0;
let _sid = 0;

function buildSession(startTime: Date, length: number): BrowsingSession {
    _sid++;
    const events: BrowsingEvent[] = [];
    const visited = new Set<string>();
    let t = addMinutes(startTime, Math.floor(seededRand() * 3));

    // Pick entry point based on time of day
    const entries = entryPointsForHour(startTime.getHours());
    let site = pickFrom(entries);

    for (let i = 0; i < length; i++) {
        // Skip if already visited (no cycles)
        if (visited.has(site.nodeId)) {
            const unvisited = SITES.filter((s) => !visited.has(s.nodeId));
            if (unvisited.length === 0) break;
            site = pickFrom(unvisited);
        }

        visited.add(site.nodeId);
        _eid++;
        events.push({
            id:        `e${_eid}`,
            timestamp: new Date(t),
            nodeId:    site.nodeId,
            label:     site.label,
            category:  site.category,
            duration:  3 + Math.floor(seededRand() * 10),
            detail:    pickFrom(site.details),
        });

        // Advance time: duration + 3–10 min gap
        t = addMinutes(t, events[events.length - 1].duration + 3 + Math.floor(seededRand() * 7));

        // Pick next site from flow pattern, excluding visited
        const nexts = (FLOW_PATTERNS[site.nodeId] ?? [])
            .map((id) => SITE_BY_ID.get(id)!)
            .filter((s) => s && !visited.has(s.nodeId));

        if (nexts.length > 0) {
            site = pickFrom(nexts);
        } else {
            // No valid next in pattern — pick any unvisited
            const unvisited = SITES.filter((s) => !visited.has(s.nodeId));
            if (unvisited.length === 0) break;
            site = pickFrom(unvisited);
        }
    }

    return { id: `s${_sid}`, events };
}

// ─── Schedule: 3 days × every active hour ────────────────────────────────────
// Each active hour (8–23) gets at least one session.
// Morning: 2 sessions/hour, Afternoon: 2–3, Evening: 1–2.

interface SlotSpec {
    dayOffset: number; // -1=yesterday, 0=today, 1=tomorrow
    hour: number;
    minute: number;
    length: number;    // steps per session
}

function buildSchedule(): SlotSpec[] {
    const slots: SlotSpec[] = [];

    for (const dayOffset of [-1, 0, 1]) {
        // Morning 8–11: search + learning, 2 sessions/hour
        for (const hour of [8, 9, 10, 11]) {
            slots.push({ dayOffset, hour, minute: 5,  length: 5 + Math.floor(seededRand() * 3) });
            slots.push({ dayOffset, hour, minute: 35, length: 4 + Math.floor(seededRand() * 3) });
        }
        // Afternoon 12–17: dev work, 2–3 sessions/hour
        for (const hour of [12, 13, 14, 15, 16, 17]) {
            slots.push({ dayOffset, hour, minute: 10, length: 5 + Math.floor(seededRand() * 4) });
            slots.push({ dayOffset, hour, minute: 40, length: 4 + Math.floor(seededRand() * 3) });
        }
        // Evening 18–23: social + dev, 1–2 sessions/hour
        for (const hour of [18, 19, 20, 21, 22, 23]) {
            slots.push({ dayOffset, hour, minute: 15, length: 4 + Math.floor(seededRand() * 4) });
            if (hour <= 21) {
                slots.push({ dayOffset, hour, minute: 50, length: 3 + Math.floor(seededRand() * 3) });
            }
        }
    }

    return slots;
}

// ─── Generate ─────────────────────────────────────────────────────────────────

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

const SCHEDULE = buildSchedule();

export const ALL_SESSIONS: BrowsingSession[] = SCHEDULE.map(({ dayOffset, hour, minute, length }) => {
    const start = new Date(TODAY);
    start.setDate(TODAY.getDate() + dayOffset);
    start.setHours(hour, minute, 0, 0);
    return buildSession(start, length);
});

/** All events sorted by timestamp */
export const ALL_EVENTS: BrowsingEvent[] = ALL_SESSIONS
    .flatMap((s) => s.events)
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

// ─── Public helpers ───────────────────────────────────────────────────────────

export function filterEventsByRange(from: Date, to: Date): BrowsingEvent[] {
    return ALL_EVENTS.filter((e) => e.timestamp >= from && e.timestamp <= to);
}

/**
 * Build sessions from a list of events.
 * Groups by 30-min gap. Always preserves sequence.
 * This is the CORRECT entry point for Sankey — never filter events first.
 */
export function buildSessionsFromEvents(events: BrowsingEvent[]): BrowsingEvent[][] {
    if (events.length === 0) return [];
    const sorted = [...events].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const sessions: BrowsingEvent[][] = [];
    let cur: BrowsingEvent[] = [sorted[0]];

    for (let i = 1; i < sorted.length; i++) {
        const gap = (sorted[i].timestamp.getTime() - sorted[i - 1].timestamp.getTime()) / 60_000;
        if (gap > 30) { sessions.push(cur); cur = []; }
        cur.push(sorted[i]);
    }
    if (cur.length) sessions.push(cur);
    return sessions;
}

// ─── Heatmap ──────────────────────────────────────────────────────────────────

export type DayLabel = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
const DAY_NAMES: DayLabel[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export interface HeatCell {
    day: DayLabel;
    hour: number;
    value: number;
}

export function buildHeatmap(): HeatCell[] {
    const cells = new Map<string, number>();
    for (const day of DAY_NAMES) for (let h = 0; h < 24; h++) cells.set(`${day}-${h}`, 0);

    for (const ev of ALL_EVENTS) {
        const dow    = ev.timestamp.getDay();
        const dayIdx = dow === 0 ? 6 : dow - 1;
        const day    = DAY_NAMES[dayIdx];
        const hour   = ev.timestamp.getHours();
        cells.set(`${day}-${hour}`, (cells.get(`${day}-${hour}`) ?? 0) + ev.duration);
    }

    return DAY_NAMES.flatMap((day) =>
        Array.from({ length: 24 }, (_, h) => ({ day, hour: h, value: cells.get(`${day}-${h}`) ?? 0 }))
    );
}

// ─── Sankey link type ─────────────────────────────────────────────────────────

export interface TimedSankeyLink {
    source: string;
    target: string;
    value: number;
    timestamp: Date;
}

// ─── Category colors ──────────────────────────────────────────────────────────

export const CATEGORY_COLORS: Record<SiteCategory, string> = {
    search:       "#22d3ee",
    social:       "#a78bfa",
    dev:          "#34d399",
    productivity: "#f59e0b",
    content:      "#f472b6",
};
