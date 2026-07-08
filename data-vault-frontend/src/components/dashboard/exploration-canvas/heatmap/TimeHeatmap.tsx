/*
 * 🎭 Analogy: This file is the "Calendar Heat Map" — like a
 *   GitHub contribution graph, it shows which days and hours
 *   you were most active, colored by intensity.
 * ✅ Safe to change:
 *    1. The CELL_GAP and ROW_H constants — adjust grid spacing
 *    2. The HOUR_LABELS map — change which hour labels are shown
 *    3. The activityColor() function — swap the color palette
 * ❌ Never touch: The `TimeHeatmap` export name — it's imported
 *   by MainView. Renaming it breaks the Time mode entirely.
 */

"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ALL_EVENTS, CATEGORY_COLORS, type SiteCategory } from "../data/mockBrowsingEvents";
import { DAYS, HOURS, MAX_VALUE, MOCK_HEATMAP, type HeatCell } from "./mock-data";
import { useModeActions, useSelectedNode, useSetTimeRange, useTimeRange, useFocusedEntity } from "@/lib/store/modeStore";

// ─── Constants ────────────────────────────────────────────────────────────────

const CELL_GAP = 3;
const CELL_R   = 3;
const ROW_H    = 28;
const LABEL_W  = 36;
const HOUR_H   = 22;
const PADDING  = 24;

const HOUR_LABELS: Record<number, string> = {
    0: "12a", 3: "3a", 6: "6a", 9: "9a",
    12: "12p", 15: "3p", 18: "6p", 21: "9p",
};

type ViewMode = "activity" | "categories";

interface TooltipState {
    cell: HeatCell;
    analytics: CellAnalytics;
    x: number;
    y: number;
}

// ─── Color helpers ────────────────────────────────────────────────────────────

function activityColor(value: number, max: number): string {
    if (value === 0) return "rgba(255,255,255,0.04)";
    const t = value / max;
    const r = Math.round(10  + t * (52  - 10));
    const g = Math.round(80  + t * (211 - 80));
    const b = Math.round(80  + t * (153 - 80));
    return `rgba(${r},${g},${b},${0.25 + t * 0.75})`;
}

function categoryColor(cat: SiteCategory | null, intensity: number): string {
    if (!cat || intensity === 0) return "rgba(255,255,255,0.04)";
    const base = CATEGORY_COLORS[cat] ?? "#a78bfa";
    // Parse hex to rgb
    const r = parseInt(base.slice(1, 3), 16);
    const g = parseInt(base.slice(3, 5), 16);
    const b = parseInt(base.slice(5, 7), 16);
    const a = 0.2 + intensity * 0.7;
    return `rgba(${r},${g},${b},${a})`;
}

function formatHour(h: number): string {
    if (h === 0)  return "12:00 AM";
    if (h === 12) return "12:00 PM";
    return h < 12 ? `${h}:00 AM` : `${h - 12}:00 PM`;
}

function formatHourShort(h: number): string {
    if (h === 0)  return "12AM";
    if (h === 12) return "12PM";
    return h < 12 ? `${h}AM` : `${h - 12}PM`;
}

// ─── Per-cell analytics ───────────────────────────────────────────────────────

interface CellAnalytics {
    totalMins:    number;
    sessionCount: number;
    topSites:     string[];
    dominantCat:  SiteCategory | null;
    catIntensity: number; // 0–1 for category color
    pattern:      string;
    nodePresent:  boolean; // is selectedNode active in this cell?
}

function buildCellAnalytics(
    day: string,
    hour: number,
    selectedNodeId: string | null
): CellAnalytics {
    const dow = DAYS.indexOf(day as any); // Mon=0
    const evs = ALL_EVENTS.filter((e) => {
        const d = e.timestamp.getDay();
        const di = d === 0 ? 6 : d - 1;
        return di === dow && e.timestamp.getHours() === hour;
    });

    if (evs.length === 0) {
        return { totalMins: 0, sessionCount: 0, topSites: [], dominantCat: null, catIntensity: 0, pattern: "No activity", nodePresent: false };
    }

    const totalMins = evs.reduce((s, e) => s + e.duration, 0);
    const sessions  = new Set(evs.map((e) => e.sessionId)).size;

    // Top sites by visit count
    const siteCount = new Map<string, number>();
    for (const e of evs) siteCount.set(e.label, (siteCount.get(e.label) ?? 0) + 1);
    const topSites = [...siteCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([l]) => l);

    // Dominant category
    const catCount = new Map<SiteCategory, number>();
    for (const e of evs) catCount.set(e.category, (catCount.get(e.category) ?? 0) + e.duration);
    const dominantCat = [...catCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    const catIntensity = dominantCat ? (catCount.get(dominantCat)! / totalMins) : 0;

    // Pattern label
    let pattern = "Mixed browsing";
    if (dominantCat === "dev" && totalMins > 30)        pattern = "Deep work session";
    else if (dominantCat === "dev")                      pattern = "Dev session";
    else if (dominantCat === "social" && hour >= 20)     pattern = "Evening social";
    else if (dominantCat === "social")                   pattern = "Social browsing";
    else if (dominantCat === "search")                   pattern = "Research session";
    else if (dominantCat === "productivity")             pattern = "Productivity session";
    else if (dominantCat === "content")                  pattern = "Content consumption";
    if (sessions >= 3 && totalMins > 60)                 pattern = "High-activity window";

    const nodePresent = selectedNodeId ? evs.some((e) => e.label === selectedNodeId) : false;

    return { totalMins, sessionCount: sessions, topSites, dominantCat, catIntensity, pattern, nodePresent };
}

// ─── Insights generator ───────────────────────────────────────────────────────

function generateInsights(cellMap: Map<string, HeatCell>, selectedNodeId: string | null) {
    // Peak focus window (highest consecutive 3-hour block on weekdays)
    const weekdays = DAYS.slice(0, 5);
    let bestBlock = { start: 14, label: "2PM–5PM", score: 0 };
    for (let h = 8; h <= 20; h++) {
        const score = weekdays.reduce((s, d) =>
            s + (cellMap.get(`${d}-${h}`)?.value ?? 0)
              + (cellMap.get(`${d}-${(h+1)}`)?.value ?? 0)
              + (cellMap.get(`${d}-${(h+2)}`)?.value ?? 0), 0);
        if (score > bestBlock.score) {
            bestBlock = { start: h, label: `${formatHourShort(h)}–${formatHourShort(h + 3)}`, score };
        }
    }

    // Most common behavior (dominant category across all cells)
    const catTotals = new Map<SiteCategory, number>();
    for (const ev of ALL_EVENTS) {
        catTotals.set(ev.category, (catTotals.get(ev.category) ?? 0) + ev.duration);
    }
    const topCat = [...catTotals.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    const catLabel: Record<SiteCategory, string> = {
        dev: "Development sessions", social: "Social browsing",
        search: "Research sessions", productivity: "Productivity work", content: "Content consumption",
    };

    // Most active node
    const nodeTotals = new Map<string, number>();
    for (const ev of ALL_EVENTS) nodeTotals.set(ev.label, (nodeTotals.get(ev.label) ?? 0) + ev.duration);
    const topNode = [...nodeTotals.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "GitHub";

    // Late night pattern
    const lateNightEvs = ALL_EVENTS.filter((e) => e.timestamp.getHours() >= 22);
    const lateTopCat = (() => {
        const m = new Map<SiteCategory, number>();
        for (const e of lateNightEvs) m.set(e.category, (m.get(e.category) ?? 0) + 1);
        return [...m.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    })();
    const lateLabel = lateTopCat === "social" ? "High social browsing after 10PM"
        : lateTopCat === "dev" ? "Late-night coding sessions"
        : lateTopCat === "content" ? "Content consumption after 10PM"
        : "Mixed late-night activity";

    // Node-specific insight
    let nodeInsight: string | null = null;
    if (selectedNodeId) {
        const nodeEvs = ALL_EVENTS.filter((e) => e.label === selectedNodeId);
        const peakH = (() => {
            const m = new Map<number, number>();
            for (const e of nodeEvs) m.set(e.timestamp.getHours(), (m.get(e.timestamp.getHours()) ?? 0) + 1);
            return [...m.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
        })();
        if (peakH !== undefined) {
            const period = peakH < 12 ? "mornings" : peakH < 18 ? "afternoons" : "evenings";
            nodeInsight = `${selectedNodeId} most active during ${period} (peak: ${formatHourShort(peakH)})`;
        }
    }

    return { peakWindow: bestBlock.label, commonBehavior: topCat ? catLabel[topCat] : "Mixed", topNode, lateNight: lateLabel, nodeInsight };
}


// ─── Component ────────────────────────────────────────────────────────────────

export function TimeHeatmap() {
    const containerRef  = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(0);
    const [tooltip, setTooltip] = useState<TooltipState | null>(null);
    const [hoveredKey, setHoveredKey] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>("activity");
    const setTimeRange  = useSetTimeRange();
    const timeRange     = useTimeRange();
    const { setMode }   = useModeActions();
    const selectedNode  = useSelectedNode();
    const focusedEntity = useFocusedEntity();

    // ── Search active cells ───────────────────────────────────────────────────
    const searchActiveCells = useMemo(() => {
        if (!focusedEntity) return null;
        const set = new Set<string>();

        if (focusedEntity.type === "node") {
            for (const e of ALL_EVENTS) {
                if (e.label === focusedEntity.id) {
                    const dow = e.timestamp.getDay();
                    const day = DAYS[dow === 0 ? 6 : dow - 1];
                    const hour = e.timestamp.getHours();
                    set.add(`${day}-${hour}`);
                }
            }
        } else if (focusedEntity.type === "category") {
            for (const e of ALL_EVENTS) {
                if (e.category === focusedEntity.category) {
                    const dow = e.timestamp.getDay();
                    const day = DAYS[dow === 0 ? 6 : dow - 1];
                    const hour = e.timestamp.getHours();
                    set.add(`${day}-${hour}`);
                }
            }
        } else if (focusedEntity.type === "journey") {
            for (const e of ALL_EVENTS) {
                if (e.label === focusedEntity.source || e.label === focusedEntity.target) {
                    const dow = e.timestamp.getDay();
                    const day = DAYS[dow === 0 ? 6 : dow - 1];
                    const hour = e.timestamp.getHours();
                    set.add(`${day}-${hour}`);
                }
            }
        } else if (focusedEntity.type === "time") {
            if (focusedEntity.day) {
                const day = focusedEntity.day;
                if (focusedEntity.hours) {
                    for (const h of focusedEntity.hours) set.add(`${day}-${h}`);
                } else {
                    for (let h = 0; h < 24; h++) set.add(`${day}-${h}`);
                }
            } else if (focusedEntity.hours) {
                for (const day of DAYS) {
                    for (const h of focusedEntity.hours) set.add(`${day}-${h}`);
                }
            }
        }
        return set;
    }, [focusedEntity]);

    // ── Node activity cells ───────────────────────────────────────────────────
    // When a node is selected, compute per-cell node activity intensity
    // so cells are colored by HOW MUCH of that node's activity falls there,
    // not by generic total activity.
    const nodeActivityMap = useMemo(() => {
        if (!selectedNode) return null;
        // Map: "Mon-14" → { mins, visits }
        const map = new Map<string, { mins: number; visits: number }>();
        for (const ev of ALL_EVENTS) {
            if (ev.label !== selectedNode.id) continue;
            const dow    = ev.timestamp.getDay();
            const dayIdx = dow === 0 ? 6 : dow - 1;
            const day    = DAYS[dayIdx];
            const hour   = ev.timestamp.getHours();
            const key    = `${day}-${hour}`;
            const ex     = map.get(key);
            if (ex) { ex.mins += ev.duration; ex.visits++; }
            else map.set(key, { mins: ev.duration, visits: 1 });
        }
        return map;
    }, [selectedNode]);

    // Max node activity across all cells (for normalising intensity)
    const nodeActivityMax = useMemo(() => {
        if (!nodeActivityMap) return 1;
        return Math.max(...[...nodeActivityMap.values()].map((v) => v.mins), 1);
    }, [nodeActivityMap]);

    // Legacy set for border glow (still used for the border ring)
    const nodeActiveCells = useMemo(() => {
        if (!nodeActivityMap) return null;
        return new Set(nodeActivityMap.keys());
    }, [nodeActivityMap]);

    // Derive the currently selected cell key from the global time range
    // so the heatmap highlights whichever cell was last clicked
    const selectedKey = timeRange.preset === "custom" && timeRange.custom
        ? (() => {
            const from = timeRange.custom.from;
            const hour = from.getHours();
            const dow  = from.getDay(); // 0=Sun
            const dayIdx = dow === 0 ? 6 : dow - 1; // convert to Mon=0
            const day  = DAYS[dayIdx];
            return day ? `${day}-${hour}` : null;
          })()
        : null;

    // ── Measure container width ──────────────────────────────────────────────
    useEffect(() => {
        if (!containerRef.current) return;
        const ro = new ResizeObserver((entries) => {
            setWidth(entries[0].contentRect.width);
        });
        ro.observe(containerRef.current);
        setWidth(containerRef.current.getBoundingClientRect().width);
        return () => ro.disconnect();
    }, []);

    // ── Derived cell dimensions ──────────────────────────────────────────────
    const cellW = useMemo(() => {
        if (width === 0) return 0;
        const available = width - PADDING * 2 - LABEL_W - CELL_GAP;
        return Math.floor((available - CELL_GAP * 23) / 24);
    }, [width]);

    // ── Memoised cell lookup map ─────────────────────────────────────────────
    const cellMap = useMemo(() => {
        const map = new Map<string, HeatCell>();
        for (const cell of MOCK_HEATMAP) {
            map.set(`${cell.day}-${cell.hour}`, cell);
        }
        return map;
    }, []);

    // ── Insights ─────────────────────────────────────────────────────────────
    const insights = useMemo(() => generateInsights(cellMap, selectedNode?.id ?? null), [cellMap, selectedNode]);

    // ── Click handler ────────────────────────────────────────────────────────
    const handleCellClick = (cell: HeatCell) => {
        if (cell.value === 0) return;

        // Build a Date for this day+hour in the current week
        const now    = new Date();
        const dayIdx = DAYS.indexOf(cell.day);          // 0=Mon
        const dow    = now.getDay();                     // 0=Sun
        const diff   = dayIdx - (dow === 0 ? 6 : dow - 1);
        const from   = new Date(now);
        from.setDate(now.getDate() + diff);
        from.setHours(cell.hour, 0, 0, 0);
        const to = new Date(from);
        to.setHours(cell.hour + 1, 0, 0, 0);

        // Set custom time range — stay in Time mode so user sees the context panel
        // (ContextPanel has "Explore Flows in Journey" button for Journey navigation)
        setTimeRange({ preset: "custom", custom: { from, to } });
        // Don't auto-navigate — let user choose via ContextPanel buttons
    };

    // ── SVG dimensions ───────────────────────────────────────────────────────
    const svgW = width - PADDING * 2;
    const svgH = HOUR_H + DAYS.length * (ROW_H + CELL_GAP);

    return (
        <div className="w-full h-full flex overflow-hidden">
            {/* ── Heatmap (left, scrollable) ───────────────────────── */}
            <div className="flex-1 overflow-y-auto min-w-0">
            <div ref={containerRef} className="w-full px-6 py-6 flex flex-col gap-6">

                {/* ── Header ──────────────────────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
                >
                    <h2 className="text-[20px] font-bold tracking-tight text-label">
                        {selectedNode
                            ? `Analyzing temporal behavior for ${selectedNode.label}`
                            : "Activity Heatmap"}
                    </h2>
                    <div className="flex items-center justify-between mt-1 gap-4">
                        <p className="text-[13px]" style={{ color: "rgba(255,255,255,0.45)" }}>
                            {selectedNode
                                ? <>Showing activity for: <span className="font-semibold text-emerald">{selectedNode.label}</span></>
                                : "When your activity is highest — click any cell to explore in Journey"}
                        </p>
                        {/* View mode toggle */}
                        <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-white/[0.04] border border-white/[0.07] flex-shrink-0">
                            {(["activity", "categories"] as ViewMode[]).map((m) => (
                                <button key={m} onClick={() => setViewMode(m)}
                                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors duration-150 capitalize ${viewMode === m ? "bg-white/[0.10] text-label" : "text-label-tertiary hover:text-label-secondary"}`}>
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* Node activity summary */}
                    {selectedNode && nodeActiveCells && nodeActiveCells.size > 0 && insights.nodeInsight && (
                        <p className="text-[12px] mt-1" style={{ color: "rgba(255,255,255,0.32)" }}>
                            {insights.nodeInsight}
                        </p>
                    )}
                </motion.div>

                {/* ── Grid ────────────────────────────────────────────── */}
                {width > 0 && cellW > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="relative"
                        onMouseLeave={() => {
                            setTooltip(null);
                            setHoveredKey(null);
                        }}
                    >
                        <svg
                            width={svgW}
                            height={svgH}
                            style={{ overflow: "visible" }}
                        >
                            {/* ── Hour labels (top) ─────────────────── */}
                            {HOURS.map((h) => {
                                if (!HOUR_LABELS[h]) return null;
                                const x = LABEL_W + h * (cellW + CELL_GAP) + cellW / 2;
                                return (
                                    <text
                                        key={h}
                                        x={x}
                                        y={HOUR_H - 6}
                                        textAnchor="middle"
                                        fontSize={9}
                                        fill="rgba(255,255,255,0.30)"
                                        fontFamily="Inter, sans-serif"
                                        style={{ userSelect: "none" }}
                                    >
                                        {HOUR_LABELS[h]}
                                    </text>
                                );
                            })}

                            {/* ── Rows ──────────────────────────────── */}
                            {DAYS.map((day, di) => {
                                const y = HOUR_H + di * (ROW_H + CELL_GAP);

                                return (
                                    <g key={day}>
                                        {/* Day label */}
                                        <text
                                            x={LABEL_W - 8}
                                            y={y + ROW_H / 2}
                                            textAnchor="end"
                                            dominantBaseline="middle"
                                            fontSize={11}
                                            fontWeight={500}
                                            fill="rgba(255,255,255,0.40)"
                                            fontFamily="Inter, sans-serif"
                                            style={{ userSelect: "none" }}
                                        >
                                            {day}
                                        </text>

                                        {/* Cells */}
                                        {HOURS.map((h) => {
                                            const key        = `${day}-${h}`;
                                            const cell       = cellMap.get(key)!;
                                            const x          = LABEL_W + h * (cellW + CELL_GAP);
                                            const isHovered   = hoveredKey === key;
                                            const isSelected  = selectedKey === key;
                                            const isNodeActive = nodeActiveCells ? nodeActiveCells.has(key) : true;
                                            const isSearchActive = searchActiveCells ? searchActiveCells.has(key) : true;
                                            const isDimmed = (nodeActiveCells && !nodeActiveCells.has(key)) || (!isSearchActive);

                                            // Analytics for category mode + session cluster indicator
                                            const analytics = isHovered || viewMode === "categories"
                                                ? buildCellAnalytics(day, h, selectedNode?.id ?? null)
                                                : null;

                                            // ── Fill based on context ─────────────────────────────
                                            // If node selected: color by node activity intensity, not generic total
                                            // If no node: color by generic activity or category
                                            let baseColor: string;
                                            if (nodeActivityMap) {
                                                const nodeData = nodeActivityMap.get(key);
                                                if (nodeData) {
                                                    // Node was active here — use node-specific intensity
                                                    const t = nodeData.mins / nodeActivityMax;
                                                    const color = CATEGORY_COLORS[
                                                        ALL_EVENTS.find((e) => e.label === selectedNode!.id)?.category ?? "dev"
                                                    ];
                                                    const r = parseInt(color.slice(1, 3), 16);
                                                    const g = parseInt(color.slice(3, 5), 16);
                                                    const b = parseInt(color.slice(5, 7), 16);
                                                    baseColor = `rgba(${r},${g},${b},${0.25 + t * 0.75})`;
                                                } else {
                                                    // Node not active here — heavily dimmed
                                                    baseColor = cell.value > 0
                                                        ? "rgba(255,255,255,0.04)"
                                                        : "rgba(255,255,255,0.02)";
                                                }
                                            } else if (viewMode === "categories" && analytics) {
                                                baseColor = categoryColor(analytics.dominantCat, analytics.catIntensity);
                                            } else {
                                                baseColor = activityColor(cell.value, MAX_VALUE);
                                            }

                                            // Search focus dimming override
                                            if (!isSearchActive && !isSelected) {
                                                baseColor = cell.value > 0
                                                    ? "rgba(255,255,255,0.04)"
                                                    : "rgba(255,255,255,0.02)";
                                            }

                                            const fill = isSelected
                                                ? "rgba(52,211,153,0.80)"
                                                : isHovered && !isDimmed && cell.value > 0
                                                ? "rgba(52,211,153,0.60)"
                                                : baseColor;

                                            const filterStyle = isSelected
                                                ? "drop-shadow(0 0 5px rgba(52,211,153,0.9))"
                                                : !isDimmed && cell.value > 0 && isHovered
                                                ? "drop-shadow(0 0 4px rgba(52,211,153,0.7))"
                                                : "none";

                                            // Session cluster indicator: small corner dot for high-session cells
                                            const showCluster = cell.value > 0 && !isDimmed &&
                                                (analytics?.sessionCount ?? 0) >= 3;

                                            return (
                                                <g key={key}>
                                                    <rect
                                                        x={x} y={y} width={cellW} height={ROW_H} rx={CELL_R}
                                                        fill={fill}
                                                        style={{
                                                            cursor:     cell.value > 0 ? "pointer" : "default",
                                                            filter:     filterStyle,
                                                            transition: "fill 0.15s ease",
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            setHoveredKey(key);
                                                            const rect = containerRef.current?.getBoundingClientRect();
                                                            if (!rect) return;
                                                            const a = buildCellAnalytics(day, h, selectedNode?.id ?? null);
                                                            setTooltip({ cell, analytics: a, x: e.clientX - rect.left, y: e.clientY - rect.top });
                                                        }}
                                                        onMouseMove={(e) => {
                                                            const rect = containerRef.current?.getBoundingClientRect();
                                                            if (!rect) return;
                                                            setTooltip((prev) => prev ? { ...prev, x: e.clientX - rect.left, y: e.clientY - rect.top } : prev);
                                                        }}
                                                        onMouseLeave={() => { setHoveredKey(null); setTooltip(null); }}
                                                        onClick={() => handleCellClick(cell)}
                                                    />
                                                    {/* Selected border ring */}
                                                    {isSelected && (
                                                        <rect x={x-1} y={y-1} width={cellW+2} height={ROW_H+2} rx={CELL_R+1}
                                                            fill="none" stroke="rgba(52,211,153,0.9)" strokeWidth={1.5}
                                                            style={{ pointerEvents: "none" }} />
                                                    )}
                                                    {/* Node-active border glow */}
                                                    {isNodeActive && !isDimmed && !isSelected && cell.value > 0 && (
                                                        <rect x={x-0.5} y={y-0.5} width={cellW+1} height={ROW_H+1} rx={CELL_R+0.5}
                                                            fill="none" stroke="rgba(52,211,153,0.45)" strokeWidth={1}
                                                            style={{ pointerEvents: "none" }} />
                                                    )}
                                                    {/* Session cluster dot */}
                                                    {showCluster && (
                                                        <circle cx={x + cellW - 3} cy={y + 3} r={2}
                                                            fill="rgba(255,255,255,0.55)"
                                                            style={{ pointerEvents: "none" }} />
                                                    )}
                                                </g>
                                            );
                                        })}
                                    </g>
                                );
                            })}
                        </svg>

                        {/* ── Rich tooltip ──────────────────────────── */}
                        {tooltip && tooltip.analytics.totalMins > 0 && (
                            <motion.div
                                key={`${tooltip.cell.day}-${tooltip.cell.hour}`}
                                initial={{ opacity: 0, scale: 0.94, y: 4 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ duration: 0.12 }}
                                className="absolute z-20 pointer-events-none rounded-[12px] border backdrop-blur-xl text-[12px]"
                                style={{
                                    left:        tooltip.x + 14,
                                    top:         tooltip.y - 8,
                                    background:  "rgba(10,10,11,0.92)",
                                    borderColor: tooltip.analytics.dominantCat
                                        ? (CATEGORY_COLORS[tooltip.analytics.dominantCat] + "44")
                                        : "rgba(52,211,153,0.25)",
                                    boxShadow:   "0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
                                    minWidth:    180,
                                    maxWidth:    220,
                                    padding:     "10px 12px",
                                }}
                            >
                                {/* Header */}
                                <p className="font-semibold text-emerald text-[13px]">
                                    {tooltip.cell.day} · {formatHour(tooltip.cell.hour)}
                                </p>
                                <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>
                                    {tooltip.analytics.totalMins} mins · {tooltip.analytics.sessionCount} session{tooltip.analytics.sessionCount !== 1 ? "s" : ""}
                                </p>

                                {/* Top sites */}
                                {tooltip.analytics.topSites.length > 0 && (
                                    <div className="mt-2 pt-2 border-t border-white/[0.08]">
                                        <p className="text-[10px] font-bold uppercase tracking-wider mb-1"
                                            style={{ color: "rgba(255,255,255,0.30)" }}>Top Sites</p>
                                        {tooltip.analytics.topSites.map((site) => (
                                            <p key={site} className="text-[11px]" style={{ color: "rgba(255,255,255,0.65)" }}>
                                                · {site}
                                            </p>
                                        ))}
                                    </div>
                                )}

                                {/* Category + pattern */}
                                <div className="mt-2 pt-2 border-t border-white/[0.08] flex items-center justify-between gap-2">
                                    {tooltip.analytics.dominantCat && (
                                        <span className="text-[10px] font-semibold capitalize px-1.5 py-0.5 rounded-md"
                                            style={{
                                                backgroundColor: CATEGORY_COLORS[tooltip.analytics.dominantCat] + "22",
                                                color:           CATEGORY_COLORS[tooltip.analytics.dominantCat],
                                            }}>
                                            {tooltip.analytics.dominantCat}
                                        </span>
                                    )}
                                    <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.38)" }}>
                                        {tooltip.analytics.pattern}
                                    </span>
                                </div>

                                {/* CTA */}
                                <p className="text-[10px] mt-2" style={{ color: "rgba(52,211,153,0.6)" }}>
                                    {selectedKey === `${tooltip.cell.day}-${tooltip.cell.hour}`
                                        ? "Selected — viewing in Journey"
                                        : "Click to explore in Journey →"}
                                </p>
                            </motion.div>
                        )}
                        {/* Empty cell tooltip */}
                        {tooltip && tooltip.analytics.totalMins === 0 && (
                            <motion.div
                                key={`empty-${tooltip.cell.day}-${tooltip.cell.hour}`}
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.1 }}
                                className="absolute z-20 pointer-events-none px-3 py-2 rounded-[10px] border backdrop-blur-xl text-[12px]"
                                style={{ left: tooltip.x + 14, top: tooltip.y - 8, background: "rgba(10,10,11,0.88)", borderColor: "rgba(255,255,255,0.08)", whiteSpace: "nowrap" }}>
                                <span className="font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>
                                    {tooltip.cell.day} · {formatHour(tooltip.cell.hour)}
                                </span>
                                <span className="ml-2 text-[11px]" style={{ color: "rgba(255,255,255,0.28)" }}>No activity</span>
                            </motion.div>
                        )}
                    </motion.div>
                )}

                {/* ── Legend ──────────────────────────────────────────── */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.25 }}
                    className="flex items-center gap-3" style={{ marginLeft: LABEL_W }}>
                    {viewMode === "activity" ? (
                        <>
                            <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.28)" }}>Less</span>
                            {[0, 0.2, 0.4, 0.6, 0.8, 1].map((t) => (
                                <div key={t} className="rounded-[3px]"
                                    style={{ width: 14, height: 14, backgroundColor: activityColor(Math.round(t * MAX_VALUE), MAX_VALUE), border: "1px solid rgba(255,255,255,0.06)" }} />
                            ))}
                            <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.28)" }}>More</span>
                        </>
                    ) : (
                        <>
                            {(Object.entries(CATEGORY_COLORS) as [string, string][]).map(([cat, color]) => (
                                <div key={cat} className="flex items-center gap-1.5">
                                    <div className="w-3 h-3 rounded-[3px]" style={{ backgroundColor: color + "99" }} />
                                    <span className="text-[11px] capitalize" style={{ color: "rgba(255,255,255,0.45)" }}>{cat}</span>
                                </div>
                            ))}
                        </>
                    )}
                    {/* Cluster indicator legend */}
                    <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-white/[0.08]">
                        <svg width="10" height="10"><circle cx="8" cy="2" r="2" fill="rgba(255,255,255,0.55)" /></svg>
                        <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.28)" }}>3+ sessions</span>
                    </div>
                </motion.div>

                {/* ── Insights panel ───────────────────────────────────── */}
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}
                    className="grid grid-cols-2 gap-3">
                    {[
                        { label: "Peak Focus Window",    value: insights.peakWindow,       color: "#34d399", sub: "Highest consecutive activity" },
                        { label: "Most Common Behavior", value: insights.commonBehavior,   color: "#22d3ee", sub: "Dominant session type" },
                        { label: "Most Active Site",     value: insights.topNode,          color: "#a78bfa", sub: "By total time spent" },
                        { label: "Late Night Pattern",   value: insights.lateNight,        color: "#f59e0b", sub: "After 10PM behavior" },
                    ].map(({ label, value, color, sub }) => (
                        <div key={label} className="px-4 py-3 rounded-[14px] border"
                            style={{ backgroundColor: `${color}0d`, borderColor: `${color}22` }}>
                            <p className="text-[10px] font-bold uppercase tracking-widest mb-1"
                                style={{ color: "rgba(255,255,255,0.30)" }}>{label}</p>
                            <p className="text-[14px] font-bold leading-tight" style={{ color }}>{value}</p>
                            <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.28)" }}>{sub}</p>
                        </div>
                    ))}
                </motion.div>

                {/* ── Node-specific insight ────────────────────────────── */}
                {insights.nodeInsight && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.4 }}
                        className="px-4 py-3 rounded-[14px] border border-emerald/[0.18] bg-emerald/[0.05]">
                        <p className="text-[11px] font-semibold text-emerald mb-0.5">Node Insight</p>
                        <p className="text-[13px] text-label">{insights.nodeInsight}</p>
                    </motion.div>
                )}

            </div>
            </div>{/* end heatmap scroll */}
        </div>
    );
}
