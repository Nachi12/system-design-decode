# GEMINI.md: Durable Workspace Instructions & Standards

**Project Name:** System Architecture Decoded  
**Project Role:** Editorial Engineering Research Portfolio & Architecture Monograph  
**Target Environment:** Antigravity Agentic IDE / Mac OS / Node 20+  

---

## 1. Project Mission & Core Tenets

**System Architecture Decoded** is an authoritative, documentation-first engineering research publication investigating how planetary-scale systems are architected and operated. 

### Fundamental Tenets:
1.  **Documentation-First:** We are building an editorial engineering monograph with a polished, visually explorable frontend—**not** a commercial product, SaaS dashboard, backend app, or interactive checkout simulation.
2.  **No Superficial Demos:** Do **not** build backend databases, authentication schemes, mock Stripe checkout forms, or consumer-facing CRUD features. Visual components exist strictly to explain architecture, trace dataflows, and demonstrate distributed systems trade-offs.
3.  **Intellectual Rigor:** Every case study, architectural diagram, and technical analysis must reflect the caliber of a Staff/Principal Systems Architect or distributed systems researcher.

---

## 2. Research & Evidentiary Standards (Non-Negotiable)

Every technical claim, diagram node, latency budget, and component must adhere to the **3-Tier Evidentiary Framework**:

1.  **`[Publicly Documented]` (Emerald):** Directly confirmed by primary company sources (official engineering blogs, peer-reviewed papers, patents, verified conference talks, official CDN docs). Must cite a verifiable source in `docs/SOURCE_REGISTER.md`.
2.  **`[Reasoned Inference]` (Amber):** Deductions synthesized from physical constraints, CAP theorem trade-offs, public tech stacks, and observable behavior. The deductive chain (*Premise $\to$ Constraint $\to$ Conclusion*) must be clearly explained.
3.  **`[Proposed Reference Design]` (Violet):** An industrial-grade architecture engineered specifically for this research project to address a classic problem (e.g., the BookMyShow ticketing reference design). Must never be falsely attributed as the company's proprietary implementation.

### Strict Prohibitions:
*   **NEVER** invent traffic numbers, QPS, latency SLAs, internal server names, or proprietary APIs.
*   **NEVER** cite generic, uncredited interview prep articles or AI-generated summaries as authoritative sources.
*   **NEVER** present a standard system design tutorial pattern as a company's actual internal stack.

---

## 3. Technology & Frontend Architecture Conventions

*   **Stack:** React + Vite + TypeScript (100% static output in `dist/`, zero backend runtime).
*   **Styling:** **Vanilla CSS with CSS custom properties and scoped styles.** Do **NOT** introduce TailwindCSS unless explicitly requested by the user. Adhere strictly to the design tokens defined in `docs/VISUAL_DESIGN_BRIEF.md`.
*   **Diagrams:** Custom interactive SVG architecture canvas (`ArchitectureCanvas`) with pan/zoom, node coordinate mapping, cubic-bezier edge routing, node inspection drawers, and request flow stepping.
*   **Accessibility:** WCAG 2.1 AA compliant contrast ratios ($\ge 4.5:1$), keyboard-navigable diagram nodes, and screen-reader accessible textual descriptions for all visual models.
*   **Typography:** Editorial Serif headlines (`Newsreader` / `Charter`), high-legibility Sans body (`Plus Jakarta Sans` / `Inter`), and Monospace code/metrics (`JetBrains Mono` with `tabular-nums`).

---

## 4. Directory & Documentation Conventions

*   `docs/PROJECT_BRIEF.md`: Mission, scope, and non-goals.
*   `docs/RESEARCH_METHODOLOGY.md`: Epistemological framework and verification protocols.
*   `docs/SOURCE_REGISTER.md`: Canonical register of all verified sources and citations.
*   `docs/INFORMATION_ARCHITECTURE.md`: Complete sitemap, routing, and component taxonomy.
*   `docs/VISUAL_DESIGN_BRIEF.md`: Design tokens, typography, and visual schematics.
*   `docs/IMPLEMENTATION_PLAN.md`: Multi-phase roadmap, stack justification, and verification commands.

---

## 5. Development & Verification Workflow

```bash
# Type-checking and strict verification
npx tsc --noEmit

# Development server
npm run dev

# Production build validation
npm run build
```

Before committing any implementation milestone, verify:
1. No TypeScript compiler errors or missing types.
2. Zero broken source links or citation mismatches.
3. Dark and Light themes render seamlessly with high contrast.
4. Interactive diagrams maintain 60fps performance without layout thrashing.
