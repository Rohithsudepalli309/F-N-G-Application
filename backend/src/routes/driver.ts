import { Router } from 'express';
import pool from '../db';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth';
import { io } from '../server';
import { sendPushToUser } from '../services/fcm';

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

    // Return orders assigned to this driver that are not yet delivered/cancelled
    const result = await pool.query(
      `SELECT
         o.id,
         o.store_id,
         o.store_name,
         o.status,
         o.total_amount,
         o.delivery_address,
         o.created_at,
         s.lat  AS pickup_lat,
         s.lng  AS pickup_lng,
         s.address AS pickup_address_text,
         (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS items_count
       FROM orders o
       LEFT JOIN stores s ON s.id = o.store_id
       WHERE o.driver_id = $1
         AND o.status NOT IN ('delivered', 'cancelled', 'refunded')
       ORDER BY o.created_at DESC
       LIMIT 50`,
      [driverId]
    );

    // Shape response to match Swift AssignedOrder model
    const orders = result.rows.map((r) => ({
      id: String(r.id),
      store_id: r.store_id ? String(r.store_id) : null,
      store_name: r.store_name ?? null,
      status: r.status,
      total_amount: r.total_amount,
      delivery_address: r.delivery_address,
      created_at: r.created_at,
      items_count: Number(r.items_count),
      pickup_address: r.pickup_lat
        ? { lat: Number(r.pickup_lat), lng: Number(r.pickup_lng), text: r.pickup_address_text ?? '' }
        : null,
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
      sendPushToUser(
        custRes.rows[0].customer_id,
        '🛵 Driver Assigned',
        'Your delivery partner is on the way to collect your order.',
        { screen: 'OrderTracking', orderId: String(orderId) }
      );
    }

    res.json({ success: true });
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

export default router;
