/*
 * 🎭 Analogy: This is the "Spotlight Search" (like macOS CMD+Space) —
 *    press CMD+K anywhere in Atlas and a search bar drops down. Type
 *    "YouTube" and every mode instantly highlights YouTube-related data.
 * ✅ Safe to change:
 *    1. Edit the quick-access chip labels in the "Quick access" section
 *    2. Change the placeholder text in the input field
 *    3. Add a new search category by copying the Nodes or Categories block
 * ❌ Never touch: The useEffect keyboard listener for CMD+K — removing it
 *    breaks the keyboard shortcut and the search won't open.
 */
"use client";

/**
 * AtlasSearch — Global semantic search + filter system.
 *
 * CMD+K / CTRL+K opens a spotlight-style command bar.
 * Search propagates across ALL modes via Zustand store.
 *
 * Supports:
 *   - Node names (YouTube, GitHub, Google...)
 *   - Categories (Development, Social, Productivity...)
 *   - Modes (Journey, Time, Patterns, Structure...)
 *   - Time references (afternoon, 3PM, Tuesday, late night...)
 */

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, ArrowRight, Clock, Network, Waves, Route, LayoutDashboard, Tag, Sparkles, Zap } from "lucide-react";
import {
    useModeActions,
    useSearchQuery,
    useSearchScope,
    useFocusedEntity,
    useSearchResults,
    useIsSearchActive,
    type DashboardMode,
    type SiteCategory,
    type SearchScope,
    type AtlasSearchResult
} from "@/lib/store/modeStore";
import { getSearchSuggestions } from "./utils/searchContextUtils";
import { ALL_EVENTS, CATEGORY_COLORS } from "./data/mockBrowsingEvents";

// ─── Search config ─────────────────────────────────────────────────────────────

const SCOPES: { value: SearchScope; label: string }[] = [
    { value: "all",      label: "All" },
    { value: "node",     label: "Sites" },
    { value: "category", label: "Categories" },
    { value: "journey",  label: "Journeys" },
    { value: "time",     label: "Time" },
];

const SCOPE_ICONS = {
    node: LayoutDashboard,
    category: Tag,
    journey: Route,
    time: Clock,
};

const CATEGORY_LABELS: Record<SiteCategory, string> = {
    dev: "Development",
    social: "Social",
    search: "Search",
    productivity: "Productivity",
    content: "Content",
};

// ─── Component ────────────────────────────────────────────────────────────────

export function AtlasSearch() {
    const [open, setOpen]   = useState(false);
    const [query, setQuery] = useState("");
    const [activeIndex, setActiveIndex] = useState(0);
    const inputRef          = useRef<HTMLInputElement>(null);

    const searchScope      = useSearchScope();
    const focusedEntity    = useFocusedEntity();
    const searchResults    = useSearchResults();

    const {
        setSearchQuery, setSearchScope, setFocusedEntity, setSearchResults,
        setFilteredNodes, setFilteredCategories, clearSearch, setSelectedNode, setSelectedCategory,
    } = useModeActions();

    // Generate suggestions as query / scope changes
    const suggestions = useMemo(() => {
        if (!query.trim()) {
            return [
                { type: "node", id: "GitHub", label: "GitHub" },
                { type: "node", id: "YouTube", label: "YouTube" },
                { type: "node", id: "Google", label: "Google" },
                { type: "category", category: "dev" },
                { type: "category", category: "social" },
                { type: "time", value: "Afternoon", hours: [12, 13, 14, 15, 16, 17] },
                { type: "journey", source: "Google", target: "GitHub" },
                { type: "time", value: "Monday", day: "Monday" }
            ] as AtlasSearchResult[];
        }
        return getSearchSuggestions(query, searchScope);
    }, [query, searchScope]);

    // Keep searchResults state updated in store (for reference, though suggestions is local)
    useEffect(() => {
        setSearchResults(suggestions);
        setActiveIndex(0);
    }, [suggestions, setSearchResults]);

    // ── Keyboard shortcut for CMD+K ───────────────────────────────────────────
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setOpen((v) => !v);
            }
            if (e.key === "Escape") setOpen(false);
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, []);

    useEffect(() => {
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 50);
        } else {
            setQuery("");
        }
    }, [open]);

    // Selection handler
    const handleSelect = useCallback((item: AtlasSearchResult) => {
        setFocusedEntity(item);

        // Sync legacy selectors for backward compatibility
        if (item.type === "node") {
            setSearchQuery(item.label);
            setFilteredNodes([item.label]);
            setFilteredCategories([]);
            setSelectedNode({ id: item.id, label: item.label, type: "domain" });
        } else if (item.type === "category") {
            const catLabel = CATEGORY_LABELS[item.category] || item.category;
            setSearchQuery(catLabel);
            const nodes = [...new Set(ALL_EVENTS.filter((e) => e.category === item.category).map((e) => e.label))];
            setFilteredNodes(nodes);
            setFilteredCategories([item.category]);
            setSelectedCategory(item.category);
        } else if (item.type === "journey") {
            const flowLabel = `${item.source} → ${item.target}`;
            setSearchQuery(flowLabel);
            setFilteredNodes([item.source, item.target]);
        } else if (item.type === "time") {
            setSearchQuery(item.value);
            let nodes = ALL_EVENTS;
            if (item.day) {
                const dow = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].indexOf(item.day);
                nodes = nodes.filter((e) => e.timestamp.getDay() === dow);
            }
            if (item.hours) {
                nodes = nodes.filter((e) => item.hours!.includes(e.timestamp.getHours()));
            }
            setFilteredNodes([...new Set(nodes.map((e) => e.label))]);
        }

        setOpen(false);
    }, [setFocusedEntity, setSearchQuery, setFilteredNodes, setFilteredCategories, setSelectedNode, setSelectedCategory]);

    // ── Dropdown Keyboard Navigation ──────────────────────────────────────────
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Escape") {
            e.preventDefault();
            setOpen(false);
            return;
        }

        const currentOptions = suggestions.length > 0 ? suggestions : null; // Quick suggestions aren't in `suggestions` state directly, but let's handle the primary suggestions first.
        
        if (!currentOptions || currentOptions.length === 0) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex((prev) => (prev + 1) % currentOptions.length);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((prev) => (prev - 1 + currentOptions.length) % currentOptions.length);
        } else if (e.key === "Enter") {
            e.preventDefault();
            handleSelect(currentOptions[activeIndex]);
        }
    };

    const getResultIcon = (item: AtlasSearchResult) => {
        const Icon = SCOPE_ICONS[item.type as keyof typeof SCOPE_ICONS] || LayoutDashboard;
        return Icon;
    };

    const getResultLabel = (item: AtlasSearchResult) => {
        if (item.type === "node") return item.label;
        if (item.type === "category") return CATEGORY_LABELS[item.category] || item.category;
        if (item.type === "journey") return `${item.source} → ${item.target}`;
        return item.value;
    };

    const getResultSub = (item: AtlasSearchResult) => {
        if (item.type === "node") {
            const ev = ALL_EVENTS.find((e) => e.label === item.label);
            return `${ev?.category ?? "domain"} · ${ALL_EVENTS.filter((e) => e.label === item.label).length} visits`;
        }
        if (item.type === "category") {
            const nodes = [...new Set(ALL_EVENTS.filter((e) => e.category === item.category).map((e) => e.label))];
            return `${nodes.length} sites · ${ALL_EVENTS.filter((e) => e.category === item.category).length} visits`;
        }
        if (item.type === "journey") {
            return `Sequence journey matching sessions`;
        }
        return `Time reference filter`;
    };

    const getResultColor = (item: AtlasSearchResult) => {
        if (item.type === "node") {
            const ev = ALL_EVENTS.find((e) => e.label === item.label);
            return ev ? CATEGORY_COLORS[ev.category] : "#a78bfa";
        }
        if (item.type === "category") {
            return CATEGORY_COLORS[item.category] || "#a78bfa";
        }
        if (item.type === "journey") {
            return "#22d3ee";
        }
        return "#34d399";
    };

    return (
        <>
            {/* Search trigger button */}
            <button
                onClick={() => setOpen(true)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl
                           border transition-all duration-200 backdrop-blur-xl relative
                           text-[12px]
                           ${focusedEntity
                               ? "border-accent/40 bg-accent/[0.08] text-accent shadow-[0_0_12px_rgba(139,92,246,0.15)]"
                               : "border-white/[0.10] bg-white/[0.04] text-label-tertiary hover:text-label-secondary hover:bg-white/[0.07] hover:border-white/[0.15]"
                           }`}
            >
                {/* Pulse dot when search is active */}
                {focusedEntity && (
                    <motion.span
                        className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-accent"
                        animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                )}
                <Search className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="hidden sm:block">
                    {focusedEntity ? getResultLabel(focusedEntity) : "Search Atlas..."}
                </span>
                <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded-md
                                bg-white/[0.06] border border-white/[0.10]
                                text-[10px] font-mono text-label-tertiary ml-1">
                    ⌘K
                </kbd>
            </button>

            {/* Command palette overlay */}
            <AnimatePresence>
                {open && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                            onClick={() => setOpen(false)}
                        />

                        {/* Panel */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: -12 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: -12 }}
                            transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
                            className="fixed top-[15%] left-1/2 -translate-x-1/2 z-50
                                       w-full max-w-[560px] mx-4
                                       rounded-[20px] border border-white/[0.12]
                                       bg-[rgba(8,8,16,0.94)] backdrop-blur-2xl
                                       shadow-[0_32px_80px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.06)]
                                       overflow-hidden"
                        >
                            {/* Input row */}
                            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.08]">
                                <Search className="w-4 h-4 text-label-tertiary flex-shrink-0" />
                                <input
                                    ref={inputRef}
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Search sites, journeys, categories, times (e.g. google -> github)..."
                                    className="flex-1 bg-transparent text-[14px] text-label placeholder:text-label-tertiary outline-none"
                                />
                                {query && (
                                    <button onClick={() => setQuery("")} className="text-label-tertiary hover:text-label transition-colors">
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                                <kbd className="px-1.5 py-0.5 rounded-md bg-white/[0.06] border border-white/[0.10] text-[10px] font-mono text-label-tertiary">
                                    ESC
                                </kbd>
                            </div>

                            {/* Search Scope Row */}
                            <div className="flex items-center gap-1.5 px-4 py-2 bg-white/[0.02] border-b border-white/[0.06]">
                                <span className="text-[10px] uppercase font-bold text-label-tertiary mr-1">Scope:</span>
                                {SCOPES.map((sc) => {
                                    const active = searchScope === sc.value;
                                    return (
                                        <button
                                            key={sc.value}
                                            onClick={() => setSearchScope(sc.value)}
                                            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition-all duration-150
                                                ${active
                                                    ? "bg-accent/15 border border-accent/35 text-accent"
                                                    : "bg-white/[0.04] border border-white/[0.06] text-label-tertiary hover:text-label-secondary"
                                                }`}
                                        >
                                            {sc.label}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Results */}
                            <div className="max-h-[360px] overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
                                {query && suggestions.length === 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.25, ease: "easeOut" }}
                                        className="px-4 py-10 flex flex-col items-center gap-3"
                                    >
                                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                                            style={{ background: "rgba(139,92,246,0.10)", border: "1px solid rgba(139,92,246,0.20)" }}>
                                            <Sparkles className="w-5 h-5" style={{ color: "#a78bfa" }} />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[13px] font-semibold text-label-secondary">No behavioral structures found</p>
                                            <p className="text-[11px] text-label-tertiary mt-1 opacity-70">Try a site, category, or flow</p>
                                        </div>
                                    </motion.div>
                                )}

                                {suggestions.length > 0 && (
                                    <div className="py-2">
                                        <p className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider"
                                            style={{ color: "rgba(255,255,255,0.28)" }}>
                                            Suggestions
                                        </p>
                                        {suggestions.map((r, index) => {
                                            const Icon = getResultIcon(r);
                                            const color = getResultColor(r);
                                            const active = index === activeIndex;
                                            return (
                                                <motion.div
                                                    key={`${r.type}-${index}`}
                                                    initial={{ opacity: 0, x: -6 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ duration: 0.18, delay: index * 0.04, ease: "easeOut" }}
                                                >
                                                    <button
                                                        onClick={() => handleSelect(r)}
                                                        onMouseEnter={() => setActiveIndex(index)}
                                                        className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors duration-100 text-left
                                                            ${active ? "bg-white/[0.07]" : "hover:bg-white/[0.03]"}`}
                                                    >
                                                        <div className="w-7 h-7 rounded-[8px] flex items-center justify-center flex-shrink-0"
                                                            style={{ backgroundColor: color + "22", border: `1px solid ${color}33` }}>
                                                            <Icon className="w-3.5 h-3.5" style={{ color: color }} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-[13px] font-medium text-label truncate">{getResultLabel(r)}</p>
                                                            <p className="text-[11px] truncate" style={{ color: "rgba(255,255,255,0.38)" }}>{getResultSub(r)}</p>
                                                        </div>
                                                        <ArrowRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: color + (active ? "99" : "33") }} />
                                                    </button>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="px-4 py-2.5 border-t border-white/[0.06] flex items-center justify-between">
                                <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>
                                    Search focuses entity across all modes
                                </p>
                                <div className="flex items-center gap-3 text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>
                                    <span>↑↓ navigate</span>
                                    <span>↵ select</span>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}

// ─── Filter chips ─────────────────────────────────────────────────────────────

export function FilterChips() {
    const searchQuery      = useSearchQuery();
    const focusedEntity    = useFocusedEntity();
    const { clearSearch, setSelectedNode, setSelectedCategory } = useModeActions();

    const handleRemove = () => {
        clearSearch();
        setSelectedNode(null);
        setSelectedCategory(null);
    };

    if (!focusedEntity && !searchQuery) return null;

    const label = focusedEntity
        ? (focusedEntity.type === "node"
            ? focusedEntity.label
            : focusedEntity.type === "category"
            ? CATEGORY_LABELS[focusedEntity.category] || focusedEntity.category
            : focusedEntity.type === "journey"
            ? `${focusedEntity.source} → ${focusedEntity.target}`
            : focusedEntity.value)
        : searchQuery;

    return (
        <div className="flex items-center gap-1.5 flex-wrap">
            <motion.div key={label}
                initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.88 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full
                           border border-accent/25 bg-accent/[0.10]
                           text-[11px] font-medium text-accent">
                <Search className="w-2.5 h-2.5 flex-shrink-0" />
                {label}
                <button onClick={handleRemove} className="hover:text-white transition-colors ml-0.5">
                    <X className="w-2.5 h-2.5" />
                </button>
            </motion.div>
        </div>
    );
}
