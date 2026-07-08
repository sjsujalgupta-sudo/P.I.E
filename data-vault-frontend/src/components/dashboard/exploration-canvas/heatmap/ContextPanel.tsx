/*
 * 🎭 Analogy: This file is the "Intelligence Briefing Panel" —
 *   when you click a time cell on the heatmap, this panel slides
 *   in from the right and tells you exactly what happened then.
 * ✅ Safe to change:
 *    1. The insight text strings in the `insight` variable logic
 *    2. The color values for the stat cards
 *    3. The "Explore Flows" button label text
 * ❌ Never touch: The `ContextPanel` export name — it's imported
 *   directly by TimeHeatmap. Renaming breaks the Time mode panel.
 */

"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, ArrowRight, Lightbulb, BarChart2, X } from "lucide-react";
import { useSelectedNode, useSetSelectedNode, useTimeRange, useSetTimeRange, useModeActions } from "@/lib/store/modeStore";
import { ALL_EVENTS, CATEGORY_COLORS, type SiteCategory } from "../data/mockBrowsingEvents";
import { buildSessions } from "../utils/journey/buildSessions";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtHour(h: number): string {
    if (h === 0)  return "12AM";
    if (h === 12) return "12PM";
    return h < 12 ? `${h}AM` : `${h - 12}PM`;
}

function fmtDay(d: Date): string {
    return ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][d.getDay()];
}

// ─── Panel data builder ───────────────────────────────────────────────────────

interface FlowTransition { source: string; target: string; count: number }

interface PanelData {
    timeLabel:    string;
    topSites:     { label: string; category: SiteCategory; mins: number }[];
    dominantCat:  SiteCategory | null;
    sessionCount: number;
    avgDuration:  number;
    transitions:  FlowTransition[];
    insight:      string;
    nodeAnalysis: {
        activeHours:  string[];
        topSource:    string | null;
        topDest:      string | null;
        behaviorNote: string;
    } | null;
}

function buildPanelData(from: Date, to: Date, selectedNodeId: string | null): PanelData {
    // Filter events to the time window
    const evs = ALL_EVENTS.filter((e) => e.timestamp >= from && e.timestamp <= to);

    const timeLabel = `${fmtDay(from)} ${fmtHour(from.getHours())}–${fmtHour(to.getHours())}`;

    if (evs.length === 0) {
        return {
            timeLabel,
            topSites: [], dominantCat: null, sessionCount: 0, avgDuration: 0,
            transitions: [], insight: "No activity recorded in this window.",
            nodeAnalysis: null,
        };
    }

    // Top sites by total duration
    const siteMap = new Map<string, { mins: number; category: SiteCategory }>();
    for (const e of evs) {
        const ex = siteMap.get(e.label);
        if (ex) ex.mins += e.duration;
        else siteMap.set(e.label, { mins: e.duration, category: e.category });
    }
    const topSites = [...siteMap.entries()]
        .sort((a, b) => b[1].mins - a[1].mins)
        .slice(0, 5)
        .map(([label, { mins, category }]) => ({ label, category, mins }));

    // Dominant category
    const catMap = new Map<SiteCategory, number>();
    for (const e of evs) catMap.set(e.category, (catMap.get(e.category) ?? 0) + e.duration);
    const dominantCat = [...catMap.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    // Sessions
    const sessions = buildSessions(evs);
    const sessionCount = sessions.length;
    const avgDuration = sessionCount > 0
        ? Math.round(sessions.reduce((s, sess) => s + sess.events.reduce((a, e) => a + e.duration, 0), 0) / sessionCount)
        : 0;

    // Dominant transitions
    const transMap = new Map<string, number>();
    for (const sess of sessions) {
        for (let i = 0; i < sess.events.length - 1; i++) {
            const src = sess.events[i].label;
            const tgt = sess.events[i + 1].label;
            if (src !== tgt) {
                const key = `${src}→${tgt}`;
                transMap.set(key, (transMap.get(key) ?? 0) + 1);
            }
        }
    }
    const transitions: FlowTransition[] = [...transMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([key, count]) => {
            const [source, target] = key.split("→");
            return { source, target, count };
        });

    // Semantic insight
    const hour = from.getHours();
    let insight = "Mixed browsing activity during this window.";
    if (dominantCat === "dev" && avgDuration > 30)
        insight = "Deep development work — long focused sessions.";
    else if (dominantCat === "dev")
        insight = "Development activity — code research and tooling.";
    else if (dominantCat === "social" && hour >= 20)
        insight = "Evening social browsing — typical wind-down pattern.";
    else if (dominantCat === "social")
        insight = "Social browsing — community and content exploration.";
    else if (dominantCat === "search")
        insight = "Research-heavy session — active information seeking.";
    else if (dominantCat === "productivity")
        insight = "Productivity focus — planning and task management.";
    else if (dominantCat === "content")
        insight = "Content consumption — reading and learning.";
    if (sessionCount >= 4 && avgDuration > 40)
        insight = "High-intensity window — multiple long sessions.";

    // Node-specific analysis
    let nodeAnalysis: PanelData["nodeAnalysis"] = null;
    if (selectedNodeId) {
        const nodeEvs = ALL_EVENTS.filter((e) => e.label === selectedNodeId);
        // Active hours for this node
        const hourCount = new Map<number, number>();
        for (const e of nodeEvs) hourCount.set(e.timestamp.getHours(), (hourCount.get(e.timestamp.getHours()) ?? 0) + 1);
        const topHours = [...hourCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([h]) => fmtHour(h));

        // Top incoming source (what leads to this node)
        const srcCount = new Map<string, number>();
        for (const sess of buildSessions(ALL_EVENTS)) {
            for (let i = 1; i < sess.events.length; i++) {
                if (sess.events[i].label === selectedNodeId) {
                    const src = sess.events[i - 1].label;
                    srcCount.set(src, (srcCount.get(src) ?? 0) + 1);
                }
            }
        }
        const topSource = [...srcCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

        // Top outgoing destination
        const dstCount = new Map<string, number>();
        for (const sess of buildSessions(ALL_EVENTS)) {
            for (let i = 0; i < sess.events.length - 1; i++) {
                if (sess.events[i].label === selectedNodeId) {
                    const dst = sess.events[i + 1].label;
                    dstCount.set(dst, (dstCount.get(dst) ?? 0) + 1);
                }
            }
        }
        const topDest = [...dstCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

        // Behavior note
        const peakH = [...hourCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
        const period = peakH === undefined ? "various times"
            : peakH < 12 ? "morning sessions"
            : peakH < 18 ? "afternoon sessions"
            : "evening sessions";
        const behaviorNote = `Often visited during ${period}${topSource ? `, typically from ${topSource}` : ""}.`;

        nodeAnalysis = { activeHours: topHours, topSource, topDest, behaviorNote };
    }

    return { timeLabel, topSites, dominantCat, sessionCount, avgDuration, transitions, insight, nodeAnalysis };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ContextPanel() {
    const timeRange    = useTimeRange();
    const setTimeRange = useSetTimeRange();
    const selectedNode = useSelectedNode();
    const setSelectedNode = useSetSelectedNode();
    const { setMode }  = useModeActions();

    const isActive = timeRange.preset === "custom" && !!timeRange.custom;

    const data = useMemo(() => {
        if (!isActive || !timeRange.custom) return null;
        return buildPanelData(timeRange.custom.from, timeRange.custom.to, selectedNode?.id ?? null);
    }, [isActive, timeRange, selectedNode]);

    return (
        <AnimatePresence>
            {isActive && data && (
                <motion.div
                    key="context-panel"
                    initial={{ opacity: 0, x: 20, width: 0 }}
                    animate={{ opacity: 1, x: 0, width: 280 }}
                    exit={{ opacity: 0, x: 20, width: 0 }}
                    transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                    className="flex-shrink-0 h-full overflow-hidden border-l border-white/[0.07]
                               bg-white/[0.015] backdrop-blur-xl flex flex-col"
                    style={{ minWidth: 280 }}
                >
                    <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4"
                        style={{ scrollbarWidth: "thin" }}>

                        {/* ── Header ──────────────────────────────── */}
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <Clock className="w-3.5 h-3.5 text-emerald flex-shrink-0" />
                                    <span className="text-[12px] font-bold uppercase tracking-wider text-emerald">
                                        Time Analysis
                                    </span>
                                </div>
                                <p className="text-[15px] font-semibold text-label leading-tight">
                                    {data.timeLabel}
                                </p>
                            </div>
                            <button
                                onClick={() => setTimeRange({ preset: "7d" })}
                                className="text-label-tertiary hover:text-label transition-colors duration-150 mt-0.5 flex-shrink-0"
                                aria-label="Clear time selection"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        {data.sessionCount === 0 ? (
                            <p className="text-[13px] text-label-tertiary">No activity in this window.</p>
                        ) : (
                            <>
                                {/* ── Stats row ───────────────────── */}
                                <div className="grid grid-cols-2 gap-2">
                                    <StatCard label="Sessions" value={String(data.sessionCount)} color="#22d3ee" />
                                    <StatCard label="Avg Duration" value={`${data.avgDuration}m`} color="#34d399" />
                                </div>

                                {/* ── Dominant category ───────────── */}
                                {data.dominantCat && (
                                    <div className="px-3 py-2.5 rounded-[12px] border"
                                        style={{
                                            backgroundColor: CATEGORY_COLORS[data.dominantCat] + "12",
                                            borderColor:     CATEGORY_COLORS[data.dominantCat] + "30",
                                        }}>
                                        <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5"
                                            style={{ color: "rgba(255,255,255,0.30)" }}>Dominant Category</p>
                                        <p className="text-[14px] font-semibold capitalize"
                                            style={{ color: CATEGORY_COLORS[data.dominantCat] }}>
                                            {data.dominantCat}
                                        </p>
                                    </div>
                                )}

                                {/* ── Top sites ───────────────────── */}
                                {data.topSites.length > 0 && (
                                    <Section title="Most Active Sites">
                                        <div className="flex flex-col gap-1.5">
                                            {data.topSites.map((site) => {
                                                const color = CATEGORY_COLORS[site.category];
                                                const maxMins = data.topSites[0].mins;
                                                return (
                                                    <div key={site.label} className="flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                                            style={{ backgroundColor: color }} />
                                                        <span className="text-[12px] flex-1 truncate"
                                                            style={{ color: "rgba(255,255,255,0.75)" }}>
                                                            {site.label}
                                                        </span>
                                                        <div className="w-16 h-1.5 rounded-full bg-white/[0.06] overflow-hidden flex-shrink-0">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${(site.mins / maxMins) * 100}%` }}
                                                                transition={{ duration: 0.5, ease: "easeOut" }}
                                                                className="h-full rounded-full"
                                                                style={{ backgroundColor: color }}
                                                            />
                                                        </div>
                                                        <span className="text-[10px] w-8 text-right flex-shrink-0"
                                                            style={{ color: "rgba(255,255,255,0.35)" }}>
                                                            {site.mins}m
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </Section>
                                )}

                                {/* ── Flow transitions ────────────── */}
                                {data.transitions.length > 0 && (
                                    <Section title="Dominant Flows">
                                        <div className="flex flex-col gap-1.5">
                                            {data.transitions.map((t) => {
                                                const srcCat = ALL_EVENTS.find((e) => e.label === t.source)?.category ?? "dev";
                                                const tgtCat = ALL_EVENTS.find((e) => e.label === t.target)?.category ?? "dev";
                                                return (
                                                    <div key={`${t.source}→${t.target}`}
                                                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[9px] bg-white/[0.03] border border-white/[0.06]">
                                                        <span className="text-[11px] font-medium truncate max-w-[70px]"
                                                            style={{ color: CATEGORY_COLORS[srcCat] }}>
                                                            {t.source}
                                                        </span>
                                                        <ArrowRight className="w-3 h-3 flex-shrink-0 text-label-tertiary" />
                                                        <span className="text-[11px] font-medium truncate max-w-[70px]"
                                                            style={{ color: CATEGORY_COLORS[tgtCat] }}>
                                                            {t.target}
                                                        </span>
                                                        <span className="ml-auto text-[10px] flex-shrink-0"
                                                            style={{ color: "rgba(255,255,255,0.28)" }}>
                                                            ×{t.count}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </Section>
                                )}

                                {/* ── Semantic insight ────────────── */}
                                <div className="px-3 py-2.5 rounded-[12px] border border-accent/[0.18] bg-accent/[0.05]">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <Lightbulb className="w-3 h-3 text-accent flex-shrink-0" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-accent">Insight</span>
                                    </div>
                                    <p className="text-[12px] text-label leading-relaxed">{data.insight}</p>
                                </div>

                                {/* ── Node-specific analysis ──────── */}
                                {data.nodeAnalysis && selectedNode && (
                                    <Section title={`${selectedNode.label} Pattern`} accent={CATEGORY_COLORS[ALL_EVENTS.find((e) => e.label === selectedNode.id)?.category ?? "dev"]}>
                                        <div className="flex flex-col gap-2">
                                            {/* Active hours */}
                                            {data.nodeAnalysis.activeHours.length > 0 && (
                                                <div>
                                                    <p className="text-[10px] text-label-tertiary mb-1">Peak hours</p>
                                                    <div className="flex gap-1.5 flex-wrap">
                                                        {data.nodeAnalysis.activeHours.map((h) => (
                                                            <span key={h} className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-white/[0.06] text-label-secondary">
                                                                {h}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Flow path */}
                                            {(data.nodeAnalysis.topSource || data.nodeAnalysis.topDest) && (
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    {data.nodeAnalysis.topSource && (
                                                        <span className="text-[11px] text-label-secondary">{data.nodeAnalysis.topSource}</span>
                                                    )}
                                                    {data.nodeAnalysis.topSource && (
                                                        <ArrowRight className="w-3 h-3 text-label-tertiary flex-shrink-0" />
                                                    )}
                                                    <span className="text-[11px] font-semibold"
                                                        style={{ color: CATEGORY_COLORS[ALL_EVENTS.find((e) => e.label === selectedNode.id)?.category ?? "dev"] }}>
                                                        {selectedNode.label}
                                                    </span>
                                                    {data.nodeAnalysis.topDest && (
                                                        <ArrowRight className="w-3 h-3 text-label-tertiary flex-shrink-0" />
                                                    )}
                                                    {data.nodeAnalysis.topDest && (
                                                        <span className="text-[11px] text-label-secondary">{data.nodeAnalysis.topDest}</span>
                                                    )}
                                                </div>
                                            )}

                                            {/* Behavior note */}
                                            <p className="text-[11px] text-label-secondary leading-relaxed">
                                                {data.nodeAnalysis.behaviorNote}
                                            </p>
                                        </div>
                                    </Section>
                                )}

                                {/* ── Explore in Journey ──────────── */}
                                <button
                                    onClick={() => setMode("journey", "time")}
                                    className="flex items-center justify-center gap-2 w-full px-3 py-2.5
                                               rounded-[12px] border border-emerald/[0.30] bg-emerald/[0.08]
                                               text-[12px] font-semibold text-emerald
                                               hover:bg-emerald/[0.14] transition-colors duration-150
                                               hover:scale-[1.01] active:scale-[0.99]"
                                >
                                    <BarChart2 className="w-3.5 h-3.5 flex-shrink-0" />
                                    Explore Flows in Journey
                                </button>
                                {/* ── View Patterns ───────────────── */}
                                <button
                                    onClick={() => setMode("stream", "time")}
                                    className="flex items-center justify-center gap-2 w-full px-3 py-2
                                               rounded-[12px] border border-pink-400/[0.25] bg-pink-400/[0.06]
                                               text-[12px] font-semibold text-pink-400
                                               hover:bg-pink-400/[0.12] transition-colors duration-150"
                                >
                                    <span className="text-[13px]">〜</span>
                                    View Patterns
                                </button>
                            </>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
    return (
        <div className="px-3 py-2.5 rounded-[12px] border"
            style={{ backgroundColor: color + "0d", borderColor: color + "25" }}>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5"
                style={{ color: "rgba(255,255,255,0.30)" }}>{label}</p>
            <p className="text-[16px] font-bold" style={{ color }}>{value}</p>
        </div>
    );
}

function Section({ title, accent, children }: { title: string; accent?: string; children: React.ReactNode }) {
    return (
        <div>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2"
                style={{ color: accent ?? "rgba(255,255,255,0.30)" }}>
                {title}
            </p>
            {children}
        </div>
    );
}
