/*
 * 🎭 Analogy: This file is the "Pond Surface" — when you click
 *   a button, it creates a ripple that spreads outward from
 *   the click point, like a stone dropped in water.
 * ✅ Safe to change:
 *    1. The ripple duration (how long it takes to fade)
 *    2. The ripple color or opacity values
 *    3. The max ripple size relative to the element
 * ❌ Never touch: The function name `useRipple` — imported by
 *   name in button components. Renaming breaks all ripple effects.
 */

/**
 * ============================================================
 * FILE: use-ripple.ts
 * ANALOGY: This file is the "Pond Surface" — when you click
 *   a button, it creates a ripple that spreads outward from
 *   the exact point you clicked, just like dropping a stone.
 * ============================================================
 *
 * ✅ SAFE TO CHANGE:
 *   1. The timeout (600ms) — increase for a slower ripple,
 *      decrease for a snappier one
 *   2. The ripple shape — currently circular; you could make
 *      it square by changing the CSS in the component
 *   3. Add a `color` parameter to support colored ripples
 *
 * ❌ NEVER TOUCH:
 *   The return shape `{ ripples, handleRippleClick }` — the
 *   dashboard card components destructure these exact names.
 * ============================================================
 */

"use client";

import { useState, useCallback } from "react";

export function useRipple() {
    const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);

    const handleRippleClick = useCallback((e: React.MouseEvent<HTMLElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const id   = Date.now();
        setRipples(prev => [...prev, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
        setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 600);
    }, []);

    return { ripples, handleRippleClick };
}
