# ExplorationCanvas

Self-contained dashboard layout with mode-based navigation.

## Structure

```
ExplorationCanvas
├── TopBar          → App title + current mode indicator
├── CanvasSidebar   → Vertical mode switcher (5 modes)
├── MainView        → Content area (mode-specific placeholders)
└── BottomDock      → Collapsible mini insights panel
```

## Modes

| Mode       | Icon          | Color   | Purpose                                    |
|------------|---------------|---------|--------------------------------------------|
| Overview   | LayoutDashboard | Accent  | High-level summary                         |
| Journey    | Route         | Cyan    | User flows, Sankey, path analysis          |
| Time       | Clock         | Emerald | Temporal patterns, time-series             |
| Structure  | Network       | Violet  | Hierarchy, network graphs, node-link       |
| Insights   | Lightbulb     | Amber   | AI-driven pattern analysis                 |

## State Management

Uses global Zustand store (`src/lib/store/modeStore.ts`):

```ts
import { useMode, useSetMode, useSelectedNode } from "@/lib/store/modeStore";

const mode = useMode();
const setMode = useSetMode();
const selectedNode = useSelectedNode();
```

## Styling

- Matches existing liquid glass design system
- Uses CSS variables from `globals.css`
- Framer Motion for smooth transitions
- Responsive (mobile-friendly sidebar collapses to icons)

## Next Steps

Replace placeholder content in `MainView.tsx` with:
- Overview: stats cards, quick charts
- Journey: Sankey diagram, flow visualization
- Time: timeline, trend charts
- Structure: network graph, hierarchy tree
- Insights: AI recommendations, pattern cards
