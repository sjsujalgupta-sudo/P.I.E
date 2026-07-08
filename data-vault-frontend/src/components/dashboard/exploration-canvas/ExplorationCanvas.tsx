/*
 * 🎭 Analogy: This is the "Front Door" of the Atlas system — it assembles
 *    the TopBar, ContextHeader, MainView, and BottomDock into one building.
 * ✅ Safe to change:
 *    1. Add a new wrapper div around MainView for extra padding/styling
 *    2. Remove BottomDock if you don't want the bottom panel
 *    3. Add a loading spinner between TopBar and MainView
 * ❌ Never touch: The flex-col + h-full structure — removing it collapses
 *    the entire canvas to zero height and nothing renders.
 */
"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { TopBar }        from "./TopBar";
import { MainView }      from "./MainView";
import { BottomDock }    from "./BottomDock";
import { ContextHeader } from "./ContextHeader";
import { SearchContextPanel } from "./SearchContextPanel";
import { ContextPanel }       from "./heatmap/ContextPanel";
import { TimelinePanel }      from "./sankey/TimelinePanel";
import { useSetMode, useMode, useIsSearchActive, type DashboardMode } from "@/lib/store/modeStore";
import { useFullscreen } from "@/ui-behaviors/use-fullscreen";

/**
 * ExplorationCanvas — full-width layout.
 * Mode navigation moved to TopBar (horizontal tabs).
 * Dynamic side panel wraps the main layout.
 */
export function ExplorationCanvas() {
    const searchParams = useSearchParams();
    const setMode = useSetMode();
    const mode = useMode();
    const isSearchActive = useIsSearchActive();
    const containerRef = useRef<HTMLDivElement>(null);
    const { isFullscreen, toggleFullscreen } = useFullscreen(containerRef);

    useEffect(() => {
        const m = searchParams.get("mode") as DashboardMode;
        if (["overview", "journey", "time", "stream", "structure", "insights"].includes(m)) {
            setMode(m);
        }
    }, [searchParams, setMode]);

    return (
        <div ref={containerRef} className="flex flex-col w-full h-full overflow-hidden bg-white/[0.015] backdrop-blur-2xl">
            <TopBar isFullscreen={isFullscreen} toggleFullscreen={toggleFullscreen} />
            <ContextHeader />
            
            {/* Split layout between Canvas view and Unified Sidebar */}
            <div className="flex-1 overflow-hidden min-h-0 flex flex-row relative">
                <div className="flex-1 min-w-0 h-full relative">
                    <MainView />
                </div>
                
                {/* Right panel logic: Search takes priority, then fallback to mode sidebars */}
                {isSearchActive ? (
                    <SearchContextPanel />
                ) : mode === "time" ? (
                    <ContextPanel />
                ) : mode === "journey" ? (
                    <TimelinePanel />
                ) : null}
            </div>
            
            <BottomDock />
        </div>
    );
}
