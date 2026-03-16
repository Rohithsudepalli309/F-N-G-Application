import request from 'supertest';
import express from 'express';

// ── Mocks ─────────────────────────────────────────────────────────────────────
jest.mock('../db', () => ({
  __esModule: true,
  default: { query: jest.fn(), connect: jest.fn() },
}));
jest.mock('../server', () => ({
  io: { to: jest.fn().mockReturnValue({ emit: jest.fn() }) },
}));
jest.mock('../middleware/auth', () => ({
  requireAuth: (_req: any, _res: any, next: any) => next(),
  requireRole: () => (_req: any, _res: any, next: any) => next(),
}));
jest.mock('../services/fcm', () => ({ sendPushToUser: jest.fn() }));
jest.mock('../services/surge', () => ({
  recordDemand: jest.fn().mockResolvedValue(undefined),
  getSurgeMultiplier: jest.fn().mockResolvedValue(1),
}));
jest.mock('../services/loyaltyEngine', () => ({
  calculateLoyaltyBenefits: jest.fn().mockResolvedValue({
    autoDiscount: 0,
    deliveryFeeOverride: null,
  }),
}));
jest.mock('../redis', () => ({
  redis: { geopos: jest.fn(), georadius: jest.fn() },
  DRIVER_GEO_KEY: 'driver:geo',
}));

import pool from '../db';
import ordersRouter from '../routes/orders';

const mockQuery   = pool.query   as jest.Mock;
const mockConnect = pool.connect as jest.Mock;

const mockTxQuery  = jest.fn();
const mockRelease  = jest.fn();
const mockClient   = { query: mockTxQuery, release: mockRelease };

const app = express();
app.use(express.json());
app.use((req: any, _res: any, next: any) => {
  req.user = { id: 1, role: 'customer' };
  next();
});
app.use('/', ordersRouter);

function resetMocks() {
  mockQuery.mockReset().mockResolvedValue({ rows: [] });
  mockConnect.mockReset().mockResolvedValue(mockClient);
  mockTxQuery.mockReset().mockResolvedValue({ rows: [] });
  mockRelease.mockReset();
}

// ─── POST / (place order) ─────────────────────────────────────────────────────
describe('POST / (place order)', () => {
  beforeEach(resetMocks);

  it('returns 400 when items is empty', async () => {
    const res = await request(app).post('/').send({
      storeId: 1,
      items: [],
      deliveryAddress: { label: 'Home', address_line: '1 Main', city: 'Bangalore', pincode: '560001' },
    });
    expect(res.status).toBe(400);
    expect((res.body.error ?? res.body.message ?? '')).toMatch(/items/i);
  });

  it('returns 400 when deliveryAddress is missing', async () => {
    const res = await request(app).post('/').send({
      storeId: 1,
      items: [{ productId: 1, quantity: 1 }],
    });
    expect(res.status).toBe(400);
    expect((res.body.error ?? res.body.message ?? '')).toMatch(/deliveryAddress/i);
  });

  it('returns 400 when a product is not found', async () => {
    mockTxQuery
      .mockResolvedValueOnce(undefined)   // BEGIN
      .mockResolvedValueOnce({ rows: [] }); // product lookup returns nothing
    const res = await request(app).post('/').send({
      storeId: 1,
      items: [{ productId: 999, quantity: 1 }],
      deliveryAddress: { label: 'Home', address_line: '1 Main', city: 'B', pincode: '560001' },
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/not found/i);
  });

  it('returns 400 when product belongs to a different store', async () => {
    mockTxQuery
      .mockResolvedValueOnce(undefined)   // BEGIN
      .mockResolvedValueOnce({            // products query returns a product from store 2
        rows: [{ id: 1, store_id: 2, name: 'Burger', price: 10000, image_url: null, is_available: true, stock: 10 }],
      });
    const res = await request(app).post('/').send({
      storeId: 1,
      items: [{ productId: 1, quantity: 1 }],
      deliveryAddress: { label: 'Home', address_line: '1 Main', city: 'B', pincode: '560001' },
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/same store/i);
  });

  it('returns 400 when product is not available', async () => {
    mockTxQuery
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({
        rows: [{ id: 1, store_id: 1, name: 'Burger', price: 10000, image_url: null, is_available: false, stock: 0 }],
      });
    const res = await request(app).post('/').send({
      storeId: 1,
      items: [{ productId: 1, quantity: 1 }],
      deliveryAddress: { label: 'Home', address_line: '1 Main', city: 'B', pincode: '560001' },
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/not available/i);
  });

  it('returns 400 when coupon code is invalid', async () => {
    mockTxQuery
      .mockResolvedValueOnce(undefined)   // BEGIN
      .mockResolvedValueOnce({            // products
        rows: [{ id: 1, store_id: 1, name: 'Burger', price: 10000, is_available: true, stock: 5 }],
      })
      .mockResolvedValueOnce({ rows: [] }); // coupon not found
    const res = await request(app).post('/').send({
      storeId: 1,
      items: [{ productId: 1, quantity: 1 }],
      deliveryAddress: { label: 'Home', address_line: '1 Main', city: 'B', pincode: '560001' },
      couponCode: 'BADCOUP',
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/coupon/i);
  });

  it('returns 201 with order details on success (no coupon)', async () => {
    mockTxQuery
      .mockResolvedValueOnce(undefined)   // BEGIN
      .mockResolvedValueOnce({            // products
        rows: [{ id: 1, store_id: 1, name: 'Burger', price: 10000, image_url: null, is_available: true, stock: 5 }],
      })
      .mockResolvedValueOnce({ rows: [{ name: 'FNG Eats' }] }) // store name
      .mockResolvedValueOnce({ rows: [{ id: 50, order_number: 'FNG-TEST-123', total_amount: 13000, status: 'placed', payment_method: 'cod' }] }) // INSERT order
      .mockResolvedValueOnce(undefined)   // INSERT order_item
      .mockResolvedValueOnce(undefined);  // COMMIT
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 50, order_number: 'FNG-TEST-123', total_amount: 13000, store_id: 1 }] }); // post-commit select

    const res = await request(app).post('/').send({
      storeId: 1,
      items: [{ productId: 1, quantity: 1 }],
      deliveryAddress: { label: 'Home', address_line: '1 Main', city: 'B', pincode: '560001' },
    });
    expect(res.status).toBe(201);
    expect(res.body.order.orderNumber).toBe('FNG-TEST-123');
    expect(res.body.order.deliveryOtp).toBeDefined();
  });

  it('returns 500 on database error', async () => {
    mockTxQuery
      .mockResolvedValueOnce(undefined)   // BEGIN
      .mockRejectedValueOnce(new Error('DB down'));
    const res = await request(app).post('/').send({
      storeId: 1,
      items: [{ productId: 1, quantity: 1 }],
      deliveryAddress: { label: 'Home', address_line: '1 Main', city: 'B', pincode: '560001' },
    });
    expect(res.status).toBe(500);
    expect(mockRelease).toHaveBeenCalled();
  });
});

// ─── GET / (order history) ────────────────────────────────────────────────────
describe('GET / (order history)', () => {
  beforeEach(resetMocks);

  it('returns 200 with orders array', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, order_number: 'FNG-001', status: 'delivered' }] });
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.orders)).toBe(true);
    expect(res.body.orders).toHaveLength(1);
  });

  it('passes status filter when provided', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    await request(app).get('/?status=delivered');
    const callArgs = mockQuery.mock.calls[0];
    expect(callArgs[0]).toContain('status');
    expect(callArgs[1]).toContain('delivered');
  });
});

// ─── GET /:id (order detail) ──────────────────────────────────────────────────
describe('GET /:id', () => {
  beforeEach(resetMocks);

  it('returns 404 when order does not exist', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).get('/999');
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });

  it('returns 200 with order detail for the placing customer', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{
        id: 1, customer_id: 1, store_name: 'FNG', status: 'delivered',
        driver_lat: null, driver_lng: null, driver_name: null,
      }],
    });
    const res = await request(app).get('/1');
    expect(res.status).toBe(200);
    expect(res.body.order.id).toBe(1);
    expect(res.body.order.driver).toBeNull();
  });

  it('returns 200 with driver coords when driver is live', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{
        id: 2, customer_id: 1, status: 'out_for_delivery',
        driver_lat: 12.97, driver_lng: 77.59, driver_name: 'Ravi', driver_phone: '9000000000',
      }],
    });
    const res = await request(app).get('/2');
    expect(res.status).toBe(200);
    expect(res.body.order.driver).toMatchObject({ lat: 12.97, lng: 77.59, name: 'Ravi' });
  });
});

// ─── POST /:id/cancel ─────────────────────────────────────────────────────────
describe('POST /:id/cancel', () => {
  beforeEach(resetMocks);

  it('returns 400 when order cannot be cancelled', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).post('/5/cancel');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/cannot cancel/i);
  });

  it('returns 200 and emits socket events on success', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 5, store_id: 1 }] });
    const res = await request(app).post('/5/cancel');
    expect(res.status).toBe(200);
    expect(res.body.order.id).toBe(5);
  });
});

// ─── POST /:id/rate ───────────────────────────────────────────────────────────
describe('POST /:id/rate', () => {
  beforeEach(resetMocks);

  it('returns 400 when rating is missing', async () => {
    const res = await request(app).post('/5/rate').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/rating/i);
  });

  it('returns 400 when rating is out of range', async () => {
    let res = await request(app).post('/5/rate').send({ rating: 0 });
    expect(res.status).toBe(400);
    res = await request(app).post('/5/rate').send({ rating: 6 });
    expect(res.status).toBe(400);
  });

  it('returns 400 when order cannot be rated (already rated / wrong status)', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).post('/5/rate').send({ rating: 5 });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/cannot rate/i);
  });

  it('returns 200 and updates store rating on success', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ store_id: 3 }] }) // UPDATE orders RETURNING
      .mockResolvedValueOnce({ rows: [] });               // UPDATE stores
    const res = await request(app).post('/5/rate').send({ rating: 4, review: 'Great!' });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/thank you/i);
  });
});
