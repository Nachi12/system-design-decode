import React, { useState } from 'react';
import { TradeoffTable } from '../components/editorial/TradeoffTable';
import { TRADEOFF_DATA } from '../data/tradeoffs';
import { CalloutNote } from '../components/editorial/CalloutNote';
import { MermaidDiagram } from '../components/diagram/MermaidDiagram';
import { 
  Database, 
  ArrowRight, 
  Scale, 
  GitCompare, 
  Zap, 
  Layers, 
  Sliders,
  Calculator
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const ComparisonPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'table' | 'paired-flow' | 'lessons'>('table');

  // Paired Architecture Flow Diagrams
  const pairedDataflowChart = `
flowchart TB
    subgraph NETFLIX ["NETFLIX: READ-HEAVY / AP ARITY"]
        direction TB
        N_User["250M+ Members"] --> N_Edge["Zuul 2 API Gateway"]
        N_Edge --> N_Assemble["Page Assembly Engine (100ms Deadline)"]
        N_Assemble --> N_Cache["EVCache / Redis (Precomputed Rows)"]
        N_Assemble --> N_Rank["Online Scoring Ranker"]
        N_Rank --> N_ReRank["Diversity Re-Ranker"]
        N_ReRank --> N_Return["2D Layout Tree JSON (120KB)"]
        
        N_Video["Playback Stream"] --> N_OCA["Open Connect Appliance (ISP Edge)"]
        N_OCA --> N_ZeroCopy["FreeBSD Zero-Copy sendfile + kTLS"]
        N_ZeroCopy --> N_Bits["100 Gbps Encrypted Stream"]
    end

    subgraph BMS ["BOOKMYSHOW: WRITE-CONTENDED / CP ARITY"]
        direction TB
        B_User["2M Queued Users"] --> B_Wait["Edge Virtual Waiting Room (Token Bucket)"]
        B_Wait --> B_Orch["Booking Orchestrator (Saga)"]
        B_Orch --> B_Lua["Redis Lua Atomic CAS (TTL 600s + Fencing Token)"]
        B_Lua -->|1. Lock Granted| B_DB["Aurora PostgreSQL Writer (UNIQUE Constraint)"]
        B_Lua -->|0. Contention Lost| B_Reject["HTTP 409 Conflict (Shed in under 2ms)"]
        B_Orch --> B_Vista["Vista Cinema POS (HoldSeats)"]
        B_DB --> B_Outbox["Outbox Table (CDC via Debezium)"]
        B_Outbox --> B_Kafka["Kafka (booking.confirmed)"]
        B_Kafka --> B_Ticket["Signed QR Code Ticket Issued"]
    end

    style NETFLIX fill:#1e1014,stroke:#E50914,stroke-width:1px
    style BMS fill:#1e1218,stroke:#F84464,stroke-width:1px
  `;

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      {/* 1. Header */}
      <header className="border-b border-canvas-border pb-8 space-y-4">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs uppercase tracking-wider text-accent-cyan font-semibold flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5" /> ARCHITECTURAL SYNTHESIS // DIALECTIC
          </span>
          <span className="font-mono text-xs text-ink-muted">• Cross-Case Systems Analysis</span>
        </div>

        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-ink-light tracking-tight leading-tight">
          Read-Heavy Recommendation vs. Contended-Write Ticketing
        </h1>

        <p className="text-base sm:text-lg text-ink-muted leading-relaxed max-w-4xl">
          An architectural deconstruction of how differing operational constraints dictate fundamentally divergent distributed designs: contrasting Netflix&apos;s cache-centric, eventually consistent recommendation and CDN architecture with BookMyShow&apos;s lock-centric, linearizable concurrency reference architecture.
        </p>

        {/* Quick Navigation to Atlas Components */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Link
            to="/adrs"
            className="px-3 py-1.5 rounded-lg bg-canvas-surface border border-canvas-border hover:border-accent-violet/50 text-xs font-mono text-ink-light flex items-center gap-1.5 transition-colors"
          >
            <Sliders className="w-3.5 h-3.5 text-accent-violet" />
            <span>Architecture Decision Records (11 ADRs)</span>
          </Link>
          <Link
            to="/capacity"
            className="px-3 py-1.5 rounded-lg bg-canvas-surface border border-canvas-border hover:border-accent-cyan/50 text-xs font-mono text-ink-light flex items-center gap-1.5 transition-colors"
          >
            <Calculator className="w-3.5 h-3.5 text-accent-cyan" />
            <span>Interactive Capacity Notebook (4 Models)</span>
          </Link>
        </div>
      </header>

      {/* 2. Summary Dialectic Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Netflix Card */}
        <div className="p-6 rounded-xl border border-canvas-border bg-canvas-surface space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-accent-netflix font-bold uppercase tracking-wider">
              Netflix: Planetary Read-Heavy Archetype
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30 font-bold">
              AP / PA-EL Leaning
            </span>
          </div>
          <h3 className="font-serif text-xl sm:text-2xl font-bold text-ink-light">
            Throughput via Aggressive Caching &amp; Graceful Degradation
          </h3>
          <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
            Read-to-write ratios exceed 100:1. Digital video streams are fungible and infinitely concurrent. Showing a slightly stale row or falling back to precomputed recommendations is completely acceptable to protect availability. Primary optimizations: cache hit ratios (&gt; 95%), sub-100ms response deadlines, and zero-copy kernel streaming (100 Gbps per appliance).
          </p>
          <div className="pt-2 flex items-center justify-between text-xs font-mono border-t border-canvas-borderSubtle">
            <span className="text-ink-muted">Asset Fungibility:</span>
            <span className="text-emerald-400 font-bold">Infinite Concurrency</span>
          </div>
        </div>

        {/* BookMyShow Card */}
        <div className="p-6 rounded-xl border border-canvas-border bg-canvas-surface space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-accent-bms font-bold uppercase tracking-wider">
              BookMyShow: Contended-Write Archetype
            </span>
            <span className="text-[10px] font-mono text-purple-400 bg-purple-950/40 px-2 py-0.5 rounded border border-purple-500/30 font-bold">
              CP / PC-EC Leaning
            </span>
          </div>
          <h3 className="font-serif text-xl sm:text-2xl font-bold text-ink-light">
            Correctness via In-Memory Serialization &amp; Hard Invariants
          </h3>
          <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
            Extreme write contention concentrated on finite, strictly non-fungible inventory keys. Caching seat status for even 5 seconds causes catastrophic double-booking thundering herds. Adding database read replicas cannot solve contested rows. Primary optimizations: atomic Lua CAS mutexes, fencing tokens, Saga compensations, and physical database unique constraints.
          </p>
          <div className="pt-2 flex items-center justify-between text-xs font-mono border-t border-canvas-borderSubtle">
            <span className="text-ink-muted">Asset Fungibility:</span>
            <span className="text-accent-bms font-bold">Strictly Non-Fungible</span>
          </div>
        </div>
      </section>

      {/* 3. Navigation View Switcher (Table vs Paired Flow vs Lessons) */}
      <section className="space-y-6">
        <div className="flex flex-wrap items-center gap-2 border-b border-canvas-border pb-3">
          <button
            onClick={() => setActiveTab('table')}
            className={`px-4 py-2 rounded-lg font-mono text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'table'
                ? 'bg-canvas-elevated text-ink-light border border-canvas-border shadow-sm'
                : 'text-ink-muted hover:text-ink-light hover:bg-canvas-surface'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5 text-accent-cyan" />
            <span>11-Dimensional Comparison Table</span>
          </button>

          <button
            onClick={() => setActiveTab('paired-flow')}
            className={`px-4 py-2 rounded-lg font-mono text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'paired-flow'
                ? 'bg-canvas-elevated text-ink-light border border-canvas-border shadow-sm'
                : 'text-ink-muted hover:text-ink-light hover:bg-canvas-surface'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-accent-violet" />
            <span>Paired Architecture Topologies</span>
          </button>

          <button
            onClick={() => setActiveTab('lessons')}
            className={`px-4 py-2 rounded-lg font-mono text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'lessons'
                ? 'bg-canvas-elevated text-ink-light border border-canvas-border shadow-sm'
                : 'text-ink-muted hover:text-ink-light hover:bg-canvas-surface'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Staff Engineering Lessons</span>
          </button>
        </div>

        {/* Tab 1: 11-Dimensional Comparison Table */}
        {activeTab === 'table' && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-ink-light">
                Comprehensive 11-Dimensional Architectural Matrix
              </h3>
              <p className="text-xs text-ink-muted font-sans">
                A granular, side-by-side technical evaluation across consistency, caching, event streaming, capacity sizing, and operational risks.
              </p>
            </div>
            <TradeoffTable items={TRADEOFF_DATA} />
          </div>
        )}

        {/* Tab 2: Paired Architecture Visualizations */}
        {activeTab === 'paired-flow' && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-ink-light">
                Paired End-to-End Dataflow Contrast
              </h3>
              <p className="text-xs text-ink-muted font-sans">
                Comparing the cache-heavy, fan-out pipeline of Netflix against the serialized mutex-gated pipeline of BookMyShow.
              </p>
            </div>
            <MermaidDiagram
              chart={pairedDataflowChart}
              title="Paired Architectural Dataflows: Netflix vs. BookMyShow"
              explanation="Visualizing how requests diverge: Netflix fans out across candidate algorithms with fallback caches; BookMyShow gates ingress through waiting rooms, serializes in memory via Lua CAS, and commits via Outbox CDC."
            />
          </div>
        )}

        {/* Tab 3: Staff Architect Lessons */}
        {activeTab === 'lessons' && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-ink-light">
                Key Architectural Lessons for Staff &amp; Principal Systems Engineers
              </h3>
              <p className="text-xs text-ink-muted font-sans">
                Five non-intuitive principles synthesized from the comparison of these two systems:
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="p-5 rounded-xl border border-canvas-border bg-canvas-surface space-y-2">
                <div className="flex items-center gap-2 font-mono text-xs text-accent-cyan font-bold uppercase">
                  <span>Lesson 1: Asset Fungibility Dictates Consistency Requirements</span>
                </div>
                <p className="text-xs sm:text-sm text-ink-light/90 leading-relaxed font-sans">
                  The primary driver of distributed consistency is not traffic volume, but <strong>inventory fungibility</strong>. When an asset is fungible (e.g. video streams, e-commerce catalog items with thousands of units in stock), eventual consistency and multi-level caching scale effortlessly. When an asset is strictly non-fungible (e.g. physical seats, unique conference tickets), no amount of read replicas can avoid the physical requirement of linearizable write serialization.
                </p>
              </div>

              <div className="p-5 rounded-xl border border-canvas-border bg-canvas-surface space-y-2">
                <div className="flex items-center gap-2 font-mono text-xs text-accent-bms font-bold uppercase">
                  <span>Lesson 2: Amdahl&apos;s Law at the Data Layer</span>
                </div>
                <p className="text-xs sm:text-sm text-ink-light/90 leading-relaxed font-sans">
                  Adding read replicas increases read throughput linearly (<code>N &times; QPS_replica</code>), but does not help when write contention targets a single row. Under extreme contention (e.g. 25,000 users attempting to claim the same 100 front-row seats), the throughput is bounded entirely by the serialized execution time of the mutual exclusion primitive. Serialization must occur in single-threaded memory loops (Redis Lua CAS) to shed losing requests before they overwhelm relational databases.
                </p>
              </div>

              <div className="p-5 rounded-xl border border-canvas-border bg-canvas-surface space-y-2">
                <div className="flex items-center gap-2 font-mono text-xs text-purple-400 font-bold uppercase">
                  <span>Lesson 3: Never Trust a Cache Lock Without Fencing Tokens</span>
                </div>
                <p className="text-xs sm:text-sm text-ink-light/90 leading-relaxed font-sans">
                  As proven by Martin Kleppmann, distributed locks with TTLs (whether single-instance Redis or Redlock) cannot guarantee mutual exclusion if application clients experience stop-the-world garbage collection pauses, page faults, or network stalls exceeding the TTL. A monotonic <strong>fencing token</strong> must accompany all write operations to ensure the storage tier rejects stale writes.
                </p>
              </div>

              <div className="p-5 rounded-xl border border-canvas-border bg-canvas-surface space-y-2">
                <div className="flex items-center gap-2 font-mono text-xs text-emerald-400 font-bold uppercase">
                  <span>Lesson 4: Reversible Operations Enable Graceful Degradation</span>
                </div>
                <p className="text-xs sm:text-sm text-ink-light/90 leading-relaxed font-sans">
                  Netflix can achieve 99.99% availability because serving a fallback recommendation row is completely <em>reversible</em> and has zero irreversible financial side effects. Ticketing and payments involve <em>irreversible state changes</em> (debiting a bank card, blocking a multiplex counter seat). Irreversible operations cannot use simple fallback degradation; they require distributed Sagas, idempotency keys, and reconciliation workers.
                </p>
              </div>

              <div className="p-5 rounded-xl border border-canvas-border bg-canvas-surface space-y-2">
                <div className="flex items-center gap-2 font-mono text-xs text-amber-400 font-bold uppercase">
                  <span>Lesson 5: Dual-Write Elimination via Transactional Outbox</span>
                </div>
                <p className="text-xs sm:text-sm text-ink-light/90 leading-relaxed font-sans">
                  Never attempt to execute an application-level dual-write (e.g. <code>db.commit()</code> followed by <code>kafka.send()</code>). If the application pod dies between the two calls, the state is permanently desynchronized. Committing domain events directly to an outbox table within the exact same ACID transaction, tailed via Change Data Capture (Debezium), guarantees zero lost events.
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 4. Deep Analysis: CAP & PACELC Breakdown */}
      <section className="space-y-4 border-t border-canvas-border pt-8">
        <h3 className="font-serif text-2xl font-bold text-ink-light flex items-center gap-2">
          <Database className="w-5 h-5 text-accent-cyan" />
          The CAP &amp; PACELC Theorems in Production Practice
        </h3>
        
        <p className="text-sm sm:text-base text-ink-light/90 leading-relaxed">
          Distributed systems trade-offs are not theoretical dilemmas—they are mechanical consequences of physical latency and network failure:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-canvas-border bg-canvas-surface space-y-2">
            <span className="font-mono text-xs font-bold text-emerald-400 uppercase">
              Netflix: The PA/EL Formulation
            </span>
            <p className="text-xs text-ink-muted leading-relaxed">
              If an AWS availability zone partitions (P), Netflix prioritizes <strong>Availability (A)</strong> over Consistency (C), serving whatever cached rows are available locally. Even in normal operation (E), Netflix prioritizes <strong>Latency (L)</strong> over Consistency (C), returning stale recommendation vectors to maintain the sub-100ms deadline.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-canvas-border bg-canvas-surface space-y-2">
            <span className="font-mono text-xs font-bold text-accent-bms uppercase">
              BookMyShow: The PC/EC Formulation
            </span>
            <p className="text-xs text-ink-muted leading-relaxed">
              If an availability zone partitions (P), BookMyShow prioritizes <strong>Consistency (C)</strong> over Availability (A), rejecting booking attempts on partitioned screens. In normal operation (E), BookMyShow prioritizes <strong>Consistency (C)</strong> over Latency (L), requiring synchronous Lua lock validation and database ACID commits before confirming.
            </p>
          </div>
        </div>

        <CalloutNote type="inference" title="The Fundamental Law of Replicated State">
          In a read-heavy system (Netflix), data replication horizontally expands capacity because replicas service independent read queries. In a contested write system (BookMyShow flash sales), replication increases coordination overhead because every replica must agree on the order of mutations before acknowledging a reservation.
        </CalloutNote>
      </section>

      {/* 5. Navigation Footer */}
      <div className="pt-6 border-t border-canvas-border flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link
          to="/bookmyshow"
          className="text-xs font-mono text-ink-muted hover:text-ink-light transition-colors"
        >
          ← Previous: BookMyShow Ticketing Case Study
        </Link>
        <Link
          to="/adrs"
          className="px-4 py-2 rounded-lg bg-canvas-surface hover:bg-canvas-elevated border border-canvas-border text-ink-light text-xs font-sans font-medium flex items-center gap-2 transition-colors"
        >
          <span>Explore Architecture Decision Records</span>
          <ArrowRight className="w-3.5 h-3.5 text-accent-cyan" />
        </Link>
      </div>
    </div>
  );
};
