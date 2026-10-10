import React, { useState } from 'react';
import { TraceStep } from '../../types/seatLock';
import { Terminal, ChevronDown, ChevronRight } from 'lucide-react';

interface ExecutionTraceViewerProps {
  alphaTrace: TraceStep[] | null;
  alphaStatus?: number | string | null;
  betaTrace: TraceStep[] | null;
  betaStatus?: number | string | null;
}

export const ExecutionTraceViewer: React.FC<ExecutionTraceViewerProps> = ({
  alphaTrace,
  alphaStatus,
  betaTrace,
  betaStatus,
}) => {
  const [selectedTab, setSelectedTab] = useState<'both' | 'alpha' | 'beta'>('both');
  const [expandedIndices, setExpandedIndices] = useState<Record<string, boolean>>({});

  const toggleExpand = (key: string) => {
    setExpandedIndices((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const getStepStatusBadge = (status: string) => {
    switch (status) {
      case 'OK':
      case 'ACQUIRED':
      case 'COMMITTED':
      case 'RELEASED_SAFELY':
      case 'REPLAY_FOUND':
        return (
          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60 text-emerald-300">
            {status}
          </span>
        );
      case 'CONTENDED':
      case 'ROLLED_BACK':
        return (
          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-950/60 border border-rose-800/60 text-rose-300">
            {status}
          </span>
        );
      case 'BYPASSED_PG_ONLY':
        return (
          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-800/60 text-amber-300">
            {status}
          </span>
        );
      case 'BEGIN':
      case 'ACQUIRED_FOR_UPDATE':
      default:
        return (
          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/60 text-cyan-300">
            {status}
          </span>
        );
    }
  };

  const renderTraceList = (
    trace: TraceStep[] | null,
    status: number | string | null | undefined,
    customerPrefix: string,
    customerLabel: string,
    colorClass: string
  ) => {
    if (!trace || trace.length === 0) {
      return (
        <div className="p-6 rounded-lg bg-canvas-dark/60 border border-canvas-borderSubtle text-center text-ink-muted text-xs font-mono min-h-[180px] flex flex-col items-center justify-center">
          <Terminal className="w-5 h-5 text-ink-muted/50 mb-1" />
          <span>No execution trace observed</span>
          <span className="text-[10px] text-ink-muted/70 mt-1">
            Dispatch an action in Area B to receive authoritative backend traces
          </span>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {/* Trace Header */}
        <div className="flex items-center justify-between pb-2 border-b border-canvas-borderSubtle">
          <div className="flex items-center gap-2">
            <span className={`font-mono text-xs font-bold ${colorClass}`}>
              {customerLabel}
            </span>
            <span className="text-ink-muted text-[10px]">•</span>
            <span className="font-mono text-[10px] text-ink-muted">
              {trace.length} Authoritative Steps
            </span>
          </div>

          {status && (
            <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
              Number(status) >= 200 && Number(status) < 300
                ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/50'
                : 'bg-rose-950/60 text-rose-300 border border-rose-800/50'
            }`}>
              HTTP {status}
            </span>
          )}
        </div>

        {/* Step Items */}
        <div className="space-y-2">
          {trace.map((step, idx) => {
            const itemKey = `${customerPrefix}-${idx}`;
            const isExpanded = !!expandedIndices[itemKey];
            const hasDetails = step.details && Object.keys(step.details).length > 0;

            return (
              <div
                key={idx}
                className="rounded-lg border border-canvas-borderSubtle bg-canvas-dark/70 hover:bg-canvas-elevated/40 transition-colors text-xs font-mono overflow-hidden"
              >
                <div
                  className={`p-2.5 flex items-center justify-between gap-2 ${
                    hasDetails ? 'cursor-pointer' : ''
                  }`}
                  onClick={() => hasDetails && toggleExpand(itemKey)}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-ink-muted text-[10px] w-4 text-right">
                      {idx + 1}.
                    </span>
                    <span className="font-bold text-ink-light truncate text-[11px]">
                      {step.step}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {getStepStatusBadge(step.status)}
                    {step.durationMs !== undefined && (
                      <span className="text-[10px] text-ink-muted/80">
                        {step.durationMs}ms
                      </span>
                    )}
                    {hasDetails && (
                      <span className="text-ink-muted hover:text-ink-light">
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                      </span>
                    )}
                  </div>
                </div>

                {/* Details Accordion */}
                {isExpanded && hasDetails && (
                  <div className="px-3 py-2 bg-canvas-dark border-t border-canvas-borderSubtle text-[11px] text-ink-muted font-mono overflow-x-auto">
                    <pre className="text-emerald-300/90 whitespace-pre-wrap">
                      {JSON.stringify(step.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const hasTraces = (alphaTrace && alphaTrace.length > 0) || (betaTrace && betaTrace.length > 0);

  return (
    <div className="rounded-xl border border-canvas-border bg-canvas-surface p-5 sm:p-6 shadow-xl space-y-6">
      {/* Trace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-canvas-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-accent-cyan uppercase tracking-widest font-semibold">
              AREA C // SERVER EXECUTION TRACE
            </span>
            <span className="text-ink-muted text-xs">•</span>
            <span className="font-mono text-xs text-ink-muted">Authoritative Event Log</span>
          </div>
          <h3 className="font-serif text-xl sm:text-2xl font-bold text-ink-light tracking-tight mt-0.5">
            Real Backend Telemetry &amp; Lock Stages
          </h3>
        </div>

        {/* View Switcher Tabs */}
        {hasTraces && (
          <div className="flex items-center gap-1 p-1 rounded-lg bg-canvas-dark border border-canvas-border text-xs font-mono">
            <button
              type="button"
              onClick={() => setSelectedTab('both')}
              className={`px-2.5 py-1 rounded transition-colors ${
                selectedTab === 'both'
                  ? 'bg-canvas-elevated text-ink-light font-bold border border-canvas-border'
                  : 'text-ink-muted hover:text-ink-light'
              }`}
            >
              Side-by-Side
            </button>
            <button
              type="button"
              onClick={() => setSelectedTab('alpha')}
              className={`px-2.5 py-1 rounded transition-colors ${
                selectedTab === 'alpha'
                  ? 'bg-canvas-elevated text-accent-cyan font-bold border border-canvas-border'
                  : 'text-ink-muted hover:text-ink-light'
              }`}
            >
              Alpha
            </button>
            <button
              type="button"
              onClick={() => setSelectedTab('beta')}
              className={`px-2.5 py-1 rounded transition-colors ${
                selectedTab === 'beta'
                  ? 'bg-canvas-elevated text-accent-bms font-bold border border-canvas-border'
                  : 'text-ink-muted hover:text-ink-light'
              }`}
            >
              Beta
            </button>
          </div>
        )}
      </div>

      {/* Trace Content */}
      {selectedTab === 'both' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="p-4 rounded-xl border border-canvas-border bg-canvas-dark/40">
            {renderTraceList(alphaTrace, alphaStatus, 'alpha', 'Customer Alpha (Request Trace)', 'text-accent-cyan')}
          </div>
          <div className="p-4 rounded-xl border border-canvas-border bg-canvas-dark/40">
            {renderTraceList(betaTrace, betaStatus, 'beta', 'Customer Beta (Request Trace)', 'text-accent-bms')}
          </div>
        </div>
      ) : selectedTab === 'alpha' ? (
        <div className="p-4 rounded-xl border border-canvas-border bg-canvas-dark/40 max-w-2xl mx-auto">
          {renderTraceList(alphaTrace, alphaStatus, 'alpha', 'Customer Alpha (Request Trace)', 'text-accent-cyan')}
        </div>
      ) : (
        <div className="p-4 rounded-xl border border-canvas-border bg-canvas-dark/40 max-w-2xl mx-auto">
          {renderTraceList(betaTrace, betaStatus, 'beta', 'Customer Beta (Request Trace)', 'text-accent-bms')}
        </div>
      )}

      {/* Explanatory note */}
      <div className="p-3 rounded-lg bg-canvas-dark/50 border border-canvas-borderSubtle text-[11px] font-mono text-ink-muted flex items-center justify-between">
        <span>
          🛡️ Telemetry Rule: Every trace step displayed is directly extracted from the server response payload. Zero steps are fabricated.
        </span>
      </div>
    </div>
  );
};
