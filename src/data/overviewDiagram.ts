import { Node, Edge } from '@xyflow/react';
import { ArchitectureNodeData } from '../types';

export const OVERVIEW_DIAGRAM_TITLE = "Planetary-Scale Distributed Architecture Archetype";
export const OVERVIEW_DIAGRAM_EXPLANATION = 
  "An illustrative architectural schematic showing how modern large-scale consumer platforms coordinate client edge requests, API ingress gateways, distributed core compute, asynchronous event streaming pipelines, tiered memory/storage stores, and external partner systems.";

export const INITIAL_OVERVIEW_NODES: Node<ArchitectureNodeData>[] = [
  // Tier 1: Clients & Edge
  {
    id: 'client-devices',
    type: 'customNode',
    position: { x: 40, y: 160 },
    data: {
      label: 'Heterogeneous Client Ecosystem',
      sublabel: 'Smart TVs, Mobile Apps, Browsers',
      tier: 'DOCUMENTED',
      category: 'client',
      responsibility: 'Renders personalized UI layouts, maintains ephemeral local state countdowns, and initiates secure TLS connections.',
      inputs: ['User interactions', 'Network telemetry', 'Session credentials'],
      outputs: ['HTTPS / gRPC requests', 'Client behavioral heartbeat events'],
      dependencies: ['API Edge Gateway', 'Distributed Edge CDN'],
      techStack: 'React-Gibbon (TV), React Native, Web Clients',
      latencySla: 'Client render: 16.6ms (60fps)',
      failureMode: 'Offline fallback mode, client-side stale layout caching, exponential backoff retry',
      citations: ['SRC-NFLX-CLIENT-01', 'SRC-BMS-CORP-01']
    }
  },

  // Tier 2: Ingress & Edge
  {
    id: 'gateway-api',
    type: 'customNode',
    position: { x: 340, y: 80 },
    data: {
      label: 'API Ingress Gateway',
      sublabel: 'Non-Blocking Edge Gateway',
      tier: 'DOCUMENTED',
      category: 'gateway',
      responsibility: 'Terminates TLS, validates JWT tokens, enforces token-bucket rate limits, routes to internal clusters, and injects tracing metadata.',
      inputs: ['Inbound client HTTPS/HTTP2 traffic'],
      outputs: ['Sanitized internal gRPC / RPC requests', 'Gateway access logs'],
      dependencies: ['Recommendation Engine', 'Reservation Coordinator', 'Identity Provider'],
      techStack: 'Netty / Zuul 2 / Envoy Proxy',
      latencySla: '< 5ms gateway routing overhead',
      failureMode: 'Load shedding, circuit breaking, degraded response headers',
      citations: ['SRC-NFLX-INFRA-01']
    }
  },
  {
    id: 'edge-cdn',
    type: 'customNode',
    position: { x: 340, y: 320 },
    data: {
      label: 'Distributed Edge Delivery',
      sublabel: 'Edge POPs & Embedded Appliances',
      tier: 'DOCUMENTED',
      category: 'cache',
      responsibility: 'Delivers static UI bundles, dynamic personalized artwork thumbnails, and high-bitrate media video segments from edge proximity.',
      inputs: ['BGP-steered video play requests', 'Static asset URLs'],
      outputs: ['Zero-copy media byte streams (sendfile)', 'Cache hit metrics'],
      dependencies: ['Core Storage Lake', 'DNS/BGP Control Plane'],
      techStack: 'FreeBSD, kTLS, NGINX, NVMe Solid-State Storage',
      latencySla: '< 15ms time-to-first-byte (TTFB)',
      failureMode: 'Failover to upstream IXP peer or central cloud bucket',
      citations: ['SRC-NFLX-CDN-01', 'SRC-NFLX-CDN-02']
    }
  },

  // Tier 3: Compute & Microservices
  {
    id: 'service-recommendation',
    type: 'customNode',
    position: { x: 680, y: 40 },
    data: {
      label: 'Personalization & Ranking Engine',
      sublabel: 'Online Page Assembly Tier',
      tier: 'DOCUMENTED',
      category: 'compute',
      responsibility: 'Solves the 2D grid ranking problem in real-time: scores candidate items, selects rows, enforces diversity, and balances exploration.',
      inputs: ['Member Profile ID', 'Context (Device, Time)', 'Candidate video sets'],
      outputs: ['Personalized 2D Page JSON layout', 'Impression logging events'],
      dependencies: ['In-Memory Cache', 'Nearline Stream Processors'],
      techStack: 'Java / Kotlin RPC, TensorFlow / PyTorch C++ inference engine',
      latencySla: '< 50ms p99 execution budget',
      failureMode: 'Fallback to pre-generated nearline or popular offline rows',
      citations: ['SRC-NFLX-REC-01', 'SRC-NFLX-REC-02']
    }
  },
  {
    id: 'service-inventory',
    type: 'customNode',
    position: { x: 680, y: 220 },
    data: {
      label: 'High-Concurrency Reservation Engine',
      sublabel: 'Seat Lock & State Coordinator',
      tier: 'REFERENCE',
      category: 'compute',
      responsibility: 'Manages high-contention flash-sale inventory locks with atomic compare-and-swap scripts, bounding reservations to 10-minute TTLs.',
      inputs: ['Hold seat requests (ShowID, SeatIDs, UserID)'],
      outputs: ['Reservation tokens', 'Lock state updates'],
      dependencies: ['Distributed Redis Cluster', 'Saga Payment Coordinator'],
      techStack: 'Go / Rust microservice, Redis Lua CAS scripts',
      latencySla: '< 10ms lock acquisition',
      failureMode: 'Atomic lock rejection with 409 Conflict; waiting room redirection',
      citations: ['SRC-DIST-02']
    }
  },
  {
    id: 'service-saga',
    type: 'customNode',
    position: { x: 680, y: 420 },
    data: {
      label: 'Saga Payment Coordinator',
      sublabel: 'Distributed Transaction Manager',
      tier: 'REFERENCE',
      category: 'compute',
      responsibility: 'Coordinates two-phase checkout lifecycle across reservation, external payment gateways, and third-party cinema box offices with compensating rollback flows.',
      inputs: ['Checkout intents', 'Payment webhook notifications'],
      outputs: ['Final ticket confirmations', 'Compensating seat release calls'],
      dependencies: ['Transactional Database', 'External Payment Acquirer', 'Cinema POS'],
      techStack: 'Temporal / Cadence / Step Functions orchestrator',
      latencySla: 'Asynchronous event settlement (< 2000ms end-to-end)',
      failureMode: 'Automatic compensation rollback, releasing expired seat locks',
      citations: ['SRC-DIST-01', 'SRC-DIST-03']
    }
  },

  // Tier 4: Streaming & Data
  {
    id: 'stream-bus',
    type: 'customNode',
    position: { x: 1020, y: 60 },
    data: {
      label: 'Distributed Streaming Log',
      sublabel: 'Partitioned Event Pipeline',
      tier: 'DOCUMENTED',
      category: 'stream',
      responsibility: 'Ingests billions of impressions, play telemetry, and transaction events into partitioned, append-only distributed topics.',
      inputs: ['Client playback heartbeats', 'Impression logs', 'Checkout events'],
      outputs: ['Stream subscriptions for nearline consumers and lake storage'],
      dependencies: ['Kafka / Mantis / Keystone'],
      techStack: 'Apache Kafka / Apache Flink / Apache Pulsar',
      latencySla: '< 100ms publish-to-consume latency',
      failureMode: 'Producer-side local buffer spill, consumer group auto-rebalance',
      citations: ['SRC-NFLX-REC-02', 'SRC-BMS-CORP-01']
    }
  },
  {
    id: 'cache-redis',
    type: 'customNode',
    position: { x: 1020, y: 220 },
    data: {
      label: 'In-Memory State & Cache Tier',
      sublabel: 'Redis Cluster / EVCache',
      tier: 'INFERENCE',
      category: 'cache',
      responsibility: 'Maintains hot seat lock keys, user session contexts, and intermediate recommendation candidate caches with sub-millisecond retrieval.',
      inputs: ['Atomic Lua scripts', 'Cache GET/SET operations'],
      outputs: ['Active lock holders', 'Cached candidate vectors'],
      dependencies: ['Transactional Database'],
      techStack: 'Redis Cluster / EVCache (Memcached)',
      latencySla: '< 2ms p99 read/write',
      failureMode: 'Cluster sentinel failover; replica promotion; fencing token validation',
      citations: ['SRC-DIST-02']
    }
  },
  {
    id: 'db-transactional',
    type: 'customNode',
    position: { x: 1020, y: 390 },
    data: {
      label: 'Durable Transaction Ledger',
      sublabel: 'Primary System-of-Record',
      tier: 'REFERENCE',
      category: 'storage',
      responsibility: 'Stores confirmed ticket orders, financial ledgers, and inventory definitions under strict serializable/optimistic concurrency control.',
      inputs: ['Confirmed booking transactions', 'User billing records'],
      outputs: ['Immutable receipts', 'Audit log records'],
      dependencies: ['Analytical Data Lakehouse'],
      techStack: 'PostgreSQL / CockroachDB with WAL replication',
      latencySla: '< 15ms write confirmation',
      failureMode: 'Automated Multi-AZ replica failover, point-in-time recovery WAL',
      citations: ['SRC-DIST-01']
    }
  },

  // Tier 5: External Partners & Offline Lake
  {
    id: 'ext-pos',
    type: 'customNode',
    position: { x: 1360, y: 160 },
    data: {
      label: 'Multiplex Box Office POS',
      sublabel: 'Remote Cinema System',
      tier: 'DOCUMENTED',
      category: 'external',
      responsibility: 'External physical cinema box office management systems (e.g. Vista) holding ultimate physical auditorium seat authority.',
      inputs: ['Reserve/Commit seat API calls'],
      outputs: ['Box office reservation tokens', 'Seat layout blueprints'],
      dependencies: ['Saga Payment Coordinator'],
      techStack: 'Vista Connect API / Proprietary Multiplex Gateways',
      latencySla: 'External network latency: 300ms – 1200ms',
      failureMode: 'Circuit breaker trip; temporary show unavailability; seat release retry',
      citations: ['SRC-BMS-EXT-01']
    }
  },
  {
    id: 'ext-payment',
    type: 'customNode',
    position: { x: 1360, y: 330 },
    data: {
      label: 'Payment Gateway Acquirer',
      sublabel: 'Banking Switch & Webhooks',
      tier: 'DOCUMENTED',
      category: 'external',
      responsibility: 'Processes payment card, UPI, and digital wallet authorizations with idempotency key checks and asynchronous webhook callbacks.',
      inputs: ['Payment authorization tokens with Idempotency-Key'],
      outputs: ['Payment capture confirmation / failure webhooks'],
      dependencies: ['Saga Payment Coordinator'],
      techStack: 'Banking Switches / Card Networks (Visa/Mastercard)',
      latencySla: '1000ms – 4000ms external settlement',
      failureMode: 'Webhook retry backoff; reconciliation worker scan for stalled intents',
      citations: ['SRC-DIST-03']
    }
  },
  {
    id: 'store-datalake',
    type: 'customNode',
    position: { x: 1360, y: 500 },
    data: {
      label: 'Analytical Lakehouse & Training',
      sublabel: 'Delta Lake / S3 / Spark',
      tier: 'DOCUMENTED',
      category: 'storage',
      responsibility: 'Aggregates historical event logs for offline recommendation model training, business intelligence dashboards, and audit verification.',
      inputs: ['Stream event batches', 'Database CDC change streams'],
      outputs: ['Trained model embeddings', 'Business intelligence reports'],
      dependencies: ['Distributed Streaming Log'],
      techStack: 'Databricks Delta Lake, Apache Spark, Amazon S3',
      latencySla: 'Batch / micro-batch processing (minutes to hours)',
      failureMode: 'Reprocessable from immutable Kafka logs or raw S3 archives',
      citations: ['SRC-BMS-CORP-01', 'SRC-NFLX-REC-02']
    }
  }
];

export const INITIAL_OVERVIEW_EDGES: Edge[] = [
  // Client edges
  { id: 'e1', source: 'client-devices', target: 'gateway-api', label: 'HTTPS / API', animated: true, style: { stroke: '#06B6D4', strokeWidth: 2 } },
  { id: 'e2', source: 'client-devices', target: 'edge-cdn', label: 'Media & Artwork', animated: false, style: { stroke: '#8B5CF6', strokeWidth: 1.5 } },

  // Gateway routing
  { id: 'e3', source: 'gateway-api', target: 'service-recommendation', label: 'Route: Home / Browse', animated: true, style: { stroke: '#94A3B8', strokeWidth: 1.5 } },
  { id: 'e4', source: 'gateway-api', target: 'service-inventory', label: 'Route: Seat Selection', animated: true, style: { stroke: '#F59E0B', strokeWidth: 1.5 } },
  { id: 'e5', source: 'gateway-api', target: 'service-saga', label: 'Route: Checkout', animated: false, style: { stroke: '#94A3B8', strokeWidth: 1.5 } },

  // Recommendation service flows
  { id: 'e6', source: 'service-recommendation', target: 'cache-redis', label: 'Candidate Fetch', style: { stroke: '#94A3B8', strokeWidth: 1.5 } },
  { id: 'e7', source: 'service-recommendation', target: 'stream-bus', label: 'Log Impressions', animated: true, style: { stroke: '#06B6D4', strokeWidth: 1.5 } },

  // Inventory & Concurrency flows
  { id: 'e8', source: 'service-inventory', target: 'cache-redis', label: 'Atomic Lua CAS Lock', animated: true, style: { stroke: '#F59E0B', strokeWidth: 2 } },
  { id: 'e9', source: 'service-inventory', target: 'service-saga', label: 'Lock Token Hand-off', style: { stroke: '#94A3B8', strokeWidth: 1.5 } },

  // Saga flows
  { id: 'e10', source: 'service-saga', target: 'ext-payment', label: 'Authorize Charge', animated: true, style: { stroke: '#8B5CF6', strokeWidth: 1.5 } },
  { id: 'e11', source: 'service-saga', target: 'ext-pos', label: 'Commit Reservation', animated: false, style: { stroke: '#8B5CF6', strokeWidth: 1.5 } },
  { id: 'e12', source: 'service-saga', target: 'db-transactional', label: 'Commit Ledger Record', animated: false, style: { stroke: '#10B981', strokeWidth: 2 } },

  // Caching & Data flows
  { id: 'e13', source: 'stream-bus', target: 'store-datalake', label: 'Batch Lake Sync', style: { stroke: '#64748B', strokeWidth: 1.5 } },
  { id: 'e14', source: 'db-transactional', target: 'stream-bus', label: 'CDC Events', style: { stroke: '#64748B', strokeWidth: 1.5 } }
];
