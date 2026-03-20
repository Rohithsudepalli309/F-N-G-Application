import { Router } from 'express';
import pool from '../db';
import { requireAuth, requireRole } from '../middleware/auth';
import { logger } from '../logger';

const router = Router();
router.use(requireAuth, requireRole('admin'));

// Date format guard — YYYY-MM-DD only
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// ─── GET /analytics/stats ─── Platform-level KPIs (ME-5: optional date range) ──
router.get('/stats', async (req, res) => {
  const { startDate, endDate } = req.query as Record<string, string>;

  // BUG-001 FIX: Validate date format before use — prevents SQL injection
  if (startDate && !DATE_RE.test(startDate)) {
    res.status(400).json({ error: 'Invalid startDate format. Use YYYY-MM-DD.' });
    return;
  }
  if (endDate && !DATE_RE.test(endDate)) {
    res.status(400).json({ error: 'Invalid endDate format. Use YYYY-MM-DD.' });
    return;
  }

  // BUG-001 FIX: Use parameterized queries — no string interpolation into SQL
  const kpiParams: unknown[] = [];
  let rangeFilter = '';
  if (startDate && endDate) {
    kpiParams.push(startDate, endDate);
    rangeFilter = `AND created_at::date BETWEEN $1 AND $2`;
  }

  try {
    const [kpiRes, chartRes] = await Promise.all([
      pool.query(
        `SELECT
           COUNT(*) AS "totalOrders",
           COUNT(*) FILTER (WHERE status IN ('placed','preparing','ready','pickup'))
             AS "activeOrders",
           (SELECT COUNT(*) FROM drivers WHERE is_available=TRUE AND is_active=TRUE)
             AS "activeDrivers",
           COALESCE(
             SUM(total_amount) FILTER (WHERE created_at::date = CURRENT_DATE),
             0
           ) AS "dailyRevenue"
         FROM orders
         WHERE 1=1 ${rangeFilter}`,
        kpiParams
      ),
      pool.query(
        `SELECT
           TO_CHAR(d.day, 'Dy') AS name,
           COALESCE(COUNT(o.id), 0)::int AS orders,
           COALESCE(SUM(o.total_amount), 0)::int AS revenue
         FROM generate_series(
           CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, '1 day'
         ) AS d(day)
         LEFT JOIN orders o
           ON o.created_at::date = d.day
           AND o.status NOT IN ('cancelled')
         GROUP BY d.day
         ORDER BY d.day`
      ),
    ]);

    const kpi = kpiRes.rows[0];
    res.json({
      totalOrders:   Number(kpi.totalOrders),
      activeOrders:  Number(kpi.activeOrders),
      activeDrivers: Number(kpi.activeDrivers),
      dailyRevenue:  Number(kpi.dailyRevenue),
      chartData:     chartRes.rows,
    });
  } catch (err) {
    logger.error('[analytics/stats]', { err });
    res.status(500).json({ error: 'Could not fetch analytics stats.' });
  }
});

// ─── GET /analytics/fleet ─── Driver fleet status (FEAT-006: paginated) ────
router.get('/fleet', async (req, res) => {
  const limit  = Math.min(Math.max(Number(req.query.limit)  || 50, 1), 200);
  const offset = Math.max(Number(req.query.offset) || 0, 0);

  try {
    const result = await pool.query(
      `SELECT
         d.id, d.name, d.phone, d.is_available AS "isOnline",
         o.status AS "deliveryStatus", o.id AS "activeOrderId",
         d.current_lat AS "lastLat", d.current_lng AS "lastLng"
       FROM drivers d
       LEFT JOIN orders o ON o.driver_id = d.id
         AND o.status IN ('pickup','out_for_delivery')
       WHERE d.is_active = TRUE
       ORDER BY d.is_available DESC, d.name
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    res.json(result.rows);
  } catch (err) {
    logger.error('[analytics/fleet]', { err });
    res.status(500).json({ error: 'Could not fetch fleet data.' });
  }
});

// ─── GET /analytics/export/orders ─── CSV export (A-2) ────────────────────
router.get('/export/orders', async (req, res) => {
  const { startDate, endDate } = req.query as Record<string, string>;

  if (startDate && !DATE_RE.test(startDate)) {
    res.status(400).json({ error: 'Invalid startDate format. Use YYYY-MM-DD.' });
    return;
  }
  if (endDate && !DATE_RE.test(endDate)) {
    res.status(400).json({ error: 'Invalid endDate format. Use YYYY-MM-DD.' });
    return;
  }

  const params: string[] = [];
  let where = 'WHERE 1=1';
  if (startDate) { params.push(startDate); where += ` AND o.created_at::date >= $${params.length}`; }
  if (endDate)   { params.push(endDate);   where += ` AND o.created_at::date <= $${params.length}`; }

  try {
    const result = await pool.query(
      `SELECT o.id, o.order_number, o.store_name, o.status,
              o.total_amount, o.payment_method, o.payment_status,
              o.created_at, u.name AS customer, u.phone AS customer_phone
       FROM orders o JOIN users u ON u.id = o.customer_id
       ${where} ORDER BY o.created_at DESC LIMIT 5000`,
      params
    );

    const header = 'ID,Order Number,Store,Status,Total(paise),Payment,Payment Status,Created At,Customer,Phone\n';
    const csv = header + result.rows.map(r =>
      [r.id, r.order_number, `"${(r.store_name ?? '').replace(/"/g, '""')}"`, r.status,
       r.total_amount, r.payment_method, r.payment_status,
       new Date(r.created_at).toISOString(),
       `"${(r.customer ?? '').replace(/"/g, '""')}"`, r.customer_phone].join(',')
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="fng-orders.csv"');
    res.send(csv);
  } catch (err) {
    logger.error('[analytics/export]', { err });
    res.status(500).json({ error: 'Could not export orders.' });
  }
});

export default router;
