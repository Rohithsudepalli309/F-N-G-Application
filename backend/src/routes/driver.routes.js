const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const db = require('../config/db');
const { notifyOrderStatus, notifyOrderCompleted } = require('../services/socket.service');
const logger = require('../config/logger');
const notificationService = require('../services/notification.service');

/**
 * GET /api/v1/driver/orders
 * Returns orders assigned to this driver (pickup/assigned) OR unassigned ready orders.
 * Includes store pickup address and item count for the incoming order card.
 */
router.get('/orders', authenticate, authorize(['driver']), async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT
        o.id,
        o.status,
        o.store_id,
        o.total_amount,
        o.created_at,
        json_build_object(
          'text', COALESCE(o.delivery_address, ''),
          'lat',  COALESCE(o.delivery_lat,  0),
          'lng',  COALESCE(o.delivery_lng,  0)
        ) AS delivery_address,
        COALESCE(s.name, 'FNG Store') AS store_name,
        json_build_object(
          'text', COALESCE(s.address, ''),
          'lat',  COALESCE(s.lat::float, 0),
          'lng',  COALESCE(s.lng::float, 0)
        ) AS pickup_address,
        COUNT(oi.id)::int AS items_count
      FROM orders o
      LEFT JOIN stores       s  ON o.store_id   = s.id
      LEFT JOIN order_items  oi ON o.id          = oi.order_id
      LEFT JOIN deliveries   d  ON o.id          = d.order_id
      WHERE (d.driver_id = $1 AND o.status IN ('pickup', 'assigned'))
         OR (o.status = 'ready' AND d.id IS NULL)
      GROUP BY o.id, o.status, o.store_id, o.total_amount, o.created_at,
               o.delivery_address, o.delivery_lat, o.delivery_lng,
               s.name, s.address, s.lat, s.lng
      ORDER BY o.created_at DESC
      LIMIT 20
    `, [req.user.id]);

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

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
 * POST /api/v1/driver/reject
 * Driver explicitly declines an order (no status change — other drivers can still accept).
 */
router.post('/reject', authenticate, authorize(['driver']), async (req, res) => {
  const { orderId } = req.body;
  if (!orderId) return res.status(400).json({ error: 'orderId required' });
  logger.info(`Driver ${req.user.id} declined order ${orderId}`);
  res.json({ success: true });
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
    await notificationService.notifyOrderStatus(orderId, 'pickup');

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/driver/complete
 * Driver marks order as delivered via OTP.
 */
router.post('/complete', authenticate, authorize(['driver']), async (req, res, next) => {
  const { orderId, otp } = req.body;
  
  if (!orderId || !otp) {
     return res.status(400).json({ error: 'Order ID and OTP are required' });
  }

  try {
    // 1. Verify OTP matches the order
    const orderCheck = await db.query('SELECT otp FROM orders WHERE id = $1', [orderId]);
    if (orderCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    if (orderCheck.rows[0].otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    // 2. Mark as delivered
    await db.query(
      "UPDATE deliveries SET status='delivered', delivery_time=NOW() WHERE order_id=$1 AND driver_id=$2",
      [orderId, req.user.id]
    );
    await db.query("UPDATE orders SET status='delivered' WHERE id=$1", [orderId]);

    const io = req.app.get('io');
    notifyOrderCompleted(io, orderId);
    await notificationService.notifyOrderStatus(orderId, 'delivered');

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
