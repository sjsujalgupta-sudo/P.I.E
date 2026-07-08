/*
 * 🎭 Analogy: This is the "Bouncer at the Door" — before any data enters
 *    the Journey visualizations, this file checks the time range filter
 *    and only lets through events that match the selected window.
 * ✅ Safe to change:
 *    1. Add a node filter: also filter by event.label === selectedNode.id
 *    2. Change the comparison from >= / <= to > / < for strict boundaries
 *    3. Add a category filter parameter
 * ❌ Never touch: The function signature filterEventsByTimeRange(events, timeRange)
 *    — SankeyFlow, LoopView, and StreamGraph all call it with these exact args.
 */

import type { BrowsingEvent } from "../../data/mockBrowsingEvents";
import type { TimeRange } from "@/lib/store/modeStore";

/**
 * Filter events by a custom time range.
 * Returns all events if range is not custom.
 */
export function filterEventsByTimeRange(
    events: BrowsingEvent[],
    timeRange: TimeRange
): BrowsingEvent[] {
    if (timeRange.preset !== "custom" || !timeRange.custom) return events;
    const { from, to } = timeRange.custom;
    return events.filter((e) => e.timestamp >= from && e.timestamp <= to);
}
