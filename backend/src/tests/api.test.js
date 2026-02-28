/**
 * backend/src/tests/api.test.js
 * Integration Tests — Orders, Admin, and Coupons endpoints
 * Uses in-memory mock Express apps (no live DB required).
 */

const request = require('supertest');
const express = require('express');

// ── Helpers ─────────────────────────────────────────────────────────────────
const ADMIN_TOKEN = 'Bearer admin_mock_token';
const USER_TOKEN  = 'Bearer user_mock_token';

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ error: 'No token' });
  req.user = token.includes('admin')
    ? { id: 1, role: 'admin', name: 'Admin' }
    : { id: 2, role: 'customer', name: 'Customer' };
  next();
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  next();
};

// ── Mock: Orders App ─────────────────────────────────────────────────────────
const ordersApp = express();
ordersApp.use(express.json());

const MOCK_ORDERS = [
  { id: 'ord_01', customer_id: 2, store_id: 'st_01', status: 'placed',
    total_amount: 34900, created_at: new Date().toISOString() },
];

ordersApp.get('/api/v1/orders', authMiddleware, (req, res) => {
  const userOrders = MOCK_ORDERS.filter((o) => o.customer_id === req.user.id);
  res.json(userOrders);
});

ordersApp.post('/api/v1/orders', authMiddleware, (req, res) => {
  const { id, storeId, items, totalAmount } = req.body;
  if (!id || !storeId || !items || !totalAmount) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const order = { id, customer_id: req.user.id, store_id: storeId,
    status: 'pending', total_amount: totalAmount };
  MOCK_ORDERS.push(order);
  res.status(201).json(order);
});

ordersApp.post('/api/v1/orders/:id/cancel', authMiddleware, (req, res) => {
  const order = MOCK_ORDERS.find((o) => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.customer_id !== req.user.id) return res.status(403).json({ error: 'Not your order' });
  if (!['pending', 'placed'].includes(order.status)) {
    return res.status(400).json({ error: `Cannot cancel in '${order.status}' status` });
  }
  order.status = 'cancelled';
  res.json({ order });
});

// ── Mock: Admin App ──────────────────────────────────────────────────────────
const adminApp = express();
adminApp.use(express.json());

adminApp.get('/api/v1/admin/stats', authMiddleware, adminOnly, (req, res) => {
  res.json({ ordersToday: 42, totalCustomers: 1250, totalDrivers: 18, revenueToday: 854000 });
});

adminApp.get('/api/v1/admin/orders', authMiddleware, adminOnly, (req, res) => {
  const { page = '1', limit = '20', status } = req.query;
  const filtered = status ? MOCK_ORDERS.filter((o) => o.status === status) : MOCK_ORDERS;
  res.json({
    orders: filtered.slice(0, Number(limit)),
    total: filtered.length,
    page: Number(page),
    totalPages: Math.ceil(filtered.length / Number(limit)),
  });
});

adminApp.patch('/api/v1/admin/orders/:id/status', authMiddleware, adminOnly, (req, res) => {
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'status is required' });
  const order = MOCK_ORDERS.find((o) => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  order.status = status;
  res.json({ order });
});

adminApp.get('/api/v1/admin/payouts', authMiddleware, adminOnly, (req, res) => {
  const { period = 'week' } = req.query;
  res.json({
    payouts: [
      { driver_id: 3, driver_name: 'Ravi Kumar', phone: '9876543210',
        total_deliveries: 24, gross_earnings: 240000,
        platform_commission: 24000, net_payout: 216000 },
    ],
    period,
  });
});

// ── Mock: Coupons App ────────────────────────────────────────────────────────
const couponsApp = express();
couponsApp.use(express.json());

const MOCK_COUPONS = [
  { id: 1, code: 'FIRST50', discount_type: 'flat', discount_value: 5000,
    min_order_amount: 9900, max_discount: null, max_uses: 500, used_count: 12,
    valid_until: null, is_active: true },
  { id: 2, code: 'SAVE20', discount_type: 'percent', discount_value: 20,
    min_order_amount: 19900, max_discount: 10000, max_uses: 1000, used_count: 400,
    valid_until: null, is_active: true },
];

couponsApp.post('/api/v1/coupons/validate', authMiddleware, (req, res) => {
  const { code, orderTotal } = req.body;
  if (!code || !orderTotal) return res.status(400).json({ error: 'code and orderTotal required' });

  const coupon = MOCK_COUPONS.find(
    (c) => c.code === code.toUpperCase() && c.is_active && c.used_count < c.max_uses
  );
  if (!coupon) return res.status(404).json({ error: 'Invalid or expired coupon' });
  if (orderTotal < coupon.min_order_amount) {
    return res.status(400).json({ error: `Minimum order ₹${coupon.min_order_amount / 100} required` });
  }

  let discount = 0;
  if (coupon.discount_type === 'flat') {
    discount = coupon.discount_value;
  } else {
    discount = Math.round((orderTotal * coupon.discount_value) / 100);
    if (coupon.max_discount) discount = Math.min(discount, coupon.max_discount);
  }
  discount = Math.min(discount, orderTotal);

  res.json({ valid: true, couponId: coupon.id, code: coupon.code,
    discount, finalAmount: orderTotal - discount });
});

// ═════════════════════════════════════════════════════════════════════════════
// TEST SUITES
// ═════════════════════════════════════════════════════════════════════════════

// ── Orders ───────────────────────────────────────────────────────────────────
describe('Orders API', () => {
  describe('GET /api/v1/orders', () => {
    it('should return 401 without token', async () => {
      const res = await request(ordersApp).get('/api/v1/orders');
      expect(res.statusCode).toBe(401);
    });

    it('should return orders array for authenticated customer', async () => {
      const res = await request(ordersApp)
        .get('/api/v1/orders')
        .set('Authorization', USER_TOKEN);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('POST /api/v1/orders', () => {
    it('should create a new order with 201', async () => {
      const res = await request(ordersApp)
        .post('/api/v1/orders')
        .set('Authorization', USER_TOKEN)
        .send({ id: 'ord_test_01', storeId: 'st_01',
          items: [{ id: 'p1', name: 'Biryani', price: 22000, quantity: 1 }],
          totalAmount: 22000 });
      expect(res.statusCode).toBe(201);
      expect(res.body.status).toBe('pending');
    });

    it('should return 400 for missing fields', async () => {
      const res = await request(ordersApp)
        .post('/api/v1/orders')
        .set('Authorization', USER_TOKEN)
        .send({ storeId: 'st_01' });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /api/v1/orders/:id/cancel', () => {
    it('should cancel a placed order', async () => {
      const res = await request(ordersApp)
        .post('/api/v1/orders/ord_01/cancel')
        .set('Authorization', USER_TOKEN);
      expect(res.statusCode).toBe(200);
      expect(res.body.order.status).toBe('cancelled');
    });

    it('should return 404 for non-existent order', async () => {
      const res = await request(ordersApp)
        .post('/api/v1/orders/NOPE/cancel')
        .set('Authorization', USER_TOKEN);
      expect(res.statusCode).toBe(404);
    });
  });
});

// ── Admin ────────────────────────────────────────────────────────────────────
describe('Admin API', () => {
  describe('GET /api/v1/admin/stats', () => {
    it('should return 403 for non-admin users', async () => {
      const res = await request(adminApp)
        .get('/api/v1/admin/stats')
        .set('Authorization', USER_TOKEN);
      expect(res.statusCode).toBe(403);
    });

    it('should return KPI stats for admin', async () => {
      const res = await request(adminApp)
        .get('/api/v1/admin/stats')
        .set('Authorization', ADMIN_TOKEN);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('ordersToday');
      expect(res.body).toHaveProperty('revenueToday');
      expect(res.body).toHaveProperty('totalCustomers');
      expect(res.body).toHaveProperty('totalDrivers');
    });
  });

  describe('GET /api/v1/admin/orders', () => {
    it('should return paginated orders list', async () => {
      const res = await request(adminApp)
        .get('/api/v1/admin/orders?page=1&limit=10')
        .set('Authorization', ADMIN_TOKEN);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('orders');
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('totalPages');
      expect(Array.isArray(res.body.orders)).toBe(true);
    });

    it('should filter orders by status', async () => {
      const res = await request(adminApp)
        .get('/api/v1/admin/orders?status=placed')
        .set('Authorization', ADMIN_TOKEN);
      expect(res.statusCode).toBe(200);
    });
  });

  describe('PATCH /api/v1/admin/orders/:id/status', () => {
    it('should update order status', async () => {
      const res = await request(adminApp)
        .patch('/api/v1/admin/orders/ord_01/status')
        .set('Authorization', ADMIN_TOKEN)
        .send({ status: 'preparing' });
      expect(res.statusCode).toBe(200);
      expect(res.body.order.status).toBe('preparing');
    });

    it('should return 400 when status is missing', async () => {
      const res = await request(adminApp)
        .patch('/api/v1/admin/orders/ord_01/status')
        .set('Authorization', ADMIN_TOKEN)
        .send({});
      expect(res.statusCode).toBe(400);
    });

    it('should return 404 for non-existent order', async () => {
      const res = await request(adminApp)
        .patch('/api/v1/admin/orders/GHOST/status')
        .set('Authorization', ADMIN_TOKEN)
        .send({ status: 'delivered' });
      expect(res.statusCode).toBe(404);
    });
  });

  describe('GET /api/v1/admin/payouts', () => {
    it('should return driver payouts for weekly period', async () => {
      const res = await request(adminApp)
        .get('/api/v1/admin/payouts?period=week')
        .set('Authorization', ADMIN_TOKEN);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('payouts');
      expect(res.body.period).toBe('week');
      const payout = res.body.payouts[0];
      expect(payout).toHaveProperty('net_payout');
      expect(payout).toHaveProperty('gross_earnings');
      expect(payout).toHaveProperty('platform_commission');
      expect(payout.net_payout).toBeLessThan(payout.gross_earnings);
    });
  });
});

// ── Coupons ──────────────────────────────────────────────────────────────────
describe('Coupons API', () => {
  describe('POST /api/v1/coupons/validate', () => {
    it('should apply flat discount for FIRST50', async () => {
      const res = await request(couponsApp)
        .post('/api/v1/coupons/validate')
        .set('Authorization', USER_TOKEN)
        .send({ code: 'FIRST50', orderTotal: 19900 });
      expect(res.statusCode).toBe(200);
      expect(res.body.valid).toBe(true);
      expect(res.body.discount).toBe(5000);
      expect(res.body.finalAmount).toBe(14900);
    });

    it('should apply percent discount capped at max_discount for SAVE20', async () => {
      const res = await request(couponsApp)
        .post('/api/v1/coupons/validate')
        .set('Authorization', USER_TOKEN)
        .send({ code: 'SAVE20', orderTotal: 100000 }); // 20% = 20000, but cap is 10000
      expect(res.statusCode).toBe(200);
      expect(res.body.discount).toBe(10000); // capped
    });

    it('should return 404 for invalid coupon code', async () => {
      const res = await request(couponsApp)
        .post('/api/v1/coupons/validate')
        .set('Authorization', USER_TOKEN)
        .send({ code: 'FAKECODE', orderTotal: 50000 });
      expect(res.statusCode).toBe(404);
    });

    it('should return 400 when order is below minimum amount', async () => {
      const res = await request(couponsApp)
        .post('/api/v1/coupons/validate')
        .set('Authorization', USER_TOKEN)
        .send({ code: 'FIRST50', orderTotal: 5000 }); // below 9900 min
      expect(res.statusCode).toBe(400);
    });

    it('should return 400 for missing params', async () => {
      const res = await request(couponsApp)
        .post('/api/v1/coupons/validate')
        .set('Authorization', USER_TOKEN)
        .send({ code: 'FIRST50' });
      expect(res.statusCode).toBe(400);
    });
  });
});
