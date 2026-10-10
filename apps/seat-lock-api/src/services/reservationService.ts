import { pool } from '../config/db.js';
import { RedisLockService } from './lockService.js';
import { config } from '../config/env.js';

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
  coordinationMode: 'REDIS_PROTECTED' | 'POSTGRES_FALLBACK';
  executionTrace: TraceStep[];
}

export class ReservationService {
  /**
   * Acquire a concurrency-safe seat hold using Redis ingress lock + PostgreSQL row-level isolation
   */
  public static async createHold(params: {
    showId: string;
    seatId: string;
    customerId: string;
    idempotencyKey: string;
    customHoldDurationSeconds?: number;
    skipRedisCoordination?: boolean;
  }): Promise<HoldResult> {
    const { showId, seatId, customerId, idempotencyKey, skipRedisCoordination } = params;
    const holdDuration = params.customHoldDurationSeconds || config.holdDurationSeconds;
    const trace: TraceStep[] = [];
    const startTime = Date.now();

    const recordTrace = (step: string, status: string, details?: Record<string, any>) => {
      trace.push({
        step,
        status,
        timestamp: new Date().toISOString(),
        durationMs: Date.now() - startTime,
        details,
      });
    };

    recordTrace('VALIDATE_INPUT', 'OK', {
      showId,
      seatId,
      customerId,
      idempotencyKey,
      skipRedisCoordination: !!skipRedisCoordination,
    });

    // 1. Check for durable idempotent replay first
    const client = await pool.connect();
    try {
      const existingHoldRes = await client.query(`
        SELECT h.id, h.show_id, h.seat_id, h.customer_id, h.idempotency_key,
               h.status, h.fencing_token, h.expires_at, h.created_at,
               s.row_label, s.seat_number, s.tier, ss.status as seat_status,
               EXTRACT(EPOCH FROM (h.expires_at - NOW()))::int as remaining_seconds
        FROM seat_holds h
        JOIN seats s ON s.id = h.seat_id
        JOIN show_seats ss ON ss.show_id = h.show_id AND ss.seat_id = h.seat_id
        WHERE h.idempotency_key = $1;
      `, [idempotencyKey]);

      if (existingHoldRes.rows.length > 0) {
        const row = existingHoldRes.rows[0];
        // Enforce idempotency key parameter safety
        if (row.show_id !== showId || row.seat_id !== seatId || row.customer_id !== customerId) {
          throw {
            statusCode: 422,
            error: 'IDEMPOTENCY_KEY_COLLISION',
            message: 'Idempotency key was previously used with different reservation parameters.',
          };
        }

        recordTrace('IDEMPOTENCY_CHECK', 'REPLAY_FOUND', { holdId: row.id });

        return {
          hold: {
            id: row.id,
            showId: row.show_id,
            seatId: row.seat_id,
            customerId: row.customer_id,
            idempotencyKey: row.idempotency_key,
            status: row.status,
            fencingToken: row.fencing_token.toString(),
            expiresAt: row.expires_at.toISOString(),
            createdAt: row.created_at.toISOString(),
            remainingSeconds: Math.max(0, row.remaining_seconds || 0),
          },
          seat: {
            id: row.seat_id,
            rowLabel: row.row_label,
            seatNumber: row.seat_number,
            tier: row.tier,
            status: row.seat_status,
          },
          isIdempotentReplay: true,
          coordinationMode: 'POSTGRES_FALLBACK',
          executionTrace: trace,
        };
      }
    } finally {
      client.release();
    }

    // 2. Attempt Redis short-lived coordination lock or execute explicit Postgres fallback
    let lockRes: any;
    if (skipRedisCoordination) {
      const lockKey = RedisLockService.getLockKey(showId, seatId);
      lockRes = {
        acquired: true,
        workerToken: null,
        coordinationMode: 'POSTGRES_FALLBACK' as const,
        lockKey,
        ttlMs: 0,
        reason: 'Client requested PostgreSQL-only execution path',
      };
      recordTrace('REDIS_COORDINATION_LOCK', 'BYPASSED_PG_ONLY', {
        mode: 'POSTGRES_FALLBACK',
        lockKey,
        reason: 'Direct PostgreSQL row-lock path selected (Redis coordination skipped)',
      });
    } else {
      lockRes = await RedisLockService.acquireCoordinationLock(showId, seatId);
      recordTrace('REDIS_COORDINATION_LOCK', lockRes.acquired ? 'ACQUIRED' : 'CONTENDED', {
        mode: lockRes.coordinationMode,
        lockKey: lockRes.lockKey,
        ttlMs: lockRes.ttlMs,
        reason: lockRes.reason,
      });

      if (!lockRes.acquired) {
        throw {
          statusCode: 409,
          error: 'SEAT_LOCK_CONTENDED',
          message: 'A concurrent hold request for this seat is actively in flight. Please retry shortly.',
          coordinationMode: lockRes.coordinationMode,
          executionTrace: trace,
        };
      }
    }

    // 3. Begin PostgreSQL Transaction for durable invariant verification
    const dbClient = await pool.connect();
    try {
      await dbClient.query('BEGIN');
      recordTrace('PG_TRANSACTION', 'BEGIN');

      // Select show_seat row with FOR UPDATE row lock
      const seatRes = await dbClient.query(`
        SELECT ss.id, ss.show_id, ss.seat_id, ss.status, ss.current_hold_id,
               ss.fencing_token, ss.hold_expires_at,
               s.row_label, s.seat_number, s.tier,
               (NOW() > ss.hold_expires_at) as is_expired
        FROM show_seats ss
        JOIN seats s ON s.id = ss.seat_id
        WHERE ss.show_id = $1 AND ss.seat_id = $2
        FOR UPDATE;
      `, [showId, seatId]);

      if (seatRes.rows.length === 0) {
        throw {
          statusCode: 404,
          error: 'SEAT_NOT_FOUND',
          message: `Seat ${seatId} does not exist for show ${showId}.`,
        };
      }

      const seatRow = seatRes.rows[0];
      recordTrace('PG_ROW_LOCK', 'ACQUIRED_FOR_UPDATE', {
        currentStatus: seatRow.status,
        fencingToken: seatRow.fencing_token,
        isExpired: seatRow.is_expired,
      });

      // 4. Invariant Check: Confirmed Seat is strictly non-reservable
      if (seatRow.status === 'CONFIRMED') {
        throw {
          statusCode: 409,
          error: 'SEAT_ALREADY_CONFIRMED',
          message: `Seat ${seatRow.row_label}-${seatRow.seat_number} is already confirmed and purchased.`,
          seat: {
            id: seatId,
            rowLabel: seatRow.row_label,
            seatNumber: seatRow.seat_number,
            tier: seatRow.tier,
            status: 'CONFIRMED',
          },
        };
      }

      // 5. Invariant Check: Active Hold cannot be overridden
      if (seatRow.status === 'HELD' && !seatRow.is_expired) {
        throw {
          statusCode: 409,
          error: 'SEAT_ALREADY_HELD',
          message: `Seat ${seatRow.row_label}-${seatRow.seat_number} is currently held by another customer.`,
          expiresAt: seatRow.hold_expires_at,
          seat: {
            id: seatId,
            rowLabel: seatRow.row_label,
            seatNumber: seatRow.seat_number,
            tier: seatRow.tier,
            status: 'HELD',
          },
        };
      }

      // 6. If previous hold was expired, mark previous hold record as EXPIRED
      if (seatRow.status === 'HELD' && seatRow.is_expired && seatRow.current_hold_id) {
        await dbClient.query(`
          UPDATE seat_holds
          SET status = 'EXPIRED', updated_at = NOW()
          WHERE id = $1 AND status = 'ACTIVE';
        `, [seatRow.current_hold_id]);
        recordTrace('RECLAIM_EXPIRED_HOLD', 'SUCCESS', { previousHoldId: seatRow.current_hold_id });
      }

      // 7. Increment fencing token and insert new hold record
      const nextFencingToken = BigInt(seatRow.fencing_token) + 1n;
      const insertHoldRes = await dbClient.query(`
        INSERT INTO seat_holds (show_id, seat_id, customer_id, idempotency_key, fencing_token, status, expires_at)
        VALUES ($1, $2, $3, $4, $5, 'ACTIVE', NOW() + ($6 || ' seconds')::INTERVAL)
        RETURNING id, show_id, seat_id, customer_id, idempotency_key, status, fencing_token, expires_at, created_at,
                  EXTRACT(EPOCH FROM (expires_at - NOW()))::int as remaining_seconds;
      `, [showId, seatId, customerId, idempotencyKey, nextFencingToken.toString(), holdDuration]);

      const newHold = insertHoldRes.rows[0];

      // 8. Update show_seats state atomically to HELD
      await dbClient.query(`
        UPDATE show_seats
        SET status = 'HELD',
            current_hold_id = $1,
            fencing_token = $2,
            hold_expires_at = $3,
            updated_at = NOW()
        WHERE show_id = $4 AND seat_id = $5;
      `, [newHold.id, nextFencingToken.toString(), newHold.expires_at, showId, seatId]);

      // 9. Record audit event
      await dbClient.query(`
        INSERT INTO hold_audit_events (hold_id, show_id, seat_id, customer_id, event_type, coordination_mode, details)
        VALUES ($1, $2, $3, $4, 'HOLD_ACQUIRED', $5, $6);
      `, [newHold.id, showId, seatId, customerId, lockRes.coordinationMode, JSON.stringify({ fencingToken: nextFencingToken.toString() })]);

      // 10. Commit PostgreSQL Transaction
      await dbClient.query('COMMIT');
      recordTrace('PG_TRANSACTION', 'COMMITTED');

      return {
        hold: {
          id: newHold.id,
          showId: newHold.show_id,
          seatId: newHold.seat_id,
          customerId: newHold.customer_id,
          idempotencyKey: newHold.idempotency_key,
          status: newHold.status,
          fencingToken: newHold.fencing_token.toString(),
          expiresAt: newHold.expires_at.toISOString(),
          createdAt: newHold.created_at.toISOString(),
          remainingSeconds: Math.max(0, newHold.remaining_seconds || holdDuration),
        },
        seat: {
          id: seatId,
          rowLabel: seatRow.row_label,
          seatNumber: seatRow.seat_number,
          tier: seatRow.tier,
          status: 'HELD',
        },
        isIdempotentReplay: false,
        coordinationMode: lockRes.coordinationMode,
        executionTrace: trace,
      };
    } catch (err: any) {
      await dbClient.query('ROLLBACK');
      recordTrace('PG_TRANSACTION', 'ROLLED_BACK', { error: err.message });
      if (!err.executionTrace) {
        err.executionTrace = trace;
      }
      if (!err.coordinationMode) {
        err.coordinationMode = lockRes?.coordinationMode || 'POSTGRES_FALLBACK';
      }
      throw err;
    } finally {
      dbClient.release();
      // Always safely release the Redis lock using Lua CAS token match
      if (lockRes.workerToken) {
        const released = await RedisLockService.releaseCoordinationLock(showId, seatId, lockRes.workerToken);
        recordTrace('REDIS_COORDINATION_LOCK', released ? 'RELEASED_SAFELY' : 'RELEASE_SKIPPED_OR_EXPIRED');
      }
    }
  }

  /**
   * Fetch single hold by ID
   */
  public static async getHold(holdId: string): Promise<any> {
    const client = await pool.connect();
    try {
      const res = await client.query(`
        SELECT h.id, h.show_id, h.seat_id, h.customer_id, h.idempotency_key,
               h.status, h.fencing_token, h.expires_at, h.created_at,
               s.row_label, s.seat_number, s.tier, ss.status as seat_status,
               EXTRACT(EPOCH FROM (h.expires_at - NOW()))::int as remaining_seconds,
               (NOW() > h.expires_at) as is_expired
        FROM seat_holds h
        JOIN seats s ON s.id = h.seat_id
        JOIN show_seats ss ON ss.show_id = h.show_id AND ss.seat_id = h.seat_id
        WHERE h.id = $1;
      `, [holdId]);

      if (res.rows.length === 0) {
        throw { statusCode: 404, error: 'HOLD_NOT_FOUND', message: `Hold ${holdId} was not found.` };
      }

      const row = res.rows[0];
      return {
        id: row.id,
        showId: row.show_id,
        seatId: row.seat_id,
        customerId: row.customer_id,
        idempotencyKey: row.idempotency_key,
        status: row.status,
        fencingToken: row.fencing_token.toString(),
        expiresAt: row.expires_at.toISOString(),
        createdAt: row.created_at.toISOString(),
        remainingSeconds: Math.max(0, row.remaining_seconds || 0),
        isExpired: row.is_expired,
        seat: {
          id: row.seat_id,
          rowLabel: row.row_label,
          seatNumber: row.seat_number,
          tier: row.tier,
          status: row.seat_status,
        },
      };
    } finally {
      client.release();
    }
  }

  /**
   * Release hold explicitly (e.g. user navigation abandonment)
   */
  public static async releaseHold(holdId: string, customerId?: string): Promise<any> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const holdRes = await client.query(`
        SELECT id, show_id, seat_id, customer_id, status, fencing_token
        FROM seat_holds
        WHERE id = $1
        FOR UPDATE;
      `, [holdId]);

      if (holdRes.rows.length === 0) {
        throw { statusCode: 404, error: 'HOLD_NOT_FOUND', message: `Hold ${holdId} does not exist.` };
      }

      const hold = holdRes.rows[0];
      if (customerId && hold.customer_id !== customerId) {
        throw { statusCode: 403, error: 'UNAUTHORIZED_CUSTOMER', message: 'You do not own this hold.' };
      }

      if (hold.status !== 'ACTIVE') {
        throw { statusCode: 409, error: 'HOLD_NOT_ACTIVE', message: `Hold status is ${hold.status}; only ACTIVE holds can be released.` };
      }

      // Mark hold as RELEASED
      await client.query(`
        UPDATE seat_holds
        SET status = 'RELEASED', updated_at = NOW()
        WHERE id = $1;
      `, [holdId]);

      // Return seat to AVAILABLE only if this hold is the current active hold on the seat
      await client.query(`
        UPDATE show_seats
        SET status = 'AVAILABLE', current_hold_id = NULL, hold_expires_at = NULL, updated_at = NOW()
        WHERE show_id = $1 AND seat_id = $2 AND current_hold_id = $3;
      `, [hold.show_id, hold.seat_id, holdId]);

      await client.query(`
        INSERT INTO hold_audit_events (hold_id, show_id, seat_id, customer_id, event_type, coordination_mode, details)
        VALUES ($1, $2, $3, $4, 'HOLD_RELEASED', 'POSTGRES_DURABLE', '{}');
      `, [holdId, hold.show_id, hold.seat_id, hold.customer_id]);

      await client.query('COMMIT');

      return {
        holdId,
        status: 'RELEASED',
        seatId: hold.seat_id,
        showId: hold.show_id,
        message: 'Seat hold released successfully; seat is now available.',
      };
    } catch (err: any) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Confirm booking for a held seat
   * Strict invariant: Only active, unexpired hold with matching fencing token can confirm.
   * Does NOT charge payment (educational reference simulation).
   */
  public static async confirmHold(holdId: string, customerId?: string): Promise<any> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Lock hold row
      const holdRes = await client.query(`
        SELECT id, show_id, seat_id, customer_id, status, fencing_token, expires_at,
               (NOW() > expires_at) as is_expired
        FROM seat_holds
        WHERE id = $1
        FOR UPDATE;
      `, [holdId]);

      if (holdRes.rows.length === 0) {
        throw { statusCode: 404, error: 'HOLD_NOT_FOUND', message: `Hold ${holdId} does not exist.` };
      }

      const hold = holdRes.rows[0];
      if (customerId && hold.customer_id !== customerId) {
        throw { statusCode: 403, error: 'UNAUTHORIZED_CUSTOMER', message: 'You do not own this hold.' };
      }

      if (hold.status === 'CONFIRMED') {
        // Idempotent confirmation
        await client.query('COMMIT');
        return {
          holdId,
          status: 'CONFIRMED',
          showId: hold.show_id,
          seatId: hold.seat_id,
          isIdempotentReplay: true,
          message: 'Hold was already confirmed.',
        };
      }

      if (hold.status !== 'ACTIVE') {
        throw {
          statusCode: 409,
          error: 'HOLD_INVALID_STATE',
          message: `Cannot confirm hold in ${hold.status} state. Only ACTIVE holds can be confirmed.`,
        };
      }

      // Authoritative database-time expiry check
      if (hold.is_expired) {
        await client.query(`UPDATE seat_holds SET status = 'EXPIRED', updated_at = NOW() WHERE id = $1;`, [holdId]);
        await client.query(`
          UPDATE show_seats
          SET status = 'AVAILABLE', current_hold_id = NULL, hold_expires_at = NULL, updated_at = NOW()
          WHERE show_id = $1 AND seat_id = $2 AND current_hold_id = $3;
        `, [hold.show_id, hold.seat_id, holdId]);
        await client.query('COMMIT');

        throw {
          statusCode: 409,
          error: 'HOLD_EXPIRED',
          message: 'The reservation hold expired before confirmation could complete. Seat was returned to inventory.',
        };
      }

      // Check seat inventory state with row lock
      const seatRes = await client.query(`
        SELECT id, status, current_hold_id, fencing_token
        FROM show_seats
        WHERE show_id = $1 AND seat_id = $2
        FOR UPDATE;
      `, [hold.show_id, hold.seat_id]);

      const seat = seatRes.rows[0];

      // Fencing token check: prevent zombie workers from overriding a newer hold
      if (seat.current_hold_id !== holdId || seat.fencing_token !== hold.fencing_token) {
        throw {
          statusCode: 409,
          error: 'FENCING_TOKEN_MISMATCH',
          message: 'Hold was superseded by a newer reservation lease. Confirmation rejected.',
        };
      }

      // Update hold to CONFIRMED
      await client.query(`
        UPDATE seat_holds
        SET status = 'CONFIRMED', updated_at = NOW()
        WHERE id = $1;
      `, [holdId]);

      // Update show_seats permanently to CONFIRMED
      await client.query(`
        UPDATE show_seats
        SET status = 'CONFIRMED',
            confirmed_at = NOW(),
            confirmed_by_customer_id = $1,
            current_hold_id = NULL,
            hold_expires_at = NULL,
            updated_at = NOW()
        WHERE show_id = $2 AND seat_id = $3;
      `, [hold.customer_id, hold.show_id, hold.seat_id]);

      await client.query(`
        INSERT INTO hold_audit_events (hold_id, show_id, seat_id, customer_id, event_type, coordination_mode, details)
        VALUES ($1, $2, $3, $4, 'HOLD_CONFIRMED', 'POSTGRES_DURABLE', '{}');
      `, [holdId, hold.show_id, hold.seat_id, hold.customer_id]);

      await client.query('COMMIT');

      return {
        holdId,
        status: 'CONFIRMED',
        showId: hold.show_id,
        seatId: hold.seat_id,
        customerId: hold.customer_id,
        isIdempotentReplay: false,
        message: 'Seat confirmed successfully (simulated booking completed without payment charges).',
      };
    } catch (err: any) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Fetch all seats and live statuses for a show
   */
  public static async getShowSeats(showId: string): Promise<any> {
    const client = await pool.connect();
    try {
      // Reclaim any expired holds lazily during fetch to keep seatmap fresh
      await client.query(`
        UPDATE show_seats
        SET status = 'AVAILABLE', current_hold_id = NULL, hold_expires_at = NULL, updated_at = NOW()
        WHERE show_id = $1 AND status = 'HELD' AND hold_expires_at < NOW();
      `, [showId]);

      const res = await client.query(`
        SELECT s.id as seat_id, s.auditorium_name, s.row_label, s.seat_number, s.tier,
               ss.status, ss.current_hold_id, ss.hold_expires_at, ss.confirmed_at,
               EXTRACT(EPOCH FROM (ss.hold_expires_at - NOW()))::int as remaining_hold_seconds
        FROM show_seats ss
        JOIN seats s ON s.id = ss.seat_id
        WHERE ss.show_id = $1
        ORDER BY s.row_label ASC, s.seat_number ASC;
      `, [showId]);

      return res.rows.map((r) => ({
        seatId: r.seat_id,
        rowLabel: r.row_label,
        seatNumber: r.seat_number,
        tier: r.tier,
        status: r.status,
        currentHoldId: r.current_hold_id,
        remainingHoldSeconds: r.status === 'HELD' ? Math.max(0, r.remaining_hold_seconds || 0) : null,
      }));
    } finally {
      client.release();
    }
  }
}
