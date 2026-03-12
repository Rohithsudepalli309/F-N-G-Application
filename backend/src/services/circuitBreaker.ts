/**
 * circuitBreaker.ts — Circuit breaker factory (opossum)
 *
 * WHY: External HTTP calls (Razorpay, FCM, SMS) can hang for up to 30 seconds
 * when the downstream service is degraded. With 10 concurrent checkouts, that's
 * 300 seconds of blocked event-loop. A circuit breaker:
 *
 *   CLOSED  → normal operation, calls pass through
 *   OPEN    → after errorThresholdPercentage failures in a window, all calls
 *             fail fast (<1 ms) with a clear error — no waiting
 *   HALF_OPEN → after resetTimeout, one probe call; if it succeeds → CLOSED,
 *               if it fails → OPEN again
 *
 * Usage:
 *   const breaker = createBreaker('razorpay', myAsyncFn);
 *   const result  = await breaker.fire(...args);
 *
 * All state transitions are logged as structured events.
 */
import CircuitBreaker from 'opossum';
import { logger } from '../logger';

interface BreakerOptions {
  /** Max ms to wait before counting as a failure. Default: 5 000 */
  timeout?: number;
  /** % of calls that must fail before opening. Default: 50 */
  errorThresholdPercentage?: number;
  /** ms to wait in OPEN state before trying a probe call. Default: 30 000 */
  resetTimeout?: number;
  /** Minimum calls in window before trip is possible. Default: 5 */
  volumeThreshold?: number;
}

const DEFAULTS: Required<BreakerOptions> = {
  timeout:                     5_000,
  errorThresholdPercentage:    50,
  resetTimeout:                30_000,
  volumeThreshold:             5,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createBreaker(
  name: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fn: (...args: any[]) => Promise<any>,
  options: BreakerOptions = {}
): CircuitBreaker {
  const breaker = new CircuitBreaker(fn, {
    ...DEFAULTS,
    ...options,
    name,
    rollingCountTimeout: 10_000, // 10-second rolling window for error rate
    rollingCountBuckets: 10,
  });

  breaker.on('open',     () => logger.warn('[circuit] OPEN — failing fast',   { name }));
  breaker.on('halfOpen', () => logger.info('[circuit] HALF_OPEN — probing',   { name }));
  breaker.on('close',    () => logger.info('[circuit] CLOSED — recovered',    { name }));
  breaker.on('fallback', (result: unknown) =>
    logger.warn('[circuit] Fallback triggered', { name, result })
  );
  breaker.on('timeout', () =>
    logger.warn('[circuit] Timeout', { name, timeout: options.timeout ?? DEFAULTS.timeout })
  );

  return breaker;
}
