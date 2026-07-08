/*
 * 🎭 Analogy: This file is the "River Flow Diagram" — it draws
 *   flowing ribbons between websites showing how you navigate
 *   from one to another, with thicker ribbons = more transitions.
 * ✅ Safe to change:
 *    1. NODE_WIDTH and NODE_PAD — adjust the bar width and spacing
 *    2. The MARGIN values — change the padding around the diagram
 *    3. The idle ambient glow animation durations and colors
 * ❌ Never touch: The `SankeyFlow` export name — it's imported by
 *   JourneyView. Renaming it breaks the Flow sub-mode.
 */

"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { sankey, sankeyJustify, sankeyLinkHorizontal, type SankeyNode, type SankeyLink } from "d3-sankey";
import { useSelectedNode, useSetSelectedNode, useTimeRange, useModeActions, useSelectedCategory, useFocusedEntity } from "@/lib/store/modeStore";
import { ALL_EVENTS, CATEGORY_COLORS } from "../data/mockBrowsingEvents";
import { filterEventsByTimeRange }      from "../utils/journey/filterEvents";
import { buildSessions }                from "../utils/journey/buildSessions";
import { buildSankeyData, type SankeyNode as SNode_, type SankeyLink as SLink_ } from "../utils/journey/buildSankeyData";
import { BarChart2 } from "lucide-react";

// ─── d3-sankey augmented types ────────────────────────────────────────────────

type SNode = SankeyNode<SNode_, SLink_>;
type SLink = SankeyLink<SNode_, SLink_>;

interface Tooltip { x: number; y: number; content: React.ReactNode }

// ─── Constants ────────────────────────────────────────────────────────────────

const NODE_WIDTH  = 18;
const NODE_RADIUS = 6;
const NODE_PAD    = 26;
const MARGIN      = { top: 24, right: 90, bottom: 24, left: 90 };

function nodeColor(node: SNode): string {
    return CATEGORY_COLORS[node.category] ?? "#a78bfa";
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SankeyFlow() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [size, setSize]           = useState({ width: 0, height: 0 });
    const [tooltip, setTooltip]     = useState<Tooltip | null>(null);
    const [hoveredNodeId, setHoveredNodeId]   = useState<string | null>(null);
    const [hoveredLinkIdx, setHoveredLinkIdx] = useState<number | null>(null);
    const [mounted, setMounted]     = useState(false);

    const selectedNode     = useSelectedNode();
    const setSelectedNode  = useSetSelectedNode();
    const timeRange        = useTimeRange();
    const { setMode }      = useModeActions();
    const selectedCategory = useSelectedCategory();

    // Double-click detection for Sankey nodes
    const lastClickTime = useRef(0);
    const lastClickId   = useRef<string | null>(null);

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
        const t = setTimeout(() => setMounted(true), 60);
        return () => clearTimeout(t);
    }, []);

    // ── Data pipeline ─────────────────────────────────────────────────────────
    // ORDER: filter events → build sessions → build DAG-safe Sankey data
    const sankeyData = useMemo(() => {
        const filtered  = filterEventsByTimeRange(ALL_EVENTS, timeRange);
        const sessions  = buildSessions(filtered);
        const data      = buildSankeyData(sessions);
        console.log("[SankeyFlow] events:", filtered.length, "sessions:", sessions.length, "links:", data.links.length);
        return data;
    }, [timeRange]);

    // ── Layout ────────────────────────────────────────────────────────────────
    const { nodes, links, isEmpty } = useMemo(() => {
        const empty = { nodes: [] as SNode[], links: [] as SLink[], isEmpty: true };
        const w = size.width  - MARGIN.left - MARGIN.right;
        const h = size.height - MARGIN.top  - MARGIN.bottom;
        if (w <= 0 || h <= 0) return empty;

        const { nodes: rawNodes, links: rawLinks } = sankeyData;

        // FINAL GUARD — never call sankey() on empty data
        if (rawNodes.length === 0 || rawLinks.length === 0) return empty;

        try {
            const layout = sankey<SNode_, SLink_>()
                .nodeId((d) => d.id)   // id === label, matches link source/target
                .nodeAlign(sankeyJustify)
                .nodeWidth(NODE_WIDTH)
                .nodePadding(NODE_PAD)
                .extent([[0, 0], [w, h]]);

            const graph = layout({
                nodes: rawNodes.map((n) => ({ ...n })),
                links: rawLinks.map((l) => ({ ...l })),
            });

            return { nodes: graph.nodes as SNode[], links: graph.links as SLink[], isEmpty: false };
        } catch (err) {
            console.error("[SankeyFlow] layout error:", err);
            return empty;
        }
    }, [size.width, size.height, sankeyData]);

    // ── Focus state detection ─────────────────────────────────────────────────
    const focusedEntity = useFocusedEntity();
    const isCustomTime = timeRange.preset === "custom" && !!timeRange.custom;
    const hasFocus     = !!selectedNode || isCustomTime || !!selectedCategory || !!focusedEntity;

    // ── Time-window active node set ───────────────────────────────────────────
    const timeActiveIds = useMemo(() => {
        if (isCustomTime && timeRange.custom) {
            const { from, to } = timeRange.custom;
            const set = new Set<string>();
            for (const ev of ALL_EVENTS) {
                if (ev.timestamp >= from && ev.timestamp <= to) set.add(ev.label);
            }
            return set;
        }
        if (focusedEntity && focusedEntity.type === "time") {
            const set = new Set<string>();
            let evs = ALL_EVENTS;
            if (focusedEntity.day) {
                const dow = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].indexOf(focusedEntity.day);
                evs = evs.filter((e) => e.timestamp.getDay() === dow);
            }
            if (focusedEntity.hours) {
                evs = evs.filter((e) => focusedEntity.hours!.includes(e.timestamp.getHours()));
            }
            for (const e of evs) set.add(e.label);
            return set;
        }
        return null;
    }, [isCustomTime, timeRange, focusedEntity]);

    // ── Connected set (node selection + category selection + search journey) ──────────────────
    const highlightId = hoveredNodeId ?? selectedNode?.id ?? (focusedEntity?.type === "node" ? focusedEntity.id : null);
    const highlightCategory = selectedCategory ?? (focusedEntity?.type === "category" ? focusedEntity.category : null);

    const connectedIds = useMemo(() => {
        if (focusedEntity?.type === "journey" && !highlightId) {
            return new Set<string>([focusedEntity.source, focusedEntity.target]);
        }
        if (highlightCategory && !highlightId) {
            const set = new Set<string>();
            for (const n of sankeyData.nodes) {
                if (n.category === highlightCategory) set.add(n.id);
            }
            for (const l of sankeyData.links) {
                const src = l.source as string;
                const tgt = l.target as string;
                if (set.has(src)) set.add(tgt);
                if (set.has(tgt)) set.add(src);
            }
            return set.size > 0 ? set : null;
        }
        if (!highlightId) return null;
        const set = new Set<string>([highlightId]);
        for (const l of sankeyData.links) {
            if (l.source === highlightId) set.add(l.target);
            if (l.target === highlightId) set.add(l.source);
        }
        return set;
    }, [highlightId, highlightCategory, focusedEntity, sankeyData.nodes, sankeyData.links]);

    // ── Node opacity ──────────────────────────────────────────────────────────
    const nodeOpacity = useCallback((node: SNode): number => {
        if (hoveredNodeId) {
            return connectedIds?.has(node.id) ? 1 : 0.06;
        }
        if (connectedIds && timeActiveIds) {
            return (connectedIds.has(node.id) && timeActiveIds.has(node.id)) ? 1 : 0.05;
        }
        if (connectedIds) {
            return connectedIds.has(node.id) ? 1 : 0.06;
        }
        if (timeActiveIds) {
            return timeActiveIds.has(node.id) ? 1 : 0.06;
        }
        return 1;
    }, [hoveredNodeId, connectedIds, timeActiveIds]);

    // ── Link opacity ──────────────────────────────────────────────────────────
    const linkOpacity = useCallback((link: SLink, idx: number): number => {
        const src = (link.source as SNode).id;
        const tgt = (link.target as SNode).id;

        if (hoveredLinkIdx === idx) return 0.92;

        if (hoveredNodeId) {
            return connectedIds?.has(src) && connectedIds?.has(tgt) ? 0.72 : 0.03;
        }

        if (focusedEntity && focusedEntity.type === "journey") {
            const isJourneyFlow = (src === focusedEntity.source && tgt === focusedEntity.target);
            return isJourneyFlow ? 0.90 : 0.025;
        }

        if (connectedIds && timeActiveIds) {
            const nodeMatch = connectedIds.has(src) && connectedIds.has(tgt);
            const timeMatch = timeActiveIds.has(src) && timeActiveIds.has(tgt);
            return nodeMatch && timeMatch ? 0.78 : 0.025;
        }

        if (connectedIds) {
            return connectedIds.has(src) && connectedIds.has(tgt) ? 0.75 : 0.03;
        }

        if (timeActiveIds) {
            return timeActiveIds.has(src) && timeActiveIds.has(tgt) ? 0.70 : 0.03;
        }

        const base = link.value ?? 1;
        return Math.min(0.28 + (base / 20) * 0.12, 0.38);
    }, [hoveredNodeId, hoveredLinkIdx, connectedIds, timeActiveIds, focusedEntity]);

    const linkColor = useCallback((link: SLink) => {
        return nodeColor(link.source as SNode);
    }, []);

    // ── Node click handler (single = select, double = time mode) ─────────────
    const handleNodeClick = useCallback((nodeId: string, nodeLabel: string) => {
        const now = Date.now();
        const isDouble = now - lastClickTime.current < 350 && lastClickId.current === nodeId;
        lastClickTime.current = now;
        lastClickId.current   = nodeId;

        if (isDouble) {
            // Double-click → switch to Time mode, keep selectedNode set
            setSelectedNode({ id: nodeId, label: nodeLabel, type: "domain" });
            setMode("time", "journey");
        } else {
            // Single click → toggle selection only, no mode switch
            selectedNode?.id === nodeId
                ? setSelectedNode(null)
                : setSelectedNode({ id: nodeId, label: nodeLabel, type: "domain" });
        }
    }, [selectedNode, setSelectedNode, setMode]);
    const showLinkTip = useCallback((e: React.MouseEvent, link: SLink) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        const src = link.source as SNode;
        const tgt = link.target as SNode;
        setTooltip({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            content: (
                <>
                    <span className="font-semibold" style={{ color: nodeColor(src) }}>{src.label}</span>
                    <span className="text-label-tertiary mx-1.5">→</span>
                    <span className="font-semibold" style={{ color: nodeColor(tgt) }}>{tgt.label}</span>
                    <span className="block mt-1 text-label-tertiary">{link.value} transitions</span>
                </>
            ),
        });
    }, []);

    const showNodeTip = useCallback((e: React.MouseEvent, node: SNode) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        const inV  = (node.targetLinks ?? []).reduce((s, l) => s + (l.value ?? 0), 0);
        const outV = (node.sourceLinks ?? []).reduce((s, l) => s + (l.value ?? 0), 0);
        setTooltip({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            content: (
                <>
                    <span className="font-semibold" style={{ color: nodeColor(node) }}>{node.label}</span>
                    <span className="block mt-1 text-label-tertiary capitalize">{node.category}</span>
                    {inV  > 0 && <span className="block text-label-tertiary">↓ {inV} in</span>}
                    {outV > 0 && <span className="block text-label-tertiary">↑ {outV} out</span>}
                    <span className="block mt-1.5 text-[10px]" style={{ color: nodeColor(node) + "99" }}>Click to select · Double-click → Time mode</span>
                </>
            ),
        });
    }, []);

    // ── Empty state ───────────────────────────────────────────────────────────
    if (size.width > 0 && isEmpty) {
        return (
            <div ref={containerRef} className="w-full h-full flex items-center justify-center">
                <p className="text-label-tertiary text-[14px]">
                    {timeRange.preset === "custom"
                        ? "No browsing flows in this time window"
                        : "No journey data available"}
                </p>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="w-full h-full relative overflow-hidden">
            {/* ── Idle ambient glow — only when no filter active ────── */}
            <AnimatePresence>
                {!hasFocus && mounted && (
                    <motion.div
                        key="idle-glow"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6 }}
                        className="absolute inset-0 pointer-events-none z-0"
                        style={{ mixBlendMode: "screen" }}
                    >
                        {/* Soft radial glows at the corners — give the graph a living feel */}
                        <motion.div
                            animate={{ scale: [1, 1.08, 1], opacity: [0.18, 0.28, 0.18] }}
                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute top-0 left-1/4 w-64 h-64 rounded-full"
                            style={{ background: "radial-gradient(circle, rgba(34,211,238,0.35), transparent 70%)", filter: "blur(40px)", transform: "translate(-50%, -40%)" }}
                        />
                        <motion.div
                            animate={{ scale: [1, 1.06, 1], opacity: [0.15, 0.25, 0.15] }}
                            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                            className="absolute bottom-0 right-1/4 w-56 h-56 rounded-full"
                            style={{ background: "radial-gradient(circle, rgba(167,139,250,0.30), transparent 70%)", filter: "blur(40px)", transform: "translate(50%, 40%)" }}
                        />
                        <motion.div
                            animate={{ scale: [1, 1.05, 1], opacity: [0.12, 0.20, 0.12] }}
                            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 3 }}
                            className="absolute top-1/2 left-1/2 w-48 h-48 rounded-full"
                            style={{ background: "radial-gradient(circle, rgba(52,211,153,0.20), transparent 70%)", filter: "blur(50px)", transform: "translate(-50%, -50%)" }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Context labels */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1.5 pointer-events-none">
                <AnimatePresence>
                    {timeRange.preset === "custom" && timeRange.custom && (
                        <motion.div key="time" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald/25 bg-emerald/[0.08] backdrop-blur-xl">
                            <span className="text-[11px] text-label-tertiary">Time:</span>
                            <span className="text-[11px] font-semibold text-emerald">
                                {(() => {
                                    const { from, to } = timeRange.custom!;
                                    const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
                                    const fmtH = (d: Date) => { const h = d.getHours(); return h === 0 ? "12AM" : h === 12 ? "12PM" : h < 12 ? `${h}AM` : `${h-12}PM`; };
                                    return `${days[from.getDay()]} ${fmtH(from)} – ${fmtH(to)}`;
                                })()}
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
                <AnimatePresence>
                    {selectedNode && (
                        <motion.div key={selectedNode.id} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/[0.12] bg-white/[0.06] backdrop-blur-xl">
                            <span className="text-[11px] text-label-tertiary">Filtering for:</span>
                            <span className="text-[11px] font-semibold" style={{ color: CATEGORY_COLORS[sankeyData.nodes.find((n) => n.id === selectedNode.id)?.category ?? "dev"] }}>
                                {selectedNode.label}
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* SVG */}
            <motion.svg width={size.width} height={size.height}
                initial={{ opacity: 0 }} animate={{ opacity: mounted && size.width > 0 ? 1 : 0 }}
                transition={{ duration: 0.5 }}
                onMouseLeave={() => { setTooltip(null); setHoveredNodeId(null); setHoveredLinkIdx(null); }}>
                <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
                    {/* Links */}
                    {links.map((link, idx) => {
                        const path  = sankeyLinkHorizontal()(link as any) ?? "";
                        const color = linkColor(link);
                        const op    = linkOpacity(link, idx);
                        const w     = Math.max(1, link.width ?? 1);
                        const src   = (link.source as SNode).id;
                        const tgt   = (link.target as SNode).id;
                        const isActive = !!connectedIds?.has(src) && !!connectedIds?.has(tgt);
                        const glowFilter = hasFocus && isActive
                            ? `drop-shadow(0 0 3px ${color}88)`
                            : "none";
                        return (
                            <motion.path key={idx} d={path} fill="none" stroke={color} strokeWidth={w}
                                initial={{ pathLength: 0, strokeOpacity: 0 }}
                                animate={{ pathLength: 1, strokeOpacity: op }}
                                transition={{
                                    pathLength:    { duration: 0.8, ease: "easeInOut", delay: idx * 0.015 },
                                    strokeOpacity: { duration: 0.35, ease: "easeOut" },
                                }}
                                style={{ cursor: "pointer", filter: glowFilter }}
                                onMouseEnter={(e) => { setHoveredLinkIdx(idx); showLinkTip(e, link); }}
                                onMouseMove={(e) => showLinkTip(e, link)}
                                onMouseLeave={() => { setHoveredLinkIdx(null); setTooltip(null); }} />
                        );
                    })}

                    {/* Nodes */}
                    {nodes.map((node) => {
                        const x0 = node.x0 ?? 0, x1 = node.x1 ?? 0;
                        const y0 = node.y0 ?? 0, y1 = node.y1 ?? 0;
                        const color  = nodeColor(node);
                        const op     = nodeOpacity(node);
                        const h      = Math.max(4, y1 - y0);
                        const isSel  = selectedNode?.id === node.id;
                        const isHov  = hoveredNodeId === node.id;
                        // Is this node in the active connected set (but not the selected node itself)?
                        const isConn = !isSel && !!connectedIds?.has(node.id);
                        // Is any focus active at all?
                        const focusActive = hasFocus || !!hoveredNodeId;
                        const depth  = node.depth ?? 0;
                        const labelX = depth === 0 ? x0 - 12 : x1 + 12;
                        const anchor: "start" | "end" = depth === 0 ? "end" : "start";

                        // Label visibility:
                        // - Selected node: always show, large + colored
                        // - Connected nodes: show when focus active, medium
                        // - Unrelated nodes: hide when focus active
                        const showLabel = isSel || isHov || isConn || !focusActive;
                        const labelSize = isSel ? 14 : isConn ? 11 : 12;
                        const labelWeight = isSel ? 700 : isConn ? 600 : 500;
                        const labelFill = isSel
                            ? color
                            : isHov
                            ? color
                            : isConn
                            ? "rgba(255,255,255,0.82)"
                            : "rgba(255,255,255,0.65)";

                        return (
                            <g key={node.id}
                                style={{ cursor: "pointer", opacity: op, transition: "opacity 0.3s ease" }}
                                onMouseEnter={(e) => { setHoveredNodeId(node.id); showNodeTip(e, node); }}
                                onMouseMove={(e) => showNodeTip(e, node)}
                                onMouseLeave={() => { setHoveredNodeId(null); setTooltip(null); }}
                                onClick={() => handleNodeClick(node.id, node.label)}>

                                {/* ── Selected node: large ambient glow ── */}
                                {isSel && (
                                    <motion.rect
                                        x={x0 - 14} y={y0 - 14}
                                        width={x1 - x0 + 28} height={h + 28}
                                        rx={NODE_RADIUS + 8}
                                        fill={color} fillOpacity={0}
                                        style={{ filter: `blur(18px)` }}
                                        animate={{ fillOpacity: [0.22, 0.38, 0.22] }}
                                        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                                    />
                                )}

                                {/* ── Connected node: subtle glow ── */}
                                {isConn && (
                                    <rect
                                        x={x0 - 6} y={y0 - 6}
                                        width={x1 - x0 + 12} height={h + 12}
                                        rx={NODE_RADIUS + 3}
                                        fill={color} fillOpacity={0.12}
                                        style={{ filter: "blur(8px)" }}
                                    />
                                )}

                                {/* ── Pulse ring (selected only) ── */}
                                {isSel && (
                                    <motion.rect
                                        x={x0 - 6} y={y0 - 6}
                                        width={x1 - x0 + 12} height={h + 12}
                                        rx={NODE_RADIUS + 4}
                                        fill="none" stroke={color} strokeWidth={1.5}
                                        animate={{ opacity: [0.7, 0.15, 0.7] }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                    />
                                )}

                                {/* ── Hover glow ── */}
                                {isHov && !isSel && (
                                    <rect
                                        x={x0 - 4} y={y0 - 4}
                                        width={x1 - x0 + 8} height={h + 8}
                                        rx={NODE_RADIUS + 2}
                                        fill={color} fillOpacity={0.18}
                                        style={{ filter: "blur(8px)" }}
                                    />
                                )}

                                {/* ── Bar ── */}
                                <motion.rect
                                    x={x0} y={y0}
                                    width={x1 - x0} height={h}
                                    rx={NODE_RADIUS}
                                    fill={color}
                                    fillOpacity={isSel ? 1 : isConn ? 0.88 : isHov ? 0.95 : 0.72}
                                    stroke={color}
                                    strokeOpacity={isSel ? 1 : isConn ? 0.65 : isHov ? 0.7 : 0.35}
                                    strokeWidth={isSel ? 2.5 : isConn ? 1.5 : isHov ? 1.5 : 1}
                                    initial={{ scaleY: 0 }}
                                    animate={{ scaleY: 1 }}
                                    transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
                                />

                                {/* ── Label ── */}
                                {showLabel && (
                                    <text
                                        x={labelX} y={y0 + h / 2}
                                        textAnchor={anchor}
                                        dominantBaseline="middle"
                                        fontSize={labelSize}
                                        fontWeight={labelWeight}
                                        fill={labelFill}
                                        style={{
                                            userSelect: "none",
                                            pointerEvents: "none",
                                            transition: "opacity 0.3s ease",
                                            // Glow on selected label
                                            filter: isSel ? `drop-shadow(0 0 6px ${color}cc)` : "none",
                                        }}
                                    >
                                        {node.label}
                                    </text>
                                )}
                            </g>
                        );
                    })}
                </g>
            </motion.svg>

            {/* Tooltip */}
            <AnimatePresence>
                {tooltip && (
                    <motion.div key="tip" initial={{ opacity: 0, scale: 0.95, y: 4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.12 }}
                        className="absolute z-20 px-3 py-2.5 rounded-[12px] border backdrop-blur-xl pointer-events-none text-[12px]"
                        style={{ left: tooltip.x + 14, top: tooltip.y - 10, background: "rgba(10,10,11,0.88)", borderColor: "rgba(255,255,255,0.12)", boxShadow: "0 8px 32px rgba(0,0,0,0.4)", maxWidth: 200 }}>
                        {tooltip.content}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Legend */}
            <div className="absolute bottom-4 left-4 flex flex-col gap-1.5 pointer-events-none">
                {(Object.entries(CATEGORY_COLORS) as [string, string][]).map(([cat, color]) => (
                    <div key={cat} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: color, boxShadow: `0 0 5px ${color}88` }} />
                        <span className="text-[11px] font-medium capitalize" style={{ color: "rgba(255,255,255,0.45)" }}>{cat}</span>
                    </div>
                ))}
            </div>

            {/* ── Selected node action panel ────────────────────────── */}
            <AnimatePresence>
                {selectedNode && (() => {
                    const color = CATEGORY_COLORS[sankeyData.nodes.find((n) => n.id === selectedNode.id)?.category ?? "dev"];
                    // Count events for this node
                    const nodeEvents = ALL_EVENTS.filter((e) => e.label === selectedNode.id);
                    const activeDays = new Set(nodeEvents.map((e) => {
                        const d = e.timestamp.getDay();
                        return ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d];
                    })).size;
                    return (
                        <motion.div
                            key={selectedNode.id}
                            initial={{ opacity: 0, y: 8, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.97 }}
                            transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
                            className="absolute bottom-4 right-4 flex flex-col gap-2
                                       px-4 py-3 rounded-[16px] border backdrop-blur-xl"
                            style={{
                                background:  "rgba(10,10,11,0.88)",
                                borderColor: color + "44",
                                boxShadow:   `0 0 28px ${color}18, inset 0 1px 0 rgba(255,255,255,0.06)`,
                                minWidth:    200,
                            }}
                        >
                            {/* Node name */}
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }} />
                                    <span className="text-[13px] font-semibold" style={{ color }}>
                                        {selectedNode.label}
                                    </span>
                                </div>
                                <button
                                    onClick={() => setSelectedNode(null)}
                                    className="text-[11px] text-label-tertiary hover:text-label
                                               transition-colors duration-150 leading-none"
                                    aria-label="Clear selection"
                                >
                                    ×
                                </button>
                            </div>

                            {/* Stats */}
                            <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.38)" }}>
                                {nodeEvents.length} visits · {activeDays} active day{activeDays !== 1 ? "s" : ""}
                            </p>

                            {/* Action button */}
                            <button
                                onClick={() => {
                                    setSelectedNode({ id: selectedNode.id, label: selectedNode.label, type: "domain" });
                                    setMode("time", "journey");
                                }}
                                className="flex items-center justify-center gap-2 w-full
                                           px-3 py-2 rounded-[10px] border
                                           text-[12px] font-semibold
                                           transition-all duration-150
                                           hover:scale-[1.02] active:scale-[0.98]"
                                style={{
                                    backgroundColor: color + "18",
                                    borderColor:     color + "55",
                                    color,
                                }}
                            >
                                <BarChart2 className="w-3.5 h-3.5 flex-shrink-0" />
                                Analyze Activity Over Time
                            </button>
                        </motion.div>
                    );
                })()}
            </AnimatePresence>
        </div>
    );
}
