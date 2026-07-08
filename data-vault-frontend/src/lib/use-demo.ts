/*
 * 🎭 Analogy: This file is the "Demo Mode Switch" — it's a
 *   single on/off toggle that tells the app whether to show
 *   demo data or real user data.
 * ✅ Safe to change:
 *    1. Return `true` to force demo mode for testing
 *    2. Add logic to read from localStorage or a URL param
 *    3. Add a `setIsDemo` setter if you need to toggle at runtime
 * ❌ Never touch: The function name `useIsDemo` — it's imported
 *   by pages that need to conditionally hide real data.
 */

"use client";

/**
 * Hook to detect if the current user is the demo account.
 * Demo account should show no data, allowing backend testing.
 */
export function useIsDemo(): boolean {
    return false;
}
