/*
 * 🎭 Analogy: This is the "Shared Whiteboard" — every mode in Atlas reads
 *    from and writes to this one board. When you click YouTube in Overview,
 *    it writes "selectedNode = YouTube" here, and Journey instantly reads it.
 * ✅ Safe to change:
 *    1. Add a new state field (e.g., hoveredNode) to ModeState and INITIAL_STATE
 *    2. Change the DEFAULT_TIME_RANGE preset from "7d" to "30d"
 *    3. Add a new selector hook at the bottom (e.g., useHoveredNode)
 * ❌ Never touch: The DashboardMode type union — every mode tab, route, and
 *    component checks against this exact list. Adding a typo here crashes
 *    the entire Atlas navigation system.
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";

// ─── Types ────────────────────────────────────────────────────────────────────

export type DashboardMode = "overview" | "journey" | "time" | "stream" | "structure" | "insights";

export type SelectedNode = {
    id: string;
    label: string;
    type: "domain" | "page" | "category";
};

export type TimeRange = {
    preset: "7d" | "30d" | "90d" | "all" | "custom";
    custom?: {
        from: Date;
        to: Date;
    };
};

export type SiteCategory = "search" | "social" | "dev" | "productivity" | "content";

// ─── Helper ───────────────────────────────────────────────────────────────────

/** True when the range is a custom heatmap/cell selection (not a preset window) */
export const isCustomRange = (range: TimeRange): range is TimeRange & { custom: { from: Date; to: Date } } =>
    range.preset === "custom" && range.custom !== undefined;

/** True when any exploration context is active */
export const hasExplorationContext = (state: { selectedNode: SelectedNode | null; timeRange: TimeRange }): boolean =>
    !!state.selectedNode || state.timeRange.preset === "custom";

export type SearchScope = "all" | "node" | "category" | "journey" | "time";

export type AtlasSearchResult =
    | { type: "node"; id: string; label: string }
    | { type: "category"; category: SiteCategory }
    | { type: "journey"; source: string; target: string }
    | { type: "time"; value: string; hours?: number[]; day?: string };

// ─── State & Actions ──────────────────────────────────────────────────────────

type ModeState = {
    // Core navigation
    mode: DashboardMode;

    // Exploration context — shared across ALL modes
    selectedNode:     SelectedNode | null;
    timeRange:        TimeRange;
    selectedCategory: SiteCategory | null;
    sourceMode:       DashboardMode | null;

    // Global search / filter state
    searchQuery:        string;
    searchScope:        SearchScope;
    focusedEntity:      AtlasSearchResult | null;
    searchResults:      AtlasSearchResult[];
    isSearchActive:     boolean;
    filteredNodes:      string[];       // node labels matching search
    filteredCategories: SiteCategory[]; // categories matching search

    // Actions
    setMode: (mode: DashboardMode, source?: DashboardMode) => void;
    setSelectedNode: (node: SelectedNode | null) => void;
    setTimeRange: (range: TimeRange) => void;
    setSelectedCategory: (cat: SiteCategory | null) => void;
    setSearchQuery: (q: string) => void;
    setSearchScope: (scope: SearchScope) => void;
    setFocusedEntity: (entity: AtlasSearchResult | null) => void;
    setSearchResults: (results: AtlasSearchResult[]) => void;
    setFilteredNodes: (nodes: string[]) => void;
    setFilteredCategories: (cats: SiteCategory[]) => void;
    clearSearch: () => void;
    resetNode: () => void;
    resetTimeRange: () => void;
    clearExploration: () => void;
    reset: () => void;
};

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_TIME_RANGE: TimeRange = { preset: "7d" };

const INITIAL_STATE = {
    mode:               "overview" as DashboardMode,
    selectedNode:       null,
    timeRange:          DEFAULT_TIME_RANGE,
    selectedCategory:   null,
    sourceMode:         null,
    searchQuery:        "",
    searchScope:        "all" as SearchScope,
    focusedEntity:      null as AtlasSearchResult | null,
    searchResults:      [] as AtlasSearchResult[],
    isSearchActive:     false,
    filteredNodes:      [] as string[],
    filteredCategories: [] as SiteCategory[],
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useModeStore = create<ModeState>()(
    devtools(
        (set) => ({
            ...INITIAL_STATE,

            setMode: (mode, source) =>
                set((s) => ({ mode, sourceMode: source ?? s.mode }), false, "setMode"),

            setSelectedNode: (node) =>
                set({ selectedNode: node }, false, "setSelectedNode"),

            setTimeRange: (range) =>
                set({ timeRange: range }, false, "setTimeRange"),

            setSelectedCategory: (cat) =>
                set({ selectedCategory: cat }, false, "setSelectedCategory"),

            setSearchQuery: (q) =>
                set({ searchQuery: q }, false, "setSearchQuery"),

            setSearchScope: (scope) =>
                set({ searchScope: scope }, false, "setSearchScope"),

            setFocusedEntity: (entity) =>
                set({ focusedEntity: entity, isSearchActive: entity !== null }, false, "setFocusedEntity"),

            setSearchResults: (results) =>
                set({ searchResults: results }, false, "setSearchResults"),

            setFilteredNodes: (nodes) =>
                set({ filteredNodes: nodes }, false, "setFilteredNodes"),

            setFilteredCategories: (cats) =>
                set({ filteredCategories: cats }, false, "setFilteredCategories"),

            clearSearch: () =>
                set({
                    searchQuery: "",
                    searchScope: "all",
                    focusedEntity: null,
                    searchResults: [],
                    isSearchActive: false,
                    filteredNodes: [],
                    filteredCategories: []
                }, false, "clearSearch"),

            resetNode: () =>
                set({ selectedNode: null }, false, "resetNode"),

            resetTimeRange: () =>
                set({ timeRange: DEFAULT_TIME_RANGE }, false, "resetTimeRange"),

            clearExploration: () =>
                set({
                    selectedNode:       null,
                    timeRange:          DEFAULT_TIME_RANGE,
                    selectedCategory:   null,
                    searchQuery:        "",
                    searchScope:        "all",
                    focusedEntity:      null,
                    searchResults:      [],
                    isSearchActive:     false,
                    filteredNodes:      [],
                    filteredCategories: [],
                }, false, "clearExploration"),

            reset: () =>
                set(INITIAL_STATE, false, "reset"),
        }),
        { name: "ModeStore" }
    )
);

// ─── Selector Hooks ───────────────────────────────────────────────────────────
// Fine-grained selectors prevent unnecessary re-renders — components only
// re-render when the specific slice they care about changes.

/** Current dashboard mode */
export const useMode = () => useModeStore((s) => s.mode);

/** setMode action */
export const useSetMode = () => useModeStore((s) => s.setMode);

/** Currently selected node (null if none) */
export const useSelectedNode = () => useModeStore((s) => s.selectedNode);

/** setSelectedNode action */
export const useSetSelectedNode = () => useModeStore((s) => s.setSelectedNode);

/** Active time range */
export const useTimeRange = () => useModeStore((s) => s.timeRange);

/** setTimeRange action */
export const useSetTimeRange = () => useModeStore((s) => s.setTimeRange);

/** All actions bundled — useful when a component needs multiple actions */
export const useModeActions = () =>
    useModeStore((s) => ({
        setMode: s.setMode,
        setSelectedNode: s.setSelectedNode,
        setTimeRange: s.setTimeRange,
        setSelectedCategory: s.setSelectedCategory,
        setSearchQuery: s.setSearchQuery,
        setSearchScope: s.setSearchScope,
        setFocusedEntity: s.setFocusedEntity,
        setSearchResults: s.setSearchResults,
        setFilteredNodes: s.setFilteredNodes,
        setFilteredCategories: s.setFilteredCategories,
        clearSearch: s.clearSearch,
        resetNode: s.resetNode,
        resetTimeRange: s.resetTimeRange,
        clearExploration: s.clearExploration,
        reset: s.reset,
    }));

/** Source mode — which mode the user navigated from */
export const useSourceMode = () => useModeStore((s) => s.sourceMode);

/** Selected category filter */
export const useSelectedCategory = () => useModeStore((s) => s.selectedCategory);

/** Global search query */
export const useSearchQuery = () => useModeStore((s) => s.searchQuery);

/** Search scope */
export const useSearchScope = () => useModeStore((s) => s.searchScope);

/** Focused Entity */
export const useFocusedEntity = () => useModeStore((s) => s.focusedEntity);

/** Search Results */
export const useSearchResults = () => useModeStore((s) => s.searchResults);

/** Is Search Active */
export const useIsSearchActive = () => useModeStore((s) => s.isSearchActive);

/** Filtered node labels from search */
export const useFilteredNodes = () => useModeStore((s) => s.filteredNodes);

/** Filtered categories from search */
export const useFilteredCategories = () => useModeStore((s) => s.filteredCategories);

/** True when any exploration context is active */
export const useHasContext = () => useModeStore((s) =>
    !!s.selectedNode || s.timeRange.preset === "custom" || !!s.searchQuery || !!s.focusedEntity
);
