import {
  ApiHealthResponse,
  ShowInfo,
  ShowSeatsResponse,
  HoldResult,
  ApiErrorResponse,
} from '../types/seatLock';

const API_BASE = '/api';

export class ApiCallError extends Error {
  public statusCode: number;
  public errorType: string;
  public errorData: ApiErrorResponse;

  constructor(data: ApiErrorResponse) {
    super(data.message || 'API request rejected');
    this.name = 'ApiCallError';
    this.statusCode = data.statusCode || 500;
    this.errorType = data.error || 'UNKNOWN_ERROR';
    this.errorData = data;
  }
}

export const SeatLockApiClient = {
  /**
   * Health check
   */
  async getHealth(): Promise<ApiHealthResponse> {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok && res.status !== 503) {
      throw new Error(`Health check failed with HTTP ${res.status}`);
    }
    return res.json();
  },

  /**
   * Fetch list of seeded shows
   */
  async getShows(): Promise<ShowInfo[]> {
    const res = await fetch(`${API_BASE}/shows`);
    if (!res.ok) {
      throw new Error(`Failed to fetch shows (HTTP ${res.status})`);
    }
    return res.json();
  },

  /**
   * Fetch seats with live statuses for a show
   */
  async getShowSeats(showId: string): Promise<ShowSeatsResponse> {
    const res = await fetch(`${API_BASE}/shows/${showId}/seats`);
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new ApiCallError({
        error: errJson.error || 'FETCH_SEATS_FAILED',
        message: errJson.message || `Failed to fetch seats for show ${showId}`,
        statusCode: res.status,
      });
    }
    return res.json();
  },

  /**
   * Request an ephemeral seat hold
   */
  async createHold(params: {
    showId: string;
    seatId: string;
    customerId: string;
    idempotencyKey: string;
    customHoldDurationSeconds?: number;
    skipRedisCoordination?: boolean;
    requestId?: string;
  }): Promise<HoldResult> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Idempotency-Key': params.idempotencyKey,
    };

    if (params.skipRedisCoordination) {
      headers['X-Skip-Redis'] = 'true';
    }

    if (params.requestId) {
      headers['X-Request-Id'] = params.requestId;
    }

    const res = await fetch(`${API_BASE}/shows/${params.showId}/holds`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        seatId: params.seatId,
        customerId: params.customerId,
        idempotencyKey: params.idempotencyKey,
        customHoldDurationSeconds: params.customHoldDurationSeconds,
        skipRedisCoordination: params.skipRedisCoordination,
      }),
    });

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new ApiCallError({
        error: body.error || 'HOLD_REJECTED',
        message: body.message || `Hold request rejected with HTTP ${res.status}`,
        statusCode: res.status,
        requestId: body.requestId,
        coordinationMode: body.coordinationMode,
        seat: body.seat,
        expiresAt: body.expiresAt,
        executionTrace: body.executionTrace,
      });
    }

    return body as HoldResult;
  },

  /**
   * Confirm booking for a held seat
   */
  async confirmHold(holdId: string, customerId?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/holds/${holdId}/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId }),
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new ApiCallError({
        error: body.error || 'CONFIRM_FAILED',
        message: body.message || `Confirmation failed with HTTP ${res.status}`,
        statusCode: res.status,
      });
    }
    return body;
  },

  /**
   * Release hold explicitly
   */
  async releaseHold(holdId: string, customerId?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/holds/${holdId}/release`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId }),
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new ApiCallError({
        error: body.error || 'RELEASE_FAILED',
        message: body.message || `Release failed with HTTP ${res.status}`,
        statusCode: res.status,
      });
    }
    return body;
  },

  /**
   * Reset demonstration show topology (local dev only)
   */
  async resetShow(showId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/shows/${showId}/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new ApiCallError({
        error: body.error || 'RESET_FAILED',
        message: body.message || `Reset failed with HTTP ${res.status}`,
        statusCode: res.status,
      });
    }
    return body;
  },
};
