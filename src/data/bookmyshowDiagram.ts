import { Node, Edge, MarkerType } from '@xyflow/react';
import { ArchitectureNodeData } from '../types';

export const BMS_DIAGRAM_TITLE = "BookMyShow-Like Ticketing Architecture: High-Demand Concurrency & Saga Orchestration";
export const BMS_DIAGRAM_EXPLANATION = 
  "An interactive architecture map detailing the proposed reference architecture for flash-sale seat reservations: ingress admission control, single-threaded in-memory lock acquisition (Redis Lua CAS), durable database constraints (UNIQUE show_id, seat_id), external cinema box office synchronization (Vista Connect API), and asynchronous payment reconciliation.";

export const BMS_NODES: Node<ArchitectureNodeData>[] = [
  // 1. Client & Ingress
  {
    id: 'bms-client',
    type: 'customNode',
    position: { x: 30, y: 160 },
    data: {
      label: 'Customer Client',
      sublabel: 'Mobile App (iOS/Android) & Web Client',
      tier: 'DOCUMENTED',
      category: 'client',
      responsibility: 'Renders dynamic seat maps, initiates 8–10 minute countdown timer upon hold grant, collects payment credentials, and renders confirmed QR ticket.',
      inputs: ['User tap on seat coordinates', 'Payment selection', 'Countdown timer ticks'],
      outputs: ['GET /shows/{id}/seatmap', 'POST /shows/{id}/holds', 'POST /orders/checkout'],
      dependencies: ['API Edge Gateway & Virtual Waiting Room'],
      techStack: 'React Native, Swift, Kotlin, Next.js / WebGL Seat Canvas',
      latencySla: 'Client target: 60fps seatmap pan/zoom; < 300ms network round-trip',
      failureMode: 'Displays timer expiration alert; refreshes seat layout upon lock timeout',
      citations: ['SRC-BMS-CORP-01']
    }
  },
  {
    id: 'bms-gateway',
    type: 'customNode',
    position: { x: 340, y: 160 },
    data: {
      label: 'Edge Gateway & Virtual Waiting Room',
      sublabel: 'Admission Control & Token Bucket Rate Limiter',
      tier: 'REFERENCE',
      category: 'gateway',
      responsibility: 'Enforces ingress rate limits, queues surplus burst traffic in a virtual waiting room during stadium on-sales, and routes requests to read vs write microservices.',
      inputs: ['HTTPS requests from 2,000,000+ queued clients'],
      outputs: ['Forwarded HTTP/gRPC requests with validated session tokens'],
      dependencies: ['Discovery Catalog', 'Booking Orchestrator'],
      techStack: 'Envoy Proxy, AWS CloudFront, Cloudflare Waiting Room, Redis Token Bucket',
      latencySla: '< 5ms edge routing overhead',
      failureMode: 'Sheds non-essential traffic with HTTP 429 Too Many Requests; holds users in FIFO queue',
      citations: ['SRC-AWS-AURORA-01']
    }
  },

  // 2. Read Path Services
  {
    id: 'bms-catalog',
    type: 'customNode',
    position: { x: 680, y: 40 },
    data: {
      label: 'Discovery & Show Catalog Service',
      sublabel: 'Metadata & Schedule Engine',
      tier: 'DOCUMENTED',
      category: 'compute',
      responsibility: 'Serves static and semi-static metadata: movies, artists, venues, auditorium physical geometries, and scheduled showtimes.',
      inputs: ['GET /venues', 'GET /shows/{id}/metadata'],
      outputs: ['Showtime schedule, seat map template layout (rows, tiers, coordinates)'],
      dependencies: ['Distributed Read Cache', 'Analytical Lakehouse'],
      techStack: 'Go / Java Spring Boot, Aurora PostgreSQL Read Replicas',
      latencySla: 'p99 < 20ms read latency',
      failureMode: 'Serves stale catalog metadata from edge CDN cache if database replicas lag',
      citations: ['SRC-BMS-CORP-01']
    }
  },
  {
    id: 'bms-read-cache',
    type: 'customNode',
    position: { x: 1040, y: 40 },
    data: {
      label: 'Seat Availability Read Cache',
      sublabel: 'High-Throughput Bitmap / Hash Cache',
      tier: 'REFERENCE',
      category: 'cache',
      responsibility: 'Absorbs massive read traffic (80,000 QPS) polling for seat availability status. Maintains a compressed bitmap or hash of seat states with a 1–2 second TTL.',
      inputs: ['Cache lookup per showtime', 'Cache invalidation events from Kafka'],
      outputs: ['Binary seat availability array (0 = Available, 1 = Held, 2 = Sold)'],
      dependencies: ['Kafka Message Broker'],
      techStack: 'Redis Cluster / Memcached with Bitmaps / Varnish Edge Cache',
      latencySla: 'p99 < 2ms',
      failureMode: 'Cache miss falls back to database read replica; client tolerates slightly stale availability',
      citations: ['SRC-DIST-01']
    }
  },

  // 3. Write Path & Concurrency Core
  {
    id: 'bms-orchestrator',
    type: 'customNode',
    position: { x: 680, y: 270 },
    data: {
      label: 'Booking Orchestrator & Saga Coordinator',
      sublabel: 'Distributed State Machine & Transaction Coordinator',
      tier: 'REFERENCE',
      category: 'compute',
      responsibility: 'Coordinates the multi-step checkout lifecycle: verifies user eligibility, acquires ephemeral seat lock, coordinates third-party cinema hold, initiates payment, and commits or rolls back.',
      inputs: ['POST /shows/{id}/holds', 'POST /orders/checkout', 'Payment Webhook callbacks'],
      outputs: ['Orchestration commands to Ephemeral Lock, Vista POS, and Payment Gateway'],
      dependencies: ['Ephemeral Lock Tier', 'Seat Inventory Manager', 'Multiplex POS Gateway'],
      techStack: 'Temporal.io / AWS Step Functions / Node.js TypeScript State Machine',
      latencySla: '< 40ms end-to-end orchestration step',
      failureMode: 'Executes compensating transactions upon timeout: releases in-memory lock and cancels Vista hold',
      citations: ['SRC-DIST-04']
    }
  },
  {
    id: 'bms-ephemeral-lock',
    type: 'customNode',
    position: { x: 1040, y: 200 },
    data: {
      label: 'In-Memory Ephemeral Lock Engine',
      sublabel: 'Single-Threaded Redis Lua CAS with Fencing Tokens',
      tier: 'REFERENCE',
      category: 'cache',
      responsibility: 'Provides sub-2ms mutual exclusion on contested seat IDs. Executes atomic Lua script to inspect seat availability and write lock key with 600s TTL. Emits monotonic fencing token.',
      inputs: ['EVAL seat_hold.lua (show_id, seat_ids, user_id, ttl=600s)'],
      outputs: ['SUCCESS (lock granted + fencing_token) OR FAILURE (already held)'],
      dependencies: ['None (Single-threaded memory loop)'],
      techStack: 'Redis 7.x Primary Instance (Non-clustered single shard per show event) / Valkey',
      latencySla: 'p99 < 1.5ms',
      failureMode: 'Instance failure triggers Sentinel failover; fencing token prevents stale lock writes',
      citations: ['SRC-DIST-02', 'SRC-DIST-01']
    }
  },
  {
    id: 'bms-inventory-svc',
    type: 'customNode',
    position: { x: 1040, y: 360 },
    data: {
      label: 'Seat Inventory & Reservation Service',
      sublabel: 'Domain Business Logic & Hold Persistence',
      tier: 'REFERENCE',
      category: 'compute',
      responsibility: 'Validates business invariants (max 10 tickets per user, no single orphan seat left in row), generates unique reservation ID, and writes hold record.',
      inputs: ['Validated seat hold command with fencing token'],
      outputs: ['SQL INSERT / UPDATE commands to Transactional Database'],
      dependencies: ['Transactional Database (PostgreSQL)'],
      techStack: 'Rust / Go / Java with PgBouncer connection pooler',
      latencySla: 'p99 < 15ms database write latency',
      failureMode: 'Transaction rollback on database unique constraint collision or connection pool saturation',
      citations: ['SRC-AWS-AURORA-01']
    }
  },

  // 4. Persistence & External Box Office
  {
    id: 'bms-transactional-db',
    type: 'customNode',
    position: { x: 1400, y: 360 },
    data: {
      label: 'Transactional Database (ACID Store)',
      sublabel: 'PostgreSQL / Aurora with Strict Invariants',
      tier: 'REFERENCE',
      category: 'storage',
      responsibility: 'The ultimate source of truth. Enforces hard physical constraint: UNIQUE (show_id, seat_id) WHERE status = CONFIRMED. Stores bookings, payments, and outbox tables.',
      inputs: ['SQL transactions from Inventory Service and Saga Orchestrator'],
      outputs: ['Committed booking records, outbox CDC log'],
      dependencies: ['None (Storage root)'],
      techStack: 'Amazon Aurora PostgreSQL (Multi-AZ, db.r6g.8xlarge writer + PgBouncer)',
      latencySla: 'Write commit p99 < 12ms',
      failureMode: 'Primary failure triggers automated 30s Aurora replica promotion; ACID rollback on conflicts',
      citations: ['SRC-AWS-AURORA-01']
    }
  },
  {
    id: 'bms-vista-pos',
    type: 'customNode',
    position: { x: 680, y: 490 },
    data: {
      label: 'Cinema Multiplex POS (Vista Connect)',
      sublabel: 'Third-Party Physical Box Office Interface',
      tier: 'DOCUMENTED',
      category: 'external',
      responsibility: 'External cinema system managing physical box office ticket counters. Exposes two-phase hold protocol (HoldSeats, CommitSeats, CancelHold) to prevent counter sales.',
      inputs: ['HTTP POST /HoldSeats', 'HTTP POST /CommitSeats', 'HTTP POST /CancelHold'],
      outputs: ['Vista Reservation Confirmation / Error Code'],
      dependencies: ['Cinema chain private network / VPN'],
      techStack: 'Vista Connect API / In-Cinema POS Servers',
      latencySla: 'Variable: 200ms – 1,500ms external network call',
      failureMode: 'Timeout triggers Saga compensation; circuit breaker prevents cascading thread exhaustion',
      citations: ['SRC-BMS-EXT-01']
    }
  },
  {
    id: 'bms-payment-gw',
    type: 'customNode',
    position: { x: 340, y: 490 },
    data: {
      label: 'Payment Gateway & Acquirer',
      sublabel: 'Razorpay / Stripe / Juspay Integration',
      tier: 'DOCUMENTED',
      category: 'external',
      responsibility: 'Accepts credit cards, UPI, and net banking. Enforces unique Idempotency-Key header to eliminate duplicate billing during network retries; sends asynchronous webhooks.',
      inputs: ['POST /v1/charges (Amount, Idempotency-Key, HoldToken)'],
      outputs: ['HTTP 200 Payment Authorized, Webhook payment.captured'],
      dependencies: ['Banking Acquiring Networks & Card Schemes'],
      techStack: 'Third-party Financial APIs, HMAC-SHA256 Signed Webhooks',
      latencySla: 'Human interactive checkout: 15s to 120s; API webhook < 3s',
      failureMode: 'Gateway timeout treated as AMBIGUOUS; background reconciliation polls payment status',
      citations: ['SRC-DIST-03']
    }
  },

  // 5. Asynchronous Messaging & Reconciliation
  {
    id: 'bms-outbox-worker',
    type: 'customNode',
    position: { x: 1400, y: 530 },
    data: {
      label: 'Transactional Outbox Worker',
      sublabel: 'Reliable Event Publisher (Debezium CDC)',
      tier: 'REFERENCE',
      category: 'compute',
      responsibility: 'Tails the PostgreSQL outbox table using Write-Ahead Log (WAL) logical replication. Guarantees At-Least-Once event delivery to Kafka without dual-write hazards.',
      inputs: ['PostgreSQL WAL replication stream'],
      outputs: ['Published messages to Kafka topics (booking.confirmed, hold.expired)'],
      dependencies: ['Transactional Database', 'Kafka Message Broker'],
      techStack: 'Debezium PostgreSQL Connector, Kafka Connect',
      latencySla: '< 100ms publication latency',
      failureMode: 'Worker crashes restart from last committed WAL LSN without message loss',
      citations: ['SRC-DIST-05']
    }
  },
  {
    id: 'bms-kafka',
    type: 'customNode',
    position: { x: 1040, y: 530 },
    data: {
      label: 'Partitioned Message Broker (Kafka)',
      sublabel: 'Event Stream Backbone',
      tier: 'REFERENCE',
      category: 'stream',
      responsibility: 'Distributes domain events partitioned by show_id. Guarantees strict chronological event ordering per showtime across downstream consumers.',
      inputs: ['Events from Outbox Worker and Saga Orchestrator'],
      outputs: ['Event streams consumed by Notifications, Cache Invalidation, and Analytics'],
      dependencies: ['Zookeeper / KRaft Consensus Cluster'],
      techStack: 'Apache Kafka / AWS Amazon MSK (Replication Factor = 3, min.insync.replicas = 2)',
      latencySla: '< 5ms publish-to-consume latency',
      failureMode: 'Broker partition failover via ISR; consumer groups recover from last committed offset',
      citations: ['SRC-BMS-CORP-01']
    }
  },
  {
    id: 'bms-notification',
    type: 'customNode',
    position: { x: 680, y: 640 },
    data: {
      label: 'Notification & Ticket Delivery Service',
      sublabel: 'Multi-Channel Dispatch Engine',
      tier: 'REFERENCE',
      category: 'compute',
      responsibility: 'Generates cryptographically signed QR code ticket PDFs and dispatches them via WhatsApp, SMS, Email, and Apple Wallet passes.',
      inputs: ['Kafka event: booking.confirmed'],
      outputs: ['WhatsApp messages, Push Notifications, SMTP / SMS API dispatches'],
      dependencies: ['Kafka Message Broker', 'Cloud Object Storage (S3)'],
      techStack: 'Node.js / Go, AWS SES, Twilio, WhatsApp Business API',
      latencySla: '< 5 seconds from payment commit to ticket delivery',
      failureMode: 'Retries with exponential backoff; dead-letter queue (DLQ) for invalid phone numbers',
      citations: ['SRC-BMS-CORP-01']
    }
  },
  {
    id: 'bms-reconciliation',
    type: 'customNode',
    position: { x: 1400, y: 160 },
    data: {
      label: 'Reconciliation & Expiry Worker',
      sublabel: 'Asynchronous State Auditor & Safety Net',
      tier: 'REFERENCE',
      category: 'compute',
      responsibility: 'Runs continuous background scans: purges expired holds abandoned by customers, queries payment gateway for stranded payment intents, and resolves split-brain edge cases.',
      inputs: ['Periodic cron triggers (every 10s)', 'Payment Gateway Query API'],
      outputs: ['Compensating release commands to Redis and PostgreSQL'],
      dependencies: ['Transactional Database', 'Payment Gateway', 'Ephemeral Lock'],
      techStack: 'Go Cron Daemon / Kubernetes CronJob',
      latencySla: 'Audits stranded holds within 30 seconds of TTL expiry',
      failureMode: 'Idempotent execution allows safe concurrent execution across multiple worker pods',
      citations: ['SRC-DIST-01', 'SRC-DIST-03']
    }
  }
];

export const BMS_EDGES: Edge[] = [
  // User -> Ingress
  {
    id: 'edge-client-gw',
    source: 'bms-client',
    target: 'bms-gateway',
    label: '1. Ingress & Hold Requests',
    animated: true,
    style: { stroke: '#F84464', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#F84464' }
  },

  // Read Path
  {
    id: 'edge-gw-catalog',
    source: 'bms-gateway',
    target: 'bms-catalog',
    label: 'Browse Metadata',
    style: { stroke: '#94A3B8', strokeWidth: 1.5 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#94A3B8' }
  },
  {
    id: 'edge-catalog-cache',
    source: 'bms-catalog',
    target: 'bms-read-cache',
    label: 'Read Seat Availability',
    style: { stroke: '#38BDF8', strokeWidth: 1.5 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#38BDF8' }
  },

  // Write Path (Hold Sequence)
  {
    id: 'edge-gw-orch',
    source: 'bms-gateway',
    target: 'bms-orchestrator',
    label: '2. Initiate Hold (Saga)',
    animated: true,
    style: { stroke: '#F84464', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#F84464' }
  },
  {
    id: 'edge-orch-lock',
    source: 'bms-orchestrator',
    target: 'bms-ephemeral-lock',
    label: '3. Atomic Lua CAS Lock (TTL=600s)',
    style: { stroke: '#F84464', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#F84464' }
  },
  {
    id: 'edge-lock-inv',
    source: 'bms-ephemeral-lock',
    target: 'bms-inventory-svc',
    label: '4. Fencing Token Issued',
    style: { stroke: '#10B981', strokeWidth: 1.5 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#10B981' }
  },
  {
    id: 'edge-inv-db',
    source: 'bms-inventory-svc',
    target: 'bms-transactional-db',
    label: '5. Persist Hold (Status=HELD)',
    style: { stroke: '#10B981', strokeWidth: 1.5 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#10B981' }
  },
  {
    id: 'edge-orch-vista',
    source: 'bms-orchestrator',
    target: 'bms-vista-pos',
    label: '6. HoldSeats (Remote Multiplex POS)',
    style: { stroke: '#F59E0B', strokeWidth: 1.5 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#F59E0B' }
  },

  // Payment Flow
  {
    id: 'edge-client-pg',
    source: 'bms-client',
    target: 'bms-payment-gw',
    label: '7. Payment Intent & OTP Submission',
    style: { stroke: '#A855F7', strokeWidth: 1.5 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#A855F7' }
  },
  {
    id: 'edge-pg-orch',
    source: 'bms-payment-gw',
    target: 'bms-orchestrator',
    label: '8. Webhook with Idempotency-Key',
    style: { stroke: '#A855F7', strokeWidth: 1.5 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#A855F7' }
  },
  {
    id: 'edge-orch-commit',
    source: 'bms-orchestrator',
    target: 'bms-transactional-db',
    label: '9. Commit ACID Booking',
    animated: true,
    style: { stroke: '#10B981', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#10B981' }
  },

  // Outbox & Async Notification Pipeline
  {
    id: 'edge-db-outbox',
    source: 'bms-transactional-db',
    target: 'bms-outbox-worker',
    label: '10. WAL CDC Stream',
    style: { stroke: '#94A3B8', strokeWidth: 1.5 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#94A3B8' }
  },
  {
    id: 'edge-outbox-kafka',
    source: 'bms-outbox-worker',
    target: 'bms-kafka',
    label: '11. Publish booking.confirmed',
    style: { stroke: '#38BDF8', strokeWidth: 1.5 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#38BDF8' }
  },
  {
    id: 'edge-kafka-notif',
    source: 'bms-kafka',
    target: 'bms-notification',
    label: '12. Dispatch Tickets',
    style: { stroke: '#38BDF8', strokeWidth: 1.5 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#38BDF8' }
  },
  {
    id: 'edge-kafka-cache',
    source: 'bms-kafka',
    target: 'bms-read-cache',
    label: 'Invalidate Seat Status',
    style: { stroke: '#A855F7', strokeWidth: 1.5, strokeDasharray: '4 4' },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#A855F7' }
  },

  // Reconciliation Safety Net
  {
    id: 'edge-rec-db',
    source: 'bms-reconciliation',
    target: 'bms-transactional-db',
    label: 'Audit Stranded Holds',
    style: { stroke: '#EF4444', strokeWidth: 1.5, strokeDasharray: '4 4' },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#EF4444' }
  },
  {
    id: 'edge-rec-lock',
    source: 'bms-reconciliation',
    target: 'bms-ephemeral-lock',
    label: 'Purge Expired Keys',
    style: { stroke: '#EF4444', strokeWidth: 1.5, strokeDasharray: '4 4' },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#EF4444' }
  }
];
