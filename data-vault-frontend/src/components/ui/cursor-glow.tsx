/*
 * 🎭 Analogy: This is the "Flashlight" — it follows your mouse cursor
 *    around the screen and shines a soft glow wherever you point, making
 *    the dark UI feel alive and responsive to your presence.
 * ✅ Safe to change:
 *    1. Change the glow size (w-96 h-96) for a bigger or smaller spotlight
 *    2. Change the glow color (currently accent/10) for a different tint
 *    3. Change the blur amount (blur-3xl) for a sharper or softer glow
 * ❌ Never touch: The fixed positioning and pointer-events-none — removing
 *    these makes the glow block clicks on everything underneath it.
 */
"use client";

import { useMemo } from "react";
import { useCursorGlow } from "@/lib/hooks";

export function CursorGlow() {
    const position = useCursorGlow(true);

    const style = useMemo(
        () => ({
            left: position.x,
            top: position.y,
        }),
        [position.x, position.y]
    );

    return (
        <div
            aria-hidden="true"
            className="pointer-events-none fixed left-0 top-0 z-50 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/15 blur-3xl opacity-80 transition-all duration-200"
            style={style}
        />
    );
}
