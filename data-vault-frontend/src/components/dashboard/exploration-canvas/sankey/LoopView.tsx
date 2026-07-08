/*
 * 🎭 Analogy: This file is the "Constellation Map" — it shows
 *   all the websites you visit as stars, with lines connecting
 *   the ones you navigate between most often.
 * ✅ Safe to change:
 *    1. NODE_R_MIN and NODE_R_MAX — adjust the min/max node sizes
 *    2. The COOLDOWN value — lower it to speed up the force simulation
 *    3. The tooltip text content and styling
 * ❌ Never touch: The `LoopView` export name — it's imported by
 *   JourneyView. Renaming it breaks the Loop sub-mode.
 */

"use client";
import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { useSelectedNode, useSetSelectedNode, useTimeRange, useModeActions, useFocusedEntity } from "@/lib/store/modeStore";
import { ALL_EVENTS, CATEGORY_COLORS } from "../data/mockBrowsingEvents";
import { filterEventsByTimeRange }      from "../utils/journey/filterEvents";
import { buildSessions }                from "../utils/journey/buildSessions";
import { buildLoopGraphData, type LoopNode, type LoopLink } from "../utils/journey/buildLoopGraphData";
import { AnimatePresence, motion } from "framer-motion";
import { BarChart2 } from "lucide-react";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

const NODE_R_MIN = 6;
const NODE_R_MAX = 20;
const COOLDOWN   = 150;

function nodeRadius(visits: number, max: number): number {
    return NODE_R_MIN + ((visits / max) * (NODE_R_MAX - NODE_R_MIN));
}

export function LoopView() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [ready, setReady]           = useState(false);
    const hoveredIdRef                = useRef<string | null>(null);
    const [hoveredId, setHoveredId]   = useState<string | null>(null);
    const lastClick                   = useRef(0);

    const selectedNode    = useSelectedNode();
    const setSelectedNode = useSetSelectedNode();
    const timeRange       = useTimeRange();
    const focusedEntity   = useFocusedEntity();
    const { setMode }     = useModeActions();

    const setHovered = useCallback((id: string | null) => {
        hoveredIdRef.current = id;
        setHoveredId(id);
    }, []);

    // ── Data pipeline ─────────────────────────────────────────────────────────
    // Must come before any memo that uses nodes/links
    const { nodes, links, maxVisits } = useMemo(() => {
        const filtered = filterEventsByTimeRange(ALL_EVENTS, timeRange);
        const sessions = buildSessions(filtered);
        const data     = buildLoopGraphData(sessions);
        const max      = Math.max(...data.nodes.map((n) => n.visits), 1);
        console.log("[LoopView] events:", filtered.length, "sessions:", sessions.length, "links:", data.links.length);
        return { ...data, maxVisits: max };
    }, [timeRange]);

    // ── Search focus active node set (depends on nodes + links) ───────────────
    const searchActiveIds = useMemo(() => {
        if (!focusedEntity) return null;
        if (focusedEntity.type === "node") {
            const connected = new Set<string>([focusedEntity.id]);
            for (const l of links) {
                const src = typeof l.source === "object" ? (l.source as LoopNode).id : l.source;
                const tgt = typeof l.target === "object" ? (l.target as LoopNode).id : l.target;
                if (src === focusedEntity.id) connected.add(tgt);
                if (tgt === focusedEntity.id) connected.add(src);
            }
            return connected;
        }
        if (focusedEntity.type === "category") {
            return new Set(nodes.filter((n) => n.category === focusedEntity.category).map((n) => n.id));
        }
        if (focusedEntity.type === "journey") {
            return new Set<string>([focusedEntity.source, focusedEntity.target]);
        }
        if (focusedEntity.type === "time") {
            let evs = ALL_EVENTS;
            if (focusedEntity.day) {
                const dow = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"].indexOf(focusedEntity.day);
                evs = evs.filter((e) => e.timestamp.getDay() === dow);
            }
            if (focusedEntity.hours) {
                evs = evs.filter((e) => focusedEntity.hours!.includes(e.timestamp.getHours()));
            }
            return new Set(evs.map((e) => e.label));
        }
        return null;
    }, [focusedEntity, nodes, links]);

    // ── Connected set (hover / selection + search focus) ──────────────────────
    const connectedIds = useMemo(() => {
        // 1. Explicit hover takes absolute priority to show connections
        if (hoveredId) {
            const set = new Set<string>([hoveredId]);
            for (const l of links) {
                const src = typeof l.source === "object" ? (l.source as LoopNode).id : l.source;
                const tgt = typeof l.target === "object" ? (l.target as LoopNode).id : l.target;
                if (src === hoveredId) set.add(tgt);
                if (tgt === hoveredId) set.add(src);
            }
            return set;
        }
        // 2. Global Search takes priority over legacy selectedNode to prevent neighbor bleed
        if (focusedEntity && searchActiveIds) {
            return searchActiveIds;
        }
        // 3. Legacy selected node
        if (selectedNode) {
            const set = new Set<string>([selectedNode.id]);
            for (const l of links) {
                const src = typeof l.source === "object" ? (l.source as LoopNode).id : l.source;
                const tgt = typeof l.target === "object" ? (l.target as LoopNode).id : l.target;
                if (src === selectedNode.id) set.add(tgt);
                if (tgt === selectedNode.id) set.add(src);
            }
            return set;
        }
        return null;
    }, [hoveredId, selectedNode, links, searchActiveIds, focusedEntity]);

    // ── Measure ───────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!containerRef.current) return;
        const ro = new ResizeObserver((entries) => {
            const { width, height } = entries[0].contentRect;
            setDimensions({ width, height });
        });
        ro.observe(containerRef.current);
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
        return () => ro.disconnect();
    }, []);

    useEffect(() => { const t = setTimeout(() => setReady(true), 80); return () => clearTimeout(t); }, []);

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleHover = useCallback((node: LoopNode | null) => {
        setHovered(node?.id ?? null);
        if (containerRef.current) containerRef.current.style.cursor = node ? "pointer" : "default";
    }, [setHovered]);

    const handleClick = useCallback((node: LoopNode) => {
        const now = Date.now();
        if (now - lastClick.current < 350) {
            // Double-click → time mode
            setSelectedNode({ id: node.id, label: node.label, type: "domain" });
            setMode("time", "journey");
        } else {
            selectedNode?.id === node.id ? setSelectedNode(null) : setSelectedNode({ id: node.id, label: node.label, type: "domain" });
        }
        lastClick.current = now;
    }, [selectedNode, setSelectedNode, setMode]);

    // ── Canvas painters ───────────────────────────────────────────────────────
    const paintNode = useCallback((node: LoopNode, ctx: CanvasRenderingContext2D, gs: number) => {
        const x = (node as any).x as number;
        const y = (node as any).y as number;
        if (!isFinite(x) || !isFinite(y)) return;

        const hid      = hoveredIdRef.current;
        const selId    = selectedNode?.id ?? null;
        const hlId     = hid ?? selId;
        const isSel    = node.id === hlId;
        const isConn   = connectedIds?.has(node.id) ?? false;

        // Dim logic:
        let isDimmed = false;
        if (focusedEntity && searchActiveIds !== null) {
            // If search is active, dim anything outside searchActiveIds, UNLESS explicitly hovered
            isDimmed = !searchActiveIds.has(node.id) && hid !== node.id;
        } else {
            // Normal mode
            isDimmed = !!hlId && !isConn;
        }

        const r        = Math.max(6, nodeRadius(node.visits, maxVisits));
        const color    = CATEGORY_COLORS[node.category] ?? "#a78bfa";

        // Glow
        try {
            const gr = isSel ? r * 3.2 : r * 1.8;
            const ir = Math.min(r * 0.3, gr - 0.1);
            const g  = ctx.createRadialGradient(x, y, ir, x, y, gr);
            g.addColorStop(0, color + (isSel ? "66" : isDimmed ? "0a" : "28"));
            g.addColorStop(1, color + "00");
            ctx.beginPath(); ctx.arc(x, y, gr, 0, 2 * Math.PI);
            ctx.fillStyle = g; ctx.fill();
        } catch { /* skip */ }

        // Circle
        ctx.beginPath(); ctx.arc(x, y, isSel ? r * 1.15 : r, 0, 2 * Math.PI);
        ctx.fillStyle = color + (isDimmed ? "33" : isSel ? "ff" : "99"); ctx.fill();

        // Border
        ctx.beginPath(); ctx.arc(x, y, isSel ? r * 1.15 : r, 0, 2 * Math.PI);
        ctx.strokeStyle = color + (isDimmed ? "22" : isSel ? "ff" : "66");
        ctx.lineWidth = isSel ? 2.5 : 1; ctx.stroke();

        // Label
        if (isSel || isConn) {
            const fs = Math.max(10, 12 / gs);
            ctx.font = `${isSel ? "700" : "500"} ${fs}px Inter, sans-serif`;
            ctx.textAlign = "center"; ctx.textBaseline = "middle";
            const tw = ctx.measureText(node.label).width;
            const px = 5, py = 3;
            const lx = x - tw / 2 - px, ly = y + (isSel ? r * 1.15 : r) + 6;
            const lw = tw + px * 2, lh = fs + py * 2;
            ctx.fillStyle = "rgba(10,10,11,0.82)";
            ctx.beginPath();
            if (ctx.roundRect) { ctx.roundRect(lx, ly, lw, lh, 4); }
            else {
                ctx.moveTo(lx+4,ly); ctx.lineTo(lx+lw-4,ly); ctx.quadraticCurveTo(lx+lw,ly,lx+lw,ly+4);
                ctx.lineTo(lx+lw,ly+lh-4); ctx.quadraticCurveTo(lx+lw,ly+lh,lx+lw-4,ly+lh);
                ctx.lineTo(lx+4,ly+lh); ctx.quadraticCurveTo(lx,ly+lh,lx,ly+lh-4);
                ctx.lineTo(lx,ly+4); ctx.quadraticCurveTo(lx,ly,lx+4,ly); ctx.closePath();
            }
            ctx.fill();
            ctx.fillStyle = isSel ? color : "rgba(255,255,255,0.75)";
            ctx.fillText(node.label, x, ly + lh / 2);
        }
    }, [connectedIds, selectedNode, maxVisits, focusedEntity, searchActiveIds]);

    const paintPointer = useCallback((node: LoopNode, color: string, ctx: CanvasRenderingContext2D) => {
        const x = (node as any).x as number, y = (node as any).y as number;
        if (!isFinite(x) || !isFinite(y)) return;
        const r = Math.max(6, nodeRadius(node.visits, maxVisits)) * 1.6;
        ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI);
        ctx.fillStyle = color; ctx.fill();
    }, [maxVisits]);

    const lColor = useCallback((link: LoopLink) => {
        const hid = hoveredIdRef.current ?? selectedNode?.id ?? null;
        const src = typeof link.source === "object" ? (link.source as LoopNode).id : link.source;
        const tgt = typeof link.target === "object" ? (link.target as LoopNode).id : link.target;
        const conn = hid && (src === hid || tgt === hid);
        if (conn) { const a = Math.round((0.5 + (link.count / 10) * 0.5) * 255).toString(16).padStart(2,"0"); return `#ffffff${a}`; }
        if (hid) return "#ffffff0d";
        // Search focus: highlight links between active nodes, dim all others
        if (focusedEntity && searchActiveIds !== null) {
            if (searchActiveIds.has(src) && searchActiveIds.has(tgt)) {
                const a = Math.round((0.4 + (link.count / 10) * 0.4) * 255).toString(16).padStart(2,"0");
                return `#ffffff${a}`;
            }
            return "#ffffff07";
        }
        const a = Math.round((0.1 + (link.count / 10) * 0.2) * 255).toString(16).padStart(2,"0");
        return `#ffffff${a}`;
    }, [selectedNode, focusedEntity, searchActiveIds]);

    const lWidth = useCallback((link: LoopLink) => {
        const hid = hoveredIdRef.current ?? selectedNode?.id ?? null;
        const src = typeof link.source === "object" ? (link.source as LoopNode).id : link.source;
        const tgt = typeof link.target === "object" ? (link.target as LoopNode).id : link.target;
        const conn = hid && (src === hid || tgt === hid);
        const base = 0.5 + (link.count / 10) * 3;
        return conn ? base * 2 : base * 0.5;
    }, [selectedNode]);

    if (nodes.length === 0) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <p className="text-label-tertiary text-[14px]">No transition data available</p>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="w-full h-full relative overflow-hidden">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: ready && dimensions.width > 0 ? 1 : 0 }}
                transition={{ duration: 0.5 }} className="w-full h-full">
                {dimensions.width > 0 && dimensions.height > 0 && (
                    <ForceGraph2D
                        graphData={{ nodes: nodes as any, links: links as any }}
                        width={dimensions.width} height={dimensions.height}
                        backgroundColor="transparent"
                        cooldownTicks={COOLDOWN} onEngineStop={() => {}}
                        d3AlphaDecay={0.025} d3VelocityDecay={0.35}
                        linkDirectionalArrowLength={5} linkDirectionalArrowRelPos={1}
                        linkCurvature={0.2}
                        nodeCanvasObject={paintNode as any} nodeCanvasObjectMode={() => "replace"}
                        nodePointerAreaPaint={paintPointer as any} nodeRelSize={1}
                        linkColor={lColor as any} linkWidth={lWidth as any}
                        onNodeHover={handleHover as any} onNodeClick={handleClick as any}
                        enableZoomInteraction enablePanInteraction />
                )}
            </motion.div>

            {/* Legend */}
            <div className="absolute bottom-4 left-4 flex flex-col gap-1.5 pointer-events-none">
                {(Object.entries(CATEGORY_COLORS) as [string, string][]).map(([cat, color]) => (
                    <div key={cat} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}88` }} />
                        <span className="text-[11px] font-medium capitalize" style={{ color: "rgba(255,255,255,0.5)" }}>{cat}</span>
                    </div>
                ))}
            </div>

            {/* Search focus banner */}
            {focusedEntity && searchActiveIds !== null && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2
                                px-3 py-1.5 rounded-full border border-accent/25 bg-accent/[0.08] backdrop-blur-xl pointer-events-none">
                    <span className="text-[11px] text-label-tertiary">Focus:</span>
                    <span className="text-[11px] font-semibold text-accent">
                        {focusedEntity.type === "node" ? focusedEntity.label
                            : focusedEntity.type === "category" ? focusedEntity.category
                            : focusedEntity.type === "journey" ? `${focusedEntity.source} → ${focusedEntity.target}`
                            : focusedEntity.value}
                    </span>
                    <span className="text-[10px] text-label-tertiary ml-1">· {searchActiveIds.size} nodes active</span>
                </div>
            )}

            {/* Tooltip */}
            {hoveredId && (() => {
                const node = nodes.find((n) => n.id === hoveredId);
                if (!node) return null;
                const color = CATEGORY_COLORS[node.category];
                const out = links.filter((l) => { const s = typeof l.source === "object" ? (l.source as LoopNode).id : l.source; return s === node.id; }).length;
                const inc = links.filter((l) => { const t = typeof l.target === "object" ? (l.target as LoopNode).id : l.target; return t === node.id; }).length;
                return (
                    <motion.div key={hoveredId} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}
                        className="absolute top-4 right-4 px-3 py-2.5 rounded-[14px] border backdrop-blur-xl pointer-events-none"
                        style={{ background: "rgba(10,10,11,0.88)", borderColor: color + "55", boxShadow: `0 0 24px ${color}22` }}>
                        <p className="text-[13px] font-semibold" style={{ color }}>{node.label}</p>
                        <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>{node.category} · {node.visits} visits</p>
                        <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>↑ {out} out · ↓ {inc} in</p>
                        <p className="text-[10px] mt-1.5 font-medium" style={{ color: color + "88" }}>Double-click → Time mode</p>
                    </motion.div>
                );
            })()}

            {/* ── Selected node action panel ────────────────────────── */}
            <AnimatePresence>
                {selectedNode && (() => {
                    const node = nodes.find((n) => n.id === selectedNode.id);
                    const color = CATEGORY_COLORS[node?.category ?? "dev"];
                    const nodeEvents = ALL_EVENTS.filter((e) => e.label === selectedNode.id);
                    const activeDays = new Set(nodeEvents.map((e) => e.timestamp.getDay())).size;
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
                                    className="text-[11px] text-label-tertiary hover:text-label transition-colors duration-150 leading-none"
                                    aria-label="Clear selection"
                                >×</button>
                            </div>
                            <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.38)" }}>
                                {nodeEvents.length} visits · {activeDays} active day{activeDays !== 1 ? "s" : ""}
                            </p>
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
