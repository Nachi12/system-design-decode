import React, { useState } from 'react';
import { EvidenceBadge } from '../components/editorial/EvidenceBadge';
import { CalloutNote } from '../components/editorial/CalloutNote';
import { ArchitectureCanvas } from '../components/diagram/ArchitectureCanvas';
import { MermaidDiagram } from '../components/diagram/MermaidDiagram';
import { 
  NETFLIX_REC_DIAGRAM_TITLE,
  NETFLIX_REC_DIAGRAM_EXPLANATION,
  NETFLIX_REC_NODES,
  NETFLIX_REC_EDGES
} from '../data/netflixRecommendationDiagram';
import { 
  NETFLIX_CDN_DIAGRAM_TITLE,
  NETFLIX_CDN_DIAGRAM_EXPLANATION,
  NETFLIX_CDN_NODES,
  NETFLIX_CDN_EDGES
} from '../data/netflixCdnDiagram';
import { NETFLIX_ADRS } from '../data/netflixAdrData';
import { Link } from 'react-router-dom';
import { 
  Cpu, 
  HardDrive, 
  ArrowRight, 
  Activity, 
  Calculator, 
  Compass, 
  FileCode, 
  ShieldCheck, 
  Database, 
  ExternalLink, 
  Sliders 
} from 'lucide-react';

export const NetflixPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState('chapter-a');

  // Sequence Diagram 1: Opening the homepage
  const seqHomepageOpen = `
sequenceDiagram
    autonumber
    actor User as Member on TV Client
    participant GW as Zuul 2 Gateway (AWS)
    participant PageAssm as Page Assembly Engine
    participant Cache as EVCache (Redis / Memcached)
    participant Nearline as Nearline Stream (Flink)
    participant CandGen as Candidate Generation
    participant Ranker as Online Scoring Ranker
    participant ReRanker as Diversity Re-Ranker

    User->>GW: GET /home/grid (ProfileID, DeviceContext)
    GW->>PageAssm: Dispatches request (Deadline: 100ms)
    
    par Concurrent Fetch
        PageAssm->>Nearline: Query recent session interactions
        PageAssm->>CandGen: Generate row candidates (Top Picks, Trending)
    end
    
    CandGen->>Cache: Query cached candidate vectors
    Cache-->>CandGen: Return candidate IDs (50 per row)
    
    PageAssm->>Ranker: Score candidates with member embeddings
    Ranker-->>PageAssm: Return scored videos & artwork IDs
    
    PageAssm->>ReRanker: Re-order rows for diversity & novelty
    ReRanker-->>PageAssm: Final 2D Layout structure
    
    PageAssm-->>GW: Return 2D Layout JSON (120KB)
    GW-->>User: 200 OK (Rendered on React-Gibbon TV)
  `;

  // Sequence Diagram 2: Member providing new feedback
  const seqFeedback = `
sequenceDiagram
    autonumber
    actor User as Member on TV Client
    participant GW as API Gateway (Zuul 2)
    participant Keystone as Keystone Event Ingress
    participant Kafka as Partitioned Kafka Topics
    participant Flink as Mantis / Flink Stream Engine
    participant EVCache as In-Memory State Cache
    participant S3 as Analytical Data Lake (S3)

    User->>GW: POST /events/playback (Play 120s, ThumbsUp)
    GW->>Keystone: Buffer & stream event payload
    GW-->>User: 202 Accepted (Non-blocking)
    
    Keystone->>Kafka: Publish to viewing_signals topic
    
    par Stream vs Batch Sink
        Kafka->>Flink: Consume real-time event partition
        Kafka->>S3: Batch archiver writes raw event log
    end
    
    Flink->>Flink: Update profile session vector (decay old tastes)
    Flink->>EVCache: SET session_context:profile_981 (TTL 24h)
    Note over EVCache: Next homepage visit reflects feedback immediately!
  `;

  // Sequence Diagram 3: Dependency timeout and fallback
  const seqFallback = `
sequenceDiagram
    autonumber
    actor User as Member on TV Client
    participant GW as Zuul 2 Gateway
    participant PageAssm as Page Assembly Engine
    participant Ranker as Online Scoring Ranker (Deep Model)
    participant EVCache as Fallback Cache Tier
    participant StaticStore as Static Catalog S3

    User->>GW: GET /home/grid (Deadline: 100ms)
    GW->>PageAssm: Execute assembly (50ms internal budget)
    
    PageAssm->>Ranker: Score candidates (Timeout: 40ms)
    Note over Ranker: High server load / Model inference latency spike!
    
    alt Ranker Times Out (> 40ms)
        PageAssm->>PageAssm: Circuit breaker trips! Log timeout metric
        PageAssm->>EVCache: GET precomputed_offline_homepage:profile_id
        
        alt EVCache Hit
            EVCache-->>PageAssm: Return pre-computed offline rows
            PageAssm-->>GW: Return cached personalized rows (Degraded Mode)
        else EVCache Cold Miss
            PageAssm->>StaticStore: GET global_trending_backup_row
            StaticStore-->>PageAssm: Return static fallback rows
            PageAssm-->>GW: Return static fallback catalog
        end
    end
    
    GW-->>User: 200 OK (User sees fast screen, unaware of model failure)
  `;

  const chapters = [
    { id: 'chapter-a', title: 'A. Problem Definition' },
    { id: 'chapter-b', title: 'B. Requirements & Latency Budgets' },
    { id: 'chapter-c', title: 'C. HLD: Recommendation & Homepage' },
    { id: 'chapter-d', title: 'D. HLD: Content Delivery (Open Connect)' },
    { id: 'chapter-e', title: 'E. LLD: Proposed Recommendation Service' },
    { id: 'chapter-f', title: 'F. Sequence Diagrams & Fallbacks' },
    { id: 'chapter-g', title: 'G. Data Models & Scalability' },
    { id: 'chapter-h', title: 'H. Personalization Quality & Bandits' },
    { id: 'chapter-i', title: 'I. Reliability & Observability' },
    { id: 'chapter-j', title: 'J. Architecture Decision Records' },
    { id: 'capacity-estimation', title: 'Illustrative Capacity Modeling' },
    { id: 'references-section', title: 'Verified References' }
  ];

  return (
    <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 lg:gap-12 relative">
      {/* Sticky Table of Contents (Desktop Left Rail) */}
      <aside className="hidden lg:block w-64 shrink-0">
        <div className="sticky top-24 space-y-4 p-4 rounded-xl border border-canvas-border bg-canvas-surface/80 backdrop-blur-sm text-xs font-mono">
          <div className="flex items-center gap-2 border-b border-canvas-border pb-2 text-ink-light font-bold uppercase tracking-wider">
            <Compass className="w-4 h-4 text-accent-cyan" />
            <span>Chapter Index</span>
          </div>
          <nav className="space-y-1">
            {chapters.map((ch) => (
              <a
                key={ch.id}
                href={`#${ch.id}`}
                onClick={() => setActiveSection(ch.id)}
                className={`block px-2.5 py-1.5 rounded transition-colors truncate ${
                  activeSection === ch.id
                    ? 'bg-accent-violet/20 text-accent-cyan font-semibold border-l-2 border-accent-cyan'
                    : 'text-ink-muted hover:text-ink-light hover:bg-canvas-elevated'
                }`}
              >
                {ch.title}
              </a>
            ))}
          </nav>
          <div className="pt-3 border-t border-canvas-border text-[10px] text-ink-muted space-y-1">
            <div>Case Study: 01 of 02</div>
            <div className="text-emerald-400">● 100% Peer-Reviewed / Blog Verified</div>
          </div>
        </div>
      </aside>

      {/* Main Narrative Monograph Column */}
      <article className="flex-1 max-w-4xl space-y-16">
        {/* Monograph Header */}
        <header className="border-b border-canvas-border pb-8 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-xs uppercase tracking-wider text-accent-netflix font-semibold">
              CASE STUDY 01 // INDEPENDENT ENGINEERING RESEARCH
            </span>
            <EvidenceBadge tier="DOCUMENTED" size="sm" />
            <span className="font-mono text-xs text-ink-muted">• 25 min comprehensive read</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-ink-light tracking-tight leading-tight">
            Netflix: Personalization, Recommendations and Content Delivery
          </h1>

          <p className="text-base sm:text-xl text-ink-muted font-sans leading-relaxed">
            Investigating the architecture behind relevant recommendations and reliable streaming at scale.
          </p>

          <div className="p-3.5 rounded-lg bg-canvas-surface border border-canvas-border text-xs text-ink-muted flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Epistemological Transparency:</strong> This is an independent architectural monograph synthesized from public corporate publications, patents, and peer-reviewed literature. It does not represent or imply access to Netflix&apos;s proprietary internal source code.
            </p>
          </div>
        </header>

        {/* =========================================================================
            CHAPTER A: PROBLEM DEFINITION
        ========================================================================= */}
        <section id="chapter-a" className="space-y-4 scroll-mt-24">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-accent-cyan uppercase tracking-wider font-semibold">
              Chapter A
            </span>
            <span className="text-ink-muted">•</span>
            <span className="text-xs font-mono text-ink-muted">Discovery vs. Playback Separation</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink-light">
            Problem Definition: The Dual Challenge of Discovery and Playback
          </h2>

          <p className="text-ink-light/90 leading-relaxed text-sm sm:text-base">
            At planetary scale, a digital media streaming platform faces two fundamentally distinct technical problems that operate under opposing engineering constraints: <strong>Content Discovery</strong> and <strong>Content Playback</strong>.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-5 rounded-xl border border-canvas-border bg-canvas-surface space-y-2.5">
              <div className="flex items-center gap-2 font-mono text-xs text-accent-violet font-semibold uppercase">
                <Cpu className="w-4 h-4" /> 1. The Discovery Problem (Personalization)
              </div>
              <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
                A catalog of tens of thousands of video assets is meaningless if a member cannot find compelling content within 60 to 90 seconds. The platform must transform noisy viewing signals, search queries, and session contexts into an individual 2D layout that maximizes engagement while avoiding catalog fatigue.
              </p>
              <div className="text-[11px] font-mono text-accent-cyan pt-1">
                Constraint: Sub-100ms request SLA, high computational complexity, non-linear 2D layout.
              </div>
            </div>

            <div className="p-5 rounded-xl border border-canvas-border bg-canvas-surface space-y-2.5">
              <div className="flex items-center gap-2 font-mono text-xs text-accent-netflix font-semibold uppercase">
                <HardDrive className="w-4 h-4" /> 2. The Playback Problem (Delivery)
              </div>
              <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
                Once a member clicks &quot;Play&quot;, the system must stream multi-gigabyte video files at continuous bitrates (up to 25 Mbps for 4K HDR) with near-zero rebuffering across thousands of heterogeneous ISPs globally.
              </p>
              <div className="text-[11px] font-mono text-emerald-400 pt-1">
                Constraint: Multi-terabit aggregate bandwidth, ISP transit costs, zero-copy kernel streaming.
              </div>
            </div>
          </div>

          <CalloutNote type="evidence" title="Architectural Decoupling Verified">
            Public documentation confirms that Netflix physically decouples these two planes. The discovery control plane runs in AWS cloud regions; the media delivery plane runs exclusively on Open Connect Appliances (OCAs) deployed directly inside ISP server rooms.
          </CalloutNote>
        </section>

        {/* =========================================================================
            CHAPTER B: FUNCTIONAL & NON-FUNCTIONAL REQUIREMENTS
        ========================================================================= */}
        <section id="chapter-b" className="space-y-4 scroll-mt-24">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-accent-cyan uppercase tracking-wider font-semibold">
              Chapter B
            </span>
            <span className="text-ink-muted">•</span>
            <span className="text-xs font-mono text-ink-muted">Sourced vs. Proposed Design Goals</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink-light">
            Functional & Non-Functional Requirements
          </h2>

          <p className="text-ink-light/90 leading-relaxed text-sm sm:text-base">
            To evaluate system design rigorously, we delineate between requirements directly sourced from Netflix publications versus proposed operational design targets:
          </p>

          <div className="overflow-x-auto rounded-xl border border-canvas-border bg-canvas-surface shadow-md">
            <table className="w-full text-left text-xs leading-relaxed border-collapse">
              <thead>
                <tr className="border-b border-canvas-border bg-canvas-dark font-mono text-[11px] text-ink-muted uppercase">
                  <th className="py-3 px-4">Requirement Category</th>
                  <th className="py-3 px-4">Design Goal</th>
                  <th className="py-3 px-4">Evidentiary Status</th>
                  <th className="py-3 px-4">Source / Rationale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-canvas-border/60">
                <tr>
                  <td className="py-3 px-4 font-mono font-semibold text-ink-light">Homepage Latency Budget</td>
                  <td className="py-3 px-4 text-ink-light/90">Total edge request latency &lt; 100ms (p99); online ranking model execution &lt; 50ms.</td>
                  <td className="py-3 px-4"><EvidenceBadge tier="DOCUMENTED" size="sm" /></td>
                  <td className="py-3 px-4 text-ink-muted">Amatriain &amp; Basilico (2013)</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-mono font-semibold text-ink-light">2D Catalog Layout</td>
                  <td className="py-3 px-4 text-ink-light/90">Simultaneously rank row themes and video items within each row with catalog diversity.</td>
                  <td className="py-3 px-4"><EvidenceBadge tier="DOCUMENTED" size="sm" /></td>
                  <td className="py-3 px-4 text-ink-muted">Basilico &amp; Alvino (2015)</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-mono font-semibold text-ink-light">Artwork Personalization</td>
                  <td className="py-3 px-4 text-ink-light/90">Dynamically select personalized thumbnails per member segment via contextual bandits.</td>
                  <td className="py-3 px-4"><EvidenceBadge tier="DOCUMENTED" size="sm" /></td>
                  <td className="py-3 px-4 text-ink-muted">Chandrashekar et al. (2017)</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-mono font-semibold text-ink-light">Global Taste Pooling</td>
                  <td className="py-3 px-4 text-ink-light/90">Pool interactions globally to accelerate cold-start in new or small markets.</td>
                  <td className="py-3 px-4"><EvidenceBadge tier="DOCUMENTED" size="sm" /></td>
                  <td className="py-3 px-4 text-ink-muted">Gomez-Uribe (2016)</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-mono font-semibold text-ink-light">TV Client Memory Budget</td>
                  <td className="py-3 px-4 text-ink-light/90">&lt; 100 MB heap allocated on low-power ARM silicons; maintain 60fps scrolling.</td>
                  <td className="py-3 px-4"><EvidenceBadge tier="DOCUMENTED" size="sm" /></td>
                  <td className="py-3 px-4 text-ink-muted">React-Gibbon (2015, 2018)</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-mono font-semibold text-ink-light">OCA Delivery Throughput</td>
                  <td className="py-3 px-4 text-ink-light/90">100+ Gbps sustained line-rate delivery per 1RU server without user-space buffer copies.</td>
                  <td className="py-3 px-4"><EvidenceBadge tier="DOCUMENTED" size="sm" /></td>
                  <td className="py-3 px-4 text-ink-muted">Drew Long, Netflix CDN (2019)</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-mono font-semibold text-ink-light">Recommendation Freshness</td>
                  <td className="py-3 px-4 text-ink-light/90">Incorporate play start and pause signals into next homepage fetch within 30 seconds.</td>
                  <td className="py-3 px-4"><EvidenceBadge tier="INFERENCE" size="sm" /></td>
                  <td className="py-3 px-4 text-ink-muted">Deduced from Mantis nearline stream specs</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-mono font-semibold text-ink-light">Availability / Fallback SLA</td>
                  <td className="py-3 px-4 text-ink-light/90">99.99% homepage availability. If scoring fails, return cached offline rows gracefully.</td>
                  <td className="py-3 px-4"><EvidenceBadge tier="REFERENCE" size="sm" /></td>
                  <td className="py-3 px-4 text-ink-muted">Proposed architectural SLA target</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* =========================================================================
            CHAPTER C: HLD - RECOMMENDATION & HOMEPAGE GENERATION
        ========================================================================= */}
        <section id="chapter-c" className="space-y-4 scroll-mt-24">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-accent-cyan uppercase tracking-wider font-semibold">
              Chapter C
            </span>
            <span className="text-ink-muted">•</span>
            <span className="text-xs font-mono text-ink-muted">Interactive Architecture Canvas</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink-light">
            High-Level Design: Recommendation &amp; Homepage Generation
          </h2>

          <p className="text-ink-light/90 leading-relaxed text-sm sm:text-base">
            The interactive diagram below visualizes the conceptual components responsible for generating a personalized homepage. It deconstructs the three computational tiers (Offline, Nearline, Online) and shows the dataflows connecting member feedback signals to whole-page layout synthesis:
          </p>

          <ArchitectureCanvas
            title={NETFLIX_REC_DIAGRAM_TITLE}
            explanation={NETFLIX_REC_DIAGRAM_EXPLANATION}
            initialNodes={NETFLIX_REC_NODES}
            initialEdges={NETFLIX_REC_EDGES}
            height="h-[620px]"
          />

          <div className="space-y-3 pt-2 text-xs sm:text-sm text-ink-light/90 leading-relaxed">
            <h4 className="font-serif text-base font-bold text-ink-light">Core Conceptual Responsibilities:</h4>
            <ul className="space-y-2 list-disc list-inside text-ink-muted">
              <li><strong className="text-ink-light">Profile Context &amp; Ingress:</strong> The client presents member profile tokens and device capabilities. The gateway enforces a strict 100ms deadline.</li>
              <li><strong className="text-ink-light">Candidate Generation:</strong> Downsamples the vast catalog from thousands of titles to ~50 candidate items per thematic row.</li>
              <li><strong className="text-ink-light">Online Scoring &amp; Bandits:</strong> Scores candidates using real-time contextual models and assigns dynamic thumbnail artwork variants.</li>
              <li><strong className="text-ink-light">Diversity Re-Ranking:</strong> Ensures the vertical stack of rows balances popular hits, niche personal interests, and catalog novelties without repetitive genre clustering.</li>
              <li><strong className="text-ink-light">Nearline vs. Offline Synchronization:</strong> Offline models generate deep embeddings nightly; nearline stream processors incrementally update session contexts in seconds.</li>
            </ul>
          </div>
        </section>

        {/* =========================================================================
            CHAPTER D: HLD - CONTENT DELIVERY (OPEN CONNECT)
        ========================================================================= */}
        <section id="chapter-d" className="space-y-4 scroll-mt-24">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-accent-netflix uppercase tracking-wider font-semibold">
              Chapter D
            </span>
            <span className="text-ink-muted">•</span>
            <span className="text-xs font-mono text-ink-muted">Dedicated Content Delivery Topology</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink-light">
            High-Level Design: Open Connect Content Delivery
          </h2>

          <p className="text-ink-light/90 leading-relaxed text-sm sm:text-base">
            Content delivery operates on a separate, dedicated physical plane. AWS acts as the control plane for metadata and BGP steering; physical Open Connect Appliances (OCAs) embedded in ISPs deliver all video bytes at line rate:
          </p>

          <ArchitectureCanvas
            title={NETFLIX_CDN_DIAGRAM_TITLE}
            explanation={NETFLIX_CDN_DIAGRAM_EXPLANATION}
            initialNodes={NETFLIX_CDN_NODES}
            initialEdges={NETFLIX_CDN_EDGES}
            height="h-[580px]"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl border border-canvas-border bg-canvas-surface space-y-2">
              <span className="font-mono text-xs text-accent-cyan uppercase font-semibold block">
                FreeBSD Kernel Zero-Copy sendfile()
              </span>
              <p className="text-xs text-ink-muted leading-relaxed">
                Standard web servers copy data from disk into user-space buffers, then from user-space into kernel socket buffers. FreeBSD&apos;s zero-copy <code>sendfile()</code> streams data directly from NVMe disks to the network adapter (NIC), bypassing user memory completely.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-canvas-border bg-canvas-surface space-y-2">
              <span className="font-mono text-xs text-accent-violet uppercase font-semibold block">
                Proactive Off-Peak Overnight Replication
              </span>
              <p className="text-xs text-ink-muted leading-relaxed">
                Rather than fetching video chunks reactively upon first cache miss, Netflix pushes anticipated popular releases to edge OCAs during off-peak hours (2 AM – 6 AM local ISP time), shifting petabits of transit traffic away from prime-time peering links.
              </p>
            </div>
          </div>
        </section>

        {/* =========================================================================
            CHAPTER E: LLD - PROPOSED RECOMMENDATION SERVICE
        ========================================================================= */}
        <section id="chapter-e" className="space-y-4 scroll-mt-24">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-accent-cyan uppercase tracking-wider font-semibold">
              Chapter E
            </span>
            <span className="text-ink-muted">•</span>
            <span className="text-xs font-mono text-ink-muted">Proposed Reference LLD</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink-light flex items-center gap-2">
            <FileCode className="w-5 h-5 text-accent-cyan" />
            Low-Level Design: Proposed Recommendation Service
          </h2>

          <div className="p-3.5 rounded-lg bg-purple-950/20 border border-purple-500/30 text-xs text-purple-300">
            <strong>Explicit Boundary:</strong> This Low-Level Design (LLD) represents an engineered reference architecture created for this research publication to demonstrate clean responsibility boundaries, candidate generation, ranking, and diversity reranking. It does not claim to represent Netflix&apos;s internal proprietary source code.
          </div>

          <p className="text-ink-light/90 leading-relaxed text-sm sm:text-base">
            The reference module partitions responsibilities into clear TypeScript interface contracts with explicit failure handling:
          </p>

          <div className="rounded-xl border border-canvas-border bg-canvas-dark p-4 font-mono text-xs overflow-x-auto shadow-xl">
            <pre className="text-ink-light/90 leading-relaxed">{`// 1. Core Profile & Viewing Context
export interface ProfileContext {
  profileId: string;
  accountCountry: string;
  deviceType: 'TV_ARM_LOWMEM' | 'TV_HIGHMEM' | 'MOBILE' | 'WEB';
  recentInteractions: Array<{ videoId: string; interactionType: 'PLAY' | 'THUMBS_UP' | 'SKIP'; timestamp: number }>;
}

// 2. Candidate Generation Interface
export interface CandidateGenerator {
  generateCandidates(
    context: ProfileContext,
    rowTheme: string,
    limit: number
  ): Promise<string[]>; // Returns unranked VideoIDs
}

// 3. Recommendation Scoring & Artwork Ranking Interface
export interface ScoredCandidate {
  videoId: string;
  score: number;
  selectedArtworkUrl: string;
  banditExplorationArm?: string;
}

export interface RecommendationRanker {
  scoreCandidates(
    context: ProfileContext,
    candidates: string[],
    deadlineMs: number
  ): Promise<ScoredCandidate[]>;
}

// 4. Diversity Re-Ranking Responsibility
export interface DiversityReranker {
  rerankLayout(
    rows: Array<{ rowTitle: string; items: ScoredCandidate[] }>,
    maxConsecutiveGenreCount: number
  ): Array<{ rowTitle: string; items: ScoredCandidate[] }>;
}

// 5. Page Assembly & Response Model
export interface HomepageLayoutResponse {
  profileId: string;
  generationTimestamp: number;
  isDegradedFallback: boolean;
  rows: Array<{
    rowId: string;
    rowTitle: string;
    items: Array<{ videoId: string; artworkUrl: string; matchScore: number }>;
  }>;
}`}</pre>
          </div>

          <div className="space-y-2 pt-2 text-xs sm:text-sm text-ink-muted">
            <h4 className="font-mono text-xs text-ink-light uppercase font-semibold">
              Design Rationale for Interface Segregation:
            </h4>
            <p>
              By separating <code>CandidateGenerator</code> from <code>RecommendationRanker</code>, the system can parallelize candidate retrieval across disparate row sources (collaborative filtering, continue-watching, trending) before feeding candidates into an asynchronous scoring pipeline constrained by a strict timeout deadline.
            </p>
          </div>
        </section>

        {/* =========================================================================
            CHAPTER F: SEQUENCE DIAGRAMS
        ========================================================================= */}
        <section id="chapter-f" className="space-y-6 scroll-mt-24">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-accent-cyan uppercase tracking-wider font-semibold">
              Chapter F
            </span>
            <span className="text-ink-muted">•</span>
            <span className="text-xs font-mono text-ink-muted">Request Boundaries &amp; Fallbacks</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink-light">
            Sequence Diagrams: Member Flows &amp; Resiliency
          </h2>

          <p className="text-ink-light/90 leading-relaxed text-sm sm:text-base">
            These sequence flows illustrate operational decision points, asynchronous pipelines, and automated fallback behaviors:
          </p>

          {/* Sequence 1 */}
          <div className="space-y-2">
            <h3 className="font-serif text-lg font-bold text-ink-light">
              1. Member Opening the Homepage (Happy Path)
            </h3>
            <MermaidDiagram
              chart={seqHomepageOpen}
              title="Homepage Retrieval Lifecycle"
              explanation="Traces concurrent nearline feature retrieval, candidate sourcing, online model inference, diversity re-ranking, and TV layout delivery under 100ms."
            />
          </div>

          {/* Sequence 2 */}
          <div className="space-y-2 pt-4">
            <h3 className="font-serif text-lg font-bold text-ink-light">
              2. Asynchronous Member Interaction &amp; Signal Ingress
            </h3>
            <MermaidDiagram
              chart={seqFeedback}
              title="Interaction Telemetry to Nearline Cache Propagation"
              explanation="Illustrates how a client playback event is ingested via Keystone into Kafka, processed in seconds by Mantis/Flink, and updates the profile session vector in EVCache."
            />
          </div>

          {/* Sequence 3 */}
          <div className="space-y-2 pt-4">
            <h3 className="font-serif text-lg font-bold text-ink-light">
              3. Online Scoring Timeout &amp; Multi-Tier Fallback Degradation
            </h3>
            <MermaidDiagram
              chart={seqFallback}
              title="Circuit Breaker & Fallback Row Delivery"
              explanation="Demonstrates how latency spikes in online inference trigger circuit breakers, falling back first to pre-computed EVCache rows, and finally to static global trending rows."
            />
          </div>
        </section>

        {/* =========================================================================
            CHAPTER G: DATA & SCALABILITY
        ========================================================================= */}
        <section id="chapter-g" className="space-y-4 scroll-mt-24">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-accent-cyan uppercase tracking-wider font-semibold">
              Chapter G
            </span>
            <span className="text-ink-muted">•</span>
            <span className="text-xs font-mono text-ink-muted">Cache Topology &amp; Fan-Out</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink-light flex items-center gap-2">
            <Database className="w-5 h-5 text-accent-cyan" />
            Data Models &amp; Scalability Considerations
          </h2>

          <p className="text-ink-light/90 leading-relaxed text-sm sm:text-base">
            Managing personalization for hundreds of millions of active profiles requires navigating extreme trade-offs between precomputation and on-demand inference:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl border border-canvas-border bg-canvas-surface space-y-2">
              <span className="font-mono text-xs text-accent-cyan uppercase font-semibold block">
                Precomputation vs. On-Demand
              </span>
              <p className="text-xs text-ink-muted leading-relaxed">
                Precomputing whole pages for all 300M profiles nightly wastes massive compute on inactive members. Conversely, 100% on-demand scoring causes latency spikes. Netflix precomputes candidate embeddings offline and scores candidates dynamically online.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-canvas-border bg-canvas-surface space-y-2">
              <span className="font-mono text-xs text-amber-400 uppercase font-semibold block">
                Cache Invalidation &amp; TTLs
              </span>
              <p className="text-xs text-ink-muted leading-relaxed">
                Personalized layout cache keys use sliding TTLs (e.g. 12 hours) coupled with event-driven invalidation. When a member finishes a movie, nearline Flink workers publish a cache bust event for that profile&apos;s &quot;Continue Watching&quot; row.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-canvas-border bg-canvas-surface space-y-2">
              <span className="font-mono text-xs text-emerald-400 uppercase font-semibold block">
                Fan-Out &amp; Connection Pools
              </span>
              <p className="text-xs text-ink-muted leading-relaxed">
                To assemble a 40-row homepage, the Page Assembler fans out to multiple microservice clusters in parallel. Non-blocking Netty event loops prevent thread exhaustion when downstream dependencies experience latency variance.
              </p>
            </div>
          </div>
        </section>

        {/* =========================================================================
            CHAPTER H: PERSONALIZATION QUALITY & BANDITS
        ========================================================================= */}
        <section id="chapter-h" className="space-y-4 scroll-mt-24">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-accent-cyan uppercase tracking-wider font-semibold">
              Chapter H
            </span>
            <span className="text-ink-muted">•</span>
            <span className="text-xs font-mono text-ink-muted">Algorithmic Trade-Offs</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink-light">
            Personalization Quality, Exploration &amp; Contextual Bandits
          </h2>

          <p className="text-ink-light/90 leading-relaxed text-sm sm:text-base">
            High-quality personalization requires balancing conflicting algorithmic objectives:
          </p>

          <div className="space-y-3 pt-1">
            <div className="p-4 rounded-xl border border-canvas-border bg-canvas-surface space-y-2">
              <h4 className="font-serif text-base font-bold text-ink-light">
                1. The Exploration vs. Exploitation Dilemma
              </h4>
              <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
                If the model only exploits known user preferences (e.g., repeatedly showing 90s action thrillers), the member enters an echo chamber and fails to discover new original series. Netflix reserves a controlled fraction of recommendations for exploration, testing new releases and adjacent genres.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-canvas-border bg-canvas-surface space-y-2">
              <h4 className="font-serif text-base font-bold text-ink-light">
                2. Contextual Multi-Armed Bandits for Dynamic Artwork
              </h4>
              <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
                As detailed in Chandrashekar et al. (2017), the choice of image thumbnail heavily influences whether a title is clicked. The bandit observes user viewing context (e.g., romance fan vs. comedy fan) and selects the image most likely to convert for that specific archetype, dynamically learning winning creative variants across global sub-populations.
              </p>
            </div>
          </div>
        </section>

        {/* =========================================================================
            CHAPTER I: RELIABILITY & OBSERVABILITY
        ========================================================================= */}
        <section id="chapter-i" className="space-y-4 scroll-mt-24">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-accent-cyan uppercase tracking-wider font-semibold">
              Chapter I
            </span>
            <span className="text-ink-muted">•</span>
            <span className="text-xs font-mono text-ink-muted">Operational Resilience</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink-light flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            Reliability, Circuit Breakers &amp; Model Observability
          </h2>

          <p className="text-ink-light/90 leading-relaxed text-sm sm:text-base">
            In hyper-scale recommendation systems, partial failure is an ordinary operational state rather than an exception:
          </p>

          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
            <li className="p-4 rounded-lg bg-canvas-surface border border-canvas-border space-y-1">
              <span className="font-mono text-xs text-accent-cyan font-semibold block">
                Strict Timeouts &amp; Circuit Breaking
              </span>
              <span className="text-ink-muted leading-relaxed">
                Every RPC call to recommendation scoring clusters carries a hard deadline. If latency exceeds 40ms, Hystrix-style circuit breakers trip immediately, redirecting traffic to precomputed EVCache fallback rows to preserve the 100ms user deadline.
              </span>
            </li>
            <li className="p-4 rounded-lg bg-canvas-surface border border-canvas-border space-y-1">
              <span className="font-mono text-xs text-accent-cyan font-semibold block">
                Training-Serving Skew Detection
              </span>
              <span className="text-ink-muted leading-relaxed">
                Continuous telemetry compares offline model training features against real-time features logged at inference time, detecting distribution drift before model quality degrades.
              </span>
            </li>
            <li className="p-4 rounded-lg bg-canvas-surface border border-canvas-border space-y-1">
              <span className="font-mono text-xs text-accent-cyan font-semibold block">
                Degraded Mode Flags
              </span>
              <span className="text-ink-muted leading-relaxed">
                Responses delivered under fallback conditions include metadata flags (<code>isDegradedFallback: true</code>), enabling engineering telemetry to track degraded session rates globally.
              </span>
            </li>
            <li className="p-4 rounded-lg bg-canvas-surface border border-canvas-border space-y-1">
              <span className="font-mono text-xs text-accent-cyan font-semibold block">
                Chaos Engineering (Chaos Kong / Monkey)
              </span>
              <span className="text-ink-muted leading-relaxed">
                Production clusters regularly undergo simulated AWS availability zone and region evacuations to guarantee zero subscriber disruption during cloud infrastructure outages.
              </span>
            </li>
          </ul>
        </section>

        {/* =========================================================================
            CHAPTER J: ARCHITECTURE DECISION RECORDS (ADRs)
        ========================================================================= */}
        <section id="chapter-j" className="space-y-6 scroll-mt-24">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-accent-cyan uppercase tracking-wider font-semibold">
              Chapter J
            </span>
            <span className="text-ink-muted">•</span>
            <span className="text-xs font-mono text-ink-muted">Historical &amp; Reference Decisions</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink-light flex items-center gap-2">
            <Sliders className="w-5 h-5 text-accent-violet" />
            Architecture Decision Records (ADRs)
          </h2>

          <p className="text-ink-light/90 leading-relaxed text-sm sm:text-base">
            These five Architecture Decision Records document the core structural trade-offs governing Netflix&apos;s recommendation and content delivery planes:
          </p>

          <div className="space-y-5">
            {NETFLIX_ADRS.map((adr) => (
              <div
                key={adr.id}
                className="p-5 rounded-xl border border-canvas-border bg-canvas-surface space-y-3 shadow-lg"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-canvas-borderSubtle pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-accent-cyan">
                      [{adr.id}]
                    </span>
                    <h3 className="font-serif text-base font-bold text-ink-light">
                      {adr.title}
                    </h3>
                  </div>
                  <EvidenceBadge tier={adr.evidenceStatus} size="sm" />
                </div>

                <div className="space-y-2 text-xs leading-relaxed">
                  <div>
                    <span className="font-mono uppercase text-[10px] text-ink-muted font-semibold block">
                      Architectural Problem:
                    </span>
                    <p className="text-ink-light/90">{adr.problem}</p>
                  </div>

                  <div>
                    <span className="font-mono uppercase text-[10px] text-ink-muted font-semibold block">
                      Options Considered:
                    </span>
                    <ul className="space-y-1 text-ink-muted list-disc list-inside">
                      {adr.options.map((opt, idx) => (
                        <li key={idx}>{opt}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 rounded-lg bg-canvas-dark border border-canvas-borderSubtle space-y-1">
                    <span className="font-mono text-[10px] uppercase text-emerald-400 font-semibold block">
                      Chosen Approach &amp; Rationale:
                    </span>
                    <p className="text-ink-light/90 font-medium">{adr.chosenApproach}</p>
                    <p className="text-ink-muted text-[11px]">{adr.rationale}</p>
                  </div>

                  <div>
                    <span className="font-mono uppercase text-[10px] text-rose-400 font-semibold block">
                      Recognized Drawbacks:
                    </span>
                    <p className="text-ink-muted">{adr.drawbacks}</p>
                  </div>

                  {adr.citationId && (
                    <div className="pt-1">
                      <Link
                        to={`/references?highlight=${adr.citationId}`}
                        className="font-mono text-[11px] text-accent-cyan hover:underline inline-flex items-center gap-1"
                      >
                        <span>Evidence Citation: [{adr.citationId}]</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* =========================================================================
            CAPACITY & PERFORMANCE ESTIMATES
        ========================================================================= */}
        <section id="capacity-estimation" className="space-y-4 scroll-mt-24 border-t border-canvas-border pt-8">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-accent-cyan uppercase tracking-wider font-semibold">
              Quantitative Modeling
            </span>
            <span className="text-ink-muted">•</span>
            <span className="text-xs font-mono text-ink-muted">Transparent Estimations</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink-light flex items-center gap-2">
            <Calculator className="w-5 h-5 text-accent-cyan" />
            Illustrative Capacity &amp; Performance Sizing
          </h2>

          <div className="p-3.5 rounded-lg bg-canvas-surface border border-canvas-border text-xs text-ink-muted">
            <strong>Methodology Note:</strong> These capacity models show mathematical formulas and derived requirements based on transparent illustrative baseline inputs. They do not represent confidential internal corporate telemetry.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Calculation 1 */}
            <div className="p-5 rounded-xl border border-canvas-border bg-canvas-surface space-y-3 font-mono text-xs">
              <span className="text-accent-cyan font-bold uppercase tracking-wider block">
                Model 1: Peak Browse QPS &amp; Ingress Bandwidth
              </span>
              <div className="space-y-1.5 text-ink-muted">
                <div>Active Global Profiles: <span className="text-ink-light">300,000,000</span></div>
                <div>Concurrent Peak Sessions (10%): <span className="text-ink-light">30,000,000</span></div>
                <div>Active Browsing Ratio (20%): <span className="text-ink-light">6,000,000 browsing</span></div>
                <div>Browse Request Cadence: <span className="text-ink-light">1 request / 60 sec</span></div>
              </div>
              <div className="p-3 rounded-lg bg-canvas-dark border border-canvas-borderSubtle text-ink-light space-y-1">
                <div className="text-[11px] text-accent-cyan">Formula: QPS = (Concurrent * Ratio) / Period</div>
                <div className="text-sm font-bold text-emerald-400">Peak Homepage QPS = 100,000 QPS</div>
                <div className="text-[11px] text-ink-muted">Payload: 24 KB compressed * 8 bits = 19.2 Gbps global JSON ingress</div>
              </div>
            </div>

            {/* Calculation 2 */}
            <div className="p-5 rounded-xl border border-canvas-border bg-canvas-surface space-y-3 font-mono text-xs">
              <span className="text-accent-netflix font-bold uppercase tracking-wider block">
                Model 2: Peak Streaming Bandwidth &amp; OCA Count
              </span>
              <div className="space-y-1.5 text-ink-muted">
                <div>Concurrent Active Video Streams: <span className="text-ink-light">25,000,000</span></div>
                <div>Weighted Average Bitrate: <span className="text-ink-light">4.5 Mbps (SD, HD, 4K)</span></div>
                <div>Total Peak Delivery Bandwidth: <span className="text-ink-light">25M * 4.5 Mbps = 112.5 Tbps</span></div>
                <div>Throughput per Flash OCA: <span className="text-ink-light">100 Gbps (0.1 Tbps)</span></div>
              </div>
              <div className="p-3 rounded-lg bg-canvas-dark border border-canvas-borderSubtle text-ink-light space-y-1">
                <div className="text-[11px] text-accent-netflix">Formula: OCAs = Peak Bandwidth / OCA Line Rate</div>
                <div className="text-sm font-bold text-accent-netflix">Min. Edge Appliances = ~1,125 Flash OCAs</div>
                <div className="text-[11px] text-ink-muted">Assuming 95% edge cache hit ratio localizing traffic to ISP partner rooms</div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            REFERENCES SECTION
        ========================================================================= */}
        <section id="references-section" className="space-y-4 scroll-mt-24 border-t border-canvas-border pt-8">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-accent-cyan uppercase tracking-wider font-semibold">
              Bibliography
            </span>
            <span className="text-ink-muted">•</span>
            <span className="text-xs font-mono text-ink-muted">Verified Citations</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink-light">
            Verified Primary Sources &amp; Citations
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
            <a
              href="https://netflixtechblog.com/learning-a-personalized-homepage-aa8ec670359a"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-lg bg-canvas-surface border border-canvas-border hover:border-accent-cyan/50 text-ink-light transition-colors flex items-center justify-between"
            >
              <span>[SRC-NFLX-REC-01] Learning a Personalized Homepage (2015)</span>
              <ExternalLink className="w-3.5 h-3.5 text-accent-cyan shrink-0" />
            </a>
            <a
              href="https://netflixtechblog.com/system-architectures-for-personalization-and-recommendation-e081aa94b5d8"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-lg bg-canvas-surface border border-canvas-border hover:border-accent-cyan/50 text-ink-light transition-colors flex items-center justify-between"
            >
              <span>[SRC-NFLX-REC-02] System Architectures for RecSys (2013)</span>
              <ExternalLink className="w-3.5 h-3.5 text-accent-cyan shrink-0" />
            </a>
            <a
              href="https://about.netflix.com/en/news/a-global-approach-to-recommendations"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-lg bg-canvas-surface border border-canvas-border hover:border-accent-cyan/50 text-ink-light transition-colors flex items-center justify-between"
            >
              <span>[REF-NFLX-03] A Global Approach to RecSys (2016)</span>
              <ExternalLink className="w-3.5 h-3.5 text-accent-cyan shrink-0" />
            </a>
            <a
              href="https://netflixtechblog.com/artwork-personalization-c589f074ad76"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-lg bg-canvas-surface border border-canvas-border hover:border-accent-cyan/50 text-ink-light transition-colors flex items-center justify-between"
            >
              <span>[SRC-NFLX-REC-03] Artwork Personalization at Netflix (2017)</span>
              <ExternalLink className="w-3.5 h-3.5 text-accent-cyan shrink-0" />
            </a>
            <a
              href="https://openconnect.netflix.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-lg bg-canvas-surface border border-canvas-border hover:border-accent-cyan/50 text-ink-light transition-colors flex items-center justify-between"
            >
              <span>[SRC-NFLX-CDN-01] Open Connect Deployment Guide</span>
              <ExternalLink className="w-3.5 h-3.5 text-accent-cyan shrink-0" />
            </a>
            <a
              href="https://netflixtechblog.com/serving-100-gbps-from-an-open-connect-appliance-cdb51dda3b99"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-lg bg-canvas-surface border border-canvas-border hover:border-accent-cyan/50 text-ink-light transition-colors flex items-center justify-between"
            >
              <span>[SRC-NFLX-CDN-02] Serving 100 Gbps from an OCA (2019)</span>
              <ExternalLink className="w-3.5 h-3.5 text-accent-cyan shrink-0" />
            </a>
          </div>
        </section>

        {/* Navigation Footer */}
        <div className="pt-8 border-t border-canvas-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link
            to="/"
            className="text-xs font-mono text-ink-muted hover:text-ink-light transition-colors"
          >
            ← Return to Portfolio Overview
          </Link>
          <Link
            to="/bookmyshow"
            className="px-5 py-2.5 rounded-lg bg-canvas-surface hover:bg-canvas-elevated border border-canvas-border text-ink-light text-xs sm:text-sm font-sans font-medium flex items-center gap-2 transition-all shadow-md"
          >
            <span>Proceed to Case Study 2: BookMyShow Concurrency</span>
            <ArrowRight className="w-4 h-4 text-accent-bms" />
          </Link>
        </div>
      </article>
    </div>
  );
};
