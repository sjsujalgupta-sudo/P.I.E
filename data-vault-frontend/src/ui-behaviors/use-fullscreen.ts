/*
 * 🎭 Analogy: This file is the "Theater Manager" — it handles
 *   the curtain (fullscreen toggle) for a specific section
 *   of the screen, expanding it to fill the whole display.
 * ✅ Safe to change:
 *    1. The keyboard shortcut used to trigger fullscreen
 *    2. The `onEnter` / `onExit` callback hooks
 *    3. The element ref type if you target a different HTML element
 * ❌ Never touch: The function name `useFullscreen` — imported by
 *   name in the Atlas and dashboard layouts. Renaming breaks them.
 */

/**
 * ============================================================
 * FILE: use-fullscreen.ts
 * ANALOGY: This file is the "Theater Manager" — it handles
 *   the curtain (fullscreen toggle) for a specific section
 *   of the stage, not the whole theater.
 * ============================================================
 *
 * ✅ SAFE TO CHANGE:
 *   1. Add keyboard shortcut support (e.g., press F to toggle)
 *   2. Add an `onEnter` / `onExit` callback parameter
 *   3. Extend browser support by adding `mozRequestFullscreen`
 *
 * ❌ NEVER TOUCH:
 *   The function name `useFullscreen` and its return shape
 *   `{ isFullscreen, toggleFullscreen }` — the History page
 *   and tree-of-thought components import these exact names.
 * ============================================================
 */

"use client";

import { useCallback, useEffect, useState, type RefObject } from "react";

type FsElement = HTMLElement & { webkitRequestFullscreen?: () => void };

function requestFs(el: HTMLElement) {
    const e = el as FsElement;
    if (typeof e.requestFullscreen === "function")        return e.requestFullscreen();
    if (typeof e.webkitRequestFullscreen === "function") { e.webkitRequestFullscreen(); return Promise.resolve(); }
    return Promise.reject(new Error("Fullscreen not supported"));
}

function exitFs() {
    if (typeof document.exitFullscreen === "function") return document.exitFullscreen();
    const d = document as Document & { webkitExitFullscreen?: () => void };
    if (typeof d.webkitExitFullscreen === "function") { void d.webkitExitFullscreen(); return Promise.resolve(); }
    return Promise.reject(new Error("Exit fullscreen not supported"));
}

export function useFullscreen(containerRef: RefObject<HTMLElement | null>) {
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const sync = () => {
            const doc  = document as Document & { webkitFullscreenElement?: Element | null };
            const fsEl = document.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
            setIsFullscreen(!!fsEl && fsEl === containerRef.current);
        };
        document.addEventListener("fullscreenchange",       sync);
        document.addEventListener("webkitfullscreenchange", sync as EventListener);
        return () => {
            document.removeEventListener("fullscreenchange",       sync);
            document.removeEventListener("webkitfullscreenchange", sync as EventListener);
        };
    }, [containerRef]);

    const toggleFullscreen = useCallback(() => {
        const el  = containerRef.current;
        if (!el) return;
        const doc  = document as Document & { webkitFullscreenElement?: Element | null };
        const fsEl = document.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
        void (fsEl ? exitFs() : requestFs(el)).catch(() => {});
    }, [containerRef]);

    return { isFullscreen, toggleFullscreen };
}
