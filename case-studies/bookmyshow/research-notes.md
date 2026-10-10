# Research Notes: BookMyShow-Like Ticketing System

**Case Study Title:** BookMyShow-Like Ticketing System — Proposed Reference Architecture  
**Subtitle:** Investigating High-Demand Concurrency, Distributed Seat Holds, and Payment Reliability at Scale  
**Status:** Canonical Engineering Research Notes  
**Lead Researcher:** Principal Systems Architecture Researcher  
**Last Updated:** October 2026  

---

## 1. Executive Summary & Epistemological Boundaries

These research notes document the technical investigation into online event ticketing and seat reservation systems at high scale, using India's premier entertainment ticketing platform—**BookMyShow**—as an illustrative archetype.

### Strict Evidentiary Framework:
*   `[Publicly Documented]` (Emerald): Information confirmed by primary public sources (corporate infrastructure case studies, Databricks engineering publications, external cinema software documentation such as Vista Group Connect APIs, and user-facing mobile app behaviors like the 8–10 minute checkout countdown timer).
*   `[Reasoned Inference]` (Amber): Deductions synthesized from physical hardware limits, CAP theorem boundaries, database transaction isolation semantics, and network failure modes.
*   `[Proposed Reference Design]` (Violet): An industrial-grade architecture engineered specifically for this research portfolio. Because BookMyShow does not publish its proprietary internal microservices, lock engines, or source code, we explicitly mark all proposed transactional algorithms, Redis Lua scripts, database schemas, and Saga coordinators as our proposed reference design rather than BookMyShow's proprietary code.

---

## 2. Publicly Documented Footprint

### Source: Databricks Customer Case Study (2021)
*   **Title:** How BookMyShow Scales Real-time Analytics with Databricks and AWS
*   **Verified Fact:** BookMyShow's cloud footprint is hosted on **Amazon Web Services (AWS)**. It leverages **Databricks Delta Lake**, Amazon S3, and Amazon Redshift to ingest and process millions of analytical signals daily.
*   **Takeaway:** Analytical pipelines (clickstream, recommendation, fraud scoring) are asynchronously decoupled from operational transactional booking engines to prevent analytics queries from starving online transaction processing (OLTP) database pools.

### Source: Vista Cinema Box Office Software (Vista Group Connect API, 2023)
*   **Context:** BookMyShow does not operate cinema screens directly; for major multiplex chains (such as PVR INOX, Cinepolis), BookMyShow operates as an aggregator. The underlying inventory is managed by cinema Point-of-Sale (POS) box office systems, predominantly Vista Cinema Software.
*   **Verified Protocol:** The Vista Connect API defines a two-phase seat allocation workflow:
    1.  `HoldSeats`: A transient reservation that temporarily blocks seats at the physical cinema box office for a limited time-to-live (TTL, typically 8 to 10 minutes).
    2.  `CommitSeats` / `CompleteOrder`: The final transaction that confirms the sale once payment has been settled.
    3.  `CancelHold`: The compensating action to release held seats back to the public pool if payment fails or times out.
*   **Takeaway:** An aggregator ticketing architecture must coordinate a distributed Saga across internal state stores and remote, external third-party multiplex systems that exhibit unpredictable network latencies.

### Source: Observable Client-Side Application Behavior
*   **Verified Fact:** When a customer selects seats on the BookMyShow mobile application or web client, a visual countdown timer initiates (typically 8 to 10 minutes, or 480 to 600 seconds).
*   **Verified Fact:** During this countdown window, other concurrent users navigating to the same seat layout see those seats marked as unavailable (greyed out or marked in progress). If the timer expires without payment completion, the seats return to the available state within seconds.

---

## 3. The Core Concurrency Challenge: Non-Fungible Inventory Contention

In generic e-commerce (e.g., Amazon, Shopify), inventory items are **fungible**: if an order requests 2 units of a book, any 2 units from the warehouse fulfill the request. Concurrency can be resolved by decrementing a numeric quantity:
```sql
UPDATE inventory SET quantity = quantity - 2 WHERE item_id = 42 AND quantity >= 2;
```

In high-demand event ticketing, inventory is **strictly non-fungible**:
*   Every seat has a specific row, seat number, tier, and spatial coordinate (`Screen 4, Row F, Seat 12`).
*   Two customers cannot receive "any two seats"; they have selected identical seats.
*   During blockbuster releases or stadium concerts (e.g., Coldplay, cricket tournament finals), tens of thousands of concurrent users attempt to claim the exact same subset of premium seats within milliseconds of ticket sales opening.

### The Invariant
> **Fundamental Correctness Invariant:**  
> *For a specific show, a seat must not have two conflicting confirmed bookings.*

Any system failure that allows a double-booking violates physical reality (two human beings cannot occupy the same physical chair) and results in severe reputational damage, operational chaos at the venue, and financial refunds.

---

## 4. Concurrency Alternatives Evaluated

### Option 1: Pure Database Transactions with Conditional Updates
*   **Mechanism:** Direct execution of `UPDATE seat_inventory SET status = 'HELD', hold_expires_at = NOW() + INTERVAL '10 min', user_id = :user WHERE show_id = :show AND seat_id = :seat AND status = 'AVAILABLE';`
*   **Pros:** Enforced directly by ACID RDBMS engine; zero cache invalidation lag.
*   **Cons:** Under 50,000 requests/sec, the database connection pool exhausts in seconds. Row-level lock contention on contested rows creates massive query queueing, thread context switching, and transaction deadlocks.

### Option 2: Optimistic Concurrency Control (OCC) with Version Numbers
*   **Mechanism:** `UPDATE seat_inventory SET status = 'HELD', version = version + 1 WHERE show_id = :show AND seat_id = :seat AND version = :read_version;`
*   **Pros:** Avoids persistent database row locks.
*   **Cons:** Under high contention, 99.9% of concurrent write transactions abort and fail. In flash-sale scenarios, optimistic concurrency control suffers from massive write thrashing and wasted CPU cycles.

### Option 3: In-Memory Ephemeral Locks (Redis Lua CAS) with Durable Database Constraints (Proposed Reference Design)
*   **Mechanism:** 
    1. Seat holds are serialized at the memory tier using single-instance Redis running an atomic Lua script (`Compare-And-Swap`).
    2. Redis processes commands in a single-threaded event loop, granting sub-2ms mutual exclusion and assigning a monotonically incremented **fencing token**.
    3. Once held in memory, a background reservation record is persisted to a durable transactional database (PostgreSQL/Aurora) with a unique composite constraint `UNIQUE (show_id, seat_id)`.
    4. Upon payment completion, the durable database commits the booking atomically.
*   **Pros:** Protects core databases from traffic spikes; 50,000 QPS resolved in-memory with sub-5ms latency; hard database constraints guarantee final correctness.

---

## 5. Distributed Locking Pitfalls (The Martin Kleppmann Critique)

As demonstrated by distributed systems researcher Martin Kleppmann (*Designing Data-Intensive Applications*, and his technical discourse with Salvatore Sanfilippo):
*   A distributed cache lock (e.g., Redis `SET NX EX` or Redlock) **does not by itself guarantee correctness** in a distributed system.
*   **The GC Pause / Network Delay Hazard:**
    1. Client A acquires a lock on Seat F-12 with a 10-minute TTL.
    2. Client A experiences a long stop-the-world JVM/Node GC pause or network stall lasting 10 minutes and 1 second.
    3. The lock expires in Redis. Client B acquires the lock on Seat F-12.
    4. Client A wakes up, unaware that time has elapsed, and submits an order commit to the database.
*   **Mitigation in Our Reference Architecture:**
    1. **Fencing Tokens:** Every lock grant assigns a strictly monotonic token `token_id`. The database rejects any commit whose token is superseded.
    2. **Database Invariant as Ultimate Source of Truth:** The relational database schema enforces `UNIQUE (show_id, seat_id)` within the confirmed bookings table. The ephemeral cache acts as an **admission filter** to shed load; the durable database acts as the **correctness referee**.

---

## 6. Payment Reliability & Distributed Sagas

A ticket purchase spans three distinct boundaries:
1. Internal Reservation State (Internal Database).
2. Third-Party Payment Gateway (Razorpay, Stripe, PayU, Juspay).
3. Third-Party Cinema Point-of-Sale (Vista Connect / Box Office).

### Why Two-Phase Commit (2PC) Fails Here:
Two-Phase Commit requires all participating resource managers to hold locks until the coordinator decides. If a customer takes 3 minutes to approve an OTP, or if the bank's gateway stalls, 2PC holds database locks across external network hops. This leads to global lock starvation and cascading failure.

### Saga Orchestration Pattern:
Instead of 2PC, the reference architecture employs an **Orchestrated Saga**:
*   **Step 1:** Internal Hold (Redis Lua + DB hold record).
*   **Step 2:** Remote POS Hold (`Vista.HoldSeats`).
*   **Step 3:** Payment Intent Created with unique `Idempotency-Key`.
*   **Step 4 (Success):** Payment webhook received $\to$ Verify signature $\to$ Commit DB Booking $\to$ `Vista.CommitSeats` $\to$ Issue Ticket.
*   **Compensating Step (Failure/Timeout):** Payment failed or 10-minute TTL expired $\to$ Release Redis key $\to$ `Vista.CancelHold` $\to$ Mark internal hold as `EXPIRED`.

---

## 7. High-Demand Traffic Mitigation: Virtual Waiting Room

During major on-sales (e.g., Coldplay stadium concert with 100,000 seats and 13,000,000 queueing requests):
*   Directly allowing millions of concurrent requests into the seat selection map crashes the API gateway and cache clusters.
*   **Admission Control:** An edge-based **Virtual Waiting Room** (powered by Cloudflare Waiting Room or AWS Edge Token Bucket) queues users at the CDN boundary.
*   Users are metered into the interactive seat map at a controlled velocity matched to the database write capacity (e.g., 500 users admitted per second).
*   Seat layout availability is served from CDN/Varnish edge caches with short TTLs (1–2 seconds) to absorb 99% of read traffic.
