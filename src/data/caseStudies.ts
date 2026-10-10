import { CaseStudyMeta } from '../types';

export const CASE_STUDIES: CaseStudyMeta[] = [
  {
    id: 'netflix',
    title: 'Netflix: Planetary-Scale Personalization & Content Delivery',
    kicker: 'CASE STUDY 01 // MASSIVE READ-HEAVY WORKLOAD',
    tagline: 'Solving the 2D Homepage Assembly Problem and Streaming Video at 100+ Gbps per Server',
    description: 'An investigation into how Netflix combines a 3-tier computing hierarchy (Offline batch, Nearline streaming, Online real-time) with contextual multi-armed bandits to personalize hundreds of millions of unique homepages, while offloading planetary video bandwidth via its custom Open Connect CDN.',
    accentColor: '#E50914',
    route: '/netflix',
    badgeText: 'Personalization & CDN',
    coreChallenges: [
      '2D Layout Formulation: Concurrently optimizing row generation and intra-row video ranking under sub-100ms request SLA',
      'Contextual Bandits: Dynamically testing and serving personalized artwork thumbnails without introducing latency regressions',
      'Low-Power Client Silicons: Supporting resource-constrained Smart TVs via React-Gibbon and server-side layout pre-assembly',
      'Edge Video Delivery: Bypassing user-space memory copies via FreeBSD kernel sendfile and kTLS to achieve 100 Gbps per appliance'
    ],
    keyArchitectures: [
      '3-Tier Compute Hierarchy (Offline batch, Nearline Flink/Kafka/Mantis, Online Zuul/EVCache)',
      'Contextual Multi-Armed Bandit Exploration Engine',
      'React-Gibbon & 2024 TV Top-Navigation Client Runtime',
      'Open Connect Appliance (OCA) FreeBSD zero-copy video streaming plane'
    ],
    evidenceSummary: {
      documented: 6,
      inference: 2,
      reference: 0
    }
  },
  {
    id: 'bookmyshow',
    title: 'BookMyShow: High-Demand Ticketing & Distributed Concurrency',
    kicker: 'CASE STUDY 02 // MASSIVE WRITE-CONTENDED WORKLOAD',
    tagline: 'Mitigating Flash-Sale Race Conditions, Distributed Deadlocks, and Multi-Phase Payment Settlement',
    description: 'An architectural exploration of the ticket reservation archetype: handling extreme write contention during blockbuster movie and concert flash sales. Features a three-layer defense (Ingress rate limiting, Redis Lua atomic CAS locks, and PostgreSQL transactional ledger) backed by a distributed Saga payment coordinator and third-party cinema POS synchronization.',
    accentColor: '#F84464',
    route: '/bookmyshow',
    badgeText: 'Ticketing & Concurrency',
    coreChallenges: [
      'Flash-Sale Contention: Thousands of concurrent requests racing to lock the exact same seat coordinates within milliseconds',
      'Zero Double-Booking Invariant: Guaranteeing strict mutual exclusion without distributed lock deadlocks or phantom allocations',
      'Asynchronous Checkout Countdown: Managing 10-minute ephemeral reservation TTLs across browser disconnects and slow payment gateways',
      'Third-Party Cinema POS Sync: Reconciling aggregator online reservations with remote multiplex box office systems (e.g., Vista Connect API)'
    ],
    keyArchitectures: [
      'Token-Bucket Ingress Rate Limiting & Virtual Waiting Rooms',
      'Redis Cluster Single-Instance Lua CAS Atomic Locking with Fencing Tokens',
      'Saga Orchestration for Payment Gateway Webhook Reconciliation and Compensating Releases',
      'PostgreSQL Serializable/Optimistic Ledger with External Cinema Box Office Sync'
    ],
    evidenceSummary: {
      documented: 3,
      inference: 2,
      reference: 4
    }
  }
];
