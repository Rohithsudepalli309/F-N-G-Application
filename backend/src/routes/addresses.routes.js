const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');

// GET /api/v1/addresses — list user's saved addresses
router.get('/', authenticate, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT * FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, id ASC`,
      [req.user.id]
    );
    res.json({ addresses: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch addresses' });
  }
});

// POST /api/v1/addresses — add a new address
router.post('/', authenticate, async (req, res) => {
  const { label = 'Home', line1, line2, city = 'Hyderabad', pincode, lat, lng } = req.body;
  if (!line1) return res.status(400).json({ error: 'line1 is required' });

  try {
    // If this is the first address, set it default
    const { rows: existing } = await db.query(
      `SELECT id FROM addresses WHERE user_id = $1 LIMIT 1`,
      [req.user.id]
    );
    const isDefault = existing.length === 0;

    const { rows } = await db.query(
      `INSERT INTO addresses (user_id, label, line1, line2, city, pincode, lat, lng, is_default)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [req.user.id, label, line1, line2 || null, city, pincode || null, lat || null, lng || null, isDefault]
    );
    res.status(201).json({ address: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add address' });
  }
});

// PATCH /api/v1/addresses/:id/default — set as default
router.patch('/:id/default', authenticate, async (req, res) => {
  try {
    // Clear existing default
    await db.query(
      `UPDATE addresses SET is_default = FALSE WHERE user_id = $1`,
      [req.user.id]
    );
    // Set new default
    const { rows } = await db.query(
      `UPDATE addresses SET is_default = TRUE WHERE id = $1 AND user_id = $2 RETURNING *`,
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Address not found' });
    res.json({ address: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update default address' });
  }
});

// PUT /api/v1/addresses/:id — edit address fields
router.put('/:id', authenticate, async (req, res) => {
  const { label, line1, line2, city, pincode, lat, lng } = req.body;
  try {
    const { rows } = await db.query(
      `UPDATE addresses SET
         label    = COALESCE($1, label),
         line1    = COALESCE($2, line1),
         line2    = COALESCE($3, line2),
         city     = COALESCE($4, city),
         pincode  = COALESCE($5, pincode),
         lat      = COALESCE($6, lat),
         lng      = COALESCE($7, lng)
       WHERE id = $8 AND user_id = $9
       RETURNING *`,
      [label, line1, line2, city, pincode, lat, lng, req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Address not found' });
    res.json({ address: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update address' });
  }
});

// DELETE /api/v1/addresses/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { rowCount } = await db.query(
      `DELETE FROM addresses WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (!rowCount) return res.status(404).json({ error: 'Address not found' });
    res.json({ message: 'Address deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete address' });
  }
});

module.exports = router;
