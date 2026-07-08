import Fuse from "fuse.js";
import { ALL_EVENTS, ALL_SESSIONS, CATEGORY_COLORS, type SiteCategory, type BrowsingEvent } from "../data/mockBrowsingEvents";
import { type AtlasSearchResult, type SearchScope } from "@/lib/store/modeStore";
import { buildSessions } from "./journey/buildSessions";

// ─── Search Index Setup ──────────────────────────────────────────────────────

interface SearchableItem {
    id: string;
    type: "node" | "category" | "time" | "journey";
    label: string;
    subLabel?: string;
    category?: SiteCategory;
    hours?: number[];
    day?: string;
    source?: string;
    target?: string;
}

const ALL_NODE_LABELS = [...new Set(ALL_EVENTS.map((e) => e.label))];

const CATEGORY_SCOPES: { label: string; value: SiteCategory }[] = [
    { label: "Development",  value: "dev" },
    { label: "Social",       value: "social" },
    { label: "Search",       value: "search" },
    { label: "Productivity", value: "productivity" },
    { label: "Content",      value: "content" },
];

const TIME_KEYWORDS = [
    { label: "Morning",    hours: [8, 9, 10, 11] },
    { label: "Afternoon",  hours: [12, 13, 14, 15, 16, 17] },
    { label: "Evening",    hours: [18, 19, 20, 21] },
    { label: "Late night", hours: [22, 23, 0, 1] },
    { label: "Monday",    day: "Monday" },
    { label: "Tuesday",   day: "Tuesday" },
    { label: "Wednesday", day: "Wednesday" },
    { label: "Thursday",  day: "Thursday" },
    { label: "Friday",    day: "Friday" },
    { label: "Saturday",  day: "Saturday" },
    { label: "Sunday",    day: "Sunday" },
];

const TOP_JOURNEYS: { label: string; source: string; target: string }[] = [];
(function buildTopJourneys() {
    const transitions = new Map<string, {source: string, target: string, count: number}>();
    for (const sess of ALL_SESSIONS) {
        for (let i = 0; i < sess.events.length - 1; i++) {
            const source = sess.events[i].label;
            const target = sess.events[i+1].label;
            const key = `${source} → ${target}`;
            const existing = transitions.get(key) || {source, target, count: 0};
            existing.count++;
            transitions.set(key, existing);
        }
    }
    const sorted = [...transitions.values()].sort((a,b) => b.count - a.count).slice(0, 20);
    for (const t of sorted) {
        TOP_JOURNEYS.push({ label: `${t.source} → ${t.target}`, source: t.source, target: t.target });
    }
})();

const SEARCH_ITEMS: SearchableItem[] = [
    // Nodes
    ...ALL_NODE_LABELS.map((label) => {
        const ev = ALL_EVENTS.find((e) => e.label === label);
        return {
            id: label,
            type: "node" as const,
            label,
            category: ev?.category,
            subLabel: `${ev?.category ?? "domain"} · ${ALL_EVENTS.filter((e) => e.label === label).length} visits`,
        };
    }),
    // Categories
    ...CATEGORY_SCOPES.map((cat) => ({
        id: cat.value,
        type: "category" as const,
        label: cat.label,
        subLabel: `Category · ${ALL_EVENTS.filter((e) => e.category === cat.value).length} visits`,
    })),
    // Times
    ...TIME_KEYWORDS.map((t) => ({
        id: t.label,
        type: "time" as const,
        label: t.label,
        hours: t.hours,
        day: t.day,
        subLabel: t.hours ? `Time range (${t.label})` : `Day of week (${t.label})`,
    })),
    // Journeys
    ...TOP_JOURNEYS.map((j) => ({
        id: j.label,
        type: "journey" as const,
        label: j.label,
        source: j.source,
        target: j.target,
        subLabel: "Sequence journey",
    })),
];

const fuseInstance = new Fuse(SEARCH_ITEMS, {
    keys: ["label"],
    threshold: 0.4,
    includeScore: true,
});

// ─── Score and Sort Results ───────────────────────────────────────────────────

function scoreSearchResult(query: string, item: SearchableItem, fuseScore: number = 1): number {
    const q = query.toLowerCase().trim();
    const label = item.label.toLowerCase();

    // Exact matches
    if (label === q) {
        if (item.type === "node") return 100;
        if (item.type === "category") return 90;
        if (item.type === "journey") return 85;
        return 80; // time exact
    }

    // Prefix matches
    if (label.startsWith(q)) {
        if (item.type === "node") return 85;
        if (item.type === "category") return 75;
        if (item.type === "journey") return 70;
        return 65;
    }

    // Substring matches (e.g. "git" matches "google -> github" or "tube" matches "YouTube")
    if (label.includes(q)) {
        if (item.type === "node") return 75;
        if (item.type === "category") return 65;
        if (item.type === "journey") return 65;
        return 55;
    }

    // Fuzzy matches (only valid if fuseScore < 1)
    if (fuseScore < 1) {
        const invertedScore = (1 - fuseScore) * 10; // lower score means better match in Fuse
        if (item.type === "node") return 50 + invertedScore;
        if (item.type === "category") return 40 + invertedScore;
        if (item.type === "journey") return 35 + invertedScore;
        return 30 + invertedScore; // fuzzy time match
    }

    return 0; // No match
}

// ─── Parser for Journey same-session sequence ──────────────────────────────────

function parseJourneyQuery(query: string): { source: string; target: string } | null {
    if (!query.includes("->") && !query.includes("→")) return null;
    const parts = query.split(/->|→/);
    if (parts.length < 2) return null;
    const srcRaw = parts[0].trim();
    const tgtRaw = parts[1].trim();
    if (!srcRaw || !tgtRaw) return null;

    // Fuzzy match source and target nodes using Fuse.js
    const srcNodes = SEARCH_ITEMS.filter((item) => item.type === "node");
    const fuseSrc = new Fuse(srcNodes, { keys: ["label"], threshold: 0.6 });
    const fuseTgt = new Fuse(srcNodes, { keys: ["label"], threshold: 0.6 });

    const srcResults = fuseSrc.search(srcRaw);
    const tgtResults = fuseTgt.search(tgtRaw);

    const source = srcResults[0]?.item.label || srcRaw;
    const target = tgtResults[0]?.item.label || tgtRaw;

    return { source, target };
}

// ─── Suggestion Retrieval ────────────────────────────────────────────────────

export function getSearchSuggestions(query: string, scope: SearchScope = "all"): AtlasSearchResult[] {
    const trimmed = query.trim();
    if (!trimmed) return [];

    // 1. Check for Journey Search
    const journey = parseJourneyQuery(trimmed);
    if (journey) {
        if (scope === "all" || scope === "journey") {
            return [{
                type: "journey",
                source: journey.source,
                target: journey.target,
            }];
        }
        return [];
    }

    // 2. Perform fuzzy search via Fuse just to get scores
    const fuseResults = fuseInstance.search(trimmed);
    const fuseScoreMap = new Map(fuseResults.map(r => [r.item.id, r.score || 1]));

    // Apply scope filtering
    let searchItems = scope === "all" ? SEARCH_ITEMS : SEARCH_ITEMS.filter((i) => i.type === scope);

    // Score all items based on prioritized score
    const scored = searchItems.map((item) => {
        const priority = scoreSearchResult(trimmed, item, fuseScoreMap.get(item.id) || 1);
        return { item, priority };
    }).filter(s => s.priority > 0);

    scored.sort((a, b) => b.priority - a.priority);

    // Map to AtlasSearchResult format
    return scored.map((s): AtlasSearchResult => {
        const item = s.item;
        if (item.type === "node") {
            return { type: "node", id: item.id, label: item.label };
        } else if (item.type === "category") {
            return { type: "category", category: item.id as SiteCategory };
        } else if (item.type === "journey") {
            return { type: "journey", source: item.source!, target: item.target! };
        } else {
            return { type: "time", value: item.label, hours: item.hours, day: item.day };
        }
    }).slice(0, 6);
}

// ─── Stat calculation helpers ─────────────────────────────────────────────────

export function getPeakHour(nodeId: string): string {
    const evs = ALL_EVENTS.filter((e) => e.label === nodeId);
    if (evs.length === 0) return "N/A";

    const hours = Array(24).fill(0);
    for (const e of evs) {
        hours[e.timestamp.getHours()] += e.duration;
    }

    let maxMins = 0;
    let peakStart = 9; // default 9AM

    // Look for 3-hour sliding window
    for (let h = 0; h < 24; h++) {
        const total = hours[h] + hours[(h + 1) % 24] + hours[(h + 2) % 24];
        if (total > maxMins) {
            maxMins = total;
            peakStart = h;
        }
    }

    const formatH = (h: number) => {
        const period = h >= 12 ? "PM" : "AM";
        const displayH = h % 12 === 0 ? 12 : h % 12;
        return `${displayH}${period}`;
    };

    return `${formatH(peakStart)}–${formatH((peakStart + 3) % 24)}`;
}

export function getMostActiveDay(nodeId: string): string {
    const evs = ALL_EVENTS.filter((e) => e.label === nodeId);
    if (evs.length === 0) return "N/A";

    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const counts = Array(7).fill(0);
    for (const e of evs) {
        counts[e.timestamp.getDay()] += e.duration;
    }

    const maxIdx = counts.indexOf(Math.max(...counts));
    return days[maxIdx];
}

export function getMostCommonJourney(nodeId: string): string {
    const transitions = new Map<string, number>();

    for (const sess of ALL_SESSIONS) {
        const events = sess.events;
        for (let i = 0; i < events.length; i++) {
            if (events[i].label === nodeId) {
                const prev = i > 0 ? events[i - 1].label : null;
                const next = i < events.length - 1 ? events[i + 1].label : null;

                if (prev && next) {
                    const key = `${prev} → ${nodeId} → ${next}`;
                    transitions.set(key, (transitions.get(key) ?? 0) + 1);
                } else if (prev) {
                    const key = `${prev} → ${nodeId}`;
                    transitions.set(key, (transitions.get(key) ?? 0) + 1);
                } else if (next) {
                    const key = `${nodeId} → ${next}`;
                    transitions.set(key, (transitions.get(key) ?? 0) + 1);
                }
            }
        }
    }

    if (transitions.size === 0) return "Direct visit";

    const sorted = [...transitions.entries()].sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] || "Direct visit";
}

export function getMostConnectedNode(nodeId: string): string {
    const counts = new Map<string, number>();

    for (const sess of ALL_SESSIONS) {
        const events = sess.events;
        for (let i = 0; i < events.length; i++) {
            if (events[i].label === nodeId) {
                if (i > 0) {
                    const prev = events[i - 1].label;
                    counts.set(prev, (counts.get(prev) ?? 0) + 1);
                }
                if (i < events.length - 1) {
                    const next = events[i + 1].label;
                    counts.set(next, (counts.get(next) ?? 0) + 1);
                }
            }
        }
    }

    if (counts.size === 0) return "None";

    const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] || "None";
}

export function getCategoryStats(category: SiteCategory) {
    const evs = ALL_EVENTS.filter((e) => e.category === category);
    if (evs.length === 0) return { peak: "N/A", activeDay: "N/A", topSites: [] };

    // Peak hour
    const hours = Array(24).fill(0);
    for (const e of evs) hours[e.timestamp.getHours()] += e.duration;
    let maxMins = 0;
    let peakStart = 9;
    for (let h = 0; h < 24; h++) {
        const total = hours[h] + hours[(h + 1) % 24] + hours[(h + 2) % 24];
        if (total > maxMins) {
            maxMins = total;
            peakStart = h;
        }
    }
    const formatH = (h: number) => {
        const period = h >= 12 ? "PM" : "AM";
        const displayH = h % 12 === 0 ? 12 : h % 12;
        return `${displayH}${period}`;
    };
    const peak = `${formatH(peakStart)}–${formatH((peakStart + 3) % 24)}`;

    // Active day
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const counts = Array(7).fill(0);
    for (const e of evs) counts[e.timestamp.getDay()] += e.duration;
    const activeDay = days[counts.indexOf(Math.max(...counts))];

    // Top sites
    const siteMap = new Map<string, number>();
    for (const e of evs) siteMap.set(e.label, (siteMap.get(e.label) ?? 0) + e.duration);
    const topSites = [...siteMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([label, duration]) => ({ label, duration }));

    return { peak, activeDay, topSites };
}

export function getTimeStats(timeQuery: string, hours?: number[], day?: string) {
    let evs = ALL_EVENTS;

    // Apply filters
    if (day) {
        const dow = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].indexOf(day);
        evs = evs.filter((e) => e.timestamp.getDay() === dow);
    }
    if (hours && hours.length > 0) {
        evs = evs.filter((e) => hours.includes(e.timestamp.getHours()));
    }

    if (evs.length === 0) {
        return {
            totalMins: 0,
            sessionCount: 0,
            avgDuration: 0,
            dominantCat: null as SiteCategory | null,
            topSites: [] as { label: string; duration: number }[],
        };
    }

    const totalMins = evs.reduce((sum, e) => sum + e.duration, 0);
    const sessions = new Set(evs.map((e) => e.sessionId)).size;
    const avgDuration = sessions > 0 ? Math.round(totalMins / sessions) : 0;

    // Dominant category
    const catMap = new Map<SiteCategory, number>();
    for (const e of evs) catMap.set(e.category, (catMap.get(e.category) ?? 0) + e.duration);
    const dominantCat = [...catMap.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    // Top sites
    const siteMap = new Map<string, number>();
    for (const e of evs) siteMap.set(e.label, (siteMap.get(e.label) ?? 0) + e.duration);
    const topSites = [...siteMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([label, duration]) => ({ label, duration }));

    return { totalMins, sessionCount: sessions, avgDuration, dominantCat, topSites };
}

export function getJourneyStats(source: string, target: string) {
    let flowCount = 0;
    const days = Array(7).fill(0);
    const hours = Array(24).fill(0);
    const intermediates = new Map<string, number>();

    for (const sess of ALL_SESSIONS) {
        const events = sess.events;
        const srcIdx = events.findIndex((e) => e.label === source);
        const tgtIdx = events.findIndex((e) => e.label === target);

        if (srcIdx !== -1 && tgtIdx !== -1 && srcIdx < tgtIdx) {
            flowCount++;
            const startEv = events[srcIdx];
            days[startEv.timestamp.getDay()]++;
            hours[startEv.timestamp.getHours()]++;

            // Intermediate nodes
            const mid = events.slice(srcIdx + 1, tgtIdx).map((e) => e.label);
            if (mid.length === 0) {
                intermediates.set("Direct Link", (intermediates.get("Direct Link") ?? 0) + 1);
            } else {
                const route = mid.join(" → ");
                intermediates.set(route, (intermediates.get(route) ?? 0) + 1);
            }
        }
    }

    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const maxDay = dayNames[days.indexOf(Math.max(...days))];

    let maxHr = 0, peakStart = 9;
    for (let h = 0; h < 24; h++) {
        const total = hours[h] + hours[(h + 1) % 24] + hours[(h + 2) % 24];
        if (total > maxHr) {
            maxHr = total;
            peakStart = h;
        }
    }
    const formatH = (h: number) => `${h % 12 === 0 ? 12 : h % 12}${h >= 12 ? "PM" : "AM"}`;
    const peak = flowCount > 0 ? `${formatH(peakStart)}–${formatH((peakStart + 3) % 24)}` : "N/A";

    const topIntermediates = [...intermediates.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([route, count]) => ({ route, count }));

    return { flowCount, peak, activeDay: flowCount > 0 ? maxDay : "N/A", topIntermediates };
}

// ─── Cross-Mode Summary Builder ───────────────────────────────────────────────

export function getCrossModeSummary(entity: AtlasSearchResult) {
    if (entity.type === "node") {
        const name = entity.label;
        const totalVisits = ALL_EVENTS.filter((e) => e.label === name).length;
        const connectedNode = getMostConnectedNode(name);
        const peakH = getPeakHour(name);
        const ev = ALL_EVENTS.find((e) => e.label === name);
        const category = ev ? ev.category : "dev";
        const districtMap: Record<string, string> = {
            dev: "Dev Territory",
            social: "Social Territory",
            search: "Search District",
            productivity: "Operations Center",
            content: "Knowledge Sector",
        };

        // Journey flow count
        let journeys = 0;
        for (const s of ALL_SESSIONS) {
            if (s.events.some((e) => e.label === name)) journeys++;
        }

        return {
            overview: `Connected to ${connectedNode}`,
            journey: `${journeys} matching flows`,
            time: `Peak activity: ${peakH}`,
            patterns: `${category.toUpperCase()} category rhythm`,
            structure: `Located in ${districtMap[category] || "Main District"}`,
        };
    } else if (entity.type === "category") {
        const cat = entity.category;
        const nodes = [...new Set(ALL_EVENTS.filter((e) => e.category === cat).map((e) => e.label))];
        const stats = getCategoryStats(cat);

        // Journey
        let journeys = 0;
        for (const s of ALL_SESSIONS) {
            if (s.events.some((e) => e.category === cat)) journeys++;
        }

        return {
            overview: `${nodes.length} active domain nodes`,
            journey: `${journeys} flows containing category`,
            time: `Highest on ${stats.activeDay}`,
            patterns: `Occupies ${stats.peak} stream segment`,
            structure: `Ecosystem center of the district`,
        };
    } else if (entity.type === "journey") {
        const stats = getJourneyStats(entity.source, entity.target);
        return {
            overview: `Path from ${entity.source} to ${entity.target}`,
            journey: `${stats.flowCount} total flows recorded`,
            time: `Commonly during ${stats.peak}`,
            patterns: `Runs through multiple rhythm waves`,
            structure: `Spans multiple district ecosystems`,
        };
    } else {
        // time
        const stats = getTimeStats(entity.value, entity.hours, entity.day);
        const activeNodes = stats.topSites.map((s) => s.label).join(", ");
        return {
            overview: `${stats.sessionCount} sessions active`,
            journey: `Flows active during this slot`,
            time: `Time block: ${entity.value}`,
            patterns: `${stats.dominantCat?.toUpperCase() || "MIXED"} dominant rhythm`,
            structure: `Spans ${stats.topSites.length} structured nodes`,
        };
    }
}
