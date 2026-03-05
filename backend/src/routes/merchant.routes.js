/**
 * merchant.routes.js
 * All endpoints for the Merchant Portal (restaurant/grocery store owners).
 * Auth: JWT with role = 'merchant' (admin also permitted for testing).
 * Store lookup: every merchant is linked to their store via stores.owner_id.
 */

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

const isMerchant = [authenticate, authorize(['merchant', 'admin'])];

// ── Helper: resolve merchant's store_id ──────────────────────────────────────
async function getMerchantStoreId(userId) {
  const { rows } = await db.query(
    `SELECT id FROM stores WHERE owner_id = $1 LIMIT 1`,
    [userId]
  );
  if (!rows.length) throw Object.assign(new Error('No store linked to this account'), { status: 404 });
  return rows[0].id;
}

// ── 1. GET /merchant/profile ─────────────────────────────────────────────────
router.get('/profile', ...isMerchant, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT s.id, s.name, s.type, s.store_type, s.rating, s.is_active,
              s.image_url, s.delivery_time_min, s.cuisine_tags,
              u.name AS owner_name, u.email, u.phone
       FROM stores s
       JOIN users u ON s.owner_id = u.id
       WHERE s.owner_id = $1`,
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'No store found for this merchant' });
    res.json({ store: rows[0] });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to fetch profile' });
  }
});

// ── 2. GET /merchant/orders ──────────────────────────────────────────────────
// Query params: status, page, limit
router.get('/orders', ...isMerchant, async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  try {
    const storeId = await getMerchantStoreId(req.user.id);

    const params = [Number(limit), offset, storeId];
    let statusClause = '';
    if (status) {
      statusClause = 'AND o.status = $4';
      params.push(status);
    }

    const { rows } = await db.query(
      `SELECT o.id, o.status, o.payment_status, o.total_amount,
              o.address, o.created_at, o.updated_at,
              u.name AS customer_name, u.phone AS customer_phone,
              json_agg(
                json_build_object(
                  'name', oi.name,
                  'quantity', oi.quantity,
                  'price', oi.price
                ) ORDER BY oi.id
              ) AS items
       FROM orders o
       JOIN users u ON o.customer_id = u.id
       LEFT JOIN order_items oi ON oi.order_id = o.id
       WHERE o.store_id = $3 ${statusClause}
       GROUP BY o.id, u.name, u.phone
       ORDER BY o.created_at DESC
       LIMIT $1 OFFSET $2`,
      params
    );

    const countParams = [storeId];
    if (status) countParams.push(status);
    const { rows: countRows } = await db.query(
      `SELECT COUNT(*) FROM orders WHERE store_id = $1 ${status ? 'AND status = $2' : ''}`,
      countParams
    );

    res.json({
      orders: rows,
      total: parseInt(countRows[0].count),
      page: Number(page),
      totalPages: Math.ceil(parseInt(countRows[0].count) / Number(limit)),
      storeId,
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to fetch orders' });
  }
});

// ── 3. PATCH /merchant/orders/:id/accept ─────────────────────────────────────
router.patch('/orders/:id/accept', ...isMerchant, async (req, res) => {
  try {
    const storeId = await getMerchantStoreId(req.user.id);
    const { rows } = await db.query(
      `UPDATE orders
       SET status = 'preparing', updated_at = NOW()
       WHERE id = $1 AND store_id = $2 AND status = 'placed'
       RETURNING *`,
      [req.params.id, storeId]
    );
    if (!rows.length) {
      return res.status(404).json({ error: 'Order not found or cannot be accepted in current state' });
    }

    const io = req.app.get('io');
    if (io) {
      io.to(`order_${req.params.id}`).emit('order_status_update', {
        orderId: req.params.id, status: 'preparing',
      });
      io.to(`merchant_${storeId}`).emit('merchant:order_accepted', { orderId: req.params.id });
    }

    res.json({ order: rows[0] });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to accept order' });
  }
});

// ── 4. PATCH /merchant/orders/:id/reject ─────────────────────────────────────
router.patch('/orders/:id/reject', ...isMerchant, async (req, res) => {
  const { reason = 'Rejected by merchant' } = req.body;
  try {
    const storeId = await getMerchantStoreId(req.user.id);
    const { rows } = await db.query(
      `UPDATE orders
       SET status = 'cancelled', updated_at = NOW()
       WHERE id = $1 AND store_id = $2 AND status IN ('placed', 'preparing')
       RETURNING *`,
      [req.params.id, storeId]
    );
    if (!rows.length) {
      return res.status(404).json({ error: 'Order not found or cannot be rejected' });
    }

    const io = req.app.get('io');
    if (io) {
      io.to(`order_${req.params.id}`).emit('order_status_update', {
        orderId: req.params.id, status: 'cancelled', reason,
      });
    }

    res.json({ order: rows[0] });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to reject order' });
  }
});

// ── 5. PATCH /merchant/orders/:id/ready ──────────────────────────────────────
router.patch('/orders/:id/ready', ...isMerchant, async (req, res) => {
  try {
    const storeId = await getMerchantStoreId(req.user.id);
    const { rows } = await db.query(
      `UPDATE orders
       SET status = 'ready', updated_at = NOW()
       WHERE id = $1 AND store_id = $2 AND status = 'preparing'
       RETURNING *`,
      [req.params.id, storeId]
    );
    if (!rows.length) {
      return res.status(404).json({ error: 'Order not found or not in preparing state' });
    }

    const io = req.app.get('io');
    if (io) {
      io.to(`order_${req.params.id}`).emit('order_status_update', {
        orderId: req.params.id, status: 'ready',
      });
      // Notify available drivers that an order is ready for pickup
      io.emit('delivery:order_ready', { orderId: req.params.id, storeId });
    }

    res.json({ order: rows[0] });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to mark order as ready' });
  }
});

// ── 6. GET /merchant/menu ─────────────────────────────────────────────────────
router.get('/menu', ...isMerchant, async (req, res) => {
  try {
    const storeId = await getMerchantStoreId(req.user.id);
    const { rows } = await db.query(
      `SELECT id, name, description, price, original_price, category,
              brand, image_url, stock, is_available, is_veg, unit
       FROM products
       WHERE store_id = $1
       ORDER BY category, name`,
      [storeId]
    );
    res.json({ products: rows, storeId });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to fetch menu' });
  }
});

// ── 7. PATCH /merchant/products/:id/availability ─────────────────────────────
router.patch('/products/:id/availability', ...isMerchant, async (req, res) => {
  const { is_available } = req.body;
  if (typeof is_available !== 'boolean') {
    return res.status(400).json({ error: 'is_available (boolean) is required' });
  }
  try {
    const storeId = await getMerchantStoreId(req.user.id);
    const { rows } = await db.query(
      `UPDATE products SET is_available = $1
       WHERE id = $2 AND store_id = $3
       RETURNING id, name, is_available, stock`,
      [is_available, req.params.id, storeId]
    );
    if (!rows.length) {
      return res.status(404).json({ error: 'Product not found in your store' });
    }
    res.json({ product: rows[0] });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to update availability' });
  }
});

// ── 8. PATCH /merchant/products/:id/stock ────────────────────────────────────
router.patch('/products/:id/stock', ...isMerchant, async (req, res) => {
  const { stock } = req.body;
  if (typeof stock !== 'number' || stock < 0) {
    return res.status(400).json({ error: 'stock (non-negative number) is required' });
  }
  try {
    const storeId = await getMerchantStoreId(req.user.id);
    const { rows } = await db.query(
      `UPDATE products SET stock = $1, is_available = ($1 > 0)
       WHERE id = $2 AND store_id = $3
       RETURNING id, name, is_available, stock`,
      [stock, req.params.id, storeId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Product not found in your store' });
    res.json({ product: rows[0] });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to update stock' });
  }
});

// ── 9. PATCH /merchant/store/toggle ──────────────────────────────────────────
router.patch('/store/toggle', ...isMerchant, async (req, res) => {
  try {
    const storeId = await getMerchantStoreId(req.user.id);
    const { rows } = await db.query(
      `UPDATE stores SET is_active = NOT is_active WHERE id = $1 RETURNING id, name, is_active`,
      [storeId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Store not found' });
    res.json({ store: rows[0] });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to toggle store' });
  }
});

// ── 10. GET /merchant/analytics ──────────────────────────────────────────────
router.get('/analytics', ...isMerchant, async (req, res) => {
  const { period = 'week' } = req.query;
  const interval = period === 'month' ? '30 days' : '7 days';

  try {
    const storeId = await getMerchantStoreId(req.user.id);

    const [todayStats, periodStats, topProducts, pendingCount] = await Promise.all([
      db.query(
        `SELECT COUNT(*) AS orders_today,
                COALESCE(SUM(total_amount), 0) AS revenue_today
         FROM orders WHERE store_id = $1 AND status = 'delivered'
         AND created_at > NOW() - INTERVAL '24 hours'`,
        [storeId]
      ),
      db.query(
        `SELECT TO_CHAR(DATE(created_at), 'DD Mon') AS date,
                COUNT(*) AS orders,
                COALESCE(SUM(total_amount), 0) AS revenue
         FROM orders WHERE store_id = $1 AND status = 'delivered'
         AND created_at > NOW() - INTERVAL '${interval}'
         GROUP BY DATE(created_at)
         ORDER BY DATE(created_at)`,
        [storeId]
      ),
      db.query(
        `SELECT oi.name, SUM(oi.quantity) AS total_sold,
                SUM(oi.price * oi.quantity) AS revenue
         FROM order_items oi
         JOIN orders o ON oi.order_id = o.id
         WHERE o.store_id = $1 AND o.status = 'delivered'
         AND o.created_at > NOW() - INTERVAL '${interval}'
         GROUP BY oi.name
         ORDER BY total_sold DESC
         LIMIT 5`,
        [storeId]
      ),
      db.query(
        `SELECT COUNT(*) AS pending FROM orders
         WHERE store_id = $1 AND status IN ('placed', 'preparing')`,
        [storeId]
      ),
    ]);

    res.json({
      ordersToday: parseInt(todayStats.rows[0].orders_today),
      revenueToday: parseInt(todayStats.rows[0].revenue_today),
      pendingOrders: parseInt(pendingCount.rows[0].pending),
      period,
      chart: periodStats.rows,
      topProducts: topProducts.rows,
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to fetch analytics' });
  }
});

module.exports = router;
