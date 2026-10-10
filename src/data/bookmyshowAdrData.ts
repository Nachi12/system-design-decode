import { AdrRecord } from './netflixAdrData';

export const BMS_ADRS: AdrRecord[] = [
  {
    id: 'ADR-BMS-01',
    title: 'Ephemeral In-Memory Lock Tier (Redis Lua CAS) vs. Direct Pessimistic Database Row Locking',
    problem: 'How to handle extreme write contention when 50,000 concurrent users attempt to reserve the same 100 premium seats during the opening second of a high-demand ticket sale without exhausting relational database connections.',
    options: [
      'Option A: Direct database pessimistic locking via SELECT ... FOR UPDATE (Exhausts database connection pool, creates massive lock wait queues, and crashes relational database).',
      'Option B: Optimistic concurrency control via version checking in the relational database (Results in 99.9% abort rate under high contention, causing catastrophic CPU thrashing).',
      'Option C: Two-tier architecture: In-memory atomic Compare-And-Swap (Redis Lua CAS) to serialize contention in sub-2ms single-threaded memory loops, shedding 99% of losing requests before persisting winner records to the database.'
    ],
    chosenApproach: 'Option C: In-memory Ephemeral Lock tier fronting a durable relational database.',
    rationale: 'Redis executes Lua scripts sequentially on a single-threaded CPU loop, granting instantaneous mutual exclusion and shedding thousands of losing contention requests in microseconds. Only the single winner proceeds to write to the relational database, bounding database write transactions to the actual seat count rather than the volume of user clicks.',
    drawbacks: 'Requires managing cache-database consistency; cache failure requires automated failover; ephemeral locks must be augmented with fencing tokens to prevent stale writes.',
    evidenceStatus: 'REFERENCE',
    citationId: 'SRC-DIST-02'
  },
  {
    id: 'ADR-BMS-02',
    title: 'Distributed Saga Orchestration vs. Two-Phase Commit (2PC) Across External Multiplex & Payment Systems',
    problem: 'How to coordinate multi-system transactions spanning internal reservation databases, external cinema box offices (e.g. Vista Connect API), and third-party payment gateways (Razorpay, Stripe) without holding long-lived blocking locks.',
    options: [
      'Option A: Distributed Two-Phase Commit (2PC) / XA transactions (Infeasible; third-party payment APIs do not support XA, and holding locks across external networks causes global thread starvation).',
      'Option B: Event Choreography without central coordinator (Difficult to track, audit, and debug multi-minute timeouts; compensations become fragmented).',
      'Option C: Orchestrated Distributed Saga using an explicit state machine with forward actions and backward compensating rollbacks (Release lock, Cancel Vista hold).'
    ],
    chosenApproach: 'Option C: Orchestrated Distributed Saga.',
    rationale: 'Sagas execute local ACID transactions in sequence. If a downstream step fails (e.g. customer payment declines or 10-minute timer expires), the orchestrator triggers deterministic compensating actions (releasing the Redis key and dispatching CancelHold to the cinema box office). Systems remain loosely coupled and resilient to network pauses.',
    drawbacks: 'Eventual consistency during execution; requires robust state-tracking persistence for the Saga orchestrator and comprehensive compensation logic for every possible intermediate failure state.',
    evidenceStatus: 'REFERENCE',
    citationId: 'SRC-DIST-04'
  },
  {
    id: 'ADR-BMS-03',
    title: 'Fencing Tokens and Hard Database Invariant (UNIQUE Constraint) for Kleppmann Lock Hazard Mitigation',
    problem: 'How to ensure absolute protection against double-booking when an application process holding an ephemeral seat lock experiences an unannounced JVM/Node garbage collection pause or network stall exceeding its 10-minute TTL.',
    options: [
      'Option A: Rely entirely on Redis key expiration and assume application timers are always synchronized (Violates distributed systems safety; vulnerable to split-brain double bookings during GC pauses).',
      'Option B: Distributed lock consensus across 5 nodes (Redlock) without database constraints (Still vulnerable to Martin Kleppmann\'s client pause critique; requires synchronized clocks).',
      'Option C: Dual defense: Assign monotonically incrementing fencing tokens in Redis Lua, coupled with a physical composite database constraint: UNIQUE (show_id, seat_id) WHERE status = \'CONFIRMED\'.'
    ],
    chosenApproach: 'Option C: Fencing tokens backed by physical database unique constraints.',
    rationale: 'As demonstrated by Martin Kleppmann, distributed locks cannot guarantee correctness without fencing tokens. By pairing monotonic tokens with a physical database constraint, the database acts as the unassailable referee of correctness. Even if a zombie client wakes up after lock expiry, the relational database physically rejects any duplicate confirmed booking.',
    drawbacks: 'Requires passing the fencing token through all service boundaries and maintaining conditional indexes in PostgreSQL.',
    evidenceStatus: 'REFERENCE',
    citationId: 'SRC-DIST-01'
  },
  {
    id: 'ADR-BMS-04',
    title: 'Transactional Outbox Pattern with Change Data Capture (CDC) vs. Dual-Write to Message Broker',
    problem: 'How to publish domain events (booking.confirmed, hold.expired) to Apache Kafka reliably without introducing dual-write anomalies where a database commit succeeds but message publishing fails.',
    options: [
      'Option A: Direct dual-write in application code (Database COMMIT then Kafka publish; prone to silent failures if the pod dies between the two operations).',
      'Option B: Distributed 2PC spanning PostgreSQL and Apache Kafka (High overhead, poorly supported, fragile).',
      'Option C: Transactional Outbox Pattern: Insert event records into an outbox table within the exact same ACID database transaction, tailed asynchronously by Debezium CDC via PostgreSQL Write-Ahead Log (WAL).'
    ],
    chosenApproach: 'Option C: Transactional Outbox Pattern via Debezium CDC.',
    rationale: 'Guarantees 100% atomic alignment between database state and downstream message publishing. If the database transaction commits, the outbox record is guaranteed to exist. Debezium tails the WAL and ensures At-Least-Once delivery to Kafka even across server crashes.',
    drawbacks: 'Introduces a small latency overhead (50–100ms) from database commit to Kafka topic availability; requires downstream consumers to be idempotent.',
    evidenceStatus: 'REFERENCE',
    citationId: 'SRC-DIST-05'
  },
  {
    id: 'ADR-BMS-05',
    title: 'Edge Admission Control & Virtual Waiting Room vs. Uncontrolled Ingress Rate Limiting',
    problem: 'How to manage sudden ingress traffic spikes during blockbuster concerts or cricket tournaments where 2,000,000+ users arrive simultaneously at ticket release time.',
    options: [
      'Option A: Uncontrolled ingress with standard HTTP 429 Too Many Requests rate limiting (Degrades user experience; users hammer refresh, worsening the thundering herd).',
      'Option B: Massive over-provisioning of backend microservices and databases (Cost-prohibitive and ineffective, as Amdahl\'s law limits database write concurrency on contested rows).',
      'Option C: Edge-based Virtual Waiting Room with deterministic token bucket queueing: Users are queued at CloudFront/Cloudflare edge, assigned signed JWT queue tickets, and metered into the seat selection engine at a controlled rate (e.g. 500 users/sec).'
    ],
    chosenApproach: 'Option C: Edge-based Virtual Waiting Room and Token Bucket admission control.',
    rationale: 'Transforms an unmanageable step-function traffic spike into a predictable, flat queue. Protects backend seat inventory and database clusters from connection exhaustion, while providing transparent queue position feedback to users.',
    drawbacks: 'Adds edge infrastructure complexity (signed queue tokens); users must wait in queue even if they only wish to browse other non-surge events.',
    evidenceStatus: 'REFERENCE',
    citationId: 'SRC-AWS-AURORA-01'
  },
  {
    id: 'ADR-BMS-06',
    title: 'Payment Webhook Idempotency Table & Asynchronous Polling Reconciliation for Ambiguous 504 Timeouts',
    problem: 'How to handle network drops and ambiguous timeouts when communicating with third-party payment gateways, where an HTTP request times out but the customer\'s credit card or bank account has actually been debited.',
    options: [
      'Option A: Treat all HTTP timeouts as payment failures and instantly release the seat hold (Dangerous: customer gets debited but loses their tickets, causing severe customer complaints and financial chargebacks).',
      'Option B: Block the user request indefinitely until the payment gateway responds (Causes thread starvation and poor client UX).',
      'Option C: Transition booking to PAYMENT_PENDING state; require unique Idempotency-Key headers on all requests; handle asynchronous signed webhooks; run a background Reconciliation Worker polling the payment provider for unconfirmed transactions.'
    ],
    chosenApproach: 'Option C: Three-way payment defense: Idempotency keys, asynchronous webhooks, and background reconciliation.',
    rationale: 'Financial networks are inherently asynchronous and unreliable. Explicitly separating "payment authorization requested" from "payment confirmed" allows the system to hold seats safely while resolving ambiguous gateway timeouts via webhooks or proactive polling before making any irreversible seat release decision.',
    drawbacks: 'Requires holding seats in a pending state during gateway outages; potential delay in releasing tickets if the reconciliation worker encounters backpressure.',
    evidenceStatus: 'REFERENCE',
    citationId: 'SRC-DIST-03'
  }
];
