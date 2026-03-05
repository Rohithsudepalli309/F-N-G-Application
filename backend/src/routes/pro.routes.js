/**
 * pro.routes.js
 * POST /api/v1/pro/subscribe  — create Razorpay order for the chosen plan
 * POST /api/v1/pro/verify     — verify payment signature and upgrade user to Pro
 * GET  /api/v1/pro/status     — return current Pro status for authenticated user
 */
const express = require('express');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const router = express.Router();
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');
const logger = require('../config/logger');
const env = require('../config/env');

const razorpay = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID,
  key_secret: env.RAZORPAY_KEY_SECRET,
});

// Plan catalogue (amounts in paise)
const PLANS = {
  monthly:   { amount: 9900,   label: '1 Month',   months: 1  },
  quarterly: { amount: 24900,  label: '3 Months',  months: 3  },
  annual:    { amount: 79900,  label: '12 Months', months: 12 },
};

// ------------------------------------------------------------------
// POST /api/v1/pro/subscribe
// Body: { planId: 'monthly' | 'quarterly' | 'annual' }
// Returns: { razorpayOrderId, amount, currency, keyId }
// ------------------------------------------------------------------
router.post('/subscribe', authenticate, async (req, res, next) => {
  try {
    const { planId } = req.body;
    const plan = PLANS[planId];
    if (!plan) {
      return res.status(400).json({ error: 'Invalid planId. Choose monthly, quarterly, or annual.' });
    }

    const rpOrder = await razorpay.orders.create({
      amount: plan.amount,
      currency: 'INR',
      receipt: `pro-${req.user.id}-${Date.now()}`,
      notes: { userId: String(req.user.id), planId, planLabel: plan.label },
    });

    logger.info(`Pro Razorpay order ${rpOrder.id} created for user ${req.user.id} (${planId})`);
    res.json({
      razorpayOrderId: rpOrder.id,
      amount: rpOrder.amount,
      currency: rpOrder.currency,
      keyId: env.RAZORPAY_KEY_ID,
      planId,
    });
  } catch (err) {
    next(err);
  }
});

// ------------------------------------------------------------------
// POST /api/v1/pro/verify
// Body: { razorpayOrderId, razorpayPaymentId, razorpaySignature, planId }
// Returns: { success, proExpiresAt }
// ------------------------------------------------------------------
router.post('/verify', authenticate, async (req, res, next) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, planId } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !planId) {
      return res.status(400).json({ error: 'Missing payment verification fields.' });
    }

    // 1. Verify HMAC signature
    const expectedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      logger.warn(`Pro subscription signature mismatch for user ${req.user.id}`);
      return res.status(400).json({ error: 'Payment signature verification failed.' });
    }

    // 2. Calculate expiry
    const plan = PLANS[planId];
    if (!plan) return res.status(400).json({ error: 'Invalid planId.' });

    const proExpiresAt = new Date();
    proExpiresAt.setMonth(proExpiresAt.getMonth() + plan.months);

    // 3. Upgrade user
    await db.query(
      `UPDATE users
       SET is_pro = TRUE, pro_expires_at = $1, updated_at = NOW()
       WHERE id = $2`,
      [proExpiresAt, req.user.id]
    );

    logger.info(`User ${req.user.id} upgraded to F&G Pro (${planId}), expires ${proExpiresAt.toISOString()}`);
    res.json({ success: true, proExpiresAt });
  } catch (err) {
    next(err);
  }
});

// ------------------------------------------------------------------
// GET /api/v1/pro/status
// Returns: { isPro, proExpiresAt | null }
// ------------------------------------------------------------------
router.get('/status', authenticate, async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT is_pro, pro_expires_at FROM users WHERE id = $1`,
      [req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found.' });

    const { is_pro, pro_expires_at } = result.rows[0];
    // If subscription has lapsed, auto-downgrade
    const expired = is_pro && pro_expires_at && new Date(pro_expires_at) < new Date();
    if (expired) {
      await db.query(`UPDATE users SET is_pro = FALSE WHERE id = $1`, [req.user.id]);
      return res.json({ isPro: false, proExpiresAt: null });
    }

    res.json({ isPro: !!is_pro, proExpiresAt: pro_expires_at || null });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
