import React from 'react';
import { TradeoffItem } from '../../types';
import { GitCompare, AlertCircle } from 'lucide-react';

interface TradeoffTableProps {
  items: TradeoffItem[];
  title?: string;
  subtitle?: string;
}

export const TradeoffTable: React.FC<TradeoffTableProps> = ({
  items,
  title = "Distributed Architecture Trade-Off Matrix",
  subtitle = "Comparative analysis of competing system paradigms under physical and algorithmic constraints"
}) => {
  return (
    <div className="my-8 rounded-xl border border-canvas-border bg-canvas-surface overflow-hidden shadow-xl">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-canvas-border bg-canvas-elevated/40">
        <div className="flex items-center gap-2 mb-1 text-accent-cyan font-mono text-xs uppercase tracking-wider font-semibold">
          <GitCompare className="w-4 h-4" /> Architectural Dialectic
        </div>
        <h3 className="text-lg sm:text-xl font-bold text-ink-light tracking-tight">{title}</h3>
        {subtitle && <p className="text-xs text-ink-muted mt-1">{subtitle}</p>}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-canvas-border bg-canvas-dark text-[11px] font-mono text-ink-muted uppercase tracking-wider">
              <th className="py-3 px-4 w-1/4">System Dimension</th>
              <th className="py-3 px-4 w-1/3 text-accent-netflix">Netflix (Read-Heavy / AP)</th>
              <th className="py-3 px-4 w-1/3 text-accent-bms">BookMyShow (Write-Contended / CP)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-canvas-border/60 text-xs leading-relaxed">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-canvas-elevated/30 transition-colors">
                <td className="py-4 px-4 align-top">
                  <span className="font-semibold text-ink-light font-mono block text-sm mb-1">
                    {item.dimension}
                  </span>
                  <div className="text-[11px] text-ink-muted flex items-start gap-1 mt-1 bg-canvas-dark/60 p-2 rounded border border-canvas-borderSubtle">
                    <AlertCircle className="w-3.5 h-3.5 text-accent-cyan shrink-0 mt-0.5" />
                    <span>{item.underlyingConstraint}</span>
                  </div>
                </td>
                <td className="py-4 px-4 align-top text-ink-light/90 space-y-2">
                  <p>{item.netflixApproach}</p>
                </td>
                <td className="py-4 px-4 align-top text-ink-light/90 space-y-2">
                  <p>{item.bookmyshowApproach}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
