/**
 * httpLogger.ts — Structured HTTP access log middleware
 *
 * Logs every request/response as a single JSON object on completion.
 * Fields: requestId, method, path, status, latency (ms), IP, user-agent.
 * Skips /health polling to avoid log noise.
 */
import { Request, Response, NextFunction } from 'express';
import { logger } from '../logger';

export function httpLogger(req: Request, res: Response, next: NextFunction): void {
  // Skip health-check endpoints to keep logs clean
  if (req.path === '/health') { next(); return; }

  const start = Date.now();

  res.on('finish', () => {
    const ms = Date.now() - start;
    const level = res.statusCode >= 500 ? 'error'
                : res.statusCode >= 400 ? 'warn'
                : 'info';

    logger[level]('http', {
      requestId: req.requestId,
      method:    req.method,
      path:      req.path,
      status:    res.statusCode,
      ms,
      ip:        req.ip,
      ua:        req.headers['user-agent'],
    });
  });

  next();
}
