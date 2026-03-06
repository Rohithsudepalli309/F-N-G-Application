const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');

// All user routes require authentication
router.use(authenticate);

// GET /api/v1/users/me — get current user profile
router.get('/me', async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT id, name, email, phone, role, photo_url, created_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user = rows[0];
    // Never expose sensitive fields
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/users/me — update profile (name, photo_url only — email/phone via auth flow)
router.patch('/me', async (req, res, next) => {
  try {
    const { name, photo_url } = req.body;
    const updates = [];
    const values = [];
    let idx = 1;

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ error: 'Name cannot be empty' });
      }
      updates.push(`name = $${idx++}`);
      values.push(name.trim());
    }
    if (photo_url !== undefined) {
      updates.push(`photo_url = $${idx++}`);
      values.push(photo_url);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(req.user.id);
    const { rows } = await db.query(
      `UPDATE users SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${idx}
       RETURNING id, name, email, phone, role, photo_url`,
      values
    );

    res.json({ user: rows[0] });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/users/favorites — list favourite stores/products
router.get('/favorites', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { rows } = await db.query(
      `SELECT
         f.id,
         f.target_type,
         f.target_id,
         f.created_at,
         COALESCE(s.name, p.name)           AS name,
         COALESCE(s.image_url, p.image_url) AS image_url,
         s.cuisine_tags,
         s.rating,
         s.delivery_time_min                AS delivery_time,
         s.is_active
       FROM user_favorites f
       LEFT JOIN stores   s ON f.target_type = 'store'   AND f.target_id = s.id::text
       LEFT JOIN products p ON f.target_type = 'product' AND f.target_id = p.id::text
       WHERE f.user_id = $1
       ORDER BY f.created_at DESC`,
      [userId]
    );
    res.json({ favorites: rows });
  } catch (err) {
    // If table doesn't exist yet
    if (err.code === '42P01') {
      return res.json({ favorites: [] });
    }
    next(err);
  }
});

// POST /api/v1/users/favorites — add a favourite
router.post('/favorites', async (req, res, next) => {
  try {
    const { target_type, target_id } = req.body;
    if (!['store', 'product'].includes(target_type) || !target_id) {
      return res.status(400).json({ error: 'target_type must be "store" or "product" and target_id is required' });
    }
    const { rows } = await db.query(
      `INSERT INTO user_favorites (user_id, target_type, target_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, target_type, target_id) DO NOTHING
       RETURNING id`,
      [req.user.id, target_type, String(target_id)]
    );
    res.status(201).json({ id: rows[0]?.id ?? null });
  } catch (err) {
    if (err.code === '42P01') {
      return res.status(503).json({ error: 'Favorites feature not yet available' });
    }
    next(err);
  }
});

// DELETE /api/v1/users/favorites/:id — remove a favourite by row id
router.delete('/favorites/:id', async (req, res, next) => {
  try {
    const { rowCount } = await db.query(
      `DELETE FROM user_favorites WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (rowCount === 0) {
      return res.status(404).json({ error: 'Favorite not found' });
    }
    res.json({ success: true });
  } catch (err) {
    if (err.code === '42P01') {
      return res.status(404).json({ error: 'Favorite not found' });
    }
    next(err);
  }
});

module.exports = router;
