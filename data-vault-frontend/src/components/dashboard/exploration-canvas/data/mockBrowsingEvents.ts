/*
 * 🎭 Analogy: This is the "Master Event Log" — a realistic simulation of
 *    700+ browsing events across 5 days. Every Atlas visualization (heatmap,
 *    Sankey, streamgraph, structure map) reads from this single source.
 * ✅ Safe to change:
 *    1. Add a new site to the SITES array (give it a nodeId, label, category, titles)
 *    2. Edit the FLOWS object to change which sites link to which
 *    3. Change the schedule density in makeSchedule() to add more/fewer sessions
 * ❌ Never touch: The BrowsingEvent type shape (id, sessionId, timestamp, label,
 *    category, duration, title) — every pipeline utility and visualization
 *    destructures these exact field names.
 */

export type SiteCategory = "search" | "social" | "dev" | "productivity" | "content";

export interface BrowsingEvent {
    id:        string;
    sessionId: string;
    timestamp: Date;
    label:     string;       // display name — used as node key everywhere
    category:  SiteCategory;
    duration:  number;       // minutes
    title:     string;       // page/search title
}

// ─── Site catalogue ───────────────────────────────────────────────────────────

interface Site {
    label:    string;
    category: SiteCategory;
    titles:   string[];
}

const SITES: Site[] = [
    // Search
    { label: "Google",         category: "search",       titles: ["react hooks tutorial", "d3 sankey diagram", "zustand vs jotai", "typescript generics", "next.js app router", "css grid layout", "framer motion examples"] },
    { label: "Bing",           category: "search",       titles: ["tailwind css grid", "svg animation react", "web performance tips", "javascript closures"] },
    // Social
    { label: "YouTube",        category: "social",       titles: ["D3.js crash course", "React performance tips", "TypeScript advanced", "CSS grid tutorial", "Vim motions for devs"] },
    { label: "Reddit",         category: "social",       titles: ["r/webdev — data viz", "r/reactjs — state mgmt", "r/typescript — generics", "r/programming — career"] },
    { label: "Twitter / X",    category: "social",       titles: ["trending: #dataviz", "trending: #reactjs", "@dan_abramov thread", "#typescript tips"] },
    // Dev
    { label: "GitHub",         category: "dev",          titles: ["d3/d3-sankey", "vasturiano/react-force-graph", "pmndrs/zustand", "vercel/next.js issues", "tailwindlabs/tailwindcss"] },
    { label: "Stack Overflow", category: "dev",          titles: ["sankey diagram react", "framer motion svg", "zustand persist", "d3 force stop", "react useMemo deps"] },
    { label: "npm",            category: "dev",          titles: ["react-force-graph-2d", "d3-sankey", "zustand", "framer-motion", "tailwind-merge"] },
    // Productivity
    { label: "Notion",         category: "productivity", titles: ["Dashboard spec", "Architecture decisions", "Weekly review", "Feature backlog", "Meeting notes"] },
    { label: "Linear",         category: "productivity", titles: ["Issue: Sankey layout", "Issue: heatmap filter", "Issue: timeline panel", "Sprint planning", "Bug: missing node"] },
    { label: "Figma",          category: "productivity", titles: ["Dashboard wireframe", "Component library", "Color system", "Icon set review"] },
    // Content
    { label: "Medium",         category: "content",      titles: ["Building data viz with D3", "React patterns 2024", "TypeScript tips", "CSS architecture"] },
    { label: "Hacker News",    category: "content",      titles: ["Ask HN: best viz libs", "Show HN: my dashboard", "D3 vs Recharts", "Zustand vs Redux"] },
];

const SITE_MAP = new Map(SITES.map((s) => [s.label, s]));

// ─── Flow patterns (realistic navigation) ────────────────────────────────────
// Allows revisits — Google → GitHub → Google is intentional for Loop View

const FLOWS: Record<string, string[]> = {
    "Google":         ["YouTube", "GitHub", "Stack Overflow", "Reddit", "Medium", "Hacker News"],
    "Bing":           ["YouTube", "Stack Overflow", "GitHub", "Medium"],
    "YouTube":        ["GitHub", "Reddit", "Twitter / X", "Google"],          // can go back to Google
    "Reddit":         ["GitHub", "Stack Overflow", "Twitter / X", "Hacker News", "Google"],
    "Twitter / X":    ["GitHub", "YouTube", "Medium", "Hacker News"],
    "GitHub":         ["Stack Overflow", "npm", "Notion", "Linear", "Google"], // can loop back
    "Stack Overflow": ["GitHub", "npm", "Notion", "Google"],                   // can loop back
    "npm":            ["GitHub", "Stack Overflow", "Notion"],
    "Notion":         ["Linear", "GitHub", "Figma"],
    "Linear":         ["GitHub", "Notion", "Figma"],
    "Figma":          ["Notion", "Linear"],
    "Medium":         ["GitHub", "Reddit", "Hacker News"],
    "Hacker News":    ["GitHub", "Reddit", "Medium", "YouTube"],
};

// Time-of-day entry points
function entryForHour(hour: number): Site[] {
    if (hour >= 8  && hour < 12) return SITES.filter((s) => s.category === "search" || s.label === "YouTube" || s.label === "Hacker News");
    if (hour >= 12 && hour < 18) return SITES.filter((s) => s.category === "dev"    || s.category === "search" || s.label === "Stack Overflow");
    return SITES.filter((s) => s.category === "social" || s.category === "content" || s.category === "dev");
}

// ─── Deterministic PRNG ───────────────────────────────────────────────────────

let _seed = 0xdeadbeef;
function rand(): number {
    _seed = (Math.imul(1664525, _seed) + 1013904223) | 0;
    return ((_seed >>> 0) / 0xffffffff);
}
function pickFrom<T>(arr: T[]): T { return arr[Math.floor(rand() * arr.length)]; }
function addMins(d: Date, m: number): Date { return new Date(d.getTime() + m * 60_000); }

// ─── Session builder ──────────────────────────────────────────────────────────

let _eid = 0;
let _sid = 0;

function buildSession(start: Date, length: number, allowLoops: boolean): BrowsingEvent[] {
    _sid++;
    const sid    = `s${_sid}`;
    const events: BrowsingEvent[] = [];
    const visited = new Set<string>();
    let t    = addMins(start, Math.floor(rand() * 3));
    let site = pickFrom(entryForHour(start.getHours()));

    for (let i = 0; i < length; i++) {
        // For loop sessions: allow revisits. For normal sessions: skip visited.
        if (!allowLoops && visited.has(site.label)) {
            const unvisited = SITES.filter((s) => !visited.has(s.label));
            if (unvisited.length === 0) break;
            site = pickFrom(unvisited);
        }

        visited.add(site.label);
        _eid++;
        events.push({
            id:        `e${_eid}`,
            sessionId: sid,
            timestamp: new Date(t),
            label:     site.label,
            category:  site.category,
            duration:  3 + Math.floor(rand() * 12),
            title:     pickFrom(site.titles),
        });

        t = addMins(t, events[events.length - 1].duration + 2 + Math.floor(rand() * 8));

        // Pick next site
        const nexts = (FLOWS[site.label] ?? []).map((l) => SITE_MAP.get(l)!).filter(Boolean);
        const validNexts = allowLoops
            ? nexts
            : nexts.filter((s) => !visited.has(s.label));

        site = validNexts.length > 0 ? pickFrom(validNexts) : pickFrom(SITES.filter((s) => !visited.has(s.label) || allowLoops));
    }

    return events;
}

// ─── Schedule: 5 days × every active hour ────────────────────────────────────

interface Slot { dayOffset: number; hour: number; minute: number; length: number; loop: boolean }

function makeSchedule(): Slot[] {
    const slots: Slot[] = [];
    for (const dayOffset of [-2, -1, 0, 1, 2]) {
        // Morning 8–11: 2 sessions/hour, mostly linear
        for (const hour of [8, 9, 10, 11]) {
            slots.push({ dayOffset, hour, minute: 5,  length: 5 + Math.floor(rand() * 4), loop: false });
            slots.push({ dayOffset, hour, minute: 38, length: 4 + Math.floor(rand() * 3), loop: false });
        }
        // Afternoon 12–17: 2–3 sessions/hour, mix of linear + loop
        for (const hour of [12, 13, 14, 15, 16, 17]) {
            slots.push({ dayOffset, hour, minute: 8,  length: 6 + Math.floor(rand() * 4), loop: false });
            slots.push({ dayOffset, hour, minute: 42, length: 5 + Math.floor(rand() * 3), loop: rand() > 0.6 }); // some loops
        }
        // Evening 18–23: 1–2 sessions/hour, more loops (social browsing)
        for (const hour of [18, 19, 20, 21, 22, 23]) {
            slots.push({ dayOffset, hour, minute: 12, length: 5 + Math.floor(rand() * 5), loop: rand() > 0.4 });
            if (hour <= 21) {
                slots.push({ dayOffset, hour, minute: 48, length: 4 + Math.floor(rand() * 4), loop: rand() > 0.5 });
            }
        }
    }
    return slots;
}

// ─── Generate ─────────────────────────────────────────────────────────────────

const BASE = new Date();
BASE.setHours(0, 0, 0, 0);

const SCHEDULE = makeSchedule();

const _allEvents: BrowsingEvent[] = [];
const _allSessions: { id: string; events: BrowsingEvent[] }[] = [];

for (const { dayOffset, hour, minute, length, loop } of SCHEDULE) {
    const start = new Date(BASE);
    start.setDate(BASE.getDate() + dayOffset);
    start.setHours(hour, minute, 0, 0);
    const evs = buildSession(start, length, loop);
    if (evs.length >= 2) {
        const sid = evs[0].sessionId;
        _allSessions.push({ id: sid, events: evs });
        _allEvents.push(...evs);
    }
}

/** All events sorted by timestamp */
export const ALL_EVENTS: BrowsingEvent[] = _allEvents.sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
);

/** All sessions */
export const ALL_SESSIONS = _allSessions;

/** Category color map */
export const CATEGORY_COLORS: Record<SiteCategory, string> = {
    search:       "#22d3ee",
    social:       "#a78bfa",
    dev:          "#34d399",
    productivity: "#f59e0b",
    content:      "#f472b6",
};

/** Site metadata map for enrichment */
export const SITE_META = SITE_MAP;

export function replaceBrowsingEvents(events: BrowsingEvent[]) {
    ALL_EVENTS.splice(
        0,
        ALL_EVENTS.length,
        ...events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    );

    ALL_SESSIONS.splice(0, ALL_SESSIONS.length);
    const sessions = new Map<string, BrowsingEvent[]>();
    for (const event of ALL_EVENTS) {
        if (!sessions.has(event.sessionId)) sessions.set(event.sessionId, []);
        sessions.get(event.sessionId)!.push(event);
    }
    for (const [id, sessionEvents] of sessions) {
        ALL_SESSIONS.push({ id, events: sessionEvents });
    }

    SITE_META.clear();
    for (const event of ALL_EVENTS) {
        if (!SITE_META.has(event.label)) {
            SITE_META.set(event.label, {
                label: event.label,
                category: event.category,
                titles: [event.title],
            });
        }
    }
}
