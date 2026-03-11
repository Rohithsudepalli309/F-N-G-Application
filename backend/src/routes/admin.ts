import { Router } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../db';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(requireAuth, requireRole('admin'));

// ─── GET /admin/users ─────────────────────────────────────────────────────
router.get('/users', async (_req, res) => {
  const result = await pool.query(
    `SELECT id, name, phone, email, role, is_active, created_at
     FROM users ORDER BY created_at DESC`
  );
  res.json({ users: result.rows });
});

// ─── PATCH /admin/users/:id/status ────────────────────────────────────────
router.patch('/users/:id/status', async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body as { is_active: boolean };
  const result = await pool.query(
    `UPDATE users SET is_active=$1 WHERE id=$2 RETURNING id, name, role, is_active`,
    [is_active, id]
  );
  if (result.rows.length === 0) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }
  res.json({ user: result.rows[0] });
});

// ─── GET /admin/stores ────────────────────────────────────────────────────
router.get('/stores', async (_req, res) => {
  const result = await pool.query(
    `SELECT s.id, s.name, s.store_type, s.is_active, s.is_verified,
            s.rating, s.total_ratings, s.created_at, u.name AS owner
     FROM stores s LEFT JOIN users u ON u.id = s.owner_id
     ORDER BY s.created_at DESC`
  );
  res.json({ stores: result.rows });
});

// ─── PATCH /admin/stores/:id ─── Toggle active / verify ──────────────────
router.patch('/stores/:id', async (req, res) => {
  const { id } = req.params;
  const { is_active, is_verified } = req.body as {
    is_active?: boolean; is_verified?: boolean;
  };
  const result = await pool.query(
    `UPDATE stores
     SET is_active   = COALESCE($1, is_active),
         is_verified = COALESCE($2, is_verified)
     WHERE id=$3 RETURNING id, name, is_active, is_verified`,
    [is_active ?? null, is_verified ?? null, id]
  );
  if (result.rows.length === 0) {
    res.status(404).json({ error: 'Store not found.' });
    return;
  }
  res.json({ store: result.rows[0] });
});

// ─── GET /admin/drivers ───────────────────────────────────────────────────
router.get('/drivers', async (_req, res) => {
  const result = await pool.query(
    `SELECT d.id, d.name, d.phone, d.vehicle_type, d.is_available,
            d.is_active, d.rating, d.current_lat, d.current_lng,
            d.last_seen_at, u.id AS user_id
     FROM drivers d JOIN users u ON u.id = d.user_id
     ORDER BY d.created_at DESC`
  );
  res.json({ drivers: result.rows });
});

// ─── POST /admin/drivers ─── Register new driver ──────────────────────────
router.post('/drivers', async (req, res) => {
  const { name, phone, password, vehicleType = 'bike', vehicleNumber } = req.body as {
    name: string; phone: string; password: string;
    vehicleType?: string; vehicleNumber?: string;
  };

  if (!name || !phone || !password) {
    res.status(400).json({ error: 'name, phone, and password are required.' });
    return;
  }

  const hash = await bcrypt.hash(password, 12);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const userRes = await client.query(
      `INSERT INTO users (phone, name, password, role) VALUES ($1,$2,$3,'driver')
       RETURNING *`,
      [phone, name, hash]
    );
    const user = userRes.rows[0];
    const driverRes = await client.query(
      `INSERT INTO drivers (user_id, name, phone, vehicle_type, vehicle_number)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [user.id, name, phone, vehicleType, vehicleNumber ?? null]
    );
    await client.query('COMMIT');
    res.status(201).json({ driver: driverRes.rows[0] });
  } catch (err: unknown) {
    await client.query('ROLLBACK');
    const pgErr = err as { code?: string };
    if (pgErr.code === '23505') {
      res.status(400).json({ error: 'A driver with this phone already exists.' });
      return;
    }
    console.error('[admin/drivers] create error:', err);
    res.status(500).json({ error: 'Could not register driver.' });
  } finally {
    client.release();
  }
});

// ─── PATCH /admin/drivers/:id ─── Update driver status ───────────────────
router.patch('/drivers/:id', async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body as { is_active?: boolean };
  const result = await pool.query(
    `UPDATE drivers SET is_active=COALESCE($1, is_active)
     WHERE id=$2
     RETURNING id, name, phone, is_active, is_available`,
    [is_active ?? null, id]
  );
  if (result.rows.length === 0) {
    res.status(404).json({ error: 'Driver not found.' });
    return;
  }
  res.json({ driver: result.rows[0] });
});

// ─── GET /admin/orders ────────────────────────────────────────────────────
router.get('/orders', async (req, res) => {
  const { status, limit = '50', offset = '0' } = req.query as Record<string, string>;
  let query = `
    SELECT o.id, o.order_number, o.status, o.total_amount, o.payment_method,
           o.payment_status, o.created_at, o.store_name,
           u.name AS customer_name, u.phone AS customer_phone
    FROM orders o JOIN users u ON u.id = o.customer_id
    WHERE 1=1
  `;
  const params: unknown[] = [];
  let idx = 1;
  if (status) {
    query += ` AND o.status=$${idx++}`;
    params.push(status);
  }
  query += ` ORDER BY o.created_at DESC LIMIT $${idx++} OFFSET $${idx++}`;
  params.push(Number(limit), Number(offset));

  const result = await pool.query(query, params);
  res.json({ orders: result.rows });
});

// ─── GET /admin/coupons ───────────────────────────────────────────────────
router.get('/coupons', async (_req, res) => {
  const result = await pool.query(
    `SELECT * FROM coupons ORDER BY created_at DESC`
  );
  res.json({ coupons: result.rows });
});

// ─── POST /admin/coupons ──────────────────────────────────────────────────
router.post('/coupons', async (req, res) => {
  const {
    code, description, discount_type, discount_value,
    min_order_amount = 0, max_discount, max_uses = 1000, valid_until,
  } = req.body as {
    code: string; description?: string;
    discount_type: 'flat' | 'percent';
    discount_value: number;
    min_order_amount?: number;
    max_discount?: number;
    max_uses?: number;
    valid_until?: string;
  };

  if (!code || !discount_type || discount_value == null) {
    res.status(400).json({ error: 'code, discount_type, and discount_value are required.' });
    return;
  }

  const result = await pool.query(
    `INSERT INTO coupons
       (code, description, discount_type, discount_value,
        min_order_amount, max_discount, max_uses, valid_until)
     VALUES (UPPER($1), $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [
      code, description ?? null, discount_type, discount_value,
      min_order_amount, max_discount ?? null, max_uses,
      valid_until ?? null,
    ]
  );
  res.status(201).json({ coupon: result.rows[0] });
});

// ─── DELETE /admin/coupons/:id ─── Deactivate coupon ─────────────────────
router.delete('/coupons/:id', async (req, res) => {
  await pool.query(
    `UPDATE coupons SET is_active=FALSE WHERE id=$1`,
    [req.params.id]
  );
  res.json({ message: 'Coupon deactivated.' });
});

// ─── GET /admin/payouts?period=week|month ─────────────────────────────────
router.get('/payouts', async (req, res) => {
  const { period = 'week' } = req.query as { period?: string };
  const interval = period === 'month' ? '30 days' : '7 days';

  const result = await pool.query(
    `SELECT
       d.id AS driver_id,
       d.name AS driver_name,
       d.phone,
       COUNT(o.id)::int AS total_deliveries,
       COALESCE(SUM(o.delivery_fee), 0)::int AS gross_earnings,
       COALESCE(ROUND(SUM(o.delivery_fee) * 0.2), 0)::int AS platform_commission,
       COALESCE(ROUND(SUM(o.delivery_fee) * 0.8), 0)::int AS net_payout
     FROM drivers d
     LEFT JOIN orders o ON o.driver_id = d.id
       AND o.status = 'delivered'
       AND o.delivered_at >= NOW() - INTERVAL '${interval}'
     GROUP BY d.id, d.name, d.phone
     ORDER BY net_payout DESC`,
    []
  );
  res.json({ payouts: result.rows });
});

export default router;
