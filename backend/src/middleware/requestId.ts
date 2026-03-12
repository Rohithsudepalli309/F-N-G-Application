/**
 * requestId.ts — Correlation ID middleware
 *
 * Reads X-Request-Id from incoming headers (set by upstream load balancers),
 * or generates a fresh UUID v4. Attaches to req.requestId and echoes it back
 * in the response so clients can match logs to their specific request.
 *
 * All downstream log entries include this ID, enabling full request tracing
 * across layers (HTTP handler → event bus → worker → FCM → DB).
 */
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export function requestId(req: Request, res: Response, next: NextFunction): void {
  const existing = req.headers['x-request-id'];
  // Accept an upstream-provided ID (load balancer, API gateway) or generate one
  const id = (Array.isArray(existing) ? existing[0] : existing) ?? uuidv4();
  req.requestId = id;
  res.setHeader('X-Request-Id', id);
  next();
}
