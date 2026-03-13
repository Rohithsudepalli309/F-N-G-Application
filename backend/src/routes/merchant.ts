import { Router } from 'express';
import pool from '../db';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth';
import { io } from '../server';
import { redis, DRIVER_GEO_KEY } from '../redis';
import { validate, schemas } from '../utils/validation';
import { AppError } from '../middleware/errorHandler';

const router = Router();
router.use(requireAuth, requireRole(['merchant', 'admin']));

// ─── Middleware: Ensure User Controls the Store ──────────────────────────
async function authorizeStoreOwnership(req: AuthRequest, _res: any, next: any) {
  const userId = req.user!.id;
  const storeId = req.params.id || req.body.storeId;
  
  if (!storeId) return next();
  
  try {
    const { rows } = await pool.query(
      `SELECT owner_id FROM stores WHERE id = $1`,
      [storeId]
    );
    
    if (rows.length === 0) return next(new AppError('Store not found', 404));
    if (rows[0].owner_id !== userId && req.user?.role !== 'admin') {
      return next(new AppError('Access denied. You do not own this store.', 403));
    }
    next();
  } catch (err) {
    next(err);
  }
}

// ─── Helper: dispatch order to nearest available driver ──────────────────
async function assignNearestDriver(order: Record<string, unknown>): Promise<void> {
  const storeId = order.store_id as number;
  const orderId = order.id as number;

  // Get store coordinates
  const storeRes = await pool.query(
    `SELECT lat, lng FROM stores WHERE id=$1`,
    [storeId]
  );
  const store = storeRes.rows[0];
  if (!store?.lat || !store?.lng) return;

  // Find up to 5 nearest available drivers (within 10 km) via Redis GEO
  const nearbyRaw = await redis.georadius(
    DRIVER_GEO_KEY,
    Number(store.lng),
    Number(store.lat),
    10, 'km',
    'ASC', 'COUNT', 5
  ) as string[];

  if (!nearbyRaw.length) return;

  // Get their user_ids and check they are active and available in DB
  const availRes = await pool.query(
    `SELECT d.id AS driver_id, d.user_id, d.name, d.vehicle_type,
            d.current_lat, d.current_lng
     FROM drivers d
     WHERE d.user_id = ANY($1::int[])
       AND d.is_available = TRUE
       AND d.is_active = TRUE
       AND NOT EXISTS (
         SELECT 1 FROM orders ao
         WHERE ao.driver_id = d.id
           AND ao.status IN ('assigned','pickup','out_for_delivery')
       )
     LIMIT 5`,
    [nearbyRaw.map(Number)]
  );

  if (!availRes.rows.length) return;

  // Build order payload to push to driver
  const deliveryAddress = order.delivery_address as { lat?: number; lng?: number; text?: string };
  const orderPayload = {
    order: {
      id: String(orderId),
      store_id: storeId ? String(storeId) : null,
      store_name: order.store_name ?? null,
      status: 'ready',
      total_amount: order.total_amount,
      delivery_address: {
        lat: deliveryAddress?.lat ?? 0,
        lng: deliveryAddress?.lng ?? 0,
        text: deliveryAddress?.text ?? (deliveryAddress as Record<string, unknown>)?.address_line ?? '',
      },
      created_at: order.created_at,
      items_count: null,
      pickup_address: store.lat
        ? { lat: Number(store.lat), lng: Number(store.lng), text: '' }
        : null,
    },
  };

  // Emit to EACH nearby available driver (they accept or decline)
  for (const d of availRes.rows) {
    io.to(`driver:${d.user_id}`).emit('order.new_assignment', orderPayload);
  }
}

// ─── Helper: get merchant's store id ─────────────────────────────────────
async function getMerchantStore(userId: number): Promise<number | null> {
  const res = await pool.query(
    `SELECT id FROM stores WHERE owner_id=$1 LIMIT 1`,
    [userId]
  );
  return res.rows[0]?.id ?? null;
}

// ─── GET /merchant/profile ────────────────────────────────────────────────
router.get('/profile', async (req: AuthRequest, res) => {
  const storeId = req.user?.storeId ?? (await getMerchantStore(req.user!.id));
  if (!storeId) {
    res.status(404).json({ error: 'No store found for this account.' });
    return;
  }
  const result = await pool.query(
    `SELECT s.*, u.email FROM stores s JOIN users u ON u.id = s.owner_id WHERE s.id=$1`,
    [storeId]
  );
  res.json({ store: result.rows[0] ?? null });
});

// ─── PATCH /merchant/profile ──────────────────────────────────────────────
router.patch('/profile', async (req: AuthRequest, res) => {
  const storeId = req.user?.storeId ?? (await getMerchantStore(req.user!.id));
  if (!storeId) {
    res.status(404).json({ error: 'No store found.' });
    return;
  }
  const {
    storeName, storeType, imageUrl, bannerUrl,
    deliveryTimeMin, cuisineTags, phone, ownerName, businessHours,
    estPrepTimeMin, isPaused,
  } = req.body as {
    storeName?: string; storeType?: string; imageUrl?: string; bannerUrl?: string;
    deliveryTimeMin?: number; cuisineTags?: string[]; phone?: string; ownerName?: string;
    businessHours?: { open?: string; close?: string; closedDays?: string[] };
    estPrepTimeMin?: number; isPaused?: boolean;
  };

  const result = await pool.query(
    `UPDATE stores SET
       name             = COALESCE($1, name),
       store_type       = COALESCE($2, store_type),
       image_url        = COALESCE($3, image_url),
       banner_url       = COALESCE($4, banner_url),
       delivery_time_min = COALESCE($5, delivery_time_min),
       cuisine_tags     = COALESCE($6, cuisine_tags),
       phone            = COALESCE($7, phone),
       owner_name       = COALESCE($8, owner_name),
       business_hours   = COALESCE($9, business_hours),
       est_prep_time_min = COALESCE($10, est_prep_time_min),
       is_paused        = COALESCE($11, is_paused)
     WHERE id=$12 RETURNING *`,
    [
      storeName ?? null, storeType ?? null, imageUrl ?? null, bannerUrl ?? null,
      deliveryTimeMin ?? null, cuisineTags ?? null, phone ?? null, ownerName ?? null,
      businessHours ?? null, estPrepTimeMin ?? null, isPaused ?? null, storeId,
    ]
  );
  res.json({ store: result.rows[0] });
});

// ─── PATCH /merchant/store/toggle ─── Toggle store active/inactive ────────
router.patch('/store/toggle', async (req: AuthRequest, res) => {
  const storeId = req.user?.storeId ?? (await getMerchantStore(req.user!.id));
  if (!storeId) {
    res.status(404).json({ error: 'No store found.' });
    return;
  }
  const result = await pool.query(
    `UPDATE stores SET is_active = NOT is_active WHERE id=$1
     RETURNING id, name, is_active`,
    [storeId]
  );
  res.json({ store: result.rows[0] });
});

// ─── GET /merchant/orders ─────────────────────────────────────────────────
router.get('/orders', async (req: AuthRequest, res) => {
  const storeId = req.user?.storeId ?? (await getMerchantStore(req.user!.id));
  if (!storeId) {
    res.status(404).json({ error: 'No store found.' });
    return;
  }

  const { status, offset = '0' } = req.query as Record<string, string>;
  // MED-7: cap limit to prevent resource exhaustion
  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);

  let query = `
    SELECT o.id, o.order_number, o.status, o.total_amount,
           o.payment_method, o.payment_status, o.created_at,
           o.instructions, o.delivery_address,
           u.name AS customer_name, u.phone AS customer_phone,
           json_agg(json_build_object(
             'name', oi.name, 'quantity', oi.quantity, 'price', oi.price
           )) AS items
    FROM orders o
    JOIN users u ON u.id = o.customer_id
    JOIN order_items oi ON oi.order_id = o.id
    WHERE o.store_id=$1
  `;
  const params: unknown[] = [storeId];
  let idx = 2;

  if (status && status !== 'all') {
    query += ` AND o.status=$${idx++}`;
    params.push(status);
  }

  query += ` GROUP BY o.id, u.name, u.phone
             ORDER BY o.created_at DESC
             LIMIT $${idx++} OFFSET $${idx++}`;
  params.push(Number(limit), Number(offset));

  const result = await pool.query(query, params);
  res.json({ orders: result.rows });
});

// ─── PATCH /merchant/orders/:id/status ─── Update order status ───────────
router.patch('/orders/:id/status', async (req: AuthRequest, res) => {
  const storeId = req.user?.storeId ?? (await getMerchantStore(req.user!.id));
  if (!storeId) {
    res.status(404).json({ error: 'No store found.' });
    return;
  }

  const { id } = req.params;
  const { action } = req.body as { action: 'accept' | 'reject' | 'ready' };

  const STATUS_MAP: Record<string, string> = {
    accept: 'preparing',
    reject: 'cancelled',
    ready:  'ready',
  };

  const newStatus = STATUS_MAP[action];
  if (!newStatus) {
    res.status(400).json({ error: 'Invalid action. Use accept|reject|ready.' });
    return;
  }

  const result = await pool.query(
    `UPDATE orders SET status=$1,
       confirmed_at  = CASE WHEN $1='preparing' THEN NOW() ELSE confirmed_at END,
       preparing_at  = CASE WHEN $1='preparing' THEN NOW() ELSE preparing_at END,
       ready_at      = CASE WHEN $1='ready'     THEN NOW() ELSE ready_at     END,
       cancelled_at  = CASE WHEN $1='cancelled' THEN NOW() ELSE cancelled_at END
     WHERE id=$2 AND store_id=$3
     RETURNING *`,
    [newStatus, id, storeId]
  );

  if (result.rows.length === 0) {
    res.status(404).json({ error: 'Order not found.' });
    return;
  }

  const order = result.rows[0];
  io.to(`order:${id}`).emit('order:status', { status: newStatus });
  io.to(`merchant:${storeId}`).emit('order_status_update', { orderId: Number(id), status: newStatus });
  io.to('admin').emit('order.platform.update', order);

  // ── When order is ready: push assignment to nearest available driver ─────
  if (newStatus === 'ready') {
    assignNearestDriver(order).catch((e) =>
      console.error('[merchant/assign_driver] error:', e)
    );
  }

  res.json({ order });
});

// ─── GET /merchant/menu ─── Products list ────────────────────────────────
router.get('/menu', async (req: AuthRequest, res) => {
  const storeId = req.user?.storeId ?? (await getMerchantStore(req.user!.id));
  if (!storeId) {
    res.status(404).json({ error: 'No store found.' });
    return;
  }
  const result = await pool.query(
    `SELECT * FROM products WHERE store_id=$1 ORDER BY sort_order ASC, name ASC`,
    [storeId]
  );
  res.json({ products: result.rows });
});

// ─── POST /merchant/products ─── Add product ─────────────────────────────
router.post('/products', async (req: AuthRequest, res) => {
  const storeId = req.user?.storeId ?? (await getMerchantStore(req.user!.id));
  if (!storeId) {
    res.status(404).json({ error: 'No store found.' });
    return;
  }

  const { name, description, price, original_price, category, brand,
          image_url, stock = 0, unit, is_veg = true } = req.body as {
    name: string; description?: string; price: number; original_price?: number;
    category?: string; brand?: string; image_url?: string; stock?: number;
    unit?: string; is_veg?: boolean;
  };

  if (!name || !price) {
    res.status(400).json({ error: 'name and price are required.' });
    return;
  }

  const result = await pool.query(
    `INSERT INTO products
       (store_id, name, description, price, original_price,
        category, brand, image_url, stock, unit, is_veg)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
    [storeId, name, description ?? null, price, original_price ?? null,
     category ?? null, brand ?? null, image_url ?? null, stock, unit ?? null, is_veg]
  );
  res.status(201).json({ product: result.rows[0] });
});

// ─── PUT /merchant/products/:id ─── Update product ───────────────────────
router.put('/products/:id', async (req: AuthRequest, res) => {
  const storeId = req.user?.storeId ?? (await getMerchantStore(req.user!.id));
  if (!storeId) { res.status(404).json({ error: 'No store found.' }); return; }

  const { id } = req.params;
  const { name, description, price, original_price, category, brand,
          image_url, stock, unit, is_veg, is_available } = req.body as {
    name?: string; description?: string; price?: number; original_price?: number;
    category?: string; brand?: string; image_url?: string; stock?: number;
    unit?: string; is_veg?: boolean; is_available?: boolean;
  };

  const result = await pool.query(
    `UPDATE products SET
       name           = COALESCE($1, name),
       description    = COALESCE($2, description),
       price          = COALESCE($3, price),
       original_price = COALESCE($4, original_price),
       category       = COALESCE($5, category),
       brand          = COALESCE($6, brand),
       image_url      = COALESCE($7, image_url),
       stock          = COALESCE($8, stock),
       unit           = COALESCE($9, unit),
       is_veg         = COALESCE($10, is_veg),
       is_available   = COALESCE($11, is_available)
     WHERE id=$12 AND store_id=$13 RETURNING *`,
    [name ?? null, description ?? null, price ?? null, original_price ?? null,
     category ?? null, brand ?? null, image_url ?? null, stock ?? null,
     unit ?? null, is_veg ?? null, is_available ?? null,
     id, storeId]
  );
  if (result.rows.length === 0) {
    res.status(404).json({ error: 'Product not found.' });
    return;
  }
  res.json({ product: result.rows[0] });
});

// ─── DELETE /merchant/products/:id ─── Delete product ────────────────────
router.delete('/products/:id', async (req: AuthRequest, res) => {
  const storeId = req.user?.storeId ?? (await getMerchantStore(req.user!.id));
  if (!storeId) { res.status(404).json({ error: 'No store found.' }); return; }

  await pool.query(
    `DELETE FROM products WHERE id=$1 AND store_id=$2`,
    [req.params.id, storeId]
  );
  res.json({ message: 'Product deleted.' });
});

// ─── PATCH /merchant/products/:id/toggle ─── Availability toggle ─────────
router.patch('/products/:id/toggle', async (req: AuthRequest, res) => {
  const storeId = req.user?.storeId ?? (await getMerchantStore(req.user!.id));
  if (!storeId) { res.status(404).json({ error: 'No store found.' }); return; }

  const result = await pool.query(
    `UPDATE products SET is_available = NOT is_available
     WHERE id=$1 AND store_id=$2
     RETURNING id, name, is_available`,
    [req.params.id, storeId]
  );
  if (result.rows.length === 0) {
    res.status(404).json({ error: 'Product not found.' });
    return;
  }
  res.json({ product: result.rows[0] });
});

// ─── GET /merchant/analytics ─────────────────────────────────────────────
router.get('/analytics', async (req: AuthRequest, res) => {
  const storeId = req.user?.storeId ?? (await getMerchantStore(req.user!.id));
  if (!storeId) { res.status(404).json({ error: 'No store found.' }); return; }

  const { period = 'week' } = req.query as { period?: string };
  // MED-1: whitelist period to prevent SQL injection via INTERVAL string interpolation
  const intervalLiteral = period === 'month' ? '30 days' : '7 days';
  const groupBy = 'day';

  const [kpiRes, chartRes, topRes, storeRes] = await Promise.all([
    // Today's KPIs
    pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE created_at::date = CURRENT_DATE) AS "ordersToday",
         COALESCE(SUM(total_amount) FILTER (WHERE created_at::date = CURRENT_DATE), 0) AS "revenueToday",
         COUNT(*) FILTER (WHERE status IN ('placed','preparing','ready')) AS "pendingOrders"
       FROM orders WHERE store_id=$1`,
      [storeId]
    ),
    // Chart data
    pool.query(
      `SELECT
         TO_CHAR(created_at AT TIME ZONE 'Asia/Kolkata', 'DD Mon') AS label,
         COUNT(*) AS orders,
         COALESCE(SUM(total_amount),0) AS revenue
       FROM orders
       WHERE store_id=$1
         AND status NOT IN ('cancelled')
         AND created_at >= NOW() - $2::interval
       GROUP BY DATE_TRUNC('${groupBy}', created_at AT TIME ZONE 'Asia/Kolkata'), label
       ORDER BY DATE_TRUNC('${groupBy}', created_at AT TIME ZONE 'Asia/Kolkata')`,
      [storeId, intervalLiteral]
    ),
    // Top products
    pool.query(
      `SELECT oi.name, SUM(oi.quantity) AS units_sold, SUM(oi.total) AS revenue
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE o.store_id=$1
         AND o.status='delivered'
         AND o.created_at >= NOW() - $2::interval
       GROUP BY oi.name
       ORDER BY units_sold DESC LIMIT 5`,
      [storeId, intervalLiteral]
    ),
    // Avg rating
    pool.query(`SELECT rating FROM stores WHERE id=$1`, [storeId]),
  ]);

  const kpi = kpiRes.rows[0];
  res.json({
    ordersToday:   Number(kpi?.ordersToday ?? 0),
    revenueToday:  Number(kpi?.revenueToday ?? 0),
    pendingOrders: Number(kpi?.pendingOrders ?? 0),
    avgRating:     storeRes.rows[0]?.rating ?? null,
    chart:         chartRes.rows,
    topProducts:   topRes.rows,
  });
});

export default router;
