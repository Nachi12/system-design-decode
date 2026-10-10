import React, { useState, useEffect } from 'react';
import { SOURCES } from '../data/sources';
import { EvidenceBadge } from '../components/editorial/EvidenceBadge';
import { useSearchParams, Link } from 'react-router-dom';
import { FileText, ExternalLink, Search, ArrowRight } from 'lucide-react';

export const ReferencesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get('highlight');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [selectedTier, setSelectedTier] = useState<string>('all');

  useEffect(() => {
    if (highlightId) {
      const element = document.getElementById(highlightId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [highlightId]);

  const filteredSources = SOURCES.filter((item) => {
    const matchesDomain = selectedDomain === 'all' || item.domain === selectedDomain;
    const matchesTier = selectedTier === 'all' || item.tier === selectedTier;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      item.id.toLowerCase().includes(q) ||
      item.title.toLowerCase().includes(q) ||
      item.authors.toLowerCase().includes(q) ||
      item.summary.toLowerCase().includes(q) ||
      item.keyTakeaway.toLowerCase().includes(q);

    return matchesDomain && matchesTier && matchesSearch;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      {/* Header */}
      <header className="border-b border-canvas-border pb-8 space-y-4">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs uppercase tracking-wider text-accent-cyan font-semibold flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" /> Canonical Bibliography
          </span>
          <span className="font-mono text-xs text-ink-muted">• Primary Sources & Register</span>
        </div>

        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-ink-light tracking-tight leading-tight">
          Authoritative Source Register
        </h1>

        <p className="text-base sm:text-lg text-ink-muted leading-relaxed">
          The verified register of primary corporate engineering publications, peer-reviewed research papers, and distributed systems literature grounding every analysis in this monograph.
        </p>

        {/* Filter & Search Bar */}
        <div className="pt-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by title, author, key takeaway..."
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-canvas-surface border border-canvas-border text-ink-light placeholder:text-ink-muted text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-accent-violet transition-all"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="px-3 py-2 rounded-lg bg-canvas-surface border border-canvas-border text-ink-light text-xs font-mono focus:outline-none focus:ring-1 focus:ring-accent-violet"
            >
              <option value="all">All Domains</option>
              <option value="netflix">Netflix</option>
              <option value="bookmyshow">BookMyShow / Ticketing</option>
              <option value="distributed-systems">Distributed Systems</option>
            </select>

            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="px-3 py-2 rounded-lg bg-canvas-surface border border-canvas-border text-ink-light text-xs font-mono focus:outline-none focus:ring-1 focus:ring-accent-violet"
            >
              <option value="all">All Tiers</option>
              <option value="DOCUMENTED">Documented</option>
              <option value="INFERENCE">Inference</option>
              <option value="REFERENCE">Reference Design</option>
            </select>
          </div>
        </div>
      </header>

      {/* Source Entries */}
      <section className="space-y-6">
        <div className="flex items-center justify-between text-xs font-mono text-ink-muted">
          <span>Displaying {filteredSources.length} of {SOURCES.length} citations</span>
          {(searchQuery || selectedDomain !== 'all' || selectedTier !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedDomain('all');
                setSelectedTier('all');
              }}
              className="text-accent-cyan hover:underline"
            >
              Reset all filters
            </button>
          )}
        </div>

        <div className="space-y-6">
          {filteredSources.map((item) => {
            const isHighlighted = highlightId === item.id;

            return (
              <div
                key={item.id}
                id={item.id}
                className={`p-6 rounded-xl border bg-canvas-surface space-y-4 shadow-lg transition-all duration-200 ${
                  isHighlighted
                    ? 'border-accent-cyan ring-2 ring-accent-cyan/40 bg-canvas-elevated'
                    : 'border-canvas-border hover:border-canvas-border/80'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-canvas-borderSubtle pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-accent-cyan">
                      [{item.id}]
                    </span>
                    <EvidenceBadge tier={item.tier} size="sm" />
                    {item.sourceType && (
                      <span className="font-mono text-[10px] text-ink-muted px-2 py-0.5 rounded bg-canvas-elevated">
                        {item.sourceType}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-mono text-ink-muted uppercase">
                    {item.domain} • {item.year}
                  </span>
                </div>

                <div>
                  <h3 className="font-serif text-xl font-bold text-ink-light leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs font-mono text-ink-muted mt-1">
                    {item.authors} — <span className="italic">{item.venue}</span> ({item.year})
                  </p>
                </div>

                <p className="text-xs sm:text-sm text-ink-light/90 leading-relaxed font-sans">
                  {item.summary}
                </p>

                <div className="p-3 rounded-lg bg-canvas-dark border border-canvas-borderSubtle text-xs space-y-1">
                  <span className="font-mono text-[11px] text-accent-violet font-semibold uppercase block">
                    Core Architectural Takeaway:
                  </span>
                  <p className="text-ink-muted leading-relaxed">
                    {item.keyTakeaway}
                  </p>
                </div>

                {item.supportedClaims && item.supportedClaims.length > 0 && (
                  <div className="p-3 rounded-lg bg-canvas-surface border border-canvas-borderSubtle text-xs space-y-1">
                    <span className="font-mono text-[11px] text-emerald-400 font-semibold uppercase block">
                      Supported Claims &amp; Evidentiary Findings:
                    </span>
                    <ul className="space-y-0.5 text-ink-light/90 text-[11px] list-disc list-inside">
                      {item.supportedClaims.map((claim, idx) => (
                        <li key={idx}>{claim}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {item.knownLimitations && (
                  <div className="text-[11px] font-mono text-amber-400/90 bg-amber-950/20 p-2.5 rounded border border-amber-500/20">
                    <strong>Epistemological Limitations:</strong> {item.knownLimitations}
                  </div>
                )}

                <div className="pt-2 flex items-center justify-between">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-mono text-accent-cyan hover:text-white transition-colors"
                  >
                    <span>Inspect Primary Source Documentation</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}

          {filteredSources.length === 0 && (
            <div className="py-12 text-center space-y-2">
              <p className="font-serif text-lg text-ink-muted">No sources match your criteria</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedDomain('all');
                  setSelectedTier('all');
                }}
                className="text-accent-cyan text-xs font-mono hover:underline"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Navigation Footer */}
      <div className="pt-6 border-t border-canvas-border flex items-center justify-between">
        <Link
          to="/glossary"
          className="text-xs font-mono text-ink-muted hover:text-ink-light transition-colors"
        >
          ← Previous: Distributed Systems Glossary
        </Link>
        <Link
          to="/"
          className="px-4 py-2 rounded-lg bg-canvas-surface hover:bg-canvas-elevated border border-canvas-border text-ink-light text-xs font-sans font-medium flex items-center gap-2 transition-colors"
        >
          <span>Return to Homepage Overview</span>
          <ArrowRight className="w-3.5 h-3.5 text-accent-cyan" />
        </Link>
      </div>
    </div>
  );
};
