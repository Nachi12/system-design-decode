# Information Architecture & Content Schema: System Architecture Decoded

**Version:** 1.0.0  
**Status:** Approved Architectural Blueprint  
**Lead Information Architect:** Principal Systems Architecture Researcher  
**Date:** October 2026  

---

## 1. Structural Overview & Core User Journeys

**System Architecture Decoded** is organized as a monographic digital publication. It balances continuous long-form narrative reading with interactive spatial exploration of complex architecture diagrams.

### Primary User Personas & Mental Models:
1.  **The Architectural Investigator (Principal/Staff Engineer):** Wants to scrutinize concurrency boundaries, examine race condition mitigation, and evaluate failure domains. Needs deep technical diagrams, code traces, and trade-off matrices.
2.  **The Hiring Manager / Technical Evaluator:** Wants to assess the researcher's intellectual honesty, technical depth, clarity of thought, and understanding of distributed systems principles. Evaluates methodology, citations, and clarity of communication.
3.  **The Systems Student / SRE Practitioner:** Wants to understand how theoretical distributed concepts (CAP theorem, Sagas, Contextual Bandits, zero-copy network I/O) are applied to real-world industrial systems.

---

## 2. Complete Sitemap & URL Hierarchy

```
/                                             [Home: Executive Synthesis & Portfolio Manifesto]
├── /netflix                                  [Case Study 1 Hub: Netflix Architectural Synthesis]
│   ├── /netflix/personalization              [Deep-Dive: Recommendation Engine & TV UI Evolution]
│   └── /netflix/open-connect                 [Deep-Dive: Open Connect CDN & 100 Gbps Appliance Internals]
├── /ticketing                                [Case Study 2 Hub: High-Demand Ticketing Architecture]
│   └── /ticketing/reference-architecture     [Deep-Dive: Concurrency, Distributed Locking & Sagas]
├── /comparative-analysis                     [Synthesis: Read-Heavy vs. Write-Contended Architecture Matrix]
├── /methodology                              [Epistemology: The 3-Tier Evidentiary Verification Standard]
└── /sources                                  [Interactive Bibliography & Primary Source Register]
```

### Detailed Route Specifications

| Route | Canonical Title | Primary Technical Focus | Interactive Visual Components |
| :--- | :--- | :--- | :--- |
| `/` | **System Architecture Decoded: Portfolio Overview** | Publication thesis, case study introductions, architectural taxonomy, methodology summary. | High-level interactive taxonomy map, quick-jump case study cards. |
| `/netflix` | **Netflix Architectural Synthesis** | Executive overview of Netflix's dual-engine architecture: Cloud Control Plane (AWS) vs. Edge Data Plane (Open Connect). | Dual-plane topology schematic with plane-toggle controls. |
| `/netflix/personalization` | **Planetary-Scale Recommendation & TV Experience** | 2D page assembly, 3-tier computing hierarchy (Offline/Nearline/Online), contextual bandits for artwork, and 2024 TV client constraints. | **Interactive 3-Tier Architecture Canvas**, Request Flow Stepper, Fallback Mode Simulator, Bandit Trade-off Matrix. |
| `/netflix/open-connect` | **Open Connect: Video Delivery at 100+ Gbps** | OCA hardware topology, ISP IXP peering, FreeBSD zero-copy `sendfile`/kTLS, BGP steering, and off-peak pre-positioning. | **Interactive OCA Appliance Schematic**, ISP Caching Topology Map, Traffic Off-Peak Shift Visualizer. |
| `/ticketing` | **High-Demand Ticketing Synthesis** | The flash-sale concurrency problem, BookMyShow empirical footprint vs. proposed reference design manifesto. | Flash-sale concurrency timeline, threat model overview. |
| `/ticketing/reference-architecture` | **Ticketing Reference Architecture: Concurrency & Sagas** | 3-layer defense (Ingress/Redis/DB), distributed lock safety (Lua CAS vs. Fencing), Saga payment orchestrator, Vista POS sync. | **Interactive Multi-Layer Ticketing Canvas**, Race Condition Visualizer, Saga State Machine Stepper. |
| `/comparative-analysis` | **Architectural Dialectic: Read-Heavy vs. Write-Contended** | Direct comparison of Netflix (cacheable, eventual consistency) vs. Ticketing (linearizable, lock-contended). | Interactive Comparative Trade-off Matrix with dimensional filters. |
| `/methodology` | **Research Methodology & Epistemological Standards** | The 3 evidentiary tiers, source evaluation hierarchy, verification checklist, BookMyShow protocol. | Evidentiary Tier Explorer, Fact-Checking Flowchart. |
| `/sources` | **Source Register & Annotated Bibliography** | Live inventory of all cited literature, patents, papers, and tech blogs. | Filterable/searchable source table with drawer modals. |

---

## 3. Page-Level Information Hierarchy & Content Templates

Every case study deep-dive page adheres to a rigorous, modular editorial structure:

```
┌────────────────────────────────────────────────────────────────────────┐
│ HEADER: Title, Subtitle, Reading Time, Evidentiary Scope Badges        │
├────────────────────────────────────────────────────────────────────────┤
│ 1. EXECUTIVE SUMMARY & ARCHITECTURAL PROBLEM STATEMENT                 │
│    - Business context & operational constraints                        │
│    - Governing engineering metrics (Latency SLAs, QPS, Storage)        │
├────────────────────────────────────────────────────────────────────────┤
│ 2. THEORETICAL FOUNDATION & DOMAIN MODEL                               │
│    - Underlying computer science principles (CAP, ACID, Bandits)       │
├────────────────────────────────────────────────────────────────────────┤
│ 3. PRIMARY ARCHITECTURE CANVAS (Interactive Visualizer)                │
│    - Multi-tier system topology diagram                                │
│    - Interactive node inspector (specs, schemas, SLAs)                │
│    - Flow stepping (simulate end-to-end user request path)             │
├────────────────────────────────────────────────────────────────────────┤
│ 4. DEEP-DIVE TECHNICAL SUBSECTIONS (Modular Narrative)                 │
│    - Component-by-component analysis with marginalia sidenotes        │
│    - Code traces, Lua scripts, SQL transaction patterns                │
│    - Publicly Documented vs. Reasoned Inference tags                   │
├────────────────────────────────────────────────────────────────────────┤
│ 5. FAILURE MODES, NETWORK PARTITIONS & RESILIENCY                      │
│    - What breaks under stress? How does the system degrade gracefully? │
├────────────────────────────────────────────────────────────────────────┤
│ 6. ENGINEERING TRADE-OFF MATRIX                                        │
│    - Alternatives considered, rejected approaches, and why             │
├────────────────────────────────────────────────────────────────────────┤
│ 7. ANNOTATED SOURCES & CITATION FOOTNOTES                              │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Component Taxonomy & UI Specifications

### 4.1 Editorial Narrative Components

*   `ArticleHeader`:
    *   Props: `title`, `kicker`, `abstract`, `readingTime`, `lastUpdated`, `certaintyBreakdown: { documented, inferred, reference }`.
    *   Renders an authoritative, magazine-grade title block with metadata tags.
*   `Marginalia` (Sidenotes & Citations):
    *   Desktop ($\ge 1280$px): Floats cleanly in a dedicated 280px right-hand gutter aligned directly with the referencing paragraph.
    *   Tablet/Mobile ($< 1280$px): Collapses into an expandable inline chip (`[Note 3]`) that toggles a compact drawer.
*   `CertaintyBadge`:
    *   Props: `tier: 'documented' | 'inference' | 'reference'`, `sourceId?: string`.
    *   Visually stamps any section, diagram node, or claim with its empirical status. Clicking the badge reveals the source or deductive logic in a modal drawer.
*   `TradeoffMatrix`:
    *   Props: `dimensions: string[]`, `approaches: { name, pros, cons, verdict, selected: boolean }[]`.
    *   Structured comparison table highlighting why specific distributed designs were chosen over alternatives.
*   `CodeTrace`:
    *   Props: `language`, `code`, `annotations: { line: number, text: string }[]`.
    *   Clean syntax-highlighted code block (monospaced) with interactive callout dots on critical lines (e.g., Redis Lua script lock checks, optimistic locking version checks).

### 4.2 Interactive Architectural Visualizer Components

*   `ArchitectureCanvas`:
    *   High-performance SVG canvas capable of smooth pan, zoom, and node selection.
    *   Supports responsive bounding and auto-fit to container.
    *   Renders tiered architectural layers (Edge Gateway, Service Mesh, Caching, Durable Persistence, External Partners).
*   `NodeInspectorDrawer`:
    *   Sliding technical sheet that opens when any architectural node is clicked.
    *   Displays:
        *   Node Name, Technology Stack, and Role.
        *   Certainty Tier Badge (`[Publicly Documented]`, `[Reasoned Inference]`, `[Proposed Reference Design]`).
        *   Latency Budget & SLA (e.g., "$< 15$ms p99").
        *   State Characteristics (Stateless, Ephemeral Memory, Sharded Durable).
        *   Failure Handling (Fallback cache, circuit breaker, retry policy).
        *   Primary Source Citations.
*   `RequestFlowStepper`:
    *   Interactive stepper widget allowing the reader to trace real-world operational flows:
        *   *Netflix:* User opens TV app $\to$ Zuul Gateway $\to$ Personalization Engine $\to$ Offline/Nearline joins $\to$ Row generation $\to$ Fallback check $\to$ TV response.
        *   *Ticketing:* User clicks "Select Seat A12" $\to$ Rate Limiter $\to$ Redis Lua lock attempt $\to$ Seat status `LOCKED` with 10m TTL $\to$ Payment Saga triggered $\to$ Webhook confirmation $\to$ DB commit $\to$ Vista POS commit.
    *   Animates glowing SVG paths connecting the participating nodes and highlights active step commentary.
*   `FailureModeToggle`:
    *   Allows toggling simulated outage conditions (e.g., *"Simulate Redis Cluster Partition"*, *"Simulate Payment Webhook 504 Timeout"*, *"Simulate Nearline Cache Cold-Start"*).
    *   Instantly changes diagram state to display degraded fallback paths and circuit-breaker activations.

---

## 5. Navigation & Reading Ergonomics

1.  **Global Header:**
    *   Logo: *System Architecture Decoded* (Monospaced typographical mark).
    *   Primary Case Study Dropdowns / Direct Links (Netflix, Ticketing, Comparative Matrix, Methodology, Sources).
    *   Global Theme Switcher (Dark Mode default; tactile warm paper Light Mode).
2.  **Article Sticky Progress Bar & Section Table of Contents:**
    *   Slim scroll progress indicator along the top border.
    *   Desktop left-rail sticky Table of Contents highlighting current scroll position.
3.  **Deep-Linking URL State:**
    *   Diagram node selections and active flow stepper steps update URL search parameters (e.g., `/netflix/personalization?node=nearline-compute&step=3`).
    *   Enables direct sharing of specific architectural states for peer discussion and review.
