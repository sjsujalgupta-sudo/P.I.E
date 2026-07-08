/*
 * 🎭 Analogy: This is the "Forwarding Address Card" for hooks — the real
 *    interactive behaviors moved to src/ui-behaviors/ but this file tells
 *    old callers (use3DTilt, useCursorGlow, useRipple) where to find them.
 * ✅ Safe to change: Nothing — this file only re-exports.
 * ❌ Never touch / Never delete: Dashboard components import from
 *    "@/lib/hooks". Deleting this shim breaks card tilt and ripple effects.
 */

export { use3DTilt }    from "@/ui-behaviors/use-3d-tilt";
export { useCursorGlow } from "@/ui-behaviors/use-cursor-glow";
export { useRipple }    from "@/ui-behaviors/use-ripple";
