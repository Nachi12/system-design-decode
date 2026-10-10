import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, GitBranch, Compass, FileText } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-canvas-border bg-canvas-surface/80 text-ink-muted text-xs mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Col 1: Monograph Thesis */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-serif text-base font-bold text-ink-light">
                System Architecture Decoded
              </span>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-canvas-elevated border border-canvas-border text-accent-cyan">
                Research Monograph
              </span>
            </div>
            <p className="text-ink-muted leading-relaxed max-w-md">
              An independent research portfolio investigating how planetary-scale systems operate. 
              Built to deconstruct hard engineering trade-offs, concurrency models, and network boundaries through 
              empirical evidence and architectural reasoning.
            </p>
            <div className="flex items-center gap-2 font-mono text-[11px] text-emerald-400/90 pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Rigorous 4-Tier Evidentiary Framework Applied</span>
            </div>
          </div>

          {/* Col 2: Research Portals */}
          <div className="space-y-2.5">
            <h4 className="font-mono text-xs uppercase tracking-wider text-ink-light font-semibold">
              Research Portals
            </h4>
            <ul className="space-y-1.5 font-sans">
              <li>
                <Link to="/netflix" className="hover:text-accent-cyan transition-colors">
                  Netflix: Personalization &amp; CDN
                </Link>
              </li>
              <li>
                <Link to="/bookmyshow" className="hover:text-accent-bms transition-colors">
                  BookMyShow: Concurrency &amp; Ticketing
                </Link>
              </li>
              <li>
                <Link to="/comparison" className="hover:text-accent-cyan transition-colors">
                  Architectural Synthesis
                </Link>
              </li>
              <li>
                <Link to="/adrs" className="hover:text-accent-violet transition-colors">
                  Architecture Decision Records (11 ADRs)
                </Link>
              </li>
              <li>
                <Link to="/capacity" className="hover:text-accent-cyan transition-colors">
                  Capacity Sizing Notebook (4 Models)
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Standards & Register */}
          <div className="space-y-2.5">
            <h4 className="font-mono text-xs uppercase tracking-wider text-ink-light font-semibold">
              Epistemology & Sources
            </h4>
            <ul className="space-y-1.5 font-sans">
              <li>
                <Link to="/methodology" className="hover:text-accent-cyan transition-colors flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5" /> Methodology &amp; 4 Tiers
                </Link>
              </li>
              <li>
                <Link to="/references" className="hover:text-accent-cyan transition-colors flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Canonical Source Register
                </Link>
              </li>
              <li>
                <Link to="/glossary" className="hover:text-accent-cyan transition-colors flex items-center gap-1.5">
                  <GitBranch className="w-3.5 h-3.5" /> Distributed Systems Glossary
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Disclaimer Bar */}
        <div className="pt-6 border-t border-canvas-border flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px]">
          <p className="text-ink-faint text-center sm:text-left">
            Non-Commercial Educational Research Portfolio. All cited trademarks, patents, and technical blog posts remain property of their respective holders.
          </p>
          <div className="flex items-center gap-4 text-ink-muted shrink-0">
            <span className="flex items-center gap-1">
              Static Bundle • Zero Backend
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
