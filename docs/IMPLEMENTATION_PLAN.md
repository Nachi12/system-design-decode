# Implementation Plan & Engineering Proposal: System Architecture Decoded

**Version:** 1.0.0  
**Status:** Ready for Review  
**Lead Architect & Senior Visual Design Engineer:** Antigravity Engineering Lead  
**Date:** October 2026  

---

## 1. Technical Stack Selection & Justification

To fulfill the mission of an **editorial engineering research publication** with interactive architectural diagrams and zero backend dependencies, we recommend the following stack:

| Layer | Chosen Technology | Justification & Architectural Trade-offs |
| :--- | :--- | :--- |
| **Build Engine** | **Vite 6** (Modern ES Modules) | Instant HMR during development, optimized Rollup production builds, zero configuration friction, sub-second build times. |
| **UI Framework** | **React 18 / 19 + TypeScript** | Declarative state management for interactive diagram inspection, flow stepping, and theme toggling. TypeScript enforces strict evidentiary schemas across all architectural nodes, citations, and metrics. |
| **Styling Architecture** | **Vanilla CSS Tokens + Scoped CSS Modules** | **Zero-Tailwind Approach:** Full compliance with workspace conventions. Maximum precision over typography, layout grids, and SVG styling without runtime overhead or CSS utility bloat. Leverages modern CSS features (CSS variables, nesting, container queries, subgrid). |
| **Interactive Diagram Engine** | **Custom Interactive SVG Canvas + Lightweight SVG Flow Engine** | Handcrafted, high-performance SVG engine supporting smooth pan, pinch-zoom, animated flow stepping, orthogonal routing, and node selection. Eliminates heavy external diagram runtime dependencies while guaranteeing pixel-perfect alignment with the editorial design system. Augmented with Mermaid.js for linear sequence flows. |
| **Client Routing** | **Wouter** (or React Router 6/7) | Ultra-lightweight (<2KB) client-side routing. Supports deep-linking for diagram node selection and flow steps (e.g. `/netflix/personalization?node=nearline-compute&step=2`) without server routing dependencies. |
| **Content Pipeline** | **Typed JSON/TS Architectural Content Modules** | Deep technical content, citations, and diagram schemas stored in strictly typed TypeScript modules. Ensures compile-time verification of source IDs, certainty badges, and node connections. |
| **Static Deployment** | **100% Pure Static Output (`dist/`)** | Zero server, zero database, zero lambda cold-starts. Can be hosted anywhere (GitHub Pages, Cloudflare Pages, S3/CloudFront, Netlify) with instantaneous global CDN delivery. |

---

## 2. Project Directory Structure

```
/
├── AGENTS.md                               # Durable workspace instructions & guidelines
├── docs/                                   # Architectural planning deliverables
│   ├── PROJECT_BRIEF.md
│   ├── RESEARCH_METHODOLOGY.md
│   ├── SOURCE_REGISTER.md
│   ├── INFORMATION_ARCHITECTURE.md
│   ├── VISUAL_DESIGN_BRIEF.md
│   └── IMPLEMENTATION_PLAN.md
├── index.html                              # HTML5 entry with editorial typography preload
├── package.json                            # Dependencies and build scripts
├── tsconfig.json                           # Strict TypeScript configuration
├── vite.config.ts                          # Vite build & asset optimization settings
└── src/
    ├── main.tsx                            # React root mount
    ├── App.tsx                             # App shell, routing, global state & theme provider
    ├── styles/                             # Vanilla CSS Design System
    │   ├── tokens.css                      # Color, typography, spacing, certainty badges
    │   ├── reset.css                       # Modern CSS reset & base element styling
    │   ├── typography.css                  # Editorial serif/sans/mono font rules
    │   ├── layout.css                      # Reading grid, sticky TOC, marginalia gutter
    │   └── animations.css                  # Flow pulse animations, modal transitions
    ├── types/                              # Strict TypeScript data contracts
    │   ├── architecture.ts                 # Node, Edge, Tier, LatencySLA, FailureMode
    │   ├── evidence.ts                     # CertaintyTier, Citation, EvidenceNote
    │   └── content.ts                      # CaseStudy, Section, TradeoffDimension
    ├── data/                               # Research Content & Diagram Schemas
    │   ├── sources.ts                      # Canonical Source Register database
    │   ├── netflixPersonalization.ts       # 2D Grid, 3-tier compute, TV UI data
    │   ├── netflixOpenConnect.ts           # OCA hardware, ISP BGP, off-peak fill
    │   ├── ticketingReference.ts           # Concurrency, Redis Lua, Saga, Vista API
    │   └── comparativeMatrix.ts            # Read-heavy vs. Write-contended matrix
    ├── components/
    │   ├── layout/                         # App shell, Header, Footer, Sidenote
    │   │   ├── Header.tsx
    │   │   ├── Footer.tsx
    │   │   ├── ReadingProgress.tsx
    │   │   ├── TableOfContents.tsx
    │   │   └── Marginalia.tsx
    │   ├── editorial/                      # Editorial typography & content widgets
    │   │   ├── ArticleHeader.tsx
    │   │   ├── CertaintyBadge.tsx
    │   │   ├── CodeTrace.tsx
    │   │   ├── TradeoffMatrix.tsx
    │   │   ├── CapacityCalculator.tsx
    │   │   └── EvidenceDrawer.tsx
    │   └── diagram/                        # Interactive Architecture Canvas
    │       ├── ArchitectureCanvas.tsx      # SVG viewport with pan/zoom/touch
    │       ├── DiagramNode.tsx             # Interactive SVG card with tier badges
    │       ├── DiagramEdge.tsx             # Directed orthogonal SVG connection
    │       ├── NodeInspectorDrawer.tsx     # Deep-dive specs, schemas, SLAs
    │       ├── RequestFlowStepper.tsx      # Visual step-by-step request tracer
    │       └── FailureSimulator.tsx        # Outage & fallback mode toggles
    └── pages/                              # Publication pages
        ├── HomePage.tsx                    # Portfolio Manifesto & Executive Synthesis
        ├── NetflixHubPage.tsx              # Netflix Case Study Portal
        ├── NetflixPersonalizationPage.tsx  # Recommendation Engine & TV UI Deep Dive
        ├── NetflixOpenConnectPage.tsx      # Open Connect CDN & Appliance Deep Dive
        ├── TicketingHubPage.tsx            # Ticketing Case Study Portal
        ├── TicketingArchitecturePage.tsx   # Concurrency, Locks & Sagas Deep Dive
        ├── ComparativeAnalysisPage.tsx     # Cross-Case Study Synthesis Matrix
        ├── MethodologyPage.tsx             # 3-Tier Research Methodology
        └── SourcesPage.tsx                 # Interactive Source Register & Filter
```

---

## 3. Phased Implementation Roadmap

Implementation will proceed through 7 rigorous, sequential phases:

```
┌────────────────────────────────────────────────────────────────────────┐
│                      PHASED IMPLEMENTATION PIPELINE                    │
├─────────┬─────────┬─────────┬─────────┬─────────┬─────────┬────────────┤
│ Phase 1 │ Phase 2 │ Phase 3 │ Phase 4 │ Phase 5 │ Phase 6 │  Phase 7   │
│  Setup  │  Shell  │ Netflix │ Open    │ Ticket- │ Matrix  │ Verification│
│ & Tokens│ & Canvas│ RecSys  │ Connect │  ing    │& Sources│  & Polish  │
└─────────┴─────────┴─────────┴─────────┴─────────┴─────────┴────────────┘
```

### Phase 1: Environment Setup, Design System Tokens & Base Foundation
*   **Objectives:** Initialize Vite + React + TypeScript project with pure Vanilla CSS tokens, typography loading, and build scripts.
*   **Deliverables:**
    *   `package.json`, `tsconfig.json`, `vite.config.ts`.
    *   Design system stylesheet tokens (`tokens.css`, `typography.css`, `reset.css`, `layout.css`).
    *   Theme toggle provider (Dark obsidian default $\leftrightarrow$ Tactile warm paper).
*   **Acceptance Criteria:** Development server boots cleanly; typography renders with correct fallbacks; theme switcher alters all color tokens with zero flash.

### Phase 2: Navigation Shell, Editorial Layout & Interactive Diagram Engine
*   **Objectives:** Build the core editorial reading experience (3-column layout, sticky TOC, marginalia sidenotes) and the custom SVG `ArchitectureCanvas`.
*   **Deliverables:**
    *   `Header`, `Footer`, `ReadingProgress`, `TableOfContents`, and `Marginalia` components.
    *   `ArchitectureCanvas` supporting pan, zoom, reset, node selection, and SVG edge rendering.
    *   `NodeInspectorDrawer` and `RequestFlowStepper` UI foundations.
*   **Acceptance Criteria:** Canvas smoothly pans and zooms with mouse and touch gestures; clicking a node slides open the inspector drawer; responsive breakpoints adapt correctly from 320px to 2560px.

### Phase 3: Case Study 1 — Netflix Personalization & Recommendation Engine
*   **Objectives:** Implement the complete research monograph and interactive visualization for Netflix Homepage Personalization and the TV client architecture.
*   **Deliverables:**
    *   Interactive **3-Tier Compute Architecture Diagram** (Offline batch training, Nearline event streaming via Mantis/Kafka, Online sub-100ms request-time serving).
    *   Interactive **2D Grid Assembly Model** demonstrating row selection, item ranking, and diversity constraints.
    *   Contextual Bandits exploration for dynamic artwork personalization.
    *   TV client evolution analysis (React-Gibbon to 2024 top-navigation redesign).
    *   Step-by-step request flow: Tracing a TV app session initiation to rendered screen.
    *   Complete source citations linking to `SRC-NFLX-REC-01` through `SRC-NFLX-CLIENT-02`.
*   **Acceptance Criteria:** Reader can trace request flow through all tiers; clicking any node shows its documented vs. inferred pedigree, latency budgets, and fallback strategies.

### Phase 4: Case Study 1 — Netflix Content Delivery via Open Connect
*   **Objectives:** Implement the research monograph and interactive visualization for Netflix's video delivery plane.
*   **Deliverables:**
    *   Interactive **Open Connect Appliance (OCA) Architecture Diagram** detailing hardware specs, FreeBSD kernel bypass, `sendfile`, and `kTLS`.
    *   Global distribution topology: Embedded ISP caching vs. IXP peering.
    *   BGP steering algorithms and proactive off-peak fill schedule visualizer.
    *   Step-by-step request flow: Video play initiation to 100 Gbps stream delivery.
    *   Full citations linking to `SRC-NFLX-CDN-01` and `SRC-NFLX-CDN-02`.
*   **Acceptance Criteria:** All kernel-level optimizations clearly annotated; off-peak bandwidth shifting explained with quantitative capacity models.

### Phase 5: Case Study 2 — High-Demand Ticketing & Concurrency Reference Architecture
*   **Objectives:** Implement the research monograph and interactive visualization for the high-demand ticketing engine (BookMyShow archetype).
*   **Deliverables:**
    *   Interactive **Three-Layer Concurrency Architecture Diagram** (Rate Limiter, Redis In-Memory Locks, PostgreSQL Durable Ledger, Vista Multiplex POS).
    *   Distributed Locking deep-dive: Interactive demonstration of Redis Lua atomic CAS script vs. Redlock fencing tokens.
    *   Saga Payment Orchestrator: State machine visualizer tracking seat lifecycle (`AVAILABLE` $\to$ `LOCKED` $\to$ `PAYMENT_PENDING` $\to$ `CONFIRMED` or `EXPIRED`).
    *   Payment idempotency key resolution and out-of-band webhook race condition handling.
    *   Multiplex box office external sync protocol (handling cinema box office walk-ins vs. online sales).
    *   Strict labeling adhering to the BookMyShow protocol (`[Publicly Documented]` vs. `[Proposed Reference Design]`).
*   **Acceptance Criteria:** Reader can trigger race condition simulations; Saga transaction compensation paths are step-traceable; clear mathematical capacity equations for peak flash-sale loads.

### Phase 6: Cross-Case Comparative Matrix, Methodology & Source Register
*   **Objectives:** Synthesize the overarching architectural learnings and provide the full evidentiary audit trail.
*   **Deliverables:**
    *   `ComparativeAnalysisPage`: Interactive Trade-off Matrix comparing Netflix (Read-Heavy, Eventual Consistency, Cache-Oriented) vs. Ticketing (Write-Contended, Linearizable, Lock-Oriented).
    *   `MethodologyPage`: The 3-tier epistemology, fact-checking rules, and temporal validity guide.
    *   `SourcesPage`: Searchable, filterable bibliography with certainty tags and direct links.
*   **Acceptance Criteria:** Matrix allows filtering by architectural dimension (Consistency, Latency SLA, Caching, Failure Modes); all sources cross-reference correctly.

### Phase 7: Polish, Verification, Accessibility Audit & Final Review
*   **Objectives:** Comprehensive quality assurance across performance, accessibility, responsiveness, and editorial clarity.
*   **Deliverables:**
    *   Lighthouse audit targeting $\ge 95$ across all categories.
    *   Full keyboard navigation verification for interactive diagrams.
    *   Screen reader compatibility check (`.sr-only` descriptions for all diagrams).
    *   Bundle size optimization (dynamic code splitting for routes, asset optimization).
*   **Acceptance Criteria:** Zero console errors; clean TypeScript compilation (`tsc --noEmit`); production build passes without warnings.

---

## 4. Build, Lint & Verification Commands

All development and verification commands are standard, non-interactive, and reproducible:

```bash
# 1. Install dependencies
npm install

# 2. Type-checking & strict linting
npx tsc --noEmit

# 3. Development server
npm run dev

# 4. Production build
npm run build

# 5. Production preview
npm run preview
```

---

## 5. Acceptance Criteria Checklist for Implementation Launch

Before moving from planning to code implementation, the project must meet the following criteria:

- [x] Workspace inspected and verified clean.
- [x] Primary and authoritative sources gathered and annotated in `docs/SOURCE_REGISTER.md`.
- [x] Epistemological framework established in `docs/RESEARCH_METHODOLOGY.md`.
- [x] Full sitemap and component hierarchy defined in `docs/INFORMATION_ARCHITECTURE.md`.
- [x] Visual design tokens, typography, and diagram standards defined in `docs/VISUAL_DESIGN_BRIEF.md`.
- [x] Phased implementation roadmap and technology choices detailed in `docs/IMPLEMENTATION_PLAN.md`.
- [x] Root `AGENTS.md` created with durable workspace instructions.
- [ ] User review and approval of the planning deliverables.
