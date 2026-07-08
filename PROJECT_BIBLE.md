# 📖 PROJECT BIBLE
**DataVault + Atlas — Complete Beginner's Guide**
*Last updated after Step 1 cleanup. All paths reflect the current structure.*

---

## ONE-CLICK LAUNCHER AND SHARING

### What was added

| File | Location | Purpose |
|---|---|---|
| `DataVault-OneClick.exe` | `D:\Personal-Data-Vault-Projects\DataVault-OneClick.exe` | Double-click this to run the whole project. |
| `DataVault-OneClick.cmd` | `D:\Personal-Data-Vault-Projects\DataVault-OneClick.cmd` | Backup launcher if Windows blocks the EXE. |
| `Create-Share-Package.cmd` | `D:\Personal-Data-Vault-Projects\Create-Share-Package.cmd` | Creates a smaller zip for sharing with friends. |
| Launcher source | `tools/one-click-launcher/` | Source code used to build the EXE. |

### How to run the project with one click

1. Double-click `DataVault-OneClick.exe`.
2. One launcher window opens and starts the backend/frontend in the background.
3. The browser opens at `http://localhost:3000`.
4. Keep the launcher window open while using the app.
5. To stop the app, type `Q` in the launcher window and press Enter.

If Windows blocks the EXE, double-click `DataVault-OneClick.cmd` instead. The CMD fallback opens two visible command windows: `DataVault Backend - Port 4000` and `DataVault Frontend - Port 3000`.

### What the launcher does

- Checks that `node` and `npm` exist.
- Starts `knowledge-vault-backend` with `npm run start`.
- Starts `data-vault-frontend` with `npm run dev`.
- If `node_modules` is missing in either folder, it runs `npm install` first.
- Opens the frontend in the browser.
- Writes runtime logs to `backend-launch.log` and `frontend-launch.log`.

### Sharing with friends

Your friends need the full project folder, not just the EXE. The EXE is a launcher; it does not contain all source code and dependencies inside itself.

Recommended sharing flow:

1. Double-click `Create-Share-Package.cmd`.
2. It creates `DataVault-Share-Package.zip` in the D drive project root.
3. Send that zip to your friend.
4. Your friend extracts the zip.
5. Your friend installs Node.js LTS from `https://nodejs.org`.
6. Your friend double-clicks `DataVault-OneClick.exe`.

The first launch on a friend's machine may take longer because dependencies are installed automatically.

### Important ports

| Service | Port | URL |
|---|---:|---|
| Frontend | 3000 | `http://localhost:3000` |
| Backend | 4000 | `http://localhost:4000` |

If either port is already being used, close the other app using that port before launching DataVault.

---

## 🧒 PART 1 — ELI5 OVERVIEW ("Explain Like I'm 5")

### What is DataVault?

Imagine you have a **magic notebook** that watches every website you visit and writes down what you were interested in. It remembers:
- "You visited GitHub 12 times this week — you must like coding tools"
- "You read a lot about AI on Tuesday evenings"
- "You searched for 'React hooks' 5 times — that's a topic you care about"

**DataVault** is that magic notebook. It has two parts:

| Part | What it does | Real-world analogy |
|---|---|---|
| **The Vault** | Stores everything you've browsed | A filing cabinet |
| **The Dashboard** | Shows you charts about your habits | A report card |

### What is Atlas?

**Atlas** is the *explorer's map* built on top of the Vault. Instead of boring charts, it shows your browsing habits as a **living, navigable universe**:

- **Overview** = A star map of all your sites and how they connect
- **Journey** = The paths you travel between sites (Google → GitHub → Stack Overflow)
- **Time** = A heatmap showing *when* you're most active
- **Patterns** = A flowing river showing how your attention shifts over time
- **Structure** = A galaxy map of your behavioral territories

Think of it like this: **DataVault is the library. Atlas is the map of the library.**

---

## 📁 PART 2 — CURRENT FOLDER STRUCTURE

```
data-vault-frontend/
│
├── src/
│   ├── app/                          🗺️  PAGES (what users see in the browser)
│   │   ├── (app)/                    ← All logged-in pages live here
│   │   │   ├── atlas/page.tsx        ← The Atlas exploration system (/atlas)
│   │   │   ├── dashboard/page.tsx    ← The standard dashboard (/dashboard)
│   │   │   ├── history/page.tsx      ← Browsing history (/history)
│   │   │   ├── vault/page.tsx        ← The data vault (/vault)
│   │   │   ├── insights/page.tsx     ← Insights charts (/insights)
│   │   │   └── settings/page.tsx     ← Settings (/settings)
│   │   └── api/                      ← Backend API routes (proxy)
│   │
│   ├── components/                   🧩  BUILDING BLOCKS (reusable UI pieces)
│   │   ├── dashboard/
│   │   │   └── exploration-canvas/   ← THE ATLAS ENGINE (all 6 modes live here)
│   │   │       ├── TopBar.tsx        ← The top navigation bar with mode tabs
│   │   │       ├── ExplorationCanvas.tsx ← The main container
│   │   │       ├── AtlasSearch.tsx   ← CMD+K search system
│   │   │       ├── ContextHeader.tsx ← The "Exploring: YouTube" banner
│   │   │       ├── BottomDock.tsx    ← The collapsible bottom panel
│   │   │       ├── MainView.tsx      ← Routes to the right mode component
│   │   │       ├── network/          ← Overview mode (star map)
│   │   │       ├── sankey/           ← Journey mode (flow diagrams)
│   │   │       ├── heatmap/          ← Time mode (activity grid)
│   │   │       ├── stream/           ← Patterns mode (flowing streams)
│   │   │       ├── structure/        ← Structure mode (territory map)
│   │   │       ├── data/             ← All mock/session data
│   │   │       └── utils/journey/    ← Data pipeline utilities
│   │   ├── layout/
│   │   │   └── sidebar.tsx           ← The left navigation sidebar
│   │   └── ui/                       ← Tiny reusable UI atoms (buttons, cards)
│   │
│   ├── lib/                          🔧  HELPER TOOLS
│   │   ├── chart-intelligence/       ← NEW: Split chart recommender (3 files)
│   │   │   ├── chart-types.ts        ← All chart type names + catalog
│   │   │   ├── chart-scorer.ts       ← The scoring algorithm
│   │   │   └── chart-recommender.ts  ← The main builder function
│   │   ├── chart-recommender.ts      ← Shim: forwards to chart-intelligence/
│   │   ├── store/modeStore.ts        ← Global state (selected node, mode, search)
│   │   ├── api.ts                    ← All backend API calls
│   │   ├── hooks.ts                  ← Shim: forwards to ui-behaviors/
│   │   ├── utils.ts                  ← The `cn()` CSS helper
│   │   └── history-timeline.ts       ← Time window filtering for History page
│   │
│   └── ui-behaviors/                 🎮  NEW: Interactive behaviors (was src/hooks/)
│       ├── use-3d-tilt.ts            ← Card tilt on mouse hover
│       ├── use-cursor-glow.ts        ← Cursor glow position tracker
│       ├── use-ripple.ts             ← Click ripple effect
│       └── use-fullscreen.ts         ← Fullscreen toggle
```

---

## 🗺️ PART 3 — THE "WHERE IS IT?" TABLE

> **How to use this table:** Find what you want to change in Column A, open the file in Column B, search for the keyword in Column C.

| What I want to change | Exact file | Keyword / line to find | What breaks if I mess this up |
|---|---|---|---|
| The color of the Atlas mode tabs | `src/components/dashboard/exploration-canvas/TopBar.tsx` | `activeColor:` | Mode tabs lose their colors |
| Add a new Atlas mode (e.g., "Memory") | `src/lib/store/modeStore.ts` + `TopBar.tsx` + `MainView.tsx` | `DashboardMode` type | New mode won't appear or route |
| Change the Atlas branding name | `src/components/dashboard/exploration-canvas/TopBar.tsx` | `Atlas` (line ~55) | Just cosmetic |
| Add a new site to a Structure district | `src/components/dashboard/exploration-canvas/structure/StructureGraph.tsx` | `ORBITAL_CONFIG` | Structure map won't show the new site |
| Change the heatmap color scale | `src/components/dashboard/exploration-canvas/heatmap/TimeHeatmap.tsx` | `activityColor` function | Heatmap colors change |
| Add a new chart type | `src/lib/chart-intelligence/chart-types.ts` | `ChartKind` union | New chart won't be recognized |
| Change chart scoring (which chart appears most) | `src/lib/chart-intelligence/chart-scorer.ts` | `baseline scores` comment | Different charts get recommended |
| Change the sidebar navigation links | `src/components/layout/sidebar.tsx` | `NAV_SECTIONS` | Sidebar links change |
| Add Atlas to the sidebar | Already done — `src/components/layout/sidebar.tsx` | `{ href: "/atlas"` | — |
| Change the CMD+K search suggestions | `src/components/dashboard/exploration-canvas/AtlasSearch.tsx` | `Quick access` comment | Search suggestions change |
| Change the Journey mode Sankey colors | `src/components/dashboard/exploration-canvas/sankey/SankeyFlow.tsx` | `nodeColor` function | Sankey node colors change |
| Change the Patterns stream colors | `src/components/dashboard/exploration-canvas/stream/stream-data.ts` | `CATEGORY_COLORS` | All stream colors change |
| Change the Structure district positions | `src/components/dashboard/exploration-canvas/structure/StructureGraph.tsx` | `DISTRICT_POSITIONS` | Districts move on the map |
| Change the global state (selected node etc.) | `src/lib/store/modeStore.ts` | `INITIAL_STATE` | App starts in a different state |
| Change the card tilt intensity | `src/ui-behaviors/use-3d-tilt.ts` | `intensity: number = 15` | Cards tilt more or less |
| Change the ripple animation speed | `src/ui-behaviors/use-ripple.ts` | `setTimeout(..., 600)` | Ripple disappears faster/slower |
| Change the dashboard KPI cards | `src/app/(app)/dashboard/page.tsx` | `KPI cards` comment | Dashboard numbers change |
| Change the Atlas page route | `src/app/(app)/atlas/page.tsx` | Rename the folder | URL changes to match folder name |
| Change the bottom dock content | `src/components/dashboard/exploration-canvas/BottomDock.tsx` | `Widget` components | Bottom panel content changes |
| Change the context header text | `src/components/dashboard/exploration-canvas/ContextHeader.tsx` | `Exploring:` | Banner text changes |
| Change the mock browsing data | `src/components/dashboard/exploration-canvas/data/mockBrowsingEvents.ts` | `SITES` array | All Atlas visualizations use different data |

---

## 🤖 PART 4 — THE AI COPY-PASTE PROTOCOL

### The Template

When asking another AI (Gemini, GPT, Claude) to write code for this project, **always include this block** at the top of your request:

```
PROJECT CONTEXT:
- Framework: Next.js 16 (App Router), React 19, TypeScript
- Styling: Tailwind CSS v4 with custom CSS variables (see globals.css)
- State: Zustand store at src/lib/store/modeStore.ts
- Path alias: @/ = src/ (e.g., import from "@/lib/api")
- UI style: Dark glassmorphism — use bg-white/[0.05], backdrop-blur-xl, border-white/[0.08]
- Animation: Framer Motion for all transitions
- The main exploration system is at: src/components/dashboard/exploration-canvas/

TASK: [describe what you want]

PASTE LOCATION: [tell the AI exactly where the code goes, using the anchor comments below]
```

### Anchor Comments Already in the Code

These comments mark safe "paste zones" in key files:

| File | Anchor comment to search for | What to paste there |
|---|---|---|
| `MainView.tsx` | `mode === "structure" ?` | Add a new mode render condition |
| `modeStore.ts` | `// Actions` | Add a new store action |
| `TopBar.tsx` | `MODES` array | Add a new mode tab |
| `sidebar.tsx` | `NAV_SECTIONS` | Add a new sidebar link |
| `AtlasSearch.tsx` | `// Nodes` in results | Add a new search category |
| `chart-types.ts` | `ChartKind` union | Add a new chart type name |
| `chart-scorer.ts` | `// Bonus points` comment | Add a new scoring rule |
| `StructureGraph.tsx` | `ORBITAL_CONFIG` | Add nodes to a district |
| `stream-data.ts` | `CLUSTER_DEFS` | Add a new behavioral cluster |

### Example AI Request

```
PROJECT CONTEXT:
- Framework: Next.js 16 (App Router), React 19, TypeScript
- Styling: Tailwind CSS v4, dark glassmorphism
- State: Zustand at src/lib/store/modeStore.ts
- Path alias: @/ = src/

TASK: Add a "Memory" mode to the Atlas sidebar that shows a simple
placeholder page with the text "Memory Mode — Coming Soon".

PASTE LOCATION:
1. Add "memory" to the DashboardMode type in modeStore.ts
2. Add a new entry to the MODES array in TopBar.tsx
3. Add a new condition in MainView.tsx after mode === "structure"
4. Add MODE_META entry in TopBar.tsx for the new mode

Please write only the code snippets for each location, not the full files.
```

---

## ⚠️ PART 5 — THE DANGER ZONE

> These files are the **engine room**. A beginner should read them but never edit them without understanding the full impact.

### 🔴 ABSOLUTE OFF-LIMITS (Never touch)

| File | Why it's dangerous | What breaks |
|---|---|---|
| `src/app/(app)/layout.tsx` | Controls the entire app shell (sidebar + main area). One wrong class breaks every page layout. | Every page in the app |
| `src/app/layout.tsx` | Root HTML layout. Changing this affects fonts, metadata, and global providers. | The entire app |
| `src/app/globals.css` | All CSS variables (colors, glass effects, typography). Every component reads from here. | All visual styling |
| `src/lib/store/modeStore.ts` | The brain of Atlas. All 6 modes share state through this file. | All cross-mode navigation |
| `src/app/api/proxy/[...path]/route.ts` | The security proxy between frontend and backend. Removing it exposes the backend directly. | All API calls |
| `tailwind.config.js` | Tailwind configuration. Wrong changes break all utility classes. | All styling |
| `tsconfig.json` | TypeScript path aliases (`@/`). Changing `paths` breaks every import in the project. | Every file import |
| `next.config.ts` | Next.js build configuration. Wrong changes prevent the app from building. | The entire build |

### 🟡 HANDLE WITH CARE (Edit only if you know what you're doing)

| File | Why it needs care | Safe change | Unsafe change |
|---|---|---|---|
| `src/lib/api.ts` | All backend communication | Add a new fetch function | Change `requestProxy` or `API_PROXY_BASE` |
| `src/components/layout/sidebar.tsx` | Global navigation | Add a new link to `NAV_SECTIONS` | Change the collapse logic or CSS classes |
| `src/lib/chart-intelligence/chart-scorer.ts` | Chart recommendation algorithm | Adjust baseline scores | Change function signatures |
| `src/components/dashboard/exploration-canvas/data/mockBrowsingEvents.ts` | All Atlas data | Add new sites to `SITES` array | Change the `BrowsingEvent` type shape |
| `src/components/dashboard/exploration-canvas/utils/journey/buildSankeyData.ts` | Sankey DAG safety | Nothing | Removing the cycle-detection logic crashes the Sankey |

### 🟢 SAFE TO FREELY EDIT

| File | What you can safely do |
|---|---|
| `src/app/(app)/dashboard/page.tsx` | Change KPI numbers, add new cards, edit the Atlas CTA |
| `src/lib/chart-intelligence/chart-types.ts` | Add new chart types, edit descriptions |
| `src/components/dashboard/exploration-canvas/structure/StructureGraph.tsx` | Edit `DISTRICT_POSITIONS`, `ORBITAL_CONFIG`, district colors |
| `src/components/dashboard/exploration-canvas/stream/stream-data.ts` | Edit `CLUSTER_DEFS`, category colors, insight text |
| `src/components/dashboard/exploration-canvas/AtlasSearch.tsx` | Edit quick-access suggestions, search result text |
| `src/ui-behaviors/use-3d-tilt.ts` | Change tilt intensity |
| `src/ui-behaviors/use-ripple.ts` | Change ripple duration |
| All `*/mock-data.ts` files | Change test/demo data freely |

---

## 🔄 PART 6 — WHAT WAS CHANGED IN THE CLEANUP

### Files Created (New)

| New file | Replaced / split from | Purpose |
|---|---|---|
| `src/lib/chart-intelligence/chart-types.ts` | `src/lib/chart-recommender.ts` (350 lines) | Just the type definitions and catalog |
| `src/lib/chart-intelligence/chart-scorer.ts` | `src/lib/chart-recommender.ts` | Just the scoring algorithm |
| `src/lib/chart-intelligence/chart-recommender.ts` | `src/lib/chart-recommender.ts` | Just the builder functions |
| `src/ui-behaviors/use-3d-tilt.ts` | `src/lib/hooks.ts` | Card tilt behavior |
| `src/ui-behaviors/use-cursor-glow.ts` | `src/lib/hooks.ts` | Cursor glow tracker |
| `src/ui-behaviors/use-ripple.ts` | `src/lib/hooks.ts` | Click ripple effect |
| `src/ui-behaviors/use-fullscreen.ts` | `src/hooks/use-fullscreen.ts` | Fullscreen toggle |

### Shims Created (Backward Compatibility — Do Not Delete)

| Shim file | What it does |
|---|---|
| `src/lib/chart-recommender.ts` | Re-exports from `chart-intelligence/` so old imports still work |
| `src/lib/hooks.ts` | Re-exports from `ui-behaviors/` so old imports still work |
| `src/hooks/use-fullscreen.ts` | Re-exports from `ui-behaviors/` so old imports still work |

### Files with Noob Headers Added

Every file touched during cleanup now has a header with:
- 🎭 **Analogy** — what the file does in plain English
- ✅ **3 safe changes** — things a beginner can edit
- ❌ **1 warning** — the one thing that must never be touched

---

## 📊 PART 7 — QUICK STATS

| Metric | Before cleanup | After cleanup |
|---|---|---|
| Largest file (chart-recommender.ts) | 350 lines | Split into 3 files, max 120 lines each |
| Hook files location | `src/lib/hooks.ts` + `src/hooks/` (mixed) | `src/ui-behaviors/` (one place) |
| Files with Noob Headers | 0 | 12+ |
| Broken imports after cleanup | — | 0 (shims preserve all old paths) |
| New routes | — | `/atlas` (standalone exploration system) |

---

*This bible was generated after the Step 1 cleanup. Update it whenever you add a new mode, route, or major component.*
