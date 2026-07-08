/*
 * 🎭 Analogy: This file is the "Swiss Army Knife" — one tiny
 *   tool (cn) that merges CSS class names safely so styles
 *   don't conflict with each other.
 * ✅ Safe to change:
 *    1. Nothing — this file is intentionally minimal
 *    2. You can add other tiny utility functions below cn()
 *    3. Add a `formatDate()` helper here if you need one
 * ❌ Never touch: The `cn` function — it's imported in 50+ components.
 *   Renaming or removing it breaks all styling across the app.
 */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
