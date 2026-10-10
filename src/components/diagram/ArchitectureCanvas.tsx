import React, { useState, useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  BackgroundVariant,
  NodeMouseHandler,
} from '@xyflow/react';
import { ArchitectureNodeData } from '../../types';
import { CustomNode } from './CustomNode';
import { NodeInspector } from './NodeInspector';
import { Layers, Info, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';

interface ArchitectureCanvasProps {
  title: string;
  subtitle?: string;
  explanation: string;
  initialNodes: Node<ArchitectureNodeData>[];
  initialEdges: Edge[];
  height?: string;
  className?: string;
}

export const ArchitectureCanvas: React.FC<ArchitectureCanvasProps> = ({
  title,
  subtitle,
  explanation,
  initialNodes,
  initialEdges,
  height = 'h-[620px]',
  className = '',
}) => {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNodeData, setSelectedNodeData] = useState<ArchitectureNodeData | null>(null);

  const nodeTypes = useMemo(() => ({ customNode: CustomNode }), []);

  const onNodeClick: NodeMouseHandler = useCallback((_, node) => {
    setSelectedNodeData((node.data as ArchitectureNodeData) || null);
  }, []);

  return (
    <div className={`relative rounded-xl border border-canvas-border bg-canvas-dark overflow-hidden flex flex-col shadow-2xl ${className}`}>
      {/* Canvas Header & Meta */}
      <div className="p-4 sm:p-5 border-b border-canvas-border bg-canvas-surface/90 backdrop-blur-sm z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs uppercase tracking-wider text-accent-cyan flex items-center gap-1.5 font-semibold">
              <Layers className="w-3.5 h-3.5" /> Interactive Architectural Schematic
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-ink-light tracking-tight">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs font-mono text-ink-muted mt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] font-mono border-t lg:border-t-0 border-canvas-border pt-2 lg:pt-0">
          <span className="text-ink-muted uppercase">Legend:</span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-300">
            <CheckCircle2 className="w-3 h-3" /> Documented
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-950/60 border border-amber-500/30 text-amber-300">
            <AlertTriangle className="w-3 h-3" /> Inferred
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-950/60 border border-purple-500/30 text-purple-300">
            <Sparkles className="w-3 h-3" /> Ref Design
          </span>
        </div>
      </div>

      {/* Explanation Banner */}
      <div className="px-4 py-2.5 bg-canvas-elevated/40 border-b border-canvas-borderSubtle text-xs text-ink-muted flex items-start gap-2">
        <Info className="w-4 h-4 text-accent-cyan shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          {explanation} Click any service component to inspect its latency budget, data inputs/outputs, and empirical evidence status.
        </p>
      </div>

      {/* Interactive Diagram Area */}
      <div className={`relative w-full ${height} bg-canvas-dark`}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          minZoom={0.3}
          maxZoom={1.5}
          proOptions={{ hideAttribution: true }}
          aria-label={title}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={24}
            size={1.5}
            color="#242F46"
          />
          <Controls
            showInteractive={false}
            className="!bg-canvas-surface !border-canvas-border"
          />
        </ReactFlow>

        {/* Selected Node Details Drawer */}
        <NodeInspector
          nodeData={selectedNodeData}
          onClose={() => setSelectedNodeData(null)}
        />
      </div>

      {/* Bottom Hint Bar */}
      <div className="px-4 py-2 bg-canvas-surface/80 border-t border-canvas-border text-[11px] font-mono text-ink-muted flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <span className="hidden sm:inline">Use mouse scroll or trackpad gestures to pan & zoom. Click nodes to inspect.</span>
        <span className="sm:hidden">Tap nodes to inspect details. Pinch to zoom.</span>
        <span className="text-accent-cyan/80">60 FPS Hardware-Accelerated SVG</span>
      </div>
    </div>
  );
};
