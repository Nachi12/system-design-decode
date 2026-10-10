import React from 'react';
import { EvidenceTier } from '../../types';

interface EvidenceBadgeProps {
  tier: EvidenceTier;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showIcon?: boolean;
}

export const EvidenceBadge: React.FC<EvidenceBadgeProps> = ({
  tier,
  size = 'md',
  className = '',
  showIcon = true,
}) => {
  const configs: Record<EvidenceTier, { label: string; bg: string; border: string; text: string; icon: string }> = {
    DOCUMENTED: {
      label: 'Publicly Documented',
      bg: 'bg-emerald-950/60',
      border: 'border-emerald-500/40',
      text: 'text-emerald-300',
      icon: '✓'
    },
    INFERENCE: {
      label: 'Reasoned Inference',
      bg: 'bg-amber-950/60',
      border: 'border-amber-500/40',
      text: 'text-amber-300',
      icon: '≈'
    },
    REFERENCE: {
      label: 'Proposed Reference Design',
      bg: 'bg-purple-950/60',
      border: 'border-purple-500/40',
      text: 'text-purple-300',
      icon: '◈'
    },
    ASSUMPTION: {
      label: 'Illustrative Assumption',
      bg: 'bg-blue-950/60',
      border: 'border-blue-500/40',
      text: 'text-blue-300',
      icon: '◬'
    }
  };

  const config = configs[tier];

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2',
  }[size];

  return (
    <span
      className={`inline-flex items-center font-mono uppercase tracking-wider rounded-md border font-medium ${config.bg} ${config.border} ${config.text} ${sizeClasses} ${className}`}
      title={`Certainty tier: ${config.label}`}
    >
      {showIcon && <span className="font-bold opacity-80">{config.icon}</span>}
      <span>[{config.label}]</span>
    </span>
  );
};
