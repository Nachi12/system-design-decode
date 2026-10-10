import { createApp } from './app.js';
import { config } from './config/env.js';
import { initRedis, closeConnections } from './config/db.js';

const startServer = async () => {
  console.log(`[SeatLock API] Initializing backend service in ${config.nodeEnv} mode...`);

  // Initialize Redis (or trigger fallback mode)
  await initRedis();

  const app = createApp();
  const server = app.listen(config.port, () => {
    console.log(`[SeatLock API] Server listening on http://localhost:${config.port}`);
    console.log(`[SeatLock API] Health check: http://localhost:${config.port}/api/health`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n[SeatLock API] Received ${signal}. Starting graceful shutdown...`);
    server.close(async () => {
      console.log('[SeatLock API] HTTP server closed.');
      await closeConnections();
      process.exit(0);
    });

    // Force exit after 10s timeout
    setTimeout(() => {
      console.error('[SeatLock API] Forcing exit after shutdown timeout.');
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
};

startServer().catch((err) => {
  console.error('[SeatLock API] Fatal startup error:', err);
  process.exit(1);
});
