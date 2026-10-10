export type SeatStatus = 'AVAILABLE' | 'HELD' | 'CONFIRMED';
export type SeatTier = 'VIP' | 'PREMIUM' | 'STANDARD';
export type CoordinationMode = 'REDIS_PROTECTED' | 'POSTGRES_FALLBACK';

export interface Seat {
  seatId: string;
  auditoriumName?: string;
  rowLabel: string;
  seatNumber: number;
  tier: SeatTier;
  status: SeatStatus;
  currentHoldId: string | null;
  remainingHoldSeconds: number | null;
}

export interface ShowInfo {
  id: string;
  title: string;
  auditorium_name: string;
  start_time: string;
  created_at?: string;
}

export interface ShowSeatsResponse {
  showId: string;
  totalSeats: number;
  availableCount: number;
  heldCount: number;
  confirmedCount: number;
  seats: Seat[];
}

export interface TraceStep {
  step: string;
  status: string;
  timestamp: string;
  durationMs?: number;
  details?: Record<string, any>;
}

export interface HoldResult {
  hold: {
    id: string;
    showId: string;
    seatId: string;
    customerId: string;
    idempotencyKey: string;
    status: string;
    fencingToken: string;
    expiresAt: string;
    createdAt: string;
    remainingSeconds: number;
  };
  seat: {
    id: string;
    rowLabel: string;
    seatNumber: number;
    tier: string;
    status: string;
  };
  isIdempotentReplay: boolean;
  coordinationMode: CoordinationMode;
  executionTrace: TraceStep[];
}

export interface ApiErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  requestId?: string;
  coordinationMode?: CoordinationMode;
  seat?: {
    id: string;
    rowLabel: string;
    seatNumber: number;
    tier: string;
    status: string;
  };
  expiresAt?: string;
  executionTrace?: TraceStep[];
}

export interface ApiHealthResponse {
  status: 'HEALTHY' | 'DEGRADED_FALLBACK' | 'UNHEALTHY';
  service: string;
  timestamp: string;
  uptimeSeconds: number;
  dependencies: {
    postgres: string;
    redis: string;
  };
  coordinationMode: CoordinationMode | 'UNKNOWN';
}

export interface SimulationCustomer {
  id: string;
  name: string;
  badgeColor: string;
  avatarBg: string;
  lastHoldResult?: HoldResult | null;
  lastError?: ApiErrorResponse | null;
}
