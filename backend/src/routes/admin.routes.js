const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

const isAdmin = [authenticate, authorize(['admin'])];

// GET /api/v1/admin/stats — dashboard key metrics
router.get('/stats', ...isAdmin, async (req, res) => {
  try {
    const [orders, users, drivers, revenue] = await Promise.all([
      db.query(`SELECT COUNT(*) FROM orders WHERE created_at > NOW() - INTERVAL '24 hours'`),
      db.query(`SELECT COUNT(*) FROM users WHERE role = 'customer'`),
      db.query(`SELECT COUNT(*) FROM users WHERE role = 'driver'`),
      db.query(
        `SELECT COALESCE(SUM(total_amount), 0) AS total
         FROM orders WHERE status = 'delivered' AND created_at > NOW() - INTERVAL '24 hours'`
      ),
    ]);

    res.json({
      ordersToday: parseInt(orders.rows[0].count),
      totalCustomers: parseInt(users.rows[0].count),
      totalDrivers: parseInt(drivers.rows[0].count),
      revenueToday: parseInt(revenue.rows[0].total),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /api/v1/admin/orders?page=1&limit=20&status=
router.get('/orders', ...isAdmin, async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  try {
    let condition = '';
    const params = [Number(limit), offset];
    if (status) {
      condition = 'WHERE o.status = $3';
      params.push(status);
    }

    const { rows } = await db.query(
      `SELECT o.id, o.status, o.payment_status, o.total_amount,
              o.created_at, o.updated_at,
              u.name AS customer_name, u.phone AS customer_phone,
              s.name AS store_name
       FROM orders o
       JOIN users u ON o.customer_id = u.id
       JOIN stores s ON o.store_id = s.id
       ${condition}
       ORDER BY o.created_at DESC
       LIMIT $1 OFFSET $2`,
      params
    );

    const { rows: countRows } = await db.query(
      `SELECT COUNT(*) FROM orders ${status ? 'WHERE status = $1' : ''}`,
      status ? [status] : []
    );

    res.json({
      orders: rows,
      total: parseInt(countRows[0].count),
      page: Number(page),
      totalPages: Math.ceil(parseInt(countRows[0].count) / Number(limit)),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// PATCH /api/v1/admin/orders/:id/status
router.patch('/orders/:id/status', ...isAdmin, async (req, res) => {
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'status is required' });

  try {
    const { rows } = await db.query(
      `UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Order not found' });
    res.json({ order: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// GET /api/v1/admin/users?page=1&limit=20&role=
router.get('/users', ...isAdmin, async (req, res) => {
  const { page = 1, limit = 20, role } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  try {
    const condition = role ? `WHERE role = $3` : '';
    const params = [Number(limit), offset];
    if (role) params.push(role);

    const { rows } = await db.query(
      `SELECT id, name, phone, email, role, is_active, created_at
       FROM users ${condition}
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      params
    );
    res.json({ users: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// PATCH /api/v1/admin/users/:id/status — activate / deactivate
router.patch('/users/:id/status', ...isAdmin, async (req, res) => {
  const { is_active } = req.body;
  try {
    const { rows } = await db.query(
      `UPDATE users SET is_active = $1 WHERE id = $2 RETURNING id, name, is_active`,
      [is_active, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    res.json({ user: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// GET /api/v1/admin/stores?page=1&limit=20
router.get('/stores', ...isAdmin, async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  try {
    const { rows } = await db.query(
      `SELECT id, name, type, store_type, region, rating, is_active, created_at
       FROM stores ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [Number(limit), offset]
    );
    res.json({ stores: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stores' });
  }
});

// PATCH /api/v1/admin/stores/:id — toggle active / update fields
router.patch('/stores/:id', ...isAdmin, async (req, res) => {
  const { is_active, name, region } = req.body;
  try {
    const { rows } = await db.query(
      `UPDATE stores SET
         is_active = COALESCE($1, is_active),
         name      = COALESCE($2, name),
         region    = COALESCE($3, region)
       WHERE id = $4 RETURNING *`,
      [is_active, name, region, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Store not found' });
    res.json({ store: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update store' });
  }
});

// POST /api/v1/admin/coupons — create a coupon
router.post('/coupons', ...isAdmin, async (req, res) => {
  const {
    code,
    description,
    discount_type,
    discount_value,
    min_order_amount = 0,
    max_discount,
    max_uses = 1000,
    valid_until,
  } = req.body;

  if (!code || !discount_type || !discount_value) {
    return res.status(400).json({ error: 'code, discount_type and discount_value are required' });
  }

  try {
    const { rows } = await db.query(
      `INSERT INTO coupons (code, description, discount_type, discount_value, min_order_amount, max_discount, max_uses, valid_until)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        code.toUpperCase().trim(),
        description || null,
        discount_type,
        discount_value,
        min_order_amount,
        max_discount || null,
        max_uses,
        valid_until || null,
      ]
    );
    res.status(201).json({ coupon: rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Coupon code already exists' });
    res.status(500).json({ error: 'Failed to create coupon' });
  }
});

// DELETE /api/v1/admin/coupons/:id
router.delete('/coupons/:id', ...isAdmin, async (req, res) => {
  try {
    await db.query(`UPDATE coupons SET is_active = FALSE WHERE id = $1`, [req.params.id]);
    res.json({ message: 'Coupon deactivated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to deactivate coupon' });
  }
});

// GET /api/v1/admin/analytics — revenue + order trend (last 7 days)
router.get('/analytics', ...isAdmin, async (req, res) => {
  try {
    const { rows: daily } = await db.query(
      `SELECT DATE(created_at) AS date,
              COUNT(*) AS orders,
              COALESCE(SUM(total_amount), 0) AS revenue
       FROM orders
       WHERE created_at > NOW() - INTERVAL '7 days'
         AND status = 'delivered'
       GROUP BY DATE(created_at)
       ORDER BY date ASC`
    );

    const { rows: topStores } = await db.query(
      `SELECT s.name, COUNT(o.id) AS order_count, SUM(o.total_amount) AS revenue
       FROM orders o
       JOIN stores s ON o.store_id = s.id
       WHERE o.status = 'delivered' AND o.created_at > NOW() - INTERVAL '30 days'
       GROUP BY s.id, s.name
       ORDER BY revenue DESC
       LIMIT 5`
    );

    res.json({ daily, topStores });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

module.exports = router;
