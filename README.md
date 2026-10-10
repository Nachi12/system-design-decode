# System Architecture Decoded

An authoritative, documentation-first engineering research monograph investigating how planetary-scale systems are architected, scaled, and operated.

---

## 📚 Portfolio Navigation & Quick Links

- **Engineering Research Monograph:** [http://localhost:5173/](http://localhost:5173/)
  - [Netflix Case Study: Personalization & Open Connect CDN](http://localhost:5173/netflix)
  - [BookMyShow-Like Ticketing System: Concurrency Reference Architecture](http://localhost:5173/bookmyshow)
  - [Architectural Synthesis & Comparative Atlas](http://localhost:5173/comparison)
  - [Architecture Decision Records (ADRs)](http://localhost:5173/adrs)
  - [Capacity & Traffic Models](http://localhost:5173/capacity)
  - [Source Register & Citations](http://localhost:5173/references)
- **Interactive Concurrency Workbench:** [http://localhost:5173/seat-lock-lab](http://localhost:5173/seat-lock-lab)
  - *SeatLock Lab:* Executable reference implementation of concurrent seat leasing under Redis coordination and PostgreSQL durable ACID row-level locking.

---

## ⚡ SeatLock Lab: Overview & Invariant

SeatLock Lab verifies the foundational distributed systems invariant:
> **"For a given show, a seat cannot have two valid concurrent holds, and a confirmed seat cannot be reserved again."**

It models a high-contention flash sale using a **Two-Tier Hybrid Architecture**:
1. **Tier 1 (Redis 7 Ingress Coordination):** Fast-rejects 99.9% of contending requests in &lt;1ms using atomic `SET key token NX PX 5000` locks, protecting the database connection pool.
2. **Tier 2 (PostgreSQL 16 Durable ACID):** Serializes inventory mutations inside transactions with `SELECT ... FOR UPDATE`, checks unexpired hold state, increments monotonic fencing tokens, and writes immutable audit logs.
3. **Safe Lock Release (Lua CAS):** Releases Redis locks via atomic compare-and-delete Lua scripts to prevent deleting expired locks owned by subsequent workers.

---

## 🛠️ Local Environment & Setup

### Prerequisites
- Node.js 20+
- PostgreSQL 16+ (running on `localhost:5432`)
- Redis 7+ (running on `localhost:6379`)

### Installation & Initialization
```bash
# 1. Install root and backend dependencies
npm install
npm --prefix apps/seat-lock-api install

# 2. Configure environment variables (apps/seat-lock-api/.env)
# Review apps/seat-lock-api/.env to match your local PostgreSQL/Redis credentials

# 3. Run database migrations and seed venue topology (1 show, 40 seats)
npm run api:migrate
npm run api:seed
```

---

## 🚀 Running the Services

### Development Mode

Terminal 1 — Backend API (port `3001`):
```bash
npm run api:dev
```

Terminal 2 — Frontend Research Portfolio (port `5173`):
```bash
npm run dev
```

Visit [http://localhost:5173/seat-lock-lab](http://localhost:5173/seat-lock-lab) in your browser.

### Stopping the Services
Press `Ctrl+C` in the respective terminal windows, or run:
```bash
lsof -ti :3001,5173 | xargs kill -9
```

---

## 🧪 Verification & Test Suites

### Backend Concurrency Quality Gates (9 Gates)
```bash
npm run api:test
```

### Comprehensive 10-Point Engineering Audit (25+ Concurrent Requests & Direct DB Check)
```bash
npm run api:audit
```

### Frontend Type-Checking & Production Build
```bash
# Strict type check without emitting
npx tsc --noEmit

# Static production build
npm run build
```

---

## 🌐 API Endpoints Reference

| Method | Endpoint | Description | Invariant Mechanism |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Service and dependency health status | Verifies PostgreSQL & Redis ping |
| `GET` | `/api/shows` | List all screenings | Public read |
| `GET` | `/api/shows/:id/seats` | Fetch 40-seat venue status | Reclaims expired holds in-flight |
| `POST` | `/api/shows/:id/holds` | Request an ephemeral hold | Redis SET NX + PG `FOR UPDATE` |
| `GET` | `/api/holds/:id` | Inspect reservation lease | Direct database lookup |
| `POST` | `/api/holds/:id/confirm` | Confirm booking permanently | Fencing token validation |
| `POST` | `/api/holds/:id/release` | Explicitly release hold lease | Returns seat to `AVAILABLE` |
| `POST` | `/api/shows/:id/reset` | Reset venue to initial clean state | Guarded by `NODE_ENV !== 'production'` |

---

## 📖 Deep-Dive Documentation

Detailed documentation for SeatLock Lab is available in the [`docs/seatlock-lab/`](docs/seatlock-lab/) directory:
- [System Architecture & ADRs](docs/seatlock-lab/ARCHITECTURE.md)
- [Database Schema & Consistency Model](docs/seatlock-lab/DATABASE.md)
- [REST API Contract Specifications](docs/seatlock-lab/API.md)
- [Concurrency & Race-Condition Analysis](docs/seatlock-lab/CONCURRENCY.md)
- [Failure Modes & Fault-Tolerance Matrix](docs/seatlock-lab/FAILURE-MODES.md)
- [Local Environment Setup Guide](docs/seatlock-lab/LOCAL-SETUP.md)
- [Audit Results & Verification Log](docs/seatlock-lab/TEST-RESULTS.md)

---

## ⚠️ Known Limitations & Educational Scope

1. **Learning Reference Architecture:** SeatLock Lab is an educational reference implementation demonstrating distributed concurrency and locking patterns. It is not a commercial, production-ready ticketing platform.
2. **Payment Processing:** Payment settlement is intentionally simulated (no real payment gateway webhooks or charge cards). Holds confirm directly via `POST /api/holds/:id/confirm`.
3. **Authentication:** Demo customers (`demo-customer-alpha`, `demo-customer-beta`) are simulation handles to model concurrent actors. In production, requests must be authenticated via verified JWTs and RBAC tokens.
4. **Rate Limiting & Abuse Protection:** Production deployments require edge WAF / Cloudflare rate-limiting and CAPTCHA challenges to prevent bot-driven ticket scalping.
