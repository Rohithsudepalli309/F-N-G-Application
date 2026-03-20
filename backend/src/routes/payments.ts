import { Router } from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import pool from '../db';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { io } from '../server';
import { createBreaker } from '../services/circuitBreaker';
import { publishOrderEvent } from '../services/eventBus';
import { validate, schemas } from '../utils/validation';
import { logger } from '../logger';

const router = Router();
router.use(requireAuth);

// Module-level cached Razorpay instance (initialised lazily on first use)
let _razorpay: Razorpay | null = null;
function getRazorpay(): Razorpay {
  if (_razorpay) return _razorpay;
  const keyId     = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error('Razorpay keys not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
  }
  _razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
  return _razorpay;
}

// Circuit breaker wrapping Razorpay order creation.
// Opens after 50% error rate in a 10s window; recovers after 30s.
const rzpCreateBreaker = createBreaker(
  'razorpay.orders.create',
  (amount: number, receipt: string, notes: Record<string, string>) =>
    getRazorpay().orders.create({ amount, currency: 'INR', receipt, notes }),
  { timeout: 8_000 } // Razorpay P99 is ~4s; allow 8s before counting as failure
);

// ── POST /payments/orders ─── Create a Razorpay order ──────────────────────
router.post('/orders', validate(schemas.payments.createOrder), async (req: AuthRequest, res) => {
  const { orderId } = req.body as { orderId?: number };

  if (!orderId) {
    res.status(400).json({ error: 'orderId is required.' });
    return;
  }

  // SECURITY: Always use the server-side total — never trust client-supplied amount.
  // A malicious client could send amount=100 (₹1) for a ₹5,000 order.
  const orderRes = await pool.query(
    `SELECT id, total_amount, payment_status, payment_method
     FROM orders WHERE id=$1 AND customer_id=$2`,
    [orderId, req.user!.id]
  );
  if (orderRes.rows.length === 0) {
    res.status(404).json({ error: 'Order not found.' });
    return;
  }
  const order = orderRes.rows[0];
  if (order.payment_status === 'paid') {
    res.status(400).json({ error: 'Order is already paid.' });
    return;
  }
  if (order.payment_method !== 'online') {
    res.status(400).json({ error: 'Only online payments require a Razorpay order.' });
    return;
  }
  const serverAmount: number = order.total_amount;
  if (serverAmount < 100) {
    res.status(400).json({ error: 'Order total is below minimum payment amount.' });
    return;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rzpOrder = await (rzpCreateBreaker as any).fire(
      serverAmount,           // server-verified amount — never use client input
      `fng-${orderId}`,
      { fng_order_id: String(orderId) }
    ) as { id: string; currency: string; amount: number };

    // Persist Razorpay order_id against F&G order
    await pool.query(
      `UPDATE orders SET razorpay_order_id=$1 WHERE id=$2`,
      [rzpOrder.id, orderId]
    );

    res.json({
      order_id:  rzpOrder.id,
      currency:  rzpOrder.currency,
      amount:    rzpOrder.amount,
      key_id:    process.env.RAZORPAY_KEY_ID,
    });
  } catch (e) {
    const isOpen = (e as Error).message?.includes('Circuit breaker is open');
    if (isOpen) {
      res.status(503).json({ error: 'Payment service temporarily unavailable. Please try again shortly.' });
    } else {
      res.status(502).json({ error: 'Could not create payment order. Please try again.' });
    }
  }
});

// ── POST /payments/verify ─── Verify Razorpay payment signature ────────────
router.post('/verify', validate(schemas.payments.verify), async (req: AuthRequest, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    orderId,
  } = req.body as {
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
    orderId?: number;
  };

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
    res.status(400).json({ error: 'Missing required payment fields.' });
    return;
  }

  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    res.status(500).json({ error: 'Payment gateway not configured.' });
    return;
  }

  // Verify HMAC signature
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expected !== razorpay_signature) {
    res.status(400).json({ error: 'Payment signature verification failed.' });
    return;
  }

  // Verify order ownership and Razorpay order ID
  const orderRes = await pool.query(
    `SELECT id, razorpay_order_id, payment_method, payment_status
     FROM orders WHERE id=$1 AND customer_id=$2`,
    [orderId, req.user!.id]
  );
  if (orderRes.rows.length === 0) {
    res.status(404).json({ error: 'Order not found.' });
    return;
  }
  const orderRow = orderRes.rows[0];
  if (orderRow.payment_method !== 'online') {
    res.status(400).json({ error: 'Payment verification is only valid for online orders.' });
    return;
  }
  if (orderRow.payment_status === 'paid') {
    res.status(200).json({ success: true, status: 'confirmed' });
    return;
  }
  if (orderRow.razorpay_order_id && orderRow.razorpay_order_id !== razorpay_order_id) {
    res.status(400).json({ error: 'Payment order mismatch. Please retry.' });
    return;
  }

  // Update order to paid
  const result = await pool.query(
    `UPDATE orders
     SET payment_status='paid',
         razorpay_payment_id=$1,
         status='confirmed',
         confirmed_at=NOW()
     WHERE id=$2 AND customer_id=$3 AND payment_status='pending'
     RETURNING *`,
    [razorpay_payment_id, orderId, req.user!.id]
  );

  if (result.rows.length === 0) {
    res.status(404).json({ error: 'Order not found.' });
    return;
  }

  const order = result.rows[0];

  // Notify merchant
  io.to(`merchant:${order.store_id}`).emit('order:status_change', {
    orderId:    order.id,
    orderNumber: order.order_number,
    status:     'confirmed',
  });
  io.to(`order:${orderId}`).emit('order:status', { status: 'confirmed' });

  // Async: FCM to merchant via event bus (fire-and-forget)
  publishOrderEvent({
    type:       'payment.confirmed',
    orderId:    String(order.id),
    storeId:    String(order.store_id),
    customerId: String(req.user!.id),
    payload:    JSON.stringify({
      orderNumber: order.order_number,
      totalAmount: order.total_amount,
    }),
    requestId:  req.requestId ?? '',
  });

  res.json({ success: true, status: 'confirmed' });
});

// ── POST /payments/webhook ─── Razorpay webhook (server-side fallback) ──────
// SECURITY: Signature verification is MANDATORY. If RAZORPAY_WEBHOOK_SECRET is
// not configured the endpoint is disabled (500) to prevent unsigned forgeries.
// ── POST /payments/refund ─── Initiate Razorpay refund for a paid cancelled order ─
router.post('/refund', validate(schemas.payments.refund), async (req: AuthRequest, res) => {
  const { orderId } = req.body as { orderId?: number };
  if (!orderId) {
    res.status(400).json({ error: 'orderId is required.' });
    return;
  }

  const orderRes = await pool.query(
    `SELECT id, payment_status, razorpay_payment_id, total_amount, status
     FROM orders WHERE id=$1 AND customer_id=$2`,
    [orderId, req.user!.id]
  );
  if (orderRes.rows.length === 0) {
    res.status(404).json({ error: 'Order not found.' });
    return;
  }
  const order = orderRes.rows[0];

  if (order.payment_status !== 'paid') {
    res.status(400).json({ error: 'Only paid orders can be refunded.' });
    return;
  }
  if (!['cancelled', 'refunded'].includes(order.status)) {
    res.status(400).json({ error: 'Order must be cancelled before requesting a refund.' });
    return;
  }
  if (order.payment_status === 'refunded') {
    res.status(400).json({ error: 'Order has already been refunded.' });
    return;
  }
  if (!order.razorpay_payment_id) {
    res.status(400).json({ error: 'No payment found for this order.' });
    return;
  }

  try {
    const rzp = getRazorpay();
    await rzp.payments.refund(order.razorpay_payment_id, {
      amount: order.total_amount,            // full refund in paise
      speed: 'optimum',
      notes: { reason: 'Customer cancellation', fng_order_id: String(orderId) },
    });

    await pool.query(
      `UPDATE orders SET payment_status='refunded', status='refunded' WHERE id=$1`,
      [orderId]
    );
    res.json({ ok: true, message: 'Refund initiated. Amount will credit in 5-7 business days.' });
  } catch (e) {
    logger.error('[payments/refund]', { err: e });
    res.status(502).json({ error: 'Could not process refund. Please contact support.' });
  }
});

// ── GET /payments/surge/:storeId ─── Current surge multiplier ──────────────
router.get('/surge/:storeId', async (req: AuthRequest, res) => {
  const { storeId } = req.params;
  const { getSurgeMultiplier } = await import('../services/surge');
  const multiplier = await getSurgeMultiplier(Number(storeId));
  res.json({ multiplier, storeId: Number(storeId) });
});

export default router;
