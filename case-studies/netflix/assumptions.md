# Architectural Assumptions & Boundaries: Netflix Case Study

**Case Study:** Netflix: Personalization, Recommendations and Content Delivery  
**Document Type:** Formal Assumptions & Sizing Boundary Register  
**Date:** October 2026  

---

## 1. Epistemological Disclaimers & Ground Rules

1.  **Independent Technical Analysis:** This research is an independent study synthesizing publicly documented engineering blogs, peer-reviewed papers, and verified conference keynotes. It does not represent internal confidential disclosures or proprietary code.
2.  **Explicit Labeling of Reference Models:** Where Netflix has not publicly disclosed internal interface contracts or exact microservice parameters, our analysis explicitly presents an **illustrative Reference Architecture**. These components are clearly tagged with `[Proposed Reference Design]` to avoid misleading the reader.
3.  **Temporal Distinction:** Historical technologies (e.g., coordinate descent row ranking in 2015, early WebKit UI) are explicitly identified as historical milestones. They are not assumed to constitute Netflix's entire current internal stack.

---

## 2. Documented Facts vs. Inferences & Reference Designs

| Architectural Dimension | Publicly Documented Fact | Reasoned Inference | Proposed Reference Design |
| :--- | :--- | :--- | :--- |
| **Control Plane vs. Data Plane** | Complete separation: AWS coordinates metadata and steering; Open Connect OCAs deliver all video bytes. | DNS & BGP routing feedback loops dynamically throttle OCA traffic when ISP links saturate. | Dual-plane API gateway routing contract separating JSON page manifests from binary media chunks. |
| **Recommendation Computation** | 3-tier computing hierarchy (Offline batch, Nearline streaming, Online sub-100ms request serving). | Nearline stream processing relies on Apache Flink and Kafka partitions keyed by `profile_id`. | Detailed Low-Level Design (LLD) with `CandidateGenerator`, `RecommendationRanker`, and `DiversityReranker` interfaces. |
| **Homepage Layout Assembly** | Formulated as a 2D grid problem: row candidate generation, video ranking, and whole-page layout synthesis. | Pre-assembled JSON page trees are cached in Redis/EVCache to protect compute tiers from peak browse spikes. | Concrete TypeScript interface model for the 2D Page response payload and fallback cache schemas. |
| **Artwork Personalization** | Contextual multi-armed bandit algorithms dynamically assign personalized thumbnails per user segment. | Bandit exploration traffic is capped at 5–10% of total member requests to preserve high baseline conversion. | Detailed exploration policy evaluation class and bandit update listener model. |
| **TV Client Runtime** | React-Gibbon C++ native engine bypasses WebKit to achieve 60fps animations on low-memory TV silicon. | Server-side response trees pre-calculate layout coordinates so low-power TVs do not execute expensive layout passes. | Client-side memory virtualization state machine for off-screen row unmounting. |
| **Content Delivery & OCAs** | FreeBSD servers, zero-copy `sendfile()`, Kernel TLS (`kTLS`), proactive overnight off-peak pre-positioning. | High-popularity titles (top 5%) account for >80% of peak streaming traffic and are stored in NVMe flash tiers. | Capacity planning equation and mathematical model calculating aggregate delivery throughput and cache hit ratios. |

---

## 3. Illustrative Capacity & Performance Assumptions

To evaluate the operational mechanics of such a platform without fabricating private internal telemetry, the study utilizes an **Explicit Illustrative Baseline**:

### Global Scale Hypotheses (For Capacity Modeling):
*   **Active Subscriber Profiles:** $300,000,000$ globally active profiles.
*   **Peak Global Concurrency:** $10\%$ of active profiles concurrently browsing or streaming at peak ($30,000,000$ concurrent sessions).
*   **Homepage Browse Request Frequency:** 1 full page generation request every $60$ seconds per active browsing session.
*   **Peak Homepage Request QPS:** 
    $$\text{Peak Browse QPS} = \frac{30,000,000 \text{ sessions} \times 0.20 \text{ (browsing ratio)}}{60 \text{ seconds}} \approx 100,000 \text{ QPS}$$
*   **Homepage Payload Size:** Average uncompressed JSON payload = $120$ KB; gzipped over wire = $24$ KB.
*   **Peak Homepage Ingress Bandwidth:** $100,000 \text{ QPS} \times 24 \text{ KB} \times 8 \approx 19.2 \text{ Gbps}$ of JSON API traffic across all AWS edge regions.
*   **Concurrent Video Streams:** $25,000,000$ simultaneous video playbacks at peak.
*   **Average Video Bitrate:** Weighted average across SD, HD (1080p), and 4K UHD = $4.5$ Mbps ($562.5$ KB/sec).
*   **Peak Aggregate Video Delivery Bandwidth:** 
    $$\text{Peak Video Bandwidth} = 25,000,000 \times 4.5 \text{ Mbps} = 112.5 \text{ Tbps (Terabits per second)}$$
*   **Open Connect Appliance Sizing:** Each modern flash OCA serves $100$ Gbps ($0.1$ Tbps) of video traffic:
    $$\text{Minimum Active Flash OCAs Globally} = \frac{112.5 \text{ Tbps}}{0.1 \text{ Tbps/OCA}} \approx 1,125 \text{ active edge appliances at peak}$$

---

## 4. Sensitivity & Failure Bounds

*   **Sensitivity to Browse Latency:** If online ranking latency degrades from $35$ms to $>75$ms, the system triggers circuit breaking and returns cached precomputed offline rows.
*   **Sensitivity to Cache Hit Ratio:** If OCA edge cache hit ratio drops from $95\%$ to $80\%$, upstream ISP transit peering links experience a $4\times$ traffic surge, triggering automated fallback to regional storage tiers.
