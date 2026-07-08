/*
 * 🎭 Analogy: This file is the "Time Machine Controller" — it
 *   takes a full list of browsing events and filters them
 *   down to only what happened in the last hour, day, or week.
 * ✅ Safe to change:
 *    1. The WINDOW_MS values — change "week" from 7 days to 30 days for a longer history window
 *    2. The sort order in filterEventsByTimeline (ascending vs descending)
 *    3. Add a new window type like "month" to TimelineWindow
 * ❌ Never touch: filterEventsByTimeline() and formatFocusDuration() —
 *   the History page and playback system import these exact function names.
 */
import type { BrowsingEvent } from "@/components/dashboard/tree-of-thought/mock-data";

export type TimelineWindow = "hour" | "day" | "week";

const WINDOW_MS: Record<TimelineWindow, number> = {
  hour: 60 * 60 * 1000,
  day: 24 * 60 * 60 * 1000,
  week: 7 * 24 * 60 * 60 * 1000,
};

/** Event visit interval: [start, end] in ms from `timestamp` and `timeSpentSeconds`. */
export function eventTimeRangeMs(e: BrowsingEvent, nowMs: number): { start: number; end: number } {
  const start = new Date(e.timestamp).getTime();
  const end = start + Math.max(0, e.timeSpentSeconds) * 1000;
  return { start, end: Math.max(start, end) };
}

/**
 * Hard prune: start from nodes whose visit overlaps the window. Drop any node whose
 * parent is not in the kept set (tree / single parent). Fixpoint until stable — children
 * of pruned parents disappear. For a future multi-parent DAG, keep a node if any parent
 * remains in the set.
 */
export function filterEventsByTimeline(
  allEvents: BrowsingEvent[],
  window: TimelineWindow,
  nowMs: number = Date.now()
): BrowsingEvent[] {
  if (allEvents.length === 0) return [];

  const rangeStart = nowMs - WINDOW_MS[window];
  const byId = new Map(allEvents.map((e) => [e.id, e]));

  const overlapsWindow = (e: BrowsingEvent) => {
    const { start, end } = eventTimeRangeMs(e, nowMs);
    return end >= rangeStart && start <= nowMs;
  };

  let keep = new Set(allEvents.filter(overlapsWindow).map((e) => e.id));

  // We no longer prune children whose parents are missing from the window.
  // Instead, we keep all nodes that overlap the window, and let the layout
  // engine treat those with missing/filtered parents as new roots. This
  // prevents recent activity from disappearing just because its ancestor
  // is older than the current timeline window.
  return allEvents
    .filter((e) => keep.has(e.id))
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

export function formatFocusDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m < 60) return r > 0 ? `${m}m ${r}s` : `${m}m`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return rm > 0 ? `${h}h ${rm}m` : `${h}h`;
}
