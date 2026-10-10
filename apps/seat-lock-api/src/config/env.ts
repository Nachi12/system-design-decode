import dotenv from 'dotenv';
import path from 'path';

// Load .env if present
dotenv.config();

export interface AppConfig {
  port: number;
  nodeEnv: string;
  pg: {
    connectionString?: string;
    host?: string;
    port: number;
    database: string;
    user: string;
    password?: string;
    ssl: boolean;
  };
  redis: {
    url: string;
    lockTtlMs: number;
  };
  holdDurationSeconds: number;
  enableRedisFallback: boolean;
}

const parseBool = (val: string | undefined, def: boolean): boolean => {
  if (val === undefined) return def;
  return val.toLowerCase() === 'true' || val === '1';
};

const parseIntWithDefault = (val: string | undefined, def: number): number => {
  if (!val) return def;
  const parsed = parseInt(val, 10);
  return isNaN(parsed) ? def : parsed;
};

export const config: AppConfig = {
  port: parseIntWithDefault(process.env.PORT, 3001),
  nodeEnv: process.env.NODE_ENV || 'development',
  pg: {
    connectionString: process.env.DATABASE_URL,
    host: process.env.PGHOST || 'localhost',
    port: parseIntWithDefault(process.env.PGPORT, 5432),
    database: process.env.PGDATABASE || 'seatlock_db',
    user: process.env.PGUSER || process.env.USER || 'postgres',
    password: process.env.PGPASSWORD || undefined,
    ssl: parseBool(process.env.PGSSL, false),
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    lockTtlMs: parseIntWithDefault(process.env.REDIS_LOCK_TTL_MS, 5000),
  },
  holdDurationSeconds: parseIntWithDefault(process.env.HOLD_DURATION_SECONDS, 60),
  enableRedisFallback: parseBool(process.env.ENABLE_REDIS_FALLBACK, true),
};
