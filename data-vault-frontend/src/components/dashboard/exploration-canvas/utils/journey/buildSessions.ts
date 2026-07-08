/*
 * 🎭 Analogy: This is the "Librarian who groups books by series" — it takes
 *    a flat list of browsing events and groups them into sessions (a session
 *    ends when there's a 30-minute gap between events).
 * ✅ Safe to change:
 *    1. Change the 30-minute gap threshold to 60 minutes for longer sessions
 *    2. Add a minimum session length filter (e.g., skip sessions < 2 events)
 *    3. Add a session.category field derived from the dominant event category
 * ❌ Never touch: The Session type shape { id, events[] } — every downstream
 *    builder (buildSankeyData, buildLoopGraphData) reads these exact fields.
 */

import type { BrowsingEvent } from "../../data/mockBrowsingEvents";

export interface Session {
    id:     string;
    events: BrowsingEvent[];
}

/**
 * Group events into sessions.
 * Primary: group by sessionId.
 * Secondary: if sessionId is missing, use 30-min gap rule.
 */
export function buildSessions(events: BrowsingEvent[]): Session[] {
    if (events.length === 0) return [];

    const sorted = [...events].sort(
        (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );

    // Group by sessionId
    const bySession = new Map<string, BrowsingEvent[]>();
    for (const ev of sorted) {
        const sid = ev.sessionId ?? "unknown";
        if (!bySession.has(sid)) bySession.set(sid, []);
        bySession.get(sid)!.push(ev);
    }

    // Convert to Session array, filter out single-event sessions
    return Array.from(bySession.entries())
        .map(([id, evs]) => ({ id, events: evs }))
        .filter((s) => s.events.length >= 2);
}
