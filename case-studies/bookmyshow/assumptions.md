# Engineering Assumptions & Capacity Model: BookMyShow Ticketing System

**Monograph:** System Architecture Decoded  
**Topic:** Case Study 02 — High-Demand Ticketing & Concurrency  
**Canonical Directory:** `case-studies/bookmyshow/assumptions.md`  
**Classification System:** 3-Tier Evidentiary Framework (`DOCUMENTED`, `INFERENCE`, `REFERENCE`)

---

## 1. Epistemological Boundaries & Disclaimers

> [!IMPORTANT]
> **No Access to Proprietary Internals:**  
> BookMyShow has not publicly open-sourced its internal microservices, private database schemas, or low-level concurrency algorithms. The quantitative numbers, traffic volumes, and capacity calculations presented below are **explicitly illustrative engineering models** designed to demonstrate how a Staff/Principal Systems Architect sizes and architects a high-demand ticketing engine.  
> They are never claimed to be BookMyShow's confidential financial or operational metrics.

---

## 2. Scale & Workload Profiles

We model two distinct operational regimes:
1. **Normal Operational State (Steady-State Cinema & Event Browsing):** Typical weekday evening movie ticket sales across major metropolitan areas.
2. **Flash-Sale / High-Demand On-Sale (Stadium Concert / Mega Blockbuster):** A stadium concert (e.g., 60,000 seats) or world cup cricket match where ticket sales open at an exact announced second (e.g., 12:00:00 PM).

### Workload Comparison Matrix:

| Operational Metric | Steady-State (Normal) | Flash-Sale / High-Demand Surge | Factor / Ratio |
| :--- | :--- | :--- | :--- |
| **Active Concurrent Users** | 50,000 users | 2,000,000+ users queued | 40x |
| **Catalog Browse QPS (Read)** | 5,000 QPS | 150,000+ QPS | 30x |
| **Seat Map Availability Reads** | 1,500 QPS | 80,000 QPS | ~53x |
| **Seat Hold Requests (Write Attempts)** | 150 QPS | 50,000 QPS at $t = 0$ | 333x |
| **Inventory Size (Per Event)** | 250 seats (Auditorium) | 60,000 seats (Stadium Arena) | 240x |
| **Contention Ratio (Requests per Seat)** | $\approx 0.05$ | $\ge 250$ requests per premium seat | $5,000\times$ contention |
| **Checkout Timer (Hold TTL)** | 10 minutes (600s) | 8–10 minutes (480–600s) | Invariant |
| **Payment Settlement Latency** | 2–5 seconds | 15–120 seconds (user OTP entry) | Human bottleneck |
| **Hold Abandonment Rate** | 15% | 35% (payment drops, price hesitation) | 2.3x |

---

## 3. Mathematical Capacity Formulas & Contention Mechanics

### 3.1 Read vs. Write Ratio
Let $R$ be the seat map read requests per second and $W$ be the seat hold write attempts per second.
During normal browsing:
$$\text{Ratio}_{\text{normal}} = \frac{R}{W} = \frac{1,500}{150} = 10:1$$

During a flash sale opening:
$$\text{Ratio}_{\text{surge}} = \frac{R}{W} = \frac{80,000}{50,000} \approx 1.6:1$$
*Explanation:* Users repeatedly refresh the seat map and immediately click "Hold" on the most desirable seats within a few milliseconds.

### 3.2 Seat Contention at $t = 0$ (Amdahl's Law at the Data Layer)
Consider a premium front-row category consisting of $S_{\text{cat}} = 100$ seats.  
Within the first 500 milliseconds of ticket sales opening, $N = 25,000$ concurrent users click these 100 seats.
$$\text{Contention Intensity} = \frac{N}{S_{\text{cat}}} = \frac{25,000}{100} = 250 \text{ concurrent claims per seat}$$

*Mathematical Implication:*
*   Exactly 100 claims can succeed; 24,900 claims **must fail**.
*   If all 25,000 requests are routed directly to a PostgreSQL database via `SELECT ... FOR UPDATE`, the database must serialize 250 transactions per row across 100 rows simultaneously.
*   PostgreSQL row-level lock queues balloon, memory locks consume the shared buffer pool, query latencies spike from 3ms to $> 15,000$ms, and connection pools exhaust, causing a total cascade failure.
*   **Architectural Mandate:** Mutual exclusion must be executed **in-memory** (sub-2ms single-threaded Redis Lua CAS) to shed the 24,900 failing requests before they ever touch the relational database.

### 3.3 Active Holds & Memory Sizing
Let $S_{\text{held}}$ be the maximum concurrently held seats across all events during peak operations.  
Assume an extreme peak of 200,000 simultaneously active seat holds across the entire platform.
Each Redis seat hold key stores:
*   Key: `lock:{show_id}:{seat_id}` (approx. 40 bytes)
*   Value: JSON string containing `{userId, holdToken, expiresAt, categoryId}` (approx. 160 bytes)
*   Total raw memory per key: $\approx 200$ bytes.
*   With Redis metadata and dictionary overhead: $\approx 500$ bytes per key.

$$\text{Total Memory} = 200,000 \times 500 \text{ bytes} = 100 \text{ MB}$$

*Engineering Takeaway:* The entire ephemeral seat-hold working set for the entire platform fits comfortably in **less than 200 Megabytes of RAM**. The bottleneck is not memory volume, but **atomic CPU instruction serialization throughput** and **network bandwidth**.

### 3.4 Database Write Throughput & Connection Pool Limits
*   A single AWS Aurora PostgreSQL primary writer instance (`db.r6g.8xlarge` with 32 vCPUs) can sustain approximately 3,000 to 5,000 complex ACID write transactions per second with sub-10ms commit latency.
*   Standard PostgreSQL connection limit: `max_connections = 1,000`. Direct connections from 500 container pods will instantly overwhelm Postgres.
*   **Mandatory Component:** Connection pooler (PgBouncer or AWS RDS Proxy) maintaining a multiplexed pool of 100–200 open server connections to the primary writer.
*   **Load Shedding Invariant:** Because only successful in-memory seat holds (at most 60,000 seats over the entire sale) require database hold records, the database write throughput is bounded by the number of successful holds, not the millions of attempted clicks.

---

## 4. Operational Failure Scenarios Modeled

1.  **Split-Brain / Double Allocation Risk:** Two users receive confirmation receipts for Seat G-14.
    *   *Hard Mitigation:* Enforce a physical database composite constraint:
        ```sql
        CREATE UNIQUE INDEX idx_unique_confirmed_seat 
        ON bookings (show_id, seat_id) 
        WHERE status = 'CONFIRMED';
        ```
    *   No matter what happens in the cache, API gateway, or network layer, the database engine physically rejects the second `INSERT` / `UPDATE`.
2.  **Payment Gateway Webhook Loss / Delays:** Gateway takes money from customer, but webhook fails due to a network timeout.
    *   *Hard Mitigation:* Background Reconciliation Worker polls the Payment Gateway API (`GET /v1/payments/{payment_id}`) for any booking lingering in `PAYMENT_PENDING` longer than 5 minutes.
3.  **Abandoned Checkout Timer Expiration:** Customer holds 4 seats, enters checkout, but closes browser window or loses battery.
    *   *Hard Mitigation:* Redis TTL automatically purges the in-memory key after 600 seconds. An asynchronous Expiry Worker periodically queries `WHERE status = 'HELD' AND expires_at < NOW()` to release the inventory row and notify the third-party cinema POS.
