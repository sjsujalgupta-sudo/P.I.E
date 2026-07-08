/*
 * 🎭 Analogy: This file is the "City District Map" — it shows
 *   your browsing universe as neighborhoods (districts) with
 *   orbital nodes (sites) and transit lines between them.
 * ✅ Safe to change:
 *    1. The DISTRICT_POSITIONS coordinates — reposition districts
 *    2. The ORBITAL_CONFIG angles — rotate nodes around their district
 *    3. The particle count in buildParticles() — more = denser starfield
 * ❌ Never touch: The `StructureGraph` export name — it's imported
 *   by MainView. Renaming it breaks the Structure mode entirely.
 */

"use client";

/**
 * Structure Mode — Semantic Metro Galaxy
 *
 * A navigable behavioral atlas with:
 *   - 4 districts in fixed quadrant layout with organic bias
 *   - Deterministic orbital node positioning (no simulation)
 *   - Animated transit lines (inter-district bridge routes)
 *   - Attention density fields (radial gradient fog)
 *   - Ambient particle drift
 *   - 3-level zoom: Atlas → District → Node
 *   - Full cross-mode continuity
 *
 * Rendering layers (bottom → top):
 *   0. Deep space background
 *   1. Ambient particles
 *   2. District fog fields
 *   3. Transit pathways (static + animated pulse on bridges)
 *   4. Orbital node constellations
 *   5. Labels + UI overlays
 */

import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as d3 from "d3";
import {
    useSelectedNode, useSetSelectedNode,
    useSelectedCategory, useModeActions,
    useFocusedEntity,
} from "@/lib/store/modeStore";
import { ALL_EVENTS } from "../data/mockBrowsingEvents";
import {
    buildStructureData, buildClusterInsights,
    CLUSTER_DEFS, CATEGORY_COLORS,
} from "./structure-data";

// ─── Types ────────────────────────────────────────────────────────────────────

type ZoomLevel = 0 | 1 | 2;

interface DistrictLayout {
    id:    string;
    label: string;
    color: string;
    cx:    number;   // district center x (0–1 normalized)
    cy:    number;   // district center y (0–1 normalized)
    r:     number;   // district radius (0–1 normalized)
}

interface OrbitalNode {
    id:          string;
    label:       string;
    districtId:  string;
    visits:      number;
    bridgeScore: number;
    // Orbital position (computed from district center)
    angle:       number;   // radians
    orbitR:      number;   // orbit radius in px
    nodeR:       number;   // visual radius
    // Absolute canvas position (computed)
    x:           number;
    y:           number;
}

interface TransitRoute {
    id:          string;
    srcId:       string;   // node id
    tgtId:       string;   // node id
    srcDistrict: string;
    tgtDistrict: string;
    weight:      number;
    isBridge:    boolean;  // inter-district
    d:           string;   // SVG path
}

interface Particle {
    id: number; x: number; y: number;
    r: number; opacity: number;
    dx: number; dy: number;
    duration: number; delay: number;
}

const PANEL_TABS = ["districts", "transit", "density", "insights"] as const;
type PanelTab = typeof PANEL_TABS[number];

// ─── District layout — fixed quadrant + organic bias ─────────────────────────
// Research ↔ Development are closer (semantic overlap)
// Social is more isolated (evening cluster)
// Productivity is intermediary

const DISTRICT_POSITIONS: Record<string, { cx: number; cy: number; r: number }> = {
    research:     { cx: 0.28, cy: 0.30, r: 0.18 },  // top-left
    dev:          { cx: 0.68, cy: 0.28, r: 0.20 },  // top-right (closer to research)
    social:       { cx: 0.22, cy: 0.72, r: 0.17 },  // bottom-left (isolated)
    productivity: { cx: 0.72, cy: 0.70, r: 0.16 },  // bottom-right (intermediary)
};

// Orbital hierarchy per district: [hub, secondary, outer]
// Angle in degrees from district center
const ORBITAL_CONFIG: Record<string, { label: string; tier: 0 | 1 | 2; angle: number }[]> = {
    dev:          [
        { label: "GitHub",        tier: 0, angle: 0   },
        { label: "Stack Overflow", tier: 1, angle: 130 },
        { label: "npm",           tier: 2, angle: 240 },
    ],
    social:       [
        { label: "YouTube",     tier: 0, angle: 20  },
        { label: "Reddit",      tier: 1, angle: 150 },
        { label: "Twitter / X", tier: 2, angle: 270 },
    ],
    productivity: [
        { label: "Notion", tier: 0, angle: 340 },
        { label: "Linear", tier: 1, angle: 100 },
        { label: "Figma",  tier: 2, angle: 210 },
    ],
    research:     [
        { label: "Google",       tier: 0, angle: 10  },
        { label: "Medium",       tier: 1, angle: 140 },
        { label: "Hacker News",  tier: 2, angle: 260 },
    ],
};

const TIER_ORBIT_RATIO = [0.32, 0.58, 0.82]; // fraction of district radius
const TIER_NODE_RATIO  = [0.055, 0.040, 0.030]; // fraction of district radius

// ─── Layout builders ──────────────────────────────────────────────────────────

function buildDistricts(W: number, H: number, clusters: ReturnType<typeof buildStructureData>["clusters"]): DistrictLayout[] {
    return clusters.map((c, index) => {
        const pos = DISTRICT_POSITIONS[c.id] ?? { cx: 0.5, cy: 0.5, r: 0.18 };
        const r   = Math.min(W, H) * pos.r;
        const fallbackAngle = (index / Math.max(1, clusters.length)) * Math.PI * 2;
        return {
            id: c.id,
            label: c.label,
            color: c.color,
            cx: W * (DISTRICT_POSITIONS[c.id]?.cx ?? 0.5 + Math.cos(fallbackAngle) * 0.25),
            cy: H * (DISTRICT_POSITIONS[c.id]?.cy ?? 0.5 + Math.sin(fallbackAngle) * 0.25),
            r,
        };
    });
}

function buildOrbitalNodes(
    districts: DistrictLayout[],
    data: ReturnType<typeof buildStructureData>
): OrbitalNode[] {
    const nodes: OrbitalNode[] = [];
    for (const district of districts) {
        const clusterNodes = data.nodes.filter((node) => node.clusterId === district.id);
        const config = clusterNodes.map((node, index) => {
            const existing = ORBITAL_CONFIG[district.id]?.find((item) => item.label === node.id);
            if (existing) return existing;
            return {
                label: node.id,
                tier: Math.min(2, Math.floor(index / 3)) as 0 | 1 | 2,
                angle: (index / Math.max(1, clusterNodes.length)) * 360,
            };
        });
        for (const cfg of config) {
            const n = data.nodes.find((x) => x.id === cfg.label);
            if (!n) continue;
            const orbitR = district.r * TIER_ORBIT_RATIO[cfg.tier];
            const nodeR  = district.r * TIER_NODE_RATIO[cfg.tier];
            const rad    = (cfg.angle * Math.PI) / 180;
            nodes.push({
                id:          n.id,
                label:       n.label,
                districtId:  district.id,
                visits:      n.visits,
                bridgeScore: n.bridgeScore,
                angle:       rad,
                orbitR,
                nodeR:       Math.max(nodeR, 5),
                x:           district.cx + Math.cos(rad) * orbitR,
                y:           district.cy + Math.sin(rad) * orbitR,
            });
        }
    }
    return nodes;
}

function buildTransitRoutes(
    nodes: OrbitalNode[],
    links: ReturnType<typeof buildStructureData>["links"]
): TransitRoute[] {
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const routes: TransitRoute[] = [];

    for (const link of links) {
        if (link.weight < 2) continue;
        const src = nodeMap.get(link.source as string);
        const tgt = nodeMap.get(link.target as string);
        if (!src || !tgt) continue;

        const isBridge = src.districtId !== tgt.districtId;

        // Cubic bezier — bridge routes curve outward, local routes curve gently
        const mx  = (src.x + tgt.x) / 2;
        const my  = (src.y + tgt.y) / 2;
        const dx  = tgt.x - src.x;
        const dy  = tgt.y - src.y;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        const bend = isBridge ? 0.40 : 0.20;
        const cx  = mx - (dy / len) * len * bend;
        const cy  = my + (dx / len) * len * bend;

        routes.push({
            id:          `${src.id}↔${tgt.id}`,
            srcId:       src.id,
            tgtId:       tgt.id,
            srcDistrict: src.districtId,
            tgtDistrict: tgt.districtId,
            weight:      link.weight,
            isBridge,
            d:           `M ${src.x} ${src.y} Q ${cx} ${cy} ${tgt.x} ${tgt.y}`,
        });
    }

    // Deduplicate by sorted key
    const seen = new Set<string>();
    return routes.filter((r) => {
        const key = [r.srcId, r.tgtId].sort().join("↔");
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function buildParticles(W: number, H: number, count = 45): Particle[] {
    return Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * W, y: Math.random() * H,
        r: 0.4 + Math.random() * 1.0,
        opacity: 0.03 + Math.random() * 0.07,
        dx: (Math.random() - 0.5) * 80,
        dy: (Math.random() - 0.5) * 80,
        duration: 20 + Math.random() * 28,
        delay: Math.random() * -25,
    }));
}

function hexToRgb(hex: string): [number, number, number] {
    return [parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16)];
}

// ─── Main component ───────────────────────────────────────────────────────────

export function StructureGraph() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [size, setSize]         = useState({ width: 0, height: 0 });
    const [mounted, setMounted]   = useState(false);
    const [panelTab, setPanelTab] = useState<PanelTab>("districts");
    const [hoveredNodeId, setHoveredNodeId]         = useState<string | null>(null);
    const [hoveredDistrictId, setHoveredDistrictId] = useState<string | null>(null);
    const [zoomLevel, setZoomLevel]   = useState<ZoomLevel>(0);
    const [focusedId, setFocusedId]   = useState<string | null>(null); // district or node
    const [viewTransform, setViewTransform] = useState({ x: 0, y: 0, scale: 1 });
    const lastClick = useRef(0);

    const selectedNode     = useSelectedNode();
    const setSelectedNode  = useSetSelectedNode();
    const selectedCategory = useSelectedCategory();
    const focusedEntity    = useFocusedEntity();
    const { setMode, setSelectedCategory } = useModeActions();

    // ── Data ─────────────────────────────────────────────────────────────────
    const data     = useMemo(() => buildStructureData(), []);
    const insights = useMemo(() => buildClusterInsights(data), [data]);

    // ── Layout (recomputes on resize) ─────────────────────────────────────────
    const districts = useMemo(() => buildDistricts(size.width, size.height, data.clusters), [size, data.clusters]);
    const orbNodes  = useMemo(() => buildOrbitalNodes(districts, data), [districts, data]);
    const routes    = useMemo(() => buildTransitRoutes(orbNodes, data.links), [orbNodes, data.links]);
    const particles = useMemo(() => buildParticles(size.width, size.height), [size.width, size.height]);

    // Progressive disclosure: only show strongest routes by default
    // Top 30% by weight for bridges, top 20% for local routes
    const visibleRoutes = useMemo(() => {
        const bridges = routes.filter((r) => r.isBridge).sort((a, b) => b.weight - a.weight);
        const local   = routes.filter((r) => !r.isBridge).sort((a, b) => b.weight - a.weight);
        const topBridges = bridges.slice(0, Math.max(3, Math.ceil(bridges.length * 0.5)));
        const topLocal   = local.slice(0, Math.max(2, Math.ceil(local.length * 0.20)));
        return [...topBridges, ...topLocal];
    }, [routes]);

    // Semantic annotations for canvas overlay
    const annotations = useMemo(() => {
        if (!size.width) return [];
        const anns: { x: number; y: number; text: string; color: string }[] = [];
        // Find strongest bridge
        const topBridge = routes.filter((r) => r.isBridge).sort((a, b) => b.weight - a.weight)[0];
        if (topBridge) {
            const srcN = orbNodes.find((n) => n.id === topBridge.srcId);
            const tgtN = orbNodes.find((n) => n.id === topBridge.tgtId);
            if (srcN && tgtN) {
                anns.push({
                    x: (srcN.x + tgtN.x) / 2,
                    y: (srcN.y + tgtN.y) / 2 - 18,
                    text: `${topBridge.srcId} ↔ ${topBridge.tgtId}`,
                    color: "rgba(255,255,255,0.28)",
                });
            }
        }
        return anns;
    }, [routes, orbNodes, size.width]);

    // ── Active context ────────────────────────────────────────────────────────
    const activeDistrictId = useMemo(() => {
        if (selectedCategory) return data.clusters.find((c) => c.category === selectedCategory)?.id ?? null;
        if (selectedNode)     return orbNodes.find((n) => n.id === selectedNode.id)?.districtId ?? null;
        return hoveredDistrictId ?? focusedId;
    }, [selectedCategory, selectedNode, orbNodes, hoveredDistrictId, focusedId, data.clusters]);

    // ── Search focus ──────────────────────────────────────────────────────────
    const { searchActiveNodeIds, searchActiveRouteIds } = useMemo(() => {
        if (!focusedEntity) return { searchActiveNodeIds: null, searchActiveRouteIds: null };
        const nodeSet = new Set<string>();
        const routeSet = new Set<string>();

        if (focusedEntity.type === "node") {
            nodeSet.add(focusedEntity.id);
            for (const r of visibleRoutes) {
                if (r.srcId === focusedEntity.id || r.tgtId === focusedEntity.id) {
                    routeSet.add(r.id);
                    nodeSet.add(r.srcId);
                    nodeSet.add(r.tgtId);
                }
            }
        } else if (focusedEntity.type === "category") {
            for (const c of CLUSTER_DEFS) {
                if (c.category === focusedEntity.category) {
                    for (const n of c.nodes) nodeSet.add(n);
                }
            }
        } else if (focusedEntity.type === "journey") {
            nodeSet.add(focusedEntity.source);
            nodeSet.add(focusedEntity.target);
            for (const r of visibleRoutes) {
                if ((r.srcId === focusedEntity.source && r.tgtId === focusedEntity.target) ||
                    (r.srcId === focusedEntity.target && r.tgtId === focusedEntity.source)) {
                    routeSet.add(r.id);
                }
            }
        } else if (focusedEntity.type === "time") {
            let evs = ALL_EVENTS;
            if (focusedEntity.day) {
                const dow = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"].indexOf(focusedEntity.day);
                evs = evs.filter((e) => e.timestamp.getDay() === dow);
            }
            if (focusedEntity.hours) {
                evs = evs.filter((e) => focusedEntity.hours!.includes(e.timestamp.getHours()));
            }
            for (const e of evs) nodeSet.add(e.label);
        }
        return { searchActiveNodeIds: nodeSet, searchActiveRouteIds: routeSet };
    }, [focusedEntity, visibleRoutes]);

    // Connected node ids for hover highlight
    const connectedNodeIds = useMemo(() => {
        const id = hoveredNodeId ?? selectedNode?.id ?? null;
        if (!id) return null;
        const set = new Set<string>([id]);
        for (const r of routes) {
            if (r.srcId === id) set.add(r.tgtId);
            if (r.tgtId === id) set.add(r.srcId);
        }
        return set;
    }, [hoveredNodeId, selectedNode, routes]);

    // ── Measure ───────────────────────────────────────────────────────────────
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

    useEffect(() => { const t = setTimeout(() => setMounted(true), 160); return () => clearTimeout(t); }, []);

    // ── Zoom to district ──────────────────────────────────────────────────────
    const zoomToDistrict = useCallback((districtId: string) => {
        const d = districts.find((x) => x.id === districtId);
        if (!d || !size.width) return;
        const pad   = 60;
        const scale = Math.min(size.width, size.height) / (d.r * 2.4 + pad * 2);
        setViewTransform({
            x: size.width  / 2 - d.cx * scale,
            y: size.height / 2 - d.cy * scale,
            scale,
        });
        setZoomLevel(1);
        setFocusedId(districtId);
    }, [districts, size]);

    const zoomOut = useCallback(() => {
        setViewTransform({ x: 0, y: 0, scale: 1 });
        setZoomLevel(0);
        setFocusedId(null);
    }, []);

    // ── Node interactions ─────────────────────────────────────────────────────
    const handleNodeClick = useCallback((node: OrbitalNode) => {
        const now = Date.now();
        if (now - lastClick.current < 350) {
            setSelectedNode({ id: node.id, label: node.label, type: "domain" });
            setMode("journey", "structure");
        } else {
            selectedNode?.id === node.id
                ? setSelectedNode(null)
                : setSelectedNode({ id: node.id, label: node.label, type: "domain" });
        }
        lastClick.current = now;
    }, [selectedNode, setSelectedNode, setMode]);

    const handleDistrictClick = useCallback((districtId: string) => {
        if (zoomLevel === 0) {
            zoomToDistrict(districtId);
            // Cross-mode: set category + navigate to Patterns
            const cluster = CLUSTER_DEFS.find((c) => c.id === districtId);
            if (cluster) setSelectedCategory(cluster.category);
        }
    }, [zoomLevel, zoomToDistrict, setSelectedCategory]);

    const transform = `translate(${viewTransform.x},${viewTransform.y}) scale(${viewTransform.scale})`;

    if (!size.width) return <div ref={containerRef} className="w-full h-full" />;

    return (
        <div className="w-full h-full flex overflow-hidden">
            {/* ── SVG canvas ───────────────────────────────────────── */}
            <div ref={containerRef} className="flex-1 relative overflow-hidden min-w-0 select-none">

                {/* Deep space base */}
                <div className="absolute inset-0 pointer-events-none"
                    style={{ background: "radial-gradient(ellipse 140% 100% at 50% 50%, rgba(5,5,14,0), rgba(2,2,8,0.65))" }} />

                {/* Back button */}
                <AnimatePresence>
                    {zoomLevel > 0 && (
                        <motion.button
                            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.22 }}
                            onClick={zoomOut}
                            className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5
                                       rounded-xl border border-white/[0.12] bg-white/[0.05]
                                       text-[12px] text-label-secondary hover:text-label
                                       backdrop-blur-xl transition-colors duration-150">
                            ← All districts
                        </motion.button>
                    )}
                </AnimatePresence>

                {/* Zoom indicator */}
                <div className="absolute bottom-4 left-4 z-10 flex items-center gap-1.5 pointer-events-none">
                    {([0,1,2] as ZoomLevel[]).map((lvl) => (
                        <div key={lvl} className="rounded-full transition-all duration-400"
                            style={{ width: zoomLevel >= lvl ? 6 : 4, height: zoomLevel >= lvl ? 6 : 4,
                                backgroundColor: zoomLevel >= lvl ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.14)" }} />
                    ))}
                    <span className="text-[10px] ml-1.5" style={{ color: "rgba(255,255,255,0.22)" }}>
                        {zoomLevel === 0 ? "Atlas" : zoomLevel === 1 ? "District" : "Node"}
                    </span>
                </div>

                {/* Structural summary — top of canvas, always visible */}
                {zoomLevel === 0 && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3 pointer-events-none">
                        {(() => {
                            const dominant = insights.strongestCluster;
                            const topBridge = data.bridges[0];
                            const bridgeColor = CLUSTER_DEFS.find((c) => c.id === topBridge?.node.clusterId)?.color ?? "#f59e0b";
                            return (
                                <>
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.07]">
                                        <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>Dominant:</span>
                                        <span className="text-[10px] font-semibold text-emerald">{dominant}</span>
                                    </div>
                                    {topBridge && (
                                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.07]">
                                            <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>Bridge:</span>
                                            <span className="text-[10px] font-semibold" style={{ color: bridgeColor }}>{topBridge.node.label}</span>
                                        </div>
                                    )}
                                </>
                            );
                        })()}
                    </div>
                )}

                <motion.svg width={size.width} height={size.height}
                    initial={{ opacity: 0 }} animate={{ opacity: mounted ? 1 : 0 }}
                    transition={{ duration: 1.6, ease: "easeOut" }}>
                    <defs>
                        {/* District fog filters */}
                        <filter id="fog-blur" x="-40%" y="-40%" width="180%" height="180%">
                            <feGaussianBlur stdDeviation="22" />
                        </filter>
                        <filter id="fog-blur-inner" x="-30%" y="-30%" width="160%" height="160%">
                            <feGaussianBlur stdDeviation="12" />
                        </filter>
                        {/* Node glow */}
                        <filter id="node-glow" x="-120%" y="-120%" width="340%" height="340%">
                            <feGaussianBlur stdDeviation="7" result="b" />
                            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                        </filter>
                        {/* Label glow */}
                        <filter id="label-glow" x="-25%" y="-25%" width="150%" height="150%">
                            <feGaussianBlur stdDeviation="2.5" result="b" />
                            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                        </filter>
                        {/* Transit route glow */}
                        <filter id="route-glow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="3" result="b" />
                            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                        </filter>
                        {/* Radial gradients for district fog */}
                        {districts.map((d) => {
                            const [r,g,b] = hexToRgb(d.color);
                            return (
                                <radialGradient key={`rg-${d.id}`} id={`rg-${d.id}`} cx="50%" cy="50%" r="50%">
                                    <stop offset="0%"   stopColor={`rgba(${r},${g},${b},0.22)`} />
                                    <stop offset="30%"  stopColor={`rgba(${r},${g},${b},0.10)`} />
                                    <stop offset="65%"  stopColor={`rgba(${r},${g},${b},0.04)`} />
                                    <stop offset="100%" stopColor={`rgba(${r},${g},${b},0)`} />
                                </radialGradient>
                            );
                        })}
                        {/* Animated dash for bridge pulse */}
                        <style>{`
                            @keyframes bridge-pulse {
                                from { stroke-dashoffset: 0; }
                                to   { stroke-dashoffset: -60; }
                            }
                            .bridge-pulse { animation: bridge-pulse 3s linear infinite; }
                        `}</style>
                    </defs>

                    {/* ══ LAYER 1: Ambient particles ══════════════════ */}
                    {particles.map((p) => (
                        <motion.circle key={p.id} r={p.r} fill="rgba(255,255,255,1)"
                            initial={{ cx: p.x, cy: p.y, opacity: 0 }}
                            animate={{
                                cx: [p.x, p.x + p.dx, p.x - p.dx * 0.3, p.x],
                                cy: [p.y, p.y + p.dy * 0.5, p.y - p.dy, p.y],
                                opacity: [0, p.opacity, p.opacity * 0.5, 0, p.opacity, 0],
                            }}
                            transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
                            style={{ pointerEvents: "none" }} />
                    ))}

                    {/* ══ Animated transform group ════════════════════ */}
                    <motion.g
                        animate={{ transform }}
                        transition={{ duration: 0.80, ease: [0.32, 0.72, 0, 1] }}>

                        {/* ══ LAYER 2: District fog fields ════════════ */}
                        {districts.map((d) => {
                            let isActive = !activeDistrictId || activeDistrictId === d.id;
                            if (searchActiveNodeIds) {
                                const districtNodes = CLUSTER_DEFS.find((c) => c.id === d.id)?.nodes ?? [];
                                const hasMatch = districtNodes.some((n) => searchActiveNodeIds.has(n));
                                isActive = isActive && hasMatch;
                            }
                            return (
                                <motion.g key={`fog-${d.id}`}
                                    animate={{ opacity: isActive ? 1 : 0.08 }}
                                    transition={{ duration: 0.5 }}>
                                    {/* Outer atmospheric fog */}
                                    <circle cx={d.cx} cy={d.cy} r={d.r * 1.55}
                                        fill={`url(#rg-${d.id})`}
                                        filter="url(#fog-blur)"
                                        style={{ pointerEvents: "none" }} />
                                    {/* Inner density core */}
                                    <circle cx={d.cx} cy={d.cy} r={d.r * 0.80}
                                        fill={`url(#rg-${d.id})`}
                                        filter="url(#fog-blur-inner)"
                                        opacity={0.75}
                                        style={{ pointerEvents: "none" }} />
                                    {/* District boundary ring */}
                                    <circle cx={d.cx} cy={d.cy} r={d.r}
                                        fill="none"
                                        stroke={d.color}
                                        strokeWidth={focusedId === d.id ? 1.0 : 0.35}
                                        strokeOpacity={focusedId === d.id ? 0.40 : 0.10}
                                        strokeDasharray={focusedId === d.id ? "none" : "4 10"}
                                        style={{ pointerEvents: "none" }} />
                                </motion.g>
                            );
                        })}

                        {/* ══ LAYER 3: Transit routes ══════════════════ */}
                        {visibleRoutes.map((route) => {
                            const srcDist = route.srcDistrict;
                            const tgtDist = route.tgtDistrict;
                            const isRelated = activeDistrictId &&
                                (srcDist === activeDistrictId || tgtDist === activeDistrictId);
                            const isNodeRelated = hoveredNodeId &&
                                (route.srcId === hoveredNodeId || route.tgtId === hoveredNodeId);
                            
                            let highlight = isRelated || isNodeRelated;
                            if (searchActiveRouteIds) {
                                highlight = highlight || searchActiveRouteIds.has(route.id);
                            }

                            // Progressive disclosure:
                            // Bridges: visible at 8% idle, 40% on highlight
                            // Local: hidden at 0% idle, 20% on highlight (only revealed on interaction)
                            const baseOp   = route.isBridge ? 0.08 : 0.0;
                            const activeOp = route.isBridge ? 0.42 : 0.22;
                            const op       = highlight ? activeOp : baseOp;
                            const [r,g,b]  = hexToRgb(
                                CLUSTER_DEFS.find((c) => c.id === srcDist)?.color ?? "#ffffff"
                            );

                            return (
                                <g key={route.id}>
                                    {/* Base route */}
                                    <motion.path d={route.d} fill="none"
                                        stroke={`rgba(${r},${g},${b},${op})`}
                                        strokeWidth={route.isBridge ? 1.6 : 0.9}
                                        filter={highlight ? "url(#route-glow)" : "none"}
                                        animate={{ strokeOpacity: op }}
                                        transition={{ duration: 0.35 }}
                                        style={{ pointerEvents: "none" }} />
                                    {/* Animated pulse — bridge routes only */}
                                    {route.isBridge && (
                                        <path d={route.d} fill="none"
                                            stroke={`rgba(${r},${g},${b},${highlight ? 0.60 : 0.15})`}
                                            strokeWidth={2.0}
                                            strokeDasharray="6 18"
                                            className="bridge-pulse"
                                            style={{ pointerEvents: "none" }} />
                                    )}
                                </g>
                            );
                        })}

                        {/* ══ LAYER 4: District hit areas + labels ════ */}
                        {districts.map((d) => {
                            const isActive = !activeDistrictId || activeDistrictId === d.id;
                            const labelY   = d.cy - d.r - 18;
                            return (
                                <g key={`dlabel-${d.id}`}
                                    style={{ cursor: zoomLevel === 0 ? "pointer" : "default" }}
                                    onMouseEnter={() => setHoveredDistrictId(d.id)}
                                    onMouseLeave={() => setHoveredDistrictId(null)}
                                    onClick={() => handleDistrictClick(d.id)}>
                                    <circle cx={d.cx} cy={d.cy} r={d.r} fill="transparent" />
                                    {/* District label — larger, more readable */}
                                    <motion.text x={d.cx} y={labelY}
                                        textAnchor="middle"
                                        fontSize={zoomLevel === 1 && focusedId === d.id ? 15 : 12}
                                        fontWeight={700} letterSpacing="0.10em"
                                        fill={d.color}
                                        animate={{ fillOpacity: isActive ? 0.80 : 0.12 }}
                                        transition={{ duration: 0.4 }}
                                        filter={isActive ? "url(#label-glow)" : "none"}
                                        style={{ userSelect: "none", pointerEvents: "none",
                                            textTransform: "uppercase" as const }}>
                                        {d.label}
                                    </motion.text>
                                    {/* Node count subtitle */}
                                    {isActive && (
                                        <motion.text x={d.cx} y={labelY + 14}
                                            textAnchor="middle" fontSize={8}
                                            fill={d.color}
                                            animate={{ fillOpacity: isActive ? 0.35 : 0 }}
                                            transition={{ duration: 0.4 }}
                                            style={{ userSelect: "none", pointerEvents: "none" }}>
                                            {zoomLevel === 0 && hoveredDistrictId === d.id
                                                ? "click to enter"
                                                : `${CLUSTER_DEFS.find((c) => c.id === d.id)?.nodes.length ?? 0} nodes`}
                                        </motion.text>
                                    )}
                                </g>
                            );
                        })}

                        {/* ══ LAYER 4b: Semantic annotations ══════════ */}
                        {annotations.map((ann, i) => (
                            <text key={i} x={ann.x} y={ann.y}
                                textAnchor="middle" fontSize={8.5}
                                fill={ann.color} letterSpacing="0.04em"
                                style={{ userSelect: "none", pointerEvents: "none" }}>
                                {ann.text}
                            </text>
                        ))}

                        {/* ══ LAYER 5: Orbital nodes ═══════════════════ */}
                        {orbNodes.map((node) => {
                            const district = districts.find((d) => d.id === node.districtId);
                            if (!district) return null;
                            const color    = district.color;
                            const [r,g,b]  = hexToRgb(color);
                            const isSel    = selectedNode?.id === node.id;
                            const isHov    = hoveredNodeId === node.id;
                            const isConn   = connectedNodeIds?.has(node.id) ?? false;
                            
                            let isActive = !activeDistrictId || activeDistrictId === node.districtId;
                            if (searchActiveNodeIds) {
                                isActive = searchActiveNodeIds.has(node.id);
                            }

                            const isBridge = node.bridgeScore > 0.25;

                            // Tier from orbital config
                            const cfg  = ORBITAL_CONFIG[node.districtId]?.find((c) => c.label === node.id);
                            const tier = cfg?.tier ?? 1;

                            // Progressive disclosure: tier-2 nodes hidden at atlas level
                            // unless hovered/selected/connected
                            const isVisible = tier < 2 || zoomLevel >= 1 || isSel || isHov || isConn ||
                                activeDistrictId === node.districtId;
                            if (!isVisible) return null;

                            // Hub emphasis: tier-0 nodes are 1.5× larger
                            const hubMult = tier === 0 ? 1.5 : tier === 1 ? 1.0 : 0.75;
                            const nr      = node.nodeR * hubMult;

                            const fillOp = isActive
                                ? (isSel ? 0.92 : isHov ? 0.85 : isConn ? 0.75 : tier === 0 ? 0.70 : tier === 1 ? 0.55 : 0.40)
                                : 0.08;

                            // Slow orbital drift
                            const driftX = Math.cos(node.angle + 0.15) * 2;
                            const driftY = Math.sin(node.angle + 0.15) * 2;

                            return (
                                <motion.g key={node.id}
                                    animate={{ opacity: isActive ? 1 : 0.10 }}
                                    transition={{ duration: 0.45 }}
                                    style={{ cursor: "pointer" }}
                                    onMouseEnter={() => setHoveredNodeId(node.id)}
                                    onMouseLeave={() => setHoveredNodeId(null)}
                                    onClick={(e) => { e.stopPropagation(); handleNodeClick(node); }}>

                                    {/* Slow orbital drift animation */}
                                    <motion.g
                                        animate={{ x: [0, driftX, 0], y: [0, driftY, 0] }}
                                        transition={{ duration: 18 + node.visits * 0.1, repeat: Infinity, ease: "easeInOut", delay: node.angle }}>

                                        {/* Atmospheric glow */}
                                        {(isSel || isHov) && (
                                            <circle cx={node.x} cy={node.y} r={nr * 3.5}
                                                fill={`rgba(${r},${g},${b},${isSel ? 0.10 : 0.06})`}
                                                filter="url(#node-glow)"
                                                style={{ pointerEvents: "none" }} />
                                        )}

                                        {/* Bridge orbit ring */}
                                        {isBridge && isActive && (
                                            <motion.circle cx={node.x} cy={node.y} r={nr * 1.9}
                                                fill="none" stroke={color}
                                                strokeWidth={0.6} strokeOpacity={0.25}
                                                strokeDasharray="2 6"
                                                animate={{ rotate: [0, 360] }}
                                                transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
                                                style={{ transformOrigin: `${node.x}px ${node.y}px`, pointerEvents: "none" }} />
                                        )}

                                        {/* Node circle */}
                                        <circle cx={node.x} cy={node.y}
                                            r={isSel ? nr * 1.25 : isHov ? nr * 1.12 : nr}
                                            fill={`rgba(${r},${g},${b},${fillOp})`}
                                            stroke={color}
                                            strokeWidth={isSel ? 2.0 : isHov ? 1.2 : 0.5}
                                            strokeOpacity={isSel ? 0.85 : isHov ? 0.65 : 0.25}
                                            filter={(isSel || isHov) ? "url(#node-glow)" : "none"} />

                                        {/* Label — tier-0 always visible, others on interaction/zoom */}
                                        {(isSel || isHov || isConn || tier === 0 || zoomLevel >= 1) && isActive && (
                                            <text x={node.x} y={node.y + nr + 11}
                                                textAnchor="middle"
                                                fontSize={isSel ? 11 : tier === 0 ? 10 : 9}
                                                fontWeight={isSel || tier === 0 ? 700 : 500}
                                                fill={isSel ? color : tier === 0 ? "rgba(255,255,255,0.82)" : "rgba(255,255,255,0.60)"}
                                                filter={isSel || tier === 0 ? "url(#label-glow)" : "none"}
                                                style={{ userSelect: "none", pointerEvents: "none" }}>
                                                {node.label}
                                            </text>
                                        )}
                                    </motion.g>
                                </motion.g>
                            );
                        })}
                    </motion.g>
                </motion.svg>

                {/* Hover tooltip */}
                <AnimatePresence>
                    {hoveredNodeId && (() => {
                        const node     = orbNodes.find((n) => n.id === hoveredNodeId);
                        if (!node) return null;
                        const district = districts.find((d) => d.id === node.districtId);
                        const color    = district?.color ?? "#a78bfa";
                        return (
                            <motion.div key={hoveredNodeId}
                                initial={{ opacity: 0, y: 4, scale: 0.96 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.96 }}
                                transition={{ duration: 0.14 }}
                                className="absolute top-4 left-1/2 -translate-x-1/2 z-20
                                           px-3 py-2.5 rounded-[14px] border backdrop-blur-xl pointer-events-none"
                                style={{ background: "rgba(4,4,10,0.94)", borderColor: color + "44",
                                    boxShadow: `0 0 28px ${color}18` }}>
                                <p className="text-[13px] font-semibold" style={{ color }}>{node.label}</p>
                                <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.38)" }}>
                                    {district?.label} · {node.visits} visits
                                    {node.bridgeScore > 0.25 && <span className="ml-2 text-amber-400">⬡ Bridge</span>}
                                </p>
                                <p className="text-[10px] mt-1" style={{ color: color + "66" }}>
                                    Click · Double-click → Journey
                                </p>
                            </motion.div>
                        );
                    })()}
                </AnimatePresence>

                {/* Selected node action panel */}
                <AnimatePresence>
                    {selectedNode && (() => {
                        const node     = orbNodes.find((n) => n.id === selectedNode.id);
                        const district = districts.find((d) => d.id === node?.districtId);
                        const color    = district?.color ?? "#a78bfa";
                        return (
                            <motion.div key={selectedNode.id}
                                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                                transition={{ duration: 0.2 }}
                                className="absolute bottom-4 right-4 flex flex-col gap-2 px-4 py-3
                                           rounded-[16px] border backdrop-blur-xl"
                                style={{ background: "rgba(4,4,10,0.94)", borderColor: color + "44",
                                    boxShadow: `0 0 28px ${color}18`, minWidth: 200 }}>
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }} />
                                        <span className="text-[13px] font-semibold" style={{ color }}>{selectedNode.label}</span>
                                    </div>
                                    <button onClick={() => setSelectedNode(null)} className="text-label-tertiary hover:text-label text-[11px]">×</button>
                                </div>
                                <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                                    {district?.label} district · {node?.visits ?? 0} visits
                                </p>
                                <div className="flex gap-2">
                                    <button onClick={() => setMode("journey", "structure")}
                                        className="flex-1 px-2.5 py-1.5 rounded-[9px] border text-[11px] font-semibold transition-all duration-150 hover:scale-[1.02]"
                                        style={{ backgroundColor: color + "18", borderColor: color + "55", color }}>
                                        Flows →
                                    </button>
                                    <button onClick={() => setMode("time", "structure")}
                                        className="flex-1 px-2.5 py-1.5 rounded-[9px] border text-[11px] font-semibold transition-all duration-150 hover:scale-[1.02]"
                                        style={{ backgroundColor: "#34d39918", borderColor: "#34d39955", color: "#34d399" }}>
                                        Time →
                                    </button>
                                    <button onClick={() => {
                                        const cluster = district ? data.clusters.find((c) => c.id === district.id) : null;
                                        if (cluster) {
                                            setSelectedCategory(cluster.category);
                                            setMode("stream", "structure");
                                        }
                                    }}
                                        className="flex-1 px-2.5 py-1.5 rounded-[9px] border text-[11px] font-semibold transition-all duration-150 hover:scale-[1.02]"
                                        style={{ backgroundColor: "#f472b618", borderColor: "#f472b655", color: "#f472b6" }}>
                                        Patterns →
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })()}
                </AnimatePresence>
            </div>

            {/* ── Right panel ──────────────────────────────────────── */}
            <StructurePanel data={data} insights={insights} districts={districts}
                orbNodes={orbNodes} routes={routes} panelTab={panelTab}
                setPanelTab={setPanelTab} activeDistrictId={activeDistrictId}
                onZoomToDistrict={zoomToCluster => zoomToDistrict(zoomToCluster)} />
        </div>
    );
}

// ─── Panel ────────────────────────────────────────────────────────────────────

function StructurePanel({
    data, insights, districts, orbNodes, routes,
    panelTab, setPanelTab, activeDistrictId, onZoomToDistrict,
}: {
    data: ReturnType<typeof buildStructureData>;
    insights: ReturnType<typeof buildClusterInsights>;
    districts: DistrictLayout[];
    orbNodes: OrbitalNode[];
    routes: TransitRoute[];
    panelTab: PanelTab;
    setPanelTab: (t: PanelTab) => void;
    activeDistrictId: string | null;
    onZoomToDistrict: (id: string) => void;
}) {
    const TAB_ICONS: Record<PanelTab, string> = {
        districts: "◈", transit: "⬡", density: "◎", insights: "✦",
    };

    return (
        <div className="w-[260px] flex-shrink-0 flex flex-col border-l border-white/[0.07] bg-white/[0.015] backdrop-blur-xl overflow-hidden">
            <div className="flex-shrink-0 flex border-b border-white/[0.07] bg-white/[0.02]">
                {PANEL_TABS.map((tab) => {
                    const active = panelTab === tab;
                    return (
                        <button key={tab} onClick={() => setPanelTab(tab)}
                            className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[9px] font-bold uppercase tracking-wider transition-colors duration-150 border-b-2
                                ${active ? "text-accent border-accent/60 bg-accent/[0.06]" : "text-label-tertiary border-transparent hover:text-label-secondary"}`}>
                            <span className="text-[12px]">{TAB_ICONS[tab]}</span>
                            <span className="hidden sm:block">{tab}</span>
                        </button>
                    );
                })}
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3" style={{ scrollbarWidth: "thin" }}>
                <AnimatePresence mode="wait">

                    {panelTab === "districts" && (
                        <motion.div key="d" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="flex flex-col gap-3">
                            {districts.map((d) => {
                                const nodes   = orbNodes.filter((n) => n.districtId === d.id);
                                const total   = nodes.reduce((s, n) => s + n.visits, 0);
                                const hub     = [...nodes].sort((a, b) => b.visits - a.visits)[0];
                                const isAct   = !activeDistrictId || activeDistrictId === d.id;
                                return (
                                    <motion.button key={d.id} onClick={() => onZoomToDistrict(d.id)}
                                        animate={{ opacity: isAct ? 1 : 0.35 }} transition={{ duration: 0.3 }}
                                        className="text-left px-3 py-2.5 rounded-[12px] border transition-all duration-150 hover:scale-[1.01]"
                                        style={{ backgroundColor: d.color + "0d", borderColor: d.color + "28" }}>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-[12px] font-semibold" style={{ color: d.color }}>{d.label}</span>
                                            <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>{total} visits</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1 mb-1.5">
                                            {nodes.map((n) => (
                                                <span key={n.id} className="text-[10px] px-1.5 py-0.5 rounded-md"
                                                    style={{ backgroundColor: d.color + "18", color: d.color + "cc" }}>
                                                    {n.label}
                                                </span>
                                            ))}
                                        </div>
                                        {hub && <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.38)" }}>
                                            Hub: <span style={{ color: d.color + "cc" }}>{hub.label}</span>
                                        </p>}
                                    </motion.button>
                                );
                            })}
                        </motion.div>
                    )}

                    {panelTab === "transit" && (
                        <motion.div key="t" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="flex flex-col gap-3">
                            <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                                Inter-district transit routes
                            </p>
                            {routes.filter((r) => r.isBridge).sort((a, b) => b.weight - a.weight).slice(0, 6).map((r) => {
                                const srcD = districts.find((d) => d.id === r.srcDistrict);
                                const tgtD = districts.find((d) => d.id === r.tgtDistrict);
                                if (!srcD || !tgtD) return null;
                                return (
                                    <div key={r.id} className="px-3 py-2.5 rounded-[12px] border border-white/[0.08] bg-white/[0.02]">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[11px] font-semibold" style={{ color: srcD.color }}>{r.srcId}</span>
                                            <span className="text-[10px] text-label-tertiary">⬡</span>
                                            <span className="text-[11px] font-semibold" style={{ color: tgtD.color }}>{r.tgtId}</span>
                                            <span className="ml-auto text-[10px] text-amber-400 font-bold">×{r.weight}</span>
                                        </div>
                                        <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                                            {srcD.label} ↔ {tgtD.label}
                                        </p>
                                    </div>
                                );
                            })}
                            {routes.filter((r) => r.isBridge).length === 0 && (
                                <p className="text-[12px] text-label-tertiary">No inter-district routes detected.</p>
                            )}
                        </motion.div>
                    )}

                    {panelTab === "density" && (
                        <motion.div key="dn" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="flex flex-col gap-3">
                            {districts.map((d) => {
                                const nodes   = orbNodes.filter((n) => n.districtId === d.id);
                                const total   = nodes.reduce((s, n) => s + n.visits, 0);
                                const maxTotal = Math.max(...districts.map((x) =>
                                    orbNodes.filter((n) => n.districtId === x.id).reduce((s, n) => s + n.visits, 0)), 1);
                                const pct = Math.round((total / maxTotal) * 100);
                                return (
                                    <div key={d.id} className="px-3 py-2.5 rounded-[12px] border"
                                        style={{ backgroundColor: d.color + "0d", borderColor: d.color + "22" }}>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-[12px] font-semibold" style={{ color: d.color }}>{d.label}</span>
                                            <span className="text-[11px] font-bold" style={{ color: d.color }}>{pct}%</span>
                                        </div>
                                        <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden mb-1.5">
                                            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                                                transition={{ duration: 0.7, ease: "easeOut" }}
                                                className="h-full rounded-full" style={{ backgroundColor: d.color }} />
                                        </div>
                                        <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                                            {total} total visits · {nodes.length} nodes
                                        </p>
                                    </div>
                                );
                            })}
                        </motion.div>
                    )}

                    {panelTab === "insights" && (
                        <motion.div key="i" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="flex flex-col gap-3">
                            <div className="px-3 py-2.5 rounded-[12px] border border-accent/[0.18] bg-accent/[0.05]">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-accent mb-1">Dominant District</p>
                                <p className="text-[13px] font-semibold text-label">{insights.strongestCluster}</p>
                            </div>
                            <div className="px-3 py-2.5 rounded-[12px] border border-accent/[0.12] bg-accent/[0.04]">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-accent mb-1">Semantic Overlap</p>
                                <p className="text-[12px] text-label leading-relaxed">{insights.overlapInsight}</p>
                            </div>
                            <div className="px-3 py-2.5 rounded-[12px] border border-violet-400/[0.18] bg-violet-400/[0.05]">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-violet-400 mb-1">Late Night</p>
                                <p className="text-[12px] text-label leading-relaxed">{insights.lateNightInsight}</p>
                            </div>
                            <div className="px-3 py-2.5 rounded-[12px] border border-white/[0.08] bg-white/[0.02]">
                                <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.28)" }}>Topology</p>
                                <p className="text-[12px] leading-relaxed" style={{ color: "rgba(255,255,255,0.52)" }}>
                                    {data.bridges.length} bridge nodes connect {CLUSTER_DEFS.length} districts.
                                    {" "}{routes.filter((r) => r.isBridge).length} inter-district transit routes active.
                                </p>
                            </div>
                            {insights.isolatedClusters.length > 0 && (
                                <div className="px-3 py-2.5 rounded-[12px] border border-white/[0.08] bg-white/[0.02]">
                                    <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.28)" }}>Isolated Regions</p>
                                    {insights.isolatedClusters.map((c) => (
                                        <p key={c} className="text-[12px]" style={{ color: "rgba(255,255,255,0.52)" }}>· {c}</p>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>
        </div>
    );
}
