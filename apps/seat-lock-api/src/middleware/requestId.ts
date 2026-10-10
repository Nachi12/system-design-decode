import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

export interface RequestWithId extends Request {
  requestId?: string;
}

export const requestIdMiddleware = (req: RequestWithId, res: Response, next: NextFunction): void => {
  const reqId = (req.headers['x-request-id'] as string) || randomUUID();
  req.requestId = reqId;
  res.setHeader('x-request-id', reqId);
  next();
};
