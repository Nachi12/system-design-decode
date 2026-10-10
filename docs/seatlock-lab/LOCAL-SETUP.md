# SeatLock Lab: Local Environment Setup & Run Guide

**Project:** System Architecture Decoded — Executable Engineering Monograph  
**Module:** SeatLock Lab Local Execution Guide  

---

## 1. Prerequisites

- **Node.js:** v20.0.0 or higher.
- **PostgreSQL:** v15 or v16 (running locally on port `5432`).
- **Redis:** v7.0 or higher (running locally on port `6379`).
- **Package Manager:** `npm` (included with Node.js).

---

## 2. Environment Configuration

### Backend Configuration (`apps/seat-lock-api/.env`)
Create `apps/seat-lock-api/.env` if not present:

```ini
# Server Configuration
PORT=3001
NODE_ENV=development

# PostgreSQL Configuration
PGHOST=localhost
PGPORT=5432
PGDATABASE=seatlock_db
PGUSER=postgres
PGPASSWORD=
PGSSL=false

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_LOCK_TTL_MS=5000

# Reservation Leasing Configuration
HOLD_DURATION_SECONDS=60
ENABLE_REDIS_FALLBACK=true

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000
```

---

## 3. Database Initialization & Seeding

Run schema migrations and initialize the deterministic screening and 40-seat venue:

```bash
# 1. Run PostgreSQL migrations (creates tables, indexes, constraints)
npm run api:migrate

# 2. Seed deterministic show and 40 venue seats
npm run api:seed
```

---

## 4. Starting the Application

### Option A: Running Both Frontend and Backend (Recommended)

Terminal 1 (Backend API on `:3001`):
```bash
npm run api:dev
```

Terminal 2 (Frontend Dev Server on `:5173`):
```bash
npm run dev
```

Open your browser to:
- **Research Case Study:** `http://localhost:5173/bookmyshow`
- **SeatLock Lab Workbench:** `http://localhost:5173/seat-lock-lab`

---

## 5. Verification Commands

### Concurrency Quality Gate Suite
Runs the 9 core concurrency quality gate tests:
```bash
npm run api:test
```

### Comprehensive 10-Point Engineering Audit
Executes 25+ simultaneous requests, tests expiry, idempotent retries, Lua CAS safety, and queries PostgreSQL durable state after each test:
```bash
npm run api:audit
```

### Frontend Type-Checking & Production Build
```bash
# Type check without emitting
npx tsc --noEmit

# Production bundle build
npm run build
```

---

## 6. Testing Failure Scenarios Locally

### Testing PostgreSQL-Only Mode (Bypass Redis Ingress)
In the SeatLock Lab UI, toggle the top **Mode** button to **"PostgreSQL-Only"**, or send the header:
```bash
curl -X POST http://localhost:5173/api/shows/00000000-0000-0000-0000-000000000001/holds \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: test-pg-only-1" \
  -H "X-Skip-Redis: true" \
  -d '{"seatId":"<uuid>","customerId":"demo-customer-alpha"}'
```

### Testing Venue Reset
Click the **"Reset Demo"** button on the UI and confirm the modal, or execute:
```bash
curl -X POST http://localhost:5173/api/shows/00000000-0000-0000-0000-000000000001/reset
```
*Note: Destructive resets are strictly blocked when `NODE_ENV=production`.*
