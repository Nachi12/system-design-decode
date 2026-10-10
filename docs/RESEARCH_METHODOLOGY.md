# Research Methodology: System Architecture Decoded

**Version:** 1.0.0  
**Status:** Canonical Standard  
**Lead Author:** Principal Systems Architecture Researcher  
**Date:** October 2026  

---

## 1. Core Epistemological Framework

In technical writing and system design education, a frequent failure mode is conflating three fundamentally different classes of information:
1. What a company has explicitly verified about its internal technology.
2. What an external observer deduces based on observable behavior and standard engineering principles.
3. What a generic interview preparation tutorial claims as "the" solution.

**System Architecture Decoded** enforces an uncompromising epistemological standard. Every architecture diagram, data flow step, throughput number, and system component must be tagged with one of three explicit tiers of certainty:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        EVIDENTIARY CERTAINTY TIERS                     │
├─────────────────────────┬──────────────────────┬───────────────────────┤
│  [PUBLICLY DOCUMENTED]  │ [REASONED INFERENCE] │   [PROPOSED DESIGN]   │
│  Verified Primary Fact  │ Deductive Synthesis  │ Reference Architecture│
└─────────────────────────┴──────────────────────┴───────────────────────┘
```

### Tier 1: `[Publicly Documented]` (Verified Primary Source)
*   **Definition:** The component, algorithm, protocol, data schema, hardware specification, or operational behavior is directly confirmed by an authoritative, first-party publication from the engineering team that designed and operates it.
*   **Permissible Sources:**
    *   Official corporate engineering publications (e.g., *Netflix Technology Blog*, *Uber Engineering*, *Meta Engineering*).
    *   Peer-reviewed research papers authored by company staff (e.g., *ACM RecSys*, *VLDB*, *OSDI*, *SOSP*, *SIGMOD*).
    *   Official technical documentation portals (e.g., *openconnect.netflix.com*).
    *   Recorded keynote presentations, tech talks, and conference slide decks delivered by named company engineers (e.g., *AWS re:Invent*, *QCon*, *SREcon*, *HasGeek*).
    *   Public patent filings assigned to the corporate entity.
*   **Editorial Badge:** `badge--documented` (Color: Deep Emerald `#059669` / `#10B981`)
*   **Requirement:** Must provide the author, publication date, exact title, and permalink in `docs/SOURCE_REGISTER.md`.

### Tier 2: `[Reasoned Inference]` (Deductive Architectural Synthesis)
*   **Definition:** An unverified or partially disclosed internal mechanism that is deduced through rigorous technical deduction. This applies when a company describes high-level goals and public infrastructure inputs, but does not publish proprietary implementation code or specific internal microservice contracts.
*   **Deductive Foundation:**
    *   Physical, mathematical, or algorithmic laws (e.g., CAP theorem, speed of light in optical fiber, network round-trip time bounds).
    *   Publicly declared technology dependencies (e.g., if a company confirms utilizing Apache Cassandra and Redis, their read/write consistency levels and caching patterns can be logically constrained).
    *   Observable client-side payloads, HTTP headers, DNS lookups, or API response schemas.
*   **Editorial Badge:** `badge--inference` (Color: Warm Amber `#D97706` / `#F59E0B`)
*   **Requirement:** The text must explicitly articulate the chain of reasoning: *Premise $\to$ Physical Constraint $\to$ Deductive Conclusion*.

### Tier 3: `[Proposed Reference Design]` (Engineered Research Model)
*   **Definition:** A complete, robust architectural specification engineered by the author of this portfolio to address a specific distributed systems problem, using the target company as an industry case study archetype.
*   **Context:** Where proprietary implementations remain confidential (as is predominantly the case for BookMyShow's proprietary transaction engine), this project explicitly presents an industrial-grade **Reference Architecture**. It does **not** claim to represent the proprietary source code of the company.
*   **Editorial Badge:** `badge--reference` (Color: Slate Violet `#7C3AED` / `#8B5CF6`)
*   **Requirement:** Must state explicitly: *"This component represents an engineered reference design adhering to modern distributed systems best practices, formulated to solve the operational requirements of high-demand ticketing."*

---

## 2. Source Evaluation Hierarchy

All sources evaluated for inclusion must be ranked according to the following strict evidentiary hierarchy:

| Rank | Source Type | Evidentiary Weight | Verification Requirement |
| :---: | :--- | :--- | :--- |
| **Tier 1** | Primary Corporate Engineering Blogs & Official Docs | **Gold Standard** (100% authoritative) | Verify date, check for subsequent deprecation posts. |
| **Tier 1** | Peer-Reviewed Academic & Industry Papers | **Gold Standard** (100% authoritative) | Validate citations, note experimental vs. production systems. |
| **Tier 2** | Recorded Tech Talks by Staff/Principal Engineers | **High** (Authoritative at time of delivery) | Verify speaker identity, company tenure, and talk transcript. |
| **Tier 2** | Cloud Provider Co-Authored Case Studies (AWS/GCP) | **High** (Verified infrastructure topology) | Check for marketing exaggeration; cross-reference technical claims. |
| **Tier 3** | Third-Party SRE & Distributed Systems Textbooks | **Foundational** (Theoretical baseline) | Verify algorithmic accuracy (e.g., Kleppmann, Gray). |
| **Discard** | Uncredited Medium / LinkedIn "Interview Cheat Sheets" | **Disallowed** (Unverified hearsay) | **Do not cite.** Never rely on generic interview prep articles. |
| **Discard** | AI-Generated System Design Summaries | **Disallowed** (Hallucination risk) | **Do not cite.** All facts must trace to human primary sources. |

---

## 3. Temporal Validity & Architectural Deprecation

Distributed systems architectures at hyper-scale organizations are not immutable. A common flaw in technical analysis is presenting obsolete 2012 architectures as current 2026 designs.

### Temporal Rules:
1.  **Dated Citations:** Every technical diagram and narrative section must display the date of the primary source upon which it is based (e.g., *"Netflix Personalization Architecture (2015 Foundation; 2021 Deep Learning Updates)"*).
2.  **Explicit Deprecation Tracking:** Where a historical architecture has been superseded, the evolution must be highlighted rather than erased:
    *   *Example:* Netflix's migration from offline batch matrix factorization (2013-2015) to nearline/online Foundation Models and contextual bandits (2021-2024).
    *   *Example:* The evolution from client-side WebKit rendering (2013) to React-Gibbon (2015) to the 2024-2025 modern TV UI redesign.
3.  **No Anachronistic Merging:** Never merge two distinct architectural eras into a single incoherent diagram without delineating their temporal boundaries.

---

## 4. Handling Proprietary "Black Boxes": The BookMyShow Protocol

Because BookMyShow does not publish an exhaustive, open-source technical journal equivalent to Netflix's TechBlog, many technical portfolios invent fictional service names or present basic tutorial patterns as the company's real production stack.

To uphold academic and professional integrity, the **BookMyShow Protocol** enforces the following rules:

1.  **Document What is Verified:** Document verified public disclosures (e.g., cloud migration to AWS, use of Amazon Redshift and Databricks for real-time analytics, mobile architecture talks on React Native vs. Flutter at HasGeek, and publicly observable high-traffic flash-sale dynamics during major cinematic releases).
2.  **Declare the Reference Architecture:** For core transactional capabilities—such as distributed seat locking, race condition mitigation, payment gateway reconciliation, and multiplex ticketing box office synchronization (e.g., Vista API)—the study will explicitly be titled:
    > **"High-Demand Ticketing & Concurrency: A BookMyShow-Archetype Reference Architecture"**
3.  **Prohibit Fabricated Internal Details:** Under no circumstances will we invent internal microservice names (e.g., `BMS-Seat-Allocator-v2`), fake internal RPC contracts, or fabricate unverifiable QPS statistics.
4.  **Mathematical and Algorithmic Rigor:** Where metrics are presented in the reference architecture (e.g., "50,000 ticket requests per second during a blockbuster launch"), they must be presented as **Explicit Engineering Sizing Hypotheses**, accompanied by the capacity planning equations used to derive them.

---

## 5. Capacity Planning & Quantitative Modeling Standards

Any performance, throughput, latency, or capacity figures cited must follow strict conventions:

1.  **Direct Citations:** If a figure is taken from a primary source (e.g., "Netflix Open Connect Appliances serving 100 Gbps from a single FreeBSD server"), it must link directly to the source article.
2.  **Derived Engineering Estimates:** If a capacity figure is calculated for a reference architecture, it must show the math:
    $$\text{Network Bandwidth} = \text{Peak Requests/sec} \times \text{Average Payload Size (KB)} \times 8$$
    $$\text{Memory Overhead} = \text{Active Seats in Theatre} \times \text{Reservation Payload (bytes)} \times \text{Concurrent Screenings}$$
3.  **Order of Magnitude Acknowledgment:** Estimates must be stated as order-of-magnitude ranges (e.g., "$10^4$ to $10^5$ concurrent seat locks") rather than spuriously exact numbers (e.g., "47,218.4 requests").

---

## 6. Verification & Peer-Review Checklist

Before any architectural case study is marked as ready for publication, it must pass this 6-point verification audit:

- [ ] **Source Lineage:** Every architectural node in the interactive diagram possesses a clear citation or reference tag.
- [ ] **Badge Classification:** Every section clearly differentiates between `[Publicly Documented]`, `[Reasoned Inference]`, and `[Proposed Reference Design]`.
- [ ] **Temporal Consistency:** The narrative notes the historical period during which the documented architecture operated.
- [ ] **Zero Hallucination Audit:** No private corporate metrics, unverified internal server names, or proprietary API signatures have been fabricated.
- [ ] **Failure Domain Analysis:** The study does not merely describe the "happy path"—it analyzes failure modes, network partitions, timeout cascades, and recovery procedures.
- [ ] **Reproducible Calculations:** Any capacity planning or sizing models include their initial assumptions and governing equations.
