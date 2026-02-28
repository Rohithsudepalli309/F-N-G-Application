const express = require('express');
const router = express.Router();
const orderService = require('../services/order.service');
const { authenticate } = require('../middleware/auth');
const db = require('../config/db');

// GET /api/v1/orders — list user's orders
router.get('/', authenticate, async (req, res, next) => {
  try {
    const orders = await orderService.getOrdersByCustomer(req.user.id);
    res.json(orders);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/orders — create a new order
router.post('/', authenticate, async (req, res, next) => {
  try {
    const order = await orderService.createOrder(req.body, req.user.id);
    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/orders/:id — get a single order with items
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT o.*,
              s.name AS store_name, s.image_url AS store_image,
              json_agg(json_build_object(
                'id', oi.id,
                'product_id', oi.product_id,
                'name', oi.name,
                'price', oi.price,
                'quantity', oi.quantity
              )) AS items
       FROM orders o
       JOIN stores s ON o.store_id = s.id
       LEFT JOIN order_items oi ON oi.order_id = o.id
       WHERE o.id = $1 AND o.customer_id = $2
       GROUP BY o.id, s.name, s.image_url`,
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Order not found' });
    res.json({ order: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// POST /api/v1/orders/:id/cancel
router.post('/:id/cancel', authenticate, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, status, customer_id FROM orders WHERE id = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Order not found' });
    const order = rows[0];

    if (order.customer_id !== req.user.id) {
      return res.status(403).json({ error: 'Not your order' });
    }

    const cancellableStatuses = ['pending', 'placed'];
    if (!cancellableStatuses.includes(order.status)) {
      return res.status(400).json({ error: `Cannot cancel an order in '${order.status}' status` });
    }

    const { rows: updated } = await db.query(
      `UPDATE orders SET status = 'cancelled', updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [req.params.id]
    );

    // Emit socket event
    const io = req.app.get('io');
    if (io) io.to(`order_${req.params.id}`).emit('order_status_update', { orderId: req.params.id, status: 'cancelled' });

    res.json({ order: updated[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

// POST /api/v1/orders/:id/rate — submit rating after delivery
router.post('/:id/rate', authenticate, async (req, res) => {
  const { rating, food_rating, delivery_rating, comment } = req.body;
  if (!rating) return res.status(400).json({ error: 'rating is required' });

  try {
    const { rows: orderRows } = await db.query(
      `SELECT id, customer_id, store_id, status FROM orders WHERE id = $1`,
      [req.params.id]
    );
    if (!orderRows.length) return res.status(404).json({ error: 'Order not found' });
    const order = orderRows[0];

    if (order.customer_id !== req.user.id) return res.status(403).json({ error: 'Not your order' });
    if (order.status !== 'delivered') return res.status(400).json({ error: 'Can only rate delivered orders' });

    const { rows } = await db.query(
      `INSERT INTO reviews (order_id, user_id, store_id, rating, food_rating, delivery_rating, comment)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (order_id, user_id) DO UPDATE
         SET rating = $4, food_rating = $5, delivery_rating = $6, comment = $7
       RETURNING *`,
      [req.params.id, req.user.id, order.store_id, rating, food_rating || null, delivery_rating || null, comment || null]
    );

    // Update store avg rating
    await db.query(
      `UPDATE stores SET rating = (
         SELECT ROUND(AVG(rating)::numeric, 1) FROM reviews WHERE store_id = $1
       ) WHERE id = $1`,
      [order.store_id]
    );

    res.status(201).json({ review: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit rating' });
  }
});

// PATCH /api/v1/orders/:id/status — update (driver/admin use)
router.patch('/:id/status', authenticate, async (req, res) => {
  const { status } = req.body;
  const allowedRoles = ['driver', 'admin', 'merchant'];
  if (!allowedRoles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });

  try {
    const { rows } = await db.query(
      `UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Order not found' });

    const io = req.app.get('io');
    if (io) io.to(`order_${req.params.id}`).emit('order_status_update', { orderId: req.params.id, status });

    res.json({ order: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

module.exports = router;
