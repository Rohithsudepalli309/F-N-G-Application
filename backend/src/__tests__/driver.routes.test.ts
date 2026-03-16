import request from 'supertest';
import express from 'express';

// ── Mocks (hoisted by Jest above all imports) ─────────────────────────────────
// __esModule: true is required so TypeScript's esModuleInterop resolves
// `import pool from '../db'` as the `default` property, not the wrapper object.
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

import pool from '../db';
import driverRouter from '../routes/driver';

// Type-cast to jest.Mock after the module is resolved
const mockQuery   = pool.query   as jest.Mock;
const mockConnect = pool.connect as jest.Mock;

// Reusable transaction-client mock
const mockTxQuery  = jest.fn();
const mockRelease  = jest.fn();
const mockClient   = { query: mockTxQuery, release: mockRelease };

// Minimal Express app for integration testing
const app = express();
app.use(express.json());
// Inject fake driver user (requireAuth is mocked to just call next())
app.use((req: any, _res: any, next: any) => {
  req.user = { id: 99, role: 'driver' };
  next();
});
app.use('/', driverRouter);

// ── Reset all mocks to a clean default state before each test ─────────────────
function resetMocks() {
  mockQuery.mockReset().mockResolvedValue({ rows: [] });
  mockConnect.mockReset().mockResolvedValue(mockClient);
  mockTxQuery.mockReset().mockResolvedValue({ rows: [] });
  mockRelease.mockReset();
}

jest.mock('../services/fcm', () => ({
  sendPushToUser: jest.fn(),
}));

// ─── GET /orders ──────────────────────────────────────────────────────────────
describe('GET /orders', () => {
  beforeEach(resetMocks);

  it('returns 500 when database throws', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB down'));
    const res = await request(app).get('/orders');
    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/could not/i);
  });

  it('returns 404 when driver profile does not exist', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).get('/orders');
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });

  it('returns 200 with empty array when driver has no assigned orders', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 5 }] })   // driver row
      .mockResolvedValueOnce({ rows: [] });             // no orders
    const res = await request(app).get('/orders');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(0);
  });

  it('returns shaped order objects matching the Swift AssignedOrder model', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 5 }] })
      .mockResolvedValueOnce({
        rows: [{
          id: 101, store_id: 3, store_name: 'FNG Biryani', status: 'assigned',
          total_amount: 35000,
          delivery_address: { lat: 12.97, lng: 77.59, text: '123 Main St' },
          created_at: '2026-03-10T00:00:00Z', items_count: '2',
          store_lat: 12.96, store_lng: 77.58, store_address: 'Store Addr',
        }],
      });
    const res = await request(app).get('/orders');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    const o = res.body[0];
    expect(o.id).toBe(101);
    expect(o.storeName).toBe('FNG Biryani');
    expect(o.itemCount).toBe(2);
    expect(o.storeLat).toBe(12.96);
    expect(o.storeLng).toBe(77.58);
  });
});

// ─── POST /reject ─────────────────────────────────────────────────────────────
describe('POST /reject', () => {
  beforeEach(resetMocks);

  it('returns 200 immediately without touching the database', async () => {
    const res = await request(app).post('/reject').send({ orderId: '42' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockQuery).not.toHaveBeenCalled();
    expect(mockConnect).not.toHaveBeenCalled();
  });
});

// ─── POST /accept ─────────────────────────────────────────────────────────────
describe('POST /accept', () => {
  beforeEach(resetMocks);

  it('returns 400 when orderId is missing', async () => {
    const res = await request(app).post('/accept').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/orderId/i);
  });

  it('returns 404 when driver profile does not exist', async () => {
    mockTxQuery
      .mockResolvedValueOnce(undefined)    // BEGIN
      .mockResolvedValueOnce({ rows: [] }); // no driver row
    const res = await request(app).post('/accept').send({ orderId: '10' });
    expect(res.status).toBe(404);
    expect(mockRelease).toHaveBeenCalled();
  });

  it('returns 404 when order does not exist', async () => {
    mockTxQuery
      .mockResolvedValueOnce(undefined)              // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 5 }] }) // driver found (id=5)
      .mockResolvedValueOnce({ rows: [] });           // order not found
    const res = await request(app).post('/accept').send({ orderId: '999' });
    expect(res.status).toBe(404);
    expect(mockRelease).toHaveBeenCalled();
  });

  it('returns 409 when driver already has an active order', async () => {
    mockTxQuery
      .mockResolvedValueOnce(undefined)              // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 5 }] }) // driver
      .mockResolvedValueOnce({ rows: [{ id: 20, status: 'assigned', driver_id: 5, store_id: 1 }] }) // order
      .mockResolvedValueOnce({ rows: [{ id: 99 }] }); // active order already exists
    const res = await request(app).post('/accept').send({ orderId: '20' });
    expect(res.status).toBe(409);
    expect(mockRelease).toHaveBeenCalled();
  });

  it('returns 200 and commits on successful accept', async () => {
    mockTxQuery
      .mockResolvedValueOnce(undefined)              // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 5 }] }) // driver
      .mockResolvedValueOnce({ rows: [{ id: 10, status: 'assigned', driver_id: null, store_id: 3 }] }) // order
      .mockResolvedValueOnce({ rows: [] })           // no active order
      .mockResolvedValueOnce(undefined)              // UPDATE orders
      .mockResolvedValueOnce(undefined)              // UPDATE drivers
      .mockResolvedValueOnce(undefined);             // COMMIT
    const res = await request(app).post('/accept').send({ orderId: '10' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockRelease).toHaveBeenCalled();
  });

  it('returns 409 when order is not in an assignable status', async () => {
    mockTxQuery
      .mockResolvedValueOnce(undefined)              // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 5 }] }) // driver
      .mockResolvedValueOnce({ rows: [{ id: 10, status: 'delivered', driver_id: null, store_id: 3 }] }) // order in wrong status
      .mockResolvedValueOnce({ rows: [] });          // no active order
    const res = await request(app).post('/accept').send({ orderId: '10' });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/status/i);
    expect(mockRelease).toHaveBeenCalled();
  });

  it('returns 500 when transaction throws', async () => {
    mockTxQuery
      .mockResolvedValueOnce(undefined)              // BEGIN
      .mockRejectedValueOnce(new Error('TX error')); // driver query throws
    const res = await request(app).post('/accept').send({ orderId: '10' });
    expect(res.status).toBe(500);
    expect(mockRelease).toHaveBeenCalled();
  });
});

// ─── POST /pickup ─────────────────────────────────────────────────────────────
describe('POST /pickup', () => {
  beforeEach(resetMocks);

  it('returns 400 when orderId is missing', async () => {
    const res = await request(app).post('/pickup').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/orderId/i);
  });

  it('returns 404 when order does not exist', async () => {
    mockTxQuery
      .mockResolvedValueOnce(undefined)              // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 5 }] }) // driver found
      .mockResolvedValueOnce({ rows: [] });           // no order
    const res = await request(app).post('/pickup').send({ orderId: '5' });
    expect(res.status).toBe(404);
    expect(mockRelease).toHaveBeenCalled();
  });

  it('returns 200 and commits on successful pickup', async () => {
    mockTxQuery
      .mockResolvedValueOnce(undefined)              // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 5 }] }) // driver
      .mockResolvedValueOnce({ rows: [{ id: 5, status: 'assigned', driver_id: 5 }] }) // order
      .mockResolvedValueOnce(undefined)              // UPDATE orders
      .mockResolvedValueOnce(undefined);             // COMMIT
    const res = await request(app).post('/pickup').send({ orderId: '5' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockRelease).toHaveBeenCalled();
  });

  it('returns 403 when order is assigned to a different driver', async () => {
    mockTxQuery
      .mockResolvedValueOnce(undefined)              // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 5 }] }) // driver (id=5)
      .mockResolvedValueOnce({ rows: [{ id: 7, status: 'assigned', driver_id: 99 }] }); // order belongs to driver 99
    const res = await request(app).post('/pickup').send({ orderId: '7' });
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/not assigned to you/i);
    expect(mockRelease).toHaveBeenCalled();
  });

  it('returns 409 when order status does not allow pickup', async () => {
    mockTxQuery
      .mockResolvedValueOnce(undefined)              // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 5 }] }) // driver (id=5)
      .mockResolvedValueOnce({ rows: [{ id: 7, status: 'pending', driver_id: 5 }] }); // wrong status
    const res = await request(app).post('/pickup').send({ orderId: '7' });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/cannot mark pickup/i);
    expect(mockRelease).toHaveBeenCalled();
  });

  it('returns 500 when transaction throws', async () => {
    mockTxQuery
      .mockResolvedValueOnce(undefined)              // BEGIN
      .mockRejectedValueOnce(new Error('TX error'));
    const res = await request(app).post('/pickup').send({ orderId: '5' });
    expect(res.status).toBe(500);
    expect(mockRelease).toHaveBeenCalled();
  });
});

// ─── POST /complete ───────────────────────────────────────────────────────────
describe('POST /complete', () => {
  beforeEach(resetMocks);

  it('returns 400 when orderId or otp is missing', async () => {
    let res = await request(app).post('/complete').send({ orderId: '5' });
    expect(res.status).toBe(400);
    res = await request(app).post('/complete').send({ otp: '123456' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when OTP is not 6 digits', async () => {
    const res = await request(app).post('/complete').send({ orderId: '5', otp: 'abc' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/6 digits/i);
  });

  it('returns 400 when delivery OTP does not match', async () => {
    mockTxQuery
      .mockResolvedValueOnce(undefined)              // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 5 }] }) // driver (id=5)
      .mockResolvedValueOnce({ rows: [{ id: 10, status: 'out_for_delivery', driver_id: 5, customer_id: 1, delivery_otp: '999999' }] });
    const res = await request(app).post('/complete').send({ orderId: '10', otp: '123456' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid/i);
    expect(mockRelease).toHaveBeenCalled();
  });

  it('returns 200 and commits when OTP matches', async () => {
    mockTxQuery
      .mockResolvedValueOnce(undefined)              // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 5 }] }) // driver
      .mockResolvedValueOnce({ rows: [{ id: 10, status: 'out_for_delivery', driver_id: 5, customer_id: 1, delivery_otp: '123456' }] }) // order
      .mockResolvedValueOnce(undefined)              // UPDATE orders
      .mockResolvedValueOnce(undefined)              // UPDATE drivers
      .mockResolvedValueOnce(undefined);             // COMMIT
    const res = await request(app).post('/complete').send({ orderId: '10', otp: '123456' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockRelease).toHaveBeenCalled();
  });

  it('returns 403 when order belongs to a different driver', async () => {
    mockTxQuery
      .mockResolvedValueOnce(undefined)              // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 5 }] }) // driver (id=5)
      .mockResolvedValueOnce({ rows: [{ id: 10, status: 'out_for_delivery', driver_id: 99, customer_id: 1, delivery_otp: '123456' }] });
    const res = await request(app).post('/complete').send({ orderId: '10', otp: '123456' });
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/not assigned to you/i);
    expect(mockRelease).toHaveBeenCalled();
  });

  it('returns 409 when order is not out_for_delivery', async () => {
    mockTxQuery
      .mockResolvedValueOnce(undefined)              // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 5 }] }) // driver
      .mockResolvedValueOnce({ rows: [{ id: 10, status: 'assigned', driver_id: 5, customer_id: 1, delivery_otp: '123456' }] });
    const res = await request(app).post('/complete').send({ orderId: '10', otp: '123456' });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/out_for_delivery/i);
    expect(mockRelease).toHaveBeenCalled();
  });

  it('returns 200 when delivery_otp is null (skip check)', async () => {
    mockTxQuery
      .mockResolvedValueOnce(undefined)              // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 5 }] }) // driver
      .mockResolvedValueOnce({ rows: [{ id: 10, status: 'out_for_delivery', driver_id: 5, customer_id: 1, delivery_otp: null }] }) // no OTP set
      .mockResolvedValueOnce(undefined)              // UPDATE orders
      .mockResolvedValueOnce(undefined)              // UPDATE drivers
      .mockResolvedValueOnce(undefined);             // COMMIT
    const res = await request(app).post('/complete').send({ orderId: '10', otp: '999999' });
    expect(res.status).toBe(200);
    expect(mockRelease).toHaveBeenCalled();
  });

  it('returns 500 when transaction throws', async () => {
    mockTxQuery
      .mockResolvedValueOnce(undefined)              // BEGIN
      .mockRejectedValueOnce(new Error('TX error'));
    const res = await request(app).post('/complete').send({ orderId: '10', otp: '123456' });
    expect(res.status).toBe(500);
    expect(mockRelease).toHaveBeenCalled();
  });
});
