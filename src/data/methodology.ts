import { EvidenceTier } from '../types';

export interface MethodologyTierInfo {
  tier: EvidenceTier;
  label: string;
  badgeClass: string;
  badgeColor: string;
  definition: string;
  acceptableSources: string[];
  exampleApplied: string;
}

export const METHODOLOGY_TIERS: MethodologyTierInfo[] = [
  {
    tier: 'DOCUMENTED',
    label: 'Publicly Documented',
    badgeClass: 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300',
    badgeColor: '#10B981',
    definition: 'Directly corroborated by primary first-party engineering publications, peer-reviewed academic research papers, patents, official technical portals, or verified conference slide decks by named corporate engineers.',
    acceptableSources: [
      'Official corporate engineering blogs (e.g. Netflix Technology Blog)',
      'Peer-reviewed papers (ACM RecSys, VLDB, IEEE, AI Magazine)',
      'Official documentation portals (e.g. openconnect.netflix.com)',
      'Verified conference presentations (AWS re:Invent, QCon, SREcon)'
    ],
    exampleApplied: 'Netflix three-tier computing architecture (Offline / Nearline / Online) and FreeBSD kernel zero-copy sendfile tuning.'
  },
  {
    tier: 'INFERENCE',
    label: 'Reasoned Inference',
    badgeClass: 'bg-amber-950/70 border-amber-500/40 text-amber-300',
    badgeColor: '#F59E0B',
    definition: 'Deductions synthesized from observable physical laws, distributed systems trade-offs (e.g. CAP theorem), publicly declared technologies, or client-side payload analysis where exact internal source code is proprietary.',
    acceptableSources: [
      'Mathematical latency bounds (speed of light round-trip constraints)',
      'Publicly acknowledged cloud dependencies (AWS, Databricks Delta Lake, Redis)',
      'Observable client-side HTTP schemas, headers, and countdown behavior'
    ],
    exampleApplied: 'BookMyShow in-memory caching and Redis distributed lock lifetime deduced from client checkout countdowns and AWS footprint.'
  },
  {
    tier: 'REFERENCE',
    label: 'Proposed Reference Design',
    badgeClass: 'bg-purple-950/70 border-purple-500/40 text-purple-300',
    badgeColor: '#8B5CF6',
    definition: 'An industrial-grade architecture engineered specifically for this research portfolio to resolve a classic distributed systems problem without falsely attributing it as a company proprietary internal implementation.',
    acceptableSources: [
      'Distributed systems foundational literature (Kleppmann, Gray & Reuter)',
      'Established high-concurrency patterns (Lua atomic CAS, Fencing tokens, Sagas)',
      'Third-party partner integration standards (Vista cinema POS protocols)'
    ],
    exampleApplied: 'The three-layer seat reservation engine with Saga orchestrator and external cinema POS synchronization.'
  },
  {
    tier: 'ASSUMPTION',
    label: 'Illustrative Assumption',
    badgeClass: 'bg-blue-950/70 border-blue-500/40 text-blue-300',
    badgeColor: '#3B82F6',
    definition: 'Quantitative capacity figures, traffic surge multipliers, payload sizes, and contention ratios modeled for architectural sizing and calculation notebooks, clearly separated from real corporate confidential metrics.',
    acceptableSources: [
      'Empirical sizing heuristics and typical production parameters',
      'Physical hardware boundaries (NVMe throughput, network NIC saturation)',
      'Scenario-based stress-test models (e.g. stadium concert flash-sale vs normal browsing)'
    ],
    exampleApplied: 'Capacity notebook inputs (e.g. 25M active streams at 4.5 Mbps, 50,000 hold attempts per second at t = 0).'
  }
];

export const METHODOLOGY_PRINCIPLES = [
  {
    title: 'Epistemological Integrity',
    description: 'Never invent traffic figures, internal microservice names, or proprietary APIs. If an internal implementation detail is not confirmed, label it as reasoned inference or present an explicit reference design.'
  },
  {
    title: 'Temporal Validity & Evolution',
    description: 'Architectures at hyperscale evolve continuously. Every claim reflects its publication timeframe, acknowledging historical context (e.g. batch matrix factorization transitioning to deep learning foundation models).'
  },
  {
    title: 'Failure Domain Analysis',
    description: 'Real architectures are defined by how they degrade under failure. Every system breakdown analyzes network partitions, timeout cascades, and circuit-breaker fallbacks alongside normal happy paths.'
  },
  {
    title: 'Editorial Engineering Aesthetics',
    description: 'Visual components serve to explain architecture, trace dataflows, and demonstrate trade-offs—not to provide superficial consumer mockups or simulated checkouts.'
  }
];
