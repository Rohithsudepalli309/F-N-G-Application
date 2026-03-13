import { Router } from 'express';
import pool from '../db';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth';
import { io } from '../server';
import { publishOrderEvent } from '../services/eventBus';
import { getSurgeMultiplier } from '../services/surge';
import { isEnabled } from '../services/featureFlags';
import { earnPoints, redeemPoints } from '../services/loyalty';
import { calculateLoyaltyBenefits } from '../services/loyaltyEngine';
import { redis, DRIVER_GEO_KEY } from '../redis';
import { validate, schemas } from '../utils/validation';

const router = Router();
router.use(requireAuth);

function generateOrderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `FNG-${ts}-${rand}`;
}

function generateDeliveryOtp(): string {
  // Cryptographically random 6-digit OTP for delivery confirmation
  const { randomInt } = require('crypto') as typeof import('crypto');
  return String(randomInt(100000, 1000000));
}

// ─── POST /orders ─── Place new order ─────────────────────────────────────
router.post('/', validate(schemas.orders.create), async (req: AuthRequest, res) => {
  const {
    storeId,
    items,           // [{ productId, quantity }]
    deliveryAddress, // { label, address_line, city, pincode, lat?, lng? }
    paymentMethod = 'cod',
    couponCode,
    instructions,
  } = req.body as {
    storeId?: number;
    items: { productId: number; quantity: number }[];
    deliveryAddress: { label: string; address_line: string; city: string; pincode: string; lat?: number; lng?: number };
    paymentMethod?: string;
    couponCode?: string;
    instructions?: string;
  };

  // ME-6: Idempotency — prevent duplicate orders from network retries
  const idempotencyKey = req.headers['x-idempotency-key'] as string | undefined;
  if (idempotencyKey) {
    const existing = await pool.query(
      `SELECT id, order_number, status FROM orders
       WHERE metadata->>'idempotency_key' = $1 AND customer_id = $2 LIMIT 1`,
      [idempotencyKey, req.user!.id]
    );
    if (existing.rows.length > 0) {
      res.status(200).json({ order: existing.rows[0], duplicate: true });
      return;
    }
  }

  // MED-6: cap items to prevent DoS via overly large orders
  if (!items?.length || !deliveryAddress) {
    res.status(400).json({ error: 'items and deliveryAddress are required.' });
    return;
  }
  if (items.length > 50) {
    res.status(400).json({ error: 'Orders may contain at most 50 distinct items.' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Fetch products (lock rows)
    const productIds = items.map((i) => i.productId);
    const productsRes = await client.query(
      `SELECT id, store_id, name, price, image_url, is_available, stock
       FROM products WHERE id = ANY($1) FOR UPDATE`,
      [productIds]
    );
    const productMap = new Map(productsRes.rows.map((p) => [p.id, p]));

    // Derive storeId from first product when not supplied (e.g. grocery cart has no storeId)
    const resolvedStoreId: number = storeId
      ? Number(storeId)
      : Number(productsRes.rows[0]?.store_id);

    // Validate all products belong to the same store and are available
    let subtotal = 0;
    const lineItems: { product: Record<string, unknown>; quantity: number; total: number }[] = [];
    for (const item of items) {
      const p = productMap.get(item.productId);
      if (!p) {
        await client.query('ROLLBACK');
        res.status(400).json({ error: `Product ${item.productId} not found.` });
        return;
      }
      if (Number(p.store_id) !== resolvedStoreId) {
        await client.query('ROLLBACK');
        res.status(400).json({ error: 'All items must be from the same store.' });
        return;
      }
      if (!p.is_available) {
        await client.query('ROLLBACK');
        res.status(400).json({ error: `Product "${p.name}" is not available.` });
        return;
      }
      // MED-6: enforce per-item quantity bounds
      if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 100) {
        await client.query('ROLLBACK');
        res.status(400).json({ error: 'Each item quantity must be an integer between 1 and 100.' });
        return;
      }
      const lineTotal = p.price * item.quantity;
      subtotal += lineTotal;
      lineItems.push({ product: p, quantity: item.quantity, total: lineTotal });
    }

    // Delivery fee: free for orders > ₹499 (49900 paise)
    let deliveryFee = subtotal > 49900 ? 0 : 2500; // ₹25
    const handlingFee = 500; // ₹5

    // B-3: Pro members always get free delivery
    const proCheck = await client.query(
      `SELECT id FROM pro_subscriptions
       WHERE user_id=$1 AND status='active' AND expires_at > NOW() LIMIT 1`,
      [req.user!.id]
    );
    if (proCheck.rows.length > 0) deliveryFee = 0;

    // Phase 3 Intelligence: Apply Loyalty Benefits
    const loyalty = await calculateLoyaltyBenefits(req.user!.id, subtotal);
    if (loyalty.deliveryFeeOverride !== null) {
      deliveryFee = loyalty.deliveryFeeOverride;
    }

    // Apply surge pricing if feature flag is on for this user
    const surgeEnabled = await isEnabled('surge_pricing', req.user!.id);
    if (surgeEnabled && deliveryFee > 0) {
      const multiplier = await getSurgeMultiplier(resolvedStoreId);
      if (multiplier > 1) {
        deliveryFee = Math.round(deliveryFee * multiplier);
      }
    }

    // Apply coupon
    let discountAmount = 0;
    let couponId: number | null = null;

    // INTELLIGENCE: Auto Loyalty Discounts
    if (loyalty.autoDiscount > 0) {
      discountAmount += loyalty.autoDiscount;
    }

    if (couponCode) {
      const cpRes = await client.query(
        `SELECT * FROM coupons
         WHERE code=UPPER($1) AND is_active=TRUE
           AND (valid_until IS NULL OR valid_until > NOW())
           AND used_count < max_uses
         FOR UPDATE`,
        [couponCode]
      );
      if (cpRes.rows.length === 0) {
        await client.query('ROLLBACK');
        res.status(400).json({ error: 'Invalid or expired coupon.' });
        return;
      }
      const cp = cpRes.rows[0];
      if (subtotal < cp.min_order_amount) {
        await client.query('ROLLBACK');
        res.status(400).json({
          error: `Minimum order ₹${cp.min_order_amount / 100} required for this coupon.`,
        });
        return;
      }
      if (cp.discount_type === 'flat') {
        discountAmount = Math.min(cp.discount_value, subtotal);
      } else {
        discountAmount = Math.round((subtotal * cp.discount_value) / 100);
        if (cp.max_discount && discountAmount > cp.max_discount) {
          discountAmount = cp.max_discount;
        }
      }
      couponId = cp.id;
      await client.query(`UPDATE coupons SET used_count=used_count+1 WHERE id=$1`, [cp.id]);
    }

    const totalAmount = subtotal + deliveryFee + handlingFee - discountAmount;

    // Fetch store name
    const storeRes = await client.query(`SELECT name FROM stores WHERE id=$1`, [resolvedStoreId]);
    const storeName = storeRes.rows[0]?.name ?? '';

    const orderNumber = generateOrderNumber();
    const deliveryOtp = generateDeliveryOtp();

    // CRITICAL-3: Tax Calculation (Example: 5% GST for Food/Grocery)
    const taxRate = 0.05; 
    const taxAmount = Math.round(subtotal * taxRate);
    const finalTotal = totalAmount + taxAmount;

    // Insert order
    const orderRes = await client.query(
      `INSERT INTO orders
         (order_number, customer_id, store_id, store_name,
          subtotal, delivery_fee, handling_fee, discount_amount, total_amount,
          coupon_id, coupon_code, delivery_address, payment_method, payment_status, instructions,
          delivery_otp, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       RETURNING *`,
      [
        orderNumber, req.user!.id, resolvedStoreId, storeName,
        subtotal, deliveryFee, handlingFee, discountAmount, finalTotal,
        couponId, couponCode?.toUpperCase() ?? null,
        JSON.stringify(deliveryAddress),
        paymentMethod,
        paymentMethod === 'cod' ? 'pending' : 'pending',
        instructions ?? null,
        deliveryOtp,
        JSON.stringify({
          tax_amount: taxAmount,
          tax_rate: taxRate,
          idempotency_key: idempotencyKey,
          platform_commission_rate: 0.15, // 15%
          driver_payout_rate: 0.20,      // 20%
        }),
      ]
    );
    const order = orderRes.rows[0];

    // Insert order items
    for (const li of lineItems) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, name, image_url, price, quantity, total)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [order.id, li.product.id, li.product.name, li.product.image_url,
         li.product.price, li.quantity, li.total]
      );
    }

    await client.query('COMMIT');

    // Notify merchant via socket
    const fullOrder = await pool.query(
      `SELECT o.*, json_agg(
         json_build_object('name', oi.name, 'quantity', oi.quantity, 'price', oi.price)
       ) AS items
       FROM orders o JOIN order_items oi ON oi.order_id = o.id
       WHERE o.id=$1 GROUP BY o.id`,
      [order.id]
    );
    io.to(`merchant:${resolvedStoreId}`).emit('merchant:new_order', fullOrder.rows[0]);
    io.to('admin').emit('order.platform.update', fullOrder.rows[0]);

    // Async: FCM to merchant + demand recording via event bus (fire-and-forget)
    publishOrderEvent({
      type:       'order.placed',
      orderId:    String(order.id),
      storeId:    String(resolvedStoreId),
      customerId: String(req.user!.id),
      payload:    JSON.stringify({
        orderNumber: order.order_number,
        totalAmount: order.total_amount,
        storeName,
      }),
      requestId:  req.requestId ?? '',
    });

    // Phase 3: Earn Loyalty Points (₹100 = 1 point)
    earnPoints(req.user!.id, order.id, Math.floor(finalTotal / 100))
      .catch(err => console.error('[loyalty/earn]', err));

    res.status(201).json({
      order: {
        id: order.id,
        orderNumber: order.order_number,
        totalAmount: order.total_amount,
        status: order.status,
        paymentMethod: order.payment_method,
        deliveryOtp,   // Returned to customer at order time so they can share with driver
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[orders] place error:', err);
    res.status(500).json({ error: 'Could not place order. Please try again.' });
  } finally {
    client.release();
  }
});

// ─── GET /orders ─── Customer order history ──────────────────────────────
router.get('/', requireRole('customer', 'driver', 'admin'), async (req: AuthRequest, res) => {
  const { status, limit = '20', offset = '0' } = req.query as Record<string, string>;
  let query = `
    SELECT o.id, o.order_number, o.store_name, o.status, o.total_amount,
           o.payment_method, o.payment_status, o.created_at, o.delivered_at,
           json_agg(json_build_object(
             'name', oi.name, 'quantity', oi.quantity, 'price', oi.price, 'image_url', oi.image_url
           )) AS items
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    WHERE o.customer_id=$1
  `;
  const params: unknown[] = [req.user!.id];
  let idx = 2;
  if (status) {
    query += ` AND o.status=$${idx++}`;
    params.push(status);
  }
  query += ` GROUP BY o.id ORDER BY o.created_at DESC LIMIT $${idx++} OFFSET $${idx++}`;
  params.push(Number(limit), Number(offset));

  const result = await pool.query(query, params);
  res.json({ orders: result.rows });
});

// ─── GET /orders/:id ─── Order detail ────────────────────────────────────
router.get('/:id', async (req: AuthRequest, res) => {
  const { id } = req.params;
  const result = await pool.query(
    `SELECT o.*,
            json_agg(json_build_object(
              'id', oi.id, 'name', oi.name, 'quantity', oi.quantity,
              'price', oi.price, 'total', oi.total, 'image_url', oi.image_url
            )) AS items,
            d.current_lat AS driver_lat, d.current_lng AS driver_lng,
            du.name AS driver_name, d.phone AS driver_phone, d.vehicle_type
     FROM orders o
     LEFT JOIN order_items oi ON oi.order_id = o.id
     LEFT JOIN drivers d ON d.id = o.driver_id
     LEFT JOIN users du ON du.id = d.user_id
     WHERE o.id=$1
     GROUP BY o.id, d.current_lat, d.current_lng, du.name, d.phone, d.vehicle_type`,
    [id]
  );

  if (result.rows.length === 0) {
    res.status(404).json({ error: 'Order not found.' });
    return;
  }

  const order = result.rows[0];
  // SECURITY: Strict ownership check.
  // - Customer: must own the order.
  // - Driver: must be the assigned driver (no IDOR across all orders).
  // - Admin: unrestricted.
  const uid  = req.user!.id;
  const role = req.user!.role;

  if (role === 'driver') {
    // Fetch this driver's profile id and compare to order's assigned driver_id
    const driverRes = await pool.query(
      `SELECT id FROM drivers WHERE user_id=$1 LIMIT 1`, [uid]
    );
    const driverId = driverRes.rows[0]?.id;
    if (!driverId || order.driver_id !== driverId) {
      res.status(403).json({ error: 'Forbidden.' });
      return;
    }
  } else if (role !== 'admin' && Number(order.customer_id) !== uid) {
    res.status(403).json({ error: 'Forbidden.' });
    return;
  }

  // SECURITY: Strip metadata (contains delivery_otp) before sending to any client.
  // The delivery OTP was already returned at order creation time to the customer.
  const {
    metadata: _metadata,
    driver_lat, driver_lng, driver_name, driver_phone, vehicle_type,
    ...safeOrder
  } = order;

  res.json({
    order: {
      ...safeOrder,
      driver: driver_lat
        ? { lat: driver_lat, lng: driver_lng,
            name: driver_name, phone: driver_phone, vehicleType: vehicle_type }
        : null,
    },
  });
});

// ─── POST /orders/:id/cancel ─── Customer cancels ─────────────────────────
router.post('/:id/cancel', async (req: AuthRequest, res) => {
  const { id } = req.params;
  const result = await pool.query(
    `UPDATE orders
     SET status='cancelled', cancelled_at=NOW()
     WHERE id=$1 AND customer_id=$2 AND status IN ('placed','confirmed')
     RETURNING *`,
    [id, req.user!.id]
  );
  if (result.rows.length === 0) {
    res.status(400).json({ error: 'Cannot cancel this order.' });
    return;
  }

  const order = result.rows[0];
  io.to(`merchant:${order.store_id}`).emit('order_status_update', {
    orderId: order.id, status: 'cancelled',
  });
  io.to(`order:${id}`).emit('order:status', { status: 'cancelled' });
  io.to('admin').emit('order.platform.update', order);

  res.json({ order: result.rows[0] });
});

// ─── POST /orders/:id/rate ─── Rate order ────────────────────────────────
router.post('/:id/rate', async (req: AuthRequest, res) => {
  const { id } = req.params;
  // Accept both legacy {rating} and modern {foodRating, deliveryRating, comment, tags}
  const body = req.body as {
    rating?: number;
    foodRating?: number;
    deliveryRating?: number;
    review?: string;
    comment?: string;
    tags?: string[];
  };
  // Compute final rating: average of food+delivery if provided, else use legacy rating
  const rating =
    body.rating != null
      ? body.rating
      : Math.round(((body.foodRating ?? 0) + (body.deliveryRating ?? 0)) / 2);
  const review = body.comment ?? body.review ?? null;
  if (!rating || rating < 1 || rating > 5) {
    res.status(400).json({ error: 'Rating must be between 1 and 5.' });
    return;
  }

  const result = await pool.query(
    `UPDATE orders SET rating=$1, review=$2
     WHERE id=$3 AND customer_id=$4 AND status='delivered' AND rating IS NULL
     RETURNING store_id, driver_id`,
    [rating, review ?? null, id, req.user!.id]
  );
  if (result.rows.length === 0) {
    res.status(400).json({ error: 'Cannot rate this order.' });
    return;
  }

  // Update store avg rating
  const storeId = result.rows[0].store_id;
  await pool.query(
    `UPDATE stores
     SET total_ratings = total_ratings + 1,
         rating = (rating * total_ratings + $1) / (total_ratings + 1)
     WHERE id=$2`,
    [rating, storeId]
  );

  // Update driver avg rating (use deliveryRating if provided, else overall rating)
  const deliveryRating = body.deliveryRating ?? rating;
  const driverId = result.rows[0].driver_id;
  if (driverId) {
    await pool.query(
      `UPDATE drivers
       SET total_ratings = total_ratings + 1,
           rating = (rating * total_ratings + $1) / (total_ratings + 1)
       WHERE id=$2`,
      [deliveryRating, driverId]
    );
  }

  res.json({ message: 'Thank you for your review!' });
});

export default router;
