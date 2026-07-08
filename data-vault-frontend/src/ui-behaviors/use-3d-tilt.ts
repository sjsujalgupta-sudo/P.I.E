/*
 * 🎭 Analogy: This file is the "Gyroscope" — when you move your
 *   mouse over a card, it tilts the card slightly toward your
 *   cursor, like a physical object responding to touch.
 * ✅ Safe to change:
 *    1. The default `intensity` value (15) — raise it for more dramatic tilt, lower for subtler effect
 *    2. The `enabled` parameter — pass `false` to disable tilt on specific cards
 *    3. The return shape — add `scale` if you want zoom-on-hover
 * ❌ Never touch: The function name `use3DTilt` — it's imported by name in
 *   multiple dashboard components. Renaming breaks them.
 */

/**
 * ============================================================
 * FILE: use-3d-tilt.ts
 * ANALOGY: This file is the "Gyroscope" — when you move your
 *   mouse over a card, it tilts the card slightly toward your
 *   cursor, like a physical object responding to touch.
 * ============================================================
 *
 * ✅ SAFE TO CHANGE:
 *   1. The default `intensity` value (15) — raise it for more
 *      dramatic tilt, lower it for subtler effect
 *   2. The `enabled` parameter — pass `false` to disable tilt
 *      on specific cards
 *   3. The return shape — add `scale` if you want zoom-on-hover
 *
 * ❌ NEVER TOUCH:
 *   The function name `use3DTilt` — it's imported by name in
 *   multiple dashboard components. Renaming breaks them.
 * ============================================================
 */

"use client";

import { useState, useEffect, useCallback, type RefObject } from "react";

export function use3DTilt(
    elementRef: RefObject<HTMLDivElement | null>,
    intensity: number = 15,
    enabled: boolean = true
) {
    const [transform, setTransform] = useState({ rotateX: 0, rotateY: 0 });

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!elementRef.current || !enabled) return;
        const rect    = elementRef.current.getBoundingClientRect();
        const deltaX  = (e.clientX - (rect.left + rect.width  / 2)) / (rect.width  / 2);
        const deltaY  = (e.clientY - (rect.top  + rect.height / 2)) / (rect.height / 2);
        setTransform({ rotateX: -deltaY * intensity, rotateY: deltaX * intensity });
    }, [elementRef, intensity, enabled]);

    const handleMouseLeave = useCallback(() => {
        setTransform({ rotateX: 0, rotateY: 0 });
    }, []);

    useEffect(() => {
        const el = elementRef.current;
        if (!el || !enabled) return;
        el.addEventListener("mousemove",  handleMouseMove);
        el.addEventListener("mouseleave", handleMouseLeave);
        return () => {
            el.removeEventListener("mousemove",  handleMouseMove);
            el.removeEventListener("mouseleave", handleMouseLeave);
        };
    }, [elementRef, handleMouseMove, handleMouseLeave, enabled]);

    return transform;
}
