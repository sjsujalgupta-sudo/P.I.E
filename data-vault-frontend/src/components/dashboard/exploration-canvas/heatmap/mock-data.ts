/*
 * 🎭 Analogy: This is the "Heatmap Kitchen" — it takes the master event
 *    log and aggregates it into a 7×24 grid (days × hours) showing how
 *    many minutes of activity happened in each cell.
 * ✅ Safe to change:
 *    1. Change DAYS order to start from Sunday instead of Monday
 *    2. Change HOURS to only show 8–23 (skip overnight hours)
 *    3. Re-export CATEGORY_COLORS with a different name for local use
 * ❌ Never touch: The buildHeatmap() function and MOCK_HEATMAP export —
 *    TimeHeatmap.tsx imports these exact names to render the grid.
 */
import { ALL_EVENTS, CATEGORY_COLORS } from "../data/mockBrowsingEvents";

export type DayLabel = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
export const DAYS  = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export const HOURS = Array.from({ length: 24 }, (_, i) => i);

export interface HeatCell { day: DayLabel; hour: number; value: number }

export function buildHeatmap(): HeatCell[] {
    const cells = new Map<string, number>();
    for (const day of DAYS) for (let h = 0; h < 24; h++) cells.set(`${day}-${h}`, 0);

    for (const ev of ALL_EVENTS) {
        const dow    = ev.timestamp.getDay();
        const dayIdx = dow === 0 ? 6 : dow - 1;
        const day    = DAYS[dayIdx];
        const hour   = ev.timestamp.getHours();
        cells.set(`${day}-${hour}`, (cells.get(`${day}-${hour}`) ?? 0) + ev.duration);
    }

    return DAYS.flatMap((day) =>
        Array.from({ length: 24 }, (_, h) => ({ day, hour: h, value: cells.get(`${day}-${h}`) ?? 0 }))
    );
}

export const MOCK_HEATMAP = buildHeatmap();
export const MAX_VALUE    = Math.max(...MOCK_HEATMAP.map((c) => c.value), 1);
export { CATEGORY_COLORS };
