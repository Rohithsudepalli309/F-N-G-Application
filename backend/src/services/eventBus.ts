/**
 * eventBus.ts — Redis Streams event bus
 *
 * WHY: In the original code, order placement triggers ~4 async side-effects
 * inline in the HTTP handler (FCM to merchant, surge recording, socket emit,
 * customer notification). If any of them is slow, it delays the HTTP response.
 * If the process crashes mid-handler, some side-effects may have run and some
 * may not — leaving the system in an inconsistent state.
 *
 * HOW: Instead, route handlers publish a single event to a Redis Stream and
 * return immediately. The background worker (orderEvents.ts) consumes events
 * with at-least-once delivery and consumer group acks.
 *
 * This is the same pattern used by Swiggy, Zomato, and BigBasket — they use
 * Kafka in production; Redis Streams give identical semantics at lower ops cost
 * for a startup-scale deployment.
 */
import { redis } from '../redis';
import { logger } from '../logger';

// ── Stream name constants ────────────────────────────────────────────────────
export const STREAMS = {
  ORDER_EVENTS: 'stream:orders',
} as const;

// ── Event types ──────────────────────────────────────────────────────────────
export type OrderEventType =
  | 'order.placed'
  | 'order.status_changed'
  | 'order.cancelled'
  | 'payment.confirmed';

export interface OrderEvent {
  type:       OrderEventType;
  orderId:    string;
  storeId:    string;
  customerId: string;
  /** JSON-stringified additional data specific to the event */
  payload:    string;
  /** Correlation ID from the originating HTTP request */
  requestId:  string;
}

/**
 * Publish an order event to the Redis Stream.
 * NEVER throws — a failure to publish must not fail the HTTP response.
 */
export async function publishOrderEvent(event: OrderEvent): Promise<void> {
  try {
    await redis.xadd(
      STREAMS.ORDER_EVENTS,
      '*',           // auto-generate monotonic message ID
      'type',       event.type,
      'orderId',    event.orderId,
      'storeId',    event.storeId,
      'customerId', event.customerId,
      'payload',    event.payload,
      'requestId',  event.requestId,
      'ts',         String(Date.now()),
    );
    logger.debug('[eventBus] Published', { type: event.type, orderId: event.orderId });
  } catch (err) {
    // Log but do NOT propagate — callers must not fail on bus unavailability
    logger.warn('[eventBus] Publish failed', {
      type:    event.type,
      orderId: event.orderId,
      err:     (err as Error).message,
    });
  }
}
