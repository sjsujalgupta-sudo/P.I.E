/*
 * 🎭 Analogy: This is the "Star Map" for Overview mode — a force-directed
 *    graph showing all your browsing sites as stars, with lines between
 *    sites you frequently visit together.
 * ✅ Safe to change:
 *    1. Edit MOCK_GRAPH_DATA in network/mock-data.ts to add/remove nodes
 *    2. Change COOLDOWN_TICKS to make the simulation settle faster/slower
 *    3. Change NODE_R_MIN / NODE_R_MAX to resize all nodes
 * ❌ Never touch: The ForceGraph2D dynamic import with ssr:false — removing
 *    ssr:false causes a server-side crash because the canvas API doesn't
 *    exist on the server.
 */
"use client";
import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { useModeActions, useFocusedEntity, type SelectedNode } from "@/lib/store/modeStore";
import { ALL_EVENTS } from "../data/mockBrowsingEvents";
import {
    MOCK_GRAPH_DATA,
    CATEGORY_COLORS,
    type GraphNode,
    type GraphLink,
} from "./mock-data";

// ─── SSR-safe dynamic import ──────────────────────────────────────────────────

const ForceGraph2D = dynamic(
    () => import("react-force-graph-2d"),
    { ssr: false }
);

// ─── Constants ────────────────────────────────────────────────────────────────

const ALWAYS_LABEL_COUNT = 4;

/** Visible radius range mapped from frequency (0–100) */
const NODE_R_MIN = 6;
const NODE_R_MAX = 18;

/**
 * Hit-area multiplier — the pointer area is larger than the visible node so
 * small nodes are easy to click without needing pixel-perfect aim.
 */
const HIT_AREA_MULT = 1.6;

const COOLDOWN_TICKS = 150;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function nodeRadius(frequency: number): number {
    const freq = Math.max(0, Math.min(100, frequency ?? 50));
    return NODE_R_MIN + (freq / 100) * (NODE_R_MAX - NODE_R_MIN);
}

/** Build a Set of node IDs that are directly connected to the hovered node */
function buildConnectedSet(hoveredId: string | null): Set<string> {
    if (!hoveredId) return new Set();
    const connected = new Set<string>([hoveredId]);
    for (const link of MOCK_GRAPH_DATA.links) {
        const src = typeof link.source === "object"
            ? (link.source as GraphNode).id : link.source;
        const tgt = typeof link.target === "object"
            ? (link.target as GraphNode).id : link.target;
        if (src === hoveredId) connected.add(tgt);
        if (tgt === hoveredId) connected.add(src);
    }
    return connected;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function NetworkGraph() {
    const containerRef                 = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions]  = useState({ width: 0, height: 0 });
    const [ready, setReady]            = useState(false);
    const { setSelectedNode, setMode } = useModeActions();
    const focusedEntity                = useFocusedEntity();

    // hoveredId stored in a ref AND state:
    // - ref  → read inside canvas callbacks without stale closure
    // - state → triggers React re-render for the tooltip / legend
    const hoveredIdRef = useRef<string | null>(null);
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    const setHovered = useCallback((id: string | null) => {
        hoveredIdRef.current = id;
        setHoveredId(id);
    }, []);

    // Always-visible label IDs (top N by frequency)
    const alwaysLabelIds = [...MOCK_GRAPH_DATA.nodes]
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, ALWAYS_LABEL_COUNT)
        .map((n) => n.id);

    // activeNodeIds for time-based search focus highlighting
    const activeNodeIds = useMemo(() => {
        if (!focusedEntity || focusedEntity.type !== "time") return new Set<string>();
        let evs = ALL_EVENTS;
        if (focusedEntity.day) {
            const dow = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].indexOf(focusedEntity.day);
            evs = evs.filter((e) => e.timestamp.getDay() === dow);
        }
        if (focusedEntity.hours) {
            evs = evs.filter((e) => focusedEntity.hours!.includes(e.timestamp.getHours()));
        }
        return new Set(evs.map((e) => e.label));
    }, [focusedEntity]);

    // ── Measure container ────────────────────────────────────────────────────
    useEffect(() => {
        if (!containerRef.current) return;
        const observer = new ResizeObserver((entries) => {
            const { width, height } = entries[0].contentRect;
            setDimensions({ width, height });
        });
        observer.observe(containerRef.current);
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
        return () => observer.disconnect();
    }, []);

    // ── Fade-in ──────────────────────────────────────────────────────────────
    useEffect(() => {
        const t = setTimeout(() => setReady(true), 80);
        return () => clearTimeout(t);
    }, []);

    // ── Hover handler ────────────────────────────────────────────────────────
    const handleNodeHover = useCallback((node: GraphNode | null) => {
        setHovered(node?.id ?? null);
        if (containerRef.current) {
            containerRef.current.style.cursor = node ? "pointer" : "default";
        }
    }, [setHovered]);

    // ── Click handler ────────────────────────────────────────────────────────
    const handleNodeClick = useCallback((node: GraphNode) => {
        const selected: SelectedNode = {
            id:    node.id,
            label: node.label,
            type:  "domain",
        };
        setSelectedNode(selected);
        setMode("journey", "overview");
    }, [setSelectedNode, setMode]);

    // ── Pointer (hit) area — larger than visible node ────────────────────────
    const paintPointerArea = useCallback(
        (node: GraphNode, color: string, ctx: CanvasRenderingContext2D) => {
            const x = (node as any).x as number;
            const y = (node as any).y as number;
            if (!isFinite(x) || !isFinite(y)) return;
            const r = Math.max(6, nodeRadius(node.frequency ?? 50)) * HIT_AREA_MULT;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, 2 * Math.PI);
            ctx.fillStyle = color;
            ctx.fill();
        },
        []
    );

    // ── Node visual painter ──────────────────────────────────────────────────
    const paintNode = useCallback(
        (node: GraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
            const x = (node as any).x as number;
            const y = (node as any).y as number;
            if (!isFinite(x) || !isFinite(y)) return;

            const currentHoveredId = hoveredIdRef.current;
            const hasHover         = currentHoveredId !== null;

            // Highlight and dimming calculations
            let isHighlighted = false;
            let isDimmed = false;

            if (hasHover) {
                const connectedSet = buildConnectedSet(currentHoveredId);
                isHighlighted = currentHoveredId === node.id || connectedSet.has(node.id);
                isDimmed = !isHighlighted;
            } else if (focusedEntity) {
                if (focusedEntity.type === "node") {
                    const connectedSet = buildConnectedSet(focusedEntity.id);
                    isHighlighted = node.id === focusedEntity.id || connectedSet.has(node.id);
                    isDimmed = !isHighlighted;
                } else if (focusedEntity.type === "category") {
                    isHighlighted = node.category === focusedEntity.category;
                    isDimmed = !isHighlighted;
                } else if (focusedEntity.type === "journey") {
                    isHighlighted = node.id === focusedEntity.source || node.id === focusedEntity.target;
                    isDimmed = !isHighlighted;
                } else if (focusedEntity.type === "time") {
                    isHighlighted = activeNodeIds.has(node.id);
                    isDimmed = !isHighlighted;
                }
            }

            const r         = Math.max(6, nodeRadius(node.frequency ?? 50));
            const color     = CATEGORY_COLORS[node.category] ?? "#a78bfa";
            
            const isHovered = currentHoveredId === node.id || (!hasHover && focusedEntity?.type === "node" && focusedEntity.id === node.id);
            const isConnected = (hasHover && buildConnectedSet(currentHoveredId).has(node.id)) ||
                                (!hasHover && focusedEntity?.type === "node" && buildConnectedSet(focusedEntity.id).has(node.id));

            // ── Outer glow ───────────────────────────────────────────────────
            try {
                const glowMult   = isHovered ? 3.2 : isConnected ? 2.2 : 1.6;
                const glowRadius = Math.max(r * 1.1, r * glowMult);
                const innerR     = Math.min(r * 0.3, glowRadius - 0.1);
                const glowAlpha  = isHovered ? "66" : isConnected ? "44" : isDimmed ? "08" : "28";
                const glow = ctx.createRadialGradient(x, y, innerR, x, y, glowRadius);
                glow.addColorStop(0, color + glowAlpha);
                glow.addColorStop(1, color + "00");
                ctx.beginPath();
                ctx.arc(x, y, glowRadius, 0, 2 * Math.PI);
                ctx.fillStyle = glow;
                ctx.fill();
            } catch { /* skip glow on bad state */ }

            // ── Node circle ──────────────────────────────────────────────────
            const fillAlpha  = isHovered ? "ff" : isConnected ? "cc" : isDimmed ? "22" : "99";
            ctx.beginPath();
            ctx.arc(x, y, isHovered ? r * 1.15 : r, 0, 2 * Math.PI);
            ctx.fillStyle = color + fillAlpha;
            ctx.fill();

            // ── Border ring ──────────────────────────────────────────────────
            const strokeAlpha = isHovered ? "ff" : isConnected ? "cc" : isDimmed ? "11" : "66";
            ctx.beginPath();
            ctx.arc(x, y, isHovered ? r * 1.15 : r, 0, 2 * Math.PI);
            ctx.strokeStyle = color + strokeAlpha;
            ctx.lineWidth   = isHovered ? 2.5 : isConnected ? 1.5 : 1;
            ctx.stroke();

            // ── Label ────────────────────────────────────────────────────────
            const isAlways  = alwaysLabelIds.includes(node.id);
            const showLabel = isAlways || isHovered || isConnected || (focusedEntity && isHighlighted);
            if (showLabel && !isDimmed) {
                const baseFontSize = Math.max(10, 12 / globalScale);
                const fontSize     = isHovered ? baseFontSize * 1.25 : baseFontSize;
                ctx.font         = `${isHovered ? "700" : "500"} ${fontSize}px Inter, sans-serif`;
                ctx.textAlign    = "center";
                ctx.textBaseline = "middle";

                const textWidth = ctx.measureText(node.label).width;
                const padX = 5, padY = 3;
                const visR = isHovered ? r * 1.15 : r;
                const lx   = x - textWidth / 2 - padX;
                const ly   = y + visR + 7;
                const lw   = textWidth + padX * 2;
                const lh   = fontSize + padY * 2;
                const rad  = 4;

                ctx.fillStyle = isHovered ? "rgba(10,10,11,0.88)" : "rgba(10,10,11,0.65)";
                ctx.beginPath();
                if (ctx.roundRect) {
                    ctx.roundRect(lx, ly, lw, lh, rad);
                } else {
                    ctx.moveTo(lx + rad, ly);
                    ctx.lineTo(lx + lw - rad, ly);
                    ctx.quadraticCurveTo(lx + lw, ly, lx + lw, ly + rad);
                    ctx.lineTo(lx + lw, ly + lh - rad);
                    ctx.quadraticCurveTo(lx + lw, ly + lh, lx + lw - rad, ly + lh);
                    ctx.lineTo(lx + rad, ly + lh);
                    ctx.quadraticCurveTo(lx, ly + lh, lx, ly + lh - rad);
                    ctx.lineTo(lx, ly + rad);
                    ctx.quadraticCurveTo(lx, ly, lx + rad, ly);
                    ctx.closePath();
                }
                ctx.fill();

                if (isHovered) {
                    ctx.strokeStyle = color + "55";
                    ctx.lineWidth   = 1;
                    ctx.stroke();
                }

                ctx.fillStyle = isHovered ? color : "rgba(255,255,255,0.75)";
                ctx.fillText(node.label, x, ly + lh / 2);
            }
        },
        [alwaysLabelIds, focusedEntity, activeNodeIds]
    );

    // ── Link color ───────────────────────────────────────────────────────────
    const linkColor = useCallback((link: GraphLink) => {
        const currentHoveredId = hoveredIdRef.current;
        const hasHover = currentHoveredId !== null;

        const src = typeof link.source === "object"
            ? (link.source as GraphNode).id : link.source;
        const tgt = typeof link.target === "object"
            ? (link.target as GraphNode).id : link.target;

        if (hasHover) {
            const isConnected = src === currentHoveredId || tgt === currentHoveredId;
            if (isConnected) {
                const alpha = Math.round((0.45 + (link.weight / 10) * 0.55) * 255).toString(16).padStart(2, "0");
                return `#ffffff${alpha}`;
            }
            return "#ffffff0a"; // Dimmed
        }

        if (focusedEntity) {
            if (focusedEntity.type === "node") {
                const fId = focusedEntity.id;
                const isConnected = src === fId || tgt === fId;
                if (isConnected) {
                    const alpha = Math.round((0.45 + (link.weight / 10) * 0.55) * 255).toString(16).padStart(2, "0");
                    return `#ffffff${alpha}`;
                }
                return "#ffffff08"; // Dimmed
            } else if (focusedEntity.type === "category") {
                const srcNode = MOCK_GRAPH_DATA.nodes.find(n => n.id === src);
                const tgtNode = MOCK_GRAPH_DATA.nodes.find(n => n.id === tgt);
                const srcMatch = srcNode?.category === focusedEntity.category;
                const tgtMatch = tgtNode?.category === focusedEntity.category;
                if (srcMatch && tgtMatch) {
                    return "#ffffff77";
                }
                return "#ffffff08"; // Dimmed
            } else if (focusedEntity.type === "journey") {
                const matchesJourney = (src === focusedEntity.source && tgt === focusedEntity.target) ||
                                       (src === focusedEntity.target && tgt === focusedEntity.source);
                if (matchesJourney) {
                    return "#ffffffcc";
                }
                return "#ffffff08"; // Dimmed
            } else if (focusedEntity.type === "time") {
                if (activeNodeIds.has(src) && activeNodeIds.has(tgt)) {
                    return "#ffffff55";
                }
                return "#ffffff08"; // Dimmed
            }
        }

        // Default: subtle weight-driven opacity
        const alpha = Math.round((0.08 + (link.weight / 10) * 0.18) * 255).toString(16).padStart(2, "0");
        return `#ffffff${alpha}`;
    }, [focusedEntity, activeNodeIds]);

    // ── Link width ───────────────────────────────────────────────────────────
    const linkWidth = useCallback((link: GraphLink) => {
        const currentHoveredId = hoveredIdRef.current;
        const hasHover = currentHoveredId !== null;

        const src = typeof link.source === "object"
            ? (link.source as GraphNode).id : link.source;
        const tgt = typeof link.target === "object"
            ? (link.target as GraphNode).id : link.target;

        let isConnected = false;

        if (hasHover) {
            isConnected = src === currentHoveredId || tgt === currentHoveredId;
        } else if (focusedEntity && focusedEntity.type === "node") {
            isConnected = src === focusedEntity.id || tgt === focusedEntity.id;
        }

        const base = 0.5 + (link.weight / 10) * 2.5;
        return isConnected ? base * 2 : base * 0.6;
    }, [focusedEntity]);

    // ─────────────────────────────────────────────────────────────────────────

    return (
        <div ref={containerRef} className="w-full h-full relative overflow-hidden">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: ready && dimensions.width > 0 ? 1 : 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="w-full h-full"
            >
                {dimensions.width > 0 && dimensions.height > 0 && (
                    <ForceGraph2D
                        graphData={MOCK_GRAPH_DATA as any}
                        width={dimensions.width}
                        height={dimensions.height}
                        backgroundColor="transparent"

                        // Simulation
                        cooldownTicks={COOLDOWN_TICKS}
                        onEngineStop={() => {}}
                        d3AlphaDecay={0.03}
                        d3VelocityDecay={0.4}

                        // Node rendering
                        nodeCanvasObject={paintNode as any}
                        nodeCanvasObjectMode={() => "replace"}
                        nodePointerAreaPaint={paintPointerArea as any}
                        nodeRelSize={1}

                        // Link rendering
                        linkColor={linkColor as any}
                        linkWidth={linkWidth as any}
                        linkCurvature={0.15}

                        // Interactions
                        onNodeHover={handleNodeHover as any}
                        onNodeClick={handleNodeClick as any}
                        enableZoomInteraction
                        enablePanInteraction
                    />
                )}
            </motion.div>

            {/* Category legend */}
            <div className="absolute bottom-4 left-4 flex flex-col gap-1.5 pointer-events-none">
                {(Object.entries(CATEGORY_COLORS) as [string, string][]).map(([cat, color]) => (
                    <div key={cat} className="flex items-center gap-2">
                        <div
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}88` }}
                        />
                        <span
                            className="text-[11px] font-medium capitalize"
                            style={{ color: "rgba(255,255,255,0.5)" }}
                        >
                            {cat}
                        </span>
                    </div>
                ))}
            </div>

            {/* Hover tooltip */}
            {hoveredId && (() => {
                const node = MOCK_GRAPH_DATA.nodes.find((n) => n.id === hoveredId);
                if (!node) return null;
                const color = CATEGORY_COLORS[node.category];
                return (
                    <motion.div
                        key={hoveredId}
                        initial={{ opacity: 0, y: 4, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute top-4 right-4 px-3 py-2.5 rounded-[14px] border backdrop-blur-xl pointer-events-none"
                        style={{
                            background: "rgba(10,10,11,0.85)",
                            borderColor: color + "55",
                            boxShadow: `0 0 24px ${color}22, inset 0 1px 0 rgba(255,255,255,0.06)`,
                        }}
                    >
                        <p className="text-[13px] font-semibold" style={{ color }}>
                            {node.label}
                        </p>
                        <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>
                            {node.category} · {node.frequency} visits
                        </p>
                        <p className="text-[10px] mt-1.5 font-medium" style={{ color: color + "99" }}>
                            Click to explore flow →
                        </p>
                    </motion.div>
                );
            })()}
        </div>
    );
}
