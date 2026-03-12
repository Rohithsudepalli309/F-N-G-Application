import { Router } from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import pool from '../db';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { createBreaker } from '../services/circuitBreaker';

const router = Router();
router.use(requireAuth);

const PLAN_CONFIG: Record<string, { months: number; priceRupees: number }> = {
  monthly:   { months: 1,  priceRupees: 99  },
  quarterly: { months: 3,  priceRupees: 249 },
  annual:    { months: 12, priceRupees: 799 },
};

function getRazorpay(): Razorpay {
  const keyId     = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error('Razorpay keys not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
  }
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

async function createRazorpayOrder(amount: number, receipt: string, notes: Record<string, string>) {
  const rzp = getRazorpay();
  return rzp.orders.create({ amount, currency: 'INR', receipt, notes });
}

const razorpayBreaker = createBreaker('razorpay-orders', createRazorpayOrder, {
  timeout: 8_000,
  errorThresholdPercentage: 50,
  resetTimeout: 30_000,
  volumeThreshold: 3,
});

// ─── GET /pro/status ──────────────────────────────────────────────────────────
router.get('/status', async (req: AuthRequest, res) => {
  const result = await pool.query(
    `SELECT plan_id, expires_at, status
     FROM pro_subscriptions
     WHERE user_id=$1 AND status='active' AND expires_at > NOW()
     ORDER BY expires_at DESC LIMIT 1`,
    [req.user!.id]
  );
  res.json({ isPro: result.rows.length > 0, subscription: result.rows[0] ?? null });
});

// ─── POST /pro/subscribe ─── Create Razorpay order for Pro plan ───────────────
router.post('/subscribe', async (req: AuthRequest, res) => {
  const { planId } = req.body as { planId?: string };
  const plan = planId ? PLAN_CONFIG[planId] : null;
  if (!plan) {
    res.status(400).json({ error: 'planId must be monthly, quarterly, or annual.' });
    return;
  }
  try {
    const rzpOrder = await razorpayBreaker.fire(
      plan.priceRupees * 100,
      `pro-${req.user!.id}-${planId}`,
      { userId: String(req.user!.id), planId: planId! },
    ) as { id: string; currency: string; amount: number };
    res.json({
      razorpayOrderId: rzpOrder.id,
      currency:        rzpOrder.currency,
      amount:          rzpOrder.amount,
      keyId:           process.env.RAZORPAY_KEY_ID,
    });
  } catch (e) {
    res.status(502).json({ error: (e as Error).message });
  }
});

// ─── POST /pro/verify ─── Verify payment signature and activate subscription ──
router.post('/verify', async (req: AuthRequest, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, planId } = req.body as {
    razorpayOrderId?:   string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    planId?:            string;
  };
  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !planId) {
    res.status(400).json({ error: 'Missing required payment fields.' });
    return;
  }
  const plan = PLAN_CONFIG[planId];
  if (!plan) {
    res.status(400).json({ error: 'Invalid planId.' });
    return;
  }
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    res.status(500).json({ error: 'Payment gateway not configured.' });
    return;
  }

  // Verify Razorpay HMAC signature
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');
  if (expected !== razorpaySignature) {
    res.status(400).json({ error: 'Payment signature verification failed.' });
    return;
  }

  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + plan.months);

  await pool.query(
    `INSERT INTO pro_subscriptions
       (user_id, plan_id, status, razorpay_order_id, razorpay_payment_id, expires_at)
     VALUES ($1,$2,'active',$3,$4,$5)
     ON CONFLICT (user_id) DO UPDATE
       SET plan_id=$2, status='active', razorpay_order_id=$3,
           razorpay_payment_id=$4, expires_at=$5, updated_at=NOW()`,
    [req.user!.id, planId, razorpayOrderId, razorpayPaymentId, expiresAt]
  );

  res.json({ ok: true, expiresAt });
});

// ─── DELETE /pro/cancel ─── Cancel active pro subscription ─────────────────
router.delete('/cancel', async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      `UPDATE pro_subscriptions SET status='cancelled', updated_at=NOW()
       WHERE user_id=$1 AND status='active'
       RETURNING id`,
      [req.user!.id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'No active subscription found.' });
      return;
    }
    res.json({ ok: true, message: 'Subscription cancelled successfully.' });
  } catch (err) {
    console.error('[pro/cancel] error:', err);
    res.status(500).json({ error: 'Could not cancel subscription.' });
  }
});

export default router;
