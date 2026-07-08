/*
 * 🎭 Analogy: This is the "Sticky Note on the Fridge" — when you're
 *    exploring YouTube in Journey mode, this banner reminds you what
 *    context you're in: "Exploring: YouTube · From: Overview".
 * ✅ Safe to change:
 *    1. Edit the label text ("Exploring:", "Time:", "From:")
 *    2. Change the banner background color (currently bg-white/[0.025])
 *    3. Change the "Clear Exploration" button label
 * ❌ Never touch: The clearExploration() call — it resets selectedNode,
 *    timeRange, and searchQuery together. Replacing it with individual
 *    resets will leave stale state in other modes.
 */
"use client";

/**
 * ContextHeader — persistent exploration context bar.
 *
 * Shows the active exploration state across all modes:
 *   Exploring: YouTube  |  Time: Tue 9PM–10PM  |  Source: Journey  |  [Clear]
 *
 * Sits between TopBar and MainView. Only visible when context is active.
 */

import { motion, AnimatePresence } from "framer-motion";
import { X, GitBranch, Clock, Compass } from "lucide-react";
import {
    useSelectedNode,
    useTimeRange,
    useSourceMode,
    useHasContext,
    useModeActions,
    isCustomRange,
} from "@/lib/store/modeStore";
import { ALL_EVENTS } from "./data/mockBrowsingEvents";

function fmtH(h: number): string {
    if (h === 0)  return "12AM";
    if (h === 12) return "12PM";
    return h < 12 ? `${h}AM` : `${h - 12}PM`;
}

const SOURCE_LABELS: Record<string, string> = {
    overview: "Overview",
    journey:  "Journey",
    time:     "Time",
    structure: "Structure",
    insights: "Insights",
};

export function ContextHeader() {
    const selectedNode = useSelectedNode();
    const timeRange    = useTimeRange();
    const sourceMode   = useSourceMode();
    const hasContext   = useHasContext();
    const { clearExploration } = useModeActions();

    const isCustom = isCustomRange(timeRange);

    // Node color from events
    const nodeColor = (() => {
        if (!selectedNode) return "#a78bfa";
        const ev = ALL_EVENTS.find((e) => e.label === selectedNode.id);
        const colors: Record<string, string> = {
            search: "#22d3ee", social: "#a78bfa", dev: "#34d399",
            productivity: "#f59e0b", content: "#f472b6",
        };
        return colors[ev?.category ?? "dev"] ?? "#a78bfa";
    })();

    // Time label
    const timeLabel = isCustom
        ? (() => {
            const { from, to } = timeRange.custom!;
            const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
            return `${days[from.getDay()]} ${fmtH(from.getHours())}–${fmtH(to.getHours())}`;
          })()
        : null;

    return (
        <AnimatePresence>
            {hasContext && (
                <motion.div
                    key="context-header"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
                    className="flex-shrink-0 overflow-hidden"
                >
                    <div className="flex items-center gap-3 px-5 py-2
                                    border-b border-white/[0.07] bg-white/[0.025]
                                    backdrop-blur-xl">

                        {/* Exploring node */}
                        {selectedNode && (
                            <div className="flex items-center gap-1.5">
                                <GitBranch className="w-3 h-3 flex-shrink-0" style={{ color: nodeColor }} />
                                <span className="text-[11px] text-label-tertiary">Exploring:</span>
                                <span className="text-[11px] font-semibold" style={{ color: nodeColor }}>
                                    {selectedNode.label}
                                </span>
                            </div>
                        )}

                        {/* Separator */}
                        {selectedNode && timeLabel && (
                            <span className="text-label-tertiary text-[11px]">·</span>
                        )}

                        {/* Time window */}
                        {timeLabel && (
                            <div className="flex items-center gap-1.5">
                                <Clock className="w-3 h-3 text-emerald flex-shrink-0" />
                                <span className="text-[11px] text-label-tertiary">Time:</span>
                                <span className="text-[11px] font-semibold text-emerald">{timeLabel}</span>
                            </div>
                        )}

                        {/* Source mode */}
                        {sourceMode && (
                            <>
                                <span className="text-label-tertiary text-[11px]">·</span>
                                <div className="flex items-center gap-1.5">
                                    <Compass className="w-3 h-3 text-label-tertiary flex-shrink-0" />
                                    <span className="text-[11px] text-label-tertiary">
                                        From: {SOURCE_LABELS[sourceMode] ?? sourceMode}
                                    </span>
                                </div>
                            </>
                        )}

                        {/* Spacer */}
                        <div className="flex-1" />

                        {/* Clear exploration */}
                        <button
                            onClick={clearExploration}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg
                                       text-[11px] font-medium text-label-tertiary
                                       border border-white/[0.08] bg-white/[0.03]
                                       hover:bg-white/[0.07] hover:text-label
                                       transition-colors duration-150"
                        >
                            <X className="w-3 h-3" />
                            Clear Exploration
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
