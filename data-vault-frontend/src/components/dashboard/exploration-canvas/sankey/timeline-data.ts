/*
 * 🎭 Analogy: This is the "Session Diary" — it filters the master event
 *    log down to the most relevant recent events for the Timeline Panel
 *    sidebar, showing what the user was doing in a given time window.
 * ✅ Safe to change:
 *    1. Change the default cap from 8 to 12 events in getTimelineEntries()
 *    2. Edit fmtTime() to use 12-hour format instead of 24-hour
 *    3. Change TIMELINE_CATEGORY_COLORS to use different hex values
 * ❌ Never touch: The getTimelineEntries() export name — TimelinePanel.tsx
 *    imports this exact function. Renaming it breaks the Journey sidebar.
 */

import {
    ALL_EVENTS,
    CATEGORY_COLORS,
    type BrowsingEvent,
    type SiteCategory,
} from "../data/mockBrowsingEvents";

export type TimelineCategory = SiteCategory;
export type { BrowsingEvent as TimelineEntry };
export { CATEGORY_COLORS as TIMELINE_CATEGORY_COLORS };

export function fmtTime(d: Date): string {
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function getTimelineEntries(from?: Date, to?: Date): BrowsingEvent[] {
    if (from && to) {
        return ALL_EVENTS.filter((e) => e.timestamp >= from && e.timestamp <= to);
    }

    // Default: today's events (or most recent day with data), capped at 8
    const sorted = [...ALL_EVENTS].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    if (sorted.length === 0) return [];

    const latest   = sorted[0].timestamp;
    const dayStart = new Date(latest); dayStart.setHours(0, 0, 0, 0);
    const dayEnd   = new Date(dayStart); dayEnd.setDate(dayStart.getDate() + 1);

    return sorted
        .filter((e) => e.timestamp >= dayStart && e.timestamp < dayEnd)
        .reverse()
        .slice(0, 8);
}
