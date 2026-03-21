/**
 * express.d.ts — Global Express Request type extensions
 *
 * Adds `requestId` (correlation ID) to every Express Request object.
 * Import this file anywhere that reads `req.requestId`.
 */
declare namespace Express {
  interface Request {
    /** RFC-4122 UUID correlation ID — set by requestId middleware, forwarded in X-Request-Id header */
    requestId?: string;
  }
}
