/*
 * 🎭 Analogy: This is the "Forwarding Address Card" for useFullscreen —
 *    the real file moved to src/ui-behaviors/use-fullscreen.ts but this
 *    shim keeps the old import path working.
 * ✅ Safe to change: Nothing — this file only re-exports.
 * ❌ Never touch / Never delete: The History page imports useFullscreen
 *    from this exact path. Deleting it breaks the fullscreen button.
 */

export { useFullscreen } from "@/ui-behaviors/use-fullscreen";
