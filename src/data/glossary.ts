import { GlossaryEntry } from '../types';

export const GLOSSARY_TERMS: GlossaryEntry[] = [
  {
    id: 'backpressure',
    term: 'Backpressure',
    definition: 'A mechanism in distributed and reactive stream pipelines where a downstream consumer experiencing processing congestion signals the upstream producer to slow down or buffer message emission, preventing buffer overflows and out-of-memory crashes.',
    context: 'Crucial in Kafka event streaming between the Transactional Outbox Worker and notification/analytics consumers; downstream consumers throttle consumption rates without dropping messages.',
    relatedTerms: ['Reactive Streams', 'Rate Limiting', 'Load Shedding', 'Buffer Overflow'],
    citationId: 'SRC-DIST-01'
  },
  {
    id: 'caching-invalidation',
    term: 'Caching & Cache Invalidation',
    definition: 'The strategy of storing copies of frequently accessed data in fast, transient storage (RAM) to reduce read latency, paired with protocols (TTL, Write-Through, Cache-Aside, CDC invalidation) to purge stale entries when underlying records mutate.',
    context: 'Contrasted across both monographs: Netflix utilizes proactive pre-populated edge caches (EVCache, OCAs) where minor staleness is acceptable, whereas BookMyShow uses short-lived ephemeral mutex locks where a 5-second stale cache causes double-booking thundering herds.',
    relatedTerms: ['Cache-Aside', 'Write-Through', 'TTL', 'EVCache', 'Stale Reads'],
    citationId: 'SRC-DIST-01'
  },
  {
    id: 'cap-pacelc',
    term: 'CAP & PACELC Theorems',
    acronym: 'PACELC',
    definition: 'The CAP theorem states that under an inevitable network partition (P), a distributed system must choose between Consistency (C) and Availability (A). The PACELC theorem extends this: even when operating normally without partitions (E), the system must trade off Latency (L) and Consistency (C).',
    context: 'Directly dictates our case study divergence: Netflix is an AP/PA-EL system (optimizes for availability and sub-100ms latency, accepting eventual consistency); BookMyShow is a CP/PC-EC system (sacrifices availability under partition to preserve strict linearizable seat allocations).',
    relatedTerms: ['Linearizability', 'Eventual Consistency', 'Network Partition', 'Split-Brain'],
    citationId: 'SRC-DIST-01'
  },
  {
    id: 'consistency-isolation',
    term: 'Consistency & Isolation Levels',
    definition: 'In ACID transactions, Isolation defines the degree to which concurrent transactions are invisible to one another (Read Uncommitted, Read Committed, Repeatable Read, Serializable). Strict Serializability is the gold standard, combining Serializability (multi-operation ordering) with Linearizability (real-time ordering).',
    context: 'Weak isolation levels (Read Committed) permit Write Skew anomalies during seat reservations. Our reference architecture enforces Serializable semantics on confirmed bookings via physical database conditional unique constraints: UNIQUE (show_id, seat_id) WHERE status = CONFIRMED.',
    relatedTerms: ['Strict Serializability', 'Write Skew', 'Dirty Read', 'Phantom Read'],
    citationId: 'SRC-DIST-01'
  },
  {
    id: 'contextual-bandits',
    term: 'Contextual Multi-Armed Bandits',
    acronym: 'CMAB',
    definition: 'An extension of reinforcement learning where an algorithm observes contextual metadata (user viewing history, device type, time of day) before selecting an arm (e.g. artwork variant) to optimize a payoff metric, dynamically balancing exploitation of winning variants with controlled exploration.',
    context: 'Employed by Netflix to personalize artwork thumbnails, balancing exploitation of the highest-converting image against exploring new creative variants across sub-demographics.',
    relatedTerms: ['Exploration vs. Exploitation', 'Thompson Sampling', 'Upper Confidence Bound (UCB)'],
    citationId: 'SRC-NFLX-REC-03'
  },
  {
    id: 'cqrs',
    term: 'Command Query Responsibility Segregation',
    acronym: 'CQRS',
    definition: 'An architectural pattern that strictly segregates the read model (queries) from the write model (commands), allowing each path to be scaled, cached, and optimized independently using dedicated data schemas.',
    context: 'Applied in the BookMyShow reference architecture: high-volume seat map availability queries (80,000 QPS) are served from in-memory compressed bitmaps in Redis/Varnish, completely segregated from the transactional booking write engine in Aurora PostgreSQL.',
    relatedTerms: ['Event Sourcing', 'Materialized View', 'Read Replica', 'Dual-Write Hazard'],
    citationId: 'SRC-DIST-05'
  },
  {
    id: 'eventual-consistency',
    term: 'Eventual Consistency',
    definition: 'A weak consistency model guaranteeing that, in the absence of new update operations, all replicas of a distributed data store will eventually converge to identical values, though intermediate reads may return stale data.',
    context: 'The foundation of Netflix\'s planetary-scale recommendation pipeline: offline matrix factorization updates nearline profile caches asynchronously, accepting seconds or minutes of lag to deliver sub-100ms homepage responses.',
    relatedTerms: ['Causal Consistency', 'Read-Your-Writes', 'Monotonic Reads', 'CAP Theorem'],
    citationId: 'SRC-DIST-01'
  },
  {
    id: 'fencing-tokens',
    term: 'Fencing Tokens',
    definition: 'A monotonically increasing epoch counter issued by a distributed lock service upon every lock grant. Storage resources reject write operations from any client presenting a token lower than the highest token observed so far.',
    context: 'Protects distributed locks against long garbage collection pauses or network delays where a client erroneously assumes it still holds a lock after its TTL has expired (the Martin Kleppmann critique).',
    relatedTerms: ['Distributed Locking', 'Redlock', 'Optimistic Concurrency Control', 'Monotonic Counter'],
    citationId: 'SRC-DIST-01'
  },
  {
    id: 'idempotency-key',
    term: 'Idempotency Key',
    definition: 'A unique client-generated identifier transmitted in HTTP request headers allowing API servers to recognize retried requests and safely return the cached outcome of the original request without re-executing state-modifying operations.',
    context: 'Essential in payment processing and seat reservation submission to protect users against duplicate financial deductions when network connections timeout during POST requests.',
    relatedTerms: ['Exactly-Once Semantics', 'Deduplication Cache', 'Two-Phase Checkout'],
    citationId: 'SRC-DIST-03'
  },
  {
    id: 'kernel-tls',
    term: 'Kernel TLS',
    acronym: 'kTLS',
    definition: 'An operating system kernel capability where symmetric cryptographic operations (AES-GCM encryption/decryption) for established TLS sessions are performed directly inside the kernel or offloaded to network adapter hardware.',
    context: 'Allows Netflix OCAs to maintain encrypted HTTPS video delivery while utilizing zero-copy sendfile, removing the requirement to decrypt and re-encrypt data in user-space.',
    relatedTerms: ['Zero-Copy I/O', 'sendfile', 'TLS 1.3', 'Hardware Offload'],
    citationId: 'SRC-NFLX-CDN-02'
  },
  {
    id: 'linearizability',
    term: 'Linearizability',
    definition: 'The strongest consistency model for single-object operations, guaranteeing that all read and write operations appear to execute instantaneously at a specific point in time between their invocation and response.',
    context: 'Crucial in high-demand ticketing where a seat must transition from Available to Held without intermediate observers observing contradictory state.',
    relatedTerms: ['Strict Serializability', 'CAP Theorem', 'Sequential Consistency'],
    citationId: 'SRC-DIST-01'
  },
  {
    id: 'load-balancing',
    term: 'Load Balancing & Consistent Hashing',
    definition: 'The distribution of network traffic across multiple backend servers. Layer 4 balancing routes based on IP/port; Layer 7 routes based on HTTP headers, cookies, and URLs. Consistent Hashing minimizes cache key re-mapping when cluster nodes are added or removed.',
    context: 'Employed by Netflix Zuul 2 gateway clusters for non-blocking Layer 7 routing, and in EVCache/Redis clusters to ensure title and seat keys partition evenly across memory nodes.',
    relatedTerms: ['Reverse Proxy', 'Layer 7 Routing', 'Consistent Hashing', 'Health Checks'],
    citationId: 'SRC-NFLX-REC-02'
  },
  {
    id: 'partitioning-replication',
    term: 'Partitioning & Replication',
    definition: 'Partitioning (sharding) splits large datasets into disjoint subsets across nodes; replication creates redundant copies of partitions across nodes to provide high availability and read scalability.',
    context: 'Kafka partitions event logs by show_id to guarantee strict chronological ordering per show; PostgreSQL Aurora replicates storage across 6 storage nodes in 3 availability zones.',
    relatedTerms: ['Sharding', 'Quorum Consensus', 'Leader-Follower', 'Split-Brain'],
    citationId: 'SRC-AWS-AURORA-01'
  },
  {
    id: 'rate-limiting',
    term: 'Rate Limiting & Admission Control',
    definition: 'Traffic shaping mechanisms that restrict the frequency of requests entering a system over a time window, protecting downstream infrastructure from connection exhaustion and resource starvation.',
    context: 'Applied via Token Bucket algorithms at the API Gateway and Virtual Waiting Rooms during blockbuster on-sales to meter ingress traffic matching backend database write capacity (e.g. 500 users/sec).',
    relatedTerms: ['Token Bucket', 'Leaky Bucket', 'Virtual Waiting Room', 'Load Shedding'],
    citationId: 'SRC-DIST-01'
  },
  {
    id: 'saga-pattern',
    term: 'Saga Pattern (Distributed Transactions)',
    definition: 'A design pattern that manages distributed transactions across multiple microservices and external APIs as a sequence of local transactions, coordinated either through an orchestrator or event choreography, with explicit compensating transactions for rollback.',
    context: 'Applied in the ticketing reference architecture to coordinate seat reservation holds, external payment gateway charges, and cinema box office commits without blocking two-phase commit locks.',
    relatedTerms: ['Compensating Transaction', 'Two-Phase Commit', 'Eventual Consistency'],
    citationId: 'SRC-DIST-04'
  },
  {
    id: 'settlement-free-interconnection',
    term: 'Settlement-Free Interconnection (Peering)',
    acronym: 'SFI',
    definition: 'A bilateral commercial arrangement between two Internet network operators (e.g. Netflix and an ISP) to directly exchange traffic at an Internet Exchange Point (IXP) without either party paying the other for transit fees.',
    context: 'Forms the backbone of the Netflix Open Connect routing model, routing video bytes directly to consumer ISPs without costly transit backbones.',
    relatedTerms: ['Open Connect Appliances (OCAs)', 'BGP Route Advertisement', 'IXP'],
    citationId: 'SRC-NFLX-CDN-01'
  },
  {
    id: 'sharding',
    term: 'Database Sharding',
    definition: 'A horizontal database partitioning technique where rows of a database table are distributed across separate physical database instances based on a shard key (hash-based or range-based).',
    context: 'Contrasted in high-contention systems: sharding by event_id spreads shows across databases, but does not solve hot-spot contention on a single blockbuster stadium concert.',
    relatedTerms: ['Shard Key', 'Hot Partition', 'Horizontal Scaling', 'Cross-Shard Joins'],
    citationId: 'SRC-DIST-01'
  },
  {
    id: 'tail-latency',
    term: 'Tail Latency (p99 / p99.9)',
    definition: 'The high-percentile latency experienced by the slowest requests (e.g. the 99th or 99.9th percentile). In fan-out microservice architectures, total request latency is dominated by tail latency because a page must await the slowest sub-service.',
    context: 'Critical in Netflix 2D page assembly where a single page fans out to 10+ row candidate algorithms; hedging requests and strict 40ms timeouts are enforced to prevent tail latency degradation.',
    relatedTerms: ['Hedging Requests', 'Fan-Out Amplification', 'Percentile SLAs', 'Circuit Breakers'],
    citationId: 'SRC-NFLX-REC-02'
  },
  {
    id: 'ttl',
    term: 'Time-To-Live (TTL)',
    acronym: 'TTL',
    definition: 'A data retention counter or timestamp after which an item is automatically evicted or expired from storage or cache.',
    context: 'Has dual roles in our monographs: in Netflix, TTL (e.g. 24h) serves as cache eviction for stable recommendations; in BookMyShow, TTL (600s) acts as an ephemeral exclusive reservation lease that reclaims seats upon checkout abandonment.',
    relatedTerms: ['Cache Expiration', 'Ephemeral Lease', 'Passive Eviction', 'Active Sweeper'],
    citationId: 'SRC-DIST-02'
  },
  {
    id: 'write-amplification',
    term: 'Write Amplification',
    definition: 'The phenomenon where a single application-level write operation produces multiple physical disk or network writes due to storage engine mechanics (e.g. Write-Ahead Logs, B-Tree index updates, LSM-tree compaction, or synchronous cross-AZ replication).',
    context: 'In PostgreSQL under flash-sale load, updating a single seat row writes to the WAL, updates the primary B-tree, updates 3 indexes, and streams WAL to read replicas and outbox CDC—amplifying write I/O by 5–10x.',
    relatedTerms: ['LSM-Tree', 'WAL', 'B-Tree Indexing', 'Compaction', 'CDC'],
    citationId: 'SRC-AWS-AURORA-01'
  },
  {
    id: 'zero-copy-io',
    term: 'Zero-Copy I/O (sendfile)',
    definition: 'A system call optimization that transfers data directly from file system cache buffers in the operating system kernel to the network interface card (NIC) socket buffer, bypassing expensive context switches and user-space memory copies.',
    context: 'A cornerstone of Netflix Open Connect Appliances (OCAs), enabling FreeBSD servers running NGINX to deliver 100+ Gbps of video throughput per single rack unit.',
    relatedTerms: ['Kernel TLS', 'DMA', 'kqueue', 'Page Cache'],
    citationId: 'SRC-NFLX-CDN-02'
  },
  {
    id: 'zero-downtime-deployment',
    term: 'Zero-Downtime Deployment',
    definition: 'Deployment strategies (Blue-Green, Canary, Rolling updates) that deploy new software versions to production without interrupting active user traffic or dropping TCP connections.',
    context: 'Applied in Netflix microservices via Spinnaker canary analysis, and in Open Connect appliances where BGP routing drains active video traffic gracefully before FreeBSD kernel upgrades.',
    relatedTerms: ['Blue-Green Deployment', 'Canary Analysis', 'Graceful Drain', 'BGP Route Withdrawal'],
    citationId: 'SRC-NFLX-CDN-01'
  }
];
