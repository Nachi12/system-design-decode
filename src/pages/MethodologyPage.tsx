import React from 'react';
import { METHODOLOGY_TIERS, METHODOLOGY_PRINCIPLES } from '../data/methodology';
import { EvidenceBadge } from '../components/editorial/EvidenceBadge';
import { CalloutNote } from '../components/editorial/CalloutNote';
import { Compass, ShieldCheck, AlertTriangle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const MethodologyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-12">
      {/* Header */}
      <header className="border-b border-canvas-border pb-8 space-y-4">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs uppercase tracking-wider text-accent-cyan font-semibold flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5" /> Epistemological Standards
          </span>
          <span className="font-mono text-xs text-ink-muted">• Verification Protocol</span>
        </div>

        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-ink-light tracking-tight leading-tight">
          Research Methodology & Evidentiary Framework
        </h1>

        <p className="text-base sm:text-lg text-ink-muted leading-relaxed">
          System Architecture Decoded enforces strict intellectual honesty. Every technical claim, diagram node, latency budget, and component is categorized into one of four explicit evidentiary certainty tiers.
        </p>
      </header>

      {/* The 4 Evidentiary Tiers */}
      <section className="space-y-6">
        <h2 className="font-serif text-2xl font-bold text-ink-light flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          The 4-Tier Evidentiary Standard
        </h2>

        <div className="space-y-6">
          {METHODOLOGY_TIERS.map((tier) => (
            <div
              key={tier.tier}
              className="p-6 rounded-xl border border-canvas-border bg-canvas-surface space-y-4 shadow-lg"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-canvas-borderSubtle pb-3">
                <div className="flex items-center gap-2.5">
                  <EvidenceBadge tier={tier.tier} size="md" />
                  <span className="font-serif text-lg font-bold text-ink-light">
                    {tier.label}
                  </span>
                </div>
                <span className="text-xs font-mono text-ink-muted">
                  Certainty Tier: {tier.tier}
                </span>
              </div>

              <p className="text-sm text-ink-light/90 leading-relaxed">
                {tier.definition}
              </p>

              <div className="space-y-1.5 pt-2">
                <span className="font-mono text-[11px] text-ink-muted uppercase tracking-wider block font-semibold">
                  Permissible Sources:
                </span>
                <ul className="space-y-1 text-xs text-ink-muted">
                  {tier.acceptableSources.map((src, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-accent-cyan">•</span>
                      <span>{src}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3 rounded-lg bg-canvas-dark border border-canvas-borderSubtle text-xs">
                <span className="font-mono text-accent-cyan text-[11px] font-semibold block mb-0.5">
                  Applied Example in this Portfolio:
                </span>
                <span className="text-ink-light/90">{tier.exampleApplied}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* The BookMyShow Protocol */}
      <section className="space-y-4">
        <h2 className="font-serif text-2xl font-bold text-ink-light flex items-center gap-2.5">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          The BookMyShow Protocol: Handling Proprietary Systems
        </h2>

        <p className="text-sm sm:text-base text-ink-light/90 leading-relaxed">
          Many system design resources invent proprietary internal microservices and present generic interview diagrams as a company&apos;s real internal implementation. System Architecture Decoded rejects this practice:
        </p>

        <CalloutNote type="inference" title="The BookMyShow Protocol Mandate">
          Where internal implementation details are not publicly published by company engineers, we explicitly present a <strong>Proposed Reference Architecture</strong>. We do not invent fake microservice names or pretend to hold non-public corporate trade secrets.
        </CalloutNote>
      </section>

      {/* Core Research Principles */}
      <section className="space-y-4">
        <h2 className="font-serif text-2xl font-bold text-ink-light">
          Governing Research Principles
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {METHODOLOGY_PRINCIPLES.map((principle, idx) => (
            <div
              key={idx}
              className="p-5 rounded-xl border border-canvas-border bg-canvas-surface space-y-2"
            >
              <h4 className="font-serif text-base font-bold text-ink-light">
                {principle.title}
              </h4>
              <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
                {principle.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Navigation Footer */}
      <div className="pt-6 border-t border-canvas-border flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link
          to="/comparison"
          className="text-xs font-mono text-ink-muted hover:text-ink-light transition-colors"
        >
          ← Previous: Architecture Comparison
        </Link>
        <Link
          to="/glossary"
          className="px-4 py-2 rounded-lg bg-canvas-surface hover:bg-canvas-elevated border border-canvas-border text-ink-light text-xs font-sans font-medium flex items-center gap-2 transition-colors"
        >
          <span>Continue to Distributed Systems Glossary</span>
          <ArrowRight className="w-3.5 h-3.5 text-accent-cyan" />
        </Link>
      </div>
    </div>
  );
};
