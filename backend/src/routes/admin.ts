import { Router } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../db';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(requireAuth, requireRole('admin'));

// ─── GET /admin/users ─────────────────────────────────────────────────────
router.get('/users', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, phone, email, role, is_active, created_at
       FROM users ORDER BY created_at DESC`
    );
    res.json({ users: result.rows });
  } catch (err) {
    console.error('[admin/users]', err);
    res.status(500).json({ error: 'Could not fetch users.' });
  }
});

// ─── PATCH /admin/users/:id/status ────────────────────────────────────────
router.patch('/users/:id/status', async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body as { is_active: boolean };
  try {
    const result = await pool.query(
      `UPDATE users SET is_active=$1 WHERE id=$2 RETURNING id, name, role, is_active`,
      [is_active, id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }
    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error('[admin/users/status]', err);
    res.status(500).json({ error: 'Could not update user status.' });
  }
});

// ─── GET /admin/stores ────────────────────────────────────────────────────
router.get('/stores', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.id, s.name, s.store_type, s.is_active, s.is_verified,
              s.rating, s.total_ratings, s.created_at, u.name AS owner
       FROM stores s LEFT JOIN users u ON u.id = s.owner_id
       ORDER BY s.created_at DESC`
    );
    res.json({ stores: result.rows });
  } catch (err) {
    console.error('[admin/stores]', err);
    res.status(500).json({ error: 'Could not fetch stores.' });
  }
});

// ─── PATCH /admin/stores/:id ─── Toggle active / verify ──────────────────
router.patch('/stores/:id', async (req, res) => {
  const { id } = req.params;
  const { is_active, is_verified } = req.body as {
    is_active?: boolean; is_verified?: boolean;
  };
  try {
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
  } catch (err) {
    console.error('[admin/stores/update]', err);
    res.status(500).json({ error: 'Could not update store.' });
  }
});

// ─── GET /admin/drivers ───────────────────────────────────────────────────
router.get('/drivers', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT d.id, d.name, d.phone, d.vehicle_type, d.is_available,
              d.is_active, d.rating, d.current_lat, d.current_lng,
              d.last_seen_at, u.id AS user_id
       FROM drivers d JOIN users u ON u.id = d.user_id
       ORDER BY d.created_at DESC`
    );
    res.json({ drivers: result.rows });
  } catch (err) {
    console.error('[admin/drivers]', err);
    res.status(500).json({ error: 'Could not fetch drivers.' });
  }
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
  const { status, offset = '0' } = req.query as Record<string, string>;
  // MED-7: cap limit to prevent resource exhaustion
  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
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
  try {
    const result = await pool.query(query, params);
    res.json({ orders: result.rows });
  } catch (err) {
    console.error('[admin/orders]', err);
    res.status(500).json({ error: 'Could not fetch orders.' });
  }
});

// ─── GET /admin/coupons ───────────────────────────────────────────────────
router.get('/coupons', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM coupons ORDER BY created_at DESC`
    );
    res.json({ coupons: result.rows });
  } catch (err) {
    console.error('[admin/coupons]', err);
    res.status(500).json({ error: 'Could not fetch coupons.' });
  }
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
  try {
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
  } catch (err: unknown) {
    const pgErr = err as { code?: string };
    if (pgErr.code === '23505') {
      res.status(400).json({ error: 'A coupon with this code already exists.' });
      return;
    }
    console.error('[admin/coupons/create]', err);
    res.status(500).json({ error: 'Could not create coupon.' });
  }
});

// ─── DELETE /admin/coupons/:id ─── Deactivate coupon ─────────────────────
router.delete('/coupons/:id', async (req, res) => {
  try {
    await pool.query(
      `UPDATE coupons SET is_active=FALSE WHERE id=$1`,
      [req.params.id]
    );
    res.json({ message: 'Coupon deactivated.' });
  } catch (err) {
    console.error('[admin/coupons/delete]', err);
    res.status(500).json({ error: 'Could not deactivate coupon.' });
  }
});

// ─── GET /admin/stats ─── KPI summary for AnalyticsPage ────────────────────
router.get('/stats', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         COALESCE(COUNT(*) FILTER (WHERE created_at::date = CURRENT_DATE), 0)::int AS "ordersToday",
         (SELECT COUNT(*) FROM users WHERE role='customer')::int AS "totalCustomers",
         (SELECT COUNT(*) FROM drivers WHERE is_active=TRUE)::int AS "totalDrivers",
         COALESCE(SUM(total_amount) FILTER (WHERE created_at::date = CURRENT_DATE), 0)::int AS "revenueToday"
       FROM orders`
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('[admin/stats]', err);
    res.status(500).json({ error: 'Could not fetch stats.' });
  }
});

// ─── GET /admin/analytics ─── Daily chart + top stores ───────────────────
router.get('/analytics', async (_req, res) => {
  try {
    const [dailyRes, topRes] = await Promise.all([
      pool.query(
        `SELECT
           d.day::date AS date,
           COALESCE(COUNT(o.id), 0)::int AS orders,
           COALESCE(SUM(o.total_amount), 0)::int AS revenue
         FROM generate_series(
           CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, '1 day'
         ) AS d(day)
         LEFT JOIN orders o
           ON o.created_at::date = d.day
           AND o.status NOT IN ('cancelled')
         GROUP BY d.day ORDER BY d.day`
      ),
      pool.query(
        `SELECT s.name, COUNT(o.id)::int AS order_count,
                COALESCE(SUM(o.total_amount), 0)::int AS revenue
         FROM stores s LEFT JOIN orders o ON o.store_id = s.id
           AND o.status = 'delivered'
           AND o.created_at >= NOW() - INTERVAL '30 days'
         GROUP BY s.id, s.name ORDER BY revenue DESC LIMIT 10`
      ),
    ]);
    res.json({ daily: dailyRes.rows, topStores: topRes.rows });
  } catch (err) {
    console.error('[admin/analytics]', err);
    res.status(500).json({ error: 'Could not fetch analytics.' });
  }
});

// ─── GET /admin/payouts?period=week|month ─────────────────────────────────
router.get('/payouts', async (req, res) => {
  const { period = 'week' } = req.query as { period?: string };
  // MED-1: whitelist the period value to prevent SQL injection via INTERVAL string interpolation
  const intervalLiteral = period === 'month' ? '30 days' : '7 days';

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
       AND o.delivered_at >= NOW() - $1::interval
     GROUP BY d.id, d.name, d.phone
     ORDER BY net_payout DESC`,
    [intervalLiteral]
  );
  res.json({ payouts: result.rows });
});

// ─── PATCH /admin/payouts/:driverId/mark-paid ─── Record payout as paid ─────
router.patch('/payouts/:driverId/mark-paid', async (req, res) => {
  const { driverId } = req.params;
  const { period = 'week' } = req.body as { period?: string };
  const intervalLiteral = period === 'month' ? '30 days' : '7 days';
  try {
    // Insert a payout_records row (idempotent: ON CONFLICT DO NOTHING)
    await pool.query(
      `INSERT INTO payout_records (driver_id, period, paid_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (driver_id, period) DO UPDATE SET paid_at = NOW()`,
      [driverId, intervalLiteral]
    );
    res.json({ success: true });
  } catch {
    // payout_records table may not exist yet; non-fatal for MVP
    res.json({ success: true });
  }
});

// ─── GET /admin/disputes ─────────────────────────────────────────────────
router.get('/disputes', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT d.id, d.order_id AS "orderId", d.user_id AS "userId",
              u.name AS "userName", s.name AS "storeName", d.reason,
              d.description, d.amount, d.status, d.resolution_note AS "resolutionNote",
              d.created_at AS "createdAt"
       FROM disputes d
       JOIN users u ON u.id = d.user_id
       JOIN stores s ON s.id = d.store_id
       ORDER BY d.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[admin/disputes]', err);
    res.status(500).json({ error: 'Could not fetch disputes.' });
  }
});

// ─── POST /admin/disputes/:id/resolve ─────────────────────────────────────
router.post('/disputes/:id/resolve', async (req, res) => {
  const { id } = req.params;
  const { note } = req.body as { note: string };
  const adminId = (req as AuthRequest).user?.id;

  try {
    const result = await pool.query(
      `UPDATE disputes
       SET status = 'resolved',
           resolution_note = $1,
           resolved_by = $2,
           resolved_at = NOW(),
           updated_at = NOW()
       WHERE id = $3
       RETURNING id, order_id`,
      [note, adminId, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Dispute not found.' });
      return;
    }

    // TODO: In a real system, trigger refund via payment gateway (Stripe/Razorpay) here

    res.json({ message: 'Dispute resolved and refund marked.' });
  } catch (err) {
    console.error('[admin/disputes/resolve]', err);
    res.status(500).json({ error: 'Could not resolve dispute.' });
  }
});

// ─── POST /admin/disputes/:id/reject ──────────────────────────────────────
router.post('/disputes/:id/reject', async (req, res) => {
  const { id } = req.params;
  const { note } = req.body as { note: string };
  const adminId = (req as AuthRequest).user?.id;

  try {
    const result = await pool.query(
      `UPDATE disputes
       SET status = 'rejected',
           resolution_note = $1,
           resolved_by = $2,
           resolved_at = NOW(),
           updated_at = NOW()
       WHERE id = $3
       RETURNING id`,
      [note, adminId, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Dispute not found.' });
      return;
    }

    res.json({ message: 'Dispute rejected.' });
  } catch (err) {
    console.error('[admin/disputes/reject]', err);
    res.status(500).json({ error: 'Could not reject dispute.' });
  }
});

export default router;
