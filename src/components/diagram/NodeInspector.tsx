import React, { useEffect } from 'react';
import { ArchitectureNodeData } from '../../types';
import { EvidenceBadge } from '../editorial/EvidenceBadge';
import { X, ArrowRight, ArrowDownLeft, ShieldAlert, Clock, Layers, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

interface NodeInspectorProps {
  nodeData: ArchitectureNodeData | null;
  onClose: () => void;
}

export const NodeInspector: React.FC<NodeInspectorProps> = ({ nodeData, onClose }) => {
  // Listen for Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!nodeData) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="node-inspector-title"
      className="absolute top-4 right-4 bottom-4 w-96 max-w-[calc(100vw-2rem)] bg-canvas-surface/95 backdrop-blur-md border border-canvas-border shadow-2xl rounded-xl z-20 flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-4 duration-200"
    >
      {/* Header */}
      <div className="p-4 border-b border-canvas-border flex items-start justify-between gap-3 bg-canvas-elevated/50">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <EvidenceBadge tier={nodeData.tier} size="sm" />
            <span className="text-[11px] font-mono text-ink-muted uppercase">
              {nodeData.category} Tier
            </span>
          </div>
          <h3 id="node-inspector-title" className="text-base font-semibold text-ink-light">
            {nodeData.label}
          </h3>
          {nodeData.sublabel && (
            <p className="text-xs font-mono text-accent-cyan mt-0.5">
              {nodeData.sublabel}
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          aria-label="Close component inspector"
          className="p-1 rounded-md text-ink-muted hover:text-ink-light hover:bg-canvas-border/50 transition-colors focus:outline-none focus:ring-1 focus:ring-accent-violet"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body content */}
      <div className="p-4 flex-1 overflow-y-auto space-y-4 text-xs leading-relaxed">
        {/* Responsibility */}
        <div className="space-y-1">
          <span className="font-mono uppercase text-[10px] tracking-wider text-ink-muted font-semibold block">
            Architectural Responsibility
          </span>
          <p className="text-ink-light/90 text-sm">
            {nodeData.responsibility}
          </p>
        </div>

        {/* Technical Stack */}
        <div className="p-3 rounded-lg bg-canvas-dark border border-canvas-borderSubtle space-y-1">
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-ink-muted">
            <Layers className="w-3.5 h-3.5 text-accent-violet" />
            <span>Implementation Stack</span>
          </div>
          <p className="font-mono text-xs text-ink-light">
            {nodeData.techStack}
          </p>
        </div>

        {/* Latency SLA */}
        {nodeData.latencySla && (
          <div className="p-3 rounded-lg bg-canvas-dark border border-canvas-borderSubtle space-y-1">
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-accent-cyan">
              <Clock className="w-3.5 h-3.5" />
              <span>Latency SLA & Performance Budget</span>
            </div>
            <p className="font-mono text-xs text-ink-light">
              {nodeData.latencySla}
            </p>
          </div>
        )}

        {/* Inputs & Outputs */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="p-2.5 rounded bg-canvas-elevated/40 border border-canvas-borderSubtle">
            <span className="font-mono text-[10px] text-ink-muted uppercase block mb-1 flex items-center gap-1">
              <ArrowDownLeft className="w-3 h-3 text-emerald-400" /> Inputs
            </span>
            <ul className="space-y-1 text-ink-light/90">
              {nodeData.inputs.map((inp, idx) => (
                <li key={idx} className="truncate" title={inp}>• {inp}</li>
              ))}
            </ul>
          </div>
          <div className="p-2.5 rounded bg-canvas-elevated/40 border border-canvas-borderSubtle">
            <span className="font-mono text-[10px] text-ink-muted uppercase block mb-1 flex items-center gap-1">
              <ArrowRight className="w-3 h-3 text-accent-cyan" /> Outputs
            </span>
            <ul className="space-y-1 text-ink-light/90">
              {nodeData.outputs.map((out, idx) => (
                <li key={idx} className="truncate" title={out}>• {out}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Failure Mode & Resilience */}
        {nodeData.failureMode && (
          <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-500/20 space-y-1">
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-rose-400">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Failure Mode & Degradation Policy</span>
            </div>
            <p className="text-ink-light/90 text-xs">
              {nodeData.failureMode}
            </p>
          </div>
        )}

        {/* Verified Citations */}
        {nodeData.citations && nodeData.citations.length > 0 && (
          <div className="pt-2 border-t border-canvas-border/50">
            <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase text-ink-muted mb-2">
              <BookOpen className="w-3 h-3 text-accent-cyan" />
              <span>Primary Source Citations</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {nodeData.citations.map((citeId) => (
                <Link
                  key={citeId}
                  to={`/references?highlight=${citeId}`}
                  className="font-mono text-[11px] px-2 py-0.5 rounded bg-canvas-elevated hover:bg-canvas-border text-accent-cyan hover:text-white border border-canvas-border transition-colors"
                >
                  [{citeId}]
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-canvas-border bg-canvas-elevated/40 text-[11px] text-ink-muted flex items-center justify-between">
        <span>Press <kbd className="px-1.5 py-0.5 bg-canvas-dark rounded border border-canvas-border font-mono text-[10px]">Esc</kbd> to dismiss</span>
        <button
          onClick={onClose}
          className="text-accent-cyan hover:underline font-mono text-xs"
        >
          Close Drawer
        </button>
      </div>
    </div>
  );
};
