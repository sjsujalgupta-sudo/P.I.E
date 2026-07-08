/**
 * 🎭 Analogy: This file is the "Universal Translator" — it takes raw rows from
 * the DataVault database and transforms them into structured objects that
 * the Atlas and Synapse visualizations can understand.
 */
import type { VaultRow } from "@/lib/api";
import {
    replaceBrowsingEvents,
    type BrowsingEvent,
    type SiteCategory,
} from "@/components/dashboard/exploration-canvas/data/mockBrowsingEvents";
import {
    replaceGraphData,
    type GraphData,
    type NodeCategory,
} from "@/components/dashboard/exploration-canvas/network/mock-data";

export type SynapseNode = {
    id: string;
    label: string;
    group: "start" | "active" | "intermediate" | "context" | "end";
    layer: number;
    x?: number;
    y?: number;
    fx?: number;
    fy?: number;
    timeSpent: number;
    visits: number;
    timestamp: number;
    realTimestamp: number;
    url: string;
    description: string;
    originNodeId: string | null;
    timeline: { time: number; state: SynapseNode["group"] }[];
};

export type SynapseLink = {
    source: string;
    target: string;
    strength: number;
    timestamp: number;
    realTimestamp: number;
};

export type SynapseGraphData = {
    nodes: SynapseNode[];
    links: SynapseLink[];
};

// --- Helpers ---

function hostnameFor(row: VaultRow) {
    if (row.domain) return row.domain.replace(/^www\./, "");
    try {
        return new URL(row.url).hostname.replace(/^www\./, "");
    } catch {
        return row.url || "unknown";
    }
}

function displayLabelFor(row: VaultRow) {
    const host = hostnameFor(row);
    const first = host.split(".")[0] || host;
    return first
        .split(/[-_]/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

function categoryFor(row: VaultRow): SiteCategory {
    const text = [
        row.domain,
        row.url,
        row.title,
        row.summary,
        ...row.keywords,
        ...row.interests,
        ...row.tools,
        ...row.topics,
    ].join(" ").toLowerCase();

    if (/\b(github|gitlab|stackoverflow|stack overflow|npm|code|developer|programming|api|docs)\b/.test(text)) {
        return "dev";
    }
    if (/\b(youtube|reddit|twitter|x\.com|instagram|facebook|social|video)\b/.test(text)) {
        return "social";
    }
    if (/\b(notion|linear|figma|calendar|gmail|slack|trello|asana|productivity|task)\b/.test(text)) {
        return "productivity";
    }
    if (/\b(google|bing|search|query)\b/.test(text)) {
        return "search";
    }
    return "content";
}

function durationFor(row: VaultRow) {
    const signalCount = row.keywords.length + row.interests.length + row.tools.length + row.topics.length;
    const summaryWeight = Math.min(10, Math.ceil((row.summary?.length ?? 0) / 120));
    return Math.max(1, Math.min(30, 2 + signalCount + summaryWeight));
}

function timestampFor(row: VaultRow) {
    const parsed = new Date(row.timestamp || row.created_at);
    return Number.isFinite(parsed.getTime()) ? parsed : new Date();
}

export function vaultRowsToBrowsingEvents(rows: VaultRow[]): BrowsingEvent[] {
    return [...rows]
        .sort((a, b) => timestampFor(a).getTime() - timestampFor(b).getTime())
        .map((row, index) => {
            const timestamp = timestampFor(row);
            const sessionId = row.session_id || `${timestamp.getFullYear()}-${timestamp.getMonth() + 1}-${timestamp.getDate()}`;
            return {
                id: String(row.id ?? index),
                sessionId,
                timestamp,
                label: displayLabelFor(row),
                category: categoryFor(row),
                duration: durationFor(row),
                title: row.title || row.summary || hostnameFor(row),
            };
        });
}

export function vaultRowsToGraphData(rows: VaultRow[]): GraphData {
    const events = vaultRowsToBrowsingEvents(rows);
    const byLabel = new Map<string, { event: BrowsingEvent; count: number; url?: string }>();
    for (const event of events) {
        const current = byLabel.get(event.label);
        const row = rows.find((item) => String(item.id) === event.id);
        byLabel.set(event.label, {
            event,
            count: (current?.count ?? 0) + 1,
            url: current?.url ?? row?.url,
        });
    }
    const nodes = Array.from(byLabel.entries()).map(([label, item]) => ({
        id: label,
        label,
        category: item.event.category as NodeCategory,
        frequency: Math.max(8, item.count * 5),
        url: item.url,
    }));
    const linkCounts = new Map<string, number>();
    const bySession = new Map<string, BrowsingEvent[]>();
    for (const event of events) {
        if (!bySession.has(event.sessionId)) bySession.set(event.sessionId, []);
        bySession.get(event.sessionId)!.push(event);
    }
    for (const sessionEvents of bySession.values()) {
        const sorted = [...sessionEvents].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        for (let i = 0; i < sorted.length - 1; i += 1) {
            const source = sorted[i].label;
            const target = sorted[i + 1].label;
            if (source === target) continue;
            const key = `${source}->${target}`;
            linkCounts.set(key, (linkCounts.get(key) ?? 0) + 1);
        }
    }
    const links = Array.from(linkCounts.entries()).map(([key, count]) => {
        const [source, target] = key.split("->");
        return { source, target, weight: count };
    });
    return { nodes, links };
}

export function applyVaultRowsToAtlas(rows: VaultRow[]) {
    const events = vaultRowsToBrowsingEvents(rows);
    replaceBrowsingEvents(events);
    replaceGraphData(vaultRowsToGraphData(rows));
}

export function vaultRowsToSynapseGraph(rows: VaultRow[]): SynapseGraphData {
    const events = vaultRowsToBrowsingEvents(rows);
    if (events.length === 0) return { nodes: [], links: [] };

    const nodesMap = new Map<string, SynapseNode>();
    const linksMap = new Map<string, SynapseLink>();

    let staggerIndex = 0;
    
    const startNodes = new Set<string>();
    const endNodes = new Set<string>();

    events.forEach((event, i) => {
        const nodeId = event.label;
        const TIME_THRESHOLD = 30 * 60 * 1000;
        const prev = events[i - 1];
        const isNewTrail = !prev || (event.timestamp.getTime() - prev.timestamp.getTime() > TIME_THRESHOLD);
        const next = events[i + 1];
        const isEndTrail = !next || (next.timestamp.getTime() - event.timestamp.getTime() > TIME_THRESHOLD);

        if (isNewTrail) startNodes.add(nodeId);
        if (isEndTrail) endNodes.add(nodeId);

        if (!nodesMap.has(nodeId)) {
            const t = staggerIndex * 2000;
            staggerIndex++;

            nodesMap.set(nodeId, {
                id: nodeId,
                label: event.label,
                group: "active",
                layer: 0,
                timeSpent: event.duration,
                visits: 1,
                timestamp: t,
                realTimestamp: event.timestamp.getTime(),
                url: rows.find(r => String(r.id) === event.id)?.url ?? "",
                description: event.title,
                originNodeId: null,
                timeline: [
                    { time: t, state: "start" },
                    { time: t + 3000, state: "active" },
                    { time: t + 8000, state: "context" },
                    { time: t + 12000, state: "end" },
                ],
            });
        } else {
            const node = nodesMap.get(nodeId)!;
            node.visits += 1;
            node.timeSpent += event.duration;
            node.realTimestamp = Math.min(node.realTimestamp, event.timestamp.getTime());
        }

        if (!isNewTrail && prev) {
            const parentNodeId = prev.label;
            const linkId = `${parentNodeId}->${nodeId}`;
            
            if (!linksMap.has(linkId)) {
                linksMap.set(linkId, {
                    source: parentNodeId,
                    target: nodeId,
                    strength: 1,
                    timestamp: nodesMap.get(nodeId)!.timestamp,
                    realTimestamp: event.timestamp.getTime(),
                });
            } else {
                linksMap.get(linkId)!.strength += 0.5;
            }

            if (nodesMap.get(nodeId)!.visits === 1) {
                nodesMap.get(nodeId)!.originNodeId = parentNodeId;
            }
        }
    });

    const nodes = Array.from(nodesMap.values()).map(node => {
        if (startNodes.has(node.id) && endNodes.has(node.id)) {
            node.group = "active";
        } else if (startNodes.has(node.id)) {
            node.group = "start";
        } else if (endNodes.has(node.id)) {
            node.group = "end";
        } else {
            node.group = "intermediate";
        }
        return node;
    });
    const links = Array.from(linksMap.values());

    return { nodes, links };
}
