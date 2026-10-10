# SeatLock Lab: Executable Concurrency Reference Implementation
## Technical Specification & Implementation Plan (Phase 6)

**Project:** System Architecture Decoded  
**Extension:** SeatLock Lab (Executable Reference Demonstration)  
**Parent Case Study:** BookMyShow-Like Ticketing System — Proposed Reference Architecture  
**Primary Invariant:** *For a given show, a seat cannot have two valid concurrent holds, and a confirmed seat cannot be reserved again.*  
**Author:** Staff Distributed Systems Architect & Lead Software Researcher  
**Status:** Architecture Plan Approved for Implementation  

---

## 1. Component Architecture & Request Flow

SeatLock Lab is an educational, executable demonstration demonstrating how distributed locking in Redis and transactional row-level isolation in PostgreSQL coordinate to prevent double-booking anomalies under high concurrency.

### 1.1 High-Level Component Topology

```
+-----------------------------------------------------------------------------------+
|                            CLIENT TIER                                            |
|  +-------------------------------------+   +-----------------------------------+  |
|  |  Interactive Seat Grid (UI)         |   |  Simulated Race Burst Tester      |  |
|  |  (Visual hold countdowns & states)  |   |  (50 parallel concurrent workers) |  |
|  +-------------------------------------+   +-----------------------------------+  |
+------------------------------------------+----------------------------------------+
                                           | HTTP / REST (with Idempotency-Key)
                                           v
+-----------------------------------------------------------------------------------+
|                        APPLICATION TIER: Express (TypeScript)                     |
|  +---------------------+   +-----------------------+   +-----------------------+  |
|  | Validation & Schema |   | Redis Coordination    |   | PostgreSQL Unit of    |  |
|  | Sanitization        |   | Lock Manager          |   | Work / Transaction    |  |
|  +---------------------+   +-----------------------+   +-----------------------+  |
+------------------------------------+-------------------------------------+--------+
                                     |                                     |
               Short TTL (5,000ms)   |                                     | ACID Transaction
               Ingress Shield Lock   |                                     | (Row-Level FOR UPDATE)
                                     v                                     v
+----------------------------------------+   +--------------------------------------+
|            COORDINATION TIER           |   |            DURABLE TIER              |
|          Redis 7 (node-redis)          |   |          PostgreSQL 16 (pg)          |
|  - Key: lock:show:{id}:seat:{id}       |   |  - Table: seat_inventory             |
|  - Ingress collision shield            |   |  - Table: seat_holds                 |
|  - Monotonically unique worker lock    |   |  - Table: bookings                   |
|  - Safe Lua compare-and-swap release   |   |  - Fencing token validation          |
|                                        |   |  - Partial unique indexes            |
+----------------------------------------+   +--------------------------------------+
```

### 1.2 Reservation Hold Request Flow (Happy Path & Collision Path)

```
Client                   Express Handler            Redis (Ingress Lock)          PostgreSQL (Durable Store)
  |                             |                            |                                |
  |-- POST /api/holds --------->|                            |                                |
  |   (showId, seatId, userId)  |-- SET NX PX 5000 --------->|                                |
  |   [Idempotency-Key]         |   (lock:show:X:seat:Y)     |                                |
  |                             |<-- OK (Acquired) ----------|                                |
  |                             |                                                             |
  |                             |-- BEGIN TRANSACTION --------------------------------------->|
  |                             |-- SELECT * FROM seat_inventory WHERE ... FOR UPDATE ------->|
  |                             |<-- Row Returned (status: AVAILABLE) -----------------------|
  |                             |                                                             |
  |                             |-- INSERT INTO seat_holds (fencing_token = prev + 1) ------->|
  |                             |-- UPDATE seat_inventory SET status = 'HELD', ... ---------->|
  |                             |-- COMMIT -------------------------------------------------->|
  |                             |<-- Transaction Committed -----------------------------------|
  |                             |                                                             |
  |                             |-- EVAL Lua (Safe Release Lock) ->|                          |
  |                             |<-- Lock Released ----------------|                          |
  |                             |                                                             |
  |<-- 201 Created -------------|                                                             |
  |    (holdId, fencingToken,   |                                                             |
  |     expiresAt, 600s TTL)    |                                                             |
```

### 1.3 Collision Path (Simultaneous Race)

When 50 requests target the exact same seat simultaneously:
1. **Request 1:** Acquires Redis lock $\to$ Enters PostgreSQL transaction $\to$ Locks row via `FOR UPDATE` $\to$ Marks `HELD` $\to$ Commits $\to$ Releases Redis lock $\to$ Returns `201 Created`.
2. **Requests 2–15:** Hit Redis within the same 5ms window $\to$ `SET NX PX` returns `NULL` (collision detected) $\to$ Immediately rejected with `429 Too Many Requests` or `409 Conflict` without overwhelming PostgreSQL connection pool.
3. **Requests 16–50:** Attempt after Redis lock release $\to$ Enter PostgreSQL transaction $\to$ Acquire row lock $\to$ Query checks `status = 'HELD' AND hold_expires_at > NOW()` $\to$ Business rule fails $\to$ Rollback $\to$ Return `409 Conflict: Seat already held by another active user`.
4. **Invariant Outcome:** Exactly 1 hold created. Zero double-booking anomalies.

---

## 2. Division of Responsibilities: Express, Redis, and PostgreSQL

| Responsibility Dimension | Express Layer | Redis Coordination Layer | PostgreSQL Durable Layer |
| :--- | :--- | :--- | :--- |
| **Primary Role** | Stateless API Orchestrator & Request Validator | Fast-path Ingress Shield & Thundering Herd Protector | Authoritative System of Record & Invariant Arbiter |
| **Seat Ownership Authority** | None (ephemeral worker) | **None** (must not be sole guard against double-booking) | **Absolute Authority** (enforced by ACID transaction & relational constraints) |
| **Concurrency Mechanism** | Request queueing & connection pooling | Atomic `SET NX PX` / Lua Compare-And-Swap scripts | Row-level locks (`SELECT ... FOR UPDATE`) & Unique Constraints |
| **TTL / Expiry Scope** | Request timeout (e.g. 5,000ms SLA) | **Brief Coordination Lock TTL (3,000ms – 5,000ms)** | **Long-lived Seat Hold TTL (8 – 10 minutes stored in DB)** |
| **Failure Mode Resilience** | If worker process dies, connection closes | If Redis crashes, PostgreSQL constraints still guarantee 0 double bookings | If DB fails, all operations abort cleanly (`ROLLBACK`) |

---

## 3. Database Entities, Indexes, Constraints, and State Transitions

### 3.1 Relational Schema Specification

#### 1. `shows`
```sql
CREATE TABLE shows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    auditorium_name VARCHAR(100) NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### 2. `seats`
```sql
CREATE TABLE seats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auditorium_name VARCHAR(100) NOT NULL,
    row_label VARCHAR(10) NOT NULL,
    seat_number INT NOT NULL,
    tier VARCHAR(20) NOT NULL DEFAULT 'STANDARD', -- 'VIP', 'PREMIUM', 'STANDARD'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_auditorium_seat UNIQUE (auditorium_name, row_label, seat_number)
);
```

#### 3. `seat_inventory`
```sql
CREATE TABLE seat_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    show_id UUID NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
    seat_id UUID NOT NULL REFERENCES seats(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE', -- 'AVAILABLE', 'HELD', 'CONFIRMED'
    current_hold_id UUID,
    fencing_token BIGINT NOT NULL DEFAULT 1,
    hold_expires_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_show_seat UNIQUE (show_id, seat_id),
    CONSTRAINT ck_inventory_status CHECK (status IN ('AVAILABLE', 'HELD', 'CONFIRMED'))
);

-- Index for rapid seatmap polling by show
CREATE INDEX idx_seat_inventory_show ON seat_inventory(show_id);
-- Partial index for active hold reclamation
CREATE INDEX idx_seat_inventory_expired_holds ON seat_inventory(show_id, hold_expires_at) 
WHERE status = 'HELD';
```

#### 4. `seat_holds`
```sql
CREATE TABLE seat_holds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    show_id UUID NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
    seat_id UUID NOT NULL REFERENCES seats(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    fencing_token BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'EXPIRED', 'CONVERTED', 'RELEASED'
    idempotency_key VARCHAR(128) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_hold_status CHECK (status IN ('ACTIVE', 'EXPIRED', 'CONVERTED', 'RELEASED'))
);

CREATE INDEX idx_seat_holds_user ON seat_holds(user_id);
```

#### 5. `bookings`
```sql
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    show_id UUID NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
    seat_id UUID NOT NULL REFERENCES seats(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    hold_id UUID REFERENCES seat_holds(id),
    fencing_token BIGINT NOT NULL,
    total_price_cents INT NOT NULL DEFAULT 1500,
    status VARCHAR(20) NOT NULL DEFAULT 'CONFIRMED',
    idempotency_key VARCHAR(128) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Hard database invariant: a seat can only have ONE confirmed booking per show!
    CONSTRAINT uq_show_seat_confirmed_booking UNIQUE (show_id, seat_id)
);
```

### 3.2 Seat State Machine

```
               +------------------------------------------------+
               |                                                |
               v                                                | (Hold Expires OR
      [ AVAILABLE ]                                             |  Explicit Release)
         |     ^                                                |
         |     |                                                |
         |     +------------------------------------------------+
         |
         | (Hold Request: Redis lock acquired +
         |  PostgreSQL row locked & updated with hold_expires_at)
         v
       [ HELD ]
         |
         | (Booking Confirmation:
         |  Valid holdId + matching fencingToken + NOW() <= hold_expires_at)
         v
    [ CONFIRMED ]  ====> TERMINAL STATE (Permanent invariant: Never re-held or double-booked)
```

---

## 4. Redis Coordination and Expiry Behavior

### 4.1 Ingress Coordination Lock
* **Key Format:** `lock:hold:show:{showId}:seat:{seatId}`
* **Value:** Random UUID representing the acquiring worker thread (`workerToken`).
* **Acquisition Semantics:**
  ```typescript
  const acquired = await redis.set(lockKey, workerToken, {
    NX: true, // Only set if not exists
    PX: 5000  // Expire automatically after 5000ms
  });
  ```
* **Release Semantics (Safe Compare-and-Swap Lua Script):**
  ```lua
  if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
  else
      return 0
  end
  ```
  *Why Lua CAS is required:* If a database transaction experiences unexpected latency exceeding 5,000ms, the Redis lock auto-expires and another worker might acquire it. Without Lua CAS checking `workerToken`, the first worker would inadvertently delete the second worker's lock!

### 4.2 Clear Separation of Two Different TTLs
1. **Redis Lock TTL (5 Seconds):** Prevents thundering herds from queuing up hundreds of blocking queries on the Postgres connection pool for the exact same seat simultaneously.
2. **PostgreSQL Seat Hold Expiry (10 Minutes):** The customer's actual checkout window. Stored persistently in PostgreSQL (`seat_inventory.hold_expires_at`).

---

## 5. API Endpoints and HTTP Status Codes

### 5.1 Endpoints Specification

| Method | Endpoint | Description | Request Headers / Body | Success Status | Error Statuses |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/shows` | List shows with auditorium metadata | None | `200 OK` | `500 Internal Error` |
| `GET` | `/api/shows/:showId/seats` | Real-time seat grid & statuses | None | `200 OK` | `404 Not Found` |
| `POST` | `/api/shows/:showId/holds` | Acquire 10-min ephemeral seat hold | `Idempotency-Key: <uuid>`<br>`{ seatId, userId }` | `201 Created` | `400 Bad Request`<br>`409 Conflict` (Seat held/confirmed)<br>`429 Too Many Requests` (Lock contended) |
| `POST` | `/api/shows/:showId/bookings` | Confirm booking for held seat | `Idempotency-Key: <uuid>`<br>`{ holdId, seatId, userId, fencingToken }` | `201 Created` | `400 Bad Request`<br>`404 Not Found`<br>`409 Conflict` (Hold expired/fencing mismatch) |
| `POST` | `/api/shows/:showId/holds/:holdId/release` | Explicitly abandon/release hold | `{ seatId, userId }` | `200 OK` | `404 Not Found`<br>`409 Conflict` |
| `POST` | `/api/lab/simulate-race` | Execute controlled concurrent race | `{ showId, seatId, concurrency: 25 }` | `200 OK` | `400 Bad Request` |
| `POST` | `/api/lab/reset` | Reset show inventory to `AVAILABLE` | `{ showId }` | `200 OK` | `404 Not Found` |

### 5.2 Error Response Format
All errors adhere to standard RFC 7807 Problem Details:
```json
{
  "error": "SEAT_ALREADY_HELD",
  "message": "Seat A-12 is currently held by another user. Hold expires in 412 seconds.",
  "code": 409,
  "seatId": "c8b41753-2947-4952-b1e7-76fa2b0b4623",
  "retryAfterMs": 412000
}
```

---

## 6. Idempotency and Concurrency Strategy

### 6.1 Idempotency Table & Safe Replays
1. The client supplies an `Idempotency-Key` header with each hold and booking request.
2. In PostgreSQL:
   - `seat_holds.idempotency_key` is unique.
   - `bookings.idempotency_key` is unique.
3. If network drops occur after the database commit but before the HTTP 201 response reaches the client, the client retries with the exact same `Idempotency-Key`.
4. The service catches unique constraint `23505` on `idempotency_key`, queries the existing record, and returns the previous successful result with header `X-Idempotent-Replay: true`.

### 6.2 Fencing Token Protocol
To protect against Martin Kleppmann's client-pause anomaly (e.g. Garbage Collection pause or long I/O delay during which a hold expires and is reassigned):
1. `seat_inventory` maintains a strictly increasing `fencing_token BIGINT`.
2. When a hold is granted, the fencing token is incremented and embedded in the `seat_holds` record and returned to the client (`fencingToken: 42`).
3. When the client confirms the booking, the confirmation query checks:
   ```sql
   UPDATE seat_inventory
   SET status = 'CONFIRMED', current_hold_id = NULL
   WHERE show_id = $1 AND seat_id = $2 
     AND current_hold_id = $3 
     AND fencing_token = $4
     AND (hold_expires_at IS NULL OR hold_expires_at >= NOW())
   RETURNING id;
   ```
4. If the hold expired and seat was held by someone else, the fencing token is now `43`. The query returns 0 rows, preventing stale confirmation!

---

## 7. Frontend Integration Plan

### 7.1 New Route: `/seatlock-lab`
* Registered in `src/App.tsx` via `React.lazy()` for zero penalty to existing page bundles.
* Linked in `src/components/layout/Navbar.tsx` with a distinctive `LAB` badge.

### 7.2 Linking Directly to BookMyShow Case Study
* In `src/pages/BookMyShowPage.tsx`:
  * **Chapter A (Problem Definition & Hard Invariants):** Prominent CTA banner: *"Test this invariant live in SeatLock Lab ->"*.
  * **Chapter E (Concurrency & Contention Analysis):** Deep link to the interactive race simulation comparing Redis vs. Postgres locking.
  * **Chapter F (Request & Failure Flows):** Deep link demonstrating the failure sequence flows (Flow B: Lock Contention, Flow C: Hold Expiration).

### 7.3 Lab UI Features
1. **Interactive Auditorium Map:** Visual layout of seats displaying dynamic state colors (Green: Available, Amber: Held with live countdown, Red: Confirmed).
2. **Interactive Single Reservation Flow:** Click seat $\to$ Hold acquired $\to$ 10-minute timer starts $\to$ Confirm Booking or Release Hold.
3. **Automated Concurrency Stress Tester:**
   * Select hot seat coordinate (e.g. `Seat E-10`).
   * Choose concurrency level (10, 25, or 50 simultaneous workers).
   * Click **"Dispatch Simultaneous Contention Burst"**.
   * Live timeline showing worker requests, Redis lock results, Postgres transaction latencies, and status code distribution (1 `201 Created`, $N-1$ `409 Conflict` / `429 Too Many Requests`).
   * Invariant Status: **`Zero Double-Bookings Verified (PASS)`**.
4. **Hybrid Mode (Static CDN vs. Live Backend):**
   * If local Express backend (`http://localhost:3001`) is running: connects via live REST calls.
   * If running on static hosting (Cloudflare/GitHub Pages) where backend is absent: automatically switches to a high-fidelity **In-Browser WebWorker Emulation Engine** executing the exact same algorithm so the portfolio remains 100% interactive and functional anywhere!

---

## 8. Test Scenarios, Startup Commands, and Verification Criteria

### 8.1 Automated Test Scenarios

| Test Case | Description | Expected Outcome | Verification Metric |
| :--- | :--- | :--- | :--- |
| **TC-01: Happy Path** | Single client reserves seat A-1 and confirms | 201 Created $\to$ 200 OK | Status = `CONFIRMED`, `bookings` count = 1 |
| **TC-02: Simultaneous Race (50 workers)** | 50 concurrent requests target seat B-5 | Exactly 1 success (201); 49 rejected (409/429) | `seat_inventory.status = 'HELD'`, exactly 1 hold row |
| **TC-03: Hold Expiration Reclamation** | Client holds seat with 3s TTL, waits 4s, 2nd client holds | 2nd client succeeds (201) with newer fencing token | `fencing_token = 2`, previous hold marked `EXPIRED` |
| **TC-04: Zombie Worker Rejection** | Client A attempts to confirm expired hold after Client B re-held | Client A rejected with 409 Conflict | Confirmation query returns 0 updated rows |
| **TC-05: Idempotent Replay** | Re-sending identical request with same `Idempotency-Key` | 2nd request returns 201 with identical hold ID | Zero duplicate rows created |

### 8.2 Startup Commands
```bash
# 1. Start Local Infrastructure (Docker Compose or Native Homebrew)
# Option A: Docker Compose
docker compose up -d

# Option B: Native macOS Homebrew (Already running on this machine!)
brew services start postgresql@16
brew services start redis

# 2. Run Database Migrations & Seed
npm run db:migrate
npm run db:seed

# 3. Start Express Backend
npm run server:dev
# Running at http://localhost:3001

# 4. Start Vite Frontend (concurrently)
npm run dev
# Running at http://localhost:5173

# 5. Run Concurrency Stress Test Suite
npm run test:concurrency
```

---

## 9. Local vs. Production Deployment Boundaries

```
+-----------------------------------------------------------------------------------------+
|                                    DEPLOYMENT MODES                                     |
+-----------------------------------------------------------------------------------------+
|  MODE 1: Full-Stack Local Development (Mac OS / Docker)                                 |
|  - Node.js 20 + Express server on port 3001                                            |
|  - Real PostgreSQL 16 database with row-level locks                                     |
|  - Real Redis 7 instance with Lua script locks                                          |
|  - Vite proxy forwarding /api/* to localhost:3001                                       |
|                                                                                         |
|  MODE 2: Static Portfolio Hosting (Cloudflare Pages / GitHub Pages / Vercel)            |
|  - 100% static client-side bundle in dist/                                              |
|  - SeatLock Lab UI automatically detects absence of backend API                         |
|  - Activates high-fidelity in-browser concurrency simulation mode                       |
|  - Preserves 100% explorable user experience without requiring persistent cloud servers |
+-----------------------------------------------------------------------------------------+
```

---

## 10. File Impact Analysis

### 10.1 Existing Files to be Modified
1. `src/App.tsx`: Add lazy-loaded route `/seatlock-lab` and navigation fallback.
2. `src/components/layout/Navbar.tsx`: Add `SeatLock Lab` to navigation items.
3. `src/pages/BookMyShowPage.tsx`: Add callout links in Chapters A, E, and F linking to `/seatlock-lab`.
4. `package.json`: Add scripts (`server:dev`, `server:build`, `db:migrate`, `db:seed`, `test:concurrency`).
5. `vite.config.ts`: Add `/api` proxy targeting `http://localhost:3001`.

### 10.2 New Files to be Created
1. `docs/seatlock-lab-plan.md` (This master plan document).
2. `docker-compose.yml` (PostgreSQL 16 & Redis 7 container orchestration).
3. `.env.example` (Safe environment variables template).
4. `server/package.json` (Backend dependencies: express, pg, redis, dotenv, cors).
5. `server/tsconfig.json` (Backend TypeScript configuration).
6. `server/src/index.ts` (Express server entry point).
7. `server/src/config/db.ts` (PostgreSQL connection pool & Redis client).
8. `server/src/db/migrations/001_init.sql` (Relational DDL: tables, indexes, constraints).
9. `server/src/db/migrate.ts` (Lightweight SQL migration runner using `pg`).
10. `server/src/db/seed.ts` (Show & seat layout seeder).
11. `server/src/services/lockService.ts` (Redis coordination lock with atomic Lua CAS).
12. `server/src/services/reservationService.ts` (PostgreSQL transactional hold, confirmation, release).
13. `server/src/routes/reservationRoutes.ts` (API routes and controller handlers).
14. `server/src/tests/concurrency.test.ts` (Node-based automated 50-worker race test).
15. `src/pages/SeatLockLabPage.tsx` (Interactive visual frontend lab and race simulation component).

---
*Specification approved by Principal Systems Architect. Implementation ready upon Phase 7 prompt.*
