import React from 'react';
import { Link } from 'react-router-dom';
import { ArchitectureCanvas } from '../components/diagram/ArchitectureCanvas';
import { 
  OVERVIEW_DIAGRAM_TITLE, 
  OVERVIEW_DIAGRAM_EXPLANATION, 
  INITIAL_OVERVIEW_NODES, 
  INITIAL_OVERVIEW_EDGES 
} from '../data/overviewDiagram';
import { CASE_STUDIES } from '../data/caseStudies';
import { ArrowRight, ShieldCheck, Cpu, HardDrive } from 'lucide-react';
import { EvidenceBadge } from '../components/editorial/EvidenceBadge';

export const OverviewPage: React.FC = () => {
  const netflixStudy = CASE_STUDIES.find(c => c.id === 'netflix')!;
  const bmsStudy = CASE_STUDIES.find(c => c.id === 'bookmyshow')!;

  return (
    <div className="space-y-16 lg:space-y-24">
      {/* 1. Hero Section */}
      <section className="pt-6 sm:pt-10 lg:pt-14 border-b border-canvas-border pb-12 sm:pb-16">
        <div className="max-w-4xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-canvas-border bg-canvas-surface text-ink-muted text-[11px] sm:text-xs font-mono max-w-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="truncate">Independent Systems Architecture Research Portfolio</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-ink-light leading-[1.12]">
            Decoding the architecture behind systems at scale.
          </h1>

          <p className="text-base sm:text-lg lg:text-xl text-ink-muted leading-relaxed font-sans max-w-3xl">
            An independent research portfolio exploring how large-scale digital platforms personalize experiences, coordinate distributed services and remain reliable under demanding workloads.
          </p>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 pt-2">
            <a
              href="#architecture-schematic"
              className="px-4 sm:px-5 py-2.5 rounded-lg bg-accent-violet hover:bg-accent-violetDim text-white font-medium text-xs sm:text-sm font-sans flex items-center justify-center gap-2 shadow-lg shadow-accent-violet/20 transition-all duration-150 w-full sm:w-auto"
            >
              <span>Explore Interactive Architecture Canvas</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </a>
            <Link
              to="/methodology"
              className="px-4 sm:px-5 py-2.5 rounded-lg border border-canvas-border bg-canvas-surface hover:bg-canvas-elevated text-ink-light font-medium text-xs sm:text-sm font-sans flex items-center justify-center gap-2 transition-all duration-150 w-full sm:w-auto"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>4-Tier Research Methodology</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Two Prominent Research Entry Points */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-canvas-border pb-4">
          <div>
            <span className="font-mono text-xs uppercase tracking-wider text-accent-cyan font-semibold">
              Primary Research Portals
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink-light mt-1">
              Deep-Dive Case Studies
            </h2>
          </div>
          <p className="text-xs text-ink-muted font-mono">
            Empirical evidence • Verified citations • No toy CRUD
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Netflix Card */}
          <div className="group rounded-xl border border-canvas-border hover:border-accent-netflix/50 bg-canvas-surface p-6 sm:p-8 flex flex-col justify-between transition-all duration-200 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent-netflix/5 rounded-full blur-2xl pointer-events-none" />
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="font-mono text-xs font-semibold text-accent-netflix tracking-wider uppercase">
                  {netflixStudy.kicker}
                </span>
                <EvidenceBadge tier="DOCUMENTED" size="sm" />
              </div>

              <h3 className="font-serif text-xl sm:text-2xl font-bold text-ink-light group-hover:text-accent-netflix transition-colors">
                {netflixStudy.title}
              </h3>

              <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
                {netflixStudy.description}
              </p>

              <div className="space-y-2 pt-2 border-t border-canvas-borderSubtle">
                <span className="font-mono text-[11px] text-ink-light uppercase tracking-wider font-semibold block">
                  Core Engineering Inquiries:
                </span>
                <ul className="space-y-1.5 text-xs text-ink-muted">
                  {netflixStudy.coreChallenges.slice(0, 3).map((ch, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-accent-netflix font-mono">0{idx + 1}.</span>
                      <span>{ch}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-canvas-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="font-mono text-[11px] text-ink-muted">
                3 Tiers • OCAs • Bandits
              </span>
              <Link
                to="/netflix"
                className="inline-flex items-center gap-1.5 font-sans font-semibold text-xs sm:text-sm text-ink-light group-hover:text-accent-netflix transition-colors"
              >
                <span>Read Netflix Monograph</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* BookMyShow Card */}
          <div className="group rounded-xl border border-canvas-border hover:border-accent-bms/50 bg-canvas-surface p-6 sm:p-8 flex flex-col justify-between transition-all duration-200 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent-bms/5 rounded-full blur-2xl pointer-events-none" />
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="font-mono text-xs font-semibold text-accent-bms tracking-wider uppercase">
                  {bmsStudy.kicker}
                </span>
                <EvidenceBadge tier="REFERENCE" size="sm" />
              </div>

              <h3 className="font-serif text-xl sm:text-2xl font-bold text-ink-light group-hover:text-accent-bms transition-colors">
                {bmsStudy.title}
              </h3>

              <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
                {bmsStudy.description}
              </p>

              <div className="space-y-2 pt-2 border-t border-canvas-borderSubtle">
                <span className="font-mono text-[11px] text-ink-light uppercase tracking-wider font-semibold block">
                  Core Engineering Inquiries:
                </span>
                <ul className="space-y-1.5 text-xs text-ink-muted">
                  {bmsStudy.coreChallenges.slice(0, 3).map((ch, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-accent-bms font-mono">0{idx + 1}.</span>
                      <span>{ch}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-canvas-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="font-mono text-[11px] text-ink-muted">
                Redis CAS • Fencing • Sagas
              </span>
              <Link
                to="/bookmyshow"
                className="inline-flex items-center gap-1.5 font-sans font-semibold text-xs sm:text-sm text-ink-light group-hover:text-accent-bms transition-colors"
              >
                <span>Read BookMyShow Monograph</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Large Interactive Custom Architecture Illustration */}
      <section id="architecture-schematic" className="space-y-4 pt-4">
        <div className="space-y-1">
          <span className="font-mono text-xs uppercase tracking-wider text-accent-cyan font-semibold">
            Interactive Systems Topology
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink-light">
            Architectural Archetype: Edge to Persistence
          </h2>
          <p className="text-sm text-ink-muted max-w-3xl">
            This high-level schematic illustrates the structural boundaries common to modern hyper-scale consumer systems: client heterogeneities, non-blocking edge gateways, tiered computational services, asynchronous streaming event brokers, and multi-tier memory/storage systems.
          </p>
        </div>

        <ArchitectureCanvas
          title={OVERVIEW_DIAGRAM_TITLE}
          explanation={OVERVIEW_DIAGRAM_EXPLANATION}
          initialNodes={INITIAL_OVERVIEW_NODES}
          initialEdges={INITIAL_OVERVIEW_EDGES}
          height="h-[650px]"
        />
      </section>

      {/* 4. Engineering Themes & Epistemological Standards */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
        <div className="rounded-xl border border-canvas-border bg-canvas-surface p-6 space-y-3">
          <div className="w-9 h-9 rounded-lg bg-accent-cyan/10 border border-accent-cyan/30 flex items-center justify-center text-accent-cyan">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="font-serif text-lg font-bold text-ink-light">
            Computational Decoupling
          </h3>
          <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
            Examining how high-latency machine learning models (matrix factorization, sequence transformers) are decoupled from sub-100ms request SLAs via offline and nearline caching hierarchies.
          </p>
        </div>

        <div className="rounded-xl border border-canvas-border bg-canvas-surface p-6 space-y-3">
          <div className="w-9 h-9 rounded-lg bg-accent-violet/10 border border-accent-violet/30 flex items-center justify-center text-accent-violet">
            <HardDrive className="w-5 h-5" />
          </div>
          <h3 className="font-serif text-lg font-bold text-ink-light">
            Concurrency & Linearizability
          </h3>
          <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
            Deconstructing why adding database replicas fails under high flash-sale write contention, and how single-instance Redis Lua scripts enforce atomic mutual exclusion with fencing tokens.
          </p>
        </div>

        <div className="rounded-xl border border-canvas-border bg-canvas-surface p-6 space-y-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-serif text-lg font-bold text-ink-light">
            Epistemological Rigor
          </h3>
          <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
            Upholding absolute intellectual honesty: distinguishing between publicly documented facts, reasoned engineering inferences, and rigorously designed reference architectures.
          </p>
        </div>
      </section>

      {/* 5. Path to Research Methodology */}
      <section className="rounded-xl border border-canvas-border bg-canvas-elevated/40 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-accent-cyan uppercase tracking-wider font-semibold">
              Verification Protocol
            </span>
            <span className="text-ink-muted">•</span>
            <span className="text-xs font-mono text-ink-muted">Zero Hallucinations</span>
          </div>
          <h3 className="font-serif text-xl sm:text-2xl font-bold text-ink-light">
            How This Research is Verified
          </h3>
          <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
            Every technical claim, diagram node, and latency budget in this publication adheres to our 4-tier evidentiary standard. Inspect our methodology to review the epistemological guidelines governing every case study.
          </p>
        </div>
        <Link
          to="/methodology"
          className="px-5 py-2.5 rounded-lg border border-canvas-border bg-canvas-surface hover:bg-canvas-elevated text-ink-light font-medium text-xs sm:text-sm font-sans flex items-center gap-2 shrink-0 transition-all shadow-md"
        >
          <span>Read Research Methodology</span>
          <ArrowRight className="w-4 h-4 text-accent-cyan" />
        </Link>
      </section>
    </div>
  );
};
