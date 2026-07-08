/*
 * 🎭 Analogy: This file is the "Spotlight Operator" — it tracks
 *   exactly where your mouse is on stage so the spotlight
 *   follows your cursor with a glowing halo effect.
 * ✅ Safe to change:
 *    1. The glow color or size values inside the hook
 *    2. The `enabled` flag — pass false to turn off the glow
 *    3. The CSS variable names if you rename them in globals.css
 * ❌ Never touch: The function name `useCursorGlow` — imported by
 *   name in multiple components. Renaming breaks them.
 */

/**
 * ============================================================
 * FILE: use-cursor-glow.ts
 * ANALOGY: This file is the "Spotlight Operator" — it tracks
 *   exactly where your mouse is on stage so the spotlight
 *   (glow effect) follows it perfectly.
 * ============================================================
 *
 * ✅ SAFE TO CHANGE:
 *   1. The `enabled` default — set to `false` to turn off the
 *      glow effect site-wide
 *   2. Add throttling (e.g., every 16ms) if performance suffers
 *      on low-end devices
 *   3. Return `{ x, y, isMoving }` if you want to animate
 *      the glow fading when the mouse stops
 *
 * ❌ NEVER TOUCH:
 *   The function name `useCursorGlow` — the CursorGlow UI
 *   component imports this exact name.
 * ============================================================
 */

"use client";

import { useState, useEffect } from "react";

export function useCursorGlow(enabled: boolean = true) {
    const [position, setPosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        if (!enabled) return;
        const handler = (e: MouseEvent) => setPosition({ x: e.clientX, y: e.clientY });
        window.addEventListener("mousemove", handler);
        return () => window.removeEventListener("mousemove", handler);
    }, [enabled]);

    return position;
}
