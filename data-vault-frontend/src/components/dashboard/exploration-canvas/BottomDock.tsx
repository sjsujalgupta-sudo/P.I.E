/*
 * 🎭 Analogy: This file is the "Dock Bar" — like the macOS dock
 *   at the bottom of your screen, it shows quick-access widgets
 *   (activity, top sites, trends) that expand when clicked.
 * ✅ Safe to change:
 *    1. The TOP_DOMAINS list — swap in real domain names and colors
 *    2. The HEATMAP_DATA grid values (0–3 intensity per cell)
 *    3. The TREND_POINTS sparkline values (0–1 normalized)
 * ❌ Never touch: The `BottomDock` export name — it's imported by
 *   ExplorationCanvas. Renaming it breaks the Atlas layout.
 */

"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ChevronUp, Activity, Globe, TrendingUp } from "lucide-react";
import { useSetMode, useMode } from "@/lib/store/modeStore";
// ─── Mock data ────────────────────────────────────────────────────────────────

const TOP_DOMAINS = [
    { label: "Google",    visits: 100, color: "#22d3ee" },
    { label: "GitHub",    visits: 88,  color: "#34d399" },
    { label: "YouTube",   visits: 95,  color: "#a78bfa" },
    { label: "Reddit",    visits: 78,  color: "#f59e0b" },
    { label: "Notion",    visits: 70,  color: "#f472b6" },
];

// 7 columns × 4 rows of activity intensity (0–3)
const HEATMAP_DATA: number[][] = [
    [0, 1, 2, 3, 2, 1, 0],
    [1, 2, 3, 3, 3, 2, 1],
    [0, 1, 1, 2, 3, 2, 0],
    [0, 0, 1, 1, 2, 1, 0],
];

// Simple sparkline points (normalised 0–1)
const TREND_POINTS = [0.3, 0.5, 0.4, 0.7, 0.6, 0.8, 0.75, 0.9, 0.85, 1.0];

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Mini heatmap — 7 × 4 grid of intensity blocks */
function MiniHeatmap() {
    const intensityColor = (v: number) => {
        const alphas = ["0a", "33", "77", "cc"];
        return `#a78bfa${alphas[v] ?? "0a"}`;
    };

    return (
        <div className="flex flex-col gap-[3px] w-full">
            {HEATMAP_DATA.map((row, ri) => (
                <div key={ri} className="flex gap-[3px]">
                    {row.map((val, ci) => (
                        <div
                            key={ci}
                            className="flex-1 rounded-[2px] transition-opacity duration-200"
                            style={{
                                height: 10,
                                backgroundColor: intensityColor(val),
                            }}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
}

/** Top domains — horizontal mini bar chart */
function TopDomains() {
    const max = Math.max(...TOP_DOMAINS.map((d) => d.visits));
    return (
        <div className="flex flex-col gap-[5px] w-full">
            {TOP_DOMAINS.map((d) => (
                <div key={d.label} className="flex items-center gap-2">
                    <span
                        className="text-[9px] font-medium w-12 flex-shrink-0 truncate"
                        style={{ color: "rgba(255,255,255,0.45)" }}
                    >
                        {d.label}
                    </span>
                    <div className="flex-1 h-[6px] rounded-full bg-white/[0.06] overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(d.visits / max) * 100}%` }}
                            transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1], delay: 0.1 }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: d.color }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}

/** Mini trend sparkline — SVG polyline */
function MiniTrend() {
    const W = 120, H = 36;
    const pts = TREND_POINTS.map((v, i) => {
        const x = (i / (TREND_POINTS.length - 1)) * W;
        const y = H - v * H;
        return `${x},${y}`;
    }).join(" ");

    // Area fill path
    const first = `0,${H}`;
    const last  = `${W},${H}`;
    const area  = `${first} ${pts} ${last}`;

    return (
        <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full"
            style={{ height: H }}
            preserveAspectRatio="none"
        >
            <defs>
                <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#22d3ee" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#22d3ee" stopOpacity="0"    />
                </linearGradient>
            </defs>
            {/* Area */}
            <polygon points={area} fill="url(#trendFill)" />
            {/* Line */}
            <polyline
                points={pts}
                fill="none"
                stroke="#22d3ee"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            {/* End dot */}
            <circle
                cx={(TREND_POINTS.length - 1) / (TREND_POINTS.length - 1) * W}
                cy={H - TREND_POINTS[TREND_POINTS.length - 1] * H}
                r="2.5"
                fill="#22d3ee"
            />
        </svg>
    );
}

// ─── Widget card ──────────────────────────────────────────────────────────────

function Widget({
    title,
    icon: Icon,
    iconColor,
    accentBorder,
    onClick,
    children,
}: {
    title: string;
    icon: any;
    iconColor: string;
    accentBorder: string;
    onClick: () => void;
    children: React.ReactNode;
}) {
    const [hovered, setHovered] = useState(false);

    return (
        <motion.button
            onClick={onClick}
            onHoverStart={() => setHovered(true)}
            onHoverEnd={() => setHovered(false)}
            whileHover={{ y: -2, scale: 1.015 }}
            whileTap={{ scale: 0.97 }}
            className={`
                flex-1 flex flex-col gap-2.5 p-3 rounded-[14px] text-left
                border cursor-pointer outline-none
                transition-colors duration-200
                ${hovered
                    ? `bg-white/[0.07] ${accentBorder}`
                    : "bg-white/[0.03] border-white/[0.08]"
                }
            `}
            aria-label={`Open ${title}`}
        >
            {/* Header */}
            <div className="flex items-center gap-1.5">
                <Icon className="w-3 h-3 flex-shrink-0" style={{ color: iconColor }} />
                <span
                    className="text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: hovered ? iconColor : "rgba(255,255,255,0.4)" }}
                >
                    {title}
                </span>
            </div>

            {/* Content */}
            <div className="flex-1 w-full overflow-hidden">
                {children}
            </div>
        </motion.button>
    );
}

// ─── BottomDock ───────────────────────────────────────────────────────────────

export function BottomDock() {
    const [open, setOpen] = useState(false);
    const setMode         = useSetMode();
    const mode            = useMode();

    // In journey mode the Sankey + Timeline are the focus — dock steps back
    const isJourney = mode === "journey";

    return (
        <div
            className="
                flex-shrink-0 w-full
                border-t border-white/[0.08]
                bg-white/[0.04] backdrop-blur-xl
                rounded-t-[16px]
                overflow-hidden
                z-10
                transition-opacity duration-300
            "
            style={{ opacity: isJourney ? 0.55 : 1 }}
        >
            {/* ── Collapsed bar — always visible ─────────────────────────── */}
            <button
                onClick={() => setOpen((v) => !v)}
                className="
                    w-full h-10 flex items-center justify-between px-5
                    hover:bg-white/[0.04] transition-colors duration-200 group
                "
                aria-expanded={open}
                aria-label={open ? "Collapse insights dock" : "Expand insights dock"}
            >
                <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-accent" />
                    <span className="text-[12px] font-semibold text-label-secondary group-hover:text-label transition-colors duration-150">
                        Insights
                    </span>
                    {!open && (
                        <span className="text-[10px] text-label-tertiary ml-1 hidden sm:inline">
                            · Activity · Top Sites · Trends
                        </span>
                    )}
                </div>

                <motion.div
                    animate={{ rotate: open ? 180 : 0 }}
                    transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
                >
                    <ChevronUp className="w-3.5 h-3.5 text-label-tertiary group-hover:text-label-secondary transition-colors duration-150" />
                </motion.div>
            </button>

            {/* ── Expanded panel ─────────────────────────────────────────── */}
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        key="dock-expanded"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 160, opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
                        className="overflow-hidden"
                    >
                        <div className="h-[160px] px-4 pb-4 pt-1 flex items-stretch gap-3">

                            {/* Widget 1 — Activity heatmap → time mode */}
                            <Widget
                                title="Activity"
                                icon={Activity}
                                iconColor="#a78bfa"
                                accentBorder="border-accent/25"
                                onClick={() => setMode("time")}
                            >
                                <MiniHeatmap />
                            </Widget>

                            {/* Widget 2 — Top domains → structure mode */}
                            <Widget
                                title="Top Sites"
                                icon={Globe}
                                iconColor="#22d3ee"
                                accentBorder="border-cyan/25"
                                onClick={() => setMode("structure")}
                            >
                                <TopDomains />
                            </Widget>

                            {/* Widget 3 — Trend sparkline → insights mode */}
                            <Widget
                                title="Trends"
                                icon={TrendingUp}
                                iconColor="#34d399"
                                accentBorder="border-emerald/25"
                                onClick={() => setMode("insights")}
                            >
                                <MiniTrend />
                            </Widget>

                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
