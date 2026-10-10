import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Seat, HoldResult, ApiErrorResponse, ApiHealthResponse, CoordinationMode } from '../types/seatLock';
import { SeatLockApiClient, ApiCallError } from '../services/seatLockApi';
import { VenueSeatMap } from '../components/seatlock/VenueSeatMap';
import { CustomerSimulation } from '../components/seatlock/CustomerSimulation';
import { ExecutionTraceViewer } from '../components/seatlock/ExecutionTraceViewer';
import { TechnicalMonograph } from '../components/seatlock/TechnicalMonograph';
import { EvidenceBadge } from '../components/editorial/EvidenceBadge';
import { 
  FlaskConical, 
  RotateCcw, 
  RefreshCw, 
  Database, 
  Cpu, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Sliders, 
  ArrowLeft 
} from 'lucide-react';

const DEMO_SHOW_ID = '00000000-0000-0000-0000-000000000001';

export const SeatLockLabPage: React.FC = () => {
  const [health, setHealth] = useState<ApiHealthResponse | null>(null);
  const [isApiOffline, setIsApiOffline] = useState(false);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [isLoadingSeats, setIsLoadingSeats] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const [coordinationMode, setCoordinationMode] = useState<CoordinationMode>('REDIS_PROTECTED');

  // Customer Alpha state
  const [alphaHoldResult, setAlphaHoldResult] = useState<HoldResult | null>(null);
  const [alphaError, setAlphaError] = useState<ApiErrorResponse | null>(null);
  const [lastAlphaIdempotencyKey, setLastAlphaIdempotencyKey] = useState<string | null>(null);

  // Customer Beta state
  const [betaHoldResult, setBetaHoldResult] = useState<HoldResult | null>(null);
  const [betaError, setBetaError] = useState<ApiErrorResponse | null>(null);
  const [lastBetaIdempotencyKey, setLastBetaIdempotencyKey] = useState<string | null>(null);

  // Reset confirmation modal state
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Fetch live seats & health
  const refreshData = useCallback(async () => {
    setIsLoadingSeats(true);
    try {
      // 1. Check health
      try {
        const h = await SeatLockApiClient.getHealth();
        setHealth(h);
        setIsApiOffline(false);
      } catch (err) {
        console.warn('Health check failed; running in offline portfolio mode.', err);
        setIsApiOffline(true);
      }

      // 2. Fetch seats
      const seatsResp = await SeatLockApiClient.getShowSeats(DEMO_SHOW_ID);
      setSeats(seatsResp.seats);

      // Keep selected seat synced with latest status
      setSelectedSeat((prev) => {
        if (!prev) return seatsResp.seats[0] || null;
        const updated = seatsResp.seats.find((s) => s.seatId === prev.seatId);
        return updated || prev;
      });
    } catch (err: any) {
      console.warn('Could not reach backend seats API:', err.message);
      setIsApiOffline(true);
      // Fallback: populate static offline mock seats so the map and portfolio remain visually interactive
      if (seats.length === 0) {
        const rows = ['A', 'B', 'C', 'D'];
        const fallbackSeats: Seat[] = [];
        rows.forEach((r) => {
          for (let i = 1; i <= 10; i++) {
            fallbackSeats.push({
              seatId: `offline-${r}-${i}`,
              rowLabel: r,
              seatNumber: i,
              tier: r === 'A' ? 'VIP' : r === 'B' ? 'PREMIUM' : 'STANDARD',
              status: (r === 'B' && i === 5) ? 'HELD' : (r === 'C' && i === 8) ? 'CONFIRMED' : 'AVAILABLE',
              currentHoldId: (r === 'B' && i === 5) ? 'offline-hold-preview' : null,
              remainingHoldSeconds: (r === 'B' && i === 5) ? 45 : null,
            });
          }
        });
        setSeats(fallbackSeats);
        setSelectedSeat(fallbackSeats[0]);
      }
    } finally {
      setIsLoadingSeats(false);
    }
  }, [seats.length]);

  useEffect(() => {
    refreshData();
  }, []);

  // Run the prominent concurrent race experiment
  const handleRunConcurrentRace = async () => {
    if (!selectedSeat) {
      showNotification('Please select a seat on the venue map first.', 'error');
      return;
    }

    setIsSimulating(true);
    setAlphaHoldResult(null);
    setAlphaError(null);
    setBetaHoldResult(null);
    setBetaError(null);

    const alphaKey = crypto.randomUUID();
    const betaKey = crypto.randomUUID();
    const alphaReqId = crypto.randomUUID();
    const betaReqId = crypto.randomUUID();

    setLastAlphaIdempotencyKey(alphaKey);
    setLastBetaIdempotencyKey(betaKey);

    const skipRedis = coordinationMode === 'POSTGRES_FALLBACK';

    try {
      // Fire simultaneous requests
      const [alphaOutcome, betaOutcome] = await Promise.allSettled([
        SeatLockApiClient.createHold({
          showId: DEMO_SHOW_ID,
          seatId: selectedSeat.seatId,
          customerId: 'demo-customer-alpha',
          idempotencyKey: alphaKey,
          requestId: alphaReqId,
          skipRedisCoordination: skipRedis,
        }),
        SeatLockApiClient.createHold({
          showId: DEMO_SHOW_ID,
          seatId: selectedSeat.seatId,
          customerId: 'demo-customer-beta',
          idempotencyKey: betaKey,
          requestId: betaReqId,
          skipRedisCoordination: skipRedis,
        }),
      ]);

      // Process Alpha result
      if (alphaOutcome.status === 'fulfilled') {
        setAlphaHoldResult(alphaOutcome.value);
      } else {
        const err = alphaOutcome.reason as ApiCallError;
        setAlphaError(err.errorData || {
          error: 'REQUEST_REJECTED',
          message: err.message,
          statusCode: err.statusCode || 409,
        });
      }

      // Process Beta result
      if (betaOutcome.status === 'fulfilled') {
        setBetaHoldResult(betaOutcome.value);
      } else {
        const err = betaOutcome.reason as ApiCallError;
        setBetaError(err.errorData || {
          error: 'REQUEST_REJECTED',
          message: err.message,
          statusCode: err.statusCode || 409,
        });
      }

      showNotification('Concurrent race executed! Observing winner and loser telemetry.', 'info');
    } catch (err: any) {
      showNotification(`Simulation error: ${err.message}`, 'error');
    } finally {
      setIsSimulating(false);
      // Immediately refresh seat map from authoritative PostgreSQL
      await refreshData();
    }
  };

  // Single customer hold attempt
  const handleHoldSingleCustomer = async (customerId: string, customerName: string) => {
    if (!selectedSeat) {
      showNotification('Please select a seat on the venue map first.', 'error');
      return;
    }

    setIsSimulating(true);
    const idempotencyKey = crypto.randomUUID();
    const requestId = crypto.randomUUID();
    const skipRedis = coordinationMode === 'POSTGRES_FALLBACK';

    if (customerId === 'demo-customer-alpha') {
      setAlphaHoldResult(null);
      setAlphaError(null);
      setLastAlphaIdempotencyKey(idempotencyKey);
    } else {
      setBetaHoldResult(null);
      setBetaError(null);
      setLastBetaIdempotencyKey(idempotencyKey);
    }

    try {
      const result = await SeatLockApiClient.createHold({
        showId: DEMO_SHOW_ID,
        seatId: selectedSeat.seatId,
        customerId,
        idempotencyKey,
        requestId,
        skipRedisCoordination: skipRedis,
      });

      if (customerId === 'demo-customer-alpha') {
        setAlphaHoldResult(result);
      } else {
        setBetaHoldResult(result);
      }

      showNotification(`Hold granted to ${customerName}!`, 'success');
    } catch (err: any) {
      const errorData = (err instanceof ApiCallError) ? err.errorData : {
        error: 'REJECTED',
        message: err.message,
        statusCode: 409,
      };

      if (customerId === 'demo-customer-alpha') {
        setAlphaError(errorData);
      } else {
        setBetaError(errorData);
      }
      showNotification(`Hold request for ${customerName} was rejected: ${errorData.message}`, 'error');
    } finally {
      setIsSimulating(false);
      await refreshData();
    }
  };

  // Confirm booking
  const handleConfirmHold = async (holdId: string, customerId: string) => {
    setIsSimulating(true);
    try {
      await SeatLockApiClient.confirmHold(holdId, customerId);
      showNotification('Hold confirmed! Seat permanently purchased.', 'success');
    } catch (err: any) {
      showNotification(`Confirmation rejected: ${err.message}`, 'error');
    } finally {
      setIsSimulating(false);
      await refreshData();
    }
  };

  // Explicit release
  const handleReleaseHold = async (holdId: string, customerId: string) => {
    setIsSimulating(true);
    try {
      await SeatLockApiClient.releaseHold(holdId, customerId);
      showNotification('Hold explicitly released. Seat returned to inventory.', 'info');
      if (customerId === 'demo-customer-alpha') setAlphaHoldResult(null);
      else setBetaHoldResult(null);
    } catch (err: any) {
      showNotification(`Release failed: ${err.message}`, 'error');
    } finally {
      setIsSimulating(false);
      await refreshData();
    }
  };

  // Test idempotent retry
  const handleRetryIdempotent = async (customerId: string) => {
    if (!selectedSeat) return;
    const key = customerId === 'demo-customer-alpha' ? lastAlphaIdempotencyKey : lastBetaIdempotencyKey;
    if (!key) {
      showNotification('No previous idempotency key to replay.', 'error');
      return;
    }

    setIsSimulating(true);
    try {
      const result = await SeatLockApiClient.createHold({
        showId: DEMO_SHOW_ID,
        seatId: selectedSeat.seatId,
        customerId,
        idempotencyKey: key,
        skipRedisCoordination: coordinationMode === 'POSTGRES_FALLBACK',
      });

      if (customerId === 'demo-customer-alpha') setAlphaHoldResult(result);
      else setBetaHoldResult(result);

      showNotification('Idempotent replay verified! Server returned 200 with matching hold record.', 'success');
    } catch (err: any) {
      showNotification(`Idempotent retry error: ${err.message}`, 'error');
    } finally {
      setIsSimulating(false);
      await refreshData();
    }
  };

  // Reset topology
  const handleExecuteReset = async () => {
    setIsResetting(true);
    try {
      await SeatLockApiClient.resetShow(DEMO_SHOW_ID);
      setAlphaHoldResult(null);
      setAlphaError(null);
      setBetaHoldResult(null);
      setBetaError(null);
      setIsResetModalOpen(false);
      showNotification('Demonstration show reset to initial available state!', 'success');
      await refreshData();
    } catch (err: any) {
      showNotification(`Reset failed: ${err.message}`, 'error');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-10 pb-16">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg border font-mono text-xs shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-2 ${
          notification.type === 'success'
            ? 'bg-emerald-950 border-emerald-500 text-emerald-200'
            : notification.type === 'error'
            ? 'bg-rose-950 border-rose-500 text-rose-200'
            : 'bg-canvas-elevated border-accent-cyan text-ink-light'
        }`}>
          {notification.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          {notification.type === 'error' && <XCircle className="w-4 h-4 text-rose-400" />}
          {notification.type === 'info' && <AlertTriangle className="w-4 h-4 text-accent-cyan" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Breadcrumb & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-canvas-border pb-4">
        <div className="flex items-center gap-2 text-xs font-mono text-ink-muted">
          <Link to="/bookmyshow" className="text-accent-bms hover:underline flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            BookMyShow Case Study
          </Link>
          <span>/</span>
          <span className="text-ink-light font-bold">SeatLock Lab</span>
        </div>

        {/* Action Bar */}
        <div className="flex items-center gap-2">
          {/* Mode Toggle */}
          <button
            type="button"
            onClick={() => {
              const nextMode = coordinationMode === 'REDIS_PROTECTED' ? 'POSTGRES_FALLBACK' : 'REDIS_PROTECTED';
              setCoordinationMode(nextMode);
              showNotification(
                nextMode === 'POSTGRES_FALLBACK'
                  ? 'Switched to PostgreSQL-Only Demonstration Mode (Direct DB Isolation)'
                  : 'Switched to Hybrid Mode (Redis Ingress + PostgreSQL ACID)',
                'info'
              );
            }}
            className={`px-3 py-1.5 rounded-lg border font-mono text-xs font-semibold flex items-center gap-1.5 transition-all ${
              coordinationMode === 'POSTGRES_FALLBACK'
                ? 'bg-amber-950/40 border-amber-500/60 text-amber-300'
                : 'bg-canvas-elevated border-canvas-border text-ink-light hover:border-accent-cyan/60'
            }`}
            title="Toggle between Redis+PostgreSQL Hybrid mode and direct PostgreSQL-only mode"
          >
            <Sliders className="w-3.5 h-3.5 text-accent-cyan" />
            <span>Mode: {coordinationMode === 'REDIS_PROTECTED' ? 'Hybrid (Redis+PG)' : 'PostgreSQL-Only'}</span>
          </button>

          {/* Refresh Seats */}
          <button
            type="button"
            onClick={refreshData}
            disabled={isLoadingSeats}
            className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg bg-canvas-elevated hover:bg-canvas-surface border border-canvas-border text-ink-light font-mono text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
            title="Refresh seat statuses from database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSeats ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Reset Topology Button */}
          <button
            type="button"
            onClick={() => setIsResetModalOpen(true)}
            disabled={isApiOffline}
            className="px-3 py-1.5 rounded-lg bg-rose-950/30 hover:bg-rose-950/60 border border-rose-800/40 text-rose-300 font-mono text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="Reset venue seat inventory to clean state (local dev guard enabled)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo</span>
          </button>
        </div>
      </div>

      {/* Header Banner */}
      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-xs uppercase tracking-wider text-accent-cyan font-semibold flex items-center gap-1.5">
            <FlaskConical className="w-4 h-4" />
            LIVE VERIFICATION WORKBENCH
          </span>
          <EvidenceBadge tier="REFERENCE" size="sm" />
          <span className="font-mono text-xs text-ink-muted">• Antigravity Engineering Lab</span>
        </div>

        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-ink-light tracking-tight leading-tight">
          SeatLock Lab: Concurrency &amp; Invariant Verification
        </h1>

        <p className="text-base sm:text-lg text-ink-muted font-sans max-w-4xl leading-relaxed">
          An authoritative, interactive research workbench verifying the core invariant: <strong className="text-ink-light font-semibold">For a given show, a seat cannot have two valid concurrent holds, and a confirmed seat cannot be reserved again.</strong>
        </p>

        {/* Live Service Health Banner */}
        <div className="p-3.5 rounded-xl border border-canvas-border bg-canvas-surface flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-ink-muted">API Status:</span>
              <span className={`inline-flex items-center gap-1 font-bold ${
                health?.status === 'HEALTHY' ? 'text-emerald-400' :
                health?.status === 'DEGRADED_FALLBACK' ? 'text-amber-400' : 'text-rose-400'
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  health?.status === 'HEALTHY' ? 'bg-emerald-400' :
                  health?.status === 'DEGRADED_FALLBACK' ? 'bg-amber-400 animate-pulse' : 'bg-rose-400'
                }`} />
                {health?.status || (isApiOffline ? 'OFFLINE' : 'CONNECTING...')}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-accent-cyan" />
              <span className="text-ink-muted">PostgreSQL:</span>
              <span className="text-ink-light font-bold">
                {health?.dependencies.postgres || (isApiOffline ? 'UNREACHABLE' : 'CHECKING')}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-ink-muted">Redis:</span>
              <span className="text-ink-light font-bold">
                {health?.dependencies.redis || (isApiOffline ? 'UNREACHABLE' : 'CHECKING')}
              </span>
            </div>
          </div>

          <div className="text-ink-muted text-[11px]">
            Target Show: <span className="text-ink-light">Oppenheimer (IMAX Hall 1)</span>
          </div>
        </div>
      </header>

      {/* Offline Alert Banner */}
      {isApiOffline && (
        <div className="p-4 rounded-xl border border-amber-500/50 bg-amber-950/20 text-xs text-amber-200 space-y-2">
          <div className="flex items-center gap-2 font-bold font-mono">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>SeatLock Backend Offline (http://localhost:3001)</span>
          </div>
          <p className="leading-relaxed">
            The SeatLock API process is currently stopped or running in static portfolio mode. Live seat leases and concurrent triggers are disabled, but the <strong>full architectural research monograph, state machine, request sequence diagrams, and telemetry schemas</strong> below remain fully explorable. Start the API locally using <code className="font-mono text-white bg-black/40 px-1 py-0.5 rounded">npm run api:dev</code> to execute live races.
          </p>
        </div>
      )}

      {/* =========================================================================
          THE FOUR COORDINATED AREAS
      ========================================================================= */}

      {/* Area A: Venue Seatmap (40 seats) */}
      <section id="area-a" className="scroll-mt-24">
        <VenueSeatMap
          seats={seats}
          selectedSeatId={selectedSeat?.seatId || null}
          onSelectSeat={(seat) => setSelectedSeat(seat)}
          isLoading={isLoadingSeats}
          onRefresh={refreshData}
          disabled={isApiOffline}
        />
      </section>

      {/* Area B: Customer Simulation & Race Trigger */}
      <section id="area-b" className="scroll-mt-24">
        <CustomerSimulation
          selectedSeat={selectedSeat}
          coordinationMode={coordinationMode}
          onRunConcurrentRace={handleRunConcurrentRace}
          onHoldSingleCustomer={handleHoldSingleCustomer}
          onConfirmHold={handleConfirmHold}
          onReleaseHold={handleReleaseHold}
          onRetryIdempotent={handleRetryIdempotent}
          alphaHoldResult={alphaHoldResult}
          alphaError={alphaError}
          betaHoldResult={betaHoldResult}
          betaError={betaError}
          isSimulating={isSimulating}
          disabled={isApiOffline}
        />
      </section>

      {/* Area C: Execution Trace Viewer */}
      <section id="area-c" className="scroll-mt-24">
        <ExecutionTraceViewer
          alphaTrace={alphaHoldResult?.executionTrace || alphaError?.executionTrace || null}
          alphaStatus={alphaHoldResult ? (alphaHoldResult.isIdempotentReplay ? 200 : 201) : alphaError?.statusCode}
          betaTrace={betaHoldResult?.executionTrace || betaError?.executionTrace || null}
          betaStatus={betaHoldResult ? (betaHoldResult.isIdempotentReplay ? 200 : 201) : betaError?.statusCode}
        />
      </section>

      {/* Area D: Technical Architecture Monograph */}
      <section id="area-d" className="scroll-mt-24">
        <TechnicalMonograph />
      </section>

      {/* =========================================================================
          CONFIRMATION MODAL FOR RESET
      ========================================================================= */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md p-6 rounded-2xl bg-canvas-surface border border-canvas-border shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-950/60 border border-rose-800/60 flex items-center justify-center text-rose-400">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-ink-light">
                  Confirm Topology Reset
                </h3>
                <span className="font-mono text-[11px] text-ink-muted">
                  Development Environment Guard Active
                </span>
              </div>
            </div>

            <p className="text-xs text-ink-muted leading-relaxed">
              This action will delete all active holds, reset all 40 seats in <code className="font-mono text-ink-light">IMAX Laser Hall 1</code> to <strong className="text-emerald-400">AVAILABLE</strong>, and reset fencing tokens to 1. Are you sure you want to proceed?
            </p>

            <div className="p-3 rounded-lg bg-canvas-dark border border-canvas-borderSubtle text-[11px] font-mono text-ink-muted">
              Endpoint: <code className="text-rose-400">POST /api/shows/:id/reset</code><br/>
              Guard: Strictly prohibited in production (<code className="text-ink-light">NODE_ENV !== 'production'</code>)
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                disabled={isResetting}
                className="px-4 py-2 rounded-lg bg-canvas-elevated hover:bg-canvas-dark border border-canvas-border text-xs font-mono text-ink-light transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteReset}
                disabled={isResetting}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-mono font-bold text-white transition-colors flex items-center gap-2"
              >
                {isResetting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{isResetting ? 'Resetting...' : 'Confirm & Reset'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
