import pg from 'pg';
import { createClient, RedisClientType } from 'redis';
import { config } from './env.js';

const { Pool } = pg;

// 1. PostgreSQL Connection Pool
export const pool = new Pool(
  config.pg.connectionString
    ? {
        connectionString: config.pg.connectionString,
        ssl: config.pg.ssl ? { rejectUnauthorized: false } : false,
        max: 25,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      }
    : {
        host: config.pg.host,
        port: config.pg.port,
        database: config.pg.database,
        user: config.pg.user,
        password: config.pg.password,
        ssl: config.pg.ssl ? { rejectUnauthorized: false } : false,
        max: 25,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      }
);

pool.on('error', (err) => {
  console.error('[PostgreSQL Pool Error]: Unexpected error on idle client', err);
});

// 2. Official Redis Client
let redisClientInstance: RedisClientType | null = null;
let redisIsConnected = false;

export const getRedisClient = (): RedisClientType => {
  if (!redisClientInstance) {
    redisClientInstance = createClient({
      url: config.redis.url,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.warn('[Redis] Max reconnection attempts reached. Continuing in fallback mode.');
            return false;
          }
          return Math.min(retries * 100, 3000);
        },
        connectTimeout: 5000,
      },
    });

    redisClientInstance.on('connect', () => {
      redisIsConnected = true;
      console.log(`[Redis] Connected to ${config.redis.url}`);
    });

    redisClientInstance.on('ready', () => {
      redisIsConnected = true;
    });

    redisClientInstance.on('error', (err) => {
      redisIsConnected = false;
      // Log concise error without flooding console
      console.warn(`[Redis Error]: ${err.message}`);
    });

    redisClientInstance.on('end', () => {
      redisIsConnected = false;
    });
  }

  return redisClientInstance;
};

export const initRedis = async (): Promise<boolean> => {
  try {
    const client = getRedisClient();
    if (!client.isOpen) {
      await client.connect();
    }
    await client.ping();
    redisIsConnected = true;
    return true;
  } catch (err: any) {
    redisIsConnected = false;
    console.warn(`[Redis Initialization Failed]: ${err.message}. Fallback mode active: ${config.enableRedisFallback}`);
    return false;
  }
};

export const isRedisReady = (): boolean => {
  return redisIsConnected && !!redisClientInstance && redisClientInstance.isOpen;
};

// 3. Graceful Shutdown
export const closeConnections = async (): Promise<void> => {
  console.log('[Shutdown] Closing database and redis connections...');
  try {
    if (redisClientInstance && redisClientInstance.isOpen) {
      await redisClientInstance.quit();
    }
  } catch (err: any) {
    console.warn(`[Shutdown] Error disconnecting Redis: ${err.message}`);
  }

  try {
    await pool.end();
  } catch (err: any) {
    console.warn(`[Shutdown] Error closing PostgreSQL pool: ${err.message}`);
  }
  console.log('[Shutdown] All connections successfully closed.');
};
