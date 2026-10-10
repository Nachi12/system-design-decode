import { TradeoffItem } from '../types';

export const TRADEOFF_DATA: TradeoffItem[] = [
  {
    id: 'primary-objective',
    dimension: '1. Primary Engineering Objective',
    netflixApproach: 'Maximize subscriber discovery and engagement by delivering personalized, diverse 2D homepages under a strict sub-100ms SLA, while streaming video bytes with zero-copy efficiency directly at ISP edges.',
    bookmyshowApproach: 'Guarantee absolute inventory correctness for non-fungible physical assets under extreme flash-sale write contention, ensuring that a single seat is never double-allocated across concurrent buyers.',
    underlyingConstraint: 'Utility Maximization vs. Zero-Defect Safety: In recommendations, a 95% relevant row is a triumph; in ticketing, a 0.01% double-booking error causes physical confrontation and operational failure.',
    consequence: 'Netflix optimizes for graceful degradation and throughput; BookMyShow optimizes for linearizable correctness and transactional mutual exclusion.'
  },
  {
    id: 'workload-profile',
    dimension: '2. Read-Heavy vs. Write-Sensitive Workloads',
    netflixApproach: 'Asymmetrically Read-Heavy (> 100:1 read-to-write ratio). Hundreds of millions of concurrent browse sessions querying the same global title catalog with minimal state mutation (play start telemetry, ratings).',
    bookmyshowApproach: 'Extreme Hot-Spot Write Contention. Tens of thousands of concurrent write requests target the exact same 10–20 premium seat rows in an auditorium within a 500-millisecond window.',
    underlyingConstraint: "Amdahl's Law at the Data Layer: Horizontal read replicas scale read throughput linearly, but cannot scale write serialization on contested individual records.",
    consequence: 'Netflix scales easily with edge CDN caching and EVCache replicas; BookMyShow must throttle ingress via waiting rooms and serialize writes in memory (Redis Lua CAS).'
  },
  {
    id: 'personalization-freshness',
    dimension: '3. Personalization & Data Freshness',
    netflixApproach: 'Deep Nearline & Online Feature Synthesis. Flink/Mantis stream pipelines update session vectors in seconds, blending offline matrix embeddings with real-time feedback (thumbs up, trailer dwell time).',
    bookmyshowApproach: 'Static & Semi-Static Catalog with Real-Time Inventory Overlays. Shows, venues, and seat maps are pre-indexed; only the transient availability state (Available, Held, Booked) fluctuates dynamically.',
    underlyingConstraint: 'Computational Complexity vs. State Volatility: High model complexity requires asynchronous precomputation; high inventory mutation requires atomic synchronized state.',
    consequence: 'Netflix tolerates minutes of batch lag for deep models; BookMyShow requires sub-millisecond propagation of seat state changes to prevent user frustration.'
  },
  {
    id: 'inventory-correctness',
    dimension: '4. Inventory Correctness & Concurrency',
    netflixApproach: 'Fungible Digital Assets with Infinite Concurrency. A digital video stream can be consumed concurrently by 10,000,000 subscribers simultaneously without resource conflict.',
    bookmyshowApproach: 'Strictly Non-Fungible Physical Assets. Seat F-12 in Auditorium 3 is unique; allocating it to Customer A permanently excludes all other customers globally.',
    underlyingConstraint: 'Physical Exclusivity: Non-fungible resources mandate mutual exclusion locks, compare-and-swap primitives, and hard database unique constraints.',
    consequence: 'Netflix focuses on bandwidth delivery pipelines; BookMyShow focuses on atomic mutex locks, fencing tokens, and database isolation levels.'
  },
  {
    id: 'consistency-model',
    dimension: '5. Data Consistency Requirements',
    netflixApproach: 'Eventual Consistency (AP Leaning). Serving an outdated recommendation row or slightly delayed "Continue Watching" item preserves availability without business catastrophe.',
    bookmyshowApproach: 'Strict Linearizability & Serializability (CP Leaning). Seat state transitions (Available → Held → Confirmed) must appear instantaneous to all external observers.',
    underlyingConstraint: 'CAP & PACELC Theorems: During network partitions, Netflix chooses Availability over Consistency; BookMyShow chooses Consistency over Availability by rejecting contested writes.',
    consequence: 'Netflix uses multi-level fallback caches; BookMyShow returns HTTP 409 Conflict when a seat cannot be atomically acquired.'
  },
  {
    id: 'caching-strategy',
    dimension: '6. Caching Strategy & Failure Risks',
    netflixApproach: 'Proactive Pre-population & Edge Bandwidth Offload. Open Connect OCAs pre-position video chunks overnight; EVCache stores precomputed recommendation rows with > 98% hit targets.',
    bookmyshowApproach: 'Transient Ephemeral Mutex Locks with Strict TTLs. In-memory Redis keys hold temporary seat reservations (e.g. 10m TTL) acting as an admission filter, not a permanent store.',
    underlyingConstraint: 'Cache Staleness Hazards: Caching seat availability for even 5 seconds during a flash sale leads to guaranteed thundering herds on already-held seats.',
    consequence: 'Netflix cache failure causes latency regressions to origin; BookMyShow cache failure or unsynchronized TTLs risk split-brain double bookings unless backed by fencing tokens.'
  },
  {
    id: 'event-processing',
    dimension: '7. Event Processing & Async Pipelines',
    netflixApproach: 'Massive Analytical Signal Aggregation. Keystone streams billions of viewing telemetry events through Kafka and Flink into Amazon S3/Delta Lake for offline retraining and bandit reward attribution.',
    bookmyshowApproach: 'Transactional Outbox & Saga Compensation. Domain events (seat.held, booking.confirmed) are committed to a database outbox table via ACID transactions and tailed to Kafka via CDC.',
    underlyingConstraint: 'At-Least-Once Analytics vs. Exactly-Once Financial Coordination: Analytics tolerates minor duplication; booking settlement requires atomic outbox publishing to prevent lost tickets.',
    consequence: 'Netflix prioritizes stream throughput and analytical lakehouse partitioning; BookMyShow prioritizes dual-write elimination and idempotent event consumers.'
  },
  {
    id: 'failure-handling',
    dimension: '8. Failure Handling & Recovery',
    netflixApproach: 'Graceful Degradation & Algorithmic Fallbacks. When online scoring models timeout (> 40ms), circuit breakers instantly serve cached offline rows or static popular charts.',
    bookmyshowApproach: 'Orchestrated Sagas & Compensating Rollbacks. If payment times out or external cinema APIs partition, the orchestrator triggers deterministic rollbacks (releases locks, voids holds).',
    underlyingConstraint: 'Reversible vs. Irreversible Operations: Returning a fallback recommendation has zero financial side effects; debiting a bank card without issuing a ticket requires reconciliation.',
    consequence: 'Netflix achieves 99.99% availability via degradation; BookMyShow requires background reconciliation workers to audit ambiguous HTTP 504 timeouts.'
  },
  {
    id: 'capacity-estimation',
    dimension: '9. Capacity-Estimation Assumptions',
    netflixApproach: 'Bandwidth & Storage Dominated. Sizing focuses on peak streaming bits (112.5 Tbps = 25M streams * 4.5 Mbps) and number of 100 Gbps flash OCAs required (~1,125 appliances).',
    bookmyshowApproach: 'Contention Intensity & Transaction Serialization Dominated. Sizing focuses on burst write QPS at t = 0 (50,000 QPS), in-memory lock memory footprint (~100 MB), and database connection limits.',
    underlyingConstraint: 'Throughput Bottlenecks: Netflix is network I/O and kernel socket bound; BookMyShow is CPU memory bus serialization and database connection pool bound.',
    consequence: 'Netflix optimizes kernel zero-copy sendfile and kTLS; BookMyShow optimizes single-threaded Redis Lua scripts and PgBouncer connection multiplexing.'
  },
  {
    id: 'observability-risks',
    dimension: '10. Observability & Operational Risks',
    netflixApproach: 'Tail Latency & Quality-of-Experience (QoE) Metrics. Monitors p99/p99.9 page assembly latency, client video buffering ratio, and bandit exploration regret metrics.',
    bookmyshowApproach: 'State Invariant & Financial Auditability Metrics. Monitors active hold TTL expiration rates, orphaned payment intents, webhook ACK latencies, and deadlock counts.',
    underlyingConstraint: 'Continuous Degradation vs. Step-Function Rupture: Netflix degrades smoothly along user experience curves; BookMyShow either succeeds completely or suffers catastrophic double-booking.',
    consequence: 'Netflix alerts on streaming re-buffer rates and CDN cache misses; BookMyShow alerts on database unique constraint collisions and stranded payment pending states.'
  },
  {
    id: 'architectural-tradeoffs',
    dimension: '11. Fundamental Architecture Trade-offs',
    netflixApproach: 'Sacrifices immediate consistency to achieve planetary availability and sub-100ms response times across 190+ countries.',
    bookmyshowApproach: 'Sacrifices unbounded availability during flash sales to enforce strict linearizability and zero double-booking on contested physical seats.',
    underlyingConstraint: 'The Inescapable Distributed Trade-Off: You cannot build a system that is simultaneously immune to network partitions, universally available, and strictly consistent.',
    consequence: 'Netflix represents the state-of-the-art AP system; BookMyShow represents the state-of-the-art CP reference design.'
  }
];
