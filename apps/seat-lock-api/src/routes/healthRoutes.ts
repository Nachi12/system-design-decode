import { Router, Request, Response } from 'express';
import { pool, isRedisReady, getRedisClient } from '../config/db.js';

export const healthRouter = Router();

healthRouter.get('/health', async (_req: Request, res: Response) => {
  const health: Record<string, any> = {
    status: 'HEALTHY',
    service: 'seat-lock-api',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    dependencies: {
      postgres: 'UNKNOWN',
      redis: 'UNKNOWN',
    },
    coordinationMode: 'UNKNOWN',
  };

  let pgHealthy = false;
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    health.dependencies.postgres = 'UP';
    pgHealthy = true;
  } catch (err: any) {
    health.dependencies.postgres = `DOWN: ${err.message}`;
  }

  let redisHealthy = false;
  try {
    if (isRedisReady()) {
      const client = getRedisClient();
      await client.ping();
      health.dependencies.redis = 'UP';
      redisHealthy = true;
    } else {
      health.dependencies.redis = 'DISCONNECTED (FALLBACK_ACTIVE)';
    }
  } catch (err: any) {
    health.dependencies.redis = `DOWN: ${err.message}`;
  }

  health.coordinationMode = redisHealthy ? 'REDIS_PROTECTED' : 'POSTGRES_FALLBACK';

  // PostgreSQL is our authoritative invariant guardian; if PG is up, API is operational
  if (pgHealthy) {
    health.status = redisHealthy ? 'HEALTHY' : 'DEGRADED_FALLBACK';
    res.status(200).json(health);
  } else {
    health.status = 'UNHEALTHY';
    res.status(503).json(health);
  }
});
