"use client";

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useLayoutEffect,
} from "react";
import * as d3 from "d3";
import { motion, AnimatePresence } from "framer-motion";
import { eventTimeRangeMs, formatFocusDuration } from "@/lib/history-timeline";
import type { BrowsingEvent } from "./mock-data";
import {
  activePathEdgeKeys,
  computeFrameTransform,
  computeHierarchyLayout,
  EDGE_SILVER,
  GBR,
  linkBezierPath,
  type LaidOutNode,
} from "./hierarchy-layout";

export type ConsciousnessMapViewMode = "static" | "dynamic";

// Deep indigo-tinted glass for branch nodes — blends with the app background
const BRANCH_FILL = "rgba(20, 16, 48, 0.72)";
// Active-path edge glow in dynamic mode
const PATH_EDGE_GLOW = "rgba(96, 165, 250, 0.95)";

function faviconFor(url: string): string {
  try {
    const host = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64`;
  } catch {
    return "";
  }
}

function truncateTitle(title: string, max: number) {
  if (title.length <= max) return title;
  return `${title.slice(0, Math.max(0, max - 1))}...`;
}

type NodeKind = "root" | "active" | "terminated" | "branch";

function nodeKind(node: LaidOutNode, activeId: string | null): NodeKind {
  if (activeId && node.id === activeId) return "active";
  if (node.data.parentId === null) return "root";
  if (node.isEndNode) return "terminated";
  return "branch";
}

type MapNodeProps = {
  node: LaidOutNode;
  activeNodeId: string | null;
  expanded: boolean;
  onToggle: (id: string) => void;
  labelOpacity: number;
  entrance: boolean;
  viewMode: ConsciousnessMapViewMode;
  hovered: boolean;
  onHover: (id: string | null) => void;
};

function mapNodePropsEqual(a: MapNodeProps, b: MapNodeProps) {
  return (
    a.node.id === b.node.id &&
    a.node.x === b.node.x &&
    a.node.y === b.node.y &&
    a.node.radius === b.node.radius &&
    a.node.isStartNode === b.node.isStartNode &&
    a.node.isEndNode === b.node.isEndNode &&
    a.node.data.parentId === b.node.data.parentId &&
    a.node.data.title === b.node.data.title &&
    a.node.data.url === b.node.data.url &&
    a.node.data.timeSpentSeconds === b.node.data.timeSpentSeconds &&
    a.activeNodeId === b.activeNodeId &&
    a.expanded === b.expanded &&
    Math.abs(a.labelOpacity - b.labelOpacity) < 0.02 &&
    a.entrance === b.entrance &&
    a.viewMode === b.viewMode &&
    a.hovered === b.hovered
  );
}

const MapNode = memo(function MapNode({
  node,
  activeNodeId,
  expanded,
  onToggle,
  labelOpacity,
  entrance,
  viewMode,
  hovered,
  onHover,
}: MapNodeProps) {
  const { data, x, y, radius } = node;
  const kind = nodeKind(node, activeNodeId);
  // Sanitize id for use in SVG gradient ids
  const safeId = node.id.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 40) || "n";
  const gradId = `ng-${safeId}`;
  const specId = `ns-${safeId}`;

  // GBR color selection (F1 & Football inspired)
  let mainColor: string = GBR.green;
  let glowFilterId = "gbr-glow-green";
  if (kind === "active") {
    mainColor = GBR.blue;
    glowFilterId = "gbr-glow-blue";
  } else if (kind === "terminated") {
    mainColor = GBR.red;
    glowFilterId = "gbr-glow-red";
  } else if (kind === "branch") {
    mainColor = GBR.papaya;
    glowFilterId = "gbr-glow-papaya";
  }

  const fav = faviconFor(data.url);
  const titleShort = truncateTitle(data.title, Math.max(8, Math.floor(radius / 4.2)));
  const iconSize = Math.min(28, radius * 0.5);
  const now = Date.now();
  const { start } = eventTimeRangeMs(data, now);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle(node.id);
  };

  const panelW = 272;
  const panelH = 200;
  // Font size scales with radius, clamped for readability
  const fs = Math.max(9, Math.min(13, radius * 0.22));
  const showChrome = labelOpacity > 0.05;

  // Hover bloom radius
  const bloomR = hovered ? radius + 24 : radius + 16;
  const bloomOpacity = hovered ? 0.32 : 0.18;

  // Tooltip for hover info
  const fsTooltip = Math.max(11, Math.min(13, radius * 0.25));

  return (
    <g
      transform={`translate(${x},${y})`}
      style={{ cursor: "pointer" }}
      onClick={handleClick}
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
    >
      <defs>
        {/*
         * Liquid Glass Gradient
         */}
        {/* 
         * Liquid Glass Gradient:
         * Higher saturation and contrast for a "ripe fruit" look.
         */}
        <radialGradient id={gradId} cx="30%" cy="25%" r="90%">
          <stop offset="0%" stopColor="rgba(255,255,255,1)" stopOpacity={1} />
          <stop offset="25%" stopColor={mainColor} stopOpacity={0.95} />
          <stop offset="60%" stopColor={mainColor} stopOpacity={0.6} />
          <stop offset="100%" stopColor={mainColor} stopOpacity={0.2} />
        </radialGradient>
        <radialGradient id={specId} cx="40%" cy="30%" r="50%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.7)" stopOpacity={1} />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" stopOpacity={0} />
        </radialGradient>
      </defs>

      {/* ── 1. The Gooey Shape (Merged with branches) - ONLY IN DYNAMIC MODE ── */}
      {viewMode === "dynamic" && (
        <g filter="url(#metaball-filter)">
          <motion.g
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: hovered ? 1.12 : 1, 
              opacity: 1,
            }}
            transition={{ 
              scale: { type: "spring", stiffness: 400, damping: 25 },
              duration: 1.2,
              ease: "backOut"
            }}
          >
            <circle
              r={radius}
              fill={mainColor}
              stroke="none"
            />
          </motion.g>
        </g>
      )}

      {/* ── 2. The Glass & Sharp Detail ── */}
      <motion.g
        initial={entrance ? { scale: 0, opacity: 0 } : false}
        animate={viewMode === "dynamic" ? {
          scale: hovered ? 1.12 : 1,
          opacity: 1,
          y: 0,
          x: 0,
        } : { 
          scale: hovered ? 1.3 : 1, 
          opacity: 1,
          y: hovered ? -10 : [0, -3, 0], 
          x: hovered ? 0 : [0, 1.5, 0],
        }}
        transition={viewMode === "dynamic" ? {
          scale: { type: "spring", stiffness: 400, damping: 25 },
          duration: 1.2,
          ease: "backOut"
        } : { 
          scale: { type: "spring", stiffness: 400, damping: 25 },
          y: hovered 
            ? { type: "spring", stiffness: 400, damping: 25 }
            : { duration: 4 + Math.random() * 2, repeat: Infinity, ease: "easeInOut" },
          x: { duration: 5 + Math.random() * 2, repeat: Infinity, ease: "easeInOut" }
        }}
      >
        {/* Glass Sheen */}
        <circle
          r={radius}
          fill={`url(#${gradId})`}
          stroke="rgba(255,255,255,0.4)"
          strokeWidth={viewMode === "dynamic" ? 1.8 : 1.2}
          filter="url(#node-shadow)"
        />

        <circle
          r={radius}
          fill={`url(#${specId})`}
          style={{ pointerEvents: "none" }}
        />

        {/* Dynamic Mode: Internal Bold Label */}
        {viewMode === "dynamic" && showChrome && (
          <>
            <text
              textAnchor="middle"
              dominantBaseline="middle"
              fill="rgba(255,255,255,1)"
              fontSize={fs + 8}
              fontWeight={900}
              fontFamily="Inter, -apple-system, sans-serif"
              opacity={labelOpacity}
              style={{ 
                pointerEvents: "none", 
                userSelect: "none",
                filter: "drop-shadow(0 2px 10px rgba(0,0,0,0.95))"
              }}
            >
              {titleShort}
            </text>
            {fav && (
              <image
                href={fav}
                x={-16}
                y={-radius * 0.5 - 16}
                width={32}
                height={32}
                opacity={labelOpacity}
                style={{ pointerEvents: "none" }}
              />
            )}
          </>
        )}
      </motion.g>

      {/* ── Static Mode: Sharp External Infographic label ── */}
      {viewMode === "static" && showChrome && (
        <g transform={`translate(0, ${-radius - 25})`}>
          <text
            textAnchor="middle"
            dominantBaseline="middle"
            fill="rgba(255,255,255,0.95)"
            fontSize={fs + 1}
            fontWeight={800}
            fontFamily="Inter, -apple-system, sans-serif"
            opacity={labelOpacity}
            style={{ 
              pointerEvents: "none", 
              userSelect: "none",
              filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.8))"
            }}
          >
            {titleShort}
          </text>
          {fav && (
            <image
              href={fav}
              x={-12}
              y={-35}
              width={24}
              height={24}
              opacity={labelOpacity}
              style={{ pointerEvents: "none" }}
            />
          )}
        </g>
      )}

      {/* ── Hover Tooltip ── */}
      <AnimatePresence>
        {hovered && !expanded && (
          <motion.g
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            style={{ pointerEvents: "none" }}
          >
            <rect
              x={-80}
              y={-radius - 45}
              width={160}
              height={32}
              rx={10}
              fill="rgba(10, 8, 28, 0.92)"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth={1}
            />
            <text
              x={0}
              y={-radius - 25}
              textAnchor="middle"
              fill="white"
              fontSize={11}
              fontWeight={600}
            >
              {truncateTitle(data.title, 20)}
            </text>
          </motion.g>
        )}
      </AnimatePresence>

      {/* ── Expanded detail panel ── */}
      <AnimatePresence mode="wait">
        {expanded ? (
          <foreignObject
            key="detail"
            x={-panelW / 2}
            y={radius + 18}
            width={panelW}
            height={panelH}
          >
            {/* @ts-expect-error XHTML xmlns required for SVG foreignObject */}
            <div xmlns="http://www.w3.org/1999/xhtml" className="h-full w-full">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -6 }}
                transition={{ type: "spring", stiffness: 500, damping: 36 }}
                style={{
                  width: panelW,
                  boxSizing: "border-box",
                  transformOrigin: "center top",
                  background: "rgba(10, 8, 28, 0.88)",
                  backdropFilter: "blur(24px) saturate(200%)",
                  WebkitBackdropFilter: "blur(24px) saturate(200%)",
                  border: `1px solid ${mainColor}44`,
                  borderRadius: 20,
                  padding: "16px",
                  boxShadow: `0 12px 48px rgba(0,0,0,0.6), 0 0 20px ${mainColor}22`,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                   {fav && <img src={fav} style={{ width: 20, height: 20, borderRadius: 4 }} />}
                   <p style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.98)", lineHeight: 1.4, margin: 0 }}>
                    {data.title}
                  </p>
                </div>
                
                <a
                  href={data.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: "block", marginTop: 8, fontSize: 11, color: GBR.blue, textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", opacity: 0.8 }}
                >
                  {new URL(data.url).hostname}
                </a>
                
                <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 6 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 10, background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" }}>
                    {formatFocusDuration(data.timeSpentSeconds)}
                  </span>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 10, background: `${mainColor}22`, color: mainColor }}>
                    {kind.toUpperCase()}
                  </span>
                </div>

                <p style={{ marginTop: 12, fontFamily: "monospace", fontSize: 10, color: "rgba(148,163,184,0.7)" }}>
                  Captured {new Date(start).toLocaleTimeString()}
                </p>
                
                <button
                  style={{
                    marginTop: 14,
                    width: "100%",
                    padding: "8px",
                    borderRadius: 10,
                    background: mainColor,
                    color: "white",
                    border: "none",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: `0 4px 12px ${mainColor}44`
                  }}
                  onClick={() => window.open(data.url, '_blank')}
                >
                  View Details
                </button>
              </motion.div>
            </div>
          </foreignObject>
        ) : null}
      </AnimatePresence>
    </g>
  );
}, mapNodePropsEqual);

function clamp01(t: number) {
  return Math.max(0, Math.min(1, t));
}

export function ConsciousnessMap({
  events,
  viewMode,
  activeNodeId,
  followCamera,
  expandedNodeId,
  onExpandedChange,
  playbackSpeed = 1,
  recenterVersion = 0,
  springEntranceNodeId = null,
}: {
  events: BrowsingEvent[];
  viewMode: ConsciousnessMapViewMode;
  activeNodeId: string | null;
  followCamera: boolean;
  expandedNodeId: string | null;
  onExpandedChange: (id: string | null) => void;
  playbackSpeed?: number;
  recenterVersion?: number;
  springEntranceNodeId?: string | null;
}) {
  const layout = useMemo(() => computeHierarchyLayout(events, viewMode), [events, viewMode]);
  const layoutRef = useRef(layout);
  layoutRef.current = layout;

  const byId = useMemo(
    () => new Map(layout.nodes.map((n) => [n.id, n])),
    [layout.nodes]
  );

  const pathEdges = useMemo(
    () =>
      viewMode === "dynamic" && activeNodeId
        ? activePathEdgeKeys(events, activeNodeId)
        : new Set<string>(),
    [viewMode, events, activeNodeId]
  );

  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const svgSelRef = useRef<d3.Selection<SVGSVGElement, unknown, null, undefined> | null>(null);
  const transformRef = useRef({ x: 0, y: 0, k: 1 });
  const followRef = useRef(followCamera);
  followRef.current = followCamera;

  const [labelZoom, setLabelZoom] = useState(1);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const labelRaf = useRef<number>(0);

  const scheduleLabelZoom = useCallback((k: number) => {
    if (labelRaf.current) cancelAnimationFrame(labelRaf.current);
    labelRaf.current = requestAnimationFrame(() => {
      setLabelZoom(k);
      labelRaf.current = 0;
    });
  }, []);

  // ── Camera Following for Dynamic Growth ─────────────────────────────
  useEffect(() => {
    if (viewMode !== "dynamic" || !activeNodeId || !followCamera) return;
    
    const node = byId.get(activeNodeId);
    if (!node) return;

    const svgEl = svgRef.current;
    if (!svgEl) return;

    const w = svgEl.clientWidth;
    const h = svgEl.clientHeight;
    if (!w || !h) return;

    // Zoom level for growth following: closer in for larger nodes
    const k = Math.max(0.4, Math.min(0.9, 180 / node.radius));
    
    // Position the newest node in the lower half of the screen
    // so the "growth" is visible above it.
    const tx = w / 2 - k * node.x;
    const ty = h * 0.6 - k * node.y;

    const t = d3.zoomIdentity.translate(tx, ty).scale(k);
    
    d3.select(svgEl)
      .transition()
      .duration(1000)
      .ease(d3.easeCubicOut)
      .call((transition) => {
        zoomRef.current?.transform(transition as never, t);
      });

    transformRef.current = { x: t.x, y: t.y, k: t.k };
    scheduleLabelZoom(k);
  }, [activeNodeId, viewMode, followCamera, byId, scheduleLabelZoom]);

  // Label fades in as user zooms in
  const labelOpacity = viewMode === "dynamic"
    ? 1
    : clamp01((labelZoom - 0.1) / 0.4);

  const handleToggle = useCallback(
    (id: string) => {
      onExpandedChange(expandedNodeId === id ? null : id);
      if (viewMode !== "static") return;
      const n = byId.get(id);
      if (!n) return;
      const svgEl = svgRef.current;
      if (!svgEl) return;
      const w = svgEl.clientWidth;
      const h = svgEl.clientHeight;
      if (!w || !h) return;
      const k = Math.min(2.5, Math.max(1.0, 160 / n.radius));
      const t = d3.zoomIdentity.translate(w / 2 - k * n.x, h / 2 - k * n.y).scale(k);
      const gEl = gRef.current;
      if (!gEl) return;
      transformRef.current = { x: t.x, y: t.y, k: t.k };
      d3.select(gEl).attr("transform", t.toString());
      scheduleLabelZoom(k);
    },
    [expandedNodeId, onExpandedChange, viewMode, byId, scheduleLabelZoom]
  );

  const clearExpand = useCallback(() => {
    onExpandedChange(null);
  }, [onExpandedChange]);

  // ── D3 zoom setup ──────────────────────────────────────────────────────
  useEffect(() => {
    const svgEl = svgRef.current;
    const gEl = gRef.current;
    if (!svgEl || !gEl) return;

    const svg = d3.select(svgEl);
    const g = d3.select(gEl);

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.02, 8])
      .filter((event) => {
        if (followRef.current) return false;
        return !event.ctrlKey || event.type === "wheel";
      })
      .on("zoom", (event) => {
        if (followRef.current) return;
        const t = event.transform;
        transformRef.current = { x: t.x, y: t.y, k: t.k };
        g.attr("transform", t.toString());
        scheduleLabelZoom(t.k);
      });

    svg.call(zoom);
    zoomRef.current = zoom;
    svgSelRef.current = svg;

    return () => {
      svg.on(".zoom", null);
      zoomRef.current = null;
      svgSelRef.current = null;
    };
  }, [scheduleLabelZoom]);

  // ── True Autofit: Centers the entire bounding box ─────────────────────
  const fitView = useCallback(() => {
    const svgEl = svgRef.current;
    const gEl = gRef.current;
    const zoom = zoomRef.current;
    const svgSel = svgSelRef.current;
    const L = layoutRef.current;
    if (!svgEl || !gEl || !zoom || !svgSel || L.nodes.length === 0) return;

    const w = svgEl.clientWidth;
    const h = svgEl.clientHeight;
    if (!w || !h) return;

    const pad = 60;
    const kw = (w - pad * 2) / L.width;
    const kh = (h - pad * 2) / L.height;
    // Fit to viewport, max zoom 2.0
    const k = Math.max(0.04, Math.min(Math.min(kw, kh), 2.0));

    // Center the entire layout bounding box
    const tx = w / 2 - k * (L.width / 2);
    const ty = h / 2 - k * (L.height / 2);

    const t = d3.zoomIdentity.translate(tx, ty).scale(k);
    transformRef.current = { x: t.x, y: t.y, k: t.k };
    d3.select(gEl).attr("transform", t.toString());
    svgSel.call(zoom.transform, t);
    scheduleLabelZoom(k);
  }, [scheduleLabelZoom]);

  // ── Animated recenter (smooth fly-to) ─────────────────────────────────
  const animateTo = useCallback(
    (target: d3.ZoomTransform, duration = 800) => {
      const gEl = gRef.current;
      const svgSel = svgSelRef.current;
      const zoom = zoomRef.current;
      if (!gEl || !svgSel || !zoom) return;

      const cur = { ...transformRef.current };
      const t0 = performance.now();
      const ease = (u: number) => 1 - Math.pow(1 - u, 3);
      let raf = 0;

      const step = (now: number) => {
        const u = ease(Math.min(1, (now - t0) / duration));
        const x = cur.x + (target.x - cur.x) * u;
        const y = cur.y + (target.y - cur.y) * u;
        const k = cur.k + (target.k - cur.k) * u;
        const tr = d3.zoomIdentity.translate(x, y).scale(k);
        transformRef.current = { x, y, k };
        d3.select(gEl).attr("transform", tr.toString());
        scheduleLabelZoom(k);
        if (u < 1) {
          raf = requestAnimationFrame(step);
        } else {
          svgSel.call(zoom.transform, target);
        }
      };
      raf = requestAnimationFrame(step);
      return () => cancelAnimationFrame(raf);
    },
    [scheduleLabelZoom]
  );

  // ── Robust ResizeObserver for Autofit ────────────────────────────────
  useLayoutEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    const observer = new ResizeObserver(() => {
      if (!followCamera) {
        fitView();
      }
    });

    observer.observe(svgEl);
    return () => observer.disconnect();
  }, [fitView, followCamera]);

  // ── Initial fit on layout change ──────────────────────────────────────
  useEffect(() => {
    if (followCamera) return;
    // Small delay to ensure SVG has measured dimensions
    const id = requestAnimationFrame(() => fitView());
    return () => cancelAnimationFrame(id);
  }, [
    layout.width,
    layout.height,
    layout.nodes.length,
    followCamera,
    fitView,
  ]);

  // ── Recenter button: animated perfect-fit ─────────────────────────────
  useEffect(() => {
    if (!recenterVersion) return;
    const L = layoutRef.current;
    if (L.nodes.length === 0) return;
    const svgEl = svgRef.current;
    const zoom = zoomRef.current;
    const svgSel = svgSelRef.current;
    const gEl = gRef.current;
    if (!svgEl || !zoom || !svgSel || !gEl) return;

    const w = svgEl.clientWidth;
    const h = svgEl.clientHeight;
    if (!w || !h) return;

    const pad = 50;
    const kw = (w - pad * 2) / L.width;
    const kh = (h - pad * 2) / L.height;
    const k = Math.max(0.05, Math.min(Math.min(kw, kh) * 0.85, 2.2));

    const root = L.nodes.find((n) => n.data.parentId === null) ?? L.nodes[0];
    if (!root) return;

    const topOffset = h * 0.10 + root.radius * k;
    const tx = w / 2 - k * root.x;
    const ty = topOffset - k * root.y;
    const target = d3.zoomIdentity.translate(tx, ty).scale(k);

    animateTo(target, 800);
  }, [recenterVersion, animateTo]);

  // ── Follow-camera in dynamic mode ─────────────────────────────────────
  useEffect(() => {
    if (!followCamera || !activeNodeId) return;

    const svgEl = svgRef.current;
    const gEl = gRef.current;
    const svgSel = svgSelRef.current;
    if (!svgEl || !gEl || !svgSel) return;

    const active = byId.get(activeNodeId);
    if (!active) return;
    const parent = active.data.parentId ? byId.get(active.data.parentId) : undefined;

    const w = svgEl.clientWidth;
    const h = svgEl.clientHeight;
    if (!w || !h) return;

    const { tx, ty, k } = computeFrameTransform(parent, active, w, h, 60);
    const target = d3.zoomIdentity.translate(tx, ty).scale(k);
    animateTo(target, Math.max(220, 700 / playbackSpeed));
  }, [followCamera, activeNodeId, byId, playbackSpeed, animateTo]);

  const bgPad = 600;

  return (
    <svg
      ref={svgRef}
      className="h-full w-full min-h-0 touch-none select-none"
      role="img"
      aria-label="Consciousness map — browsing history tree"
      style={{ background: "transparent" }}
      enableBackground="new"
    >
      <defs>
        {/* ── Outer bloom filter (ambient halo) ── */}
        <filter id="gbr-outer-bloom" x="-120%" y="-120%" width="340%" height="340%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/*
         * ── Node glass frost filter ──────────────────────────────────────
         * Simulates backdrop-filter: blur(12px) for SVG circles.
         * Blurs the background content behind the node shape, then composites
         * the node fill on top — giving a true frosted-glass look.
         */}
        <filter id="node-frost" x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="BackgroundImage" stdDeviation="12" result="blurred" />
          <feComposite in="blurred" in2="SourceGraphic" operator="in" result="frosted" />
          <feBlend in="frosted" in2="SourceGraphic" mode="normal" />
        </filter>

        {/* ── Node drop shadow (glass depth) ── */}
        <filter id="node-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="rgba(0,0,0,0.5)" floodOpacity="1" />
        </filter>

        {/* ── Green glow ── */}
        <filter id="gbr-glow-green" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feFlood floodColor={GBR.green} floodOpacity="0.75" result="f" />
          <feComposite in="f" in2="b" operator="in" result="c" />
          <feMerge>
            <feMergeNode in="c" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* ── Blue glow ── */}
        <filter id="gbr-glow-blue" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feFlood floodColor={GBR.blue} floodOpacity="0.75" result="f" />
          <feComposite in="f" in2="b" operator="in" result="c" />
          <feMerge>
            <feMergeNode in="c" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* ── Red glow (CCP Red) ── */}
        <filter id="gbr-glow-red" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="8" result="b" />
          <feFlood floodColor={GBR.red} floodOpacity="0.85" result="f" />
          <feComposite in="f" in2="b" operator="in" result="c" />
          <feMerge>
            <feMergeNode in="c" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* ── Papaya glow (McLaren) ── */}
        <filter id="gbr-glow-papaya" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feFlood floodColor={GBR.papaya} floodOpacity="0.8" result="f" />
          <feComposite in="f" in2="b" operator="in" result="c" />
          <feMerge>
            <feMergeNode in="c" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* ── Neutral glow for fallback ── */}
        <filter id="gbr-glow-neutral" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* ── Metaball Merge Filter (Super Gooey + White Outline) ── */}
        <filter id="metaball-filter" x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="24" result="blur" />
          <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 60 -24" result="gooey" />
          
          <feMorphology in="gooey" operator="dilate" radius="3.5" result="outline" />
          <feFlood floodColor="white" result="white" />
          <feComposite in="white" in2="outline" operator="in" result="white-outline" />
          
          <feMerge>
            <feMergeNode in="white-outline" />
            <feMergeNode in="gooey" />
          </feMerge>
          <feComposite in="SourceGraphic" in2="gooey" operator="atop" />
        </filter>

        {/* ── Branch Path Glow ── */}
        <filter id="path-glow" filterUnits="userSpaceOnUse" x="-5000" y="-5000" width="10000" height="10000">
          <feGaussianBlur stdDeviation="6" result="glow" />
          <feComposite in="SourceGraphic" in2="glow" operator="over" />
        </filter>

        {/* ── Edge glow for active path in dynamic mode ── */}
        <filter id="edge-glow" filterUnits="userSpaceOnUse" x="-5000" y="-5000" width="10000" height="10000">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g 
        ref={gRef} 
        style={viewMode === "dynamic" ? { filter: "drop-shadow(0 20px 30px rgba(0,0,0,0.45))" } : undefined}
      >
        <rect
          x={-bgPad}
          y={-bgPad}
          width={layout.width + bgPad * 2}
          height={layout.height + bgPad * 2}
          fill="transparent"
          onClick={clearExpand}
        />

        {/* ── Dynamic Mode: Botanical Growth Branches ── */}
        {viewMode === "dynamic" && (
          <>
            <defs>
              {layout.links.map((l) => {
                const key = `grad-${l.source.id}->${l.target.id}`;
                const srcKind = nodeKind(l.source, activeNodeId);
                const tgtKind = nodeKind(l.target, activeNodeId);
                const startColor = srcKind === "active" ? GBR.blue : srcKind === "root" ? GBR.green : "#1e293b";
                const endColor = tgtKind === "active" ? GBR.blue : tgtKind === "terminated" ? GBR.red : GBR.papaya;
                return (
                  <linearGradient key={key} id={key} gradientUnits="userSpaceOnUse" x1={l.source.x} y1={l.source.y} x2={l.target.x} y2={l.target.y}>
                    <stop offset="0%" stopColor={startColor} />
                    <stop offset="100%" stopColor={endColor} />
                  </linearGradient>
                );
              })}
            </defs>

            {/* Gooey Base layer */}
            <g filter="url(#metaball-filter)">
              {layout.links.map((l) => {
                const d = linkBezierPath(l.source, l.target);
                const key = `branch-${l.source.id}->${l.target.id}`;
                let depth = 0;
                let parentId = l.source.data.parentId;
                while (parentId) {
                  depth += 1;
                  parentId = byId.get(parentId)?.data.parentId ?? null;
                }
                const strokeWidth = Math.max(35, 140 / (depth + 1));
                return (
                  <motion.path
                    key={key}
                    d={d}
                    fill="none"
                    stroke={`url(#grad-${l.source.id}->${l.target.id})`}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                  />
                );
              })}
            </g>

            {/* Path Glow layer */}
            <g filter="url(#path-glow)">
              {layout.links.map((l) => {
                const d = linkBezierPath(l.source, l.target);
                const key = `flow-${l.source.id}->${l.target.id}`;
                const onPath = pathEdges.has(key.replace("flow-", ""));
                const tgtKind = nodeKind(l.target, activeNodeId);
                let flowColor = l.source.data.parentId === null ? GBR.green : tgtKind === "active" ? GBR.blue : tgtKind === "terminated" ? GBR.red : "rgba(255,255,255,0.45)";
                const isActivePath = onPath;
                return (
                  <motion.path
                    key={key}
                    d={d}
                    fill="none"
                    stroke={flowColor}
                    strokeWidth={isActivePath ? 14 : 4}
                    strokeLinecap="round"
                    strokeOpacity={isActivePath ? 1 : 0.7}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.8, ease: "easeInOut" }}
                    style={{
                      animation: isActivePath ? "gbr-edge-pulse 1.4s ease-in-out infinite, gbr-edge-flow 2s linear infinite" : "none",
                      strokeDashoffset: 20
                    }}
                  />
                );
              })}
            </g>
          </>
        )}

        {/* ── Static Mode: Structured Standard Edges ── */}
        {viewMode === "static" && layout.links.map((l) => {
          const d = linkBezierPath(l.source, l.target);
          const key = `branch-${l.source.id}->${l.target.id}`;
          const onPath = pathEdges.has(key.replace("branch-", ""));
          const tgtKind = nodeKind(l.target, activeNodeId);
          let edgeColor = l.source.data.parentId === null ? GBR.green : tgtKind === "active" ? GBR.blue : tgtKind === "terminated" ? GBR.red : "rgba(255,255,255,0.15)";
          return (
            <g key={key}>
              <path
                d={d}
                fill="none"
                stroke="rgba(30, 30, 50, 0.8)"
                strokeWidth={18}
                strokeLinecap="round"
              />
              <path
                d={d}
                fill="none"
                stroke={edgeColor}
                strokeWidth={4}
                strokeLinecap="round"
                strokeOpacity={0.6}
              />
            </g>
          );
        })}

        {/* ── Shared Nodes ── */}
        {layout.nodes.map((n) => (
          <MapNode
            key={n.id}
            node={n}
            activeNodeId={activeNodeId}
            expanded={expandedNodeId === n.id}
            onToggle={handleToggle}
            labelOpacity={labelOpacity}
            entrance={springEntranceNodeId === n.id}
            viewMode={viewMode}
            hovered={hoveredId === n.id}
            onHover={setHoveredId}
          />
        ))}
      </g>
    </svg>
  );
}
