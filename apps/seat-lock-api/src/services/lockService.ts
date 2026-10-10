import { randomUUID } from 'crypto';
import { getRedisClient, isRedisReady } from '../config/db.js';
import { config } from '../config/env.js';

export interface LockAcquisitionResult {
  acquired: boolean;
  workerToken: string | null;
  coordinationMode: 'REDIS_PROTECTED' | 'POSTGRES_FALLBACK';
  lockKey: string;
  ttlMs: number;
  reason?: string;
}

// Atomic compare-and-delete Lua script to ensure a worker never releases
// a lock key that expired and now belongs to a different worker request.
const LUA_COMPARE_AND_DELETE = `
if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("del", KEYS[1])
else
    return 0
end
`;

export class RedisLockService {
  /**
   * Generates canonical Redis lock key for a specific show seat
   */
  public static getLockKey(showId: string, seatId: string): string {
    return `lock:show:${showId}:seat:${seatId}`;
  }

  /**
   * Attempts to acquire an atomic short-lived coordination lock in Redis.
   * If Redis is down or unreachable and fallback is enabled, gracefully falls back to PostgreSQL.
   */
  public static async acquireCoordinationLock(
    showId: string,
    seatId: string,
    customTtlMs?: number
  ): Promise<LockAcquisitionResult> {
    const lockKey = this.getLockKey(showId, seatId);
    const ttlMs = customTtlMs || config.redis.lockTtlMs;
    const workerToken = randomUUID();

    // 1. Check if Redis is ready
    if (!isRedisReady()) {
      if (config.enableRedisFallback) {
        return {
          acquired: true, // proceed under PostgreSQL transaction protection
          workerToken: null,
          coordinationMode: 'POSTGRES_FALLBACK',
          lockKey,
          ttlMs: 0,
          reason: 'Redis offline; falling back to PostgreSQL row-level locks',
        };
      } else {
        return {
          acquired: false,
          workerToken: null,
          coordinationMode: 'POSTGRES_FALLBACK',
          lockKey,
          ttlMs: 0,
          reason: 'Redis is unreachable and fallback mode is disabled',
        };
      }
    }

    try {
      const client = getRedisClient();
      // Atomic SET key value NX PX ttl
      const result = await client.set(lockKey, workerToken, {
        NX: true,
        PX: ttlMs,
      });

      if (result === 'OK') {
        return {
          acquired: true,
          workerToken,
          coordinationMode: 'REDIS_PROTECTED',
          lockKey,
          ttlMs,
        };
      }

      // Key already exists (contended by another active request)
      return {
        acquired: false,
        workerToken: null,
        coordinationMode: 'REDIS_PROTECTED',
        lockKey,
        ttlMs,
        reason: 'Redis coordination lock held by concurrent request',
      };
    } catch (err: any) {
      console.warn(`[RedisLockService] Unexpected Redis error: ${err.message}`);
      if (config.enableRedisFallback) {
        return {
          acquired: true,
          workerToken: null,
          coordinationMode: 'POSTGRES_FALLBACK',
          lockKey,
          ttlMs: 0,
          reason: `Redis error (${err.message}); falling back to PostgreSQL row-level locks`,
        };
      }
      return {
        acquired: false,
        workerToken: null,
        coordinationMode: 'REDIS_PROTECTED',
        lockKey,
        ttlMs: 0,
        reason: `Redis error: ${err.message}`,
      };
    }
  }

  /**
   * Releases the lock safely using atomic compare-and-delete Lua script.
   * Only deletes the key if its value still matches workerToken.
   */
  public static async releaseCoordinationLock(
    showId: string,
    seatId: string,
    workerToken: string | null
  ): Promise<boolean> {
    if (!workerToken || !isRedisReady()) {
      return false;
    }

    const lockKey = this.getLockKey(showId, seatId);
    try {
      const client = getRedisClient();
      const res = await client.eval(LUA_COMPARE_AND_DELETE, {
        keys: [lockKey],
        arguments: [workerToken],
      });
      return res === 1;
    } catch (err: any) {
      console.warn(`[RedisLockService] Error releasing lock ${lockKey}: ${err.message}`);
      return false;
    }
  }
}
