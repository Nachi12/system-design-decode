import React, { useState, useMemo } from 'react';
import { CAPACITY_MODELS } from '../data/capacityModels';
import { EvidenceBadge } from '../components/editorial/EvidenceBadge';
import { 
  Calculator, 
  RotateCcw, 
  Sliders, 
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const CapacityPage: React.FC = () => {
  const [selectedModelId, setSelectedModelId] = useState<string>('netflix-homepage');

  const currentModel = useMemo(() => {
    return CAPACITY_MODELS.find(m => m.id === selectedModelId) || CAPACITY_MODELS[0];
  }, [selectedModelId]);

  // Store user-customized input state per model
  const [inputsState, setInputsState] = useState<Record<string, Record<string, number>>>(() => {
    const initial: Record<string, Record<string, number>> = {};
    CAPACITY_MODELS.forEach(model => {
      initial[model.id] = {};
      model.inputs.forEach(input => {
        initial[model.id][input.key] = input.defaultValue;
      });
    });
    return initial;
  });

  const currentInputs = inputsState[currentModel.id] || {};

  const handleInputChange = (key: string, value: number) => {
    setInputsState(prev => ({
      ...prev,
      [currentModel.id]: {
        ...prev[currentModel.id],
        [key]: value
      }
    }));
  };

  const handleReset = () => {
    setInputsState(prev => {
      const resetModelInputs: Record<string, number> = {};
      currentModel.inputs.forEach(input => {
        resetModelInputs[input.key] = input.defaultValue;
      });
      return {
        ...prev,
        [currentModel.id]: resetModelInputs
      };
    });
  };

  const calculatedOutput = useMemo(() => {
    return currentModel.calculate(currentInputs);
  }, [currentModel, currentInputs]);

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      {/* Header */}
      <header className="border-b border-canvas-border pb-8 space-y-4">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs uppercase tracking-wider text-accent-cyan font-semibold flex items-center gap-1.5">
            <Calculator className="w-3.5 h-3.5" /> ARCHITECTURAL SIZING NOTEBOOK
          </span>
          <span className="font-mono text-xs text-ink-muted">• Client-Side Quantitative Modeling</span>
        </div>

        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-ink-light tracking-tight leading-tight">
          Distributed Capacity &amp; Contention Notebook
        </h1>

        <p className="text-base sm:text-lg text-ink-muted leading-relaxed">
          Interactive capacity estimation models and sensitivity analyses for planetary-scale workloads. Explore client-side scenarios for memory footprints, ingress request rates, Amdahl&apos;s contention intensity, and edge bandwidth offload.
        </p>

        {/* Disclaimer Banner */}
        <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-950/20 flex items-start gap-3 text-xs">
          <EvidenceBadge tier="ASSUMPTION" size="sm" />
          <p className="text-ink-muted leading-relaxed">
            <strong className="text-blue-300">Illustrative Modeling Disclaimer:</strong> All quantitative numbers, user volumes, bitrates, and hardware parameters are representative engineering models created for distributed architectural analysis and interview preparation. They are never claimed to be confidential measured metrics of Netflix or BookMyShow.
          </p>
        </div>
      </header>

      {/* Model Selection Tabs */}
      <section className="space-y-4">
        <div className="flex flex-wrap gap-2 border-b border-canvas-border pb-3">
          {CAPACITY_MODELS.map(model => (
            <button
              key={model.id}
              onClick={() => setSelectedModelId(model.id)}
              className={`px-4 py-2 rounded-lg font-mono text-xs font-semibold transition-all flex items-center gap-2 ${
                selectedModelId === model.id
                  ? 'bg-canvas-elevated text-ink-light border border-canvas-border shadow-sm'
                  : 'text-ink-muted hover:text-ink-light hover:bg-canvas-surface border border-transparent'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${
                model.domain === 'netflix' ? 'bg-accent-netflix' : 'bg-accent-bms'
              }`} />
              <span>{model.title.split(':')[0]}</span>
            </button>
          ))}
        </div>

        {/* Model Title & Boundary Box */}
        <div className="p-5 rounded-xl border border-canvas-border bg-canvas-surface space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-ink-light">
              {currentModel.title}
            </h2>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded bg-canvas-elevated text-accent-cyan border border-canvas-borderSubtle">
                {currentModel.domain === 'netflix' ? 'Netflix Domain' : 'BookMyShow Domain'}
              </span>
              <button
                onClick={handleReset}
                className="text-xs font-mono text-accent-cyan hover:underline flex items-center gap-1"
                title="Reset sliders to model defaults"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Defaults</span>
              </button>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-ink-light/90 leading-relaxed font-sans">
            <strong>Engineering Objective:</strong> {currentModel.objective}
          </p>

          <div className="text-xs text-ink-muted font-mono pt-1">
            <strong>System Boundary:</strong> {currentModel.systemBoundary}
          </div>
        </div>
      </section>

      {/* Main Interactive Grid: Sliders on Left, Live Metrics on Right */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Interactive Input Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-6 p-5 rounded-xl border border-canvas-border bg-canvas-surface">
          <div className="flex items-center justify-between border-b border-canvas-borderSubtle pb-2">
            <h3 className="font-mono text-xs uppercase tracking-wider text-ink-light font-bold flex items-center gap-2">
              <Sliders className="w-4 h-4 text-accent-cyan" />
              <span>Scenario Input Parameters</span>
            </h3>
            <span className="text-[10px] font-mono text-ink-muted">Client-Side State</span>
          </div>

          <div className="space-y-5">
            {currentModel.inputs.map(input => {
              const val = currentInputs[input.key] ?? input.defaultValue;

              return (
                <div key={input.key} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-sans font-medium text-ink-light flex items-center gap-1">
                      <span>{input.name}</span>
                    </label>
                    <span className="font-mono text-accent-cyan font-bold">
                      {val.toLocaleString()} <span className="text-[10px] text-ink-muted">{input.unit}</span>
                    </span>
                  </div>

                  <input
                    type="range"
                    min={input.min}
                    max={input.max}
                    step={input.step}
                    value={val}
                    onChange={(e) => handleInputChange(input.key, parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-canvas-dark rounded-lg appearance-none cursor-pointer accent-accent-cyan"
                  />

                  <div className="flex justify-between text-[10px] font-mono text-ink-muted">
                    <span>{input.min.toLocaleString()}</span>
                    <span className="text-ink-muted/80">{input.description}</span>
                    <span>{input.max.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Real-Time Calculated Metrics (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-5 rounded-xl border border-canvas-border bg-canvas-surface space-y-4">
            <div className="flex items-center justify-between border-b border-canvas-borderSubtle pb-2">
              <h3 className="font-mono text-xs uppercase tracking-wider text-ink-light font-bold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Live Calculated Sizing Metrics</span>
              </h3>
              <span className="text-[10px] font-mono text-emerald-400">Zero-Latency React State</span>
            </div>

            {/* Metrics Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {calculatedOutput.metrics.map((metric, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border space-y-1 ${
                    metric.highlight
                      ? 'bg-accent-violet/10 border-accent-violet/50 shadow-sm'
                      : 'bg-canvas-dark border-canvas-borderSubtle'
                  }`}
                >
                  <span className="text-xs font-sans text-ink-muted block">
                    {metric.label}
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className={`text-xl sm:text-2xl font-mono font-bold ${
                      metric.highlight ? 'text-accent-violet' : 'text-ink-light'
                    }`}>
                      {metric.value}
                    </span>
                    <span className="text-[11px] font-mono text-ink-muted">
                      {metric.unit}
                    </span>
                  </div>
                  {metric.note && (
                    <span className="text-[10px] font-mono text-amber-400 block pt-0.5">
                      {metric.note}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Mathematical Formulations Reference */}
          <div className="p-5 rounded-xl border border-canvas-border bg-canvas-dark font-mono text-xs space-y-3">
            <span className="text-accent-cyan uppercase font-bold text-xs block border-b border-canvas-borderSubtle pb-2">
              Mathematical Derivations &amp; Formulas
            </span>
            <div className="space-y-3">
              {currentModel.formulas.map((form, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex items-center justify-between text-ink-light font-semibold">
                    <span>{form.name}:</span>
                    <code className="text-accent-violet text-[11px] bg-canvas-surface px-1.5 py-0.5 rounded border border-canvas-borderSubtle">
                      {form.equation}
                    </code>
                  </div>
                  <p className="text-[11px] text-ink-muted leading-relaxed font-sans">
                    {form.explanation}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Sensitivity Analysis Takeaways */}
          <div className="p-5 rounded-xl border border-canvas-border bg-canvas-surface space-y-2">
            <span className="font-mono text-xs uppercase tracking-wider text-emerald-400 font-bold block">
              Staff Architect Analytical Takeaways:
            </span>
            <ul className="space-y-1.5 text-xs text-ink-light/90 font-sans leading-relaxed">
              {calculatedOutput.takeaways.map((takeaway, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-accent-cyan font-bold">•</span>
                  <span>{takeaway}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

      </section>

      {/* Navigation Footer */}
      <div className="pt-6 border-t border-canvas-border flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link
          to="/adrs"
          className="text-xs font-mono text-ink-muted hover:text-ink-light transition-colors"
        >
          ← Previous: Architecture Decision Records (ADRs)
        </Link>
        <Link
          to="/comparison"
          className="px-4 py-2 rounded-lg bg-canvas-surface hover:bg-canvas-elevated border border-canvas-border text-ink-light text-xs font-sans font-medium flex items-center gap-2 transition-colors"
        >
          <span>Continue to Comparative Synthesis</span>
          <ArrowRight className="w-3.5 h-3.5 text-accent-cyan" />
        </Link>
      </div>
    </div>
  );
};
