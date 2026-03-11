import { redis, SURGE_KEY_PREFIX } from '../redis';

const DEMAND_WINDOW_MS = 30 * 60 * 1000; // 30-minute rolling window

/** Surge thresholds: orders in last 30 min → multiplier */
const THRESHOLDS = [
  { min: 30, multiplier: 1.5 },
  { min: 20, multiplier: 1.3 },
  { min: 10, multiplier: 1.15 },
];

/** Record a new order for demand counting. Call after order is placed. */
export async function recordDemand(storeId: number): Promise<void> {
  try {
    const key  = `${SURGE_KEY_PREFIX}${storeId}`;
    const now  = Date.now();
    const cutoff = now - DEMAND_WINDOW_MS;
    await redis
      .pipeline()
      .zadd(key, now, String(now))
      .zremrangebyscore(key, 0, cutoff)
      .expire(key, 3600)
      .exec();
  } catch {/* non-critical — Redis may be unavailable */}
}

/** Return the current delivery-fee surge multiplier for a store (default 1.0). */
export async function getSurgeMultiplier(storeId: number): Promise<number> {
  try {
    const key    = `${SURGE_KEY_PREFIX}${storeId}`;
    const cutoff = Date.now() - DEMAND_WINDOW_MS;
    const count  = await redis.zcount(key, cutoff, '+inf');
    for (const t of THRESHOLDS) {
      if (count >= t.min) return t.multiplier;
    }
  } catch {/* Redis unavailable → no surge */}
  return 1.0;
}
