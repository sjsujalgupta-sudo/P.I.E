/*
 * 🎭 Analogy: This is the "Control Tower" — the horizontal bar at the top
 *    of Atlas showing the mode tabs (Overview, Journey, Time…) and the
 *    CMD+K search button. It's the cockpit the user navigates from.
 * ✅ Safe to change:
 *    1. Edit a mode's label, icon, or glow color in the MODES array
 *    2. Change the Atlas subtitle text ("Behavioral Exploration System")
 *    3. Reorder the MODES array to change tab order
 * ❌ Never touch: The layoutId="topbar-active-pill" on the motion.div —
 *    this is the shared animation ID. Changing it breaks the sliding
 *    highlight animation between tabs.
 */
"use client";

import { motion } from "framer-motion";
import {
    LayoutDashboard,
    Route,
    Clock,
    Waves,
    Network,
    Lightbulb,
    Map,
    Maximize,
    Minimize,
} from "lucide-react";
import { useMode, useSetMode, type DashboardMode } from "@/lib/store/modeStore";
import { AtlasSearch, FilterChips } from "./AtlasSearch";

// ─── Mode nav config ──────────────────────────────────────────────────────────

const MODES: {
    value: DashboardMode;
    label: string;
    icon: any;
    activeColor: string;
    activeBg: string;
    activeBorder: string;
    glow: string;
}[] = [
    { value: "overview",  label: "Overview",  icon: LayoutDashboard, activeColor: "text-accent",     activeBg: "bg-accent/[0.12]",     activeBorder: "border-accent/30",     glow: "rgba(167,139,250,0.5)"  },
    { value: "journey",   label: "Journey",   icon: Route,           activeColor: "text-cyan",       activeBg: "bg-cyan/[0.12]",       activeBorder: "border-cyan/30",       glow: "rgba(34,211,238,0.5)"   },
    { value: "time",      label: "Time",      icon: Clock,           activeColor: "text-emerald",    activeBg: "bg-emerald/[0.12]",    activeBorder: "border-emerald/30",    glow: "rgba(52,211,153,0.5)"   },
    { value: "stream",    label: "Patterns",  icon: Waves,           activeColor: "text-pink-400",   activeBg: "bg-pink-400/[0.12]",   activeBorder: "border-pink-400/30",   glow: "rgba(244,114,182,0.5)"  },
    { value: "structure", label: "Structure", icon: Network,         activeColor: "text-violet-400", activeBg: "bg-violet-400/[0.12]", activeBorder: "border-violet-400/30", glow: "rgba(167,139,250,0.4)"  },
    { value: "insights",  label: "Insights",  icon: Lightbulb,       activeColor: "text-amber-400",  activeBg: "bg-amber-400/[0.12]",  activeBorder: "border-amber-400/30",  glow: "rgba(251,191,36,0.4)"   },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function TopBar({
    isFullscreen,
    toggleFullscreen,
}: {
    isFullscreen?: boolean;
    toggleFullscreen?: () => void;
} = {}) {
    const mode    = useMode();
    const setMode = useSetMode();

    return (
        <div className="flex-shrink-0 border-b border-white/[0.07] bg-white/[0.02] backdrop-blur-xl">
            {/* Main bar */}
            <div className="h-12 flex items-center justify-between px-4 gap-3">
                {/* Left — Atlas branding */}
                <div className="flex items-center gap-2.5 flex-shrink-0">
                    <div className="w-6 h-6 rounded-[8px] bg-accent/15 border border-accent/25 flex items-center justify-center">
                        <Map className="w-3 h-3 text-accent" />
                    </div>
                    <div className="hidden sm:block">
                        <span className="text-[13px] font-bold tracking-tight text-label">Atlas</span>
                        <span className="text-[10px] text-label-tertiary ml-2 hidden md:inline">Behavioral Exploration System</span>
                    </div>
                </div>

                {/* Center — horizontal mode tabs */}
                <div className="flex items-center gap-0.5 p-0.5 rounded-[14px] bg-white/[0.03] border border-white/[0.07]">
                    {MODES.map(({ value, label, icon: Icon, activeColor, activeBg, activeBorder, glow }) => {
                        const active = mode === value;
                        return (
                            <motion.button
                                key={value}
                                onClick={() => setMode(value)}
                                whileTap={{ scale: 0.95 }}
                                title={label}
                                aria-label={`Switch to ${label} mode`}
                                className={`
                                    relative flex items-center gap-1.5 px-2.5 py-1.5
                                    rounded-[11px] text-[12px] font-medium
                                    transition-colors duration-150 outline-none
                                    focus-visible:ring-2 focus-visible:ring-accent/50
                                    ${active
                                        ? `${activeBg} ${activeBorder} border ${activeColor}`
                                        : "text-label-tertiary hover:text-label-secondary border border-transparent"
                                    }
                                `}
                                style={active ? { boxShadow: `0 0 12px ${glow}` } : undefined}
                            >
                                <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                                <span className="hidden md:block">{label}</span>
                                {active && (
                                    <motion.div
                                        layoutId="topbar-active-pill"
                                        className="absolute inset-0 rounded-[11px] pointer-events-none"
                                        style={{ boxShadow: `inset 0 0 0 1px ${glow}` }}
                                        transition={{ type: "spring", stiffness: 500, damping: 35 }}
                                    />
                                )}
                            </motion.button>
                        );
                    })}
                </div>

                {/* Right — search & fullscreen */}
                <div className="flex-shrink-0 flex items-center gap-2">
                    <AtlasSearch />
                    {toggleFullscreen && (
                        <button
                            onClick={toggleFullscreen}
                            className="w-8 h-8 flex items-center justify-center rounded-[10px] bg-white/[0.03] border border-white/[0.07] text-label-tertiary hover:text-label hover:bg-white/[0.08] transition-colors duration-150"
                            title="Toggle Fullscreen"
                        >
                            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                        </button>
                    )}
                </div>
            </div>

            {/* Filter chips row — only when active */}
            <FilterChipsRow />
        </div>
    );
}

function FilterChipsRow() {
    return (
        <div className="px-4 pb-2 flex items-center gap-2 min-h-0">
            <FilterChips />
        </div>
    );
}
