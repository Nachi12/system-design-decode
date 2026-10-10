export interface AdrRecord {
  id: string;
  title: string;
  problem: string;
  options: string[];
  chosenApproach: string;
  rationale: string;
  drawbacks: string;
  evidenceStatus: 'DOCUMENTED' | 'INFERENCE' | 'REFERENCE';
  citationId?: string;
}

export const NETFLIX_ADRS: AdrRecord[] = [
  {
    id: 'ADR-NFLX-01',
    title: 'Three-Tier Computational Partitioning (Offline / Nearline / Online)',
    problem: 'How to calculate complex personalization embeddings over petabytes of viewing history without violating sub-100ms user-facing request latency SLAs.',
    options: [
      'Option A: Full online on-demand model inference per request (Computationally infeasible at scale; latency > 1000ms).',
      'Option B: Pure batch precomputation written to static databases (Stale within minutes; cannot reflect recent session interactions).',
      'Option C: Three-tier partitioning separating Offline batch matrix factorization, Nearline streaming event updates, and Online sub-100ms candidate assembly.'
    ],
    chosenApproach: 'Option C: Three-tier computational partitioning.',
    rationale: 'Decouples high-latency deep model training from strict user-facing deadlines. Enables real-time responsiveness to recent playback signals via nearline caches while maintaining rich global preference models computed offline.',
    drawbacks: 'Architectural complexity; potential divergence between offline model training features and online serving features (training-serving skew); cache synchronization overhead.',
    evidenceStatus: 'DOCUMENTED',
    citationId: 'SRC-NFLX-REC-02'
  },
  {
    id: 'ADR-NFLX-02',
    title: '2D Grid Layout Optimization vs. Monolithic 1D List Ranking',
    problem: 'How to structure catalog discovery across television and mobile screens where members navigate both horizontally and vertically.',
    options: [
      'Option A: Single monolithic 1D ranked list of titles (Poor discovery experience; cannot convey diverse thematic contexts).',
      'Option B: Hard-coded category rows with random video placement (Lacks individual relevance and adaptation).',
      'Option C: Two-dimensional grid formulation concurrently optimizing row candidate selection, video ranking within rows, and whole-page layout synthesis.'
    ],
    chosenApproach: 'Option C: Two-dimensional grid optimization.',
    rationale: 'Allows the system to balance relevance with catalog diversity and novel discovery. A user may reject the top recommendation but engage enthusiastically with a specific thematic row below it.',
    drawbacks: 'Requires two-stage scoring pipelines (row-level ranking and item-level ranking); complex diversity re-ranking to prevent genre clustering on the page.',
    evidenceStatus: 'DOCUMENTED',
    citationId: 'SRC-NFLX-REC-01'
  },
  {
    id: 'ADR-NFLX-03',
    title: 'Contextual Multi-Armed Bandits for Dynamic Artwork Personalization',
    problem: 'How to present title thumbnail imagery that maximizes click-to-play conversion for diverse member demographics without prolonged manual testing cycles.',
    options: [
      'Option A: Static default poster image chosen by creative studio designers (Ignores individual viewer preferences).',
      'Option B: Classical global A/B testing across all subscribers (Slow to converge; assigns suboptimal images to 50% of users during test duration).',
      'Option C: Contextual multi-armed bandit algorithms dynamically evaluating conversion payoffs per member segment while continually exploring new creative variants.'
    ],
    chosenApproach: 'Option C: Contextual multi-armed bandits.',
    rationale: 'Bandits minimize regret by shifting traffic to the winning artwork variant in real time per demographic segment, while maintaining controlled exploration to detect shifting consumer tastes.',
    drawbacks: 'Delayed feedback attribution (a user may view an impression but play hours later); cold-start latency for newly uploaded artwork candidates.',
    evidenceStatus: 'DOCUMENTED',
    citationId: 'SRC-NFLX-REC-03'
  },
  {
    id: 'ADR-NFLX-04',
    title: 'Purpose-Built Edge Appliance CDN (Open Connect) vs. Third-Party CDNs',
    problem: 'How to deliver tens of terabits per second of continuous high-bitrate video streaming globally without incurring crippling transit costs and ISP backbone congestion.',
    options: [
      'Option A: Commercial third-party CDNs (Akamai, Cloudflare, Fastly) exclusively (Extremely expensive at Netflix video scale; lack direct ISP co-location control).',
      'Option B: Centralized cloud origin egress from AWS (Technically impossible and cost-prohibitive for planetary multi-terabit video streaming).',
      'Option C: Custom Open Connect CDN deploying physical server appliances (OCAs) directly within ISP partner data centers and IXPs at zero cost to ISPs.'
    ],
    chosenApproach: 'Option C: Custom purpose-built Open Connect CDN.',
    rationale: 'Localizes >95% of video traffic inside the ISP edge network, eliminating transit bandwidth fees and delivering ultra-low-latency, buffer-free playback to subscribers.',
    drawbacks: 'Massive capital expenditure managing physical server hardware globally; complex logistical coordination with thousands of ISP partners worldwide.',
    evidenceStatus: 'DOCUMENTED',
    citationId: 'SRC-NFLX-CDN-01'
  },
  {
    id: 'ADR-NFLX-05',
    title: 'FreeBSD Kernel Zero-Copy sendfile() & kTLS vs. User-Space Web Servers',
    problem: 'How to maximize single-server video delivery throughput on 1RU hardware to exceed 100 Gbps per appliance.',
    options: [
      'Option A: Standard Linux/FreeBSD user-space NGINX reading into memory and calling OpenSSL (CPU bottlenecked by memory copying and user-space crypto; caps at ~30–40 Gbps).',
      'Option B: Proprietary hardware ASIC streaming appliances (Rigid, difficult to patch, high manufacturing cost).',
      'Option C: FreeBSD operating system running custom NGINX using zero-copy sendfile() and Kernel TLS (kTLS) to stream directly from NVMe disks to NICs.'
    ],
    chosenApproach: 'Option C: FreeBSD kernel zero-copy sendfile() with kTLS.',
    rationale: 'Bypasses user-space memory copies and offloads symmetric TLS cryptographic operations directly to kernel or smart NIC hardware, scaling single-appliance streaming to 100+ Gbps at line rate.',
    drawbacks: 'Requires deep operating system kernel engineering and custom OS builds; tightly coupled to specific FreeBSD kernel patches.',
    evidenceStatus: 'DOCUMENTED',
    citationId: 'SRC-NFLX-CDN-02'
  }
];
