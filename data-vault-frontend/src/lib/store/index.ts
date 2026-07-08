/*
 * 🎭 Analogy: This is the "Store Barrel" — a single door that re-exports
 *    everything from modeStore so you can import with "@/lib/store" instead
 *    of the full path.
 * ✅ Safe to change: Add new exports as new stores are created.
 * ❌ Never touch: The export * line — removing it breaks any component
 *    that imports from "@/lib/store" (without /modeStore).
 */
