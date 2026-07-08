/**
 * MODE CONTROLS — Example usage of the global mode store
 *
 * Drop this anywhere on the dashboard (or any page) to let users
 * switch modes and time ranges. It's self-contained — reads and
 * writes directly to the Zustand store.
 *
 * Usage:
 *   import { ModeControls } from "@/components/dashboard/mode-controls";
 *   <ModeControls />
 */

"use client";

import { motion } from "framer-motion";
import {
    LayoutDashboard,
    Route,
    Clock,
    Network,
    Lightbulb,
} from "lucide-react";
import {
    useMode,
    useSetMode,
    useTimeRange,
    useSetTimeRange,
    useSelectedNode,
    useModeActions,
    type DashboardMode,
    type TimeRange,
} from "@/lib/store/modeStore";

// ─── Mode config ──────────────────────────────────────────────────────────────

const MODES: { value: DashboardMode; label: string; icon: any }[] = [
    { value: "overview",   label: "Overview",   icon: LayoutDashboard },
    { value: "journey",    label: "Journey",    icon: Route           },
    { value: "time",       label: "Time",       icon: Clock           },
    { value: "structure",  label: "Structure",  icon: Network         },
    { value: "insights",   label: "Insights",   icon: Lightbulb       },
];

const TIME_PRESETS: { value: TimeRange["preset"]; label: string }[] = [
    { value: "7d",  label: "7 days"  },
    { value: "30d", label: "30 days" },
    { value: "90d", label: "90 days" },
    { value: "all", label: "All time" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function ModeControls() {
    const mode        = useMode();
    const setMode     = useSetMode();
    const timeRange   = useTimeRange();
    const setTimeRange = useSetTimeRange();
    const selectedNode = useSelectedNode();
    const { resetNode } = useModeActions();

    return (
        <div className="flex flex-col gap-4">
            {/* Mode switcher */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/[0.04] border border-white/10 w-fit">
                {MODES.map(({ value, label, icon: Icon }) => {
                    const active = mode === value;
                    return (
                        <motion.button
                            key={value}
                            onClick={() => setMode(value)}
                            whileTap={{ scale: 0.95 }}
                            className={`relative flex items-center gap-2 px-3 py-1.5 rounded-xl text-[12px] font-medium transition-colors duration-200 ${
                                active
                                    ? "text-accent"
                                    : "text-label-secondary hover:text-label"
                            }`}
                        >
                            {active && (
                                <motion.div
                                    layoutId="mode-pill"
                                    className="absolute inset-0 rounded-xl bg-accent/15 border border-accent/25"
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                />
                            )}
                            <Icon className="w-3.5 h-3.5 relative z-10" />
                            <span className="relative z-10">{label}</span>
                        </motion.button>
                    );
                })}
            </div>

            {/* Time range presets */}
            <div className="flex items-center gap-1.5">
                {TIME_PRESETS.map(({ value, label }) => {
                    const active = timeRange.preset === value && !timeRange.custom;
                    return (
                        <button
                            key={value}
                            onClick={() => setTimeRange({ preset: value })}
                            className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-colors duration-200 border ${
                                active
                                    ? "bg-cyan/15 border-cyan/30 text-cyan"
                                    : "bg-white/[0.03] border-white/10 text-label-secondary hover:text-label hover:bg-white/[0.06]"
                            }`}
                        >
                            {label}
                        </button>
                    );
                })}
            </div>

            {/* Selected node badge (shown when a node is active) */}
            {selectedNode && (
                <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald/10 border border-emerald/25 w-fit"
                >
                    <span className="text-[11px] font-semibold text-emerald uppercase tracking-wider">
                        {selectedNode.type}
                    </span>
                    <span className="text-[12px] text-label font-medium">{selectedNode.label}</span>
                    <button
                        onClick={resetNode}
                        className="ml-1 text-label-tertiary hover:text-label transition-colors text-[14px] leading-none"
                        aria-label="Clear selected node"
                    >
                        ×
                    </button>
                </motion.div>
            )}
        </div>
    );
}
