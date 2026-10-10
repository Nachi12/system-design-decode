import React from 'react';
import { Seat, HoldResult, ApiErrorResponse, CoordinationMode } from '../../types/seatLock';
import { 
  Zap, 
  CheckCircle2, 
  XCircle, 
  Lock, 
  Unlock, 
  Repeat, 
  Clock 
} from 'lucide-react';

interface CustomerSimulationProps {
  selectedSeat: Seat | null;
  coordinationMode: CoordinationMode;
  onRunConcurrentRace: () => Promise<void>;
  onHoldSingleCustomer: (customerId: string, customerName: string) => Promise<void>;
  onConfirmHold: (holdId: string, customerId: string) => Promise<void>;
  onReleaseHold: (holdId: string, customerId: string) => Promise<void>;
  onRetryIdempotent: (customerId: string) => Promise<void>;
  alphaHoldResult: HoldResult | null;
  alphaError: ApiErrorResponse | null;
  betaHoldResult: HoldResult | null;
  betaError: ApiErrorResponse | null;
  isSimulating: boolean;
  disabled?: boolean;
}

export const CustomerSimulation: React.FC<CustomerSimulationProps> = ({
  selectedSeat,
  coordinationMode,
  onRunConcurrentRace,
  onHoldSingleCustomer,
  onConfirmHold,
  onReleaseHold,
  onRetryIdempotent,
  alphaHoldResult,
  alphaError,
  betaHoldResult,
  betaError,
  isSimulating,
  disabled = false,
}) => {

  const customerAlpha = {
    id: 'demo-customer-alpha',
    name: 'Customer Alpha',
    color: 'text-accent-cyan',
    badgeBg: 'bg-cyan-950/50 border-cyan-800/60 text-cyan-300',
    avatarBg: 'bg-accent-cyan/20 border-accent-cyan/40 text-accent-cyan',
  };

  const customerBeta = {
    id: 'demo-customer-beta',
    name: 'Customer Beta',
    color: 'text-accent-bms',
    badgeBg: 'bg-rose-950/50 border-rose-800/60 text-rose-300',
    avatarBg: 'bg-rose-500/20 border-rose-500/40 text-rose-300',
  };

  const renderOutcomeCard = (
    customer: typeof customerAlpha,
    result: HoldResult | null,
    error: ApiErrorResponse | null
  ) => {
    if (!result && !error) {
      return (
        <div className="p-4 rounded-lg bg-canvas-dark/60 border border-canvas-borderSubtle text-center text-ink-muted text-xs font-mono min-h-[140px] flex flex-col items-center justify-center">
          <Clock className="w-5 h-5 text-ink-muted/50 mb-1" />
          <span>No requests dispatched yet</span>
          <span className="text-[10px] text-ink-muted/70 mt-1">Select a seat and click an action below</span>
        </div>
      );
    }

    if (result) {
      const isReplay = result.isIdempotentReplay;
      return (
        <div className="p-4 rounded-lg bg-emerald-950/20 border border-emerald-500/50 text-xs space-y-2.5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {isReplay ? 'HTTP 200 OK (IDEMPOTENT REPLAY)' : 'HTTP 201 CREATED (HOLD ACQUIRED)'}
            </span>
            <span className="font-mono text-[10px] text-emerald-400/80 uppercase">
              {result.coordinationMode}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 font-mono text-[11px] pt-1 border-t border-emerald-900/40">
            <div>
              <span className="text-ink-muted block text-[10px]">Hold ID:</span>
              <span className="text-ink-light font-bold truncate block" title={result.hold.id}>
                {result.hold.id.slice(0, 13)}...
              </span>
            </div>
            <div>
              <span className="text-ink-muted block text-[10px]">Fencing Token:</span>
              <span className="text-accent-cyan font-bold block">
                #{result.hold.fencingToken}
              </span>
            </div>
            <div>
              <span className="text-ink-muted block text-[10px]">Expires In:</span>
              <span className="text-amber-300 font-bold block">
                {result.hold.remainingSeconds}s
              </span>
            </div>
            <div>
              <span className="text-ink-muted block text-[10px]">Target Seat:</span>
              <span className="text-ink-light font-bold block">
                {result.seat.rowLabel}-{result.seat.seatNumber} ({result.seat.tier})
              </span>
            </div>
          </div>

          {/* Action buttons for winner */}
          <div className="pt-2 border-t border-emerald-900/40 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onConfirmHold(result.hold.id, customer.id)}
              disabled={isSimulating || disabled}
              className="px-2.5 py-1 rounded bg-violet-600 hover:bg-violet-500 text-white font-mono text-[10px] font-semibold flex items-center gap-1 transition-colors"
            >
              <Lock className="w-3 h-3" />
              Confirm Booking
            </button>
            <button
              type="button"
              onClick={() => onReleaseHold(result.hold.id, customer.id)}
              disabled={isSimulating || disabled}
              className="px-2.5 py-1 rounded bg-canvas-elevated hover:bg-canvas-dark border border-canvas-border text-ink-light font-mono text-[10px] flex items-center gap-1 transition-colors"
            >
              <Unlock className="w-3 h-3" />
              Release Hold
            </button>
            <button
              type="button"
              onClick={() => onRetryIdempotent(customer.id)}
              disabled={isSimulating || disabled}
              className="px-2.5 py-1 rounded bg-canvas-elevated hover:bg-canvas-dark border border-canvas-border text-accent-cyan font-mono text-[10px] flex items-center gap-1 transition-colors"
              title="Submit duplicate request with exact same Idempotency-Key"
            >
              <Repeat className="w-3 h-3" />
              Test Retry
            </button>
          </div>
        </div>
      );
    }

    if (error) {
      const isContended = error.error === 'SEAT_LOCK_CONTENDED';

      return (
        <div className="p-4 rounded-lg bg-rose-950/20 border border-rose-500/50 text-xs space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 font-mono font-bold text-rose-400 bg-rose-950/60 border border-rose-800/60 px-2 py-0.5 rounded text-[11px]">
              <XCircle className="w-3.5 h-3.5" />
              HTTP {error.statusCode} CONFLICT ({error.error})
            </span>
            <span className="font-mono text-[10px] text-rose-400/80 uppercase">
              {error.coordinationMode || coordinationMode}
            </span>
          </div>

          <p className="text-ink-light text-xs leading-relaxed pt-1">
            {error.message}
          </p>

          <div className="p-2 rounded bg-canvas-dark/80 border border-rose-900/30 text-[11px] font-mono space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-ink-muted">Protection Layer:</span>
              <span className="text-ink-light font-bold">
                {isContended ? '⚡ Redis Ingress Coordination Lock' : '🛡️ PostgreSQL Row-Level Lock (FOR UPDATE)'}
              </span>
            </div>
            {error.requestId && (
              <div className="flex items-center justify-between">
                <span className="text-ink-muted">Request ID:</span>
                <span className="text-ink-muted truncate max-w-[150px]">{error.requestId.slice(0, 8)}...</span>
              </div>
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="rounded-xl border border-canvas-border bg-canvas-surface p-5 sm:p-6 shadow-xl space-y-6">
      {/* Customer Simulation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-canvas-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-accent-bms uppercase tracking-widest font-semibold">
              AREA B // CONCURRENCY SIMULATION
            </span>
            <span className="text-ink-muted text-xs">•</span>
            <span className="font-mono text-xs text-ink-muted">Independent Competing Clients</span>
          </div>
          <h3 className="font-serif text-xl sm:text-2xl font-bold text-ink-light tracking-tight mt-0.5">
            Two-Customer Concurrent Booking Experiment
          </h3>
        </div>

        {/* Selected Seat Indicator */}
        <div className="flex items-center gap-2">
          {selectedSeat ? (
            <span className="font-mono text-xs px-2.5 py-1 rounded bg-canvas-elevated border border-canvas-border text-ink-light flex items-center gap-1.5">
              <span>Target:</span>
              <span className="font-bold text-accent-cyan">
                Seat {selectedSeat.rowLabel}-{selectedSeat.seatNumber}
              </span>
            </span>
          ) : (
            <span className="font-mono text-xs px-2.5 py-1 rounded bg-amber-950/40 border border-amber-800/40 text-amber-300">
              ⚠️ Please click a seat in Area A
            </span>
          )}
        </div>
      </div>

      {/* Prominent Concurrent Race Trigger Button */}
      <div className="p-4 rounded-xl border border-accent-bms/40 bg-gradient-to-r from-accent-bms/10 via-canvas-elevated to-canvas-surface space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="font-sans font-bold text-base text-ink-light flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              Simulate Concurrent Booking Race (Flash-Sale Contention)
            </h4>
            <p className="text-xs text-ink-muted max-w-2xl leading-relaxed">
              Dispatches two simultaneous, non-blocking requests for the exact same seat from Customer Alpha and Customer Beta with distinct idempotency keys using <code className="font-mono text-ink-light">Promise.allSettled()</code>.
            </p>
          </div>

          <button
            type="button"
            onClick={onRunConcurrentRace}
            disabled={!selectedSeat || isSimulating || disabled}
            className={`px-5 py-3 rounded-lg font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shrink-0 shadow-lg ${
              !selectedSeat || isSimulating || disabled
                ? 'bg-canvas-elevated text-ink-muted border border-canvas-border cursor-not-allowed'
                : 'bg-gradient-to-r from-accent-bms to-rose-600 hover:from-rose-600 hover:to-accent-bms text-white shadow-rose-950/50 hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            <Zap className={`w-4 h-4 ${isSimulating ? 'animate-spin' : ''}`} />
            <span>{isSimulating ? 'Executing Race...' : 'Simulate Concurrent Booking'}</span>
          </button>
        </div>

        {/* Coordination explanation bar */}
        <div className="pt-2 border-t border-canvas-borderSubtle flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-ink-muted">
          <span>
            Active Invariant Path: <span className="text-ink-light font-semibold">
              {coordinationMode === 'REDIS_PROTECTED' ? 'Redis SET NX PX Ingress Lock + PostgreSQL Row Lock' : 'PostgreSQL Direct Isolation (Bypass Redis Ingress)'}
            </span>
          </span>
          <span className="text-accent-cyan">At most 1 hold will be granted</span>
        </div>
      </div>

      {/* Customer Alpha vs Beta Two-Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Customer Alpha Column */}
        <div className="p-4 rounded-xl border border-canvas-border bg-canvas-dark/60 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${customerAlpha.avatarBg} border`}>
                α
              </div>
              <div>
                <span className="font-sans font-bold text-sm text-ink-light block">
                  {customerAlpha.name}
                </span>
                <span className="font-mono text-[10px] text-ink-muted">
                  ID: {customerAlpha.id}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onHoldSingleCustomer(customerAlpha.id, customerAlpha.name)}
              disabled={!selectedSeat || isSimulating || disabled}
              className="px-3 py-1.5 rounded bg-accent-cyan/10 hover:bg-accent-cyan/20 border border-accent-cyan/30 text-accent-cyan font-mono text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Hold as Alpha
            </button>
          </div>

          {/* Outcome Card */}
          {renderOutcomeCard(customerAlpha, alphaHoldResult, alphaError)}
        </div>

        {/* Customer Beta Column */}
        <div className="p-4 rounded-xl border border-canvas-border bg-canvas-dark/60 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${customerBeta.avatarBg} border`}>
                β
              </div>
              <div>
                <span className="font-sans font-bold text-sm text-ink-light block">
                  {customerBeta.name}
                </span>
                <span className="font-mono text-[10px] text-ink-muted">
                  ID: {customerBeta.id}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onHoldSingleCustomer(customerBeta.id, customerBeta.name)}
              disabled={!selectedSeat || isSimulating || disabled}
              className="px-3 py-1.5 rounded bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-mono text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Hold as Beta
            </button>
          </div>

          {/* Outcome Card */}
          {renderOutcomeCard(customerBeta, betaHoldResult, betaError)}
        </div>
      </div>
    </div>
  );
};
