/*
 * 🎭 Analogy: This file is the "Event Log Sidebar" — like a
 *   news ticker on the right side, it lists every website visit
 *   in chronological order so you can click to focus the Sankey.
 * ✅ Safe to change:
 *    1. The panel width (w-[260px]) — make it wider or narrower
 *    2. The TimelineItem card colors and border styles
 *    3. The "Key Events" header label text
 * ❌ Never touch: The `TimelinePanel` export name — it's imported
 *   by JourneyView. Renaming it breaks the timeline sidebar.
 */

"use client";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Clock } from "lucide-react";
import { isCustomRange, useSelectedNode, useSetSelectedNode, useTimeRange } from "@/lib/store/modeStore";
import {
    getTimelineEntries,
    fmtTime,
    TIMELINE_CATEGORY_COLORS,
    type TimelineEntry,
} from "./timeline-data";

// ─── Single item ──────────────────────────────────────────────────────────────

function TimelineItem({
    entry,
    isSelected,
    isDimmed,
    isLast,
    onClick,
}: {
    entry: TimelineEntry;
    isSelected: boolean;
    isDimmed: boolean;
    isLast: boolean;
    onClick: () => void;
}) {
    const [hovered, setHovered] = useState(false);
    const color = TIMELINE_CATEGORY_COLORS[entry.category];

    return (
        <div className="flex gap-3">
            {/* Spine */}
            <div className="flex flex-col items-center flex-shrink-0 w-4 pt-[15px]">
                <motion.div
                    animate={{
                        scale:     isSelected ? 1.4 : hovered ? 1.15 : 1,
                        boxShadow: isSelected ? `0 0 10px ${color}` : "none",
                    }}
                    transition={{ duration: 0.18 }}
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{
                        backgroundColor: color,
                        opacity: isDimmed ? 0.2 : isSelected ? 1 : 0.55,
                    }}
                />
                {!isLast && (
                    <div
                        className="w-px flex-1 mt-1.5"
                        style={{
                            background: `linear-gradient(to bottom, ${color}${isSelected ? "55" : "22"}, transparent)`,
                            minHeight: 20,
                        }}
                    />
                )}
            </div>

            {/* Card */}
            <motion.button
                onHoverStart={() => setHovered(true)}
                onHoverEnd={() => setHovered(false)}
                onClick={onClick}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.975 }}
                transition={{ duration: 0.14, ease: [0.32, 0.72, 0, 1] }}
                className="flex-1 text-left mb-4 px-3 py-2.5 rounded-[11px] border outline-none"
                style={{
                    cursor:          "pointer",
                    opacity:         isDimmed ? 0.22 : 1,
                    backgroundColor: isSelected
                        ? `${color}1a`
                        : hovered
                        ? "rgba(255,255,255,0.05)"
                        : "rgba(255,255,255,0.02)",
                    borderColor: isSelected
                        ? `${color}55`
                        : hovered
                        ? "rgba(255,255,255,0.10)"
                        : "rgba(255,255,255,0.05)",
                    boxShadow: isSelected
                        ? `0 0 18px ${color}18, inset 0 1px 0 ${color}25`
                        : "none",
                    transition: "background-color 0.15s, border-color 0.15s, box-shadow 0.18s",
                }}
                aria-label={`Focus Sankey on ${entry.label}`}
                aria-pressed={isSelected}
            >
                {/* Time */}
                <p
                    className="text-[10px] font-mono mb-0.5"
                    style={{ color: isSelected ? `${color}99` : "rgba(255,255,255,0.28)" }}
                >
                    {fmtTime(entry.timestamp)}
                </p>

                {/* Domain */}
                <p
                    className="text-[13px] font-semibold leading-snug"
                    style={{
                        color: isSelected
                            ? color
                            : hovered
                            ? "rgba(255,255,255,0.88)"
                            : "rgba(255,255,255,0.70)",
                    }}
                >
                    {entry.label}
                </p>

                {/* Detail */}
                {entry.title && (
                    <p
                        className="text-[11px] mt-0.5 truncate"
                        style={{ color: isSelected ? `${color}77` : "rgba(255,255,255,0.28)" }}
                    >
                        {entry.title}
                    </p>
                )}
            </motion.button>
        </div>
    );
}

// ─── TimelinePanel ────────────────────────────────────────────────────────────

export function TimelinePanel() {
    const selectedNode    = useSelectedNode();
    const setSelectedNode = useSetSelectedNode();
    const timeRange       = useTimeRange();

    // Derive filtered entries from the shared session dataset
    const entries: TimelineEntry[] = useMemo(() => {
        if (isCustomRange(timeRange)) {
            const result = getTimelineEntries(timeRange.custom.from, timeRange.custom.to);
            // Debug log
            console.debug("[TimelinePanel] selectedTimeRange:", timeRange.custom);
            console.debug("[TimelinePanel] filtered events:", result.length);
            return result;
        }
        return getTimelineEntries();
    }, [timeRange]);

    const handleClick = (entry: TimelineEntry) => {
        if (selectedNode?.id === entry.label) {
            setSelectedNode(null);
        } else {
            setSelectedNode({ id: entry.label, label: entry.label, type: "domain" });
        }
    };

    // Empty state
    if (entries.length === 0) {
        return (
            <div className="w-[260px] h-full flex-shrink-0 flex flex-col
                            border-l border-white/[0.07] bg-white/[0.015] backdrop-blur-xl">
                <div className="flex-shrink-0 px-4 pt-4 pb-3 border-b border-white/[0.06]">
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-[7px] bg-cyan/10 border border-cyan/20
                                        flex items-center justify-center flex-shrink-0">
                            <Clock className="w-3 h-3 text-cyan" />
                        </div>
                        <span className="text-[12px] font-semibold text-label">Key Events</span>
                    </div>
                </div>
                <div className="flex-1 flex items-center justify-center px-4">
                    <p className="text-[12px] text-center" style={{ color: "rgba(255,255,255,0.35)" }}>
                        No activity in this time window
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-[260px] flex-shrink-0 flex flex-col h-full min-h-0
                        border-l border-white/[0.07] bg-white/[0.015] backdrop-blur-xl">

            {/* Header */}
            <div className="flex-shrink-0 px-4 pt-4 pb-3 border-b border-white/[0.06]">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-[7px] bg-cyan/10 border border-cyan/20
                                        flex items-center justify-center flex-shrink-0">
                            <Clock className="w-3 h-3 text-cyan" />
                        </div>
                        <span className="text-[12px] font-semibold text-label">Key Events</span>
                        <span
                            className="text-[10px] font-medium px-1.5 py-0.5 rounded-md"
                            style={{
                                backgroundColor: "rgba(255,255,255,0.06)",
                                color: "rgba(255,255,255,0.40)",
                            }}
                        >
                            {entries.length}
                        </span>
                    </div>

                    <AnimatePresence>
                        {selectedNode && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.85 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.85 }}
                                transition={{ duration: 0.14 }}
                                onClick={() => setSelectedNode(null)}
                                className="text-[10px] text-label-tertiary hover:text-label
                                           px-2 py-0.5 rounded-md border border-white/[0.08]
                                           hover:bg-white/[0.06] transition-colors duration-150"
                            >
                                Clear ×
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>

                <AnimatePresence mode="wait">
                    <motion.p
                        key={selectedNode?.id ?? "idle"}
                        initial={{ opacity: 0, y: -3 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.16 }}
                        className="text-[11px] mt-1.5"
                        style={{ color: "rgba(255,255,255,0.32)" }}
                    >
                        {selectedNode ? (
                            <>
                                Filtering Sankey for{" "}
                                <span
                                    className="font-semibold"
                                    style={{
                                        color: TIMELINE_CATEGORY_COLORS[
                                            entries.find((e) => e.label === selectedNode.id)
                                                ?.category ?? "social"
                                        ],
                                    }}
                                >
                                    {selectedNode.label}
                                </span>
                            </>
                        ) : (
                            "Click an event to focus Sankey"
                        )}
                    </motion.p>
                </AnimatePresence>
            </div>

            {/* Scrollable list */}
            <div
                className="flex-1 overflow-y-auto min-h-0 px-4 pt-4 pb-4"
                style={{ scrollbarWidth: "thin" }}
            >
                {entries.map((entry, idx) => {
                    const isSelected = selectedNode?.id === entry.label;
                    const isDimmed   = !!selectedNode && !isSelected;
                    return (
                        <TimelineItem
                            key={entry.id}
                            entry={entry}
                            isSelected={isSelected}
                            isDimmed={isDimmed}
                            isLast={idx === entries.length - 1}
                            onClick={() => handleClick(entry)}
                        />
                    );
                })}
            </div>
        </div>
    );
}
