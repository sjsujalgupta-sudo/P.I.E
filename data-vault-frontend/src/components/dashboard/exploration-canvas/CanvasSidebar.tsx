/*
 * 🎭 Analogy: This file is the "Mode Selector Panel" — like the
 *   channel buttons on a TV remote, each button switches the
 *   Atlas canvas to a completely different view mode.
 * ✅ Safe to change:
 *    1. The MODES array — add a new mode entry with its icon and colors
 *    2. The icon for any existing mode (swap the Lucide icon import)
 *    3. The glow color values in the `glow` field
 * ❌ Never touch: The `CanvasSidebar` export name and the `DashboardMode`
 *   type values — they're wired to the global Zustand store.
 */

"use client";

import type React from "react";
import { motion } from "framer-motion";
import { Clock, LayoutDashboard, Lightbulb, Network, Route, Waves } from "lucide-react";
import { useMode, useSetMode, type DashboardMode } from "@/lib/store/modeStore";

// ─── Mode config ──────────────────────────────────────────────────────────────

const MODES: {
    value: DashboardMode;
    label: string;
    icon: any;
    color: string;
    activeBg: string;
    activeBorder: string;
    activeText: string;
    glow: string;
}[] = [
    {
        value: "overview",
        label: "Overview",
        icon: LayoutDashboard,
        color: "text-label-secondary",
        activeBg: "bg-accent/10",
        activeBorder: "border-accent/30",
        activeText: "text-accent",
        glow: "rgba(167,139,250,0.35)",
    },
    {
        value: "journey",
        label: "Journey",
        icon: Route,
        color: "text-label-secondary",
        activeBg: "bg-cyan/10",
        activeBorder: "border-cyan/30",
        activeText: "text-cyan",
        glow: "rgba(34,211,238,0.35)",
    },
    {
        value: "time",
        label: "Time",
        icon: Clock,
        color: "text-label-secondary",
        activeBg: "bg-emerald/10",
        activeBorder: "border-emerald/30",
        activeText: "text-emerald",
        glow: "rgba(52,211,153,0.35)",
    },
    {
        value: "stream",
        label: "Patterns",
        icon: Waves,
        color: "text-label-secondary",
        activeBg: "bg-pink-400/10",
        activeBorder: "border-pink-400/30",
        activeText: "text-pink-400",
        glow: "rgba(244,114,182,0.35)",
    },
    {
        value: "structure",
        label: "Structure",
        icon: Network,
        color: "text-label-secondary",
        activeBg: "bg-violet-400/10",
        activeBorder: "border-violet-400/30",
        activeText: "text-violet-400",
        glow: "rgba(167,139,250,0.25)",
    },
    {
        value: "insights",
        label: "Insights",
        icon: Lightbulb,
        color: "text-label-secondary",
        activeBg: "bg-amber-400/10",
        activeBorder: "border-amber-400/30",
        activeText: "text-amber-400",
        glow: "rgba(251,191,36,0.3)",
    },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function CanvasSidebar() {
    const mode    = useMode();
    const setMode = useSetMode();

    return (
        <div className="w-[52px] flex-shrink-0 flex flex-col items-center py-4 gap-2 border-r border-white/[0.07] bg-white/[0.015] backdrop-blur-xl relative overflow-hidden">
            {/* Ambient orb */}
            <div
                className="absolute top-0 left-0 w-24 h-24 rounded-full pointer-events-none"
                style={{
                    background: "radial-gradient(circle, rgba(139,92,246,0.18), transparent 70%)",
                    filter: "blur(20px)",
                    transform: "translate(-30%, -30%)",
                }}
            />

            {/* Divider label */}
            <p className="text-[9px] font-bold uppercase tracking-widest text-label-tertiary mb-1 select-none">
                Mode
            </p>

            {MODES.map(({ value, label, icon: Icon, activeBg, activeBorder, activeText, glow }) => {
                const active = mode === value;
                return (
                    <motion.button
                        key={value}
                        onClick={() => setMode(value)}
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.93 }}
                        title={label}
                        aria-label={`Switch to ${label} mode`}
                        className={`
                            relative w-9 h-9 rounded-[11px] flex items-center justify-center
                            border transition-colors duration-200 outline-none
                            focus-visible:ring-2 focus-visible:ring-accent/50
                            ${active
                                ? `${activeBg} ${activeBorder} ${activeText}`
                                : "bg-white/[0.03] border-white/[0.07] text-label-secondary hover:bg-white/[0.07] hover:text-label"
                            }
                        `}
                        style={active ? { boxShadow: `0 0 14px ${glow}` } : undefined}
                    >
                        {/* Active indicator dot */}
                        {active && (
                            <motion.span
                                layoutId="sidebar-active-dot"
                                className="absolute -right-[3px] top-1/2 -translate-y-1/2 w-1 h-4 rounded-full bg-current opacity-70"
                                transition={{ type: "spring", stiffness: 500, damping: 35 }}
                            />
                        )}
                        <Icon className="w-4 h-4 relative z-10" />
                    </motion.button>
                );
            })}
        </div>
    );
}
