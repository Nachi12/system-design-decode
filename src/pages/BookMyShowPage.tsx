import React, { useState } from 'react';
import { EvidenceBadge } from '../components/editorial/EvidenceBadge';
import { CalloutNote } from '../components/editorial/CalloutNote';
import { ArchitectureCanvas } from '../components/diagram/ArchitectureCanvas';
import { MermaidDiagram } from '../components/diagram/MermaidDiagram';
import { 
  BMS_DIAGRAM_TITLE,
  BMS_DIAGRAM_EXPLANATION,
  BMS_NODES,
  BMS_EDGES 
} from '../data/bookmyshowDiagram';
import { BMS_ADRS } from '../data/bookmyshowAdrData';
import { Link } from 'react-router-dom';
import { 
  Layers, 
  ArrowRight, 
  Activity, 
  Calculator, 
  Compass, 
  FileCode, 
  ShieldCheck, 
  ExternalLink, 
  Sliders,
  AlertTriangle,
  Lock,
  RotateCcw,
  CheckCircle2,
  Zap,
  Server,
  FlaskConical
} from 'lucide-react';

export const BookMyShowPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState('chapter-a');

  // =========================================================================
  // MERMAID DIAGRAMS DEFINITIONS
  // =========================================================================

  // 1. Domain ER Class Diagram (LLD)
  const lldDomainClassChart = `
classDiagram
    direction TB
    class Show {
        +UUID id
        +UUID movieId
        +UUID venueId
        +UUID auditoriumId
        +DateTime startTime
        +DateTime endTime
        +ShowStatus status
        +String baseCurrency
    }

    class Auditorium {
        +UUID id
        +UUID venueId
        +String name
        +Int totalCapacity
    }

    class Seat {
        +UUID id
        +UUID auditoriumId
        +String rowLabel
        +Int seatNumber
        +SeatTier tier
        +JSON gridCoordinates
    }

    class SeatInventory {
        +UUID id
        +UUID showId
        +UUID seatId
        +InventoryStatus status
        +UUID currentHoldId
        +BigInt version
    }

    class SeatHold {
        +UUID id
        +UUID showId
        +UUID[] seatIds
        +UUID userId
        +BigInt fencingToken
        +HoldStatus status
        +DateTime heldAt
        +DateTime expiresAt
        +String vistaReservationId
    }

    class Booking {
        +UUID id
        +String orderNumber
        +UUID userId
        +UUID showId
        +UUID[] seatIds
        +BigInt totalAmountCents
        +BookingStatus status
        +String idempotencyKey
        +DateTime createdAt
        +DateTime confirmedAt
    }

    class PaymentAttempt {
        +UUID id
        +UUID bookingId
        +String gateway
        +String gatewayTransactionId
        +String idempotencyKey
        +BigInt amountCents
        +PaymentStatus status
        +Boolean signatureVerified
    }

    class Ticket {
        +UUID id
        +UUID bookingId
        +UUID seatId
        +String qrSignature
        +TicketStatus entryStatus
        +DateTime issuedAt
    }

    Auditorium "1" *-- "many" Seat : contains
    Show "1" --> "1" Auditorium : hosted in
    Show "1" *-- "many" SeatInventory : tracks
    Seat "1" -- "1" SeatInventory : references
    SeatHold "1" --> "many" SeatInventory : reserves
    Booking "1" --> "1" SeatHold : converts
    Booking "1" *-- "many" PaymentAttempt : attempts
    Booking "1" *-- "many" Ticket : issues
  `;

  // 2. Booking and Payment Lifecycle State Chart
  const seatLifecycleStateChart = `
stateDiagram-v2
    [*] --> AVAILABLE: Show Initialized

    AVAILABLE --> HELD: Hold Request (Atomic Lua CAS)
    note right of HELD: 10-Minute Ephemeral TTL<br/>Fencing Token Issued<br/>Vista HoldSeats Initiated

    HELD --> AVAILABLE: 10m TTL Expired / User Cancel
    HELD --> PAYMENT_PENDING: Checkout Initiated (Payment Intent Created)

    PAYMENT_PENDING --> CONFIRMED: Gateway Webhook Verified (HMAC Signature OK)
    note right of CONFIRMED: PostgreSQL ACID Commit<br/>UNIQUE (show_id, seat_id)<br/>Vista CommitSeats Dispatched

    PAYMENT_PENDING --> AMBIGUOUS_TIMEOUT: HTTP 504 Gateway Timeout
    AMBIGUOUS_TIMEOUT --> CONFIRMED: Reconciliation Worker Polls Gateway (Payment Captured)
    AMBIGUOUS_TIMEOUT --> FAILED: Reconciliation Worker Confirms Gateway Failure

    PAYMENT_PENDING --> FAILED: Card Declined / Insufficient Funds
    FAILED --> AVAILABLE: Compensating Release (Purge Lock + Cancel Vista)

    CONFIRMED --> TICKET_ISSUED: Outbox CDC Publishes to Kafka
    TICKET_ISSUED --> [*]: Signed QR Code Sent to Customer
  `;

  // 3. Flow A: Viewing Available Seats
  const seqFlowA = `
sequenceDiagram
    autonumber
    actor Customer as Customer Client
    participant GW as API Edge Gateway
    participant Catalog as Show Catalog Service
    participant Cache as Seat Map Read Cache (Redis/Varnish)
    participant Replica as PostgreSQL Read Replica

    Customer->>GW: GET /shows/{showId}/seatmap
    GW->>Catalog: Forward read request
    Catalog->>Cache: GET seatmap_bitmap:{showId}
    
    alt Cache Hit (p99 < 2ms)
        Cache-->>Catalog: Return compressed seat availability array
    else Cache Miss / Invalidation
        Catalog->>Replica: SELECT seat_id, status FROM seat_inventory WHERE show_id = :id
        Replica-->>Catalog: Return seat states
        Catalog->>Cache: SETEX seatmap_bitmap:{showId} 2s (Binary Bitmap)
    end

    Catalog-->>GW: Return 200 OK (Seat Coordinates + Availability Tiers)
    GW-->>Customer: Render interactive visual seat map (Green=Open, Grey=Held)
  `;

  // 4. Flow B: Acquiring a Temporary Seat Hold
  const seqFlowB = `
sequenceDiagram
    autonumber
    actor Customer as Customer Client
    participant GW as API Gateway & Waiting Room
    participant Orch as Booking Orchestrator (Saga)
    participant Redis as Ephemeral Lock (Redis Lua)
    participant DB as Aurora PostgreSQL Writer
    participant Vista as Cinema Multiplex POS (Vista)

    Customer->>GW: POST /shows/{showId}/holds (Seats: [F12, F13], UserId: u_902)
    GW->>Orch: Forward hold command
    
    Orch->>Redis: EVAL seat_hold.lua (showId, [F12, F13], u_902, TTL=600s)
    Note over Redis: Single-threaded Lua execution:<br/>All seats verified AVAILABLE.<br/>Keys set with EX 600.<br/>Increment monotonic fencing_token.
    Redis-->>Orch: SUCCESS (fencing_token: 4091, expires_in: 600s)

    par Parallel Hold Persistence & External Box Office Hold
        Orch->>DB: INSERT INTO seat_holds (id, show_id, seat_ids, user_id, fencing_token, expires_at)
        Orch->>Vista: POST /HoldSeats (CinemaId, Screen, Seats: [F12, F13], TTL: 10m)
    end

    DB-->>Orch: Hold record persisted
    Vista-->>Orch: 200 OK (Vista Hold ID: VST-8812)

    Orch-->>GW: Hold Confirmed (HoldToken: hld_902, ExpiresAt: T+600s)
    GW-->>Customer: 201 Created (10-Minute Countdown Timer Commences)
  `;

  // 5. Flow C: Two Customers Attempting to Reserve Same Seat Simultaneously
  const seqFlowC = `
sequenceDiagram
    autonumber
    actor Alice as Customer Alice
    actor Bob as Customer Bob
    participant GW as API Edge Gateway
    participant Redis as Redis Lua Lock Engine (Single-Threaded)
    participant DB as PostgreSQL Writer

    Note over Alice,Bob: Alice and Bob both click Seat F-12 at t = 00.001s!
    Alice->>GW: POST /holds (Seat: F12, User: Alice)
    Bob->>GW: POST /holds (Seat: F12, User: Bob)

    GW->>Redis: Request 1 (Alice): EVAL seat_hold.lua
    GW->>Redis: Request 2 (Bob): EVAL seat_hold.lua (Queued in event loop)

    Note over Redis: Step 1: Redis executes Alice's Lua Script<br/>Seat lock:show_1:F12 is NIL.<br/>SET lock:show_1:F12 Alice EX 600.<br/>Fencing token = 1042.
    Redis-->>GW: Alice: 1 (SUCCESS, Token 1042)

    Note over Redis: Step 2: Redis executes Bob's Lua Script<br/>GET lock:show_1:F12 returns 'Alice'.<br/>Seat already occupied! Abort.
    Redis-->>GW: Bob: 0 (FAILED - ALREADY HELD)

    par Response Dispatch
        GW-->>Alice: 201 Created (Hold Token: 1042, Timer: 600s)
        GW-->>Bob: 409 Conflict ("Seat F-12 was just reserved by another user")
    end

    GW->>DB: Alice: INSERT INTO seat_holds (Persisted)
    Note over DB: Bob's request never touched PostgreSQL!<br/>100% of losing contention shed in memory.
  `;

  // 6. Flow D: Successful Payment and Booking Confirmation
  const seqFlowD = `
sequenceDiagram
    autonumber
    actor Customer as Customer Client
    participant PG as Payment Gateway (Razorpay/Stripe)
    participant Orch as Booking Orchestrator
    participant DB as PostgreSQL Transactional DB
    participant Vista as Cinema Multiplex POS (Vista)
    participant Outbox as Debezium CDC Outbox Worker
    participant Kafka as Kafka Message Broker
    participant Notif as Notification Service

    Customer->>PG: Submits OTP / Card Authorization (Idempotency-Key: ord_771_v1)
    PG-->>Customer: Payment Authorized (HTTP 200)

    PG->>Orch: POST /webhooks/payment (HMAC Signature, payment.captured, order_id: ord_771)
    Note over Orch: Verify Webhook HMAC-SHA256 signature
    
    Orch->>DB: BEGIN TRANSACTION
    Note over DB: 1. SELECT * FROM seat_holds WHERE id = :hold_id FOR UPDATE<br/>2. INSERT INTO bookings (id, status='CONFIRMED', ...)<br/>   -- Enforces UNIQUE (show_id, seat_id) constraint!<br/>3. UPDATE seat_inventory SET status='BOOKED'<br/>4. INSERT INTO tickets (qr_signature, ...)<br/>5. INSERT INTO outbox (topic='booking.confirmed', payload=...)
    DB-->>Orch: COMMIT TRANSACTION SUCCESS

    par Confirm Remote Cinema & Acknowledge Webhook
        Orch->>Vista: POST /CommitSeats (VistaReservationId: VST-8812)
        Vista-->>Orch: 200 OK (Tickets Confirmed in Physical Box Office)
        Orch-->>PG: 200 OK (Webhook Handled Successfully)
    end

    Note over Outbox: Outbox Worker tails PostgreSQL WAL stream
    Outbox->>Kafka: Publish event: booking.confirmed (PartitionKey: show_id)
    Kafka->>Notif: Consume booking.confirmed
    Notif->>Customer: Dispatch WhatsApp & Email with PDF QR Ticket
  `;

  // 7. Flow E: Payment Failure or Ambiguous Timeout
  const seqFlowE = `
sequenceDiagram
    autonumber
    actor Customer as Customer Client
    participant Orch as Booking Orchestrator
    participant PG as Payment Gateway
    participant DB as PostgreSQL DB
    participant Recon as Reconciliation Worker
    participant Redis as Redis Ephemeral Lock
    participant Vista as Vista Cinema POS

    Customer->>Orch: POST /checkout (Booking: ord_890)
    Orch->>PG: POST /v1/charges (Amount: $40, Idempotency-Key: ord_890)
    
    alt Network Severed / HTTP 504 Gateway Timeout
        PG--xOrch: HTTP 504 Gateway Timeout (Ambiguous Outcome!)
        Note over Orch: Do NOT immediately cancel seats!<br/>Money might have been deducted.
        Orch->>DB: UPDATE bookings SET status = 'PAYMENT_PENDING_AUDIT'
        Orch-->>Customer: 202 Accepted ("Processing payment with bank. Please do not refresh.")

        Note over Recon: Background Reconciliation Worker triggers at T + 60s
        Recon->>PG: GET /v1/charges?idempotency_key=ord_890
        
        alt Bank Confirmed Payment Succeeded
            PG-->>Recon: Charge Status: CAPTURED
            Recon->>DB: COMMIT Booking as CONFIRMED
            Recon->>Vista: POST /CommitSeats
        else Bank Confirmed Payment Declined
            PG-->>Recon: Charge Status: FAILED (Insufficient funds)
            Recon->>DB: UPDATE bookings SET status = 'PAYMENT_FAILED'
            Recon->>Redis: DEL lock:show_1:seat_F12 (Release memory lock)
            Recon->>Vista: POST /CancelHold (Release multiplex counter hold)
            Recon-->>Customer: Notification: "Payment failed. Seats released."
        end
    end
  `;

  // 8. Flow F: Customer Abandoning Checkout & Seat Hold Expiring
  const seqFlowF = `
sequenceDiagram
    autonumber
    actor Customer as Customer Client
    participant Redis as Redis Ephemeral Lock
    participant DB as PostgreSQL DB
    participant Expiry as Background Expiry Worker
    participant Vista as Vista Cinema POS
    participant Cache as Seat Map Read Cache

    Customer->>Redis: Lock acquired on Seat F-12 (TTL = 600s)
    Note over Customer: Customer closes browser / battery dies during checkout!

    Note over Redis: Clock ticks... t = 600 seconds elapse.<br/>Redis automatically evicts key 'lock:show_1:F12'!
    
    Note over Expiry: Expiry Worker runs periodic poll (every 10s):<br/>SELECT * FROM seat_holds WHERE status = 'ACTIVE' AND expires_at < NOW()
    Expiry->>DB: Fetch expired holds
    DB-->>Expiry: Return [Hold ID: hld_902, Show: 1, Seat: F12]

    Expiry->>DB: UPDATE seat_holds SET status = 'EXPIRED' WHERE id = 'hld_902'
    Expiry->>DB: UPDATE seat_inventory SET status = 'AVAILABLE' WHERE show_id=1 AND seat_id='F12'
    Expiry->>Vista: POST /CancelHold (VistaReservationId: VST-8812)
    Vista-->>Expiry: 200 OK (Counter hold cancelled)

    Expiry->>Cache: Invalidate seatmap_bitmap:show_1
    Note over Cache: Next customer browsing seat map sees Seat F-12 GREEN (AVAILABLE)!
  `;

  // 9. Flow G: Payment Callback Delivered More Than Once
  const seqFlowG = `
sequenceDiagram
    autonumber
    participant PG as Payment Gateway
    participant Orch as Booking Orchestrator
    participant DB as PostgreSQL Transactional DB

    Note over PG: Payment Gateway dispatches webhook.<br/>Due to network retry, Webhook is delivered twice!

    PG->>Orch: Webhook Attempt 1 (Idempotency-Key: pay_evt_9981, Booking: ord_501)
    Orch->>DB: BEGIN TRANSACTION
    Orch->>DB: SELECT * FROM processed_webhooks WHERE idempotency_key = 'pay_evt_9981' FOR UPDATE
    Note over DB: Key not found: First delivery!
    Orch->>DB: INSERT INTO processed_webhooks (idempotency_key, booking_id, status='PROCESSED')
    Orch->>DB: UPDATE bookings SET status = 'CONFIRMED' WHERE id = 'ord_501'
    DB-->>Orch: COMMIT SUCCESS
    Orch-->>PG: HTTP 200 OK (Acknowledged)

    Note over PG: Gateway network glitch: ACK delayed, PG retries delivery!
    PG->>Orch: Webhook Attempt 2 (Idempotency-Key: pay_evt_9981, Booking: ord_501)
    Orch->>DB: SELECT * FROM processed_webhooks WHERE idempotency_key = 'pay_evt_9981'
    Note over DB: KEY FOUND! Status = 'PROCESSED'.
    Note over Orch: Idempotency Protection: Bypass booking logic completely!<br/>Do not charge again. Do not issue duplicate tickets.
    Orch-->>PG: HTTP 200 OK (Instant cached acknowledgment)
  `;

  // 10. Flow H: Recovery When Confirmation Processing Fails After Payment Succeeds
  const seqFlowH = `
sequenceDiagram
    autonumber
    participant PG as Payment Gateway
    participant Orch as Booking Orchestrator (Pod 1)
    participant DB as PostgreSQL DB
    participant Recon as Recovery & Reconciliation Worker
    participant Vista as Vista Cinema POS
    participant Outbox as Outbox CDC Worker

    PG->>Orch: Webhook payment.captured (Order: ord_300)
    Orch->>DB: UPDATE bookings SET status='PAID_PENDING_CONFIRMATION' (Committed)
    
    Note over Orch: CRITICAL HARDWARE CRASH!<br/>Pod 1 suffers Out-Of-Memory kill before calling Vista.CommitSeats!
    Note over Customer: Money is debited, but cinema box office has not confirmed tickets!

    Note over Recon: Reconciliation Worker detects orphaned order:<br/>SELECT * FROM bookings WHERE status='PAID_PENDING_CONFIRMATION'<br/>AND updated_at < NOW() - INTERVAL '60s'
    Recon->>DB: Fetch ord_300
    
    Recon->>Vista: POST /CommitSeats (VistaReservationId: VST-402, IdempotencyKey: ord_300)
    Vista-->>Recon: 200 OK (Seats confirmed in cinema box office)

    Recon->>DB: BEGIN TRANSACTION
    Recon->>DB: UPDATE bookings SET status='CONFIRMED', confirmed_at=NOW()
    Recon->>DB: INSERT INTO outbox (topic='booking.confirmed', payload=...)
    DB-->>Recon: COMMIT SUCCESS

    Recon->>Outbox: Wakeup signal
    Outbox->>Customer: Customer receives tickets safely. Zero human intervention required!
  `;

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col lg:flex-row gap-10">
      
      {/* =========================================================================
          STICKY TABLE OF CONTENTS SIDEBAR (Desktop)
      ========================================================================= */}
      <aside className="hidden lg:block w-72 shrink-0">
        <div className="sticky top-24 space-y-4 p-4 rounded-xl bg-canvas-surface border border-canvas-border text-xs font-mono">
          <div className="flex items-center gap-2 pb-2 border-b border-canvas-borderSubtle text-ink-light font-bold">
            <Compass className="w-4 h-4 text-accent-bms" />
            <span>CASE STUDY NAVIGATOR</span>
          </div>

          <nav className="space-y-1">
            {[
              { id: 'chapter-a', label: 'A. Problem Definition & Invariants' },
              { id: 'chapter-b', label: 'B. Epistemological Boundaries' },
              { id: 'chapter-c', label: 'C. High-Level Design (HLD Map)' },
              { id: 'chapter-d', label: 'D. Low-Level Design (Domain Models)' },
              { id: 'chapter-e', label: 'E. Concurrency & Contention Analysis' },
              { id: 'chapter-f', label: 'F. Critical Request & Failure Flows' },
              { id: 'chapter-g', label: 'G. Payment Reliability & Sagas' },
              { id: 'chapter-h', label: 'H. Traffic & Capacity Modeling' },
              { id: 'chapter-i', label: 'I. Production Failure Matrix' },
              { id: 'chapter-j', label: 'J. Architecture Decision Records' },
              { id: 'chapter-k', label: 'K. Canonical References' }
            ].map(sec => (
              <a
                key={sec.id}
                href={`#${sec.id}`}
                onClick={() => setActiveSection(sec.id)}
                className={`block py-1.5 px-2 rounded transition-colors ${
                  activeSection === sec.id
                    ? 'bg-accent-bms/10 text-accent-bms font-bold'
                    : 'text-ink-muted hover:text-ink-light hover:bg-canvas-elevated'
                }`}
              >
                {sec.label}
              </a>
            ))}
          </nav>

          <div className="pt-3 border-t border-canvas-borderSubtle space-y-2 text-[11px] text-ink-muted">
            <div className="flex items-center justify-between">
              <span>Evidentiary Class:</span>
              <EvidenceBadge tier="REFERENCE" size="sm" />
            </div>
            <div className="flex items-center justify-between">
              <span>Core Invariant:</span>
              <span className="text-emerald-400 font-bold">Zero Double-Booking</span>
            </div>
          </div>
        </div>
      </aside>

      {/* =========================================================================
          MAIN ARTICLE CONTENT
      ========================================================================= */}
      <article className="flex-1 min-w-0 space-y-16">

        {/* 1. Article Header */}
        <header className="border-b border-canvas-border pb-8 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-xs uppercase tracking-wider text-accent-bms font-semibold">
              CASE STUDY 02 // MASSIVE WRITE-CONTENDED ARCHETYPE
            </span>
            <EvidenceBadge tier="REFERENCE" size="sm" />
            <span className="font-mono text-xs text-ink-muted">• 25 min read</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-ink-light tracking-tight leading-tight">
            BookMyShow-Like Ticketing System — Proposed Reference Architecture
          </h1>

          <p className="text-base sm:text-xl text-ink-muted font-sans leading-relaxed">
            Investigating High-Demand Concurrency, Distributed Ephemeral Seat Holds, and Multi-Phase Payment Settlement at Scale.
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-2 text-xs font-mono">
            <span className="text-ink-muted">Foundational Literature:</span>
            <Link to="/references?highlight=SRC-DIST-01" className="text-accent-cyan hover:underline">
              [SRC-DIST-01 DDIA]
            </Link>
            <Link to="/references?highlight=SRC-DIST-02" className="text-accent-cyan hover:underline">
              [SRC-DIST-02 Redlock]
            </Link>
            <Link to="/references?highlight=SRC-DIST-03" className="text-accent-cyan hover:underline">
              [SRC-DIST-03 Stripe Idempotency]
            </Link>
            <Link to="/references?highlight=SRC-BMS-EXT-01" className="text-accent-cyan hover:underline">
              [SRC-BMS-EXT-01 Vista API]
            </Link>
            <Link to="/references?highlight=SRC-AWS-AURORA-01" className="text-accent-cyan hover:underline">
              [SRC-AWS-AURORA-01 Aurora]
            </Link>
          </div>

          {/* SeatLock Lab Interactive Workbench CTA */}
          <div className="mt-4 p-4 sm:p-5 rounded-xl border border-accent-bms/40 bg-gradient-to-r from-accent-bms/10 via-canvas-elevated to-canvas-surface flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded bg-accent-bms/20 text-accent-bms font-bold border border-accent-bms/30">
                  Interactive Lab
                </span>
                <span className="font-mono text-xs text-ink-muted">Executable Verification</span>
              </div>
              <h3 className="font-serif text-base sm:text-lg font-bold text-ink-light">
                SeatLock Lab: Concurrency &amp; Invariant Verification Workbench
              </h3>
              <p className="text-xs text-ink-muted max-w-xl leading-relaxed">
                Execute real simultaneous booking requests against Redis and PostgreSQL to observe lock contention, row-level isolation, and fencing tokens under live load.
              </p>
            </div>
            <Link
              to="/seat-lock-lab"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-accent-bms hover:bg-accent-bms/90 text-white font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-md shrink-0 hover:scale-[1.02] active:scale-[0.98]"
            >
              <FlaskConical className="w-4 h-4" />
              <span>Run the seat-locking experiment</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </header>

        {/* =========================================================================
            CHAPTER A: PROBLEM DEFINITION & REQUIREMENTS
        ========================================================================= */}
        <section id="chapter-a" className="space-y-6 scroll-mt-24">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-accent-bms uppercase tracking-wider font-semibold">
              Chapter A
            </span>
            <span className="text-ink-muted">•</span>
            <span className="text-xs font-mono text-ink-muted">Problem Definition</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink-light flex items-center gap-2.5">
            <AlertTriangle className="w-6 h-6 text-accent-bms" />
            The High-Contention Ticketing Challenge &amp; Hard Invariants
          </h2>

          <div className="prose prose-invert max-w-none space-y-4 text-ink-light/90 leading-relaxed text-sm sm:text-base">
            <p>
              In conventional e-commerce architectures (such as Amazon or Shopify), inventory items are typically <strong>fungible</strong>. If a customer orders two copies of a book or two phone chargers, any two identical SKUs in the warehouse satisfy the order. Concurrency can be resolved by decrementing a numeric quantity counter in a relational database.
            </p>
            <p>
              In contrast, high-demand live event and cinema ticketing platforms like <strong>BookMyShow</strong> manage strictly <strong>non-fungible inventory</strong>. Every physical seat in an auditorium or stadium possesses a specific row, seat number, tier, and spatial coordinate (e.g., <em>Auditorium 4, Row F, Seat 12</em>). Two users cannot be allocated &quot;any two seats&quot;—they have specifically selected identical coordinates.
            </p>
            <p>
              During blockbuster movie releases, cricket tournament knockouts, or stadium concert on-sales (e.g., Coldplay, World Cup Finals), tens of thousands of users navigate to the exact same seat layout within milliseconds of ticket sales opening. This produces extreme write contention on a minuscule set of database rows.
            </p>
          </div>

          {/* Hard Invariant Box */}
          <div className="p-5 rounded-xl border border-emerald-500/30 bg-emerald-950/20 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs uppercase font-bold tracking-wider">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Fundamental Correctness Invariant (Non-Negotiable)</span>
            </div>
            <blockquote className="font-serif text-base sm:text-lg text-ink-light italic border-l-2 border-emerald-400 pl-4 py-1">
              &quot;For a specific show, a seat must not have two conflicting confirmed bookings.&quot;
            </blockquote>
            <p className="text-xs text-ink-muted leading-relaxed font-sans">
              No performance optimization, cache acceleration, or network failure may violate this rule. Double-booking violates physical reality (two human beings cannot occupy the same chair) and causes severe operational chaos at the venue, brand reputation damage, and financial penalties.
            </p>
          </div>

          {/* Requirements Matrix */}
          <div className="rounded-xl border border-canvas-border bg-canvas-surface overflow-hidden">
            <div className="p-4 border-b border-canvas-borderSubtle bg-canvas-dark flex items-center justify-between">
              <span className="font-mono text-xs uppercase text-ink-light font-bold">
                System Requirements Taxonomy
              </span>
              <span className="font-mono text-[11px] text-ink-muted">Functional vs. Performance SLAs</span>
            </div>
            <div className="divide-y divide-canvas-borderSubtle text-xs sm:text-sm">
              <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-2">
                <span className="font-mono font-semibold text-accent-cyan">Seat Map Browsing</span>
                <span className="text-ink-muted md:col-span-2">
                  Users must be able to view real-time seat availability (Available, Held, Booked) with p99 latency &lt; 50ms under 80,000 QPS browse traffic.
                </span>
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-2">
                <span className="font-mono font-semibold text-accent-bms">Ephemeral Seat Hold</span>
                <span className="text-ink-muted md:col-span-2">
                  Upon selecting seats, the system must grant an exclusive temporary hold with an 8–10 minute (480–600s) time-to-live (TTL). If payment is not completed within the TTL, the hold must automatically expire and return seats to the open pool.
                </span>
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-2">
                <span className="font-mono font-semibold text-accent-violet">Mutual Exclusion Under Contention</span>
                <span className="text-ink-muted md:col-span-2">
                  When 50,000 users click the same seat at t = 0, exactly one user must be granted the hold; 49,999 users must receive an immediate, friendly rejection (HTTP 409 Conflict) in &lt; 20ms without crashing the database.
                </span>
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-2">
                <span className="font-mono font-semibold text-emerald-400">Payment Reconciliation</span>
                <span className="text-ink-muted md:col-span-2">
                  Financial transactions span third-party payment gateways. The system must support asynchronous webhooks, strict idempotency keys, and proactive background reconciliation for ambiguous HTTP 504 gateway timeouts.
                </span>
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-2">
                <span className="font-mono font-semibold text-amber-400">Multiplex Box Office Sync</span>
                <span className="text-ink-muted md:col-span-2">
                  When acting as an aggregator for multiplex cinema chains (e.g. PVR INOX), the system must coordinate holds and commits against external point-of-sale systems (Vista Connect API) without blocking internal threads.
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            CHAPTER B: EPISTEMOLOGICAL BOUNDARIES
        ========================================================================= */}
        <section id="chapter-b" className="space-y-6 scroll-mt-24">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-accent-bms uppercase tracking-wider font-semibold">
              Chapter B
            </span>
            <span className="text-ink-muted">•</span>
            <span className="text-xs font-mono text-ink-muted">Epistemological Boundaries</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink-light flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-purple-400" />
            The Research Boundary: Verified Footprint vs. Reference Architecture
          </h2>

          <p className="text-ink-light/90 leading-relaxed text-sm sm:text-base">
            To preserve absolute editorial integrity, this monograph explicitly separates verified public facts from reasoned deductions and our engineered reference models:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-canvas-border bg-canvas-surface space-y-2">
              <div className="flex items-center gap-2">
                <EvidenceBadge tier="DOCUMENTED" size="sm" />
                <span className="font-mono text-xs text-ink-muted font-bold">Publicly Documented</span>
              </div>
              <p className="text-xs text-ink-muted leading-relaxed">
                BookMyShow operates on AWS, utilizing Amazon S3, Redshift, and Databricks Delta Lake for behavioral analytics; mobile apps implement 8–10 minute client-side checkout countdown timers; integration with cinema box offices conforms to the Vista Connect protocol.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-950/10 space-y-2">
              <div className="flex items-center gap-2">
                <EvidenceBadge tier="INFERENCE" size="sm" />
                <span className="font-mono text-xs text-amber-400 font-bold">Reasoned Inference</span>
              </div>
              <p className="text-xs text-ink-muted leading-relaxed">
                Direct database row locking (<code>SELECT FOR UPDATE</code>) violates physical connection limits under 50,000 QPS. Therefore, an in-memory load-shedding tier or queueing mechanism must precede the durable relational store.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-950/20 space-y-2">
              <div className="flex items-center gap-2">
                <EvidenceBadge tier="REFERENCE" size="sm" />
                <span className="font-mono text-xs text-purple-300 font-bold">Proposed Reference Design</span>
              </div>
              <p className="text-xs text-ink-muted leading-relaxed">
                Because BookMyShow does not open-source its proprietary locking engines or microservice source code, our implementation presents a production-grade reference architecture using single-threaded Redis Lua CAS locks, fencing tokens, and Saga orchestration.
              </p>
            </div>
          </div>

          <CalloutNote type="caveat" title="Intellectual Rigor Disclaimer">
            We never claim that Redis Lua scripts, Aurora PostgreSQL, or specific internal service names are BookMyShow&apos;s proprietary code. We use BookMyShow as the prime industrial archetype to engineer a robust, peer-reviewed reference solution for the flash-sale concurrency problem.
          </CalloutNote>
        </section>

        {/* =========================================================================
            CHAPTER C: HIGH-LEVEL DESIGN (INTERACTIVE ARCHITECTURE CANVAS)
        ========================================================================= */}
        <section id="chapter-c" className="space-y-6 scroll-mt-24">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-accent-bms uppercase tracking-wider font-semibold">
              Chapter C
            </span>
            <span className="text-ink-muted">•</span>
            <span className="text-xs font-mono text-ink-muted">System Topology</span>
          </div>
          <div className="space-y-1">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink-light flex items-center gap-2.5">
              <Layers className="w-6 h-6 text-accent-cyan" />
              High-Level Architecture (HLD): End-to-End Ticketing Topology
            </h2>
            <p className="text-xs sm:text-sm text-ink-muted font-sans">
              Click any node in the topology canvas to inspect its responsibilities, latency SLAs, inputs, outputs, and failure recovery protocols.
            </p>
          </div>

          <div className="rounded-xl border border-canvas-border overflow-hidden bg-canvas-dark">
            <ArchitectureCanvas
              title={BMS_DIAGRAM_TITLE}
              explanation={BMS_DIAGRAM_EXPLANATION}
              initialNodes={BMS_NODES}
              initialEdges={BMS_EDGES}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-3.5 rounded-lg bg-canvas-surface border border-canvas-border space-y-1">
              <div className="flex items-center gap-2 text-accent-bms font-bold">
                <span className="w-2 h-2 rounded-full bg-accent-bms inline-block" />
                <span>Synchronous Ingress &amp; Hold Execution (Solid Red Lines)</span>
              </div>
              <p className="text-ink-muted text-[11px] leading-relaxed">
                Client hold requests pass through admission control to the Saga Orchestrator, which acquires an ephemeral in-memory lock in Redis via atomic Lua CAS in &lt; 2ms, followed by a durable database hold insert.
              </p>
            </div>
            <div className="p-3.5 rounded-lg bg-canvas-surface border border-canvas-border space-y-1">
              <div className="flex items-center gap-2 text-accent-violet font-bold">
                <span className="w-2 h-2 rounded-full bg-accent-violet inline-block" />
                <span>Asynchronous Event Pipeline &amp; Outbox (Dashed Violet Lines)</span>
              </div>
              <p className="text-ink-muted text-[11px] leading-relaxed">
                Committed bookings are tailed from the database Write-Ahead Log (WAL) via Debezium CDC and published to Kafka topics, triggering ticket delivery, cache invalidation, and data lake ingestion.
              </p>
            </div>
          </div>
        </section>

        {/* =========================================================================
            CHAPTER D: LOW-LEVEL DESIGN (LLD) & DOMAIN DATA MODELS
        ========================================================================= */}
        <section id="chapter-d" className="space-y-6 scroll-mt-24">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-accent-bms uppercase tracking-wider font-semibold">
              Chapter D
            </span>
            <span className="text-ink-muted">•</span>
            <span className="text-xs font-mono text-ink-muted">Domain Modeling</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink-light flex items-center gap-2.5">
            <FileCode className="w-6 h-6 text-accent-cyan" />
            Low-Level Design (LLD): Domain Models &amp; Data Schemas
          </h2>

          <p className="text-ink-light/90 leading-relaxed text-sm sm:text-base">
            The domain model decouples the physical venue layout from temporary booking holds and permanent confirmed orders. The core entities and their relationships are structured as follows:
          </p>

          <MermaidDiagram
            chart={lldDomainClassChart}
            title="Domain Class & Entity-Relationship Architecture"
            explanation="Class diagram showing domain entity boundaries, cardinalities, foreign key associations, and lifecycle state management."
          />

          {/* TypeScript Domain Model Interfaces */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase text-ink-light font-bold">
                Domain Model Interfaces (TypeScript Reference Specification)
              </span>
              <span className="text-[11px] font-mono text-accent-cyan">Strict Type System</span>
            </div>
            <div className="p-4 rounded-xl bg-canvas-dark border border-canvas-border font-mono text-xs text-ink-light overflow-x-auto">
              <pre>{`// Core Domain Entity Interfaces
export type SeatTier = 'VIP' | 'PREMIUM' | 'EXECUTIVE' | 'STANDARD';
export type InventoryStatus = 'AVAILABLE' | 'HELD' | 'BOOKED' | 'MAINTENANCE';
export type HoldStatus = 'ACTIVE' | 'EXPIRED' | 'CONVERTED' | 'CANCELLED';
export type BookingStatus = 'CREATED' | 'HELD' | 'PAYMENT_PENDING' | 'CONFIRMED' | 'FAILED' | 'REFUNDED';

export interface Show {
  id: string; // UUID
  movieId: string;
  venueId: string;
  auditoriumId: string;
  startTime: string; // ISO8601
  endTime: string;
  status: 'SCHEDULED' | 'ON_SALE' | 'SOLD_OUT' | 'CANCELLED';
  baseCurrency: string;
}

export interface Seat {
  id: string;
  auditoriumId: string;
  rowLabel: string; // e.g., "F"
  seatNumber: number; // e.g., 12
  tier: SeatTier;
  gridCoordinates: { x: number; y: number };
}

export interface SeatInventory {
  id: string;
  showId: string;
  seatId: string;
  status: InventoryStatus;
  currentHoldId?: string;
  version: number; // Optimistic Concurrency Control counter
}

export interface SeatHold {
  id: string; // UUID
  showId: string;
  seatIds: string[];
  userId: string;
  fencingToken: number; // Strictly monotonic integer for Kleppmann safety
  status: HoldStatus;
  heldAt: string;
  expiresAt: string; // Strictly heldAt + 600s
  vistaReservationId?: string; // Cinema box office external hold reference
}

export interface Booking {
  id: string;
  orderNumber: string; // Human-readable e.g., BMS-2026-X8921
  userId: string;
  showId: string;
  seatIds: string[];
  totalAmountCents: number;
  status: BookingStatus;
  idempotencyKey: string; // Stripe/Razorpay unique transaction idempotency key
  createdAt: string;
  confirmedAt?: string;
}

export interface PaymentAttempt {
  id: string;
  bookingId: string;
  gateway: 'RAZORPAY' | 'STRIPE' | 'PAYU' | 'JUSPAY';
  gatewayTransactionId?: string;
  idempotencyKey: string;
  amountCents: number;
  status: 'INITIATED' | 'AUTHORIZED' | 'CAPTURED' | 'FAILED' | 'AMBIGUOUS_TIMEOUT';
  signatureVerified: boolean;
  rawWebhookPayload?: Record<string, unknown>;
}

export interface Ticket {
  id: string;
  bookingId: string;
  seatId: string;
  qrSignature: string; // HMAC-SHA256 signed JSON payload with booking secret
  entryStatus: 'UNUSED' | 'ADMITTED' | 'VOIDED';
  issuedAt: string;
}`}</pre>
            </div>
          </div>

          {/* Database DDL & Constraints */}
          <div className="p-4 rounded-xl bg-canvas-surface border border-canvas-border space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase text-emerald-400 font-bold">
                Critical Database Indexing &amp; Invariants (PostgreSQL DDL)
              </span>
              <span className="font-mono text-[11px] text-ink-muted">Physical Schema Constraints</span>
            </div>
            <p className="text-xs text-ink-muted leading-relaxed">
              The database schema guarantees that no matter what race conditions or failures occur in the application tier, the relational engine physically prevents double-booking via conditional unique indexes:
            </p>
            <div className="p-3 rounded-lg bg-canvas-dark border border-canvas-borderSubtle font-mono text-xs text-ink-light overflow-x-auto">
              <pre>{`-- 1. HARD CORRECTNESS INVARIANT: Only one confirmed booking per seat per show
CREATE UNIQUE INDEX idx_unique_confirmed_seat 
ON bookings (show_id, seat_id) 
WHERE status = 'CONFIRMED';

-- 2. EPHEMERAL ACTIVE HOLD INVARIANT: Only one active hold per seat per show
CREATE UNIQUE INDEX idx_unique_active_hold 
ON seat_holds (show_id, seat_id) 
WHERE status = 'ACTIVE';

-- 3. IDEMPOTENCY KEY LOOKUP: Guarantees payment webhooks cannot be processed twice
CREATE UNIQUE INDEX idx_unique_payment_idempotency 
ON processed_webhooks (idempotency_key);`}</pre>
            </div>
          </div>
        </section>

        {/* =========================================================================
            CHAPTER E: CONCURRENCY AND CONSISTENCY ANALYSIS (THE CORE)
        ========================================================================= */}
        <section id="chapter-e" className="space-y-6 scroll-mt-24">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-accent-bms uppercase tracking-wider font-semibold">
              Chapter E
            </span>
            <span className="text-ink-muted">•</span>
            <span className="text-xs font-mono text-ink-muted">Concurrency Analysis</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink-light flex items-center gap-2.5">
            <Zap className="w-6 h-6 text-amber-400" />
            Concurrency &amp; Consistency Analysis: The Seat Allocation Engine
          </h2>

          <div className="prose prose-invert max-w-none space-y-4 text-ink-light/90 leading-relaxed text-sm sm:text-base">
            <p>
              The seat-allocation mechanism is the technical epicenter of any ticketing system. To solve high-contention flash sales, systems architects must evaluate three primary concurrency models:
            </p>
          </div>

          {/* Chapter E Dedicated Lab CTA */}
          <div className="p-4 sm:p-5 rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-950/20 via-canvas-elevated to-canvas-surface flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-amber-400 uppercase tracking-widest font-bold px-2 py-0.5 rounded bg-amber-950/50 border border-amber-800/50">
                  Live Concurrency Lab
                </span>
                <span className="font-mono text-xs text-ink-muted">Executable Verification</span>
              </div>
              <h4 className="font-serif font-bold text-base text-ink-light">
                Verify Two-Customer Seat Allocation Contention Live
              </h4>
              <p className="text-xs text-ink-muted max-w-xl leading-relaxed">
                Simulate two competing customers attempting to lease the same IMAX seat at the same millisecond. Observe actual Redis locks, PostgreSQL row-level locks, and server execution traces.
              </p>
            </div>
            <Link
              to="/seat-lock-lab"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-mono text-xs font-bold uppercase tracking-wider transition-all shrink-0 shadow-lg hover:scale-[1.02] active:scale-[0.98]"
            >
              <FlaskConical className="w-4 h-4 text-slate-950" />
              <span>Run the seat-locking experiment</span>
              <ArrowRight className="w-4 h-4 text-slate-950" />
            </Link>
          </div>

          {/* Three-Way Comparison Table */}
          <div className="rounded-xl border border-canvas-border bg-canvas-surface overflow-hidden">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-canvas-dark border-b border-canvas-border font-mono text-[11px] text-ink-muted uppercase">
                <tr>
                  <th className="p-3.5">Concurrency Mechanism</th>
                  <th className="p-3.5">Write Latency</th>
                  <th className="p-3.5">Contention Behavior</th>
                  <th className="p-3.5">DB Connection Load</th>
                  <th className="p-3.5">Verdict</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-canvas-borderSubtle">
                <tr className="hover:bg-canvas-elevated/50">
                  <td className="p-3.5 font-mono font-semibold text-ink-light">
                    1. Pessimistic DB Lock (<code>SELECT FOR UPDATE</code>)
                  </td>
                  <td className="p-3.5 text-ink-muted">High (15–500ms)</td>
                  <td className="p-3.5 text-red-400">Lock queues balloon; deadlocks; cascade timeouts</td>
                  <td className="p-3.5 text-red-400">Exhausted in seconds (&gt; 1,000 connections)</td>
                  <td className="p-3.5 font-mono text-red-400 font-bold">Unsuitable for Flash Sales</td>
                </tr>
                <tr className="hover:bg-canvas-elevated/50">
                  <td className="p-3.5 font-mono font-semibold text-ink-light">
                    2. Optimistic Concurrency (<code>version = v + 1</code>)
                  </td>
                  <td className="p-3.5 text-ink-muted">Medium (10–30ms)</td>
                  <td className="p-3.5 text-amber-400">99.9% abort rate; massive CPU thrashing</td>
                  <td className="p-3.5 text-amber-400">High query volume on retry storms</td>
                  <td className="p-3.5 font-mono text-amber-400 font-bold">Inefficient Under Contention</td>
                </tr>
                <tr className="bg-accent-bms/5 hover:bg-accent-bms/10">
                  <td className="p-3.5 font-mono font-semibold text-accent-bms">
                    3. Ephemeral In-Memory Lock (Redis Lua CAS) + Fencing Token + DB Invariant
                  </td>
                  <td className="p-3.5 text-emerald-400 font-bold">Sub-2ms</td>
                  <td className="p-3.5 text-emerald-400 font-bold">Sheds 99% of losing requests in RAM in microseconds</td>
                  <td className="p-3.5 text-emerald-400 font-bold">Bounded strictly to successful holds</td>
                  <td className="p-3.5 font-mono text-emerald-400 font-bold">Recommended Reference Design</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Redis Lua CAS Script Breakdown */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase text-amber-400 font-bold">
                The Atomic Ephemeral Lock Script (Redis Lua CAS)
              </span>
              <span className="font-mono text-[11px] text-ink-muted">Single-Threaded Execution</span>
            </div>
            <p className="text-xs text-ink-muted leading-relaxed">
              Because Redis processes Lua scripts sequentially on a single-threaded CPU loop, race conditions are eliminated at the memory bus. If a batch of seats is requested, the script validates that <em>all</em> seats are free before acquiring any lock, preventing circular wait deadlocks:
            </p>
            <div className="p-4 rounded-xl bg-canvas-dark border border-canvas-border font-mono text-xs text-ink-light overflow-x-auto">
              <pre>{`-- Atomic Multi-Seat Hold Script (Redis Lua CAS)
-- KEYS: Array of lock keys (e.g. ['lock:show_1:seat_F12', 'lock:show_1:seat_F13'])
-- ARGV[1]: user_id (UUID)
-- ARGV[2]: ttl_seconds (e.g. 600)
-- ARGV[3]: show_id (UUID)

-- Step 1: Verify ALL requested seats are available (Eliminates partial hold deadlock)
for i, key in ipairs(KEYS) do
  local current_holder = redis.call('GET', key)
  if current_holder ~= false then
    -- Seat is already held! Abort entire batch immediately.
    return {0, key} -- Return 0 (FAILURE) and contested seat key
  end
end

-- Step 2: Increment monotonic fencing counter for the show
local fencing_token = redis.call('INCR', 'fencing_seq:' .. ARGV[3])

-- Step 3: Atomically acquire all seat locks with ephemeral TTL
for i, key in ipairs(KEYS) do
  redis.call('SET', key, ARGV[1], 'EX', tonumber(ARGV[2]))
end

-- Return 1 (SUCCESS) along with the monotonic fencing token
return {1, fencing_token}`}</pre>
            </div>
          </div>

          {/* The Martin Kleppmann Distributed Lock Critique */}
          <div className="p-5 rounded-xl border border-purple-500/30 bg-purple-950/20 space-y-4">
            <div className="flex items-center gap-2 text-purple-300 font-mono text-xs uppercase font-bold tracking-wider">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span>Why Cache Locks Alone Do Not Guarantee Correctness (Martin Kleppmann Critique)</span>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-ink-light/90 leading-relaxed">
              <p>
                In distributed systems research (Kleppmann, 2016, <em>&quot;How to do distributed locking&quot;</em>), it is well established that a distributed cache lock with a TTL (whether Redis <code>SET NX EX</code> or Redlock) <strong>does not guarantee mutual exclusion</strong> if application processes experience unannounced delays.
              </p>
              <div className="p-3.5 rounded-lg bg-canvas-dark border border-canvas-borderSubtle font-mono text-xs space-y-1 text-ink-muted">
                <div className="text-red-400 font-bold">The Garbage Collection / Network Pause Hazard:</div>
                <div>1. Client A acquires lock on Seat F-12 with 600s TTL.</div>
                <div>2. Client A experiences a long stop-the-world JVM pause or network stall lasting 601s.</div>
                <div>3. Lock expires in Redis. Client B acquires lock on Seat F-12 with new TTL.</div>
                <div>4. Client A wakes up from the pause, unaware that time has elapsed, and writes a commit to the database!</div>
                <div>5. Client B also writes a commit. <strong>Result: Double-booking disaster!</strong></div>
              </div>
              <p>
                <strong>The Architectural Solution:</strong>
              </p>
              <ol className="list-decimal list-inside space-y-1 text-ink-muted text-xs">
                <li>
                  <strong>Monotonic Fencing Tokens:</strong> Redis generates a strictly increasing token (<code>INCR fencing_seq</code>) with every lock grant. The database rejects any write whose fencing token is lower than the last recorded token for that resource.
                </li>
                <li>
                  <strong>Physical Database Constraints:</strong> The relational database (Aurora PostgreSQL) enforces <code>UNIQUE (show_id, seat_id) WHERE status = &apos;CONFIRMED&apos;</code>. The ephemeral cache acts as a high-speed <em>admission filter</em>; the durable database acts as the <em>unassailable referee of correctness</em>.
                </li>
              </ol>
            </div>
          </div>
        </section>

        {/* =========================================================================
            CHAPTER F: CRITICAL REQUEST AND FAILURE FLOWS (8 SEQUENCE DIAGRAMS)
        ========================================================================= */}
        <section id="chapter-f" className="space-y-10 scroll-mt-24">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-accent-bms uppercase tracking-wider font-semibold">
              Chapter F
            </span>
            <span className="text-ink-muted">•</span>
            <span className="text-xs font-mono text-ink-muted">Critical Request &amp; Failure Flows</span>
          </div>
          <div className="space-y-1">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink-light flex items-center gap-2.5">
              <Activity className="w-6 h-6 text-accent-cyan" />
              Critical Request and Failure Sequences (Flows A through H)
            </h2>
            <p className="text-xs sm:text-sm text-ink-muted font-sans">
              Polished sequence diagrams covering every normal and abnormal edge case in the ticket reservation lifecycle.
            </p>
          </div>

          {/* Sequence A */}
          <div className="space-y-2">
            <h3 className="font-mono text-sm uppercase text-accent-cyan font-bold">
              Flow A: Viewing Available Seats (High-Throughput Read Path)
            </h3>
            <MermaidDiagram
              chart={seqFlowA}
              title="Flow A: Viewing Available Seats"
              explanation="Client polls seat map; API gateway routes to Catalog Service; Redis/Varnish binary bitmap serves 80,000 QPS with sub-2ms latency without touching relational database replicas."
            />
          </div>

          {/* Sequence B */}
          <div className="space-y-2">
            <h3 className="font-mono text-sm uppercase text-accent-bms font-bold">
              Flow B: Acquiring a Temporary Seat Hold (The Reservation Handshake)
            </h3>
            <MermaidDiagram
              chart={seqFlowB}
              title="Flow B: Acquiring a Temporary Seat Hold"
              explanation="Client selects seats; Saga Orchestrator executes atomic Lua script in Redis; single-threaded memory loop issues 10-minute hold and fencing token; persists hold record to PostgreSQL and calls Vista Box Office HoldSeats."
            />
          </div>

          {/* Sequence C */}
          <div className="space-y-2">
            <h3 className="font-mono text-sm uppercase text-amber-400 font-bold">
              Flow C: Two Customers Attempting to Reserve the Same Seat Simultaneously
            </h3>
            <MermaidDiagram
              chart={seqFlowC}
              title="Flow C: Concurrent Seat Contention Resolution"
              explanation="Alice and Bob click Seat F-12 at t = 0; Redis evaluates Alice first, granting lock with token 1042; Redis evaluates Bob next, immediately rejecting with 0; Bob receives HTTP 409 Conflict without touching PostgreSQL."
            />
          </div>

          {/* Sequence D */}
          <div className="space-y-2">
            <h3 className="font-mono text-sm uppercase text-emerald-400 font-bold">
              Flow D: Successful Payment and Booking Confirmation
            </h3>
            <MermaidDiagram
              chart={seqFlowD}
              title="Flow D: Successful Payment and Confirmation Flow"
              explanation="Payment gateway dispatches HMAC-signed webhook; Orchestrator executes atomic PostgreSQL ACID transaction enforcing UNIQUE constraint; Vista box office confirms seats; Debezium CDC streams to Kafka for ticket delivery."
            />
          </div>

          {/* Sequence E */}
          <div className="space-y-2">
            <h3 className="font-mono text-sm uppercase text-red-400 font-bold">
              Flow E: Payment Failure or Ambiguous Timeout (HTTP 504 Gateway Timeout)
            </h3>
            <MermaidDiagram
              chart={seqFlowE}
              title="Flow E: Ambiguous Payment Timeout Recovery"
              explanation="HTTP 504 timeout leaves transaction in PAYMENT_PENDING_AUDIT state; background Reconciliation Worker polls payment gateway API; confirms failure and triggers compensating release of seat locks."
            />
          </div>

          {/* Sequence F */}
          <div className="space-y-2">
            <h3 className="font-mono text-sm uppercase text-accent-violet font-bold">
              Flow F: Customer Abandoning Checkout and Seat Hold Expiring
            </h3>
            <MermaidDiagram
              chart={seqFlowF}
              title="Flow F: Abandoned Checkout TTL Expiry"
              explanation="Customer closes browser; 600s TTL expires in Redis; background Expiry Worker audits database, releases seat inventory, cancels Vista cinema counter hold, and updates catalog read cache."
            />
          </div>

          {/* Sequence G */}
          <div className="space-y-2">
            <h3 className="font-mono text-sm uppercase text-accent-cyan font-bold">
              Flow G: Payment Callback Delivered More Than Once (Idempotency Table)
            </h3>
            <MermaidDiagram
              chart={seqFlowG}
              title="Flow G: Duplicate Webhook Delivery Idempotency Protection"
              explanation="Payment gateway retries webhook; first delivery records idempotency key; second delivery detects processed key and returns cached HTTP 200 OK without double-booking or duplicate ticket dispatch."
            />
          </div>

          {/* Sequence H */}
          <div className="space-y-2">
            <h3 className="font-mono text-sm uppercase text-amber-400 font-bold">
              Flow H: Recovery When Confirmation Processing Fails After Payment Succeeds
            </h3>
            <MermaidDiagram
              chart={seqFlowH}
              title="Flow H: Crash Recovery During Multi-Phase Settlement"
              explanation="Application pod crashes after payment capture but before external Vista box office commit; background Reconciliation Worker detects orphaned state, completes Vista confirmation, and delivers tickets."
            />
          </div>
        </section>

        {/* =========================================================================
            CHAPTER G: PAYMENT RELIABILITY & SAGA LIFECYCLE
        ========================================================================= */}
        <section id="chapter-g" className="space-y-6 scroll-mt-24">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-accent-bms uppercase tracking-wider font-semibold">
              Chapter G
            </span>
            <span className="text-ink-muted">•</span>
            <span className="text-xs font-mono text-ink-muted">Payment Reliability</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink-light flex items-center gap-2.5">
            <RotateCcw className="w-6 h-6 text-accent-violet" />
            Payment Reliability, Webhook Idempotency &amp; Saga State Machine
          </h2>

          <div className="prose prose-invert max-w-none space-y-4 text-ink-light/90 leading-relaxed text-sm sm:text-base">
            <p>
              A common misconception in introductory system design is that a payment transaction can be wrapped in a single database transaction across third-party systems. In real-world enterprise architectures, <strong>Two-Phase Commit (2PC) is impossible</strong>: external payment gateways (Razorpay, Stripe) and cinema box office APIs (Vista Connect) do not expose XA transaction interfaces, and holding database locks across external network round-trips causes global connection starvation.
            </p>
            <p>
              Instead, the reference architecture implements an <strong>Orchestrated Distributed Saga</strong> governed by an explicit state machine:
            </p>
          </div>

          {/* State Machine Diagram */}
          <MermaidDiagram
            chart={seatLifecycleStateChart}
            title="Complete Booking & Payment Lifecycle State Machine"
            explanation="Detailed state transitions from AVAILABLE through HELD, PAYMENT_PENDING, AMBIGUOUS_TIMEOUT, CONFIRMED, and compensating release rollbacks."
          />

          {/* The 3-Way Payment Defense */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-canvas-border bg-canvas-surface space-y-2">
              <div className="flex items-center gap-2 text-accent-cyan font-mono text-xs font-bold">
                <Lock className="w-4 h-4 text-accent-cyan" />
                <span>1. Idempotency Keys</span>
              </div>
              <p className="text-xs text-ink-muted leading-relaxed">
                All checkout calls and gateway charges carry a client-generated <code>Idempotency-Key</code> header (e.g. <code>ord_771_v1</code>). Stored in a database table with a unique constraint, preventing duplicate credit card debits during network retries.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-canvas-border bg-canvas-surface space-y-2">
              <div className="flex items-center gap-2 text-accent-bms font-mono text-xs font-bold">
                <ShieldCheck className="w-4 h-4 text-accent-bms" />
                <span>2. HMAC Webhooks</span>
              </div>
              <p className="text-xs text-ink-muted leading-relaxed">
                Payment confirmations arrive asynchronously via webhook. The API gateway verifies the cryptographic <code>X-Razorpay-Signature</code> (HMAC-SHA256) before passing the payload to the orchestrator.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-canvas-border bg-canvas-surface space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold">
                <RotateCcw className="w-4 h-4 text-emerald-400" />
                <span>3. Polling Reconciliation</span>
              </div>
              <p className="text-xs text-ink-muted leading-relaxed">
                An HTTP 504 timeout is treated as AMBIGUOUS, never as failure. A background worker periodically queries the payment gateway API (<code>GET /v1/payments/{'{id}'}</code>) to resolve ambiguous states before releasing inventory.
              </p>
            </div>
          </div>
        </section>

        {/* =========================================================================
            CHAPTER H: TRAFFIC, ADMISSION CONTROL & CAPACITY MODELING
        ========================================================================= */}
        <section id="chapter-h" className="space-y-6 scroll-mt-24">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-accent-bms uppercase tracking-wider font-semibold">
              Chapter H
            </span>
            <span className="text-ink-muted">•</span>
            <span className="text-xs font-mono text-ink-muted">Traffic &amp; Capacity Modeling</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink-light flex items-center gap-2.5">
            <Calculator className="w-6 h-6 text-accent-cyan" />
            Traffic &amp; Scalability: Capacity Equations &amp; Contention Mechanics
          </h2>

          <p className="text-ink-light/90 leading-relaxed text-sm sm:text-base">
            Below is an illustrative capacity model comparing steady-state movie browsing with an extreme flash-sale on-sale (e.g., stadium concert or cricket final):
          </p>

          {/* Capacity Equations Box */}
          <div className="p-5 rounded-xl border border-canvas-border bg-canvas-dark font-mono text-xs space-y-4">
            <div className="text-accent-cyan font-bold text-sm uppercase">
              Mathematical Capacity Formulations
            </div>

            <div className="space-y-2 text-ink-muted">
              <div>
                <strong className="text-ink-light">1. Contention Intensity (C):</strong>{' '}
                <code>C = N / S_cat</code>
              </div>
              <p className="text-[11px] leading-relaxed">
                Where <code>N = 25,000</code> concurrent users clicking at t = 0, and <code>S_cat = 100</code> front-row seats. <code>C = 250 users per seat</code>. Exactly 100 succeed; 24,900 must be shed instantly.
              </p>

              <div>
                <strong className="text-ink-light">2. Active Hold Memory Sizing:</strong>{' '}
                <code>RAM = H_active * (K_size + V_size + M_overhead)</code>
              </div>
              <p className="text-[11px] leading-relaxed">
                For 200,000 platform-wide active holds, key size ~40B, JSON payload ~160B, Redis dict overhead ~300B. Total RAM: <code>200,000 * 500 bytes = 100 MB</code>. Memory is cheap; serialization throughput is the true bottleneck.
              </p>

              <div>
                <strong className="text-ink-light">3. Ingress Read-to-Write Ratio (R/W):</strong>{' '}
                <code>Ratio_normal = 1,500 / 150 = 10:1</code> | <code>Ratio_surge = 80,000 / 50,000 = 1.6:1</code>
              </div>
            </div>
          </div>

          {/* Capacity Modeling Table */}
          <div className="rounded-xl border border-canvas-border bg-canvas-surface overflow-hidden">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-canvas-dark border-b border-canvas-border font-mono text-[11px] text-ink-muted uppercase">
                <tr>
                  <th className="p-3.5">Metric</th>
                  <th className="p-3.5">Steady-State Cinema Browsing</th>
                  <th className="p-3.5">Stadium Concert Flash Sale</th>
                  <th className="p-3.5">Scaling Factor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-canvas-borderSubtle">
                <tr className="hover:bg-canvas-elevated/50">
                  <td className="p-3.5 font-mono text-ink-light font-semibold">Concurrent Active Users</td>
                  <td className="p-3.5 text-ink-muted">50,000 users</td>
                  <td className="p-3.5 text-accent-bms font-bold">2,000,000+ queued users</td>
                  <td className="p-3.5 font-mono text-ink-light">40x</td>
                </tr>
                <tr className="hover:bg-canvas-elevated/50">
                  <td className="p-3.5 font-mono text-ink-light font-semibold">Seat Map Read QPS</td>
                  <td className="p-3.5 text-ink-muted">1,500 QPS</td>
                  <td className="p-3.5 text-accent-cyan font-bold">80,000 QPS</td>
                  <td className="p-3.5 font-mono text-ink-light">~53x</td>
                </tr>
                <tr className="hover:bg-canvas-elevated/50">
                  <td className="p-3.5 font-mono text-ink-light font-semibold">Hold Write Attempts QPS</td>
                  <td className="p-3.5 text-ink-muted">150 QPS</td>
                  <td className="p-3.5 text-amber-400 font-bold">50,000 QPS at t = 0</td>
                  <td className="p-3.5 font-mono text-ink-light">333x</td>
                </tr>
                <tr className="hover:bg-canvas-elevated/50">
                  <td className="p-3.5 font-mono text-ink-light font-semibold">Database Connection Pool</td>
                  <td className="p-3.5 text-ink-muted">50 active connections</td>
                  <td className="p-3.5 text-emerald-400 font-bold">Max 200 (PgBouncer multiplexed)</td>
                  <td className="p-3.5 font-mono text-ink-light">Protected via Queue</td>
                </tr>
                <tr className="hover:bg-canvas-elevated/50">
                  <td className="p-3.5 font-mono text-ink-light font-semibold">Checkout Timer TTL</td>
                  <td className="p-3.5 text-ink-muted">10 minutes (600s)</td>
                  <td className="p-3.5 text-ink-light font-semibold">8–10 minutes (480–600s)</td>
                  <td className="p-3.5 font-mono text-emerald-400">Invariant</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Admission Control & Virtual Waiting Room */}
          <div className="p-4 rounded-xl bg-canvas-surface border border-canvas-border space-y-3">
            <h4 className="font-mono text-xs uppercase text-accent-cyan font-bold flex items-center gap-2">
              <Server className="w-4 h-4 text-accent-cyan" />
              <span>Admission Control: The Edge Virtual Waiting Room</span>
            </h4>
            <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
              When 2,000,000 users arrive at release time, allowing all requests directly into the seat selection engine causes instant network and database failure. Instead, an edge-based <strong>Virtual Waiting Room</strong> (CloudFront/Cloudflare) queues users at the CDN boundary, issuing cryptographically signed queue tickets. Users are admitted into the seat selection engine at a controlled rate (e.g., 500 users per second), perfectly matching database write capacity.
            </p>
          </div>
        </section>

        {/* =========================================================================
            CHAPTER I: PRODUCTION FAILURE MATRIX
        ========================================================================= */}
        <section id="chapter-i" className="space-y-6 scroll-mt-24">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-accent-bms uppercase tracking-wider font-semibold">
              Chapter I
            </span>
            <span className="text-ink-muted">•</span>
            <span className="text-xs font-mono text-ink-muted">Reliability Engineering</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink-light flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-red-400" />
            Production Failure-Handling Matrix
          </h2>

          <p className="text-ink-light/90 leading-relaxed text-sm sm:text-base">
            Distributed ticketing architectures must survive network partitions, process pauses, and external system outages without compromising the core invariant:
          </p>

          <div className="rounded-xl border border-canvas-border bg-canvas-surface overflow-hidden">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-canvas-dark border-b border-canvas-border font-mono text-[11px] text-ink-muted uppercase">
                <tr>
                  <th className="p-3.5">Failure Mode</th>
                  <th className="p-3.5">Detection Mechanism</th>
                  <th className="p-3.5">Automated Recovery Protocol</th>
                  <th className="p-3.5">Invariant Preservation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-canvas-borderSubtle">
                <tr className="hover:bg-canvas-elevated/50">
                  <td className="p-3.5 font-mono text-red-400 font-semibold">
                    1. Redis Primary Node Crash
                  </td>
                  <td className="p-3.5 text-ink-muted">Heartbeat loss (&gt; 3s) via Sentinel / Cluster</td>
                  <td className="p-3.5 text-ink-light">
                    Promotes in-sync replica. State rebuilt from PostgreSQL active holds table.
                  </td>
                  <td className="p-3.5 text-emerald-400 font-mono font-bold">100% (DB is Source of Truth)</td>
                </tr>
                <tr className="hover:bg-canvas-elevated/50">
                  <td className="p-3.5 font-mono text-red-400 font-semibold">
                    2. PostgreSQL Writer Failover
                  </td>
                  <td className="p-3.5 text-ink-muted">Aurora storage consensus heartbeat timeout</td>
                  <td className="p-3.5 text-ink-light">
                    Automatic replica promotion (&lt; 30s). PgBouncer holds incoming write connections.
                  </td>
                  <td className="p-3.5 text-emerald-400 font-mono font-bold">100% (ACID WAL Replay)</td>
                </tr>
                <tr className="hover:bg-canvas-elevated/50">
                  <td className="p-3.5 font-mono text-amber-400 font-semibold">
                    3. Vista Multiplex POS Outage
                  </td>
                  <td className="p-3.5 text-ink-muted">Circuit breaker trips after 3 consecutive 1500ms timeouts</td>
                  <td className="p-3.5 text-ink-light">
                    Degrades cinema screen to &apos;Temporarily Offline&apos;; triggers Saga compensation rollbacks.
                  </td>
                  <td className="p-3.5 text-emerald-400 font-mono font-bold">100% (Prevents Phantom Holds)</td>
                </tr>
                <tr className="hover:bg-canvas-elevated/50">
                  <td className="p-3.5 font-mono text-amber-400 font-semibold">
                    4. Payment Webhook Dropped
                  </td>
                  <td className="p-3.5 text-ink-muted">Booking remains PAYMENT_PENDING past 5 minutes</td>
                  <td className="p-3.5 text-ink-light">
                    Reconciliation Worker polls Gateway API (<code>GET /v1/payments</code>) to confirm capture.
                  </td>
                  <td className="p-3.5 text-emerald-400 font-mono font-bold">100% (Zero Lost Purchases)</td>
                </tr>
                <tr className="hover:bg-canvas-elevated/50">
                  <td className="p-3.5 font-mono text-purple-400 font-semibold">
                    5. App Pod GC Pause (&gt; TTL)
                  </td>
                  <td className="p-3.5 text-ink-muted">Stale write attempt to PostgreSQL</td>
                  <td className="p-3.5 text-ink-light">
                    PostgreSQL rejects write due to superseded monotonic fencing token.
                  </td>
                  <td className="p-3.5 text-emerald-400 font-mono font-bold">100% (Kleppmann Safety)</td>
                </tr>
                <tr className="hover:bg-canvas-elevated/50">
                  <td className="p-3.5 font-mono text-blue-400 font-semibold">
                    6. Duplicate Checkout Clicks
                  </td>
                  <td className="p-3.5 text-ink-muted">Duplicate HTTP request with identical Idempotency-Key</td>
                  <td className="p-3.5 text-ink-light">
                    API Gateway and DB idempotency table return cached response instantly.
                  </td>
                  <td className="p-3.5 text-emerald-400 font-mono font-bold">100% (Zero Double Charges)</td>
                </tr>
                <tr className="hover:bg-canvas-elevated/50">
                  <td className="p-3.5 font-mono text-blue-400 font-semibold">
                    7. User Abandons Checkout
                  </td>
                  <td className="p-3.5 text-ink-muted">Redis key TTL reaches 0 (600s)</td>
                  <td className="p-3.5 text-ink-light">
                    Background Expiry Worker purges DB hold row and dispatches <code>CancelHold</code> to Vista.
                  </td>
                  <td className="p-3.5 text-emerald-400 font-mono font-bold">100% (Inventory Recycled)</td>
                </tr>
                <tr className="hover:bg-canvas-elevated/50">
                  <td className="p-3.5 font-mono text-purple-400 font-semibold">
                    8. Kafka Broker Outage
                  </td>
                  <td className="p-3.5 text-ink-muted">Publish timeout in Debezium Outbox Worker</td>
                  <td className="p-3.5 text-ink-light">
                    WAL events safely retained in PostgreSQL outbox table; retried automatically on recovery.
                  </td>
                  <td className="p-3.5 text-emerald-400 font-mono font-bold">100% (No Lost Events)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* =========================================================================
            CHAPTER J: ARCHITECTURE DECISION RECORDS (ADRS)
        ========================================================================= */}
        <section id="chapter-j" className="space-y-6 scroll-mt-24">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-accent-bms uppercase tracking-wider font-semibold">
              Chapter J
            </span>
            <span className="text-ink-muted">•</span>
            <span className="text-xs font-mono text-ink-muted">Design Decisions</span>
          </div>
          <div className="space-y-1">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink-light flex items-center gap-2.5">
              <Sliders className="w-6 h-6 text-accent-violet" />
              Architecture Decision Records (ADRs)
            </h2>
            <p className="text-xs sm:text-sm text-ink-muted font-sans">
              Authoritative records documenting trade-offs, evaluated options, and rationale for six core architectural pillars.
            </p>
          </div>

          <div className="space-y-4">
            {BMS_ADRS.map(adr => (
              <div
                key={adr.id}
                className="p-5 rounded-xl border border-canvas-border bg-canvas-surface space-y-3 hover:border-canvas-borderFocus transition-colors"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-accent-bms font-bold">{adr.id}</span>
                    <span className="text-ink-muted">•</span>
                    <h3 className="font-serif text-base sm:text-lg font-bold text-ink-light">
                      {adr.title}
                    </h3>
                  </div>
                  <EvidenceBadge tier={adr.evidenceStatus} size="sm" />
                </div>

                <div className="space-y-2 text-xs sm:text-sm">
                  <div>
                    <span className="font-mono text-[11px] text-ink-muted uppercase">Problem:</span>
                    <p className="text-ink-light/90 mt-0.5 leading-relaxed">{adr.problem}</p>
                  </div>

                  <div className="p-3 rounded-lg bg-canvas-dark border border-canvas-borderSubtle space-y-1.5 font-mono text-xs">
                    <span className="text-[11px] text-accent-cyan uppercase font-bold">Evaluated Options:</span>
                    <ul className="space-y-1 text-ink-muted">
                      {adr.options.map((opt, idx) => (
                        <li key={idx} className="leading-relaxed">{opt}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <span className="font-mono text-[11px] text-emerald-400 uppercase font-bold">
                      Chosen Architecture:
                    </span>
                    <p className="text-ink-light font-medium mt-0.5 leading-relaxed">{adr.chosenApproach}</p>
                  </div>

                  <div>
                    <span className="font-mono text-[11px] text-ink-muted uppercase">Rationale:</span>
                    <p className="text-ink-muted mt-0.5 leading-relaxed">{adr.rationale}</p>
                  </div>

                  <div>
                    <span className="font-mono text-[11px] text-amber-400 uppercase">Trade-Offs &amp; Drawbacks:</span>
                    <p className="text-ink-muted mt-0.5 leading-relaxed">{adr.drawbacks}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* =========================================================================
            CHAPTER K: CANONICAL REFERENCES & CITATIONS
        ========================================================================= */}
        <section id="chapter-k" className="space-y-6 scroll-mt-24 border-t border-canvas-border pt-8">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-accent-cyan uppercase tracking-wider font-semibold">
              Chapter K
            </span>
            <span className="text-ink-muted">•</span>
            <span className="text-xs font-mono text-ink-muted">Bibliography</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink-light">
            Canonical Primary Sources &amp; Research Citations
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
            <a
              href="https://www.databricks.com/customers/bookmyshow"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3.5 rounded-lg bg-canvas-surface border border-canvas-border hover:border-accent-cyan/50 text-ink-light transition-colors flex items-center justify-between"
            >
              <span>[SRC-BMS-CORP-01] BookMyShow Databricks &amp; AWS Analytics (2021)</span>
              <ExternalLink className="w-3.5 h-3.5 text-accent-cyan shrink-0" />
            </a>
            <a
              href="https://www.vista.co/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3.5 rounded-lg bg-canvas-surface border border-canvas-border hover:border-accent-cyan/50 text-ink-light transition-colors flex items-center justify-between"
            >
              <span>[SRC-BMS-EXT-01] Vista Cinema Box Office Connect API Protocol</span>
              <ExternalLink className="w-3.5 h-3.5 text-accent-cyan shrink-0" />
            </a>
            <a
              href="https://dataintensive.net/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3.5 rounded-lg bg-canvas-surface border border-canvas-border hover:border-accent-cyan/50 text-ink-light transition-colors flex items-center justify-between"
            >
              <span>[SRC-DIST-01] Designing Data-Intensive Applications (Kleppmann)</span>
              <ExternalLink className="w-3.5 h-3.5 text-accent-cyan shrink-0" />
            </a>
            <a
              href="https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3.5 rounded-lg bg-canvas-surface border border-canvas-border hover:border-accent-cyan/50 text-ink-light transition-colors flex items-center justify-between"
            >
              <span>[SRC-DIST-02] Distributed Locks with Redis (antirez vs Kleppmann)</span>
              <ExternalLink className="w-3.5 h-3.5 text-accent-cyan shrink-0" />
            </a>
            <a
              href="https://stripe.com/blog/idempotency"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3.5 rounded-lg bg-canvas-surface border border-canvas-border hover:border-accent-cyan/50 text-ink-light transition-colors flex items-center justify-between"
            >
              <span>[SRC-DIST-03] Idempotency on Stripe APIs (Brandur Leach)</span>
              <ExternalLink className="w-3.5 h-3.5 text-accent-cyan shrink-0" />
            </a>
            <a
              href="https://microservices.io/patterns/data/saga.html"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3.5 rounded-lg bg-canvas-surface border border-canvas-border hover:border-accent-cyan/50 text-ink-light transition-colors flex items-center justify-between"
            >
              <span>[SRC-DIST-04] Pattern: Saga in Distributed Architectures (Richardson)</span>
              <ExternalLink className="w-3.5 h-3.5 text-accent-cyan shrink-0" />
            </a>
            <a
              href="https://microservices.io/patterns/data/transactional-outbox.html"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3.5 rounded-lg bg-canvas-surface border border-canvas-border hover:border-accent-cyan/50 text-ink-light transition-colors flex items-center justify-between"
            >
              <span>[SRC-DIST-05] Pattern: Transactional Outbox Pattern</span>
              <ExternalLink className="w-3.5 h-3.5 text-accent-cyan shrink-0" />
            </a>
            <a
              href="https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3.5 rounded-lg bg-canvas-surface border border-canvas-border hover:border-accent-cyan/50 text-ink-light transition-colors flex items-center justify-between"
            >
              <span>[SRC-AWS-AURORA-01] Amazon Aurora PostgreSQL Under High Concurrency</span>
              <ExternalLink className="w-3.5 h-3.5 text-accent-cyan shrink-0" />
            </a>
          </div>
        </section>

        {/* Navigation Footer */}
        <div className="pt-8 border-t border-canvas-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link
            to="/netflix"
            className="text-xs font-mono text-ink-muted hover:text-ink-light transition-colors"
          >
            ← Previous: Netflix Personalization &amp; CDN
          </Link>
          <Link
            to="/comparison"
            className="px-5 py-2.5 rounded-lg bg-canvas-surface hover:bg-canvas-elevated border border-canvas-border text-ink-light text-xs sm:text-sm font-sans font-medium flex items-center gap-2 transition-all shadow-md"
          >
            <span>Continue to Architectural Synthesis</span>
            <ArrowRight className="w-4 h-4 text-accent-bms" />
          </Link>
        </div>

      </article>
    </div>
  );
};
