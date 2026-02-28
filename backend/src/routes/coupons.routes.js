const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');

// POST /api/v1/coupons/validate — check coupon and return discount
router.post('/validate', authenticate, async (req, res) => {
  const { code, orderTotal } = req.body;
  if (!code || !orderTotal) {
    return res.status(400).json({ error: 'code and orderTotal are required' });
  }

  try {
    const { rows } = await db.query(
      `SELECT * FROM coupons WHERE code = $1 AND is_active = TRUE`,
      [code.toUpperCase().trim()]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Invalid or expired coupon' });
    }

    const coupon = rows[0];
    const now = new Date();

    if (coupon.valid_until && new Date(coupon.valid_until) < now) {
      return res.status(400).json({ error: 'Coupon has expired' });
    }

    if (coupon.valid_from && new Date(coupon.valid_from) > now) {
      return res.status(400).json({ error: 'Coupon is not yet active' });
    }

    if (coupon.used_count >= coupon.max_uses) {
      return res.status(400).json({ error: 'Coupon usage limit reached' });
    }

    if (orderTotal < coupon.min_order_amount) {
      return res.status(400).json({
        error: `Minimum order amount ₹${coupon.min_order_amount / 100} required`,
      });
    }

    let discount = 0;
    if (coupon.discount_type === 'flat') {
      discount = coupon.discount_value;
    } else if (coupon.discount_type === 'percent') {
      discount = Math.round((orderTotal * coupon.discount_value) / 100);
      if (coupon.max_discount) {
        discount = Math.min(discount, coupon.max_discount);
      }
    }

    discount = Math.min(discount, orderTotal);

    res.json({
      valid: true,
      couponId: coupon.id,
      code: coupon.code,
      description: coupon.description,
      discount,
      discountType: coupon.discount_type,
      finalAmount: orderTotal - discount,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to validate coupon' });
  }
});

// GET /api/v1/coupons — list active public coupons
router.get('/', authenticate, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, code, description, discount_type, discount_value,
              min_order_amount, max_discount, valid_until
       FROM coupons
       WHERE is_active = TRUE
         AND (valid_until IS NULL OR valid_until > NOW())
         AND used_count < max_uses
       ORDER BY discount_value DESC`
    );
    res.json({ coupons: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch coupons' });
  }
});

module.exports = router;
