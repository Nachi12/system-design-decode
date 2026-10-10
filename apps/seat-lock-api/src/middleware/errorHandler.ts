import { Request, Response, NextFunction } from 'express';
import { RequestWithId } from './requestId.js';

export const errorHandler = (
  err: any,
  req: RequestWithId,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = err.statusCode || (err.status ? parseInt(err.status, 10) : 500);
  const errorType = err.error || (statusCode >= 500 ? 'INTERNAL_SERVER_ERROR' : 'BAD_REQUEST');
  const message = err.message || 'An unexpected error occurred during reservation coordination.';

  // Avoid logging sensitive data or secrets
  if (statusCode >= 500) {
    console.error(`[Error 500] Request ${req.requestId} failed:`, err);
  } else {
    console.log(`[Info ${statusCode}] Request ${req.requestId} rejected: ${errorType} - ${message}`);
  }

  res.status(statusCode).json({
    error: errorType,
    message,
    statusCode,
    requestId: req.requestId,
    coordinationMode: err.coordinationMode,
    seat: err.seat,
    expiresAt: err.expiresAt,
    executionTrace: err.executionTrace,
  });
};
