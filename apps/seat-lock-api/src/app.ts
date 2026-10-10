import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { requestIdMiddleware } from './middleware/requestId.js';
import { errorHandler } from './middleware/errorHandler.js';
import { healthRouter } from './routes/healthRoutes.js';
import { showRouter } from './routes/showRoutes.js';
import { holdRouter } from './routes/holdRoutes.js';

export const createApp = (): Express => {
  const app = express();

  // Restricted CORS middleware
  const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://localhost:3001',
  ];

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:')) {
          callback(null, true);
        } else {
          callback(new Error(`CORS policy blocked access from origin: ${origin}`));
        }
      },
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Idempotency-Key', 'X-Request-Id', 'X-Skip-Redis'],
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(requestIdMiddleware);

  // Mount API Routers under /api
  app.use('/api', healthRouter);
  app.use('/api', showRouter);
  app.use('/api', holdRouter);

  // 404 handler for undefined routes
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      error: 'NOT_FOUND',
      message: `Cannot ${req.method} ${req.path}`,
      statusCode: 404,
    });
  });

  // Global structured error handling
  app.use(errorHandler);

  return app;
};
