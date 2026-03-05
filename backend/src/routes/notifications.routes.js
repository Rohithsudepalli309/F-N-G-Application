const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');

// All notification routes require authentication
router.use(authenticate);

// GET /api/v1/notifications — fetch notifications for the current user
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { rows } = await db.query(
      `SELECT id, title, body, type, is_read, created_at, data
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [userId]
    );
    res.json({ notifications: rows });
  } catch (err) {
    // If the notifications table doesn't exist yet, return empty
    if (err.code === '42P01') {
      return res.json({ notifications: [] });
    }
    next(err);
  }
});

// PATCH /api/v1/notifications/read-all — mark all as read for the current user
router.patch('/read-all', async (req, res, next) => {
  try {
    const userId = req.user.id;
    await db.query(
      `UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false`,
      [userId]
    );
    res.json({ success: true });
  } catch (err) {
    if (err.code === '42P01') {
      return res.json({ success: true });
    }
    next(err);
  }
});

// PATCH /api/v1/notifications/:id/read — mark single notification as read
router.patch('/:id/read', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { rowCount } = await db.query(
      `UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );
    if (rowCount === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.json({ success: true });
  } catch (err) {
    if (err.code === '42P01') {
      return res.status(404).json({ error: 'Notification not found' });
    }
    next(err);
  }
});

module.exports = router;
