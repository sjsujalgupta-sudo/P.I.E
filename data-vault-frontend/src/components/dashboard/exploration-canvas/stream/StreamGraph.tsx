/*
 * 🎭 Analogy: This file is the "Ocean Wave Visualizer" — it
 *   shows how your attention flows between categories over time
 *   as smooth, organic waves that rise and fall.
 * ✅ Safe to change:
 *    1. The MARGIN values — adjust padding around the stream chart
 *    2. The granularity toggle labels ("Hourly" / "Daily")
 *    3. The insight panel tab labels and their icons
 * ❌ Never touch: The `StreamGraph` export name — it's imported
 *   by MainView. Renaming it breaks the Patterns mode entirely.
 */

"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type React from "react";
import * as d3 from "d3";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Clock, Tag, TrendingUp } from "lucide-react";
import {
    useSelectedNode,
    useSelectedCategory,
    useModeActions,
    useFocusedEntity,
} from "@/lib/store/modeStore";
import {
    buildStreamData,
    buildStreamInsights,
    CATEGORIES,
    CATEGORY_COLORS,
    CATEGORY_LABELS,
    type Granularity,
    type StreamPoint,
} from "./stream-data";
import { ALL_EVENTS, type SiteCategory } from "../data/mockBrowsingEvents";
import { buildSessions } from "../utils/journey/buildSessions";

// ─── Constants ────────────────────────────────────────────────────────────────

const MARGIN = { top: 40, right: 24, bottom: 48, left: 24 };

// ─── Tooltip ─────────────────────────────────────────────────────────────────

interface TooltipState {
    x: number;
    y: number;
    category: SiteCategory;
    point: StreamPoint;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function StreamGraph() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [size, setSize]           = useState({ width: 0, height: 0 });
    const [granularity, setGranularity] = useState<Granularity>("hourly");
    const [hoveredCat, setHoveredCat]   = useState<SiteCategory | null>(null);
    const [tooltip, setTooltip]         = useState<TooltipState | null>(null);
    const [mounted, setMounted]         = useState(false);
    const [panelTab, setPanelTab]       = useState<"insights" | "categories" | "trends" | "sessions">("insights");

    const selectedNode     = useSelectedNode();
    const selectedCategory = useSelectedCategory();
    const focusedEntity    = useFocusedEntity();
    const { setMode, setSelectedCategory, setTimeRange } = useModeActions();

    // ── Search focus ─────────────────────────────────────────────────────────
    const searchActiveCategories = useMemo(() => {
        if (!focusedEntity) return null;
        if (focusedEntity.type === "category") {
            return new Set([focusedEntity.category as SiteCategory]);
        }
        if (focusedEntity.type === "node") {
            const ev = ALL_EVENTS.find(e => e.label === focusedEntity.id);
            return ev ? new Set([ev.category]) : new Set();
        }
        if (focusedEntity.type === "journey") {
            const src = ALL_EVENTS.find(e => e.label === focusedEntity.source)?.category;
            const tgt = ALL_EVENTS.find(e => e.label === focusedEntity.target)?.category;
            const set = new Set<SiteCategory>();
            if (src) set.add(src);
            if (tgt) set.add(tgt);
            return set;
        }
        return null;
    }, [focusedEntity]);

    // ── Measure ──────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!containerRef.current) return;
        const ro = new ResizeObserver((entries) => {
            const { width, height } = entries[0].contentRect;
            setSize({ width, height });
        });
        ro.observe(containerRef.current);
        const { width, height } = containerRef.current.getBoundingClientRect();
        setSize({ width, height });
        return () => ro.disconnect();
    }, []);

    useEffect(() => {
        const t = setTimeout(() => setMounted(true), 80);
        return () => clearTimeout(t);
    }, []);

    // ── Data ─────────────────────────────────────────────────────────────────
    const streamPoints = useMemo(
        () => buildStreamData(granularity, selectedNode?.id ?? null),
        [granularity, selectedNode]
    );

    const insights = useMemo(
        () => buildStreamInsights(streamPoints, granularity, selectedNode?.id ?? null),
        [streamPoints, granularity, selectedNode]
    );

    // ── D3 stack ─────────────────────────────────────────────────────────────
    const { series, xScale, yScale } = useMemo(() => {
        const w = size.width  - MARGIN.left - MARGIN.right;
        const h = size.height - MARGIN.top  - MARGIN.bottom;
        if (w <= 0 || h <= 0 || streamPoints.length === 0) {
            return { series: [], xScale: null, yScale: null };
        }

        const stack = d3.stack<StreamPoint>()
            .keys(CATEGORIES)
            .value((d, key) => d[key as SiteCategory])
            .offset(d3.stackOffsetWiggle)
            .order(d3.stackOrderInsideOut);

        const series = stack(streamPoints);

        const xScale = d3.scaleLinear()
            .domain([0, streamPoints.length - 1])
            .range([0, w]);

        const allValues = series.flatMap((s) => s.flatMap((d) => [d[0], d[1]]));
        const yMin = Math.min(...allValues);
        const yMax = Math.max(...allValues);

        const yScale = d3.scaleLinear()
            .domain([yMin, yMax])
            .range([h, 0]);

        return { series, xScale, yScale };
    }, [size.width, size.height, streamPoints]);

    // ── Area generator ────────────────────────────────────────────────────────
    const areaGen = useMemo(() => {
        if (!xScale || !yScale) return null;
        return d3.area<d3.SeriesPoint<StreamPoint>>()
            .x((_, i) => xScale(i))
            .y0((d) => yScale(d[0]))
            .y1((d) => yScale(d[1]))
            .curve(d3.curveBasis); // smooth organic curves
    }, [xScale, yScale]);

    // ── Interaction ───────────────────────────────────────────────────────────
    const handleStreamHover = useCallback((cat: SiteCategory | null) => {
        setHoveredCat(cat);
    }, []);

    const handleStreamClick = useCallback((cat: SiteCategory, pointIdx: number) => {
        const point = streamPoints[pointIdx];
        if (!point) return;

        // Build a time range for the clicked bucket
        const now = new Date();
        if (granularity === "hourly") {
            const from = new Date(now);
            from.setHours(point.keyNum, 0, 0, 0);
            const to = new Date(from);
            to.setHours(point.keyNum + 1, 0, 0, 0);
            setTimeRange({ preset: "custom", custom: { from, to } });
        }
        // Set category and navigate to TIME mode (not Journey)
        // Time mode will highlight matching cells for this category + window
        setSelectedCategory(cat);
        setMode("time", "stream");
    }, [streamPoints, granularity, setSelectedCategory, setTimeRange, setMode]);

    const handleMouseMove = useCallback((
        e: React.MouseEvent<SVGPathElement>,
        cat: SiteCategory,
        seriesData: d3.Series<StreamPoint, string>
    ) => {
        if (!xScale || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const svgX  = e.clientX - rect.left - MARGIN.left;
        const idx   = Math.round(xScale.invert(svgX));
        const clampedIdx = Math.max(0, Math.min(streamPoints.length - 1, idx));
        const point = streamPoints[clampedIdx];
        if (!point) return;
        setTooltip({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            category: cat,
            point,
        });
    }, [xScale, streamPoints]);

    // ── Render ────────────────────────────────────────────────────────────────
    const w = size.width  - MARGIN.left - MARGIN.right;
    const h = size.height - MARGIN.top  - MARGIN.bottom;

    const activeCat = hoveredCat ?? selectedCategory ?? null;

    return (
        <div className="w-full h-full flex overflow-hidden">
            {/* ── Main stream area ─────────────────────────────────── */}
            <div ref={containerRef} className="flex-1 relative overflow-hidden min-w-0">

                {/* Ambient background glow */}
                <div className="absolute inset-0 pointer-events-none">
                    <motion.div
                        animate={{ opacity: [0.06, 0.12, 0.06] }}
                        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-0"
                        style={{
                            background: "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(167,139,250,0.12), transparent)",
                        }}
                    />
                </div>

                {/* Header */}
                <div className="absolute top-4 left-6 right-6 z-10 flex items-center justify-between">
                    <div>
                        <h2 className="text-[16px] font-semibold text-label tracking-tight">
                            {selectedNode
                                ? `Attention patterns · ${selectedNode.label}`
                                : "Behavioral Rhythm"}
                        </h2>
                        <p className="text-[12px] mt-0.5" style={{ color: "rgba(255,255,255,0.38)" }}>
                            How attention shifts across {granularity === "hourly" ? "hours" : "days"}
                        </p>
                    </div>

                    {/* Granularity toggle */}
                    <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-white/[0.04] border border-white/[0.07]">
                        {(["hourly", "daily"] as Granularity[]).map((g) => (
                            <button key={g} onClick={() => setGranularity(g)}
                                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors duration-150 capitalize
                                    ${granularity === g ? "bg-white/[0.10] text-label" : "text-label-tertiary hover:text-label-secondary"}`}>
                                {g === "hourly" ? "Hourly" : "Daily"}
                            </button>
                        ))}
                    </div>
                </div>

                {/* SVG streamgraph */}
                <motion.svg
                    width={size.width} height={size.height}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: mounted && size.width > 0 ? 1 : 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    onMouseLeave={() => { setHoveredCat(null); setTooltip(null); }}
                >
                    <defs>
                        {CATEGORIES.map((cat) => {
                            const color = CATEGORY_COLORS[cat];
                            return (
                                <linearGradient key={cat} id={`stream-grad-${cat}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%"   stopColor={color} stopOpacity="0.85" />
                                    <stop offset="50%"  stopColor={color} stopOpacity="0.65" />
                                    <stop offset="100%" stopColor={color} stopOpacity="0.40" />
                                </linearGradient>
                            );
                        })}
                        {/* Glow filter for hovered stream */}
                        <filter id="stream-glow">
                            <feGaussianBlur stdDeviation="4" result="blur" />
                            <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
                        {/* X-axis labels */}
                        {xScale && streamPoints.map((p, i) => {
                            // Show every 3rd label for hourly, all for daily
                            const show = granularity === "daily" || i % 3 === 0;
                            if (!show) return null;
                            return (
                                <text key={p.key}
                                    x={xScale(i)} y={h + 28}
                                    textAnchor="middle"
                                    fontSize={10}
                                    fill="rgba(255,255,255,0.30)"
                                    fontFamily="Inter, sans-serif"
                                    style={{ userSelect: "none" }}>
                                    {p.key}
                                </text>
                            );
                        })}

                        {/* Stream layers — render inactive first, active on top */}
                        {areaGen && series.map((s) => {
                            const cat     = s.key as SiteCategory;
                            const color   = CATEGORY_COLORS[cat];
                            
                            // Highlight if explicit hover/select, OR if in search focus
                            let isActive = false;
                            let isDimmed = false;
                            if (activeCat) {
                                isActive = activeCat === cat;
                                isDimmed = !isActive;
                            } else if (searchActiveCategories) {
                                isActive = searchActiveCategories.has(cat);
                                isDimmed = !isActive;
                            } else {
                                isActive = false;
                                isDimmed = false;
                            }

                            const path    = areaGen(s) ?? "";

                            return (
                                <motion.path
                                    key={cat}
                                    d={path}
                                    fill={`url(#stream-grad-${cat})`}
                                    stroke={color}
                                    strokeWidth={isActive ? 1.5 : 0.5}
                                    strokeOpacity={isActive ? 0.6 : 0.2}
                                    initial={{ opacity: 0 }}
                                    animate={{
                                        opacity: isDimmed ? 0.08 : isActive ? 1 : 0.72,
                                        filter: isActive ? "url(#stream-glow)" : "none",
                                    }}
                                    transition={{ duration: 0.35, ease: "easeOut" }}
                                    style={{ cursor: "pointer" }}
                                    onMouseEnter={() => handleStreamHover(cat)}
                                    onMouseMove={(e) => handleMouseMove(e, cat, s)}
                                    onMouseLeave={() => { handleStreamHover(null); setTooltip(null); }}
                                    onClick={(e) => {
                                        if (!xScale || !containerRef.current) return;
                                        const rect = containerRef.current.getBoundingClientRect();
                                        const svgX = e.clientX - rect.left - MARGIN.left;
                                        const idx  = Math.round(xScale.invert(svgX));
                                        handleStreamClick(cat, Math.max(0, Math.min(streamPoints.length - 1, idx)));
                                    }}
                                />
                            );
                        })}

                        {/* Category labels floating on streams */}
                        {xScale && yScale && areaGen && series.map((s) => {
                            const cat = s.key as SiteCategory;
                            const color = CATEGORY_COLORS[cat];

                            let isActive = false;
                            if (activeCat) {
                                isActive = activeCat === cat;
                            } else if (searchActiveCategories) {
                                isActive = searchActiveCategories.has(cat);
                            } else {
                                isActive = true; // All active if nothing focused
                            }
                            if (!isActive) return null;

                            // Find the point with max thickness for label placement
                            let maxThick = 0, maxIdx = Math.floor(streamPoints.length / 2);
                            s.forEach((d, i) => {
                                const thick = Math.abs(d[1] - d[0]);
                                if (thick > maxThick) { maxThick = thick; maxIdx = i; }
                            });
                            const d = s[maxIdx];
                            if (!d) return null;
                            const cx = xScale(maxIdx);
                            const cy = yScale((d[0] + d[1]) / 2);
                            if (!isFinite(cx) || !isFinite(cy)) return null;

                            return (
                                <motion.text key={`label-${cat}`}
                                    x={cx} y={cy}
                                    textAnchor="middle" dominantBaseline="middle"
                                    fontSize={11} fontWeight={600}
                                    fill={color}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 0.85 }}
                                    transition={{ duration: 0.4, delay: 0.2 }}
                                    style={{ userSelect: "none", pointerEvents: "none",
                                        filter: `drop-shadow(0 0 4px ${color}88)` }}>
                                    {CATEGORY_LABELS[cat]}
                                </motion.text>
                            );
                        })}
                    </g>
                </motion.svg>

                {/* Tooltip */}
                <AnimatePresence>
                    {tooltip && (
                        <motion.div
                            key={`${tooltip.category}-${tooltip.point.key}`}
                            initial={{ opacity: 0, scale: 0.94, y: 4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.94 }}
                            transition={{ duration: 0.12 }}
                            className="absolute z-20 pointer-events-none rounded-[14px] border backdrop-blur-xl"
                            style={{
                                left:        Math.min(tooltip.x + 14, size.width - 200),
                                top:         Math.max(tooltip.y - 80, 8),
                                background:  "rgba(10,10,11,0.92)",
                                borderColor: CATEGORY_COLORS[tooltip.category] + "44",
                                boxShadow:   `0 0 24px ${CATEGORY_COLORS[tooltip.category]}18`,
                                padding:     "10px 14px",
                                minWidth:    170,
                            }}
                        >
                            {/* Category + time */}
                            <div className="flex items-center gap-2 mb-1.5">
                                <div className="w-2 h-2 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: CATEGORY_COLORS[tooltip.category] }} />
                                <span className="text-[13px] font-semibold"
                                    style={{ color: CATEGORY_COLORS[tooltip.category] }}>
                                    {CATEGORY_LABELS[tooltip.category]}
                                </span>
                                <span className="text-[11px] ml-auto"
                                    style={{ color: "rgba(255,255,255,0.40)" }}>
                                    {tooltip.point.key}
                                </span>
                            </div>

                            {/* Duration */}
                            <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.65)" }}>
                                {tooltip.point[tooltip.category]} mins active
                            </p>

                            {/* Top nodes */}
                            {(tooltip.point.topNodes[tooltip.category] ?? []).length > 0 && (
                                <div className="mt-1.5 pt-1.5 border-t border-white/[0.08]">
                                    <p className="text-[10px] font-bold uppercase tracking-wider mb-1"
                                        style={{ color: "rgba(255,255,255,0.28)" }}>Top sites</p>
                                    {(tooltip.point.topNodes[tooltip.category] ?? []).map((n) => (
                                        <p key={n} className="text-[11px]"
                                            style={{ color: "rgba(255,255,255,0.60)" }}>· {n}</p>
                                    ))}
                                </div>
                            )}

                            <p className="text-[10px] mt-2"
                                style={{ color: CATEGORY_COLORS[tooltip.category] + "88" }}>
                                Click to analyze in Time mode →
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Empty state */}
                {mounted && size.width > 0 && streamPoints.every((p) => p.total === 0) && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <p className="text-label-tertiary text-[14px]">No activity data available</p>
                    </div>
                )}
            </div>

            {/* ── Insight panel (right) ─────────────────────────────── */}
            <div className="w-[260px] flex-shrink-0 flex flex-col border-l border-white/[0.07]
                            bg-white/[0.015] backdrop-blur-xl overflow-hidden">

                {/* Panel tab bar */}
                <div className="flex-shrink-0 flex border-b border-white/[0.07] bg-white/[0.02]">
                    {([
                        { id: "insights",   icon: TrendingUp,    label: "Insights"    },
                        { id: "categories", icon: Tag,           label: "Categories"  },
                        { id: "trends",     icon: ArrowUpRight,  label: "Trends"      },
                        { id: "sessions",   icon: Clock,         label: "Sessions"    },
                    ] as { id: typeof panelTab; icon: any; label: string }[]).map(({ id, icon: Icon, label }) => {
                        const active = panelTab === id;
                        return (
                            <button key={id} onClick={() => setPanelTab(id)}
                                className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[9px] font-bold uppercase tracking-wider
                                    transition-colors duration-150 border-b-2
                                    ${active
                                        ? "text-accent border-accent/60 bg-accent/[0.06]"
                                        : "text-label-tertiary border-transparent hover:text-label-secondary"
                                    }`}>
                                <Icon className="w-3 h-3" />
                                <span className="hidden sm:block">{label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Panel content */}
                <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3"
                    style={{ scrollbarWidth: "thin" }}>

                    <AnimatePresence mode="wait">
                        {panelTab === "insights" && (
                            <motion.div key="insights"
                                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                transition={{ duration: 0.18 }}
                                className="flex flex-col gap-3">
                                {/* Dominant category */}
                                <div className="px-3 py-2.5 rounded-[12px] border"
                                    style={{ backgroundColor: CATEGORY_COLORS[insights.dominantCategory] + "12", borderColor: CATEGORY_COLORS[insights.dominantCategory] + "30" }}>
                                    <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: "rgba(255,255,255,0.30)" }}>Dominant</p>
                                    <p className="text-[14px] font-semibold capitalize" style={{ color: CATEGORY_COLORS[insights.dominantCategory] }}>
                                        {CATEGORY_LABELS[insights.dominantCategory]}
                                    </p>
                                </div>
                                <InsightCard label="Peak Window"  value={insights.peakWindow}       color="#22d3ee" />
                                <InsightCard label="Trend Shift"  value={insights.trendShift}       color="#a78bfa" />
                                <div className="px-3 py-2.5 rounded-[12px] border border-accent/[0.15] bg-accent/[0.05]">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <TrendingUp className="w-3 h-3 text-accent flex-shrink-0" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-accent">Insight</span>
                                    </div>
                                    <p className="text-[12px] text-label leading-relaxed">{insights.behaviorSummary}</p>
                                </div>
                                {insights.nodeInsight && (
                                    <div className="px-3 py-2.5 rounded-[12px] border border-emerald/[0.18] bg-emerald/[0.05]">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-emerald mb-0.5">Node</p>
                                        <p className="text-[12px] text-label leading-relaxed">{insights.nodeInsight}</p>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {panelTab === "categories" && (
                            <motion.div key="categories"
                                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                transition={{ duration: 0.18 }}
                                className="flex flex-col gap-3">
                                {CATEGORIES.map((cat) => {
                                    const color = CATEGORY_COLORS[cat];
                                    const total = streamPoints.reduce((s, p) => s + p[cat], 0);
                                    const grandTotal = streamPoints.reduce((s, p) => s + p.total, 0);
                                    const pct = grandTotal > 0 ? Math.round((total / grandTotal) * 100) : 0;
                                    const topNodes = streamPoints
                                        .flatMap((p) => p.topNodes[cat] ?? [])
                                        .reduce((m, n) => { m.set(n, (m.get(n) ?? 0) + 1); return m; }, new Map<string, number>());
                                    const top3 = [...topNodes.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([n]) => n);
                                    return (
                                        <div key={cat} className="px-3 py-2.5 rounded-[12px] border"
                                            style={{ backgroundColor: color + "0d", borderColor: color + "25" }}>
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className="text-[12px] font-semibold capitalize" style={{ color }}>{CATEGORY_LABELS[cat]}</span>
                                                <span className="text-[12px] font-bold" style={{ color }}>{pct}%</span>
                                            </div>
                                            <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden mb-2">
                                                <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                                                    transition={{ duration: 0.6, ease: "easeOut" }}
                                                    className="h-full rounded-full" style={{ backgroundColor: color }} />
                                            </div>
                                            {top3.length > 0 && (
                                                <div className="flex flex-col gap-0.5">
                                                    {top3.map((n) => (
                                                        <p key={n} className="text-[10px]" style={{ color: "rgba(255,255,255,0.50)" }}>· {n}</p>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </motion.div>
                        )}

                        {panelTab === "trends" && (
                            <motion.div key="trends"
                                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                transition={{ duration: 0.18 }}
                                className="flex flex-col gap-3">
                                {/* Rising vs declining */}
                                {CATEGORIES.map((cat) => {
                                    const color = CATEGORY_COLORS[cat];
                                    const pts = streamPoints;
                                    const mid = Math.floor(pts.length / 2);
                                    const first = pts.slice(0, mid).reduce((s, p) => s + p[cat], 0) / Math.max(mid, 1);
                                    const second = pts.slice(mid).reduce((s, p) => s + p[cat], 0) / Math.max(pts.length - mid, 1);
                                    const delta = second - first;
                                    const trend = delta > 5 ? "↑ Rising" : delta < -5 ? "↓ Declining" : "→ Stable";
                                    const trendColor = delta > 5 ? "#34d399" : delta < -5 ? "#f472b6" : "rgba(255,255,255,0.45)";
                                    return (
                                        <div key={cat} className="flex items-center justify-between px-3 py-2 rounded-[10px] border border-white/[0.06] bg-white/[0.02]">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                                                <span className="text-[12px] capitalize" style={{ color: "rgba(255,255,255,0.70)" }}>{CATEGORY_LABELS[cat]}</span>
                                            </div>
                                            <span className="text-[11px] font-semibold" style={{ color: trendColor }}>{trend}</span>
                                        </div>
                                    );
                                })}
                                <div className="mt-1 px-3 py-2.5 rounded-[12px] border border-white/[0.08] bg-white/[0.02]">
                                    <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.28)" }}>Time-of-day shifts</p>
                                    <p className="text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
                                        Social browsing increases after 8PM. Development dominates weekday afternoons.
                                    </p>
                                </div>
                            </motion.div>
                        )}

                        {panelTab === "sessions" && (
                            <motion.div key="sessions"
                                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                transition={{ duration: 0.18 }}
                                className="flex flex-col gap-3">
                                {(() => {
                                    const sessions = buildSessions(ALL_EVENTS);
                                    const top = sessions
                                        .map((s) => ({
                                            id: s.id,
                                            duration: s.events.reduce((a, e) => a + e.duration, 0),
                                            sites: [...new Set(s.events.map((e) => e.label))].slice(0, 3),
                                            start: s.events[0]?.timestamp,
                                            cat: s.events[0]?.category ?? "dev",
                                        }))
                                        .sort((a, b) => b.duration - a.duration)
                                        .slice(0, 5);
                                    return top.map((s, i) => {
                                        const color = CATEGORY_COLORS[s.cat];
                                        const fmtH = (d: Date) => { const h = d.getHours(); return h === 0 ? "12AM" : h === 12 ? "12PM" : h < 12 ? `${h}AM` : `${h-12}PM`; };
                                        return (
                                            <div key={s.id} className="px-3 py-2.5 rounded-[12px] border"
                                                style={{ backgroundColor: color + "0d", borderColor: color + "22" }}>
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: color + "cc" }}>
                                                        Session {i + 1}
                                                    </span>
                                                    <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                                                        {s.duration}m · {s.start ? fmtH(s.start) : "—"}
                                                    </span>
                                                </div>
                                                <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.65)" }}>
                                                    {s.sites.join(" → ")}
                                                </p>
                                            </div>
                                        );
                                    });
                                })()}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Category legend / filter */}
                    <div className="pt-3 border-t border-white/[0.06] mt-auto">
                        <p className="text-[10px] font-bold uppercase tracking-wider mb-2"
                            style={{ color: "rgba(255,255,255,0.28)" }}>Filter stream</p>
                        <div className="flex flex-col gap-1.5">
                            {CATEGORIES.map((cat) => {
                                const color   = CATEGORY_COLORS[cat];
                                const isActive = activeCat === cat || !activeCat;
                                return (
                                    <button key={cat}
                                        onClick={() => setHoveredCat(hoveredCat === cat ? null : cat)}
                                        className="flex items-center gap-2 text-left transition-opacity duration-200"
                                        style={{ opacity: isActive ? 1 : 0.35 }}>
                                        <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                                            style={{ backgroundColor: color, boxShadow: `0 0 5px ${color}88` }} />
                                        <span className="text-[11px] font-medium capitalize"
                                            style={{ color: isActive ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.35)" }}>
                                            {CATEGORY_LABELS[cat]}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function InsightCard({ label, value, color }: { label: string; value: string; color: string }) {
    return (
        <div className="px-3 py-2.5 rounded-[12px] border"
            style={{ backgroundColor: color + "0d", borderColor: color + "25" }}>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5"
                style={{ color: "rgba(255,255,255,0.30)" }}>{label}</p>
            <p className="text-[13px] font-semibold leading-tight" style={{ color }}>{value}</p>
        </div>
    );
}
