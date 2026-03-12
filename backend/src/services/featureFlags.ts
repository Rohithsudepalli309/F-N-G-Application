/**
 * featureFlags.ts — Redis-backed feature flags with in-process 30-second cache
 *
 * WHY: Deploying new features (new checkout UI, surge pricing v2, COD toggle)
 * without a feature flag system means all-or-nothing deployments. Flags allow:
 *  - Instant kill-switch for broken features without a redeploy
 *  - Percentage rollouts: ship to 5% → 25% → 100% of users
 *  - Allowlist-based dogfooding for internal users
 *
 * DATA MODEL (stored in Redis as JSON strings):
 *   Key   : feature:<flagName>
 *   Value : { enabled: boolean, rollout: 0.0–1.0, allowList?: number[] }
 *
 *   enabled  false  → flag is globally OFF for everyone
 *   enabled  true   → evaluate rollout / allowList
 *   rollout  1.0    → 100% of users get it (default)
 *   rollout  0.0–1.0 → deterministic per-user bucket (userId hash % 100)
 *   allowList        → explicit user IDs that always get the flag
 *
 * CACHE: 30-second in-process TTL to avoid Redis round-trips on every request.
 *        Call invalidateFlag(name) when you update a flag via admin API.
 *
 * USAGE:
 *   const enabled = await isEnabled('new_checkout_flow', userId);
 *   if (enabled) { ... }
 *
 * SET A FLAG (redis-cli):
 *   SET feature:new_checkout_flow '{"enabled":true,"rollout":0.05}'   EX 0
 *   SET feature:cod_payment        '{"enabled":true,"rollout":1}'
 *   SET feature:surge_pricing_v2   '{"enabled":true,"rollout":1,"allowList":[1,7,42]}'
 */
import { redis } from '../redis';
import { logger } from '../logger';

interface FlagConfig {
  enabled:   boolean;
  rollout:   number;          // 0.0 – 1.0; 1.0 = 100% of users
  allowList?: number[];       // user IDs that always get the flag
}

const CACHE_TTL_MS = 30_000; // 30 seconds in-process cache

interface CacheEntry {
  config:    FlagConfig;
  expiresAt: number;           // Date.now() + TTL
}

const cache = new Map<string, CacheEntry>();

/**
 * Simple deterministic hash: maps userId to a bucket 0–99.
 * For the same userId, the bucket never changes → a rollout of 10%
 * always gives the same users access.
 */
function userBucket(userId: string | number): number {
  const str = String(userId);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0; // keep unsigned 32-bit
  }
  return hash % 100;
}

async function fetchFlag(name: string): Promise<FlagConfig | null> {
  try {
    const raw = await redis.get(`feature:${name}`);
    if (!raw) return null;
    return JSON.parse(raw) as FlagConfig;
  } catch (err) {
    logger.error('[featureFlags] Redis error reading flag', { name, err });
    return null;
  }
}

/**
 * Returns true if the feature flag is active for the given user.
 *
 * If userId is omitted, only globally-enabled (rollout = 1.0) flags return true.
 * Unknown flags default to false (fail-safe).
 */
export async function isEnabled(
  flagName: string,
  userId?: number | string
): Promise<boolean> {
  const cached = cache.get(flagName);
  if (cached && Date.now() < cached.expiresAt) {
    return evaluate(cached.config, userId);
  }

  const config = await fetchFlag(flagName);
  if (!config) {
    // Unknown flag — default OFF; don't cache so a newly created flag is
    // picked up within one request cycle without needing invalidation.
    return false;
  }

  cache.set(flagName, { config, expiresAt: Date.now() + CACHE_TTL_MS });
  return evaluate(config, userId);
}

function evaluate(config: FlagConfig, userId?: number | string): boolean {
  if (!config.enabled) return false;

  // AllowList takes precedence over rollout percentage
  if (userId !== undefined && config.allowList?.includes(Number(userId))) {
    return true;
  }

  if (config.rollout >= 1.0) return true;
  if (config.rollout <= 0.0) return false;

  if (userId === undefined) {
    // No user context — only allow if 100% rollout
    return false;
  }

  const bucket = userBucket(userId);
  return bucket < config.rollout * 100;
}

/** Remove a flag from the in-process cache (use after admin update). */
export function invalidateFlag(name: string): void {
  cache.delete(name);
  logger.info('[featureFlags] Cache invalidated', { name });
}

/**
 * Convenience: set a flag directly from code / admin route.
 * Prefer redis-cli or an admin API for runtime changes.
 */
export async function setFlag(name: string, config: FlagConfig): Promise<void> {
  try {
    await redis.set(`feature:${name}`, JSON.stringify(config));
    invalidateFlag(name);
    logger.info('[featureFlags] Flag updated', { name, config });
  } catch (err) {
    logger.error('[featureFlags] Redis error writing flag', { name, err });
    throw err;
  }
}
