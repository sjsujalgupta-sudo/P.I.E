import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Clock, ArrowRight, Lightbulb, X, Compass, Route, Network, LayoutDashboard, Tag, GitBranch, Layers, CheckCircle2
} from "lucide-react";
import {
    useFocusedEntity, useModeActions, useMode, useIsSearchActive, type SiteCategory
} from "@/lib/store/modeStore";
import {
    getPeakHour, getMostActiveDay, getMostCommonJourney, getMostConnectedNode,
    getCategoryStats, getTimeStats, getJourneyStats, getCrossModeSummary
} from "./utils/searchContextUtils";
import { CATEGORY_COLORS } from "./data/mockBrowsingEvents";

const CATEGORY_LABELS: Record<SiteCategory, string> = {
    dev: "Development",
    social: "Social",
    search: "Search",
    productivity: "Productivity",
    content: "Content",
};

export function SearchContextPanel() {
    const focusedEntity = useFocusedEntity();
    const isSearchActive = useIsSearchActive();
    const currentMode = useMode();
    const { setMode, clearSearch, setSelectedNode, setSelectedCategory } = useModeActions();

    const stats = useMemo(() => {
        if (!focusedEntity) return null;

        if (focusedEntity.type === "node") {
            const id = focusedEntity.id;
            return {
                type: "node" as const,
                peakHour: getPeakHour(id),
                activeDay: getMostActiveDay(id),
                commonJourney: getMostCommonJourney(id),
                connectedNode: getMostConnectedNode(id),
            };
        } else if (focusedEntity.type === "category") {
            return { type: "category" as const, ...getCategoryStats(focusedEntity.category) };
        } else if (focusedEntity.type === "time") {
            return { type: "time" as const, ...getTimeStats(focusedEntity.value, focusedEntity.hours, focusedEntity.day) };
        } else {
            return { type: "journey" as const, ...getJourneyStats(focusedEntity.source, focusedEntity.target) };
        }
    }, [focusedEntity]);

    const crossMode = useMemo(() => {
        if (!focusedEntity) return null;
        return getCrossModeSummary(focusedEntity);
    }, [focusedEntity]);

    const handleClear = () => {
        clearSearch();
        setSelectedNode(null);
        setSelectedCategory(null);
    };

    if (!isSearchActive || !focusedEntity) return null;

    // Breadcrumbs compiler
    const breadcrumbs = (() => {
        if (focusedEntity.type === "node") {
            const peak = getPeakHour(focusedEntity.id);
            const activeDay = getMostActiveDay(focusedEntity.id);
            return [
                focusedEntity.label,
                stats && "peakHour" in stats ? `Peak: ${stats.peakHour}` : activeDay,
                "Node Territory"
            ];
        }
        if (focusedEntity.type === "category") {
            const catLabel = CATEGORY_LABELS[focusedEntity.category] || focusedEntity.category;
            return [catLabel, "Ecosystem Center", "District Zone"];
        }
        if (focusedEntity.type === "journey") {
            return [
                `${focusedEntity.source} → ${focusedEntity.target}`,
                "Behavioral Flow",
                "Cross-District Pathway"
            ];
        }
        return [focusedEntity.value, "Temporal Slot", "Rhythm Activity"];
    })();

    const entityColor = (() => {
        if (focusedEntity.type === "node") return "#a78bfa";
        if (focusedEntity.type === "category") return CATEGORY_COLORS[focusedEntity.category] || "#a78bfa";
        if (focusedEntity.type === "journey") return "#22d3ee";
        return "#34d399";
    })();

    return (
        <AnimatePresence>
            <motion.div
                key="search-context-panel"
                initial={{ opacity: 0, x: 20, width: 0 }}
                animate={{ opacity: 1, x: 0, width: 280 }}
                exit={{ opacity: 0, x: 20, width: 0 }}
                transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                className="flex-shrink-0 h-full overflow-hidden border-l border-white/[0.07]
                           bg-[rgba(8,8,16,0.5)] backdrop-blur-xl flex flex-col relative z-20"
                style={{ minWidth: 280 }}
            >
                {/* Animated top-edge glow strip */}
                <motion.div
                    className="absolute top-0 left-0 right-0 h-[2px] rounded-t-[inherit]"
                    style={{ background: `linear-gradient(90deg, transparent, ${entityColor}88, transparent)` }}
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />

                <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4"
                     style={{ scrollbarWidth: "thin" }}>

                    {/* ── Header ──────────────────────────────── */}
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <motion.div
                                    animate={{ scale: [1, 1.15, 1], opacity: [0.8, 1, 0.8] }}
                                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                                >
                                    <Compass className="w-3.5 h-3.5 flex-shrink-0" style={{ color: entityColor }} />
                                </motion.div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-label-secondary">
                                    Search Context
                                </span>
                            </div>
                            <h3 className="text-[16px] font-semibold text-label leading-tight truncate max-w-[200px]"
                                style={{
                                    color: entityColor,
                                    textShadow: `0 0 20px ${entityColor}44`,
                                }}>
                                {focusedEntity.type === "node" ? focusedEntity.label :
                                 focusedEntity.type === "category" ? CATEGORY_LABELS[focusedEntity.category] :
                                 focusedEntity.type === "journey" ? `${focusedEntity.source} → ${focusedEntity.target}` :
                                 focusedEntity.value}
                            </h3>
                        </div>
                        <button
                            onClick={handleClear}
                            className="text-label-tertiary hover:text-label transition-colors duration-150 mt-0.5 flex-shrink-0"
                            aria-label="Clear Search Focus"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {/* ── Breadcrumb Trace ───────────────────── */}
                    <div className="px-3 py-2 rounded-[12px] bg-white/[0.02] border border-white/[0.04] flex flex-col gap-0.5">
                        <span className="text-[9px] font-semibold uppercase tracking-wider text-label-tertiary">
                            Atlas Context Trace
                        </span>
                        <div className="flex flex-col gap-0.5 mt-1 font-mono text-[10px] text-label-secondary">
                            {breadcrumbs.map((crumb, idx) => (
                                <div key={idx} className="flex items-center gap-1.5" style={{ paddingLeft: `${idx * 8}px` }}>
                                    {idx > 0 && <span className="text-label-tertiary">↳</span>}
                                    <span className={idx === 0 ? "font-semibold" : ""}>{crumb}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── Statistics Breakdown ───────────────── */}
                    {stats && (
                        <motion.div
                            className="flex flex-col gap-2.5"
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                        >
                            <span className="text-[10px] font-bold uppercase tracking-widest text-label-tertiary">
                                Behavioral Stats
                            </span>

                            {stats.type === "node" && (
                                <div className="grid grid-cols-2 gap-2">
                                    <StatCard label="Peak Window" value={stats.peakHour} color="#34d399" />
                                    <StatCard label="Active Day" value={stats.activeDay} color="#22d3ee" />
                                    <div className="col-span-2 px-3 py-2 rounded-[12px] bg-white/[0.03] border border-white/[0.06]">
                                        <p className="text-[9px] font-semibold uppercase tracking-wider text-label-tertiary mb-0.5">Connected node</p>
                                        <p className="text-[12px] font-medium text-label">{stats.connectedNode}</p>
                                    </div>
                                    <div className="col-span-2 px-3 py-2 rounded-[12px] bg-white/[0.03] border border-white/[0.06]">
                                        <p className="text-[9px] font-semibold uppercase tracking-wider text-label-tertiary mb-0.5">Most common journey</p>
                                        <p className="text-[11px] font-medium text-label truncate">{stats.commonJourney}</p>
                                    </div>
                                </div>
                            )}

                            {stats.type === "category" && (
                                <div className="flex flex-col gap-2">
                                    <div className="grid grid-cols-2 gap-2">
                                        <StatCard label="Peak Window" value={stats.peak} color="#34d399" />
                                        <StatCard label="Active Day" value={stats.activeDay} color="#22d3ee" />
                                    </div>
                                    <div className="px-3 py-2.5 rounded-[12px] bg-white/[0.03] border border-white/[0.06]">
                                        <p className="text-[9px] font-semibold uppercase tracking-wider text-label-tertiary mb-1.5">Top Category Sites</p>
                                        <div className="flex flex-col gap-1.5">
                                            {stats.topSites.map((s, idx) => (
                                                <div key={idx} className="flex justify-between items-center text-[11px]">
                                                    <span className="font-medium text-label-secondary">{s.label}</span>
                                                    <span className="text-[10px] text-label-tertiary">{s.duration}m active</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {stats.type === "journey" && (
                                <div className="flex flex-col gap-2">
                                    <div className="grid grid-cols-2 gap-2">
                                        <StatCard label="Matching Flows" value={`${stats.flowCount}`} color="#a78bfa" />
                                        <StatCard label="Peak Time" value={stats.peak} color="#34d399" />
                                    </div>
                                    <div className="px-3 py-2.5 rounded-[12px] bg-white/[0.03] border border-white/[0.06]">
                                        <p className="text-[9px] font-semibold uppercase tracking-wider text-label-tertiary mb-1">Common Active Day</p>
                                        <p className="text-[12px] font-medium text-label">{stats.activeDay}</p>
                                    </div>
                                    {stats.topIntermediates.length > 0 && (
                                        <div className="px-3 py-2.5 rounded-[12px] bg-white/[0.03] border border-white/[0.06]">
                                            <p className="text-[9px] font-semibold uppercase tracking-wider text-label-tertiary mb-1.5">Top Intermediates</p>
                                            <div className="flex flex-col gap-1.5">
                                                {stats.topIntermediates.map((ti, idx) => (
                                                    <div key={idx} className="flex justify-between items-center text-[10px]">
                                                        <span className="font-medium text-label-secondary truncate max-w-[170px]">{ti.route}</span>
                                                        <span className="text-label-tertiary flex-shrink-0">×{ti.count}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {stats.type === "time" && (
                                <div className="flex flex-col gap-2">
                                    <div className="grid grid-cols-2 gap-2">
                                        <StatCard label="Sessions" value={`${stats.sessionCount}`} color="#22d3ee" />
                                        <StatCard label="Avg Duration" value={`${stats.avgDuration}m`} color="#34d399" />
                                    </div>
                                    {stats.dominantCat && (
                                        <div className="px-3 py-2 rounded-[12px] bg-white/[0.03] border border-white/[0.06]">
                                            <p className="text-[9px] font-semibold uppercase tracking-wider text-label-tertiary mb-0.5">Dominant Rhythm</p>
                                            <p className="text-[12px] font-semibold capitalize" style={{ color: CATEGORY_COLORS[stats.dominantCat] }}>
                                                {CATEGORY_LABELS[stats.dominantCat]}
                                            </p>
                                        </div>
                                    )}
                                    {stats.topSites.length > 0 && (
                                        <div className="px-3 py-2.5 rounded-[12px] bg-white/[0.03] border border-white/[0.06]">
                                            <p className="text-[9px] font-semibold uppercase tracking-wider text-label-tertiary mb-1.5">Top Active Nodes</p>
                                            <div className="flex flex-col gap-1">
                                                {stats.topSites.map((ts, idx) => (
                                                    <div key={idx} className="flex justify-between items-center text-[11px]">
                                                        <span className="font-medium text-label-secondary">{ts.label}</span>
                                                        <span className="text-[10px] text-label-tertiary">{ts.duration}m</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ── Cross Mode Representation Summary ── */}
                    {crossMode && (
                        <div className="flex flex-col gap-2 pt-2 border-t border-white/[0.06]">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-label-tertiary">
                                Cross-Mode Representation
                            </span>
                            <div className="flex flex-col gap-1.5 mt-1 text-[11px] text-label-secondary">
                                {[
                                    { mode: "overview",  label: "Overview",  desc: crossMode.overview },
                                    { mode: "journey",   label: "Journey",   desc: crossMode.journey },
                                    { mode: "time",      label: "Time",      desc: crossMode.time },
                                    { mode: "stream",    label: "Patterns",  desc: crossMode.patterns },
                                    { mode: "structure", label: "Structure", desc: crossMode.structure },
                                ].map((item) => {
                                    const active = currentMode === item.mode;
                                    return (
                                        <div key={item.mode} className={`flex items-start gap-2 p-1.5 rounded-lg border transition-all duration-150
                                            ${active
                                                ? "bg-accent/[0.06] border-accent/20 text-label"
                                                : "bg-transparent border-transparent text-label-secondary"
                                            }`}>
                                            <CheckCircle2 className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${active ? "text-accent" : "text-label-tertiary opacity-45"}`} />
                                            <div>
                                                <p className="font-semibold text-[10px] leading-tight uppercase tracking-wider">{item.label}</p>
                                                <p className="text-[11px] mt-0.5 opacity-75">{item.desc}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ── Quick Actions ───────────────────────── */}
                    <div className="flex flex-col gap-2 pt-4 border-t border-white/[0.06] mt-auto">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-label-tertiary">
                            Quick Actions
                        </span>
                        <div className="flex flex-col gap-1.5">
                            <ActionButton
                                label="Analyze Journey"
                                icon={Route}
                                color="#22d3ee"
                                active={currentMode === "journey"}
                                onClick={() => setMode("journey")}
                            />
                            <ActionButton
                                label="Analyze Time"
                                icon={Clock}
                                color="#34d399"
                                active={currentMode === "time"}
                                onClick={() => setMode("time")}
                            />
                            <ActionButton
                                label="Reveal Structure"
                                icon={Network}
                                color="#a78bfa"
                                active={currentMode === "structure"}
                                onClick={() => setMode("structure")}
                            />
                        </div>
                    </div>

                </div>
            </motion.div>
        </AnimatePresence>
    );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
    return (
        <div className="px-3 py-2 rounded-[12px] border"
            style={{ backgroundColor: color + "0a", borderColor: color + "20" }}>
            <p className="text-[9px] font-semibold uppercase tracking-wider mb-0.5"
                style={{ color: "rgba(255,255,255,0.30)" }}>{label}</p>
            <p className="text-[14px] font-bold" style={{ color }}>{value}</p>
        </div>
    );
}

function ActionButton({
    label, icon: Icon, color, active, onClick
}: {
    label: string; icon: any; color: string; active: boolean; onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-[12px] border text-[11px] font-semibold transition-all duration-150
                ${active
                    ? "bg-accent/10 border-accent/25 text-accent"
                    : "bg-white/[0.03] border-white/[0.06] text-label-secondary hover:bg-white/[0.06] hover:text-label"
                }`}
        >
            <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: active ? "inherit" : color }} />
            <span>{label}</span>
        </button>
    );
}
