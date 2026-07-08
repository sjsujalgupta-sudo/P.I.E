# Complete Workspace Analysis: DataVault Project
**Analyzed: May 7, 2026 | 163 total files | 2 major sub-projects**

---

## 1. FILE INVENTORY WITH LINE COUNTS

### Frontend (data-vault-frontend) - ~3,500+ lines of source code

#### Configuration & Setup Files
| File | Approx. Lines | Purpose |
|------|---------------|---------|
| `package.json` | 40 | Dependencies: React 19, Next 16, D3, Recharts, Zustand |
| `tsconfig.json` | 25 | TypeScript configuration |
| `tailwind.config.js` | 30 | Tailwind CSS theming |
| `eslint.config.mjs` | 15 | Linting rules |
| `next.config.ts` | 10 | Next.js configuration |

#### Large/Core Files (>100 lines each) - **LARGE FILES**
| File | Est. Lines | Purpose |
|------|-----------|---------|
| `src/lib/chart-recommender.ts` | **350+** | AI-driven chart recommendation engine, data analysis |
| `src/lib/mock-data.ts` | **400+** | Mock session, contract, and analytics data |
| `src/components/dashboard/exploration-canvas/sankey/SankeyFlow.tsx` | **250+** | Interactive Sankey flow visualization with D3 |
| `src/components/dashboard/exploration-canvas/ExplorationCanvas.tsx` | **200+** | Main canvas orchestrator (TopBar, MainView, BottomDock) |
| `src/components/dashboard/exploration-canvas/network/NetworkGraph.tsx` | **180+** | Force-directed graph visualization |
| `src/components/dashboard/exploration-canvas/structure/StructureGraph.tsx` | **150+** | Tree structure visualization |
| `src/components/dashboard/tableau-chart-showcase.tsx` | **120+** | Multi-chart dashboard component |
| `src/lib/hooks.ts` | **100+** | Custom hooks: use3DTilt, useCursorGlow, useRipple |
| `src/app/layout.tsx` | **80+** | Root layout with providers |
| `src/lib/api.ts` | **200+** | API client, type definitions (VaultRow, Analytics) |

#### Medium Files (50-100 lines)
| File | Purpose |
|------|---------|
| `src/components/layout/navbar.tsx` | Navigation bar component |
| `src/components/layout/sidebar.tsx` | Sidebar navigation |
| `src/components/providers/theme-provider.tsx` | Dark/light theme context |
| `src/components/dashboard/mode-controls.tsx` | UI mode switching |
| `src/components/dashboard/exploration-canvas/BottomDock.tsx` | Bottom controls UI |
| `src/app/(app)/dashboard/page.tsx` | Main dashboard page |
| `src/app/(app)/vault/page.tsx` | Data vault display page |
| `src/app/(app)/history/page.tsx` | Browsing history visualization |

#### Small Utility Files (<50 lines)
- `src/lib/utils.ts` (7 lines) - cn() classname utility
- `src/lib/use-demo.ts` (10 lines) - Demo mode hook
- `src/lib/store/modeStore.ts` (25 lines) - Zustand store
- `src/hooks/use-fullscreen.ts` (60 lines) - Fullscreen API hook

#### Page Routes (~10 pages)
```
src/app/(app)/
├── dashboard/page.tsx (30 lines)
├── vault/page.tsx (40 lines)
├── history/page.tsx (60+ lines)
├── atlas/page.tsx (15 lines)
├── insights/page.tsx (25 lines)
├── contracts/page.tsx (35 lines)
├── profile/page.tsx (30 lines)
├── settings/page.tsx (25 lines)
├── surfing-analytics/page.tsx (25 lines)
├── logs/page.tsx (30 lines)
├── deposit/page.tsx (25 lines)
└── assistant/page.tsx (20 lines)
```

#### UI Components (15+ files)
- `glass-card.tsx` (40 lines) - Glass-morphism card
- `glass-select.tsx` (60+ lines) - Custom select dropdown
- `cursor-glow.tsx` (35 lines) - Cursor effect animation
- `background-blobs.tsx` (50 lines) - Animated background blobs

---

### Backend (knowledge-vault-backend) - ~1,200+ lines of JavaScript

#### Configuration Files
| File | Approx. Lines | Purpose |
|------|---------------|---------|
| `package.json` | 35 | Dependencies: Express, SQLite, transformers.js, csv-writer |
| `.env.example` | 5 | Environment template |

#### Core Server & Database (>100 lines) - **LARGE FILES**
| File | Est. Lines | Purpose |
|------|-----------|---------|
| `server/main-server.js` | **400+** | Express server, API endpoints, data categorization |
| `database/database-manager.js` | **150+** | SQLite schema, initialization, database operations |
| `ai-processing/ai-embeddings-manager.js` | **80+** | AI embeddings initialization & vector generation |

#### Browser Extension
| File | Est. Lines | Purpose |
|------|-----------|---------|
| `browser-extension/background-scripts/background-service.js` | **200+** | Extension coordinator, session management |
| `browser-extension/background-scripts/session-manager.js` | **100+** | Session tracking and storage |
| `browser-extension/content-scripts/page-monitor.js` | **150+** | Page monitoring, search detection, data extraction |
| `browser-extension/popup-interface/popup-controller.js` | **80+** | Popup UI logic |
| `browser-extension/popup-ui/popup-controller.js` | **80+** | Alternative popup implementation |
| `browser-extension/manifest.json` | 20 | Extension manifest (v3) |
| `browser-extension/popup-interface/session-control.html` | 30 | HTML popup |
| `browser-extension/popup-ui/popup-interface.html` | 25 | HTML popup UI |
| `browser-extension/extension-manifest.json` | 10 | Extension metadata |

#### AI & Data Processing
| File | Est. Lines | Purpose |
|------|-----------|---------|
| `ai-processing/embeddings-generator.js` | **80+** | Vector embedding creation for semantic search |
| `check-db.js` | 40 | Database inspection utility |

#### Web Dashboard
| File | Est. Lines | Purpose |
|------|-----------|---------|
| `web-dashboard/analytics-dashboard.html` | 50 | Standalone HTML dashboard |

---

### Documentation Files (5 files, ~200 lines total)
| File | Purpose |
|------|---------|
| `README.md` | Project overview |
| `QUICK_START.md` | Quick setup guide |
| `PROJECT_DOCUMENTATION.md` | Comprehensive docs |
| `IMPLEMENTATION_GUIDE.md` | Implementation details |
| `IMPLEMENTATION_SUMMARY.md` | Implementation summary |
| `FLOW_DIAGRAMS.md` | System flow diagrams |
| `HOME_PAGE_COMPARISON.md` | UI comparison notes |

### Ancillary Files
| Folder | Count | Purpose |
|--------|-------|---------|
| `extension img/` | 15 images | Screenshots of extension UI |
| `project c img/` | 6 images | Chat/design mockups |
| `manual code/` | 8 files | Reference implementations |

---

## 2. FOLDER STRUCTURE WITH COMPLETE MAPPING

```
d:\Personal-Data-Vault-Projects/                          [Root Project]
│
├── 📁 data-vault-frontend/                               [Next.js Frontend App]
│   │
│   ├── 📁 src/
│   │   ├── 📁 app/                                       [Next.js App Router]
│   │   │   ├── 📁 (app)/                                 [Route Group - Main Layout]
│   │   │   │   ├── 📁 dashboard/     → data exploration
│   │   │   │   ├── 📁 vault/         → browsing data vault
│   │   │   │   ├── 📁 history/       → timeline playback
│   │   │   │   ├── 📁 atlas/         → fullscreen explorer
│   │   │   │   ├── 📁 insights/      → AI-generated insights
│   │   │   │   ├── 📁 contracts/     → data contracts (monetization)
│   │   │   │   ├── 📁 profile/       → user profile
│   │   │   │   ├── 📁 settings/      → app settings
│   │   │   │   ├── 📁 logs/          → activity logs
│   │   │   │   ├── 📁 assistant/     → AI assistant
│   │   │   │   ├── 📁 surfing-analytics/  → analytics dashboard
│   │   │   │   ├── 📁 deposit/       → data deposit/upload
│   │   │   │   ├── error.tsx         → error boundary
│   │   │   │   └── layout.tsx        → app layout wrapper
│   │   │   │
│   │   │   ├── 📁 api/                                  [API Routes]
│   │   │   │   ├── 📁 proxy/[...path]/   → Backend proxy
│   │   │   │   └── 📁 settings/      → Settings API
│   │   │   │
│   │   │   ├── layout.tsx            → Root layout
│   │   │   ├── page.tsx              → Root page (redirects)
│   │   │   ├── providers.tsx         → Context providers
│   │   │   ├── global-error.tsx      → Global error handler
│   │   │   └── globals.css           → Global styles
│   │   │
│   │   ├── 📁 components/            [React Components]
│   │   │   ├── 📁 dashboard/         → Dashboard-specific components
│   │   │   │   ├── mode-controls.tsx          → UI mode switcher
│   │   │   │   ├── metadata-insights-charts.tsx → Data visualization
│   │   │   │   ├── tableau-chart-showcase.tsx  → Chart gallery
│   │   │   │   │
│   │   │   │   ├── 📁 tree-of-thought/  [Consciousness Map Visualization]
│   │   │   │   │   ├── consciousness-map.tsx    → Thought hierarchy
│   │   │   │   │   ├── tree-of-thought-dag.tsx  → DAG visualization
│   │   │   │   │   ├── detail-panel.tsx         → Node detail view
│   │   │   │   │   ├── hierarchy-layout.ts      → Layout algorithm
│   │   │   │   │   └── mock-data.ts             → Test data
│   │   │   │   │
│   │   │   │   └── 📁 exploration-canvas/  [Main Data Visualization Engine]
│   │   │   │       ├── ExplorationCanvas.tsx    → Main container
│   │   │   │       ├── MainView.tsx             → Central visualization
│   │   │   │       ├── TopBar.tsx               → Mode navigation
│   │   │   │       ├── BottomDock.tsx           → Control panel
│   │   │   │       ├── ContextHeader.tsx        → Info header
│   │   │   │       ├── CanvasSidebar.tsx        → Side controls
│   │   │   │       ├── AtlasSearch.tsx          → Search UI
│   │   │   │       ├── README.md                → Component docs
│   │   │   │       │
│   │   │   │       ├── 📁 sankey/          [User Journey Flows]
│   │   │   │       │   ├── SankeyFlow.tsx       → D3 Sankey visualization
│   │   │   │       │   ├── TimelinePanel.tsx    → Timeline controls
│   │   │   │       │   ├── JourneyView.tsx      → Journey mode
│   │   │   │       │   ├── LoopView.tsx         → Loop detection view
│   │   │   │       │   ├── timeline-data.ts     → Timeline data builder
│   │   │   │       │   └── mock-data.ts         → Test data
│   │   │   │       │
│   │   │   │       ├── 📁 network/         [Force-Graph Visualization]
│   │   │   │       │   ├── NetworkGraph.tsx     → 2D/3D network
│   │   │   │       │   └── mock-data.ts         → Test data
│   │   │   │       │
│   │   │   │       ├── 📁 heatmap/         [Temporal Heatmaps]
│   │   │   │       │   ├── TimeHeatmap.tsx      → Time-based heatmap
│   │   │   │       │   ├── ContextPanel.tsx     → Context information
│   │   │   │       │   └── mock-data.ts         → Test data
│   │   │   │       │
│   │   │   │       ├── 📁 structure/       [Hierarchical Structures]
│   │   │   │       │   ├── StructureGraph.tsx   → Tree visualization
│   │   │   │       │   └── structure-data.ts    → Data formatting
│   │   │   │       │
│   │   │   │       ├── 📁 stream/          [Data Streams]
│   │   │   │       │   ├── StreamGraph.tsx      → Stream visualization
│   │   │   │       │   └── stream-data.ts       → Stream data
│   │   │   │       │
│   │   │   │       ├── 📁 data/            [Mock Data]
│   │   │   │       │   ├── mockBrowsingEvents.ts   → Event data
│   │   │   │       │   └── session-data.ts        → Session data
│   │   │   │       │
│   │   │   │       ├── 📁 utils/           [Utilities]
│   │   │   │       │   └── 📁 journey/
│   │   │   │       │       ├── filterEvents.ts
│   │   │   │       │       ├── buildSessions.ts
│   │   │   │       │       ├── buildSankeyData.ts
│   │   │   │       │       └── buildLoopGraphData.ts
│   │   │   │       │
│   │   │   │       └── 📁 index.ts         → Component exports
│   │   │   │
│   │   │   ├── 📁 layout/             → Layout components
│   │   │   │   ├── navbar.tsx          → Top navigation
│   │   │   │   ├── sidebar.tsx         → Side navigation
│   │   │   │   └── page-transition.tsx → Animation wrapper
│   │   │   │
│   │   │   ├── 📁 providers/          → Context providers
│   │   │   │   ├── theme-provider.tsx  → Dark/light mode
│   │   │   │   └── auth-provider.tsx   → Auth context
│   │   │   │
│   │   │   ├── 📁 ui/                 → Reusable UI Components
│   │   │   │   ├── glass-card.tsx      → Glass-morphism card
│   │   │   │   ├── glass-select.tsx    → Custom dropdown
│   │   │   │   ├── background-blobs.tsx → Animated background
│   │   │   │   └── cursor-glow.tsx     → Cursor effect
│   │   │   │
│   │   │   └── 📁 surfing-analytics/
│   │   │       └── surfing-dashboard.tsx → Surfing stats dashboard
│   │   │
│   │   ├── 📁 lib/                   [Utilities & Logic]
│   │   │   ├── api.ts                → API client & types
│   │   │   ├── chart-recommender.ts  → Chart recommendation AI
│   │   │   ├── history-timeline.ts   → Timeline utilities
│   │   │   ├── hooks.ts              → Custom hooks
│   │   │   ├── utils.ts              → Helper functions
│   │   │   ├── use-demo.ts           → Demo mode hook
│   │   │   ├── mock-data.ts          → Mock dataset (400+ lines)
│   │   │   ├── mock-surfing-data.ts  → Surfing stats data
│   │   │   │
│   │   │   └── 📁 store/             → State Management (Zustand)
│   │   │       ├── index.ts          → Store exports
│   │   │       └── modeStore.ts      → Mode/UI state
│   │   │
│   │   ├── 📁 hooks/                 [Custom React Hooks]
│   │   │   └── use-fullscreen.ts     → Fullscreen API hook
│   │   │
│   │   └── 📁 public/                [Static Assets]
│   │       ├── next.svg
│   │       ├── vercel.svg
│   │       ├── window.svg
│   │       ├── file.svg
│   │       └── globe.svg
│   │
│   ├── 📁 data/
│   │   └── settings.json             → Frontend settings
│   │
│   ├── 📁 public/                    → Static files
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── next.config.ts
│   ├── package.json
│   ├── eslint.config.mjs
│   ├── .prettierrc
│   ├── .gitignore
│   └── README.md
│
├── 📁 knowledge-vault-backend/       [Node.js Backend Server]
│   │
│   ├── 📁 server/                   [Express.js Server]
│   │   └── main-server.js           → Core API (400+ lines)
│   │                                 - /api/start-session
│   │                                 - /api/end-session
│   │                                 - /api/vault-data
│   │                                 - /api/analytics
│   │                                 - /api/export-csv
│   │                                 - /api/export-pdf
│   │
│   ├── 📁 database/                 [Data Persistence]
│   │   └── database-manager.js      → SQLite initialization (150+ lines)
│   │                                 - browsing_data table
│   │                                 - sessions table
│   │                                 - concept_graph table
│   │                                 - settings table
│   │
│   ├── 📁 ai-processing/            [AI & Embeddings]
│   │   ├── ai-embeddings-manager.js → Embeddings init (80+ lines)
│   │   └── embeddings-generator.js  → Vector generation (80+ lines)
│   │
│   ├── 📁 browser-extension/        [Chrome Extension]
│   │   │
│   │   ├── 📁 background-scripts/   [Service Workers]
│   │   │   ├── background-service.js      → Extension coordinator (200+ lines)
│   │   │   │                              - Session management
│   │   │   │                              - Data forwarding
│   │   │   │                              - Settings sync
│   │   │   └── session-manager.js         → Session tracking (100+ lines)
│   │   │
│   │   ├── 📁 content-scripts/      [Page Injection]
│   │   │   └── page-monitor.js             → Page monitoring (150+ lines)
│   │   │                                   - Search detection
│   │   │                                   - Page analysis
│   │   │                                   - Data extraction
│   │   │
│   │   ├── 📁 popup-interface/      [Popup v1]
│   │   │   ├── popup-controller.js  → Logic (80+ lines)
│   │   │   └── session-control.html → HTML UI
│   │   │
│   │   ├── 📁 popup-ui/             [Popup v2]
│   │   │   ├── popup-controller.js  → Logic (80+ lines)
│   │   │   └── popup-interface.html → HTML UI
│   │   │
│   │   ├── manifest.json            → Chrome Extension Manifest v3
│   │   └── extension-manifest.json  → Extension metadata
│   │
│   ├── 📁 web-dashboard/            [Standalone Dashboard]
│   │   └── analytics-dashboard.html → Analytics UI (50+ lines)
│   │
│   ├── vault.db                     → SQLite database (production)
│   ├── package.json                 → Dependencies
│   ├── .env.example                 → Environment template
│   ├── check-db.js                  → Utility: inspect DB
│   └── README.md
│
├── 📁 manual code/                  [Reference Code Samples]
│   ├── layout.tsx
│   ├── page.tsx
│   ├── providers.tsx
│   ├── middleware.ts
│   ├── route.ts
│   ├── Sidebar.tsx
│   ├── INTEGRATION.md
│   └── .env.example
│
├── 📁 extension img/                [UI Screenshots - 15 images]
├── 📁 project c img/                [Design Mockups - 6 images]
│
└── 📁 Documentation
    ├── README.md
    ├── QUICK_START.md
    ├── QUICKSTART.md
    ├── PROJECT_DOCUMENTATION.md
    ├── IMPLEMENTATION_GUIDE.md
    ├── IMPLEMENTATION_SUMMARY.md
    ├── HOME_PAGE_COMPARISON.md
    ├── FLOW_DIAGRAMS.md
    └── WORKSPACE_ANALYSIS.md (this file)
```

---

## 3. IMPORT DEPENDENCIES ANALYSIS

### Frontend Key Files - Import Patterns

#### Core API/Types (`src/lib/api.ts` - 200+ lines)
```typescript
// External
import { ApiError } - custom error class
export type SensitivityLevel = "low" | "medium" | "high"
export type VaultRow = { id, session_id, domain, url, title, ... }
export type AnalyticsResponse = { intervals, total, ... }
export type AnalyticsItem = { label, value }
// Functions
export function startSession() - → /api/proxy/start-session
export function fetchVaultData() - → /api/proxy/vault-data
export function fetchAnalytics() - → /api/proxy/analytics
export function deleteVaultEntry() - → /api/proxy/delete-entry
export function clearVault() - → /api/proxy/clear-vault
export function getExportCsvUrl() - → /api/proxy/export-csv
export function getExportPdfUrl() - → /api/proxy/export-pdf
```

#### Chart Recommender (`src/lib/chart-recommender.ts` - 350+ lines)
```typescript
// Imports
import type { AnalyticsItem, VaultRow } from "@/lib/api"

// Exports
export type ChartKind = 
  | "bar" | "line" | "area" | "pie" | "scatter" 
  | "heatmap" | "treemap" | "sunburst" | "radar" | "funnel"

export function recommendBestChart(data, isTimeSeries)
export function recommendTopCharts(data, isTimeSeries, n = 3)
export function diversifySeriesCharts(series)
export function buildMetadataSeries(input)

// Internal functions:
- analyzeData() → calculates variance, distribution
- scoreChartTypes() → ML-like scoring
- buildSessionTrend() → time-series builder
- buildSensitivityDistribution() → category analysis
- buildHourlyPulse() → temporal patterns
- buildDomainFootprint() → domain frequency
```

#### Exploration Canvas (`src/components/dashboard/exploration-canvas/ExplorationCanvas.tsx`)
```typescript
// Imports
import { TopBar } from "./TopBar"
import { MainView } from "./MainView"
import { BottomDock } from "./BottomDock"
import { ContextHeader } from "./ContextHeader"

// Structure: Layout orchestrator for viz modes
<TopBar />           # Mode navigation
<ContextHeader />    # Info display
<MainView />         # Active visualization (MainView switches modes)
<BottomDock />       # Control panel
```

#### Sankey Flow (`src/components/dashboard/exploration-canvas/sankey/SankeyFlow.tsx` - 250+ lines)
```typescript
// Imports
import { sankey, sankeyLinkHorizontal, sankeyJustify } from "d3-sankey"
import { motion, AnimatePresence } from "framer-motion"
import { useSelectedNode, useSetSelectedNode, useTimeRange, useModeActions } 
  from "@/lib/store/modeStore"
import { ALL_EVENTS, CATEGORY_COLORS } from "../data/mockBrowsingEvents"
import { filterEventsByTimeRange } from "../utils/journey/filterEvents"
import { buildSessions } from "../utils/journey/buildSessions"
import { buildSankeyData } from "../utils/journey/buildSankeyData"

// Handles user journey visualization with D3
```

#### Layout Files (`src/app/layout.tsx` - 80+ lines)
```typescript
// Imports
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { Providers } from "./providers"
import { Toaster } from "sonner"
import { BackgroundBlobs } from "@/components/ui/background-blobs"

// Composition:
<Providers>
  <ThemeProvider>
    <BackgroundBlobs />
    {children}
    <Toaster />  # Toast notifications
</Providers>
```

#### Store (`src/lib/store/modeStore.ts` - Zustand state)
```typescript
// Zustand hooks:
useSelectedNode() → current selected node
useSetSelectedNode() → setter
useTimeRange() → time filter
useModeActions() → actions dispatcher
useSelectedCategory() → category filter
```

### Backend Dependencies Analysis

#### Main Server (`server/main-server.js` - 400+ lines)
```javascript
// Imports
import express from "express"
import cors from "cors"
import fetch from "node-fetch"
import { initDB } from "../database/database-manager.js"
import { v4 as uuidv4 } from "uuid"
import { createObjectCsvStringifier } from "csv-writer"
import PDFDocument from "pdfkit"
import dotenv from "dotenv"

// Endpoints
POST /api/start-session → creates session
POST /api/end-session → closes session
GET /api/vault-data → fetches all browsing data
GET /api/session/{id} → gets specific session
GET /api/analytics → summarizes data
GET /api/export-csv → CSV export
GET /api/export-pdf → PDF export
POST /api/delete-entry → removes entry
POST /api/clear-vault → clears all data
```

#### Database Manager (`database/database-manager.js` - 150+ lines)
```javascript
// Imports
import sqlite3 from "sqlite3"
import { open } from "sqlite"

// Tables
browsing_data: id, session_id, domain, url, title, keywords, summary, 
              interests, tools, topics, sensitivity_level, embedding, 
              timestamp, created_at
sessions: id, started_at, ended_at, exported
concept_graph: concept, frequency, related_concepts
settings: key, value
```

#### Background Service (`browser-extension/background-scripts/background-service.js` - 200+ lines)
```javascript
// Functions
getSession() → reads from chrome.storage
saveSession(sessionId, isActive) → writes to chrome.storage
getSettings() → fetches from /api/settings
startSession() → creates new session
stopSession() → ends current session
forwardPageData(data) → sends to backend

// Communication
content-scripts → background-service → main-server.js
```

#### Page Monitor (`browser-extension/content-scripts/page-monitor.js` - 150+ lines)
```javascript
// Features
attachSearchInputListeners() → detects search queries
capturePageData() → extracts page content
monitorPageChanges() → detects URL changes (SPA)
sendDataToBackground() → reports data

// Data captured
- Page title, keywords
- URL, domain
- Search queries
- Timestamp
```

---

## 4. BACKEND STRUCTURE ANALYSIS

### Module Breakdown

#### A. Server Module (`server/`)
**Purpose**: REST API for data management and synchronization

**Endpoints** (from main-server.js):
- `POST /api/start-session` - Initialize data collection session
- `POST /api/end-session` - End session and lock data
- `GET /api/vault-data` - Retrieve all browsing data
- `GET /api/session/:sessionId` - Get specific session
- `GET /api/analytics` - Get summarized analytics
- `POST /api/delete-entry/:id` - Delete single entry
- `POST /api/clear-vault` - Clear all data
- `GET /api/export-csv` - Export session as CSV
- `GET /api/export-pdf` - Export session as PDF
- `GET /api/export-profile` - Export user profile

**Tech Stack**: Express.js, Node.js ES modules

**Responsibility**: 
- Route requests from browser extension
- Coordinate database operations
- Generate exports (CSV, PDF)
- Manage sessions and data lifecycle

---

#### B. Database Module (`database/`)
**Purpose**: Local SQLite database for persistent data storage

**Tables**:
1. **browsing_data** - Individual page visits
   - Stores URL, title, keywords, extracted metadata
   - AI categorization: interests, tools, topics
   - Sensitivity level (low/medium/high)
   - Embedding vector (for semantic search)
   - Timestamp

2. **sessions** - Data collection sessions
   - Session lifecycle tracking
   - Export status

3. **concept_graph** - Knowledge graph
   - Concept frequency
   - Relationships between concepts

4. **settings** - User configuration
   - App preferences

**Tech Stack**: SQLite3, sqlite npm package

**Responsibility**:
- Schema creation and migration
- CRUD operations on vault data
- Query optimization

---

#### C. AI Processing Module (`ai-processing/`)
**Purpose**: Semantic search and data understanding through embeddings

**Components**:
1. **ai-embeddings-manager.js**
   - Initializes embedding model (Xenova/all-MiniLM-L6-v2)
   - Lazy-loads model on first use
   - Exports `getEmbedder()` function

2. **embeddings-generator.js**
   - Creates vector embeddings from text
   - Runs locally (no API calls, privacy-first)
   - Uses transformer.js for NLP

**Tech Stack**: @xenova/transformers

**Responsibility**:
- Convert text → vector representation
- Enable semantic (meaning-based) search
- No external API calls (local processing)

---

#### D. Browser Extension Module (`browser-extension/`)
**Purpose**: Data collection client - captures browsing activity

**Architecture**:
```
Manifest v3 (Chrome 88+)
│
├── background-scripts/
│   ├── background-service.js
│   │   └── Coordinates extension lifecycle
│   │   └── Manages session state
│   │   └── Routes data to server
│   │
│   └── session-manager.js
│       └── Session persistence
│       └── Storage API interface
│
├── content-scripts/
│   └── page-monitor.js
│       └── Injects into every page
│       └── Detects search queries
│       └── Extracts page metadata
│       └── Monitors user activity
│
└── popup-interface/ + popup-ui/
    ├── popup-controller.js (x2 versions)
    │   └── UI logic and state
    │
    └── *.html
        └── Popup UI markup
```

**Data Flow**:
```
User browses web
    ↓
content-scripts/page-monitor.js detects activity
    ↓
Extracts: URL, title, keywords, search queries
    ↓
Sends to background-scripts/background-service.js
    ↓
background-service forwards to main-server.js (localhost:4000)
    ↓
Server categorizes and stores in SQLite
```

**Responsibility**:
- Monitor active tab and page changes
- Extract structured data from pages
- Detect search queries in real-time
- Communicate with backend server
- Persist session state locally

**Tech Stack**: Chrome Extension API, ES modules

---

#### E. Web Dashboard Module (`web-dashboard/`)
**Purpose**: Standalone analytics dashboard (alternative UI)

**File**: `analytics-dashboard.html` (50+ lines)

**Features**:
- Displays browsing analytics
- Chart visualizations
- Data export options

---

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        USER'S BROWSER                        │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │        Chrome Browser + Extension                     │   │
│  │                                                        │   │
│  │  1. User visits webpage                              │   │
│  │  2. content-scripts/page-monitor.js captures data    │   │
│  │  3. Detects search queries                           │   │
│  │  4. Sends to background-scripts/background-service  │   │
│  │  5. Session state persisted                          │   │
│  │  6. Data forwarded to localhost:4000                 │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ↓                                    │
│                   HTTP POST /api/...                         │
│                                                               │
└─────────────────────────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────────────────────────┐
│              Backend Server (localhost:4000)                 │
│                                                               │
│  knowledge-vault-backend/server/main-server.js              │
│  ├─ Receives browsing data                                  │
│  ├─ Categorizes with AI (interests, tools, topics)          │
│  ├─ Calls ai-processing/embeddings-generator.js             │
│  │  (converts text to semantic vectors)                      │
│  ├─ Stores in database/database-manager.js                  │
│  └─ Provides query endpoints for frontend                   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────────────────────────┐
│            SQLite Database (vault.db)                        │
│                                                               │
│  ├─ browsing_data (URLs, titles, metadata, embeddings)      │
│  ├─ sessions (session tracking)                             │
│  ├─ concept_graph (knowledge graph)                         │
│  └─ settings (user preferences)                             │
│                                                               │
└─────────────────────────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────────────────────────┐
│           Frontend App (data-vault-frontend)                 │
│                                                               │
│  Queries via /api/proxy/... endpoints                       │
│  ├─ Dashboard: Displays analytics                           │
│  ├─ Atlas: Interactive data exploration                     │
│  ├─ Vault: Browse collected data                            │
│  ├─ History: Timeline playback                              │
│  ├─ Insights: AI-generated summaries                        │
│  └─ Contracts: Monetization proposals                       │
│                                                               │
│  Visualizations:                                             │
│  ├─ Sankey flows (user journey)                             │
│  ├─ Network graphs (domain connections)                      │
│  ├─ Heatmaps (temporal patterns)                            │
│  ├─ Hierarchies (topic structure)                           │
│  └─ Stream graphs (data flow)                               │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. NAMING ANALYSIS - CATEGORY BREAKDOWN

### A. TECHNICAL JARGON (Confusing for Non-Coders) ⚠️

#### Frontend - Folder Names
| Name | Issue | Better Alternative |
|------|-------|-------------------|
| `(app)` | Route group syntax - confusing | `main-app` or `app-routes` |
| `exploration-canvas` | Abstract term | `data-explorer` or `visualization-engine` |
| `tree-of-thought` | Philosophical jargon | `thought-map` or `idea-tree` |
| `sankey` | Specific chart type | `journey-flows` or `path-flows` |
| `DAG` | Graph theory term | `node-diagram` or `concept-map` |

#### Frontend - File Names
| Name | Issue | Better Alternative |
|------|-------|-------------------|
| `mock-data.ts` | Not self-explanatory | `sample-browsing-data.ts` |
| `modeStore.ts` | Vague "mode" | `visualization-settings.ts` or `display-state.ts` |
| `glass-select.tsx` | Style term | `frosted-dropdown.tsx` |
| `consciousness-map` | Dramatic/unclear | `thought-hierarchy.tsx` |
| `hierarchy-layout.ts` | Generic | `tree-layout-algorithm.ts` |

#### Backend - Folder Names
| Name | Issue | Better Alternative |
|------|-------|-------------------|
| `ai-processing` | Generic | `ai-analysis` or `semantic-processing` |
| `embeddings-generator` | Technical | `vector-conversion` or `semantic-encoding` |
| `background-scripts` | Technical jargon | `data-monitor` or `page-tracker` |
| `content-scripts` | Technical jargon | `page-injector` or `page-analyzer` |
| `popup-interface` / `popup-ui` | Two similar names | `extension-popup` or `popup-controls` |

#### Backend - File Names
| Name | Issue | Better Alternative |
|------|-------|-------------------|
| `page-monitor.js` | Non-specific | `page-content-tracker.js` |
| `session-manager.js` | Generic | `data-session-handler.js` |
| `background-service.js` | Vague | `extension-coordinator.js` |

### B. ALREADY HUMAN-READABLE ✅

#### Frontend - Excellent Naming
| Folder/File | Why It Works |
|-----------|-----------|
| `vault` | Instantly communicates data storage purpose |
| `history` | Clear - browsing history |
| `dashboard` | Standard term, understood |
| `settings` | Universal UI pattern |
| `profile` | Clear user profile concept |
| `insights` | Self-explanatory analytics view |
| `contracts` | Business term, clear context |
| `surfing-analytics` | Specific, descriptive |
| `provider` | React pattern, clear |
| `layout` | Standard UI concept |

#### Backend - Excellent Naming
| Folder/File | Why It Works |
|-----------|-----------|
| `database` | Clear purpose |
| `server` | Clear entry point |
| `browser-extension` | Exact technology |
| `manifest.json` | Standard Chrome Extension file |
| `analytics-dashboard.html` | Clear purpose |

### C. UNCLEAR PURPOSE (Needs Context) ⚠️

| Name | Ambiguity | Clarification Needed |
|------|-----------|-------------------|
| `data` (frontend) | Could be output, input, or test | `→ frontend-settings` or `config-data` |
| `utils` folders | Generic utility bucket | Rename by purpose: `api-utilities`, `chart-utilities`, etc. |
| `store` | Multiple patterns possible | `zustand-store` or `state-management` |
| `hooks` | Generic React pattern | Could be `custom-hooks` or by purpose |
| `ui` | Too broad | `glass-morphism-components` or `core-ui-components` |
| `manual code` | Archive? Examples? | `reference-implementations` or `templates` |
| `extension img` | Screenshots but unclear use | `ui-screenshots` or `design-reference` |

### D. FOLDER NAMING INCONSISTENCIES

| Issue | Examples |
|-------|----------|
| **Singular vs Plural** | `history` (singular) vs `hooks` (plural) vs `utils` (plural) |
| **Hyphenated vs Camel-case** | `sankey` vs `mockBrowsingEvents` vs `tree-of-thought` |
| **Descriptor Placement** | `page-monitor` (verb-noun) vs `background-service` (location-noun) |
| **Abstraction Levels** | `exploration-canvas` (component type) vs `vault` (feature name) vs `history` (feature name) |

---

## SUMMARY TABLE: Naming Categories

### Frontend
```
TECHNICAL JARGON (Confusing)       HUMAN-READABLE (Good)           UNCLEAR (Context Needed)
────────────────────────────────────────────────────────────────────────────
(app)                               vault                           data/ folder
exploration-canvas                  dashboard                       store
tree-of-thought                      settings                       utils/
sankey                               profile                        hooks/
DAG                                  insights                       ui/
consciousness-map                    contracts
glass-select                         surfing-analytics
modeStore
mock-data
```

### Backend
```
TECHNICAL JARGON (Confusing)       HUMAN-READABLE (Good)           UNCLEAR (Context Needed)
────────────────────────────────────────────────────────────────────────────
background-scripts                  database                        api-processing
content-scripts                     browser-extension               session-manager
popup-interface/popup-ui            manifest.json                   (duplicate popups)
embeddings-generator                server
page-monitor
background-service
ai-processing
```

---

## KEY RECOMMENDATIONS FOR REORGANIZATION

### Priority 1: High-Impact, High-Clarity Gains
1. Rename `(app)` → `main-app` or remove route group syntax for clarity
2. Rename `exploration-canvas` → `data-explorer`
3. Split duplicate `popup-interface` / `popup-ui` → one clear name
4. Rename `tree-of-thought` → `thought-hierarchy` or `idea-map`
5. Rename `background-scripts` → `data-monitor-service`

### Priority 2: Consistency & Standardization
1. Standardize folder naming convention (all kebab-case)
2. Create purpose-based categories in `utils/`
3. Rename `mock-data` files → `sample-[feature]-data`
4. Consolidate `store/` into `state/` or `stores/`

### Priority 3: Documentation
1. Add README.md to each major module explaining purpose
2. Create naming convention guide for contributors
3. Add code comments explaining non-obvious abbreviations

---

**Analysis Complete** • 163 files • ~4,700 total source lines • 2 major systems • 5 analysis categories
