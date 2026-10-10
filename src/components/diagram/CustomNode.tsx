import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { ArchitectureNodeData } from '../../types';
import { 
  Tv, 
  ShieldCheck, 
  Cpu, 
  Activity, 
  HardDrive, 
  Database, 
  ExternalLink,
  Layers
} from 'lucide-react';

export const CustomNode: React.FC<NodeProps<Node<ArchitectureNodeData>>> = ({ data, selected }) => {
  const getCategoryIcon = (category: ArchitectureNodeData['category']) => {
    switch (category) {
      case 'client':
        return <Tv className="w-4 h-4 text-accent-cyan" />;
      case 'gateway':
        return <ShieldCheck className="w-4 h-4 text-accent-violet" />;
      case 'compute':
        return <Cpu className="w-4 h-4 text-emerald-400" />;
      case 'stream':
        return <Activity className="w-4 h-4 text-amber-400" />;
      case 'cache':
        return <HardDrive className="w-4 h-4 text-accent-cyan" />;
      case 'storage':
        return <Database className="w-4 h-4 text-purple-400" />;
      case 'external':
        return <ExternalLink className="w-4 h-4 text-accent-rose" />;
      default:
        return <Layers className="w-4 h-4 text-slate-400" />;
    }
  };

  const getTierBadge = (tier: ArchitectureNodeData['tier']) => {
    switch (tier) {
      case 'DOCUMENTED':
        return (
          <span className="text-[10px] font-mono px-1.5 py-0.2 border rounded bg-emerald-950/70 text-emerald-300 border-emerald-500/40">
            DOC
          </span>
        );
      case 'INFERENCE':
        return (
          <span className="text-[10px] font-mono px-1.5 py-0.2 border rounded bg-amber-950/70 text-amber-300 border-amber-500/40">
            INF
          </span>
        );
      case 'REFERENCE':
        return (
          <span className="text-[10px] font-mono px-1.5 py-0.2 border rounded bg-purple-950/70 text-purple-300 border-purple-500/40">
            REF
          </span>
        );
    }
  };

  return (
    <div
      tabIndex={0}
      role="button"
      aria-label={`${data.label}: ${data.responsibility}`}
      className={`relative w-72 rounded-lg border bg-canvas-surface p-3.5 shadow-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-accent-violet ${
        selected
          ? 'border-accent-violet ring-2 ring-accent-violet/50 shadow-accent-violet/20'
          : 'border-canvas-border hover:border-canvas-border/80 hover:bg-canvas-elevated'
      }`}
    >
      {/* Target input handle (left) */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2.5 !h-2.5 !bg-accent-cyan !border-2 !border-canvas-surface !-left-1.5"
      />

      {/* Header bar */}
      <div className="flex items-center justify-between gap-2 border-b border-canvas-border/60 pb-2 mb-2">
        <div className="flex items-center gap-2">
          {getCategoryIcon(data.category)}
          <span className="text-[11px] font-mono uppercase tracking-wider text-ink-muted">
            {data.category}
          </span>
        </div>
        {getTierBadge(data.tier)}
      </div>

      {/* Node label and sublabel */}
      <div className="mb-2">
        <h4 className="font-semibold text-sm text-ink-light leading-snug tracking-tight">
          {data.label}
        </h4>
        {data.sublabel && (
          <p className="text-xs text-ink-muted mt-0.5 font-mono">
            {data.sublabel}
          </p>
        )}
      </div>

      {/* Tech stack badge */}
      <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pt-2 border-t border-canvas-border/40 text-[11px]">
        <span className="text-ink-muted text-[10px] font-mono">STACK:</span>
        <span className="font-mono text-ink-light/90 text-[11px] truncate max-w-[190px]">
          {data.techStack}
        </span>
      </div>

      {/* Latency SLA pill if present */}
      {data.latencySla && (
        <div className="mt-1.5 text-[10px] font-mono text-accent-cyan/90 bg-accent-cyan/10 px-2 py-0.5 rounded border border-accent-cyan/20 truncate">
          SLA: {data.latencySla}
        </div>
      )}

      {/* Source output handle (right) */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2.5 !h-2.5 !bg-accent-violet !border-2 !border-canvas-surface !-right-1.5"
      />
    </div>
  );
};
