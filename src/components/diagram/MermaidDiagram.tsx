import React, { useEffect, useRef, useState, useId } from 'react';
import mermaid from 'mermaid';
import { GitBranch, Info } from 'lucide-react';

interface MermaidDiagramProps {
  chart: string;
  title?: string;
  explanation?: string;
  className?: string;
}

export const MermaidDiagram: React.FC<MermaidDiagramProps> = ({
  chart,
  title,
  explanation,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const uniqueId = useId().replace(/:/g, '_');

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      themeVariables: {
        darkMode: true,
        background: '#0F1420',
        primaryColor: '#171E2E',
        primaryTextColor: '#F8FAFC',
        primaryBorderColor: '#6366F1',
        lineColor: '#06B6D4',
        secondaryColor: '#1A2234',
        tertiaryColor: '#080B11',
        noteBkgColor: '#171E2E',
        noteTextColor: '#94A3B8',
        noteBorderColor: '#242F46',
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '13px',
      },
      securityLevel: 'loose',
    });

    const renderChart = async () => {
      try {
        const { svg } = await mermaid.render(`mermaid_${uniqueId}`, chart);
        setSvgContent(svg);
        setError(null);
      } catch (err: unknown) {
        console.error('Mermaid render error:', err);
        setError(err instanceof Error ? err.message : 'Failed to render diagram');
      }
    };

    renderChart();
  }, [chart, uniqueId]);

  return (
    <div className={`my-6 rounded-xl border border-canvas-border bg-canvas-surface overflow-hidden shadow-xl ${className}`}>
      {/* Title & Header */}
      {title && (
        <div className="p-4 border-b border-canvas-border bg-canvas-elevated/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-accent-cyan" />
            <h4 className="font-semibold text-sm text-ink-light tracking-tight">{title}</h4>
          </div>
          <span className="text-[10px] font-mono text-ink-muted uppercase tracking-wider">
            Sequence / State Machine
          </span>
        </div>
      )}

      {/* Explanation */}
      {explanation && (
        <div className="px-4 py-2.5 bg-canvas-dark/60 border-b border-canvas-borderSubtle text-xs text-ink-muted flex items-start gap-2">
          <Info className="w-3.5 h-3.5 text-accent-cyan shrink-0 mt-0.5" />
          <p className="leading-relaxed">{explanation}</p>
        </div>
      )}

      {/* Rendered SVG Viewport */}
      <div className="p-5 overflow-x-auto flex justify-center bg-canvas-dark/40 min-h-[160px]">
        {error ? (
          <div className="text-rose-400 text-xs font-mono p-4 bg-rose-950/20 rounded border border-rose-500/20 w-full">
            Error rendering diagram: {error}
          </div>
        ) : (
          <div
            ref={containerRef}
            className="w-full flex justify-center [&>svg]:max-w-full [&>svg]:h-auto"
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        )}
      </div>
    </div>
  );
};
