import React, { useState, useMemo } from 'react';
import { ALL_ADRS } from '../data/allAdrData';
import { EvidenceBadge } from '../components/editorial/EvidenceBadge';
import { 
  Sliders, 
  Search, 
  BookOpen, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdrPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [expandedAdrId, setExpandedAdrId] = useState<string | null>(null);

  const categories = useMemo(() => {
    const set = new Set<string>();
    ALL_ADRS.forEach(a => set.add(a.category));
    return Array.from(set).sort();
  }, []);

  const filteredAdrs = useMemo(() => {
    return ALL_ADRS.filter(item => {
      const matchesDomain = selectedDomain === 'all' || item.domain === selectedDomain;
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        item.id.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        item.problem.toLowerCase().includes(q) ||
        item.rationale.toLowerCase().includes(q) ||
        item.chosenOption.toLowerCase().includes(q);

      return matchesDomain && matchesCategory && matchesStatus && matchesSearch;
    });
  }, [searchQuery, selectedDomain, selectedCategory, selectedStatus]);

  const toggleExpand = (id: string) => {
    setExpandedAdrId(prev => (prev === id ? null : id));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      {/* Header */}
      <header className="border-b border-canvas-border pb-8 space-y-4">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs uppercase tracking-wider text-accent-violet font-semibold flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5" /> ARCHITECTURAL ATLAS
          </span>
          <span className="font-mono text-xs text-ink-muted">• Decision Records Index</span>
        </div>

        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-ink-light tracking-tight leading-tight">
          Architecture Decision Records (ADRs)
        </h1>

        <p className="text-base sm:text-lg text-ink-muted leading-relaxed">
          A canonical register of eleven foundational architectural decisions across recommendation systems, content delivery, distributed concurrency, and transactional payment reliability. Evaluated alternatives, invariant requirements, and operational trade-offs are documented with rigorous evidentiary attribution.
        </p>

        {/* Search & Multi-Filter Bar */}
        <div className="pt-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ADRs by title, problem, or technology..."
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-canvas-surface border border-canvas-border text-ink-light placeholder:text-ink-muted text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-accent-violet transition-all"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <select
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(e.target.value)}
                className="px-3 py-2 rounded-lg bg-canvas-surface border border-canvas-border text-ink-light text-xs font-mono focus:outline-none focus:ring-1 focus:ring-accent-violet"
              >
                <option value="all">All Domains (11)</option>
                <option value="netflix">Netflix (5)</option>
                <option value="bookmyshow">BookMyShow (6)</option>
              </select>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 rounded-lg bg-canvas-surface border border-canvas-border text-ink-light text-xs font-mono focus:outline-none focus:ring-1 focus:ring-accent-violet"
              >
                <option value="all">All Categories</option>
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 rounded-lg bg-canvas-surface border border-canvas-border text-ink-light text-xs font-mono focus:outline-none focus:ring-1 focus:ring-accent-violet"
              >
                <option value="all">All Statuses</option>
                <option value="DOCUMENTED">Documented</option>
                <option value="PROPOSED">Proposed</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Epistemological Banner */}
      <div className="p-4 rounded-xl border border-canvas-border bg-canvas-surface flex items-start gap-3 text-xs">
        <AlertCircle className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
        <p className="text-ink-muted leading-relaxed">
          <strong className="text-ink-light">Evidentiary Boundary:</strong> ADRs labeled{' '}
          <span className="text-emerald-400 font-mono font-bold">[DOCUMENTED]</span> reflect verified choices published in primary Netflix engineering papers. ADRs labeled{' '}
          <span className="text-purple-300 font-mono font-bold">[PROPOSED]</span> represent reference designs engineered for this monograph and are never falsely claimed as BookMyShow&apos;s proprietary internal decisions.
        </p>
      </div>

      {/* ADR Records List */}
      <section className="space-y-6">
        <div className="flex items-center justify-between text-xs font-mono text-ink-muted">
          <span>Displaying {filteredAdrs.length} of {ALL_ADRS.length} records</span>
          {(searchQuery || selectedDomain !== 'all' || selectedCategory !== 'all' || selectedStatus !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedDomain('all');
                setSelectedCategory('all');
                setSelectedStatus('all');
              }}
              className="text-accent-cyan hover:underline"
            >
              Reset filters
            </button>
          )}
        </div>

        <div className="space-y-4">
          {filteredAdrs.map((adr) => {
            const isExpanded = expandedAdrId === adr.id;

            return (
              <div
                key={adr.id}
                className={`rounded-xl border transition-all ${
                  isExpanded
                    ? 'border-accent-violet/60 bg-canvas-surface shadow-xl'
                    : 'border-canvas-border bg-canvas-surface hover:border-canvas-borderFocus'
                }`}
              >
                {/* Header Row (Clickable) */}
                <div
                  onClick={() => toggleExpand(adr.id)}
                  className="p-5 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-accent-cyan">{adr.id}</span>
                      <span className="text-ink-muted">•</span>
                      <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-canvas-elevated text-ink-muted">
                        {adr.category}
                      </span>
                      <span className="text-ink-muted">•</span>
                      <EvidenceBadge tier={adr.evidenceStatus} size="sm" />
                      <span className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border ${
                        adr.status === 'DOCUMENTED'
                          ? 'border-emerald-500/30 text-emerald-400 bg-emerald-950/20'
                          : 'border-purple-500/30 text-purple-300 bg-purple-950/20'
                      }`}>
                        {adr.status}
                      </span>
                    </div>

                    <h3 className="font-serif text-lg sm:text-xl font-bold text-ink-light">
                      {adr.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-ink-muted line-clamp-2">
                      {adr.problem}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
                    <span className="font-mono text-xs text-accent-violet font-semibold hidden sm:inline">
                      {isExpanded ? 'Collapse' : 'Inspect'}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-accent-violet" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-ink-muted" />
                    )}
                  </div>
                </div>

                {/* Expanded Detail Body */}
                {isExpanded && (
                  <div className="px-5 pb-6 pt-2 border-t border-canvas-borderSubtle space-y-6 text-xs sm:text-sm animate-in fade-in-50 duration-150">
                    {/* Context & Requirements */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-canvas-dark border border-canvas-borderSubtle space-y-2">
                        <span className="font-mono text-[11px] text-accent-cyan uppercase font-bold block">
                          Context &amp; Operational Environment:
                        </span>
                        <p className="text-ink-light/90 leading-relaxed text-xs">
                          {adr.context}
                        </p>
                      </div>

                      <div className="p-4 rounded-lg bg-canvas-dark border border-canvas-borderSubtle space-y-2">
                        <span className="font-mono text-[11px] text-accent-violet uppercase font-bold block">
                          Critical Requirements &amp; Invariants:
                        </span>
                        <ul className="space-y-1 text-xs text-ink-muted">
                          {adr.requirements.map((req, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-accent-cyan font-bold">•</span>
                              <span>{req}</span>
                            </li>
                          ))}
                          {adr.invariants.map((inv, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-emerald-400">
                              <span className="font-bold">✓</span>
                              <span><strong>Invariant:</strong> {inv}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Evaluated Alternatives */}
                    <div className="space-y-2">
                      <span className="font-mono text-xs text-ink-light uppercase font-bold">
                        Evaluated Alternatives:
                      </span>
                      <div className="grid grid-cols-1 gap-2.5">
                        {adr.options.map((opt, idx) => (
                          <div
                            key={idx}
                            className={`p-3.5 rounded-lg border text-xs space-y-1 ${
                              opt.name.includes(adr.chosenOption.split(':')[0])
                                ? 'bg-accent-violet/10 border-accent-violet/50'
                                : 'bg-canvas-dark border-canvas-borderSubtle'
                            }`}
                          >
                            <div className="font-mono font-bold text-ink-light flex items-center justify-between">
                              <span>{opt.name}</span>
                              {opt.name.includes(adr.chosenOption.split(':')[0]) && (
                                <span className="text-[10px] uppercase text-accent-violet bg-accent-violet/20 px-2 py-0.5 rounded font-bold">
                                  Recommended Option
                                </span>
                              )}
                            </div>
                            <p className="text-ink-light/90">{opt.description}</p>
                            <p className="text-ink-muted text-[11px]"><strong className="text-amber-400">Trade-offs:</strong> {opt.tradeoffs}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Chosen Architecture & Rationale */}
                    <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 space-y-2">
                      <span className="font-mono text-xs text-emerald-400 uppercase font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Chosen Architectural Decision: {adr.chosenOption}</span>
                      </span>
                      <p className="text-xs sm:text-sm text-ink-light/90 leading-relaxed font-sans">
                        {adr.rationale}
                      </p>
                    </div>

                    {/* Benefits vs Disadvantages */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-canvas-dark border border-canvas-borderSubtle space-y-2">
                        <span className="font-mono text-[11px] text-emerald-400 uppercase font-bold block">
                          Architectural Benefits:
                        </span>
                        <ul className="space-y-1 text-xs text-ink-muted">
                          {adr.benefits.map((b, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-emerald-400 font-bold">+</span>
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-4 rounded-lg bg-canvas-dark border border-canvas-borderSubtle space-y-2">
                        <span className="font-mono text-[11px] text-amber-400 uppercase font-bold block">
                          Disadvantages &amp; Trade-offs:
                        </span>
                        <ul className="space-y-1 text-xs text-ink-muted">
                          {adr.disadvantages.map((d, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-amber-400 font-bold">-</span>
                              <span>{d}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Operational Implications & Citations */}
                    <div className="p-3.5 rounded-lg bg-canvas-elevated border border-canvas-borderSubtle flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div>
                        <span className="font-mono text-[11px] text-ink-muted uppercase font-bold block">
                          Operational Implications:
                        </span>
                        <p className="text-ink-light/90 text-xs mt-0.5">{adr.operationalImplications}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
                        {adr.citationId && (
                          <Link
                            to={`/references?highlight=${adr.citationId}`}
                            className="font-mono text-xs text-accent-cyan hover:underline flex items-center gap-1 px-2.5 py-1 rounded bg-canvas-surface border border-canvas-border"
                          >
                            <BookOpen className="w-3.5 h-3.5 text-accent-cyan" />
                            <span>[{adr.citationId}]</span>
                          </Link>
                        )}
                        <Link
                          to={adr.domain === 'netflix' ? '/netflix' : '/bookmyshow'}
                          className="font-mono text-xs text-ink-light hover:text-accent-cyan flex items-center gap-1 px-2.5 py-1 rounded bg-canvas-surface border border-canvas-border transition-colors"
                        >
                          <span>Case Study</span>
                          <ExternalLink className="w-3 h-3 text-ink-muted" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {filteredAdrs.length === 0 && (
            <div className="py-12 text-center space-y-2">
              <p className="font-serif text-lg text-ink-muted">
                No Architecture Decision Records match your filter criteria.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedDomain('all');
                  setSelectedCategory('all');
                  setSelectedStatus('all');
                }}
                className="text-accent-cyan text-xs font-mono hover:underline"
              >
                Reset search filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Navigation Footer */}
      <div className="pt-6 border-t border-canvas-border flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link
          to="/comparison"
          className="text-xs font-mono text-ink-muted hover:text-ink-light transition-colors"
        >
          ← Previous: Comparative Architecture Synthesis
        </Link>
        <Link
          to="/capacity"
          className="px-4 py-2 rounded-lg bg-canvas-surface hover:bg-canvas-elevated border border-canvas-border text-ink-light text-xs font-sans font-medium flex items-center gap-2 transition-colors"
        >
          <span>Continue to Capacity Notebook</span>
          <ArrowRight className="w-3.5 h-3.5 text-accent-cyan" />
        </Link>
      </div>
    </div>
  );
};
