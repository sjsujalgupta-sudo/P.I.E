/*
 * 🎭 Analogy: This is the "Traffic Controller" — it looks at which mode
 *    is active (Overview, Journey, Time…) and sends the user to the right
 *    visualization, like directing planes to the correct runway.
 * ✅ Safe to change:
 *    1. Add a new mode condition: mode === "memory" ? <MemoryView /> : ...
 *    2. Edit the ModePlaceholder card text/colors for placeholder modes
 *    3. Change the enter/exit animation variants (enter, center, exit)
 * ❌ Never touch: The AnimatePresence mode="wait" wrapper — removing it
 *    causes two modes to render simultaneously and overlap.
 */
"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
    LayoutDashboard,
    Route,
    Clock,
    Network,
    Lightbulb,
} from "lucide-react";
import { useMode, type DashboardMode } from "@/lib/store/modeStore";
import { NetworkGraph }   from "./network/NetworkGraph";
import { JourneyView }    from "./sankey/JourneyView";
import { TimeHeatmap }    from "./heatmap/TimeHeatmap";
import { StreamGraph }    from "./stream/StreamGraph";
import { StructureGraph } from "./structure/StructureGraph";

// ─── Per-mode visual config ───────────────────────────────────────────────────

const MODE_CONFIG: Record<
    DashboardMode,
    {
        label: string;
        description: string;
        icon: any;
        accent: string;
        bg: string;
        border: string;
        glow: string;
        orb1: string;
        orb2: string;
    }
> = {
    overview: {
        label: "Overview Mode",
        description: "High-level summary of your PIE activity.",
        icon: LayoutDashboard,
        accent: "text-accent",
        bg: "bg-accent/[0.04]",
        border: "border-accent/15",
        glow: "rgba(167,139,250,0.12)",
        orb1: "rgba(167,139,250,0.18)",
        orb2: "rgba(34,211,238,0.10)",
    },
    journey: {
        label: "Journey Mode",
        description: "Visualize user flows, Sankey diagrams, and path analysis.",
        icon: Route,
        accent: "text-cyan",
        bg: "bg-cyan/[0.04]",
        border: "border-cyan/15",
        glow: "rgba(34,211,238,0.12)",
        orb1: "rgba(34,211,238,0.18)",
        orb2: "rgba(167,139,250,0.10)",
    },
    time: {
        label: "Time Mode",
        description: "Temporal patterns, trends, and time-series breakdowns.",
        icon: Clock,
        accent: "text-emerald",
        bg: "bg-emerald/[0.04]",
        border: "border-emerald/15",
        glow: "rgba(52,211,153,0.12)",
        orb1: "rgba(52,211,153,0.18)",
        orb2: "rgba(34,211,238,0.10)",
    },
    stream: {
        label: "Patterns Mode",
        description: "Behavioral rhythm and category evolution over time.",
        icon: LayoutDashboard,
        accent: "text-pink-400",
        bg: "bg-pink-400/[0.04]",
        border: "border-pink-400/15",
        glow: "rgba(244,114,182,0.12)",
        orb1: "rgba(244,114,182,0.18)",
        orb2: "rgba(167,139,250,0.10)",
    },
    structure: {
        label: "Structure Mode",
        description: "Hierarchy, network graphs, and node-link diagrams.",
        icon: Network,
        accent: "text-violet-400",
        bg: "bg-violet-400/[0.04]",
        border: "border-violet-400/15",
        glow: "rgba(167,139,250,0.14)",
        orb1: "rgba(139,92,246,0.20)",
        orb2: "rgba(167,139,250,0.10)",
    },
    insights: {
        label: "Insights Mode",
        description: "AI-driven pattern analysis and intelligent recommendations.",
        icon: Lightbulb,
        accent: "text-amber-400",
        bg: "bg-amber-400/[0.04]",
        border: "border-amber-400/15",
        glow: "rgba(251,191,36,0.12)",
        orb1: "rgba(251,191,36,0.18)",
        orb2: "rgba(52,211,153,0.10)",
    },
};

// ─── Framer Motion variants ───────────────────────────────────────────────────

const variants = {
    enter:  { opacity: 0, y: 14, scale: 0.98 },
    center: { opacity: 1, y: 0,  scale: 1    },
    exit:   { opacity: 0, y: -10, scale: 0.98 },
};

// ─── Placeholder (used for all modes except overview) ────────────────────────

function ModePlaceholder({ mode }: { mode: DashboardMode }) {
    const cfg  = MODE_CONFIG[mode];
    const Icon = cfg.icon;

    return (
        <div className="absolute inset-0 flex items-center justify-center p-8">
            {/* Ambient orbs */}
            <div
                className="absolute top-0 right-0 w-72 h-72 rounded-full pointer-events-none"
                style={{
                    background: `radial-gradient(circle, ${cfg.orb1}, transparent 70%)`,
                    filter: "blur(60px)",
                    transform: "translate(30%, -30%)",
                }}
            />
            <div
                className="absolute bottom-0 left-0 w-56 h-56 rounded-full pointer-events-none"
                style={{
                    background: `radial-gradient(circle, ${cfg.orb2}, transparent 70%)`,
                    filter: "blur(50px)",
                    transform: "translate(-30%, 30%)",
                }}
            />

            {/* Placeholder card */}
            <motion.div
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.08, duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
                className={`
                    relative flex flex-col items-center gap-5 px-12 py-10
                    rounded-[24px] border backdrop-blur-xl
                    ${cfg.bg} ${cfg.border}
                `}
                style={{
                    boxShadow: `0 0 60px ${cfg.glow}, inset 0 1px 1px rgba(255,255,255,0.08)`,
                }}
            >
                <div
                    className={`w-14 h-14 rounded-[16px] flex items-center justify-center border ${cfg.border} ${cfg.bg}`}
                    style={{ boxShadow: `0 0 24px ${cfg.glow}` }}
                >
                    <Icon className={`w-7 h-7 ${cfg.accent}`} />
                </div>

                <div className="text-center space-y-1.5">
                    <h2 className={`text-[22px] font-bold tracking-tight ${cfg.accent}`}>
                        {cfg.label}
                    </h2>
                    <p className="text-[13px] text-label-secondary max-w-[260px] leading-relaxed">
                        {cfg.description}
                    </p>
                </div>

                {/* Decorative dashed ring */}
                <div
                    className={`absolute inset-0 rounded-[24px] border-2 border-dashed opacity-20 pointer-events-none ${cfg.border}`}
                    style={{ margin: "6px" }}
                />
            </motion.div>
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function MainView() {
    const mode = useMode();

    return (
        <div className="w-full h-full overflow-hidden relative">
            <AnimatePresence mode="wait">
                <motion.div
                    key={mode}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                    className="absolute inset-0"
                >
                    {mode === "overview" ? (
                        <NetworkGraph />
                    ) : mode === "journey" ? (
                        <JourneyView />
                    ) : mode === "time" ? (
                        <TimeHeatmap />
                    ) : mode === "stream" ? (
                        <StreamGraph />
                    ) : mode === "structure" ? (
                        <StructureGraph />
                    ) : (
                        <ModePlaceholder mode={mode} />
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
