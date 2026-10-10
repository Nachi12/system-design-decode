export type EvidenceTier = 'DOCUMENTED' | 'INFERENCE' | 'REFERENCE' | 'ASSUMPTION';

export interface Citation {
  id: string;
  tier: EvidenceTier;
  title: string;
  authors: string;
  venue: string;
  year: number;
  url: string;
  summary: string;
  keyTakeaway: string;
  domain: 'netflix' | 'bookmyshow' | 'distributed-systems';
  sourceType?: string;
  supportedClaims?: string[];
  knownLimitations?: string;
}

export interface ArchitectureNodeData extends Record<string, unknown> {
  label: string;
  sublabel?: string;
  tier: EvidenceTier;
  category: 'client' | 'gateway' | 'compute' | 'stream' | 'cache' | 'storage' | 'external';
  responsibility: string;
  inputs: string[];
  outputs: string[];
  dependencies: string[];
  techStack: string;
  latencySla?: string;
  failureMode?: string;
  citations?: string[];
}

export interface TradeoffItem {
  id: string;
  dimension: string;
  netflixApproach: string;
  bookmyshowApproach: string;
  underlyingConstraint: string;
  consequence: string;
}

export interface GlossaryEntry {
  id: string;
  term: string;
  acronym?: string;
  definition: string;
  context: string;
  relatedTerms: string[];
  citationId?: string;
}

export interface CaseStudyMeta {
  id: string;
  title: string;
  kicker: string;
  tagline: string;
  description: string;
  accentColor: string;
  route: string;
  badgeText: string;
  coreChallenges: string[];
  keyArchitectures: string[];
  evidenceSummary: {
    documented: number;
    inference: number;
    reference: number;
  };
}
