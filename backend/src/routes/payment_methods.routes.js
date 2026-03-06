const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');

// All payment-method routes require authentication
router.use(authenticate);

// GET /api/v1/payment-methods — list saved payment methods
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT id, type, identifier, provider, is_default, created_at
       FROM payment_methods
       WHERE user_id = $1
       ORDER BY is_default DESC, created_at DESC`,
      [req.user.id]
    );
    res.json({ methods: rows });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/payment-methods — save a new payment method
router.post('/', async (req, res, next) => {
  try {
    const { type, identifier, provider, is_default = false } = req.body;

    if (!['upi', 'card', 'wallet'].includes(type)) {
      return res.status(400).json({ error: 'type must be "upi", "card", or "wallet"' });
    }
    if (!identifier || typeof identifier !== 'string' || identifier.trim().length === 0) {
      return res.status(400).json({ error: 'identifier is required' });
    }

    // If this should be default, clear existing default first
    if (is_default) {
      await db.query(
        'UPDATE payment_methods SET is_default = FALSE WHERE user_id = $1',
        [req.user.id]
      );
    }

    const { rows } = await db.query(
      `INSERT INTO payment_methods (user_id, type, identifier, provider, is_default)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, type, identifier, provider, is_default`,
      [req.user.id, type, identifier.trim(), provider || null, is_default]
    );

    res.status(201).json({ method: rows[0] });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/payment-methods/:id — remove a saved payment method
router.delete('/:id', async (req, res, next) => {
  try {
    const { rowCount } = await db.query(
      'DELETE FROM payment_methods WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (rowCount === 0) {
      return res.status(404).json({ error: 'Payment method not found' });
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
