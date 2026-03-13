import { Router } from 'express';
import pool from '../db';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth';
import { io } from '../server';
import { sendPushToUser } from '../services/fcm';
import { notifyUser } from '../services/notify';
import { redis, DRIVER_GEO_KEY } from '../redis';

// Haversine great-circle distance (km)
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const router = Router();
router.use(requireAuth);
router.use(requireRole('driver'));

// ─── GET /driver/orders ─── Orders assigned / available to this driver ──────
router.get('/orders', async (req: AuthRequest, res) => {
  try {
    const driverRes = await pool.query(
      `SELECT id FROM drivers WHERE user_id=$1 LIMIT 1`,
      [req.user!.id]
    );
    if (!driverRes.rows[0]) {
      res.status(404).json({ error: 'Driver profile not found.' });
      return;
    }
    const driverId: number = driverRes.rows[0].id;

    const result = await pool.query(
      `SELECT
         o.id,
         o.order_number,
         o.store_id,
         o.store_name,
         o.status,
         o.total_amount,
         o.delivery_address,
         o.created_at,
         o.metadata->>'delivery_otp' AS delivery_otp,
         (o.delivery_address->>'lat')::numeric  AS delivery_lat,
         (o.delivery_address->>'lng')::numeric  AS delivery_lng,
         u.name  AS customer_name,
         u.phone AS customer_phone,
         s.lat   AS store_lat,
         s.lng   AS store_lng,
         s.address AS store_address,
         (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS items_count
       FROM orders o
       LEFT JOIN stores s ON s.id = o.store_id
       LEFT JOIN users u ON u.id = o.customer_id
       WHERE o.driver_id = $1
         AND o.status NOT IN ('delivered', 'cancelled', 'refunded')
       ORDER BY o.created_at DESC
       LIMIT 50`,
      [driverId]
    );

    // Return camelCase to match AvailableOrder / ActiveOrder store interfaces
    const orders = result.rows.map((r) => ({
      id:              r.id,
      orderNumber:     r.order_number ?? '',
      storeName:       r.store_name ?? '',
      storeAddress:    r.store_address ?? '',
      storeLat:        r.store_lat ? Number(r.store_lat) : 0,
      storeLng:        r.store_lng ? Number(r.store_lng) : 0,
      deliveryAddress: r.delivery_address ?? '',
      deliveryLat:     r.delivery_lat ? Number(r.delivery_lat) : 0,
      deliveryLng:     r.delivery_lng ? Number(r.delivery_lng) : 0,
      totalAmount:     r.total_amount,
      itemCount:       Number(r.items_count),
      estimatedKm: (() => {
        const sLat = r.store_lat ? Number(r.store_lat) : 0;
        const sLng = r.store_lng ? Number(r.store_lng) : 0;
        const dLat = r.delivery_lat ? Number(r.delivery_lat) : 0;
        const dLng = r.delivery_lng ? Number(r.delivery_lng) : 0;
        return (sLat && sLng && dLat && dLng) ? haversineKm(sLat, sLng, dLat, dLng) : 0;
      })(),
      driverPayout:    Math.round(r.total_amount * 0.2),
      status:          r.status,
      customerName:    r.customer_name ?? '',
      customerPhone:   r.customer_phone ?? '',
      deliveryOtp:     r.delivery_otp ?? '',
    }));

    res.json(orders);
  } catch (err) {
    console.error('[driver/orders] error:', err);
    res.status(500).json({ error: 'Could not fetch orders.' });
  }
});

// ─── POST /driver/accept ─── Accept an assigned order ──────────────────────
router.post('/accept', async (req: AuthRequest, res) => {
  const { orderId } = req.body as { orderId?: string };
  if (!orderId) {
    res.status(400).json({ error: 'orderId is required.' });
    return;
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const driverRes = await client.query(
      `SELECT id FROM drivers WHERE user_id=$1 LIMIT 1`,
      [req.user!.id]
    );
    if (!driverRes.rows[0]) {
      await client.query('ROLLBACK');
      res.status(404).json({ error: 'Driver profile not found.' });
      return;
    }
    const driverId: number = driverRes.rows[0].id;

    // Only accept if order is in a state ready to be picked up and not already assigned
    const orderRes = await client.query(
      `SELECT id, status, driver_id, store_id FROM orders WHERE id=$1 FOR UPDATE`,
      [orderId]
    );
    const order = orderRes.rows[0];
    if (!order) {
      await client.query('ROLLBACK');
      res.status(404).json({ error: 'Order not found.' });
      return;
    }
    if (!['ready', 'placed', 'assigned'].includes(order.status)) {
      await client.query('ROLLBACK');
      res.status(409).json({ error: `Order cannot be accepted in status '${order.status}'.` });
      return;
    }
    // HIGH-1: verify this order was actually dispatched to this driver
    // (or is unassigned and open for nearest-driver assignment, but only if driver_id is null)
    if (order.driver_id !== null && order.driver_id !== driverId) {
      await client.query('ROLLBACK');
      res.status(403).json({ error: 'This order is not assigned to you.' });
      return;
    }
    // Check driver doesn't already have an active order
    const activeCheck = await client.query(
      `SELECT id FROM orders
       WHERE driver_id=$1 AND status IN ('assigned','pickup','out_for_delivery')
       LIMIT 1`,
      [driverId]
    );
    if (activeCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      res.status(409).json({ error: 'Complete your current delivery before accepting another.' });
      return;
    }

    await client.query(
      `UPDATE orders
       SET driver_id=$1, status='assigned', confirmed_at=NOW()
       WHERE id=$2`,
      [driverId, orderId]
    );

    await client.query(
      `UPDATE drivers SET is_available=FALSE WHERE id=$1`,
      [driverId]
    );

    // M-10: keep driver_assignments in sync with REST accept path
    await client.query(
      `INSERT INTO driver_assignments (order_id, driver_id, status, responded_at)
       VALUES ($1, $2, 'accepted', NOW())
       ON CONFLICT (order_id) DO UPDATE
         SET driver_id=$2, status='accepted', responded_at=NOW()`,
      [orderId, driverId]
    ).catch(() => {/* table may not exist in all envs; non-fatal */});

    await client.query('COMMIT');

    // Notify customer & admin via socket
    io.to(`order:${orderId}`).emit('order:status', { status: 'assigned', orderId });
    io.to('admin').emit('order.platform.update', { id: orderId, status: 'assigned' });

    // FCM push to customer (non-critical)
    const custRes = await pool.query(
      `SELECT customer_id FROM orders WHERE id=$1`,
      [orderId]
    ).catch(() => ({ rows: [] as { customer_id: number }[] }));
    if (custRes.rows[0]?.customer_id) {
      const custId: number = custRes.rows[0].customer_id;
      sendPushToUser(
        custId,
        '🛵 Driver Assigned',
        'Your delivery partner is on the way to collect your order.',
        { screen: 'OrderTracking', orderId: String(orderId) }
      );
      notifyUser(custId, '🛵 Driver Assigned',
        'Your delivery partner is on the way to collect your order.',
        'order', { screen: 'OrderTracking', orderId: String(orderId) });
    }

    // Fetch updated order to return full ActiveOrder shape to the app
    const updatedOrder = await pool.query(
      `SELECT
         o.id, o.order_number, o.store_name, o.status, o.total_amount,
         o.delivery_address, o.metadata->>'delivery_otp' AS delivery_otp,
         u.name AS customer_name, u.phone AS customer_phone,
         s.lat AS store_lat, s.lng AS store_lng, s.address AS store_address,
         (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS items_count
       FROM orders o
       LEFT JOIN stores s ON s.id = o.store_id
       LEFT JOIN users u ON u.id = o.customer_id
       WHERE o.id = $1`,
      [orderId]
    );
    const r = updatedOrder.rows[0];
    const orderOut = r ? {
      id:              r.id,
      orderNumber:     r.order_number ?? '',
      storeName:       r.store_name ?? '',
      storeAddress:    r.store_address ?? '',
      storeLat:        r.store_lat ? Number(r.store_lat) : 0,
      storeLng:        r.store_lng ? Number(r.store_lng) : 0,
      deliveryAddress: r.delivery_address ?? '',
      deliveryLat:     r.delivery_address?.lat ? Number(r.delivery_address.lat) : 0,
      deliveryLng:     r.delivery_address?.lng ? Number(r.delivery_address.lng) : 0,
      totalAmount:     r.total_amount,
      itemCount:       Number(r.items_count),
      estimatedKm: (() => {
        const sLat = r.store_lat ? Number(r.store_lat) : 0;
        const sLng = r.store_lng ? Number(r.store_lng) : 0;
        const dLat = r.delivery_address?.lat ? Number(r.delivery_address.lat) : 0;
        const dLng = r.delivery_address?.lng ? Number(r.delivery_address.lng) : 0;
        return (sLat && sLng && dLat && dLng) ? haversineKm(sLat, sLng, dLat, dLng) : 0;
      })(),
      driverPayout:    Math.round(r.total_amount * 0.2),
      status:          r.status,
      customerName:    r.customer_name ?? '',
      customerPhone:   r.customer_phone ?? '',
      deliveryOtp:     r.delivery_otp ?? '',
    } : null;

    res.json({ success: true, order: orderOut });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[driver/accept] error:', err);
    res.status(500).json({ error: 'Could not accept order.' });
  } finally {
    client.release();
  }
});

// ─── POST /driver/reject ─── Decline order + re-dispatch to next available driver ─
router.post('/reject', async (req: AuthRequest, res) => {
  const { orderId } = req.body as { orderId?: string };
  res.json({ success: true }); // respond immediately — async work below

  if (!orderId) return;
  try {
    const driverRes = await pool.query(
      `SELECT id FROM drivers WHERE user_id=$1 LIMIT 1`, [req.user!.id]
    );
    const driverId: number | undefined = driverRes.rows[0]?.id;
    if (!driverId) return;

    // Revert assignment so another driver can pick it up
    const revertRes = await pool.query(
      `UPDATE orders
       SET status='ready', driver_id=NULL
       WHERE id=$1 AND driver_id=$2 AND status IN ('assigned','ready')
       RETURNING id, store_id, store_name, total_amount, delivery_address, created_at`,
      [orderId, driverId]
    );
    await pool.query(`UPDATE drivers SET is_available=TRUE WHERE id=$1`, [driverId]);

    if (!revertRes.rows.length) return;
    const order = revertRes.rows[0];
    io.to('admin').emit('order.platform.update', { id: order.id, status: 'ready' });

    // Re-dispatch to next nearest available driver via Redis GEO
    const storeRes = await pool.query(`SELECT lat, lng FROM stores WHERE id=$1`, [order.store_id]);
    const store = storeRes.rows[0];
    if (!store?.lat || !store?.lng) return;

    const nearbyRaw = await redis.georadius(
      DRIVER_GEO_KEY, Number(store.lng), Number(store.lat),
      10, 'km', 'ASC', 'COUNT', 5
    ) as string[];
    if (!nearbyRaw.length) return;

    const availRes = await pool.query(
      `SELECT d.id, d.user_id FROM drivers d
       WHERE d.user_id = ANY($1::int[])
         AND d.is_available=TRUE AND d.is_active=TRUE
         AND d.id != $2
         AND NOT EXISTS (
           SELECT 1 FROM orders ao WHERE ao.driver_id=d.id
             AND ao.status IN ('assigned','pickup','out_for_delivery')
         )
       LIMIT 3`,
      [nearbyRaw.map(Number), driverId]
    );
    for (const d of availRes.rows) {
      io.to(`driver:${d.user_id}`).emit('driver:order_assigned', {
        orderId: order.id,
        storeId: order.store_id,
        storeName: order.store_name,
      });
    }
  } catch (err) {
    console.error('[driver/reject] re-dispatch error:', err);
  }
});

// ─── POST /driver/pickup ─── Driver collected order from store ───────────────
router.post('/pickup', async (req: AuthRequest, res) => {
  const { orderId } = req.body as { orderId?: string };
  if (!orderId) {
    res.status(400).json({ error: 'orderId is required.' });
    return;
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const driverRes = await client.query(
      `SELECT id FROM drivers WHERE user_id=$1 LIMIT 1`,
      [req.user!.id]
    );
    if (!driverRes.rows[0]) {
      await client.query('ROLLBACK');
      res.status(404).json({ error: 'Driver profile not found.' });
      return;
    }
    const driverId: number = driverRes.rows[0].id;

    const orderRes = await client.query(
      `SELECT id, status, driver_id FROM orders WHERE id=$1 FOR UPDATE`,
      [orderId]
    );
    const order = orderRes.rows[0];
    if (!order) {
      await client.query('ROLLBACK');
      res.status(404).json({ error: 'Order not found.' });
      return;
    }
    if (order.driver_id !== driverId) {
      await client.query('ROLLBACK');
      res.status(403).json({ error: 'This order is not assigned to you.' });
      return;
    }
    if (!['assigned', 'pickup'].includes(order.status)) {
      await client.query('ROLLBACK');
      res.status(409).json({ error: `Cannot mark pickup for order in status '${order.status}'.` });
      return;
    }

    await client.query(
      `UPDATE orders SET status='out_for_delivery', picked_at=NOW() WHERE id=$1`,
      [orderId]
    );

    await client.query('COMMIT');

    io.to(`order:${orderId}`).emit('order:status', { status: 'out_for_delivery', orderId });
    io.to('admin').emit('order.platform.update', { id: orderId, status: 'out_for_delivery' });

    // FCM push to customer (non-critical)
    const custOfd = await pool.query(
      `SELECT customer_id FROM orders WHERE id=$1`,
      [orderId]
    ).catch(() => ({ rows: [] as { customer_id: number }[] }));
    if (custOfd.rows[0]?.customer_id) {
      sendPushToUser(
        custOfd.rows[0].customer_id,
        '🛵 Order Picked Up',
        'Your delivery partner has collected your order and is heading to you.',
        { screen: 'OrderTracking', orderId: String(orderId) }
      );
    }

    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[driver/pickup] error:', err);
    res.status(500).json({ error: 'Could not mark order as picked up.' });
  } finally {
    client.release();
  }
});

// ─── POST /driver/complete ─── Complete delivery (OTP verified) ──────────────
router.post('/complete', async (req: AuthRequest, res) => {
  const { orderId, otp } = req.body as { orderId?: string; otp?: string };
  if (!orderId || !otp) {
    res.status(400).json({ error: 'orderId and otp are required.' });
    return;
  }
  // Sanitise OTP — must be exactly 6 digits
  if (!/^\d{6}$/.test(otp)) {
    res.status(400).json({ error: 'OTP must be 6 digits.' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const driverRes = await client.query(
      `SELECT id FROM drivers WHERE user_id=$1 LIMIT 1`,
      [req.user!.id]
    );
    if (!driverRes.rows[0]) {
      await client.query('ROLLBACK');
      res.status(404).json({ error: 'Driver profile not found.' });
      return;
    }
    const driverId: number = driverRes.rows[0].id;

    const orderRes = await client.query(
      `SELECT o.id, o.status, o.driver_id, o.customer_id,
              o.metadata->>'delivery_otp' AS delivery_otp,
              COALESCE((o.metadata->>'otp_attempts')::int, 0) AS otp_attempts
       FROM orders o
       WHERE o.id=$1 FOR UPDATE`,
      [orderId]
    );
    const order = orderRes.rows[0];
    if (!order) {
      await client.query('ROLLBACK');
      res.status(404).json({ error: 'Order not found.' });
      return;
    }
    if (order.driver_id !== driverId) {
      await client.query('ROLLBACK');
      res.status(403).json({ error: 'This order is not assigned to you.' });
      return;
    }
    if (order.status !== 'out_for_delivery') {
      await client.query('ROLLBACK');
      res.status(409).json({ error: `Order must be out_for_delivery to complete. Current: '${order.status}'.` });
      return;
    }

    // Brute-force lockout: max 5 OTP attempts
    if (order.otp_attempts >= 5) {
      await client.query('ROLLBACK');
      res.status(429).json({ error: 'Too many incorrect OTP attempts. Contact support.' });
      return;
    }

    // Verify OTP stored in metadata (set when order is placed or when driver is assigned)
    if (order.delivery_otp && order.delivery_otp !== otp) {
      // Increment attempt counter (non-fatal if metadata column is unavailable)
      await client.query(
        `UPDATE orders SET metadata = jsonb_set(
           COALESCE(metadata, '{}'::jsonb), '{otp_attempts}',
           to_jsonb(COALESCE((metadata->>'otp_attempts')::int, 0) + 1)
         ) WHERE id=$1`,
        [orderId]
      );
      await client.query('ROLLBACK');
      const remaining = 5 - (order.otp_attempts + 1);
      res.status(400).json({ error: `Invalid delivery OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.` });
      return;
    }

    await client.query(
      `UPDATE orders
       SET status='delivered', delivered_at=NOW(), payment_status=CASE WHEN payment_method='cod' THEN 'paid' ELSE payment_status END
       WHERE id=$1`,
      [orderId]
    );

    // Free up driver
    await client.query(
      `UPDATE drivers SET is_available=TRUE WHERE id=$1`,
      [driverId]
    );

    await client.query('COMMIT');

    io.to(`order:${orderId}`).emit('order:status', { status: 'delivered', orderId });
    io.to('admin').emit('order.platform.update', { id: orderId, status: 'delivered' });

    // FCM push to customer (non-critical)
    if (order.customer_id) {
      sendPushToUser(
        order.customer_id,
        '🎉 Order Delivered!',
        'Your order has been delivered. Enjoy your meal!',
        { screen: 'OrderDetail', orderId: String(orderId) }
      );
      notifyUser(order.customer_id, '🎉 Order Delivered!',
        'Your order has been delivered. Enjoy your meal!',
        'delivery', { screen: 'OrderDetail', orderId: String(orderId) });
    }

    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[driver/complete] error:', err);
    res.status(500).json({ error: 'Could not complete delivery.' });
  } finally {
    client.release();
  }
});

// ─── PATCH /driver/status ─── Toggle driver online/offline ─────────────────
router.patch('/status', async (req: AuthRequest, res) => {
  const { isOnline } = req.body as { isOnline?: boolean };
  if (typeof isOnline !== 'boolean') {
    res.status(400).json({ error: 'isOnline (boolean) is required.' });
    return;
  }
  try {
    const upd = await pool.query(
      `UPDATE drivers SET is_available=$1 WHERE user_id=$2 RETURNING id`,
      [isOnline, req.user!.id]
    );
    if (!upd.rows[0]) {
      res.status(404).json({ error: 'Driver profile not found.' });
      return;
    }
    res.json({ success: true, isOnline });
  } catch (err) {
    console.error('[driver/status] error:', err);
    res.status(500).json({ error: 'Could not update driver status.' });
  }
});

// ─── GET /driver/earnings ─── Earnings summary by period ────────────────────
router.get('/earnings', async (req: AuthRequest, res) => {
  const { period = 'today' } = req.query as { period?: string };

  let dateFilter: string;
  if (period === 'today') {
    dateFilter = `AND o.delivered_at >= CURRENT_DATE`;
  } else if (period === 'week') {
    dateFilter = `AND o.delivered_at >= CURRENT_DATE - INTERVAL '7 days'`;
  } else if (period === 'month') {
    dateFilter = `AND o.delivered_at >= CURRENT_DATE - INTERVAL '30 days'`;
  } else {
    dateFilter = '';
  }

  try {
    const driverRes = await pool.query(
      `SELECT id FROM drivers WHERE user_id=$1 LIMIT 1`,
      [req.user!.id]
    );
    if (!driverRes.rows[0]) {
      res.status(404).json({ error: 'Driver profile not found.' });
      return;
    }
    const driverId: number = driverRes.rows[0].id;

    const result = await pool.query(
      `SELECT
         COUNT(*) AS deliveries,
         COALESCE(SUM(o.total_amount * 0.2), 0) AS total_payout
       FROM orders o
       WHERE o.driver_id = $1
         AND o.status = 'delivered'
         ${dateFilter}`,
      [driverId]
    );

    const row = result.rows[0];
    const deliveries = Number(row.deliveries);
    const totalPayout = Math.round(Number(row.total_payout));
    const avgPerDelivery = deliveries > 0 ? Math.round(totalPayout / deliveries) : 0;

    // Recent deliveries list (last 20 in period)
    const historyRes = await pool.query(
      `SELECT o.id, o.order_number AS "orderNumber", o.store_name AS "storeName",
              ROUND(o.total_amount * 0.2) AS payout,
              o.delivered_at AS "deliveredAt"
       FROM orders o
       WHERE o.driver_id = $1 AND o.status = 'delivered' ${dateFilter}
       ORDER BY o.delivered_at DESC LIMIT 20`,
      [driverId]
    );

    res.json({
      earnings: {
        period,
        totalPayout,
        deliveries,
        avgPerDelivery,
      },
      history: historyRes.rows,
    });
  } catch (err) {
    console.error('[driver/earnings] error:', err);
    res.status(500).json({ error: 'Could not fetch earnings.' });
  }
});

// ─── GET /driver/profile ─── Driver profile info ─────────────────────────────
router.get('/profile', async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      `SELECT d.id, u.name, u.phone, d.vehicle_type, d.is_available,
              (SELECT COUNT(*) FROM orders o WHERE o.driver_id=d.id AND o.status='delivered') AS total_deliveries
       FROM drivers d JOIN users u ON u.id=d.user_id
       WHERE d.user_id=$1 LIMIT 1`,
      [req.user!.id]
    );
    if (!result.rows[0]) {
      res.status(404).json({ error: 'Driver profile not found.' });
      return;
    }
    const r = result.rows[0];
    res.json({
      id:               r.id,
      name:             r.name ?? '',
      phone:            r.phone ?? '',
      vehicle_type:     r.vehicle_type ?? '',
      is_available:     r.is_available,
      total_deliveries: Number(r.total_deliveries),
    });
  } catch (err) {
    console.error('[driver/profile] error:', err);
    res.status(500).json({ error: 'Could not fetch driver profile.' });
  }
});

// ─── PATCH /driver/profile ─── Update name / vehicle type ────────────────────
router.patch('/profile', async (req: AuthRequest, res) => {
  const { name, vehicleType } = req.body as { name?: string; vehicleType?: string };
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (name) {
      await client.query(`UPDATE users SET name=$1 WHERE id=$2`, [name.trim().slice(0, 100), req.user!.id]);
    }
    if (vehicleType) {
      await client.query(`UPDATE drivers SET vehicle_type=$1 WHERE user_id=$2`, [vehicleType.trim().slice(0, 50), req.user!.id]);
    }
    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[driver/profile/patch] error:', err);
    res.status(500).json({ error: 'Could not update profile.' });
  } finally {
    client.release();
  }
});

export default router;
