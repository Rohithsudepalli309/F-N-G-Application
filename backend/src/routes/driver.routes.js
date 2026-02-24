const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const db = require('../config/db');
const { notifyOrderStatus, notifyOrderCompleted } = require('../services/socket.service');
const logger = require('../config/logger');

/**
 * POST /api/v1/driver/location
 * Driver emits location update via REST (alternative to WebSocket path).
 * Used as fallback; primary path is socket event `driver.location.emit`.
 */
router.post('/location', authenticate, authorize(['driver']), async (req, res, next) => {
  const { orderId, lat, lng, bearing } = req.body;

  if (!orderId || typeof lat !== 'number' || typeof lng !== 'number') {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  try {
    // Validate assignment
    const result = await db.query(
      'SELECT id FROM deliveries WHERE order_id = $1 AND driver_id = $2',
      [orderId, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'Not assigned to this order' });
    }

    // Broadcast via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(`order:${orderId}`).emit('driver.location.updated', {
        orderId,
        timestamp: Date.now(),
        payload: { lat, lng, bearing: bearing ?? 0 },
      });
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/driver/accept
 * Driver accepts an order. Updates DB and notifies customer.
 */
router.post('/accept', authenticate, authorize(['driver']), async (req, res, next) => {
  const { orderId } = req.body;
  try {
    await db.query(
      'INSERT INTO deliveries (order_id, driver_id, status) VALUES ($1, $2, $3)',
      [orderId, req.user.id, 'assigned']
    );
    await db.query("UPDATE orders SET status='pickup' WHERE id=$1", [orderId]);

    const io = req.app.get('io');
    notifyOrderStatus(io, orderId, 'pickup');

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/driver/complete
 * Driver marks order as delivered.
 */
router.post('/complete', authenticate, authorize(['driver']), async (req, res, next) => {
  const { orderId } = req.body;
  try {
    await db.query(
      "UPDATE deliveries SET status='delivered', delivery_time=NOW() WHERE order_id=$1 AND driver_id=$2",
      [orderId, req.user.id]
    );
    await db.query("UPDATE orders SET status='delivered' WHERE id=$1", [orderId]);

    const io = req.app.get('io');
    notifyOrderCompleted(io, orderId);

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
