/**
 * security.ts — Security headers + response compression
 *
 * helmet: Sets HTTP security headers (X-Content-Type-Options, X-Frame-Options,
 *   HSTS, Referrer-Policy, etc.) neutralising a broad class of web attacks.
 *   crossOriginResourcePolicy is set to cross-origin so mobile apps can load
 *   images from the API without CORP blocking.
 *
 * compression: gzip/deflate responses above 1 KB threshold — typically reduces
 *   JSON payload by 60–80%, improving latency on slow mobile connections.
 */
import helmet from 'helmet';
import compression from 'compression';
import { RequestHandler } from 'express';

export const securityHeaders: RequestHandler = helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  // API-only server: no HTML, so CSP and frame-options can be permissive
  contentSecurityPolicy: false,
  frameguard: false,
});

export const compressResponse: RequestHandler = compression({
  threshold: 1024, // only compress responses > 1 KB
  level: 6,        // default; good balance of speed vs ratio
});
