import { EvidenceTier } from '../types';

export interface ComprehensiveAdrRecord {
  id: string;
  title: string;
  status: 'APPROVED' | 'PROPOSED' | 'DOCUMENTED' | 'SUPERSEDED';
  domain: 'netflix' | 'bookmyshow' | 'distributed-systems';
  category: 'Personalization' | 'Content Delivery' | 'Concurrency' | 'Transactions' | 'Reliability' | 'Architecture';
  context: string;
  problem: string;
  requirements: string[];
  invariants: string[];
  options: {
    name: string;
    description: string;
    tradeoffs: string;
  }[];
  chosenOption: string;
  rationale: string;
  benefits: string[];
  disadvantages: string[];
  operationalImplications: string;
  evidenceStatus: EvidenceTier;
  citationId?: string;
}

export const ALL_ADRS: ComprehensiveAdrRecord[] = [
  // =========================================================================
  // NETFLIX ADRs (Documented & Inferred)
  // =========================================================================
  {
    id: 'ADR-NFLX-01',
    title: 'Three-Tier Computational Partitioning (Offline / Nearline / Online)',
    status: 'DOCUMENTED',
    domain: 'netflix',
    category: 'Personalization',
    context: 'Netflix calculates member embeddings and homepage recommendations across petabytes of historical interaction telemetry while serving user-facing homepages under a strict sub-100ms deadline.',
    problem: 'How to calculate complex personalization embeddings over petabytes of viewing history without violating sub-100ms user-facing request latency SLAs.',
    requirements: [
      'Sub-100ms p99 response time for homepage generation',
      'Reflect real-time session viewing signals within seconds',
      'Incorporate multi-month historical preference matrices'
    ],
    invariants: [
      'Homepage generation must never block on offline training jobs',
      'Timeout on deep online models must fall back to cached nearline rows'
    ],
    options: [
      {
        name: 'Option A: Full Online On-Demand Inference',
        description: 'Run deep neural networks on-the-fly for every user request.',
        tradeoffs: 'Computationally infeasible; latency exceeds 1,000ms under load, violating SLAs.'
      },
      {
        name: 'Option B: Pure Batch Precomputation',
        description: 'Compute full homepage layouts nightly and store static pages in a database.',
        tradeoffs: 'Stale within minutes; unable to adapt to recent playback signals or device switches.'
      },
      {
        name: 'Option C: Three-Tier Computational Partitioning',
        description: 'Decouple Offline batch training (Spark/GPU), Nearline streaming session updates (Flink/Kafka), and Online real-time assembly (Zuul/EVCache).',
        tradeoffs: 'Higher architectural complexity, but provides sub-100ms serving with real-time adaptation.'
      }
    ],
    chosenOption: 'Option C: Three-tier computational partitioning.',
    rationale: 'Decouples high-latency deep model training from strict user-facing deadlines. Enables real-time responsiveness to recent playback signals via nearline caches while maintaining rich global preference models computed offline.',
    benefits: [
      'Guarantees p99 < 100ms latency at the online gateway',
      'Enables nearline session adaptation within 2–5 seconds',
      'Provides automatic fallback to cached offline rows during model outages'
    ],
    disadvantages: [
      'Risk of training-serving feature skew',
      'Requires maintaining complex stream processing clusters (Flink/Mantis)',
      'Cache synchronization overhead between offline and online tiers'
    ],
    operationalImplications: 'Requires monitoring feature drift between offline training sets and online feature stores; circuit breakers configured with 40ms timeouts to drop to EVCache fallback rows.',
    evidenceStatus: 'DOCUMENTED',
    citationId: 'SRC-NFLX-REC-02'
  },
  {
    id: 'ADR-NFLX-02',
    title: 'Two-Dimensional Grid Optimization vs. Monolithic 1D List Ranking',
    status: 'DOCUMENTED',
    domain: 'netflix',
    category: 'Personalization',
    context: 'Television and mobile interfaces present content as a vertical stack of thematic rows, each containing a horizontal carousel of video titles.',
    problem: 'How to structure catalog discovery across screens where members navigate both horizontally and vertically, balancing relevance with thematic variety.',
    requirements: [
      'Present relevant recommendations across diverse genres',
      'Prevent repetitive titles across adjacent rows',
      'Optimize for member scroll depth and conversion rate'
    ],
    invariants: [
      'A title should not be duplicated across consecutive primary rows',
      'Top row must maintain highest predicted engagement utility'
    ],
    options: [
      {
        name: 'Option A: Single 1D Ranked List',
        description: 'Rank all videos in a single global list from 1 to N.',
        tradeoffs: 'Poor discovery experience; cannot convey diverse thematic contexts to users.'
      },
      {
        name: 'Option B: Hard-Coded Thematic Categories',
        description: 'Static rows (Action, Comedy, Drama) with popularity sorting.',
        tradeoffs: 'Lacks personalized relevance; ignores individual demographic affinities.'
      },
      {
        name: 'Option C: 2D Grid Optimization Framework',
        description: 'Simultaneously optimize row candidate generation, intra-row item ranking, and whole-page layout synthesis.',
        tradeoffs: 'Requires two-stage scoring pipelines and diversity re-ranking algorithms.'
      }
    ],
    chosenOption: 'Option C: Two-dimensional grid optimization.',
    rationale: 'Allows the system to balance relevance with catalog diversity and novel discovery. A user may reject the top recommendation but engage enthusiastically with a specific thematic row below it.',
    benefits: [
      'Higher subscriber engagement and longer dwell time',
      'Promotes catalog depth and long-tail title discovery',
      'Supports specialized rows (Continue Watching, Trending, Top Picks)'
    ],
    disadvantages: [
      'Complex page assembly pipeline coordinating multiple candidate services',
      'Requires diversity penalty algorithms to prevent genre clustering',
      'Higher client payload size (120KB layout tree)'
    ],
    operationalImplications: 'Evaluated continuously via offline ranking metrics (NDCG, MRR) and online A/B testing tracking play conversion and session duration.',
    evidenceStatus: 'DOCUMENTED',
    citationId: 'SRC-NFLX-REC-01'
  },
  {
    id: 'ADR-NFLX-03',
    title: 'Contextual Multi-Armed Bandits for Dynamic Artwork Personalization',
    status: 'DOCUMENTED',
    domain: 'netflix',
    category: 'Personalization',
    context: 'A single movie or series has multiple promotional artwork assets highlighting different actors, genres, or moods.',
    problem: 'How to present thumbnail imagery that maximizes click-to-play conversion for diverse member demographics without prolonged manual testing cycles.',
    requirements: [
      'Dynamically assign artwork based on member taste context',
      'Continually explore new creative variants to prevent stagnation',
      'Serve artwork asset IDs in real time with sub-10ms overhead'
    ],
    invariants: [
      'Artwork selection must not delay page assembly beyond 10ms',
      'Exploration must be bounded to prevent poor user experience'
    ],
    options: [
      {
        name: 'Option A: Default Static Studio Artwork',
        description: 'Single poster image selected manually by production designers.',
        tradeoffs: 'Ignores individual viewer preferences (e.g. romance fan vs action fan).'
      },
      {
        name: 'Option B: Global A/B Testing',
        description: 'Test variants across the entire subscriber base over several weeks.',
        tradeoffs: 'Slow convergence; exposes 50% of users to suboptimal variants during testing.'
      },
      {
        name: 'Option C: Contextual Multi-Armed Bandits (CMAB)',
        description: 'Online reinforcement learning algorithms evaluating conversion payoffs per member segment while continually exploring.',
        tradeoffs: 'Delayed reward attribution (impressions happen hours before playback).'
      }
    ],
    chosenOption: 'Option C: Contextual multi-armed bandits.',
    rationale: 'Bandits minimize regret by shifting traffic to the winning artwork variant in real time per demographic segment, while maintaining controlled exploration to detect shifting consumer tastes.',
    benefits: [
      'Demonstrated 20–30% increase in play conversion across title impressions',
      'Automated adaptation to regional and demographic preferences',
      'Continuous exploration of newly uploaded creative assets'
    ],
    disadvantages: [
      'Delayed feedback loop: attribution windows must handle delayed plays',
      'Cold-start phase for new titles requires baseline exploration traffic',
      'Higher algorithmic complexity in model serving infrastructure'
    ],
    operationalImplications: 'Bandit logs are collected via Keystone and trained in nearline batches; exploration epsilon parameters tuned to balance regret vs novelty.',
    evidenceStatus: 'DOCUMENTED',
    citationId: 'SRC-NFLX-REC-03'
  },
  {
    id: 'ADR-NFLX-04',
    title: 'Custom ISP-Embedded Open Connect CDN vs. Commercial Third-Party CDNs',
    status: 'DOCUMENTED',
    domain: 'netflix',
    category: 'Content Delivery',
    context: 'Streaming video represents a substantial percentage of global peak Internet traffic, costing millions in transit fees if routed across public backbones.',
    problem: 'How to deliver hundreds of terabits per second of video traffic without exhausting public peering transit or incurring exorbitant commercial CDN bills.',
    requirements: [
      'Localize video delivery to within 1 network hop of subscribers',
      'Support 100+ Tbps aggregate peak streaming volume',
      'Maintain 95%+ edge cache hit ratio'
    ],
    invariants: [
      'Video byte delivery must bypass the AWS cloud core completely',
      'No customer ISP transit fee charges for streaming video bytes'
    ],
    options: [
      {
        name: 'Option A: Commercial Cloud CDNs (Cloudflare / Fastly / Akamai)',
        description: 'Route video chunks through third-party multi-tenant CDN networks.',
        tradeoffs: 'Exorbitant transit costs; cannot place hardware inside ISP partner rooms.'
      },
      {
        name: 'Option B: Centralized Cloud Streaming from AWS',
        description: 'Stream directly from Amazon S3 / EC2 instances.',
        tradeoffs: 'Prohibitive AWS data egress fees; unacceptable buffering latency.'
      },
      {
        name: 'Option C: Custom Open Connect CDN (OCAs in ISP Rooms & IXPs)',
        description: 'Build custom hardware appliances deployed directly inside ISP partner networks and Internet Exchange Points.',
        tradeoffs: 'Requires managing physical hardware logistics, firmware updates, and partner ISP relationships.'
      }
    ],
    chosenOption: 'Option C: Custom Open Connect CDN.',
    rationale: 'Deploying custom hardware directly inside ISP partner server rooms offloads 100% of video bandwidth from public transit backbones. BGP routing directs requests to the closest ISP switch, achieving 95%+ cache hit ratios and lowest possible buffering latency.',
    benefits: [
      'Completely eliminates multi-million-dollar third-party CDN egress bills',
      'Lowers streaming start latency and eliminates video rebuffering',
      'Proactive overnight fill optimizes bandwidth during off-peak ISP hours'
    ],
    disadvantages: [
      'High capital expenditure for physical appliance manufacturing and shipping',
      'Operational overhead of managing global hardware fleet and OS upgrades',
      'Requires bilateral peering agreements with thousands of worldwide ISPs'
    ],
    operationalImplications: 'OCAs report health telemetry to AWS control plane; BGP routing dynamically withdraws unhealthy appliances; firmware updated via automated blue-green rollouts.',
    evidenceStatus: 'DOCUMENTED',
    citationId: 'SRC-NFLX-CDN-01'
  },
  {
    id: 'ADR-NFLX-05',
    title: 'FreeBSD Zero-Copy sendfile & Kernel TLS (kTLS) for 100 Gbps Single-Server Line Rate',
    status: 'DOCUMENTED',
    domain: 'netflix',
    category: 'Content Delivery',
    context: 'High-density Open Connect Appliances (1RU servers) must maximize outbound video throughput per watt and per rack unit.',
    problem: 'How to stream 100+ Gbps of encrypted TLS video from a single server without bottlenecking on CPU memory bus context switching.',
    requirements: [
      'Saturate 100 Gbps network interface cards (NICs) on a single 1RU server',
      'Keep CPU utilization under 80% at full line rate',
      'Enforce TLS encryption on all video chunk transmissions'
    ],
    invariants: [
      'Video payload bytes must not be copied into user-space memory buffers',
      'Memory bus bandwidth must be preserved for disk-to-NIC DMA transfers'
    ],
    options: [
      {
        name: 'Option A: Standard User-Space NGINX Proxy with OpenSSL',
        description: 'Read file into user-space buffer, encrypt via OpenSSL, write to socket.',
        tradeoffs: 'Multiple memory copies and context switches bottleneck CPU at ~30 Gbps.'
      },
      {
        name: 'Option B: Unencrypted sendfile System Call',
        description: 'Direct kernel-to-socket DMA without encryption.',
        tradeoffs: 'Violates content protection and DRM security requirements.'
      },
      {
        name: 'Option C: FreeBSD Zero-Copy sendfile with Kernel TLS (kTLS)',
        description: 'Perform symmetric AES-GCM encryption in the kernel/hardware while using zero-copy sendfile directly from disk cache to NIC.',
        tradeoffs: 'Requires custom kernel patches and strict hardware NIC driver support.'
      }
    ],
    chosenOption: 'Option C: FreeBSD Zero-Copy sendfile with Kernel TLS.',
    rationale: 'Eliminating user-space memory buffers and offloading TLS crypto to kernel space or hardware NICs allows the CPU to remain almost idle during 100 Gbps streaming, scaling performance with raw bus bandwidth.',
    benefits: [
      'Achieves 100+ Gbps throughput from a single commercial 1RU server',
      'Reduces power consumption and server footprint in ISP partner facilities',
      'Maintains end-to-end HTTPS/TLS cryptographic security'
    ],
    disadvantages: [
      'Tied to FreeBSD kernel architecture and custom driver development',
      'Debugging kernel-level TLS faults requires specialized systems engineering',
      'Hardware NIC compatibility constraints'
    ],
    operationalImplications: 'Monitored via kernel kqueue and kTLS crypto queue counters; hardware failures trigger automated drainage via BGP withdrawal.',
    evidenceStatus: 'DOCUMENTED',
    citationId: 'SRC-NFLX-CDN-02'
  },

  // =========================================================================
  // BOOKMYSHOW-LIKE REFERENCE ARCHITECTURE ADRs (Proposed Reference Design)
  // =========================================================================
  {
    id: 'ADR-BMS-01',
    title: 'Ephemeral In-Memory Lock Tier (Redis Lua CAS) vs. Direct Pessimistic Database Row Locking',
    status: 'PROPOSED',
    domain: 'bookmyshow',
    category: 'Concurrency',
    context: 'Tens of thousands of concurrent users click the same 10–20 premium seats during the opening millisecond of a high-demand ticket release.',
    problem: 'How to serialize extreme write contention without exhausting database connections, causing lock deadlocks, or crashing the primary database.',
    requirements: [
      'Handle 50,000 hold attempts per second at t = 0',
      'Sub-2ms mutual exclusion check per hold attempt',
      'Zero double-booking on any physical seat'
    ],
    invariants: [
      'Exactly one user can be granted a hold on a contested seat',
      'Losing requests must be rejected without creating database transactions'
    ],
    options: [
      {
        name: 'Option A: Direct Database Pessimistic Locking (SELECT FOR UPDATE)',
        description: 'Acquire row-level exclusive locks in PostgreSQL.',
        tradeoffs: 'Exhausts connection pools; transactions queue for seconds; deadlocks crash the DB.'
      },
      {
        name: 'Option B: Optimistic Concurrency Control (version = version + 1)',
        description: 'Read version, attempt conditional update, retry on conflict.',
        tradeoffs: '99.9% abort rate under high contention; massive CPU thrashing on retry storms.'
      },
      {
        name: 'Option C: Two-Tier Architecture (Redis Lua CAS + PostgreSQL ACID)',
        description: 'Serialize contention in memory via single-threaded Redis Lua scripts; persist only the winning hold to PostgreSQL.',
        tradeoffs: 'Requires cache-database consistency mechanisms and fencing tokens.'
      }
    ],
    chosenOption: 'Option C: In-Memory Ephemeral Lock Tier fronting PostgreSQL.',
    rationale: 'Redis executes Lua scripts sequentially on a single-threaded CPU loop, granting instantaneous mutual exclusion and shedding thousands of losing contention requests in microseconds. Only the single winner proceeds to write to the relational database, bounding database write transactions to the actual seat count rather than the volume of user clicks.',
    benefits: [
      'Sheds 99% of losing requests in memory in < 2ms',
      'Bounds database write load strictly to available seat count',
      'Prevents database connection pool exhaustion and transaction deadlocks'
    ],
    disadvantages: [
      'Requires managing consistency between Redis and PostgreSQL',
      'Redis instance failure requires automated Sentinel failover',
      'Ephemeral locks must be augmented with fencing tokens to prevent stale writes'
    ],
    operationalImplications: 'Redis primary provisioned with memory-locked persistence; monitored for Lua script execution latency; alerts on CAS failure spikes.',
    evidenceStatus: 'REFERENCE',
    citationId: 'SRC-DIST-02'
  },
  {
    id: 'ADR-BMS-02',
    title: 'Distributed Saga Orchestration vs. Two-Phase Commit Across External Systems',
    status: 'PROPOSED',
    domain: 'bookmyshow',
    category: 'Transactions',
    context: 'A ticket reservation spans three separate boundaries: internal PostgreSQL reservation records, third-party payment gateways, and external cinema multiplex box offices (Vista Connect).',
    problem: 'How to coordinate multi-system transactions spanning external APIs without holding long-lived blocking database locks.',
    requirements: [
      'Coordinate hold, payment, and cinema commit steps',
      'Release held inventory automatically if payment fails or times out',
      'Resilient to slow external network round-trips'
    ],
    invariants: [
      'Internal database must never hold locks awaiting external user OTP entry',
      'Compensating actions must be idempotent and eventually consistent'
    ],
    options: [
      {
        name: 'Option A: Distributed Two-Phase Commit (2PC / XA)',
        description: 'Run distributed 2PC across PostgreSQL, Stripe, and Vista Cinema.',
        tradeoffs: 'Infeasible; third-party payment APIs do not support XA; holding locks across external networks causes global thread starvation.'
      },
      {
        name: 'Option B: Event Choreography Without Central Coordinator',
        description: 'Services emit Kafka events and react independently.',
        tradeoffs: 'Difficult to track, audit, and debug multi-minute timeouts; compensations become fragmented.'
      },
      {
        name: 'Option C: Orchestrated Distributed Saga with State Machine',
        description: 'Central orchestrator executes forward local transactions and issues compensating rollbacks on failure.',
        tradeoffs: 'Eventual consistency during execution; requires robust state-tracking persistence.'
      }
    ],
    chosenOption: 'Option C: Orchestrated Distributed Saga.',
    rationale: 'Sagas execute local ACID transactions in sequence. If a downstream step fails (e.g. customer payment declines or 10-minute timer expires), the orchestrator triggers deterministic compensating actions (releasing the Redis key and dispatching CancelHold to the cinema box office). Systems remain loosely coupled and resilient to network pauses.',
    benefits: [
      'Zero blocking distributed locks across external networks',
      'Deterministic compensating actions for every possible intermediate failure',
      'Complete auditability of booking state transitions in central state store'
    ],
    disadvantages: [
      'Temporary eventual consistency during the 10-minute checkout window',
      'Complexity of implementing comprehensive compensation logic for all failure modes',
      'Requires persistent state storage for the Saga orchestrator itself'
    ],
    operationalImplications: 'Orchestrator tracks state in PostgreSQL; background reconciliation worker sweeps for stranded sagas past TTL.',
    evidenceStatus: 'REFERENCE',
    citationId: 'SRC-DIST-04'
  },
  {
    id: 'ADR-BMS-03',
    title: 'Fencing Tokens and Hard Database Invariant for Kleppmann Lock Hazard Mitigation',
    status: 'PROPOSED',
    domain: 'bookmyshow',
    category: 'Reliability',
    context: 'Distributed locks with TTLs are vulnerable to Martin Kleppmann\'s client pause hazard: an application pod may experience an unannounced GC pause or network stall exceeding its 600s TTL, waking up after another client has acquired the lock.',
    problem: 'How to ensure absolute protection against double-booking when application processes experience unpredictable garbage collection pauses or network delays.',
    requirements: [
      'Eliminate double-booking even if application processes pause past lock TTL',
      'Physical rejection of stale commit attempts at the storage layer',
      'No reliance on synchronized clocks across distributed nodes'
    ],
    invariants: [
      'A confirmed booking cannot be overwritten by a stale client with an expired lock',
      'PostgreSQL is the ultimate source of truth for confirmed seat allocations'
    ],
    options: [
      {
        name: 'Option A: Pure Rely-on-TTL Approach',
        description: 'Assume clients always respect the TTL and clocks are synchronized.',
        tradeoffs: 'Violates distributed systems safety; vulnerable to split-brain double bookings during GC pauses.'
      },
      {
        name: 'Option B: Distributed Redlock Consensus Without Storage Validation',
        description: 'Acquire locks across 5 Redis nodes without fencing tokens.',
        tradeoffs: 'Still vulnerable to Kleppmann\'s client pause critique; requires synchronized monotonic clocks.'
      },
      {
        name: 'Option C: Dual Defense: Monotonic Fencing Tokens + DB Unique Constraint',
        description: 'Issue incrementing fencing tokens in Redis Lua; enforce UNIQUE (show_id, seat_id) in PostgreSQL.',
        tradeoffs: 'Requires threading the fencing token through API boundaries.'
      }
    ],
    chosenOption: 'Option C: Fencing tokens backed by physical database unique constraints.',
    rationale: 'As demonstrated by Martin Kleppmann, distributed locks cannot guarantee correctness without fencing tokens. By pairing monotonic tokens with a physical database constraint, the database acts as the unassailable referee of correctness. Even if a zombie client wakes up after lock expiry, the relational database physically rejects any duplicate confirmed booking.',
    benefits: [
      'Mathematically guarantees zero double-booking under any process pause',
      'Does not rely on NTP clock synchronization between servers',
      'Storage layer acts as an absolute physical backstop'
    ],
    disadvantages: [
      'Requires maintaining conditional unique indexes in PostgreSQL',
      'Fencing token must be passed across all intermediate orchestration hops',
      'Database rejects stale writes with explicit error handling required'
    ],
    operationalImplications: 'PostgreSQL error code 23505 (unique_violation) is trapped and classified as a stale lock attempt, triggering immediate client notification.',
    evidenceStatus: 'REFERENCE',
    citationId: 'SRC-DIST-01'
  },
  {
    id: 'ADR-BMS-04',
    title: 'Transactional Outbox Pattern with Change Data Capture (CDC) vs. Dual-Write to Kafka',
    status: 'PROPOSED',
    domain: 'bookmyshow',
    category: 'Architecture',
    context: 'When a booking is confirmed, multiple downstream services (ticket generation, notifications, analytics, cache invalidation) must be notified via Apache Kafka.',
    problem: 'How to publish domain events to Apache Kafka reliably without introducing dual-write anomalies where a database commit succeeds but message publishing fails.',
    requirements: [
      '100% atomic consistency between database commit and message publication',
      'Zero lost ticket delivery events',
      'At-least-once message delivery to downstream Kafka topics'
    ],
    invariants: [
      'A booking event must never be published if the database transaction rolled back',
      'A committed booking must never fail to produce a downstream ticket event'
    ],
    options: [
      {
        name: 'Option A: Application Dual-Write',
        description: 'Execute DB commit, then call kafkaProducer.send().',
        tradeoffs: 'Prone to silent failures if the pod dies between the DB commit and Kafka send.'
      },
      {
        name: 'Option B: Distributed 2PC (PostgreSQL + Kafka)',
        description: 'Coordinate XA transaction across relational database and Kafka broker.',
        tradeoffs: 'Fragile, high latency overhead, poorly supported by modern messaging infrastructure.'
      },
      {
        name: 'Option C: Transactional Outbox Pattern via Debezium CDC',
        description: 'Insert events into an outbox table in the same ACID transaction; tail WAL to Kafka.',
        tradeoffs: 'Adds small latency overhead (50–100ms) from commit to Kafka publication.'
      }
    ],
    chosenOption: 'Option C: Transactional Outbox Pattern via Debezium CDC.',
    rationale: 'Guarantees 100% atomic alignment between database state and downstream message publishing. If the database transaction commits, the outbox record is guaranteed to exist. Debezium tails the PostgreSQL Write-Ahead Log (WAL) and ensures At-Least-Once delivery to Kafka even across application server crashes.',
    benefits: [
      'Eliminates dual-write anomalies completely',
      'Application code only interacts with local database transaction',
      'Decouples downstream notification performance from core checkout latency'
    ],
    disadvantages: [
      'Requires running and monitoring Kafka Connect / Debezium infrastructure',
      'Downstream consumers must be idempotent to handle at-least-once delivery',
      'Outbox table requires periodic vacuuming or truncation'
    ],
    operationalImplications: 'Monitored via Debezium replication lag metrics; Kafka consumer lag monitored across ticket generation and notification consumer groups.',
    evidenceStatus: 'REFERENCE',
    citationId: 'SRC-DIST-05'
  },
  {
    id: 'ADR-BMS-05',
    title: 'Edge Admission Control & Virtual Waiting Room vs. Uncontrolled Ingress Rate Limiting',
    status: 'PROPOSED',
    domain: 'bookmyshow',
    category: 'Reliability',
    context: 'During mega concert on-sales (e.g. Coldplay stadium tour), over 2,000,000 users arrive at the platform at ticket release time (e.g. 12:00:00 PM).',
    problem: 'How to manage sudden ingress traffic spikes without exhausting backend server threads, crashing databases, or degrading client experience.',
    requirements: [
      'Protect backend microservices from connection pool exhaustion',
      'Fair, transparent queueing experience for users',
      'Meter traffic into seat selection matching database write capacity (500 users/sec)'
    ],
    invariants: [
      'Users without a valid waiting room token must be blocked from hold APIs',
      'Traffic admitted to the backend must never exceed database write limits'
    ],
    options: [
      {
        name: 'Option A: Uncontrolled Ingress with HTTP 429 Rate Limiting',
        description: 'Reject excess traffic at API Gateway with HTTP 429 Too Many Requests.',
        tradeoffs: 'Degrades user experience; users hammer refresh, worsening the thundering herd.'
      },
      {
        name: 'Option B: Massive Backend Over-Provisioning',
        description: 'Auto-scale hundreds of pods and database instances to absorb the peak.',
        tradeoffs: 'Cost-prohibitive and ineffective, as Amdahl\'s law limits database write concurrency on contested rows.'
      },
      {
        name: 'Option C: Edge-Based Virtual Waiting Room (Token Bucket)',
        description: 'Queue users at CDN edge (CloudFront/Cloudflare), assign signed JWT queue tickets, and meter users in at a controlled rate.',
        tradeoffs: 'Adds edge infrastructure complexity; users wait in queue even for non-surge events unless partitioned.'
      }
    ],
    chosenOption: 'Option C: Edge-based Virtual Waiting Room and Token Bucket admission control.',
    rationale: 'Transforms an unmanageable step-function traffic spike into a predictable, flat queue. Protects backend seat inventory and database clusters from connection exhaustion, while providing transparent queue position feedback to users.',
    benefits: [
      'Flattens millions of sudden requests into a smooth, manageable stream',
      'Prevents cascading backend outages and connection pool exhaustion',
      'Provides transparent queue position and estimated wait time to users'
    ],
    disadvantages: [
      'Requires edge compute logic (Cloudflare Workers / CloudFront Functions)',
      'Queue bypass fraud prevention requires strict cryptographic JWT validation',
      'Users experience intentional artificial delay before reaching seat selection'
    ],
    operationalImplications: 'Waiting room pass velocity tuned dynamically based on database write CPU; bypass tokens verified at API Gateway using public key cryptography.',
    evidenceStatus: 'REFERENCE',
    citationId: 'SRC-AWS-AURORA-01'
  },
  {
    id: 'ADR-BMS-06',
    title: 'Payment Webhook Idempotency Table & Polling Reconciliation for Ambiguous 504 Timeouts',
    status: 'PROPOSED',
    domain: 'bookmyshow',
    category: 'Transactions',
    context: 'Network communication with third-party payment gateways is fundamentally unreliable. A payment charge request may suffer an HTTP 504 Gateway Timeout while the customer\'s bank account has actually been debited.',
    problem: 'How to handle network drops and ambiguous timeouts when communicating with third-party payment gateways without releasing seats or causing duplicate financial charges.',
    requirements: [
      'Never double-debit a customer for a single booking',
      'Never release seats prematurely if the customer was successfully charged',
      'Handle duplicate and delayed webhook deliveries gracefully'
    ],
    invariants: [
      'An HTTP 504 timeout must never be treated as a confirmed payment failure',
      'Duplicate webhook deliveries must produce identical, idempotent responses'
    ],
    options: [
      {
        name: 'Option A: Treat Timeouts as Failures & Immediately Release Hold',
        description: 'Cancel booking and release seats immediately upon HTTP 504.',
        tradeoffs: 'Catastrophic: customer gets debited but loses tickets, causing chargebacks.'
      },
      {
        name: 'Option B: Synchronous Blocking Polling',
        description: 'Hold the client HTTP connection open while polling the gateway repeatedly.',
        tradeoffs: 'Thread starvation; client browser timeouts; poor mobile reliability.'
      },
      {
        name: 'Option C: Three-Way Defense: Idempotency Keys + Webhooks + Asynchronous Reconciliation',
        description: 'Mark booking PAYMENT_PENDING_AUDIT; verify signed webhooks; run background reconciliation worker polling gateway API.',
        tradeoffs: 'Requires holding seats in pending state during payment gateway outages.'
      }
    ],
    chosenOption: 'Option C: Three-way payment defense: Idempotency keys, webhooks, and polling reconciliation.',
    rationale: 'Financial networks are inherently asynchronous and unreliable. Explicitly separating "payment authorization requested" from "payment confirmed" allows the system to hold seats safely while resolving ambiguous gateway timeouts via webhooks or proactive polling before making any irreversible seat release decision.',
    benefits: [
      'Completely eliminates double charges and accidental seat releases',
      'Resilient to network partitions between booking servers and payment gateways',
      'Automatic self-healing for delayed webhooks within minutes'
    ],
    disadvantages: [
      'Seats remain held in PAYMENT_PENDING state during extended payment provider outages',
      'Requires running persistent background reconciliation cron workers',
      'Must maintain idempotency key tables with retention cleanup policies'
    ],
    operationalImplications: 'Reconciliation worker runs every 30 seconds; alerts triggered if more than 50 bookings remain in PAYMENT_PENDING_AUDIT for over 10 minutes.',
    evidenceStatus: 'REFERENCE',
    citationId: 'SRC-DIST-03'
  }
];
