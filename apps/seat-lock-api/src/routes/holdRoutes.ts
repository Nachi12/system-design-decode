import { Router, Request, Response, NextFunction } from 'express';
import { ReservationService } from '../services/reservationService.js';

export const holdRouter = Router();

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// POST /api/shows/:showId/holds
holdRouter.post('/shows/:showId/holds', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { showId } = req.params;
    const seatId = req.body.seatId;
    const customerId = req.body.customerId || req.body.demoCustomerId;
    const idempotencyKey = (req.headers['idempotency-key'] as string) || req.body.idempotencyKey;
    const customHoldDurationSeconds = req.body.customHoldDurationSeconds
      ? parseInt(req.body.customHoldDurationSeconds, 10)
      : undefined;
    const skipRedisCoordination =
      req.headers['x-skip-redis'] === 'true' ||
      req.headers['x-skip-redis'] === '1' ||
      req.body.skipRedisCoordination === true;

    // Strict input validation
    if (!showId || !UUID_REGEX.test(showId)) {
      res.status(422).json({
        error: 'INVALID_INPUT',
        message: 'Invalid showId parameter: must be a valid UUID',
        statusCode: 422,
      });
      return;
    }

    if (!seatId || typeof seatId !== 'string' || !UUID_REGEX.test(seatId)) {
      res.status(422).json({
        error: 'INVALID_INPUT',
        message: 'Missing or invalid required field: seatId (must be a valid UUID)',
        statusCode: 422,
      });
      return;
    }

    if (!customerId || typeof customerId !== 'string' || customerId.trim().length === 0) {
      res.status(422).json({
        error: 'INVALID_INPUT',
        message: 'Missing or invalid required field: customerId',
        statusCode: 422,
      });
      return;
    }

    if (!idempotencyKey || typeof idempotencyKey !== 'string' || idempotencyKey.trim().length === 0) {
      res.status(422).json({
        error: 'INVALID_INPUT',
        message: 'Missing required Idempotency-Key header or idempotencyKey body field',
        statusCode: 422,
      });
      return;
    }

    const result = await ReservationService.createHold({
      showId,
      seatId,
      customerId,
      idempotencyKey,
      customHoldDurationSeconds,
      skipRedisCoordination,
    });

    // 200 OK for idempotent replay, 201 Created for freshly granted hold
    const status = result.isIdempotentReplay ? 200 : 201;
    res.status(status).json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/holds/:holdId
holdRouter.get('/holds/:holdId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { holdId } = req.params;
    if (!holdId || !UUID_REGEX.test(holdId)) {
      res.status(422).json({
        error: 'INVALID_INPUT',
        message: 'Invalid holdId parameter: must be a valid UUID',
        statusCode: 422,
      });
      return;
    }
    const hold = await ReservationService.getHold(holdId);
    res.json(hold);
  } catch (err) {
    next(err);
  }
});

// POST /api/holds/:holdId/release
holdRouter.post('/holds/:holdId/release', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { holdId } = req.params;
    if (!holdId || !UUID_REGEX.test(holdId)) {
      res.status(422).json({
        error: 'INVALID_INPUT',
        message: 'Invalid holdId parameter: must be a valid UUID',
        statusCode: 422,
      });
      return;
    }
    const customerId = req.body.customerId || req.body.demoCustomerId;
    const result = await ReservationService.releaseHold(holdId, customerId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/holds/:holdId/confirm
holdRouter.post('/holds/:holdId/confirm', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { holdId } = req.params;
    if (!holdId || !UUID_REGEX.test(holdId)) {
      res.status(422).json({
        error: 'INVALID_INPUT',
        message: 'Invalid holdId parameter: must be a valid UUID',
        statusCode: 422,
      });
      return;
    }
    const customerId = req.body.customerId || req.body.demoCustomerId;
    const result = await ReservationService.confirmHold(holdId, customerId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});
