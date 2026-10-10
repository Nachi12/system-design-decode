import React, { useState, useMemo } from 'react';
import { GLOSSARY_TERMS } from '../data/glossary';
import { Bookmark, Search, BookOpen, ArrowRight, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export const GlossaryPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLetter, setSelectedLetter] = useState<string>('ALL');

  // Available initial letters
  const alphabet = useMemo(() => {
    const letters = new Set<string>();
    GLOSSARY_TERMS.forEach((t) => {
      letters.add(t.term[0].toUpperCase());
    });
    return Array.from(letters).sort();
  }, []);

  const filteredTerms = useMemo(() => {
    return GLOSSARY_TERMS.filter((item) => {
      const matchesLetter =
        selectedLetter === 'ALL' || item.term[0].toUpperCase() === selectedLetter;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        item.term.toLowerCase().includes(q) ||
        (item.acronym && item.acronym.toLowerCase().includes(q)) ||
        item.definition.toLowerCase().includes(q) ||
        item.context.toLowerCase().includes(q) ||
        item.relatedTerms.some((r) => r.toLowerCase().includes(q));

      return matchesLetter && matchesSearch;
    }).sort((a, b) => a.term.localeCompare(b.term));
  }, [searchQuery, selectedLetter]);

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      {/* Header */}
      <header className="border-b border-canvas-border pb-8 space-y-4">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs uppercase tracking-wider text-accent-cyan font-semibold flex items-center gap-1.5">
            <Bookmark className="w-3.5 h-3.5" /> Canonical Reference
          </span>
          <span className="font-mono text-xs text-ink-muted">• Distributed Systems Lexicon</span>
        </div>

        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-ink-light tracking-tight leading-tight">
          Distributed Systems &amp; Architecture Glossary
        </h1>

        <p className="text-base sm:text-lg text-ink-muted leading-relaxed">
          Rigorous definitions, mathematical trade-offs, and operational contexts for core distributed systems concepts utilized throughout the research monographs. Cross-referenced with foundational computer science literature.
        </p>

        {/* Search Input & Letter Filter */}
        <div className="pt-2 space-y-3">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value) setSelectedLetter('ALL');
              }}
              placeholder="Search concepts (e.g. Linearizability, Backpressure, Fencing, CQRS)..."
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-canvas-surface border border-canvas-border text-ink-light placeholder:text-ink-muted text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-accent-violet transition-all"
            />
          </div>

          {/* Alphabet Index Bar */}
          <div className="flex flex-wrap items-center gap-1 pt-1 font-mono text-xs">
            <button
              onClick={() => setSelectedLetter('ALL')}
              className={`px-2 py-1 rounded transition-colors ${
                selectedLetter === 'ALL'
                  ? 'bg-accent-cyan text-canvas-dark font-bold'
                  : 'text-ink-muted hover:text-ink-light hover:bg-canvas-surface'
              }`}
            >
              ALL
            </button>
            {alphabet.map((letter) => (
              <button
                key={letter}
                onClick={() => {
                  setSelectedLetter(letter);
                  setSearchQuery('');
                }}
                className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${
                  selectedLetter === letter
                    ? 'bg-accent-cyan text-canvas-dark font-bold'
                    : 'text-ink-muted hover:text-ink-light hover:bg-canvas-surface'
                }`}
              >
                {letter}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Term List */}
      <section className="space-y-6">
        <div className="flex items-center justify-between text-xs font-mono text-ink-muted">
          <span>Showing {filteredTerms.length} of {GLOSSARY_TERMS.length} concepts</span>
          {(searchQuery || selectedLetter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedLetter('ALL');
              }}
              className="text-accent-cyan hover:underline"
            >
              Reset all filters
            </button>
          )}
        </div>

        <div className="divide-y divide-canvas-border/60">
          {filteredTerms.map((term) => (
            <div key={term.id} id={term.id} className="py-6 space-y-3 scroll-mt-24">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <h3 className="font-serif text-xl font-bold text-ink-light">
                    {term.term}
                  </h3>
                  {term.acronym && (
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-canvas-elevated border border-canvas-border text-accent-cyan font-semibold">
                      {term.acronym}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {term.citationId && (
                    <Link
                      to={`/references?highlight=${term.citationId}`}
                      className="font-mono text-xs text-accent-cyan hover:underline flex items-center gap-1 px-2 py-0.5 rounded bg-canvas-surface border border-canvas-border"
                      title="View foundational citation in Source Register"
                    >
                      <BookOpen className="w-3 h-3 text-accent-cyan" />
                      <span>[{term.citationId}]</span>
                    </Link>
                  )}
                </div>
              </div>

              <p className="text-sm text-ink-light/90 leading-relaxed font-sans">
                {term.definition}
              </p>

              <div className="p-3.5 rounded-lg bg-canvas-surface border border-canvas-borderSubtle text-xs space-y-1">
                <span className="font-mono text-[11px] text-accent-violet uppercase tracking-wider font-semibold block">
                  Practical Architectural Context in Monograph:
                </span>
                <p className="text-ink-muted leading-relaxed">
                  {term.context}
                </p>
              </div>

              {term.relatedTerms && term.relatedTerms.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] font-mono text-ink-muted">
                  <span>Related Concepts:</span>
                  {term.relatedTerms.map((rel, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSearchQuery(rel);
                        setSelectedLetter('ALL');
                      }}
                      className="px-2 py-0.5 rounded bg-canvas-elevated border border-canvas-borderSubtle text-ink-light/80 hover:text-accent-cyan hover:border-accent-cyan/40 transition-colors"
                    >
                      {rel}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {filteredTerms.length === 0 && (
            <div className="py-12 text-center space-y-2">
              <p className="font-serif text-lg text-ink-muted">
                No architectural terms matching &quot;{searchQuery}&quot;
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedLetter('ALL');
                }}
                className="text-accent-cyan text-xs font-mono hover:underline"
              >
                Reset search filter
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Cross-Case Study Links */}
      <section className="p-5 rounded-xl border border-canvas-border bg-canvas-surface space-y-3">
        <h4 className="font-mono text-xs uppercase tracking-wider text-accent-cyan font-semibold">
          Applied Architectural Case Studies
        </h4>
        <p className="text-xs text-ink-muted leading-relaxed">
          See these distributed systems principles operationalized in production architectures:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <Link
            to="/netflix"
            className="p-3 rounded-lg bg-canvas-dark border border-canvas-border hover:border-accent-netflix/40 transition-colors flex items-center justify-between text-xs"
          >
            <div>
              <div className="font-serif font-bold text-ink-light">Netflix Case Study</div>
              <div className="text-[11px] text-ink-muted">Nearline Flink, EVCache, Zero-Copy kTLS, Bandits</div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-accent-netflix shrink-0" />
          </Link>
          <Link
            to="/bookmyshow"
            className="p-3 rounded-lg bg-canvas-dark border border-canvas-border hover:border-accent-bms/40 transition-colors flex items-center justify-between text-xs"
          >
            <div>
              <div className="font-serif font-bold text-ink-light">BookMyShow Reference Design</div>
              <div className="text-[11px] text-ink-muted">Redis Lua CAS, Fencing Tokens, Sagas, Outbox CDC</div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-accent-bms shrink-0" />
          </Link>
        </div>
      </section>

      {/* Navigation Footer */}
      <div className="pt-6 border-t border-canvas-border flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link
          to="/methodology"
          className="text-xs font-mono text-ink-muted hover:text-ink-light transition-colors"
        >
          ← Previous: Research Methodology
        </Link>
        <Link
          to="/references"
          className="px-4 py-2 rounded-lg bg-canvas-surface hover:bg-canvas-elevated border border-canvas-border text-ink-light text-xs font-sans font-medium flex items-center gap-2 transition-colors"
        >
          <span>Continue to Canonical Source Register</span>
          <ArrowRight className="w-3.5 h-3.5 text-accent-cyan" />
        </Link>
      </div>
    </div>
  );
};
