import { Router } from 'express';
import pool from '../db';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();
router.use(requireAuth, requireRole('admin'));

// ─── GET /analytics/stats ─── Platform-level KPIs ─────────────────────────
router.get('/stats', async (_req, res) => {
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
       FROM orders`
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
});

// ─── GET /analytics/fleet ─── Driver fleet status ─────────────────────────
router.get('/fleet', async (_req, res) => {
  const result = await pool.query(
    `SELECT
       d.id, d.name, d.phone, d.is_available AS "isOnline",
       o.status AS "deliveryStatus", o.id AS "activeOrderId",
       d.current_lat AS "lastLat", d.current_lng AS "lastLng"
     FROM drivers d
     LEFT JOIN orders o ON o.driver_id = d.id
       AND o.status IN ('pickup','out_for_delivery')
     WHERE d.is_active = TRUE
     ORDER BY d.is_available DESC, d.name`
  );
  res.json(result.rows);   // array (matches admin FleetManagement expectation)
});

export default router;
