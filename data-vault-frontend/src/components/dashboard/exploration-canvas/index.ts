/*
 * 🎭 Analogy: This is the "Barrel Export" — a single door that lets you
 *    import the entire ExplorationCanvas system with one line instead of
 *    hunting for the exact file path.
 * ✅ Safe to change:
 *    1. Add new exports as new components are created
 *    2. Add named exports alongside the default
 *    3. Add a comment explaining what each export does
 * ❌ Never touch: The ExplorationCanvas export name — the atlas page and
 *    any other consumer imports this exact name.
 */
export { TopBar }           from "./TopBar";
export { CanvasSidebar }    from "./CanvasSidebar";
export { MainView }         from "./MainView";
export { BottomDock }       from "./BottomDock";
