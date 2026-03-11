import Redis from 'ioredis';

const url = process.env.REDIS_URL ?? 'redis://localhost:6379';

export const redis = new Redis(url, {
  lazyConnect: true,
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 100, 3000),
  enableOfflineQueue: true,
});

redis.on('connect', () => console.log('[Redis] Connected'));
redis.on('error', (err) => console.error('[Redis] Error:', err.message));

// ── Key constants ──────────────────────────────────────────────────────────
/** Sorted set of lat/lng for currently available drivers */
export const DRIVER_GEO_KEY = 'drivers:geo';

/** ZSet key prefix for rolling order demand per store */
export const SURGE_KEY_PREFIX = 'surge:orders:';

/** Pending driver assignment jobs (orderId → driverSocketIds[]) */
export const ASSIGN_KEY_PREFIX = 'assign:';
