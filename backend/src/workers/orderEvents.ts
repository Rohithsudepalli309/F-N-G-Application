/**
 * orderEvents.ts — Redis Streams consumer / background worker
 *
 * FEAT-007: Stream writes now use MAXLEN ~10000 to prevent unbounded growth.
 * FEAT-008: Added XAUTOCLAIM dead-letter rescue to recover poison-pill messages
 *           that have been idle in the PEL for > 2 minutes (max 2 attempts).
 */
import pool from '../db';
import { redis, DRIVER_GEO_KEY } from '../redis';
import { STREAMS, OrderEventType } from '../services/eventBus';
import { sendPushToUser } from '../services/fcm';
import { recordDemand } from '../services/surge';
import { logger } from '../logger';

const GROUP    = 'order-workers';
const CONSUMER = `worker-${process.pid}`;
const BATCH    = 10;          // messages per read
const BLOCK_MS = 5_000;       // block up to 5 s waiting for new messages
const DEAD_LETTER_IDLE_MS = 120_000; // claim messages idle > 2 min (FEAT-008)
const MAX_RETRY_COUNT = 2;    // discard after 2 failed attempts

// ── Helpers ──────────────────────────────────────────────────────────────────
function parseFields(fields: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i < fields.length; i += 2) out[fields[i]] = fields[i + 1];
  return out;
}

// ── Ensure consumer group exists (idempotent) ────────────────────────────────
async function ensureGroup(): Promise<void> {
  try {
    await redis.xgroup('CREATE', STREAMS.ORDER_EVENTS, GROUP, '0', 'MKSTREAM');
  } catch (e: any) {
    if (!e?.message?.includes('BUSYGROUP')) throw e; // BUSYGROUP = already exists
  }
}

// ── Process a single message ─────────────────────────────────────────────────
async function processMessage(msgId: string, fields: string[]): Promise<void> {
  const data = parseFields(fields);
  const { type, orderId, storeId, customerId, requestId } = data;
  const log = logger.child({ requestId, orderId, type });

  switch (type as OrderEventType) {
    case 'order.placed': {
      // 1. Notify merchant via FCM push
      const storeRow = await pool.query(
        `SELECT owner_id FROM stores WHERE id=$1`, [storeId]
      );
      const ownerRow = storeRow.rows[0];
      if (ownerRow?.owner_id) {
        const orderRow = await pool.query(
          `SELECT order_number, total_amount FROM orders WHERE id=$1`, [orderId]
        );
        const o = orderRow.rows[0];
        if (o) {
          await sendPushToUser(
            ownerRow.owner_id,
            'New Order!',
            `#${o.order_number} • ₹${(o.total_amount / 100).toFixed(0)}`,
            { screen: 'Orders', orderId }
          );
        }
      }
      // 2. Record demand for surge pricing
      await recordDemand(Number(storeId));
      // 3. Confirm to customer (single source — avoids duplicate notification from route)
      await sendPushToUser(
        Number(customerId),
        'Order Confirmed',
        'Your order has been placed and is being processed.',
        { screen: 'OrderTracking', orderId }
      );
      log.info('Processed order.placed');
      break;
    }

    case 'order.status_changed': {
      const extra = JSON.parse(data.payload ?? '{}') as { status?: string };
      const labels: Record<string, string> = {
        preparing:        'Your order is being prepared',
        assigned:         'A driver has been assigned',
        out_for_delivery: 'Order is on the way!',
        delivered:        'Order delivered. Enjoy!',
        cancelled:        'Your order was cancelled',
      };
      const body = labels[extra.status ?? ''];
      if (body) {
        await sendPushToUser(Number(customerId), 'Order Update', body, {
          screen: 'OrderTracking',
          orderId,
        });
      }
      log.info('Processed order.status_changed', { status: extra.status });
      break;
    }

    case 'payment.confirmed': {
      await sendPushToUser(
        Number(customerId),
        'Payment Successful',
        'Your payment has been confirmed.',
        { screen: 'OrderTracking', orderId }
      );
      log.info('Processed payment.confirmed');
      break;
    }

    case 'order.cancelled': {
      await sendPushToUser(
        Number(customerId),
        'Order Cancelled',
        'Your order has been cancelled. Any charges will be refunded.',
        { screen: 'MyOrders', orderId }
      );
      log.info('Processed order.cancelled');
      break;
    }

    default:
      log.warn('Unknown event type — skipping');
  }

  // ACK only after successful processing (at-least-once guarantee)
  await redis.xack(STREAMS.ORDER_EVENTS, GROUP, msgId);
}

// ── FEAT-008: Dead-letter rescue — reclaim idle PEL messages ─────────────────
async function reclaimIdleMessages(): Promise<void> {
  try {
    // xautoclaim returns [nextId, [[msgId, fields], ...], deletedIds]
    const claimed = await (redis as any).xautoclaim(
      STREAMS.ORDER_EVENTS,
      GROUP,
      CONSUMER,
      DEAD_LETTER_IDLE_MS,
      '0-0',
      'COUNT', '10'
    ) as [string, [string, string[]][], string[]];

    const messages = claimed[1] ?? [];
    for (const [msgId, fields] of messages) {
      try {
        await processMessage(msgId, fields);
      } catch {
        // Check delivery count — if this was already retried MAX_RETRY_COUNT times, discard
        const pending = await (redis as any).xpending(
          STREAMS.ORDER_EVENTS, GROUP, '-', '+', 1, CONSUMER
        ) as [string, string, number, number][];
        const deliveryCount = pending.find(p => p[0] === msgId)?.[3] ?? 0;
        if (deliveryCount >= MAX_RETRY_COUNT) {
          logger.error('[orderEvents] Discarding poison-pill message after max retries', { msgId });
          await redis.xack(STREAMS.ORDER_EVENTS, GROUP, msgId);
        }
      }
    }
  } catch {
    // xautoclaim not available on older Redis — non-fatal
  }
}

// ── Worker lifecycle ─────────────────────────────────────────────────────────
let _running = false;
let _reclaimCycle = 0;

export async function startOrderEventWorker(): Promise<void> {
  if (_running) return;
  _running = true;

  await ensureGroup();
  logger.info('[orderEvents] Worker started', { consumer: CONSUMER, group: GROUP });

  // Run the consume loop in the background — does not block server startup
  (async () => {
    while (_running) {
      try {
        // FEAT-008: Run dead-letter rescue every 12 cycles (~1 min at 5s block)
        if (++_reclaimCycle % 12 === 0) {
          await reclaimIdleMessages();
        }

        // XREADGROUP '>' = deliver only messages not yet delivered to any consumer
        const results = (await redis.xreadgroup(
          'GROUP', GROUP, CONSUMER,
          'COUNT', String(BATCH),
          'BLOCK', String(BLOCK_MS),
          'STREAMS', STREAMS.ORDER_EVENTS, '>',
        )) as [string, [string, string[]][]][] | null;

        if (!results) continue; // timed out with no messages

        for (const [, messages] of results) {
          // Process messages in parallel; individual failures don't block others
          await Promise.allSettled(
            messages.map(([id, fields]) =>
              processMessage(id, fields).catch((err) => {
                logger.error('[orderEvents] Message failed — will retry', {
                  msgId: id,
                  err: (err as Error).message,
                });
              })
            )
          );
        }
      } catch (err: any) {
        if (!_running) break;
        logger.error('[orderEvents] Stream read error', { err: err.message });
        await new Promise((r) => setTimeout(r, 2_000)); // back off before retry
      }
    }
    logger.info('[orderEvents] Worker stopped');
  })();
}

export function stopOrderEventWorker(): void {
  _running = false;
}
