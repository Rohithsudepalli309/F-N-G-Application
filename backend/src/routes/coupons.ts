import { Router } from 'express';
import pool from '../db';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// ─── GET /coupons ─── List active public coupons ──────────────────────────
router.get('/', async (_req, res) => {
  const result = await pool.query(
    `SELECT id, code, description, discount_type, discount_value,
            min_order_amount, max_discount, valid_until
     FROM coupons
     WHERE is_active = TRUE
       AND used_count < max_uses
       AND (valid_until IS NULL OR valid_until > NOW())
     ORDER BY created_at DESC`
  );
  res.json({ coupons: result.rows });
});

// ─── POST /coupons/validate ─── Validate coupon for an order ─────────────
router.post('/validate', requireAuth, async (req: AuthRequest, res) => {
  const { code, orderTotal } = req.body as { code?: string; orderTotal?: number };

  if (!code || !orderTotal) {
    res.status(400).json({ error: 'code and orderTotal (paise) are required.' });
    return;
  }

  const result = await pool.query(
    `SELECT * FROM coupons
     WHERE code = UPPER($1)
       AND is_active = TRUE
       AND used_count < max_uses
       AND (valid_until IS NULL OR valid_until > NOW())
     LIMIT 1`,
    [code]
  );

  if (result.rows.length === 0) {
    res.status(400).json({ error: 'Invalid or expired coupon.' });
    return;
  }

  const cp = result.rows[0];
  if (orderTotal < cp.min_order_amount) {
    res.status(400).json({
      error: `Minimum order amount ₹${cp.min_order_amount / 100} required.`,
    });
    return;
  }

  let discount: number;
  if (cp.discount_type === 'flat') {
    discount = Math.min(cp.discount_value, orderTotal);
  } else {
    discount = Math.round((orderTotal * cp.discount_value) / 100);
    if (cp.max_discount && discount > cp.max_discount) {
      discount = cp.max_discount;
    }
  }

  res.json({
    valid: true,
    discount,        // paise
    couponId: cp.id,
    message: cp.description ?? `You save ₹${(discount / 100).toFixed(0)}!`,
  });
});

export default router;
