import Redis from 'ioredis';
import { logger } from './logger';

const url = process.env.REDIS_URL ?? 'redis://localhost:6379';
const isTest = process.env.NODE_ENV === 'test' || !!process.env.JEST_WORKER_ID;
const redisEnabledFromEnv = process.env.REDIS_ENABLED;

function envFlag(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  const normalized = value.trim().toLowerCase();
  return ['1', 'true', 'yes', 'on'].includes(normalized);
}

const isProd = process.env.NODE_ENV === 'production';
export const redisEnabled = envFlag(redisEnabledFromEnv, isProd);

function createTestRedisMock() {
  const base: any = {
    on: () => base,
    duplicate: () => base,
    quit: async () => 'OK',
    disconnect: () => undefined,
    get: async () => null,
    set: async () => 'OK',
    del: async () => 0,
    expire: async () => 1,
    xadd: async () => '0-0',
    xack: async () => 0,
    xgroup: async () => 'OK',
    xreadgroup: async () => [],
    geoadd: async () => 1,
    georadius: async () => [],
    geopos: async () => [],
    call: async () => null,
    zadd: async () => 0,
    zrem: async () => 0,
    zrange: async () => [],
    zremrangebyscore: async () => 0,
  };

  return new Proxy(base, {
    get(target, prop) {
      if (prop in target) return target[prop as keyof typeof target];
      return async () => null;
    },
  });
}

export const redis: any = isTest || !redisEnabled
  ? createTestRedisMock()
  : new Redis(url, {
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => Math.min(times * 100, 3000),
      enableOfflineQueue: true,
    });

if (!isTest && redisEnabled) {
  redis.on('connect', () => logger.info('[Redis] Connected'));
  redis.on('error', (err: Error) => {
    logger.error('[Redis] Error', { message: err.message });
  });
} else if (!isTest && !redisEnabled) {
  logger.info('[Redis] Disabled for current environment; using in-memory fallback');
}

// ── Key constants ──────────────────────────────────────────────────────────
/** Sorted set of lat/lng for currently available drivers */
export const DRIVER_GEO_KEY = 'drivers:geo';

/** ZSet key prefix for rolling order demand per store */
export const SURGE_KEY_PREFIX = 'surge:orders:';

/** Pending driver assignment jobs (orderId → driverSocketIds[]) */
export const ASSIGN_KEY_PREFIX = 'assign:';
