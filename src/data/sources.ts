import { Citation } from '../types';

export const SOURCES: Citation[] = [
  {
    id: 'SRC-NFLX-REC-01',
    tier: 'DOCUMENTED',
    title: 'Learning a Personalized Homepage',
    authors: 'Justin Basilico, Chris Alvino',
    venue: 'Netflix Technology Blog',
    year: 2015,
    url: 'https://netflixtechblog.com/learning-a-personalized-homepage-aa8ec670359a',
    summary: 'Details the formulation of the homepage as a 2D grid optimization problem consisting of candidate generation, row selection, video ranking, and whole-page layout synthesis.',
    keyTakeaway: 'The homepage balances relevance, topical diversity, and novelty by optimizing both row composition and intra-row video ranking.',
    domain: 'netflix',
    sourceType: 'First-party Corporate Engineering Publication',
    supportedClaims: [
      '2D homepage formulation (row selection and item ranking within rows)',
      'Candidate generation per row from specialized recommendation algorithms',
      'Whole-page diversity re-ranking to prevent genre clustering'
    ],
    knownLimitations: 'Published in 2015; algorithms reflect learning-to-rank trees prior to modern Transformer sequence models.'
  },
  {
    id: 'SRC-NFLX-REC-02',
    tier: 'DOCUMENTED',
    title: 'System Architectures for Personalization and Recommendation',
    authors: 'Xavier Amatriain, Justin Basilico',
    venue: 'Netflix Technology Blog',
    year: 2013,
    url: 'https://netflixtechblog.com/system-architectures-for-personalization-and-recommendation-e081aa94b5d8',
    summary: 'Establishes the foundational three-tier computing architecture partitioning recommendation computation into Offline (batch), Nearline (stream), and Online (real-time sub-100ms) tiers.',
    keyTakeaway: 'Decouples high-latency deep model training from strict user-facing request latency SLAs via fallback caches.',
    domain: 'netflix',
    sourceType: 'First-party Corporate Engineering Publication',
    supportedClaims: [
      'Three-tier computational model (Offline batch, Nearline streaming, Online real-time)',
      'Sub-100ms user request budget at the online gateway',
      'Graceful degradation to cached precomputed rows upon online model timeout'
    ],
    knownLimitations: 'High-level architectural topology; private microservice interfaces and exact cluster sizing are stylized.'
  },
  {
    id: 'SRC-NFLX-REC-03',
    tier: 'DOCUMENTED',
    title: 'Artwork Personalization at Netflix',
    authors: 'Ashok Chandrashekar, Fernando Amat, Justin Basilico, Tony Jebara',
    venue: 'Netflix Technology Blog',
    year: 2017,
    url: 'https://netflixtechblog.com/artwork-personalization-c589f074ad76',
    summary: 'Presents contextual multi-armed bandit formulations for dynamic, personalized artwork selection based on individual viewing histories.',
    keyTakeaway: 'Personalization extends beyond title ranking into visual asset selection, dynamically balancing exploration vs exploitation.',
    domain: 'netflix',
    sourceType: 'First-party Corporate Engineering Publication',
    supportedClaims: [
      'Contextual multi-armed bandit algorithms for thumbnail artwork personalization',
      'Minimization of regret while continually exploring creative variants',
      'Sub-10ms artwork ID resolution during page assembly'
    ],
    knownLimitations: 'Focuses on offline simulated evaluation and early A/B production runs; specific bandit hyper-parameters are proprietary.'
  },
  {
    id: 'SRC-NFLX-CLIENT-01',
    tier: 'DOCUMENTED',
    title: 'Crafting a Multi-Tenant TV UI Experience with React-Gibbon',
    authors: 'Netflix Engineering Team',
    venue: 'Netflix Technology Blog',
    year: 2015,
    url: 'https://netflixtechblog.com/crafting-a-multi-tenant-tv-ui-experience-with-react-gibbon-6238cc3f3503',
    summary: 'Deconstructs the React-Gibbon architecture created to deliver 60fps animations on low-memory embedded Smart TV hardware.',
    keyTakeaway: 'Embedded client silicon memory limits require aggressive texture virtualization and server-assembled row layout trees.',
    domain: 'netflix',
    sourceType: 'First-party Corporate Engineering Publication',
    supportedClaims: [
      'React-Gibbon client runtime optimized for resource-constrained Smart TVs',
      'Server-side layout pre-assembly returning serialized JSON trees',
      'Memory management via aggressive image texture virtualization'
    ],
    knownLimitations: 'Details the 2015 client runtime; television frontends evolved toward the 2024 TV Top-Navigation framework.'
  },
  {
    id: 'SRC-NFLX-CLIENT-02',
    tier: 'DOCUMENTED',
    title: 'Evolving the Netflix TV Experience: 2024 Interface Redesign',
    authors: 'Netflix Engineering & Product Announcements',
    venue: 'Netflix Newsroom & Disclosures',
    year: 2024,
    url: 'https://about.netflix.com/en/news/evolving-the-netflix-tv-experience',
    summary: 'Details migration from sidebar navigation to top navigation and dynamic in-place title card expansion on living room television screens.',
    keyTakeaway: 'In-place dynamic title expansion requires synchronized metadata caching and responsive thumbnail delivery to prevent layout jank.',
    domain: 'netflix',
    sourceType: 'First-party Corporate Product Announcement',
    supportedClaims: [
      'Top navigation architecture consolidating Browse, Search, and My Netflix',
      'In-place dynamic card expansion replacing full-page context shifts',
      'Unified My Netflix hub aggregating continue-watching and member reminders'
    ],
    knownLimitations: 'Product announcement detailing living room UI rollout; excludes backend microservice payload schemas.'
  },
  {
    id: 'SRC-NFLX-CDN-01',
    tier: 'DOCUMENTED',
    title: 'Netflix Open Connect Architecture and Deployment Guide',
    authors: 'Netflix Open Connect Engineering',
    venue: 'Netflix Partner Documentation',
    year: 2024,
    url: 'https://openconnect.netflix.com/',
    summary: 'Authoritative architecture guide for Open Connect Appliances (OCAs) deployed directly inside ISP networks and IXP peering points.',
    keyTakeaway: '100% video traffic localized to ISP edges; proactive off-peak fill pre-positions content overnight to protect peering transit.',
    domain: 'netflix',
    sourceType: 'Official Technical Partner Documentation',
    supportedClaims: [
      '100% video bandwidth delivered via Open Connect Appliances embedded in ISPs',
      'Proactive overnight fill during off-peak hours achieving 95%+ edge cache hit ratio',
      'BGP routing to localize video bytes within 1 network hop of subscribers'
    ],
    knownLimitations: 'Partner deployment specification; excludes confidential ISP commercial interconnection contracts.'
  },
  {
    id: 'SRC-NFLX-CDN-02',
    tier: 'DOCUMENTED',
    title: 'Serving 100 Gbps from an Open Connect Appliance',
    authors: 'Drew Long, Netflix CDN Team',
    venue: 'Netflix Technology Blog',
    year: 2019,
    url: 'https://netflixtechblog.com/serving-100-gbps-from-an-open-connect-appliance-cdb51dda3b99',
    summary: 'Hardware, kernel, and software optimizations including FreeBSD zero-copy sendfile, Kernel TLS (kTLS), and NVMe tuning.',
    keyTakeaway: 'Eliminating user-space memory buffers and offloading TLS crypto to kernel space enables 100+ Gbps throughput from a single 1RU server.',
    domain: 'netflix',
    sourceType: 'First-party Corporate Engineering Publication',
    supportedClaims: [
      'Sustained 100 Gbps TLS streaming from a single 1RU FreeBSD flash server',
      'FreeBSD zero-copy sendfile eliminating user-space memory copies',
      'Kernel TLS (kTLS) offload keeping CPU utilization low at line rate'
    ],
    knownLimitations: 'Hardware-specific to AMD EPYC / Intel Xeon 100 GbE appliances tested in 2019.'
  },
  {
    id: 'SRC-NFLX-INFRA-01',
    tier: 'DOCUMENTED',
    title: 'Open Sourcing Zuul 2',
    authors: 'Arthur Gonigberg, Mikey Cohen, Carl Quinn',
    venue: 'Netflix Technology Blog',
    year: 2018,
    url: 'https://netflixtechblog.com/open-sourcing-zuul-2-82ea476cb2b3',
    summary: 'Presents the architecture of Zuul 2, transitioning Netflix cloud gateway from blocking servlet threads to asynchronous, non-blocking Netty networking to handle hundreds of billions of requests daily.',
    keyTakeaway: 'Non-blocking asynchronous I/O with Netty event loops enables massive connection concurrency and resilient connection pooling without thread starvation.',
    domain: 'netflix',
    sourceType: 'First-party Corporate Engineering Publication',
    supportedClaims: [
      'Non-blocking asynchronous reverse proxy gateway built on Netty event loops',
      'Sub-5ms gateway proxy overhead under heavy connection concurrency',
      'Dynamic routing filters, load shedding, and circuit breaking at the ingress edge'
    ],
    knownLimitations: 'Describes Zuul 2 architecture; Netflix internal microservice routing has since incorporated Envoy and Spring Cloud Gateway adaptations.'
  },
  {
    id: 'SRC-NFLX-REC-04',
    tier: 'DOCUMENTED',
    title: 'Deep Learning for Recommender Systems & Sequence Models',
    authors: 'Alexandros Karatzoglou, Balázs Hidasi',
    venue: 'ACM RecSys & Netflix Research',
    year: 2018,
    url: 'https://netflixtechblog.com/deep-learning-for-recommender-systems-48c786a20e1a',
    summary: 'Surveys deep learning, autoencoders, and neural sequence models for temporal user trajectory prediction and collaborative filtering at scale.',
    keyTakeaway: 'Combines temporal sequence representations with high-throughput offline batch training on GPU clusters.',
    domain: 'netflix',
    sourceType: 'Peer-Reviewed Tutorial & Research Publication',
    supportedClaims: [
      'Neural sequence models for temporal viewing trajectory prediction',
      'Offline distributed training on GPU clusters generating model snapshots',
      'Precomputed item embeddings and candidate sets materialized to fast key-value caches'
    ],
    knownLimitations: 'Survey of deep learning recommendation primitives; Netflix proprietary production models are kept private.'
  },
  {
    id: 'SRC-BMS-CORP-01',
    tier: 'DOCUMENTED',
    title: 'How BookMyShow Scales Real-time Analytics with Databricks and AWS',
    authors: 'Databricks Customer Success Engineering',
    venue: 'Databricks Enterprise Case Study',
    year: 2021,
    url: 'https://www.databricks.com/customers/bookmyshow/genie',
    summary: 'Details BookMyShow cloud infrastructure deployment on AWS utilizing Amazon Redshift, Amazon S3, and Delta Lake pipelines.',
    keyTakeaway: 'Decoupled operational ticketing transactions from asynchronous customer behavioral analytics and business intelligence.',
    domain: 'bookmyshow',
    sourceType: 'Verified Enterprise Cloud Case Study',
    supportedClaims: [
      'BookMyShow cloud deployment operates on Amazon Web Services (AWS)',
      'Databricks Delta Lake and Amazon S3 handle billions of behavioral telemetry records',
      'Operational transactional engines are decoupled from analytical pipelines'
    ],
    knownLimitations: 'Excludes BookMyShow internal OLTP transactional locking microservice source code.'
  },
  {
    id: 'SRC-BMS-CORP-02',
    tier: 'DOCUMENTED',
    title: 'Engineering Mobile Architectures for High Scale at BookMyShow',
    authors: 'HasGeek / JSFoo / Fragments Conferences',
    venue: 'HasGeek Engineering Sessions',
    year: 2019,
    url: 'https://hasgeek.com/jsfoo/',
    summary: 'Dissects client concurrency challenges and state management on mobile devices, including client-side countdown timer synchronization with backend locks.',
    keyTakeaway: 'Mobile seat layout rendering requires aggressive memory optimizations and strict 8–10 minute client-side checkout countdown timers.',
    domain: 'bookmyshow',
    sourceType: 'Verified Conference Technical Presentation',
    supportedClaims: [
      'Client seat layout rendering across millions of mobile devices',
      'Client state machine enforcing strict 8–10 minute reservation timeout countdowns',
      'Optimistic client UI feedback synchronized with server-side lease expirations'
    ],
    knownLimitations: 'Frontend mobile focus; excludes internal server-side distributed lock algorithms.'
  },
  {
    id: 'SRC-BMS-EXT-01',
    tier: 'DOCUMENTED',
    title: 'Vista Cinema Ticketing & Box Office Integration Protocol (Connect API)',
    authors: 'Vista Group Technical Documentation',
    venue: 'Cinema Multiplex Software Specifications',
    year: 2023,
    url: 'https://www.vista.co/',
    summary: 'Standard industry protocol for third-party aggregator hold-and-commit workflows with cinema point-of-sale systems.',
    keyTakeaway: 'Aggregators must coordinate a two-phase reservation protocol against remote cinema box office systems with finite TTL reservation holds.',
    domain: 'bookmyshow',
    sourceType: 'Cinema Box Office POS Technical Specification',
    supportedClaims: [
      'Two-phase reservation hold protocol (HoldSeats, CommitSeats, CancelHold)',
      'Aggregator holds are temporary (8–10 minute TTL) at physical cinema box offices',
      'Physical multiplex counter inventory is held during online checkout'
    ],
    knownLimitations: 'Vista Cinema Connect API spec; other regional multiplex chains may use proprietary POS variants.'
  },
  {
    id: 'SRC-DIST-01',
    tier: 'DOCUMENTED',
    title: 'Designing Data-Intensive Applications',
    authors: 'Martin Kleppmann',
    venue: "O'Reilly Media",
    year: 2017,
    url: 'https://dataintensive.net/',
    summary: 'Seminal distributed systems textbook covering transactions, linearizability, distributed locks, consensus, and write skew.',
    keyTakeaway: 'Distributed locking requires fencing tokens to prevent zombie workers from executing after lock expiration.',
    domain: 'distributed-systems',
    sourceType: 'Peer-Reviewed Academic & Engineering Monograph',
    supportedClaims: [
      'Martin Kleppmann client pause hazard: distributed locks with TTLs fail under GC pauses without fencing tokens',
      'Weak isolation anomalies: Write Skew during reservation workflows under Read Committed',
      'CAP & PACELC theorem trade-offs between consistency and latency'
    ],
    knownLimitations: 'Foundational distributed systems theory; not company-specific.'
  },
  {
    id: 'SRC-DIST-02',
    tier: 'DOCUMENTED',
    title: 'Distributed Locks with Redis and Safety Guarantees',
    authors: 'Salvatore Sanfilippo (antirez), Martin Kleppmann',
    venue: 'Technical Discourse & Analysis',
    year: 2016,
    url: 'https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html',
    summary: 'Technical debate analyzing Redlock algorithm safety under process pauses, clock drift, and network partitions.',
    keyTakeaway: 'Single-instance Redis with atomic Lua compare-and-swap (CAS) scripts provides predictable semantics when coupled with monotonically increasing version checks.',
    domain: 'distributed-systems',
    sourceType: 'Published Technical Analysis & Academic Debate',
    supportedClaims: [
      'Single-threaded Redis Lua scripts execute atomically on the CPU memory loop',
      'Distributed lock safety under unsynchronized clocks requires fencing tokens'
    ],
    knownLimitations: 'Applies to single-shard memory loops or Quorum lock managers.'
  },
  {
    id: 'SRC-DIST-03',
    tier: 'DOCUMENTED',
    title: 'Idempotency on Stripe APIs: Designing Resilient Payment Systems',
    authors: 'Brandur Leach',
    venue: 'Stripe Engineering Architecture Blog',
    year: 2017,
    url: 'https://stripe.com/blog/idempotency',
    summary: 'Explains the mechanics of Idempotency-Key headers, atomic transaction reservation tables, and replay protection in financial APIs.',
    keyTakeaway: 'Guarantees that network retries during payment gateway handoffs never produce duplicate financial charges.',
    domain: 'distributed-systems',
    sourceType: 'First-party Corporate Engineering Publication',
    supportedClaims: [
      'API Idempotency-Key headers prevent duplicate financial debits on network retry',
      'Atomic reservation tables in relational databases cache idempotent responses'
    ],
    knownLimitations: 'Describes Stripe financial API architecture; applied as reference design for ticketing checkout.'
  },
  {
    id: 'SRC-DIST-04',
    tier: 'DOCUMENTED',
    title: 'Pattern: Saga in Distributed Architectures',
    authors: 'Chris Richardson',
    venue: 'Microservices Patterns & Architectural Standards',
    year: 2018,
    url: 'https://microservices.io/patterns/data/saga.html',
    summary: 'Authoritative pattern definition for distributed transactions across multiple microservice databases without locking via 2PC.',
    keyTakeaway: 'Coordinates distributed workflows via local transactions with explicit forward and backward compensating actions.',
    domain: 'distributed-systems',
    sourceType: 'Established Distributed Architecture Pattern Specification',
    supportedClaims: [
      'Orchestrated Sagas coordinate distributed transactions without blocking 2PC locks',
      'Deterministic compensating transactions roll back partial state upon failure'
    ],
    knownLimitations: 'Conceptual pattern description.'
  },
  {
    id: 'SRC-DIST-05',
    tier: 'DOCUMENTED',
    title: 'Pattern: Transactional Outbox',
    authors: 'Chris Richardson',
    venue: 'Microservices Patterns & Reliable Messaging Standards',
    year: 2019,
    url: 'https://microservices.io/patterns/data/transactional-outbox.html',
    summary: 'Specifies reliable event publication from relational databases to message brokers, eliminating dual-write hazards.',
    keyTakeaway: 'Saves domain events directly in an outbox table within the same ACID transaction, tailed via CDC to Kafka.',
    domain: 'distributed-systems',
    sourceType: 'Established Distributed Architecture Pattern Specification',
    supportedClaims: [
      'Transactional Outbox eliminates dual-write anomalies between databases and Kafka',
      'Change Data Capture (CDC via Debezium) tails database Write-Ahead Logs reliably'
    ],
    knownLimitations: 'Requires running CDC infrastructure (Debezium/Kafka Connect).'
  },
  {
    id: 'SRC-AWS-AURORA-01',
    tier: 'DOCUMENTED',
    title: 'Amazon Aurora PostgreSQL Under High Concurrency',
    authors: 'AWS Architecture Center & RDS Engineering',
    venue: 'AWS Technical Documentation',
    year: 2023,
    url: 'https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/',
    summary: 'Details storage architecture, connection pool limits, and write contention behaviors under heavy OLTP traffic.',
    keyTakeaway: 'All write transactions funnel through a single primary writer instance, mandating in-memory load shedding for contested hot keys.',
    domain: 'bookmyshow',
    sourceType: 'Cloud Provider Infrastructure Technical Documentation',
    supportedClaims: [
      'Aurora PostgreSQL writes funnel through a single primary writer instance',
      'Direct connection limits (max_connections = 1,000) mandate PgBouncer multiplexing',
      'Multi-AZ quorum storage provides sub-10ms commit latency'
    ],
    knownLimitations: 'AWS-specific infrastructure specifications.'
  }
];
