/*
 * 🎭 Analogy: This file is the "Journey Orchestrator" — it's the
 *   container that holds both the Flow View (Sankey) and Loop View
 *   (force graph), letting you switch between them with a toggle.
 * ✅ Safe to change:
 *    1. The debug stats panel — remove it when going to production
 *    2. The sub-mode toggle labels ("Flow View" / "Loop View")
 *    3. The banner colors for the time/node context strips
 * ❌ Never touch: The `JourneyView` export name — it's imported
 *   by MainView. Renaming it breaks the Journey mode entirely.
 */

"use client";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Clock, GitBranch, Network, RefreshCw, X } from "lucide-react";
import { LoopView }      from "./LoopView";
import { SankeyFlow }    from "./SankeyFlow";
import { useTimeRange, useSetTimeRange, useModeActions, isCustomRange, useSelectedNode } from "@/lib/store/modeStore";
import { ALL_EVENTS }                from "../data/mockBrowsingEvents";
import { filterEventsByTimeRange }   from "../utils/journey/filterEvents";
import { buildSessions }             from "../utils/journey/buildSessions";
import { buildSankeyData }           from "../utils/journey/buildSankeyData";
import { buildLoopGraphData }        from "../utils/journey/buildLoopGraphData";

type JourneySubMode = "flow" | "loop";

export function JourneyView() {
    const [subMode, setSubMode] = useState<JourneySubMode>("flow");

    const timeRange    = useTimeRange();
    const setTimeRange = useSetTimeRange();
    const { setMode }  = useModeActions();
    const selectedNode = useSelectedNode();

    const hasCustomRange = isCustomRange(timeRange);

    const timeLabel = hasCustomRange
        ? (() => {
            const { from, to } = timeRange.custom;
            const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
            const fmtH = (d: Date) => { const h = d.getHours(); return h === 0 ? "12AM" : h === 12 ? "12PM" : h < 12 ? `${h}AM` : `${h-12}PM`; };
            return `${days[from.getDay()]} ${fmtH(from)} – ${fmtH(to)}`;
          })()
        : null;

    // ── Debug stats ───────────────────────────────────────────────────────────
    const debugStats = useMemo(() => {
        const filtered  = filterEventsByTimeRange(ALL_EVENTS, timeRange);
        const sessions  = buildSessions(filtered);
        const sankeyD   = buildSankeyData(sessions);
        const loopD     = buildLoopGraphData(sessions);
        return {
            events:     filtered.length,
            sessions:   sessions.length,
            sankeyLinks: sankeyD.links.length,
            loopLinks:  loopD.links.length,
        };
    }, [timeRange]);

    return (
        <div className="flex flex-col w-full h-full min-h-0">

            {/* ── Sub-mode toggle + debug ──────────────────────────────── */}
            <div className="flex-shrink-0 flex items-center justify-between
                            px-4 py-2 border-b border-white/[0.07] bg-white/[0.02]">
                {/* Toggle pills */}
                <div className="flex items-center gap-1 p-0.5 rounded-xl
                                bg-white/[0.04] border border-white/[0.07]">
                    {([
                        { value: "flow" as JourneySubMode, label: "Flow View",  icon: GitBranch },
                        { value: "loop" as JourneySubMode, label: "Loop View",  icon: RefreshCw },
                    ]).map(({ value, label, icon: Icon }) => {
                        const active = subMode === value;
                        return (
                            <motion.button key={value} onClick={() => setSubMode(value)} whileTap={{ scale: 0.96 }}
                                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-[12px] font-medium transition-colors duration-150 outline-none ${active ? "text-label" : "text-label-tertiary hover:text-label-secondary"}`}>
                                {active && (
                                    <motion.div layoutId="journey-sub-pill"
                                        className="absolute inset-0 rounded-[10px] bg-white/[0.08] border border-white/[0.12]"
                                        transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                                )}
                                <Icon className="w-3.5 h-3.5 relative z-10 flex-shrink-0" />
                                <span className="relative z-10">{label}</span>
                            </motion.button>
                        );
                    })}
                </div>

                {/* Debug panel (temporary) */}
                <div className="flex items-center gap-3 text-[10px] font-mono"
                    style={{ color: "rgba(255,255,255,0.28)" }}>
                    <span>Events: <span style={{ color: "rgba(255,255,255,0.5)" }}>{debugStats.events}</span></span>
                    <span>Sessions: <span style={{ color: "rgba(255,255,255,0.5)" }}>{debugStats.sessions}</span></span>
                    <span>Sankey Links: <span style={{ color: "#34d399" }}>{debugStats.sankeyLinks}</span></span>
                    <span>Loop Links: <span style={{ color: "#a78bfa" }}>{debugStats.loopLinks}</span></span>
                </div>
            </div>

            {/* ── Selected node context banner ─────────────────────── */}
            <AnimatePresence>
                {selectedNode && (
                    <motion.div key={`node-${selectedNode.id}`}
                        initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
                        className="flex-shrink-0 overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-2 border-b border-accent/[0.12] bg-accent/[0.04]">
                            <div className="flex items-center gap-2">
                                <GitBranch className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                                <span className="text-[12px] text-label-secondary">Exploring journeys related to:</span>
                                <span className="text-[12px] font-semibold text-accent">{selectedNode.label}</span>
                            </div>
                            {/* View Network Context — back to Overview */}
                            <button
                                onClick={() => setMode("overview", "journey")}
                                className="flex items-center gap-1.5 text-[11px] text-accent/70 hover:text-accent
                                           transition-colors duration-150 px-2 py-1 rounded-lg
                                           hover:bg-accent/[0.08]"
                            >
                                <Network className="w-3 h-3" />
                                View Network Context
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Time context banner ──────────────────────────────────── */}
            <AnimatePresence>
                {hasCustomRange && timeLabel && (
                    <motion.div key="time-banner"
                        initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
                        className="flex-shrink-0 overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-2 border-b border-emerald/[0.15] bg-emerald/[0.06]">
                            <div className="flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5 text-emerald flex-shrink-0" />
                                <span className="text-[12px] text-label-secondary">Showing data for:</span>
                                <span className="text-[12px] font-semibold text-emerald">{timeLabel}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setMode("time", "journey")}
                                    className="text-[11px] text-emerald/70 hover:text-emerald transition-colors duration-150 underline underline-offset-2">
                                    ← Back to Heatmap
                                </button>
                                <button onClick={() => setTimeRange({ preset: "7d" })}
                                    className="w-5 h-5 rounded-md flex items-center justify-center text-label-tertiary hover:text-label hover:bg-white/[0.08] transition-colors duration-150"
                                    aria-label="Dismiss time filter">
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Main content ─────────────────────────────────────────── */}
            <div className="flex flex-1 min-h-0">
                <div className="flex-1 min-w-0 min-h-0 relative">
                    <AnimatePresence mode="wait">
                        <motion.div key={subMode}
                            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
                            className="absolute inset-0">
                            {subMode === "flow" ? (
                                <div className="w-full h-full"><SankeyFlow /></div>
                            ) : (
                                <LoopView />
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
