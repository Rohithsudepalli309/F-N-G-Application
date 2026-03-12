import { Router } from 'express';
import pool from '../db';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth';
import { io } from '../server';
import { sendPushToUser } from '../services/fcm';
import { notifyUser } from '../services/notify';

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
      deliveryLat:     0,  // geospatial lookup not available; default 0
      deliveryLng:     0,
      totalAmount:     r.total_amount,
      itemCount:       Number(r.items_count),
      estimatedKm:     0,  // requires geospatial calculation
      driverPayout:    Math.round(r.total_amount * 0.2),  // 20% of order value as delivery fee
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
      deliveryLat:     0,
      deliveryLng:     0,
      totalAmount:     r.total_amount,
      itemCount:       Number(r.items_count),
      estimatedKm:     0,
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

// ─── POST /driver/reject ─── Decline/reject an order (non-blocking) ─────────
router.post('/reject', async (req: AuthRequest, res) => {
  // Non-critical: driver passes; other drivers remain eligible.
  // No status change on the order itself.
  res.json({ success: true });
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
              o.metadata->>'delivery_otp' AS delivery_otp
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

    // Verify OTP stored in metadata (set when order is placed or when driver is assigned)
    if (order.delivery_otp && order.delivery_otp !== otp) {
      await client.query('ROLLBACK');
      res.status(400).json({ error: 'Invalid delivery OTP.' });
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

    res.json({
      earnings: {
        period,
        totalPayout,
        deliveries,
        avgPerDelivery,
      },
    });
  } catch (err) {
    console.error('[driver/earnings] error:', err);
    res.status(500).json({ error: 'Could not fetch earnings.' });
  }
});

export default router;
