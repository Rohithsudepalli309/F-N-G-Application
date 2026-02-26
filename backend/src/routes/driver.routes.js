const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const db = require('../config/db');
const { notifyOrderStatus, notifyOrderCompleted } = require('../services/socket.service');
const logger = require('../config/logger');

/**
 * GET /api/v1/driver/orders
 * Returns active orders for this driver (assigned) OR ready orders waiting for pickup
 */
router.get('/orders', authenticate, authorize(['driver']), async (req, res, next) => {
  try {
    // Return orders specifically assigned to this driver, or any 'ready' orders that are unassigned
    const result = await db.query(`
      SELECT 
        o.id, 
        o.status, 
        o.total_amount AS "totalAmount", 
        json_build_object(
          'text', o.delivery_address, 
          'lat', o.delivery_lat, 
          'lng', o.delivery_lng
        ) as "deliveryAddress"
      FROM orders o
      LEFT JOIN deliveries d ON o.id = d.order_id
      WHERE (d.driver_id = $1 AND o.status IN ('pickup', 'assigned'))
         OR (o.status = 'ready' AND d.id IS NULL)
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

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
