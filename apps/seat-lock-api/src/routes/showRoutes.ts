import { Router, Request, Response, NextFunction } from 'express';
import { pool } from '../config/db.js';
import { ReservationService } from '../services/reservationService.js';
import { config } from '../config/env.js';

export const showRouter = Router();

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// GET /api/shows
showRouter.get('/shows', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT id, title, auditorium_name, start_time, created_at
        FROM shows
        ORDER BY start_time ASC;
      `);
      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
});

// GET /api/shows/:showId/seats
showRouter.get('/shows/:showId/seats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { showId } = req.params;
    if (!showId || !UUID_REGEX.test(showId)) {
      res.status(422).json({
        error: 'INVALID_INPUT',
        message: 'Invalid showId parameter: must be a valid UUID',
        statusCode: 422,
      });
      return;
    }
    const seats = await ReservationService.getShowSeats(showId);
    if (!seats || seats.length === 0) {
      // Check if show exists
      const client = await pool.connect();
      try {
        const showRes = await client.query('SELECT id, title FROM shows WHERE id = $1', [showId]);
        if (showRes.rows.length === 0) {
          res.status(404).json({
            error: 'SHOW_NOT_FOUND',
            message: `Show ${showId} was not found.`,
          });
          return;
        }
      } finally {
        client.release();
      }
    }

    res.json({
      showId,
      totalSeats: seats.length,
      availableCount: seats.filter((s: any) => s.status === 'AVAILABLE').length,
      heldCount: seats.filter((s: any) => s.status === 'HELD').length,
      confirmedCount: seats.filter((s: any) => s.status === 'CONFIRMED').length,
      seats,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/shows/:showId/reset
// Guarded reset endpoint for local and test environments only.
showRouter.post('/shows/:showId/reset', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { showId } = req.params;

    if (config.nodeEnv === 'production') {
      res.status(403).json({
        error: 'FORBIDDEN_IN_PRODUCTION',
        message: 'Destructive test resets are strictly disabled in production environments.',
        statusCode: 403,
      });
      return;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM hold_audit_events WHERE show_id = $1;', [showId]);
      await client.query('DELETE FROM seat_holds WHERE show_id = $1;', [showId]);
      await client.query(`
        UPDATE show_seats
        SET status = 'AVAILABLE',
            current_hold_id = NULL,
            hold_expires_at = NULL,
            confirmed_at = NULL,
            confirmed_by_customer_id = NULL,
            fencing_token = 1,
            updated_at = NOW()
        WHERE show_id = $1;
      `, [showId]);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    res.json({
      success: true,
      showId,
      message: 'Show seat inventory, active holds, and audit events successfully reset to initial available state.',
    });
  } catch (err) {
    next(err);
  }
});

