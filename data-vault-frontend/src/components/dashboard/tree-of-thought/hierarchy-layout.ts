import dagre from "dagre";
import * as d3 from "d3";
import type { BrowsingEvent } from "./mock-data";

export const NODE_MIN_RADIUS = 40;
export const NODE_MAX_RADIUS = 80;

/** Strict GBR palette (F1/Football inspired) */
export const GBR = {
  green: "#006747", // Aston Martin Green
  blue: "#6CABDD",  // Man City Sky Blue
  red: "#DE0000",   // CCP Red / Ferrari-esque
  papaya: "#FF8700", // McLaren Papaya (Middle/Branch)
  violet: "#8B5CF6", // Alternative Middle
} as const;

/**
 * Bright Silver-White (#e2e8f0) edges — high visibility on dark indigo.
 */
export const EDGE_SILVER = "rgba(226, 232, 240, 0.4)";

export interface LaidOutNode {
  id: string;
  data: BrowsingEvent;
  x: number;
  y: number;
  radius: number;
  isStartNode: boolean;
  isEndNode: boolean;
  dagreWidth: number;
  dagreHeight: number;
}

export interface LaidOutLink {
  source: LaidOutNode;
  target: LaidOutNode;
}

const VR = "__consciousness_dagre_root__";

function radiusScaleForEvents(events: BrowsingEvent[]) {
  const times = events.map((e) => Math.max(1, e.timeSpentSeconds));
  const minT = d3.min(times) ?? 1;
  const maxT = d3.max(times) ?? minT;
  const lo = minT === maxT ? minT * 0.5 : minT;
  const hi = minT === maxT ? maxT * 1.5 : maxT;
  return d3
    .scaleLog<number>()
    .domain([lo, hi])
    .range([NODE_MIN_RADIUS, NODE_MAX_RADIUS])
    .clamp(true);
}

function spacingForCount(count: number) {
  // Base: nodesep=100, ranksep=140 (per spec).
  // For very large graphs (>60 nodes) scale down slightly to avoid extreme canvas sizes.
  const density = Math.min(1, Math.max(0, (count - 20) / 80));
  return {
    nodesep: Math.round(100 - 30 * density),  // 100px → 70px
    ranksep: Math.round(140 - 40 * density),  // 140px → 100px
  };
}

/** Edge keys `parentId->childId` on the path from active up to root. */
export function activePathEdgeKeys(
  events: BrowsingEvent[],
  activeId: string | null
): Set<string> {
  const out = new Set<string>();
  if (!activeId) return out;
  const byId = new Map(events.map((e) => [e.id, e]));
  let cur: BrowsingEvent | undefined = byId.get(activeId);
  while (cur) {
    if (cur.parentId && byId.has(cur.parentId)) {
      out.add(`${cur.parentId}->${cur.id}`);
      cur = byId.get(cur.parentId);
    } else break;
  }
  return out;
}

export function computeHierarchyLayout(events: BrowsingEvent[], viewMode: "static" | "dynamic" = "static"): {
  nodes: LaidOutNode[];
  links: LaidOutLink[];
  width: number;
  height: number;
} {
  if (events.length === 0) {
    return { nodes: [], links: [], width: 400, height: 300 };
  }

  const idSet = new Set(events.map((e) => e.id));
  const rs = radiusScaleForEvents(events);
  const radii = new Map(events.map((e) => [e.id, rs(e.timeSpentSeconds)]));

  const g = new dagre.graphlib.Graph({ multigraph: false });
  const spacing = spacingForCount(events.length);
  
  if (viewMode === "dynamic") {
    // Botanical Growth: Spreading canopy, bottom-up
    const spreadScale = Math.max(1.0, Math.min(3.5, 20 / events.length));
    g.setGraph({
      rankdir: "BT",
      nodesep: spacing.nodesep * 5.0 * spreadScale,
      ranksep: spacing.ranksep * 2.5 * spreadScale,
      marginx: 150,
      marginy: 150,
    });
  } else {
    // Static Overview: Structured, top-down
    g.setGraph({
      rankdir: "TB",
      nodesep: spacing.nodesep * 2.2,
      ranksep: spacing.ranksep * 1.5,
      marginx: 100,
      marginy: 100,
    });
  }
  g.setDefaultEdgeLabel(() => ({}));

  for (const e of events) {
    const r = radii.get(e.id)!;
    const dagreWidth = 2 * r + 24;
    const dagreHeight = 2 * r + 40;
    g.setNode(e.id, { width: dagreWidth, height: dagreHeight });
  }

  const roots = events.filter((e) => !e.parentId || !idSet.has(e.parentId));
  if (roots.length > 1) {
    g.setNode(VR, { width: 8, height: 8 });
    for (const r of roots) {
      g.setEdge(VR, r.id);
    }
  }

  for (const e of events) {
    if (e.parentId && idSet.has(e.parentId)) {
      g.setEdge(e.parentId, e.id);
    }
  }

  dagre.layout(g);

  const childCount = new Map<string, number>();
  for (const e of events) {
    if (e.parentId && idSet.has(e.parentId)) {
      childCount.set(e.parentId, (childCount.get(e.parentId) ?? 0) + 1);
    }
  }

  const nodes: LaidOutNode[] = [];
  const byId = new Map<string, LaidOutNode>();

  for (const e of events) {
    const n = g.node(e.id);
    if (!n) continue;
    const r = radii.get(e.id)!;
    const ln: LaidOutNode = {
      id: e.id,
      data: e,
      x: n.x,
      y: n.y,
      radius: r,
      isStartNode: !e.parentId || !idSet.has(e.parentId as string),
      isEndNode: (childCount.get(e.id) ?? 0) === 0,
      dagreWidth: n.width ?? 2 * r + 24,
      dagreHeight: n.height ?? 2 * r + 40,
    };
    nodes.push(ln);
    byId.set(ln.id, ln);
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const n of nodes) {
    const hw = n.dagreWidth / 2;
    const hh = n.dagreHeight / 2;
    minX = Math.min(minX, n.x - hw);
    minY = Math.min(minY, n.y - hh);
    maxX = Math.max(maxX, n.x + hw);
    maxY = Math.max(maxY, n.y + hh);
  }

  const margin = 32;
  const contentW = maxX - minX;
  const contentH = maxY - minY;
  const root =
    nodes.find((n) => n.data.parentId === null) ??
    nodes.find((n) => n.isStartNode) ??
    nodes[0];

  const ox = root ? margin + contentW / 2 - root.x : margin - minX;
  const oy = root ? margin + root.radius - root.y : margin - minY;

  for (const n of nodes) {
    n.x += ox;
    n.y += oy;
  }

  const width = contentW + margin * 2;
  const height = contentH + margin * 2;

  const links: LaidOutLink[] = events
    .filter((e) => e.parentId && byId.has(e.parentId) && byId.has(e.id))
    .map((e) => ({ source: byId.get(e.parentId!)!, target: byId.get(e.id)! }));

  return { nodes, links, width, height };
}

/** Frame two circles (parent + active) in viewport; returns d3 zoom transform components. */
export function computeFrameTransform(
  parent: LaidOutNode | undefined,
  active: LaidOutNode,
  vw: number,
  vh: number,
  pad: number
): { tx: number; ty: number; k: number } {
  const items = parent ? [parent, active] : [active];
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const n of items) {
    minX = Math.min(minX, n.x - n.radius);
    maxX = Math.max(maxX, n.x + n.radius);
    minY = Math.min(minY, n.y - n.radius);
    maxY = Math.max(maxY, n.y + n.radius);
  }
  const bw = Math.max(maxX - minX, 1);
  const bh = Math.max(maxY - minY, 1);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const k = Math.min((vw - 2 * pad) / bw, (vh - 2 * pad) / bh, 2.8);
  const kClamped = Math.max(0.06, Math.min(k, 4));
  return {
    tx: vw / 2 - kClamped * cx,
    ty: vh / 2 - kClamped * cy,
    k: kClamped,
  };
}

export function unit(a: { x: number; y: number }, b: { x: number; y: number }) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  return { x: dx / len, y: dy / len };
}

export function linkEndpoints(src: LaidOutNode, tgt: LaidOutNode) {
  const u = unit(src, tgt);
  return {
    x1: src.x + u.x * src.radius,
    y1: src.y + u.y * src.radius,
    x2: tgt.x - u.x * tgt.radius,
    y2: tgt.y - u.y * tgt.radius,
  };
}

export function linkBezierPath(src: LaidOutNode, tgt: LaidOutNode): string {
  const { x1, y1, x2, y2 } = linkEndpoints(src, tgt);
  const midY = (y1 + y2) / 2;
  return `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
}
