import React from 'react';
import { Link } from 'react-router-dom';
import { MermaidDiagram } from '../diagram/MermaidDiagram';
import { EvidenceBadge } from '../editorial/EvidenceBadge';
import { 
  Zap, 
  Database, 
  ShieldCheck, 
  Layers, 
  AlertTriangle, 
  ArrowRight, 
  FileCode, 
  BookOpen 
} from 'lucide-react';

export const TechnicalMonograph: React.FC = () => {
  // 1. Mermaid Sequence Diagram: Concurrent Race Execution Flow
  const sequenceDiagramChart = `
sequenceDiagram
    autonumber
    actor Alpha as Customer Alpha
    actor Beta as Customer Beta
    participant API as SeatLock API Gateway
    participant Redis as Redis Coordination Layer
    participant PG as PostgreSQL (Durable ACID)

    par Simultaneous Requests for Seat B-5
        Alpha->>API: POST /shows/:id/holds (IdempotencyKey-A)
        Beta->>API: POST /shows/:id/holds (IdempotencyKey-B)
    end

    critical Ingress Lock Attempt
        API->>Redis: SET lock:show:id:seat:B5 <uuid-A> NX PX 5000
        Redis-->>API: OK (Lock Acquired for Alpha)
        API->>Redis: SET lock:show:id:seat:B5 <uuid-B> NX PX 5000
        Redis-->>API: nil (Key Exists - Contended)
    end

    Note over API,Beta: Beta Fast-Rejected: 409 SEAT_LOCK_CONTENDED<br/>PostgreSQL connection pool completely spared!

    API->>PG: BEGIN TRANSACTION
    API->>PG: SELECT * FROM show_seats WHERE seat_id = 'B5' FOR UPDATE
    Note over PG: Row-level exclusive lock granted to Alpha

    alt Seat Status == AVAILABLE
        API->>PG: INSERT INTO seat_holds (fencing_token = token + 1, status = 'ACTIVE')
        API->>PG: UPDATE show_seats SET status = 'HELD', hold_expires_at = NOW() + 60s
        API->>PG: COMMIT
        API->>Redis: EVAL Lua (Atomic Compare-and-Delete Lock)
        Redis-->>API: 1 (Released Safely)
        API-->>Alpha: 201 Created (Hold ID, Fencing Token, Trace)
    else Seat Already HELD / CONFIRMED
        API->>PG: ROLLBACK
        API->>Redis: EVAL Lua (Atomic Compare-and-Delete Lock)
        API-->>Alpha: 409 Conflict (Invariant Protected)
    end
`;

  // 2. Mermaid State Transition Diagram: Seat Lease Lifecycle
  const stateMachineChart = `
stateDiagram-v2
    [*] --> AVAILABLE : Seed Venue Topology

    AVAILABLE --> HELD : 1. Customer initiates hold<br/>(Redis Lock + PG FOR UPDATE)
    
    state HELD {
        [*] --> LeaseActive : Fencing Token Monotonically Incremented
        LeaseActive --> LeaseExpiring : 60-Second Countdown
    }

    HELD --> CONFIRMED : 2. Customer Confirms Booking<br/>(Hold Active & Fencing Token Matches)
    HELD --> AVAILABLE : 3a. Customer Navigates Away (Explicit Release)
    HELD --> AVAILABLE : 3b. TTL Expires (Lazy Reclamation / Reaper Sweep)

    CONFIRMED --> [*] : Durable Non-Reservable State
`;

  return (
    <div className="space-y-12 pt-6">
      {/* Monograph Section Header */}
      <div className="border-b border-canvas-border pb-6 space-y-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-accent-violet uppercase tracking-widest font-semibold">
            AREA D // TECHNICAL ARCHITECTURE MONOGRAPH
          </span>
          <span className="text-ink-muted text-xs">•</span>
          <EvidenceBadge tier="REFERENCE" size="sm" />
        </div>
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink-light tracking-tight">
          Distributed Coordination &amp; Concurrency Architecture
        </h2>
        <p className="text-sm sm:text-base text-ink-muted max-w-3xl leading-relaxed">
          Detailed analysis of the two-tier leasing pattern, the limits of coordination locks, and why durable PostgreSQL row-level isolation remains the authoritative invariant guardian.
        </p>
      </div>

      {/* Reciprocal Links to Research Chapters */}
      <div className="p-5 rounded-xl border border-canvas-border bg-gradient-to-r from-canvas-elevated via-canvas-surface to-canvas-dark space-y-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-accent-cyan" />
          <h4 className="font-sans font-bold text-sm text-ink-light uppercase tracking-wider">
            Canonical Research Monograph Cross-References
          </h4>
        </div>
        <p className="text-xs text-ink-muted leading-relaxed">
          SeatLock Lab is the executable reference implementation of the theoretical models formalized in the BookMyShow case study. Deepen your understanding in the following chapters:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <Link
            to="/bookmyshow#chapter-e"
            className="p-3 rounded-lg border border-canvas-border hover:border-accent-cyan/60 bg-canvas-dark/60 hover:bg-canvas-elevated transition-all flex flex-col justify-between group"
          >
            <div>
              <span className="font-mono text-[10px] text-accent-bms uppercase block">
                Chapter E // Core Engine
              </span>
              <span className="font-serif font-bold text-xs text-ink-light group-hover:text-accent-cyan transition-colors mt-0.5 block">
                Concurrency &amp; Consistency Analysis
              </span>
            </div>
            <span className="text-[11px] text-ink-muted mt-2 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Explore chapter <ArrowRight className="w-3 h-3 text-accent-cyan" />
            </span>
          </Link>

          <Link
            to="/bookmyshow#chapter-a"
            className="p-3 rounded-lg border border-canvas-border hover:border-accent-cyan/60 bg-canvas-dark/60 hover:bg-canvas-elevated transition-all flex flex-col justify-between group"
          >
            <div>
              <span className="font-mono text-[10px] text-accent-bms uppercase block">
                Chapter A // Requirements
              </span>
              <span className="font-serif font-bold text-xs text-ink-light group-hover:text-accent-cyan transition-colors mt-0.5 block">
                Problem Definition &amp; Invariants
              </span>
            </div>
            <span className="text-[11px] text-ink-muted mt-2 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Explore chapter <ArrowRight className="w-3 h-3 text-accent-cyan" />
            </span>
          </Link>

          <Link
            to="/bookmyshow#chapter-f"
            className="p-3 rounded-lg border border-canvas-border hover:border-accent-cyan/60 bg-canvas-dark/60 hover:bg-canvas-elevated transition-all flex flex-col justify-between group"
          >
            <div>
              <span className="font-mono text-[10px] text-accent-bms uppercase block">
                Chapter F // Workflows
              </span>
              <span className="font-serif font-bold text-xs text-ink-light group-hover:text-accent-cyan transition-colors mt-0.5 block">
                Critical Request &amp; Failure Flows
              </span>
            </div>
            <span className="text-[11px] text-ink-muted mt-2 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Explore chapter <ArrowRight className="w-3 h-3 text-accent-cyan" />
            </span>
          </Link>
        </div>
      </div>

      {/* Deep Dive 1: Redis vs PostgreSQL Hybrid Architecture */}
      <div className="space-y-4">
        <h3 className="font-serif text-xl sm:text-2xl font-bold text-ink-light flex items-center gap-2">
          <Layers className="w-5 h-5 text-accent-cyan" />
          The Two-Tier Architecture: Redis Ingress vs PostgreSQL Durable ACID
        </h3>

        <div className="prose prose-invert max-w-none text-xs sm:text-sm text-ink-light/90 leading-relaxed space-y-3">
          <p>
            Flash sales (e.g., concert tickets or IMAX opening weekends) produce extreme localized contention. Thousands of concurrent requests attempt to reserve the exact same seat within milliseconds. Architecting for this workload requires balancing two conflicting constraints: <strong>throughput preservation</strong> and <strong>absolute invariant correctness</strong>.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4 not-prose">
            <div className="p-4 rounded-xl border border-canvas-border bg-canvas-surface space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <h4 className="font-bold text-ink-light text-sm">Tier 1: Redis Ingress Coordination Lock</h4>
              </div>
              <p className="text-xs text-ink-muted leading-relaxed">
                Acts as an ultra-fast shock absorber. Uses an atomic <code className="font-mono text-ink-light">SET key token NX PX 5000</code> command. When 5,000 customers compete for Seat B-5, exactly 1 acquires the lock in &lt;1ms; the other 4,999 are fast-rejected with HTTP 409 without ever dispatching a query to PostgreSQL. This prevents database connection pool exhaustion.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-canvas-border bg-canvas-surface space-y-2">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-accent-cyan" />
                <h4 className="font-bold text-ink-light text-sm">Tier 2: PostgreSQL Durable Row Isolation</h4>
              </div>
              <p className="text-xs text-ink-muted leading-relaxed">
                Acts as the authoritative invariant guardian. Executes inside a transaction with <code className="font-mono text-ink-light">SELECT ss.status, ss.fencing_token FROM show_seats ss FOR UPDATE</code>. Validates unexpired hold state, persists auditable events, and monotonically increments fencing tokens. Guarantees zero double-booking even if Redis fails completely.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Sequence Flow Diagram */}
      <div className="space-y-4">
        <h3 className="font-serif text-xl sm:text-2xl font-bold text-ink-light flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400" />
          Request Sequence Flow: Two Concurrent Competitors
        </h3>
        <p className="text-xs text-ink-muted leading-relaxed">
          The diagram below traces the real execution lifecycle observed during the Area B concurrent race experiment.
        </p>

        <MermaidDiagram
          chart={sequenceDiagramChart}
          title="Concurrent Reservation Race & Ingress Contention Sequence"
          explanation="Customer Alpha acquires the Redis ingress lock and commits the PostgreSQL row transaction. Customer Beta experiences instant lock contention and is safely rejected without consuming database connections."
        />
      </div>

      {/* State Machine Diagram */}
      <div className="space-y-4">
        <h3 className="font-serif text-xl sm:text-2xl font-bold text-ink-light flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          Seat Inventory State Machine
        </h3>
        <p className="text-xs text-ink-muted leading-relaxed">
          A seat transitions through strict deterministic states. Only unexpired holds with matching fencing tokens can transition to CONFIRMED.
        </p>

        <MermaidDiagram
          chart={stateMachineChart}
          title="Seat Reservation Lease Lifecycle"
          explanation="Transitions from AVAILABLE to HELD are governed by lease timeouts. Holds that expire return to AVAILABLE automatically upon the next query or explicit reaper pass."
        />
      </div>

      {/* Deep Dive 2: Why Redis Alone Is Insufficient */}
      <div className="p-5 rounded-xl border border-rose-500/30 bg-rose-950/10 space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-400" />
          <h4 className="font-serif font-bold text-base sm:text-lg text-ink-light">
            Why a Coordination Lock Alone Does Not Guarantee Durable Correctness
          </h4>
        </div>
        <div className="text-xs sm:text-sm text-ink-light/90 leading-relaxed space-y-2">
          <p>
            A common architectural antipattern is relying solely on Redis or Redlock to enforce inventory invariants. In distributed systems, this is fundamentally flawed for three documented reasons:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-xs text-ink-muted pl-1">
            <li>
              <strong className="text-ink-light">Asynchronous Replication &amp; Failover Loss:</strong> Redis replicates asynchronously to replicas by default. If the master crashes immediately after granting a lock to Worker 1, the new master may not yet have that key, immediately granting the same lock to Worker 2.
            </li>
            <li>
              <strong className="text-ink-light">Process Pauses (GC &amp; IO Stalls):</strong> If Worker 1 experiences a 6-second garbage collection pause or network blip, its 5-second Redis lock expires. Worker 2 acquires the lock. Worker 1 then wakes up and writes its reservation, causing a silent double-booking unless protected by database fencing tokens.
            </li>
            <li>
              <strong className="text-ink-light">The Martin Kleppmann Redlock Critique:</strong> As proven by distributed systems researcher Martin Kleppmann, distributed locks without monotonic fencing tokens cannot guarantee mutual exclusion over storage layers that lack fencing token validation.
            </li>
          </ul>
        </div>
      </div>

      {/* Real API Contract Specification Table */}
      <div className="space-y-4">
        <h3 className="font-serif text-xl sm:text-2xl font-bold text-ink-light flex items-center gap-2">
          <FileCode className="w-5 h-5 text-accent-cyan" />
          API Contract Specifications
        </h3>

        <div className="rounded-xl border border-canvas-border bg-canvas-surface overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-canvas-dark border-b border-canvas-border text-ink-muted uppercase text-[10px]">
              <tr>
                <th className="p-3">Method &amp; Endpoint</th>
                <th className="p-3">Required Headers / Body</th>
                <th className="p-3">Expected Responses</th>
                <th className="p-3">Coordination Invariant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-canvas-borderSubtle text-ink-light">
              <tr className="hover:bg-canvas-elevated/40">
                <td className="p-3 font-bold text-accent-cyan">
                  POST /api/shows/:id/holds
                </td>
                <td className="p-3 text-ink-muted">
                  <span className="text-ink-light font-semibold">Header:</span> Idempotency-Key<br/>
                  <span className="text-ink-light font-semibold">Body:</span> seatId, customerId
                </td>
                <td className="p-3">
                  <span className="text-emerald-400 font-bold">201 Created</span> (hold granted)<br/>
                  <span className="text-emerald-400 font-bold">200 OK</span> (idempotent replay)<br/>
                  <span className="text-rose-400 font-bold">409 Conflict</span> (contended/held)
                </td>
                <td className="p-3 text-ink-muted">
                  Redis SET NX + PG FOR UPDATE. Increments fencing token.
                </td>
              </tr>
              <tr className="hover:bg-canvas-elevated/40">
                <td className="p-3 font-bold text-accent-cyan">
                  POST /api/holds/:id/confirm
                </td>
                <td className="p-3 text-ink-muted">
                  <span className="text-ink-light font-semibold">Body:</span> customerId
                </td>
                <td className="p-3">
                  <span className="text-emerald-400 font-bold">200 OK</span> (confirmed)<br/>
                  <span className="text-rose-400 font-bold">409 Conflict</span> (expired/superseded)
                </td>
                <td className="p-3 text-ink-muted">
                  Strict check: current_hold_id must match hold ID &amp; unexpired.
                </td>
              </tr>
              <tr className="hover:bg-canvas-elevated/40">
                <td className="p-3 font-bold text-accent-cyan">
                  POST /api/holds/:id/release
                </td>
                <td className="p-3 text-ink-muted">
                  <span className="text-ink-light font-semibold">Body:</span> customerId
                </td>
                <td className="p-3">
                  <span className="text-emerald-400 font-bold">200 OK</span> (released)
                </td>
                <td className="p-3 text-ink-muted">
                  Flips seat to AVAILABLE immediately if hold was ACTIVE.
                </td>
              </tr>
              <tr className="hover:bg-canvas-elevated/40">
                <td className="p-3 font-bold text-accent-cyan">
                  GET /api/shows/:id/seats
                </td>
                <td className="p-3 text-ink-muted">None</td>
                <td className="p-3">
                  <span className="text-emerald-400 font-bold">200 OK</span> (topology + remainingSeconds)
                </td>
                <td className="p-3 text-ink-muted">
                  Executes lazy expiry sweep to return expired seats to inventory.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
