# Project Brief: System Architecture Decoded

**Version:** 1.0.0  
**Status:** Approved for Architectural Planning  
**Lead Author:** Principal Systems Architecture Researcher & Visual Design Engineer  
**Date:** October 2026  

---

## 1. Executive Summary & Mission Statement

**System Architecture Decoded** is a publication-grade, research-driven engineering portfolio that investigates how world-class technology organizations design, scale, and operate complex distributed software systems. 

Unlike traditional software engineering portfolios that assemble superficial CRUD applications, mock SaaS dashboards, or toy clones of consumer apps, **System Architecture Decoded** is an authoritative, documentation-first technical monograph. It couples deep architectural research with polished, interactive architectural visualizations to deconstruct the hard engineering trade-offs, concurrency models, data flows, and infrastructure topologies that underpin planetary-scale services.

The platform treats software architecture not as a set of static boxes and arrows, but as an evolving discipline of trade-offs governed by physical constraints: network latency, disk I/O, consensus overhead, failure domains, and financial unit economics.

---

## 2. Core Case Studies (Launch Scope)

The initial release focuses on two distinct, deeply complex distributed systems paradigms:

### Case Study 1: Netflix — Planetary Scale Personalization, Recommendation & Content Delivery
*   **Part 1: The Recommendation & Personalization Engine**
    *   **The 2D Grid Assembly Problem:** Transforming millions of global catalog items into a tailored, low-latency homepage composed of ranked rows and ranked items within rows.
    *   **Three-Tier Computing Hierarchy:** The interplay between Offline (batch model training, matrix factorization, deep embeddings), Nearline (event-driven stream computation, state updates via Mantis/Keystone), and Online (sub-100ms request-time candidate scoring, fallback caches, and personalization filters).
    *   **Dynamic Artwork Personalization:** Utilizing contextual bandit algorithms to evaluate thumbnail click-through rates across dynamic user segments in real time.
    *   **The Living Room & TV Experience Evolution:** The migration from early WebKit architectures to React-Gibbon, down to recent TV UI overhauls balancing 60fps rendering constraints on resource-constrained embedded silicon against real-time personalized row delivery.
*   **Part 2: Content Delivery via Netflix Open Connect**
    *   **Topology of Open Connect Appliances (OCAs):** Embedded hardware caching deployed inside ISP partner networks and at major Internet Exchange Points (IXPs).
    *   **Appliance Internals:** Hardware sizing, FreeBSD kernel tuning, zero-copy socket transfers (`sendfile`), kernel TLS (`kTLS`), and NGINX optimizations achieving 100+ Gbps per single rack unit.
    *   **Traffic Steering & Proactive Fill:** DNS/BGP-driven traffic management, off-peak title pre-positioning algorithms that shift multi-terabit loads away from prime-time transit networks.

### Case Study 2: BookMyShow — High-Demand Ticketing & Distributed Inventory Reference Architecture
*   **High-Concurrency Seat Inventory:** The fundamental problem of the "flash sale" for reserved physical inventory (thousands of concurrent users contending for the exact same seat coordinates within milliseconds).
*   **The Three-Layer Defense Strategy:** 
    *   *Layer 1 (Edge & Gateway):* Rate limiting, token bucket ingress, fair queuing, and bot mitigation.
    *   *Layer 2 (In-Memory Inventory & Ephemeral State):* Redis/distributed memory locks with bounded TTLs, atomic seat state transitions (`AVAILABLE` $\to$ `LOCKED` $\to$ `BOOKED`), and Lua-scripted conditional execution.
    *   *Layer 3 (Durable Transaction Ledger & Multiplex Sync):* Database persistence, optimistic concurrency control, and integration with third-party cinema box office systems (e.g., Vista).
*   **Payment Reliability & Distributed Settlement:** The two-phase checkout lifecycle, payment gateway webhook race conditions, idempotency key guarantees, compensation transactions (Saga pattern), and guaranteed asynchronous seat release on timeout or payment failure.
*   **Rigorous Academic Attribution:** Explicitly delineating between verified public company disclosures (AWS migrations, Databricks analytics, HasGeek conference talks) and a rigorously engineered **"BookMyShow-like Ticketing Reference Architecture"** based on industry standard distributed systems principles.

---

## 3. Guiding Philosophy: Research-First, Editorial Quality

1.  **Engineering Rigor Over Toy Demos:** No toy database connections, no mock Stripe checkout forms, no client-side login forms. The interface exists solely to explain, visualize, and deconstruct complex architecture.
2.  **Editorial Engineering Aesthetics:** Inspired by premier publications such as *Stripe Press*, *Increment Magazine*, *ACM Queue*, and *Distill.pub*. The design communicates serious academic and industrial authority through typographic precision, deliberate white space, structured marginalia, and high-contrast technical schematics.
3.  **Epistemological Integrity:** Every technical claim, latency SLA, and architectural diagram node is tagged with its empirical pedigree:
    *   `[Publicly Documented]`: Directly referenced from primary company papers, patents, or official engineering publications.
    *   `[Reasoned Inference]`: Synthesized from observable architectural constraints, public tech stacks, and engineering talks.
    *   `[Proposed Reference Design]`: An architectural solution engineered specifically for this research project to address established operational challenges.
4.  **Interactive Exploration with Explanatory Intent:** Diagrams are not static images. Users can pan, inspect service boundaries, trace request paths, view latency budgets, simulate network partitions, and inspect fallback modes.

---

## 4. Target Audience & Impact Goals

*   **Principal & Staff Software Engineers:** Looking for deep, nuanced analyses of real-world distributed systems trade-offs without marketing fluff.
*   **Engineering Leaders & Hiring Managers:** Evaluating candidates for senior architectural depth, systems design mastery, technical communication, and intellectual honesty.
*   **Distributed Systems Students & Practitioners:** Seeking clear, verifiable breakdowns of how CAP theorem trade-offs, consensus algorithms, caching hierarchies, and edge compute work in production.

---

## 5. Non-Goals & Boundaries (Strict Constraints)

| In Scope (What We Are Building) | Explicit Non-Goals (What We Are NOT Building) |
| :--- | :--- |
| Deep-dive architectural monographs with complete citations | Commercial SaaS products or consumer-facing ticketing applications |
| Interactive architectural canvas with service node inspection | Mock backend microservices running on local Docker/Kubernetes |
| Data flow tracing (e.g., tracing a seat reservation through Redis and DB) | Functional payment processing or actual Stripe API keys |
| Comparative trade-off matrices and failure domain models | User authentication, session management, or user profiles |
| Fully static, high-performance, client-side web application | Backend database connections (Postgres, MongoDB, DynamoDB) |
| Accessible, responsive, publication-grade editorial styling | Gratuitous UI animations, neon gradients, or generic UI templates |

---

## 6. Project Success Metrics & Acceptance Criteria

1.  **Research Fidelity:** 100% of claims cite primary or verified secondary sources in `docs/SOURCE_REGISTER.md`. Zero hallucinated metrics or fabricated internal APIs.
2.  **Visual Quality:** Editorial layout with custom typography, responsive grid, clean marginalia (sidenotes/footnotes), dark/light adaptive palettes, and WCAG 2.1 AA accessibility.
3.  **Diagram Interactivity:** Fluid pan/zoom, interactive node inspection cards, request-path visual stepping, and zero diagram rendering lag (60fps canvas performance).
4.  **Production Readiness:** 100% static build with zero runtime server dependencies, bundle size under 350KB gzipped, and Lighthouse scores $\ge 95$ across Performance, Accessibility, Best Practices, and SEO.
