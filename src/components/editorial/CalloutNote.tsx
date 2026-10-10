import React from 'react';
import { Info, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';

interface CalloutNoteProps {
  type?: 'note' | 'evidence' | 'inference' | 'caveat';
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const CalloutNote: React.FC<CalloutNoteProps> = ({
  type = 'note',
  title,
  children,
  className = '',
}) => {
  const configs = {
    note: {
      border: 'border-canvas-border',
      bg: 'bg-canvas-surface/80',
      iconColor: 'text-accent-cyan',
      icon: Info,
      defaultTitle: 'Architectural Note',
    },
    evidence: {
      border: 'border-emerald-500/30',
      bg: 'bg-emerald-950/20',
      iconColor: 'text-emerald-400',
      icon: CheckCircle2,
      defaultTitle: 'Empirical Evidence & Sources',
    },
    inference: {
      border: 'border-amber-500/30',
      bg: 'bg-amber-950/20',
      iconColor: 'text-amber-400',
      icon: AlertTriangle,
      defaultTitle: 'Reasoned Deductive Chain',
    },
    caveat: {
      border: 'border-accent-rose/30',
      bg: 'bg-rose-950/20',
      iconColor: 'text-rose-400',
      icon: ShieldAlert,
      defaultTitle: 'Operational Failure Boundary',
    },
  };

  const config = configs[type];
  const IconComponent = config.icon;

  return (
    <aside
      className={`my-6 rounded-lg border p-4 sm:p-5 ${config.border} ${config.bg} text-ink-light ${className}`}
      role="complementary"
    >
      <div className="flex items-center gap-2.5 mb-2 font-mono text-xs uppercase tracking-wider font-semibold">
        <IconComponent className={`w-4 h-4 ${config.iconColor}`} />
        <span className={config.iconColor}>{title || config.defaultTitle}</span>
      </div>
      <div className="text-sm leading-relaxed text-ink-light/90 space-y-2">
        {children}
      </div>
    </aside>
  );
};
