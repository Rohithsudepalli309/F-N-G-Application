import http from 'http';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { redis } from './redis';
import { logger } from './logger';
import { requestId } from './middleware/requestId';
import { httpLogger } from './middleware/httpLogger';
import { securityHeaders, compressResponse } from './middleware/security';
import { startOrderEventWorker } from './workers/orderEvents';

dotenv.config();

// LOW-1: Validate critical secrets at startup before touching any routes
const jwtSecret = process.env.JWT_SECRET ?? '';
if (jwtSecret.length < 32) {
  throw new Error(
    'JWT_SECRET must be at least 32 characters. Set a strong secret in your .env file.'
  );
}
import { initSocket } from './socket';
import authRouter          from './routes/auth';
import storesRouter        from './routes/stores';
import ordersRouter        from './routes/orders';
import merchantRouter      from './routes/merchant';
import adminRouter         from './routes/admin';
import analyticsRouter     from './routes/analytics';
import couponsRouter       from './routes/coupons';
import addressesRouter     from './routes/addresses';
import driverRouter        from './routes/driver';
import paymentsRouter      from './routes/payments';
import notificationsRouter from './routes/notifications';
import usersRouter         from './routes/users';
import proRouter           from './routes/pro';
import referralsRouter     from './routes/referrals';
import productsRouter      from './routes/products';

const app = express();
const server = http.createServer(app);

// ── Globals ────────────────────────────────────────────────────────────────
export const io = initSocket(server);

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(securityHeaders);
app.use(compressResponse);
app.use(requestId);
app.use(httpLogger);

// HIGH-5: never fall back to wildcard CORS — fail loud in production, localhost in dev
const rawAllowedOrigins = process.env.ALLOWED_ORIGINS;
let corsOrigin: string | string[];
if (rawAllowedOrigins) {
  corsOrigin = rawAllowedOrigins.split(',').map((s) => s.trim());
} else if (process.env.NODE_ENV === 'production') {
  throw new Error('ALLOWED_ORIGINS must be set in production');
} else {
  corsOrigin = 'http://localhost:5173';
}

app.use(cors({
  origin: corsOrigin,
  credentials: true,
}));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Build Redis-backed store only in production when Redis is configured.
// Falls back to in-memory store for local development (Redis not required).
function makeRedisStore() {
  if (process.env.NODE_ENV !== 'production') return undefined;
  return new RedisStore({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sendCommand: (...args: string[]) => redis.call(args[0], ...args.slice(1)) as any,
  });
}

// Rate-limit all API calls to 300/min per IP
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeRedisStore(),
});
app.use('/api', limiter);

// Stricter rate-limit on auth (20 req/min)
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: 'Too many requests, please try again later.' },
  store: makeRedisStore(),
});
app.use('/api/v1/auth', authLimiter);

// ── Routes ─────────────────────────────────────────────────────────────────
app.use('/api/v1/auth',           authRouter);
app.use('/api/v1/stores',         storesRouter);
app.use('/api/v1/orders',         ordersRouter);
app.use('/api/v1/merchant',       merchantRouter);
app.use('/api/v1/admin',          adminRouter);
app.use('/api/v1/analytics',      analyticsRouter);
app.use('/api/v1/coupons',        couponsRouter);
app.use('/api/v1/addresses',      addressesRouter);
app.use('/api/v1/driver',         driverRouter);
app.use('/api/v1/payments',       paymentsRouter);
app.use('/api/v1/notifications',  notificationsRouter);
app.use('/api/v1/users',          usersRouter);
app.use('/api/v1/pro',            proRouter);
app.use('/api/v1/referrals',      referralsRouter);
app.use('/api/v1/products',       productsRouter);
app.use('/api/v1/grocery',        productsRouter);  // alias for categories endpoint

// ── Health check ─────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', ts: new Date().toISOString() });
});

// ── 404 catch-all ─────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ── Error handler ─────────────────────────────────────────────────────────
app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled request error', {
    requestId: (req as express.Request & { requestId?: string }).requestId,
    error: err.message,
    stack: err.stack,
  });
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT ?? 3002);
server.listen(PORT, () => {
  logger.info(`[F&G Backend] Running on port ${PORT}`, { port: PORT, env: process.env.NODE_ENV ?? 'development' });
  startOrderEventWorker().catch((err) =>
    logger.error('Order event worker failed to start', { err })
  );
});
