import { Node, Edge } from '@xyflow/react';
import { ArchitectureNodeData } from '../types';

export const NETFLIX_REC_DIAGRAM_TITLE = "Netflix Recommendation & 2D Page Generation Topology";
export const NETFLIX_REC_DIAGRAM_EXPLANATION = 
  "A multi-tier architecture diagram illustrating how member profile context, real-time feedback signals, nearline stream pipelines, offline matrix embeddings, candidate generation, and diversity re-ranking assemble a personalized 2D homepage under a strict 100ms deadline.";

export const NETFLIX_REC_NODES: Node<ArchitectureNodeData>[] = [
  // 1. Client & Ingress Tier
  {
    id: 'rec-client',
    type: 'customNode',
    position: { x: 30, y: 160 },
    data: {
      label: 'Client Device & Profile Context',
      sublabel: 'Smart TV, Mobile, Web Client',
      tier: 'DOCUMENTED',
      category: 'client',
      responsibility: 'Captures member profile ID, device capabilities, network type, and locale; dispatches request to API gateway.',
      inputs: ['Remote control click', 'App launch', 'Profile switch'],
      outputs: ['GET /home/grid (ProfileID, DeviceContext)'],
      dependencies: ['API Edge Gateway (Zuul 2)'],
      techStack: 'React-Gibbon (TV), React Native, WebKit',
      latencySla: 'Client target: 16.6ms frame budget (60fps)',
      failureMode: 'Renders cached offline layout tree or local default rows upon network disconnection',
      citations: ['SRC-NFLX-CLIENT-01']
    }
  },
  {
    id: 'rec-gateway',
    type: 'customNode',
    position: { x: 340, y: 160 },
    data: {
      label: 'Zuul 2 API Edge Gateway',
      sublabel: 'Non-Blocking Netty Reverse Proxy',
      tier: 'DOCUMENTED',
      category: 'gateway',
      responsibility: 'Enforces mutual TLS, decodes member profile tokens, injects distributed tracing spans, and sets a 100ms request timeout budget.',
      inputs: ['Client HTTPS request'],
      outputs: ['Internal gRPC request to Page Assembler'],
      dependencies: ['Page Assembly Engine'],
      techStack: 'Zuul 2, Netty non-blocking I/O, Eureka service discovery',
      latencySla: '< 5ms edge gateway processing latency',
      failureMode: 'Load shedding, circuit breaking, degraded fallback headers',
      citations: ['SRC-NFLX-INFRA-01']
    }
  },

  // 2. Real-Time Interactions & Streaming
  {
    id: 'rec-event-collector',
    type: 'customNode',
    position: { x: 340, y: 380 },
    data: {
      label: 'Telemetry & Signal Ingress',
      sublabel: 'Keystone Event Pipeline',
      tier: 'DOCUMENTED',
      category: 'stream',
      responsibility: 'Captures viewing interaction telemetry: play starts, completion rates, skips, dwell time, and explicit thumbs up/down ratings.',
      inputs: ['Playback telemetry beacons', 'Impression logs'],
      outputs: ['Partitioned Kafka event topics'],
      dependencies: ['Nearline Stream Processing Engine'],
      techStack: 'Keystone Data Pipeline, Apache Kafka',
      latencySla: '< 200ms ingestion latency',
      failureMode: 'Client-side buffering and batch retry backoff',
      citations: ['SRC-NFLX-REC-02']
    }
  },
  {
    id: 'rec-nearline-stream',
    type: 'customNode',
    position: { x: 680, y: 380 },
    data: {
      label: 'Nearline Stream Computation',
      sublabel: 'Mantis / Apache Flink Engine',
      tier: 'DOCUMENTED',
      category: 'compute',
      responsibility: 'Processes streaming interaction events in seconds to minutes; updates recent viewing history vectors and warms EVCache candidate keys.',
      inputs: ['Partitioned Kafka viewing events'],
      outputs: ['Updated session vectors to EVCache'],
      dependencies: ['In-Memory State Cache (EVCache)'],
      techStack: 'Mantis Stream Processing, Apache Flink',
      latencySla: '5s – 30s event-to-feature computation',
      failureMode: 'Stream checkpoint replay, consumer group rebalancing',
      citations: ['SRC-NFLX-REC-02']
    }
  },

  // 3. Online Page Assembly & Ranking
  {
    id: 'rec-page-assembler',
    type: 'customNode',
    position: { x: 680, y: 80 },
    data: {
      label: 'Page Assembly Engine',
      sublabel: '2D Layout Orchestrator',
      tier: 'DOCUMENTED',
      category: 'compute',
      responsibility: 'Orchestrates the 2D layout: coordinates row generation, candidate scoring, diversity reranking, and dynamic artwork personalization.',
      inputs: ['Member Profile ID', 'Active Device Context'],
      outputs: ['Personalized 2D Homepage JSON tree'],
      dependencies: ['Candidate Generation Service', 'Online Scoring Engine', 'Diversity Reranker'],
      techStack: 'Java / Kotlin Microservice, gRPC',
      latencySla: '< 60ms end-to-end assembly budget',
      failureMode: 'Immediate fallback to pre-assembled cached rows upon 50ms SLA breach',
      citations: ['SRC-NFLX-REC-01', 'SRC-NFLX-REC-02']
    }
  },
  {
    id: 'rec-candidate-gen',
    type: 'customNode',
    position: { x: 1020, y: 40 },
    data: {
      label: 'Candidate Generation Service',
      sublabel: 'Multi-Algorithm Row Sourcing',
      tier: 'INFERENCE',
      category: 'compute',
      responsibility: 'Retrieves hundreds of candidate videos for thematic rows (Top Picks, Because You Watched X, Continue Watching) from millions of catalog titles.',
      inputs: ['Profile ID', 'Row concept definitions'],
      outputs: ['Unranked candidate video lists (50–100 items per row)'],
      dependencies: ['In-Memory State Cache', 'Offline Feature Store'],
      techStack: 'C++ / Java candidate retrieval index, FAISS / Annoy vector search',
      latencySla: '< 15ms p99 candidate retrieval',
      failureMode: 'Returns static popular candidates for unavailable algorithmic rows',
      citations: ['SRC-NFLX-REC-01']
    }
  },
  {
    id: 'rec-scoring-engine',
    type: 'customNode',
    position: { x: 1020, y: 190 },
    data: {
      label: 'Online Scoring & Ranking Engine',
      sublabel: 'Deep Neural Ranker & Bandits',
      tier: 'DOCUMENTED',
      category: 'compute',
      responsibility: 'Evaluates candidate videos within each row using real-time scoring models; computes personalized artwork variants via contextual bandits.',
      inputs: ['Candidate video IDs', 'Offline profile embeddings', 'Recent session context'],
      outputs: ['Scored item vectors and personalized thumbnail asset URLs'],
      dependencies: ['In-Memory State Cache'],
      techStack: 'TensorFlow / PyTorch C++ inference engine, ONNX Runtime',
      latencySla: '< 25ms p99 model inference budget',
      failureMode: 'Falls back to offline matrix factorization scores',
      citations: ['SRC-NFLX-REC-01', 'SRC-NFLX-REC-03']
    }
  },
  {
    id: 'rec-diversity-reranker',
    type: 'customNode',
    position: { x: 680, y: 230 },
    data: {
      label: 'Diversity & Freshness Re-Ranker',
      sublabel: 'Whole-Page Layout Optimizer',
      tier: 'DOCUMENTED',
      category: 'compute',
      responsibility: 'Applies whole-page optimization constraints: prevents genre clustering (e.g. 3 consecutive comedy rows), injects novel catalog titles, and enforces row diversity.',
      inputs: ['Scored rows from Page Assembler'],
      outputs: ['Re-ordered, balanced 2D row sequence'],
      dependencies: ['Page Assembly Engine'],
      techStack: 'Linear programming / Heuristic re-ranker rules',
      latencySla: '< 5ms optimization execution',
      failureMode: 'Passes through unconstrained raw ranked rows',
      citations: ['SRC-NFLX-REC-01']
    }
  },

  // 4. Persistence & Offline Machine Learning
  {
    id: 'rec-evcache',
    type: 'customNode',
    position: { x: 1020, y: 350 },
    data: {
      label: 'In-Memory State Cache (EVCache)',
      sublabel: 'Distributed Memcached / Redis Tier',
      tier: 'DOCUMENTED',
      category: 'cache',
      responsibility: 'Stores intermediate candidate vectors, recent user session state, and precomputed fallback homepage rows for sub-millisecond retrieval.',
      inputs: ['Nearline stream writes', 'Offline batch pipeline writes'],
      outputs: ['Cached profile vectors and candidate sets'],
      dependencies: ['Offline Batch Training Tier'],
      techStack: 'EVCache (Distributed Memcached on AWS EC2), Redis',
      latencySla: '< 2ms p99 read latency',
      failureMode: 'Multi-cluster replication across AWS availability zones',
      citations: ['SRC-NFLX-REC-02']
    }
  },
  {
    id: 'rec-offline-train',
    type: 'customNode',
    position: { x: 1360, y: 350 },
    data: {
      label: 'Offline Model Training Tier',
      sublabel: 'Spark & GPU Training Clusters',
      tier: 'DOCUMENTED',
      category: 'storage',
      responsibility: 'Trains deep neural recommendation models, matrix factorization embeddings, and contextual bandit exploration policies over petabytes of historical logs.',
      inputs: ['Historical viewing logs from S3 / Delta Lake'],
      outputs: ['Model weights, title embeddings, candidate precomputations'],
      dependencies: ['Analytical Data Lake (S3)'],
      techStack: 'Apache Spark, Ray, PyTorch GPU training clusters, Amazon S3',
      latencySla: 'Batch training cycles (hours to daily)',
      failureMode: 'Rolls back to previous stable model snapshot upon metric validation drop',
      citations: ['SRC-NFLX-REC-02', 'SRC-NFLX-REC-04']
    }
  }
];

export const NETFLIX_REC_EDGES: Edge[] = [
  { id: 're1', source: 'rec-client', target: 'rec-gateway', label: 'HTTPS / JSON', animated: true, style: { stroke: '#06B6D4', strokeWidth: 2 } },
  { id: 're2', source: 'rec-client', target: 'rec-event-collector', label: 'Telemetry Beacon', animated: true, style: { stroke: '#F59E0B', strokeWidth: 1.5 } },
  { id: 're3', source: 'rec-gateway', target: 'rec-page-assembler', label: 'gRPC Request (100ms SLA)', animated: true, style: { stroke: '#06B6D4', strokeWidth: 2 } },
  { id: 're4', source: 'rec-event-collector', target: 'rec-nearline-stream', label: 'Kafka Topics', animated: true, style: { stroke: '#F59E0B', strokeWidth: 1.5 } },
  { id: 're5', source: 'rec-nearline-stream', target: 'rec-evcache', label: 'Update Session Vectors', animated: true, style: { stroke: '#10B981', strokeWidth: 1.5 } },
  { id: 're6', source: 'rec-page-assembler', target: 'rec-candidate-gen', label: 'Fetch Candidates', style: { stroke: '#94A3B8', strokeWidth: 1.5 } },
  { id: 're7', source: 'rec-candidate-gen', target: 'rec-scoring-engine', label: 'Score Candidates', animated: true, style: { stroke: '#8B5CF6', strokeWidth: 2 } },
  { id: 're8', source: 'rec-scoring-engine', target: 'rec-diversity-reranker', label: 'Scored Rows & Thumbnails', animated: true, style: { stroke: '#8B5CF6', strokeWidth: 1.5 } },
  { id: 're9', source: 'rec-diversity-reranker', target: 'rec-page-assembler', label: 'Balanced Layout', style: { stroke: '#06B6D4', strokeWidth: 1.5 } },
  { id: 're10', source: 'rec-page-assembler', target: 'rec-evcache', label: 'Fallback Cache Check', style: { stroke: '#EF4444', strokeWidth: 1.5, strokeDasharray: '5,5' } },
  { id: 're11', source: 'rec-candidate-gen', target: 'rec-evcache', label: 'Query Cache Keys', style: { stroke: '#94A3B8', strokeWidth: 1.5 } },
  { id: 're12', source: 'rec-offline-train', target: 'rec-evcache', label: 'Batch Embedding Push', style: { stroke: '#64748B', strokeWidth: 1.5 } }
];
