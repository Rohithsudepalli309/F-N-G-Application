import { Router } from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import pool from '../db';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { io } from '../server';
import { createBreaker } from '../services/circuitBreaker';
import { publishOrderEvent } from '../services/eventBus';

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
router.post('/orders', async (req: AuthRequest, res) => {
  const { amount, orderId } = req.body as { amount?: number; orderId?: number };

  if (!amount || amount < 100 || !orderId) {
    res.status(400).json({ error: 'amount (paise, min ₹1) and orderId are required.' });
    return;
  }

  // Verify the F&G order belongs to this user and is awaiting payment
  const orderRes = await pool.query(
    `SELECT id, total_amount, payment_status FROM orders WHERE id=$1 AND customer_id=$2`,
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

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rzpOrder = await (rzpCreateBreaker as any).fire(
      amount,
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
    console.error('[Payments] Razorpay create order error:', e);
    res.status(502).json({ error: (e as Error).message });
  }
});

// ── POST /payments/verify ─── Verify Razorpay payment signature ────────────
router.post('/verify', async (req: AuthRequest, res) => {
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

  // Update order to paid
  const result = await pool.query(
    `UPDATE orders
     SET payment_status='paid',
         razorpay_payment_id=$1,
         status='confirmed',
         confirmed_at=NOW()
     WHERE id=$2 AND customer_id=$3
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
// Validate X-Razorpay-Signature header; update payment if client-side verify missed
router.post('/webhook', async (req, res) => {
  const signature = req.headers['x-razorpay-signature'] as string | undefined;
  const secret    = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (secret && signature) {
    const digest = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(req.body))
      .digest('hex');
    if (digest !== signature) {
      res.status(400).json({ error: 'Invalid webhook signature.' });
      return;
    }
  }

  const event   = req.body as { event?: string; payload?: { payment?: { entity?: { id?: string; order_id?: string; notes?: { fng_order_id?: string } } } } };
  const payment = event.payload?.payment?.entity;

  if (event.event === 'payment.captured' && payment) {
    const orderId  = payment.notes?.fng_order_id ? parseInt(payment.notes.fng_order_id, 10) : null;
    const paymentId = payment.id;
    if (orderId && paymentId) {
      await pool.query(
        `UPDATE orders
         SET payment_status='paid', razorpay_payment_id=$1,
             status='confirmed', confirmed_at=NOW()
         WHERE id=$2 AND payment_status='pending'`,
        [paymentId, orderId]
      ).catch((e) => console.error('[Webhook] Update failed:', e));
    }
  }

  res.json({ received: true });
});

// ── GET /payments/surge/:storeId ─── Current surge multiplier ──────────────
router.get('/surge/:storeId', async (req: AuthRequest, res) => {
  const { storeId } = req.params;
  const { getSurgeMultiplier } = await import('../services/surge');
  const multiplier = await getSurgeMultiplier(Number(storeId));
  res.json({ multiplier, storeId: Number(storeId) });
});

export default router;
