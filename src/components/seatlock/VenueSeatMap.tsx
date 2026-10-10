import React, { useEffect, useState } from 'react';
import { Seat, SeatTier } from '../../types/seatLock';
import { Clock, Lock, RefreshCw } from 'lucide-react';

interface VenueSeatMapProps {
  seats: Seat[];
  selectedSeatId: string | null;
  onSelectSeat: (seat: Seat) => void;
  isLoading: boolean;
  onRefresh: () => void;
  disabled?: boolean;
}

export const VenueSeatMap: React.FC<VenueSeatMapProps> = ({
  seats,
  selectedSeatId,
  onSelectSeat,
  isLoading,
  onRefresh,
  disabled = false,
}) => {
  // Local timer ticks every second to update hold countdowns
  const [secondsTick, setSecondsTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsTick((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Group seats by row
  const rows = ['A', 'B', 'C', 'D'];
  const seatsByRow = rows.map((rowLabel) => ({
    rowLabel,
    seats: seats
      .filter((s) => s.rowLabel === rowLabel)
      .sort((a, b) => a.seatNumber - b.seatNumber),
  }));

  const getTierLabel = (tier: SeatTier) => {
    switch (tier) {
      case 'VIP':
        return 'VIP ($25)';
      case 'PREMIUM':
        return 'Premium ($18)';
      case 'STANDARD':
        return 'Standard ($12)';
      default:
        return tier;
    }
  };

  const getStatusBadge = (seat: Seat) => {
    const remaining = seat.remainingHoldSeconds !== null
      ? Math.max(0, seat.remainingHoldSeconds - secondsTick)
      : 0;

    switch (seat.status) {
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-violet-400 bg-violet-950/60 border border-violet-800/60 px-1.5 py-0.5 rounded">
            <Lock className="w-2.5 h-2.5" />
            SOLD
          </span>
        );
      case 'HELD':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-amber-400 bg-amber-950/60 border border-amber-800/60 px-1.5 py-0.5 rounded animate-pulse">
            <Clock className="w-2.5 h-2.5" />
            {remaining > 0 ? `${remaining}s` : 'EXPIRING'}
          </span>
        );
      case 'AVAILABLE':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-1.5 py-0.5 rounded">
            OPEN
          </span>
        );
    }
  };

  const getSeatStyling = (seat: Seat, isSelected: boolean) => {
    const base = 'relative p-2.5 rounded-lg border text-center transition-all flex flex-col items-center justify-between min-h-[68px] select-none';

    if (seat.status === 'CONFIRMED') {
      return `${base} bg-slate-900/80 border-slate-700/60 text-slate-400 cursor-not-allowed opacity-80`;
    }

    if (seat.status === 'HELD') {
      const selectedBorder = isSelected ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-canvas-dark' : '';
      return `${base} bg-amber-950/20 border-amber-600/60 text-amber-200 hover:border-amber-400 cursor-pointer ${selectedBorder}`;
    }

    // AVAILABLE
    const selectedBorder = isSelected
      ? 'ring-2 ring-accent-cyan ring-offset-2 ring-offset-canvas-dark border-accent-cyan bg-accent-cyan/10'
      : 'border-canvas-border hover:border-accent-cyan/60 hover:bg-canvas-elevated/80';
    return `${base} bg-canvas-surface text-ink-light cursor-pointer shadow-sm ${selectedBorder}`;
  };

  const availableCount = seats.filter((s) => s.status === 'AVAILABLE').length;
  const heldCount = seats.filter((s) => s.status === 'HELD').length;
  const confirmedCount = seats.filter((s) => s.status === 'CONFIRMED').length;

  return (
    <div className="rounded-xl border border-canvas-border bg-canvas-surface p-5 sm:p-6 shadow-xl space-y-6">
      {/* Venue Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-canvas-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-accent-cyan uppercase tracking-widest font-semibold">
              AREA A // SEAT INVENTORY TOPOLOGY
            </span>
            <span className="text-ink-muted text-xs">•</span>
            <span className="font-mono text-xs text-ink-muted">IMAX Laser Hall 1</span>
          </div>
          <h3 className="font-serif text-xl sm:text-2xl font-bold text-ink-light tracking-tight mt-0.5">
            Deterministic Venue Seatmap (40 Seats)
          </h3>
        </div>

        {/* Stats Pill Badges */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <div className="px-2.5 py-1 rounded bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Available: {availableCount}</span>
          </div>
          <div className="px-2.5 py-1 rounded bg-amber-950/40 border border-amber-800/40 text-amber-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>Held: {heldCount}</span>
          </div>
          <div className="px-2.5 py-1 rounded bg-violet-950/40 border border-violet-800/40 text-violet-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-violet-400" />
            <span>Confirmed: {confirmedCount}</span>
          </div>

          <button
            type="button"
            onClick={onRefresh}
            disabled={disabled || isLoading}
            className="p-1.5 rounded bg-canvas-elevated hover:bg-canvas-dark border border-canvas-border text-ink-muted hover:text-ink-light transition-colors"
            title="Refresh Seat Map"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Screen Curved Indicator */}
      <div className="relative py-2 text-center">
        <div className="mx-auto w-3/4 sm:w-1/2 h-2 bg-gradient-to-r from-transparent via-accent-cyan to-transparent rounded-full shadow-[0_0_15px_rgba(6,182,212,0.6)]" />
        <span className="font-mono text-[10px] uppercase tracking-widest text-accent-cyan/80 mt-1 block">
          CINEMA PROJECTION SCREEN
        </span>
      </div>

      {/* Seat Grid Layout */}
      <div className="space-y-4 pt-2 overflow-x-auto">
        {seatsByRow.map(({ rowLabel, seats: rowSeats }) => (
          <div key={rowLabel} className="flex items-center gap-3 min-w-[620px]">
            {/* Row Label Badge */}
            <div className="w-12 text-center shrink-0">
              <span className="font-mono text-xs font-bold text-ink-muted px-2 py-1 rounded bg-canvas-elevated border border-canvas-border">
                Row {rowLabel}
              </span>
              <span className="block font-mono text-[9px] text-ink-muted/70 mt-1">
                {rowSeats[0] ? getTierLabel(rowSeats[0].tier).split(' ')[0] : ''}
              </span>
            </div>

            {/* Row Seats */}
            <div className="grid grid-cols-10 gap-2 flex-1">
              {rowSeats.map((seat) => {
                const isSelected = seat.seatId === selectedSeatId;
                return (
                  <button
                    key={seat.seatId}
                    type="button"
                    onClick={() => onSelectSeat(seat)}
                    disabled={disabled || isLoading}
                    className={getSeatStyling(seat, isSelected)}
                    title={`Seat ${seat.rowLabel}-${seat.seatNumber} (${seat.tier}) • Status: ${seat.status}`}
                    aria-label={`Seat ${seat.rowLabel}-${seat.seatNumber}, status ${seat.status}`}
                  >
                    <span className="font-mono text-xs font-bold tracking-tight">
                      {seat.rowLabel}{seat.seatNumber}
                    </span>
                    <div className="mt-1">
                      {getStatusBadge(seat)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Selected Seat Inspector Banner */}
      {selectedSeatId && (
        <div className="mt-4 p-3.5 rounded-lg bg-canvas-elevated/70 border border-canvas-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          {(() => {
            const seat = seats.find((s) => s.seatId === selectedSeatId);
            if (!seat) return null;
            return (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono font-bold text-ink-light bg-canvas-dark px-2 py-1 rounded border border-canvas-border">
                    Selected: Seat {seat.rowLabel}-{seat.seatNumber}
                  </span>
                  <span className="font-mono text-ink-muted">
                    Tier: <span className="text-ink-light font-semibold">{getTierLabel(seat.tier)}</span>
                  </span>
                  <span className="font-mono text-ink-muted">
                    Status: <span className={`font-bold ${
                      seat.status === 'AVAILABLE' ? 'text-emerald-400' :
                      seat.status === 'HELD' ? 'text-amber-400' : 'text-violet-400'
                    }`}>{seat.status}</span>
                  </span>
                  {seat.currentHoldId && (
                    <span className="font-mono text-[10px] text-ink-muted truncate max-w-[200px]" title={seat.currentHoldId}>
                      Hold ID: {seat.currentHoldId.slice(0, 8)}...
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-ink-muted text-[11px]">Ready for simulation in Area B</span>
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
};
