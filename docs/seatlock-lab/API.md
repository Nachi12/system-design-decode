# SeatLock Lab: REST API Specification

**Base URL (Direct Backend):** `http://localhost:3001`  
**Base URL (Vite Proxy):** `http://localhost:5173/api`  
**Content-Type:** `application/json`  

---

## 1. Endpoints Summary

| Method | Path | Description | Coordination Invariant |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Service and dependency health status | Reports Postgres & Redis connectivity |
| `GET` | `/api/shows` | List all screenings | Public read |
| `GET` | `/api/shows/:showId/seats` | Fetch venue seat topology and live lease status | Reclaims expired holds in-flight |
| `POST` | `/api/shows/:showId/holds` | Request an ephemeral hold on a seat | Redis SET NX + Postgres FOR UPDATE |
| `GET` | `/api/holds/:holdId` | Inspect a specific reservation lease | Direct database lookup |
| `POST` | `/api/holds/:holdId/confirm` | Confirm an active unexpired hold | Fencing token validation |
| `POST` | `/api/holds/:holdId/release` | Explicitly release a hold lease | Flips seat to AVAILABLE immediately |
| `POST` | `/api/shows/:showId/reset` | Reset demo show topology to clean state | Protected by `NODE_ENV !== 'production'` |

---

## 2. Detailed Route Contracts

### 2.1 `GET /api/health`
Returns live health checks for backend services and dependencies.

**Response (HTTP 200 OK):**
```json
{
  "status": "HEALTHY",
  "service": "seat-lock-api",
  "timestamp": "2026-10-10T17:37:52.482Z",
  "uptimeSeconds": 758,
  "dependencies": {
    "postgres": "UP",
    "redis": "UP"
  },
  "coordinationMode": "REDIS_PROTECTED"
}
```

---

### 2.2 `GET /api/shows/:showId/seats`
Fetches all 40 venue seats for the specified screening.

**Parameters:**
- `showId` (`UUID`, path, required): Target screening ID.

**Response (HTTP 200 OK):**
```json
{
  "showId": "00000000-0000-0000-0000-000000000001",
  "totalSeats": 40,
  "availableCount": 38,
  "heldCount": 1,
  "confirmedCount": 1,
  "seats": [
    {
      "seatId": "98fc8833-01e0-43e5-8f78-57d324da6a00",
      "rowLabel": "B",
      "seatNumber": 5,
      "tier": "PREMIUM",
      "status": "HELD",
      "currentHoldId": "34d4b640-3739-44d3-bf15-70d43fe061c0",
      "remainingHoldSeconds": 54
    }
  ]
}
```

---

### 2.3 `POST /api/shows/:showId/holds`
Initiates an ephemeral seat hold lease.

**Headers:**
- `Idempotency-Key` (`string`, required): Unique client token guaranteeing idempotency.
- `X-Request-Id` (`string`, optional): Distributed tracing request ID.
- `X-Skip-Redis` (`string`, optional): Set to `true` to test direct PostgreSQL row-level isolation.

**Request Body:**
```json
{
  "seatId": "98fc8833-01e0-43e5-8f78-57d324da6a00",
  "customerId": "demo-customer-alpha",
  "customHoldDurationSeconds": 60
}
```

**Success Response (HTTP 201 Created):**
```json
{
  "hold": {
    "id": "34d4b640-3739-44d3-bf15-70d43fe061c0",
    "showId": "00000000-0000-0000-0000-000000000001",
    "seatId": "98fc8833-01e0-43e5-8f78-57d324da6a00",
    "customerId": "demo-customer-alpha",
    "idempotencyKey": "alpha-uuid-1",
    "status": "ACTIVE",
    "fencingToken": "2",
    "expiresAt": "2026-10-10T17:42:53.088Z",
    "createdAt": "2026-10-10T17:41:53.088Z",
    "remainingSeconds": 60
  },
  "seat": {
    "id": "98fc8833-01e0-43e5-8f78-57d324da6a00",
    "rowLabel": "B",
    "seatNumber": 5,
    "tier": "PREMIUM",
    "status": "HELD"
  },
  "isIdempotentReplay": false,
  "coordinationMode": "REDIS_PROTECTED",
  "executionTrace": [
    { "step": "VALIDATE_INPUT", "status": "OK", "durationMs": 0 },
    { "step": "REDIS_COORDINATION_LOCK", "status": "ACQUIRED", "durationMs": 11 },
    { "step": "PG_TRANSACTION", "status": "BEGIN", "durationMs": 11 },
    { "step": "PG_ROW_LOCK", "status": "ACQUIRED_FOR_UPDATE", "durationMs": 13 },
    { "step": "PG_TRANSACTION", "status": "COMMITTED", "durationMs": 24 },
    { "step": "REDIS_COORDINATION_LOCK", "status": "RELEASED_SAFELY", "durationMs": 28 }
  ]
}
```

**Idempotent Replay Response (HTTP 200 OK):**
```json
{
  "hold": { ... },
  "isIdempotentReplay": true,
  "coordinationMode": "POSTGRES_FALLBACK",
  "executionTrace": [
    { "step": "VALIDATE_INPUT", "status": "OK" },
    { "step": "IDEMPOTENCY_CHECK", "status": "REPLAY_FOUND" }
  ]
}
```

**Conflict Rejection (HTTP 409 Conflict - Redis Contention):**
```json
{
  "error": "SEAT_LOCK_CONTENDED",
  "message": "A concurrent hold request for this seat is actively in flight. Please retry shortly.",
  "statusCode": 409,
  "requestId": "req-alpha-1",
  "coordinationMode": "REDIS_PROTECTED",
  "executionTrace": [
    { "step": "VALIDATE_INPUT", "status": "OK", "durationMs": 0 },
    { "step": "REDIS_COORDINATION_LOCK", "status": "CONTENDED", "durationMs": 14 }
  ]
}
```

**Conflict Rejection (HTTP 409 Conflict - Confirmed Seat):**
```json
{
  "error": "SEAT_ALREADY_CONFIRMED",
  "message": "Seat B-5 is already confirmed and purchased.",
  "statusCode": 409,
  "requestId": "0a812f58-d40a-46c5-b86e-ab0292dbf8f5",
  "coordinationMode": "REDIS_PROTECTED",
  "seat": { "id": "...", "rowLabel": "B", "seatNumber": 5, "status": "CONFIRMED" },
  "executionTrace": [ ... ]
}
```

---

### 2.4 `POST /api/holds/:holdId/confirm`
Permanently converts an active hold lease to `CONFIRMED`.

**Request Body:**
```json
{
  "customerId": "demo-customer-alpha"
}
```

**Response (HTTP 200 OK):**
```json
{
  "holdId": "34d4b640-3739-44d3-bf15-70d43fe061c0",
  "status": "CONFIRMED",
  "showId": "00000000-0000-0000-0000-000000000001",
  "seatId": "98fc8833-01e0-43e5-8f78-57d324da6a00",
  "customerId": "demo-customer-alpha",
  "isIdempotentReplay": false,
  "message": "Seat confirmed successfully (simulated booking completed without payment charges)."
}
```

---

### 2.5 `POST /api/shows/:showId/reset`
Resets venue inventory, deleting all holds and audit events.

**Security:** Guarded by `NODE_ENV !== 'production'`. Returns `403 Forbidden` in production environments.

**Response (HTTP 200 OK):**
```json
{
  "success": true,
  "showId": "00000000-0000-0000-0000-000000000001",
  "message": "Show seat inventory, active holds, and audit events successfully reset to initial available state."
}
```
