import request from 'supertest';
import express from 'express';

// ── Mocks ────────────────────────────────────────────────────────────────────
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
jest.mock('../redis', () => ({
  redis: {
    georadius: jest.fn().mockResolvedValue([]),
    geopos: jest.fn().mockResolvedValue([]),
  },
  DRIVER_GEO_KEY: 'driver:geo',
}));
jest.mock('../services/fcm', () => ({ sendPushToUser: jest.fn() }));

import pool from '../db';
import merchantRouter from '../routes/merchant';

const mockQuery = pool.query as jest.Mock;

// ── App ───────────────────────────────────────────────────────────────────────
// storeId on the user shortcut-checks getMerchantStore() for most tests;
// leave undefined to exercise the DB fallback path.
const app = express();
app.use(express.json());
app.use((req: any, _res: any, next: any) => {
  req.user = { id: 7, role: 'merchant' };
  next();
});
app.use('/', merchantRouter);

function reset() {
  mockQuery.mockReset().mockResolvedValue({ rows: [] });
}

// ─── GET /profile ─────────────────────────────────────────────────────────────
describe('GET /profile', () => {
  beforeEach(reset);

  it('returns 404 when merchant has no store', async () => {
    mockQuery.mockResolvedValue({ rows: [] }); // getMerchantStore → null
    const res = await request(app).get('/profile');
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/no store/i);
  });

  it('returns store data when store exists', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 3 }] })               // getMerchantStore
      .mockResolvedValueOnce({ rows: [{ id: 3, name: 'FNG Kitchen', email: 'm@fng.app' }] }); // SELECT
    const res = await request(app).get('/profile');
    expect(res.status).toBe(200);
    expect(res.body.store.name).toBe('FNG Kitchen');
  });
});

// ─── PATCH /profile ───────────────────────────────────────────────────────────
describe('PATCH /profile', () => {
  beforeEach(reset);

  it('returns 404 when merchant has no store', async () => {
    mockQuery.mockResolvedValue({ rows: [] });
    const res = await request(app).patch('/profile').send({ storeName: 'New Name' });
    expect(res.status).toBe(404);
  });

  it('updates and returns store', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 3 }] })
      .mockResolvedValueOnce({ rows: [{ id: 3, name: 'New Name' }] });
    const res = await request(app).patch('/profile').send({ storeName: 'New Name' });
    expect(res.status).toBe(200);
    expect(res.body.store.name).toBe('New Name');
  });
});

// ─── PATCH /store/toggle ──────────────────────────────────────────────────────
describe('PATCH /store/toggle', () => {
  beforeEach(reset);

  it('returns 404 when no store', async () => {
    mockQuery.mockResolvedValue({ rows: [] });
    const res = await request(app).patch('/store/toggle');
    expect(res.status).toBe(404);
  });

  it('toggles is_active and returns updated store', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 3 }] })
      .mockResolvedValueOnce({ rows: [{ id: 3, name: 'FNG Kitchen', is_active: false }] });
    const res = await request(app).patch('/store/toggle');
    expect(res.status).toBe(200);
    expect(res.body.store.is_active).toBe(false);
  });
});

// ─── GET /orders ──────────────────────────────────────────────────────────────
describe('GET /orders', () => {
  beforeEach(reset);

  it('returns 404 when no store', async () => {
    mockQuery.mockResolvedValue({ rows: [] });
    const res = await request(app).get('/orders');
    expect(res.status).toBe(404);
  });

  it('returns orders for merchant store', async () => {
    const fakeOrder = { id: 1, order_number: 'ORD001', status: 'placed', items: [] };
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 3 }] })
      .mockResolvedValueOnce({ rows: [fakeOrder] });
    const res = await request(app).get('/orders');
    expect(res.status).toBe(200);
    expect(res.body.orders).toHaveLength(1);
    expect(res.body.orders[0].order_number).toBe('ORD001');
  });

  it('passes status filter to query', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 3 }] })
      .mockResolvedValueOnce({ rows: [] });
    const res = await request(app).get('/orders?status=preparing');
    expect(res.status).toBe(200);
    // Second call should include 'preparing' in the params
    const callParams = mockQuery.mock.calls[1][1] as unknown[];
    expect(callParams).toContain('preparing');
  });
});

// ─── PATCH /orders/:id/status ─────────────────────────────────────────────────
describe('PATCH /orders/:id/status', () => {
  beforeEach(reset);

  it('returns 404 when no store', async () => {
    mockQuery.mockResolvedValue({ rows: [] });
    const res = await request(app).patch('/orders/1/status').send({ action: 'accept' });
    expect(res.status).toBe(404);
  });

  it('returns 400 for invalid action', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 3 }] });
    const res = await request(app).patch('/orders/1/status').send({ action: 'invalid' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid action/i);
  });

  it('returns 404 when order does not belong to store', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 3 }] })
      .mockResolvedValueOnce({ rows: [] }); // UPDATE returns nothing
    const res = await request(app).patch('/orders/99/status').send({ action: 'accept' });
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });

  it('accepts an order and emits socket events', async () => {
    const updatedOrder = { id: 1, status: 'preparing', store_id: 3 };
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 3 }] })
      .mockResolvedValueOnce({ rows: [updatedOrder] });
    const res = await request(app).patch('/orders/1/status').send({ action: 'accept' });
    expect(res.status).toBe(200);
    expect(res.body.order.status).toBe('preparing');
  });

  it('marks order ready and triggers driver assignment (fire-and-forget)', async () => {
    const updatedOrder = {
      id: 2, status: 'ready', store_id: 3,
      delivery_address: { lat: 12, lng: 77 },
      total_amount: 200,
    };
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 3 }] })     // getMerchantStore
      .mockResolvedValueOnce({ rows: [updatedOrder] })    // UPDATE order
      .mockResolvedValue({ rows: [] });                   // assignNearestDriver queries
    const res = await request(app).patch('/orders/2/status').send({ action: 'ready' });
    expect(res.status).toBe(200);
    expect(res.body.order.status).toBe('ready');
  });
});

// ─── GET /menu ────────────────────────────────────────────────────────────────
describe('GET /menu', () => {
  beforeEach(reset);

  it('returns 404 when no store', async () => {
    mockQuery.mockResolvedValue({ rows: [] });
    const res = await request(app).get('/menu');
    expect(res.status).toBe(404);
  });

  it('returns product list', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 3 }] })
      .mockResolvedValueOnce({ rows: [{ id: 10, name: 'Pizza', price: 199 }] });
    const res = await request(app).get('/menu');
    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(1);
    expect(res.body.products[0].name).toBe('Pizza');
  });
});

// ─── POST /products ───────────────────────────────────────────────────────────
describe('POST /products', () => {
  beforeEach(reset);

  it('returns 404 when no store', async () => {
    mockQuery.mockResolvedValue({ rows: [] });
    const res = await request(app).post('/products').send({ name: 'Burger', price: 149 });
    expect(res.status).toBe(404);
  });

  it('returns 400 when name or price is missing', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 3 }] });
    const res = await request(app).post('/products').send({ name: 'Burger' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/name and price/i);
  });

  it('creates and returns new product', async () => {
    const newProduct = { id: 20, name: 'Burger', price: 149, store_id: 3 };
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 3 }] })
      .mockResolvedValueOnce({ rows: [newProduct] });
    const res = await request(app).post('/products').send({ name: 'Burger', price: 149 });
    expect(res.status).toBe(201);
    expect(res.body.product.name).toBe('Burger');
  });
});

// ─── PUT /products/:id ────────────────────────────────────────────────────────
describe('PUT /products/:id', () => {
  beforeEach(reset);

  it('returns 404 when no store', async () => {
    mockQuery.mockResolvedValue({ rows: [] });
    const res = await request(app).put('/products/10').send({ price: 199 });
    expect(res.status).toBe(404);
  });

  it('returns 404 when product belongs to a different store', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 3 }] })
      .mockResolvedValueOnce({ rows: [] }); // UPDATE returns nothing
    const res = await request(app).put('/products/10').send({ price: 199 });
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });

  it('updates and returns product', async () => {
    const updated = { id: 10, name: 'Pizza', price: 199 };
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 3 }] })
      .mockResolvedValueOnce({ rows: [updated] });
    const res = await request(app).put('/products/10').send({ price: 199 });
    expect(res.status).toBe(200);
    expect(res.body.product.price).toBe(199);
  });
});

// ─── DELETE /products/:id ─────────────────────────────────────────────────────
describe('DELETE /products/:id', () => {
  beforeEach(reset);

  it('returns 404 when no store', async () => {
    mockQuery.mockResolvedValue({ rows: [] });
    const res = await request(app).delete('/products/10');
    expect(res.status).toBe(404);
  });

  it('deletes and confirms with message', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 3 }] })
      .mockResolvedValueOnce({ rows: [] }); // DELETE
    const res = await request(app).delete('/products/10');
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);
  });
});

// ─── PATCH /products/:id/toggle ───────────────────────────────────────────────
describe('PATCH /products/:id/toggle', () => {
  beforeEach(reset);

  it('returns 404 when product not found', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 3 }] })
      .mockResolvedValueOnce({ rows: [] });
    const res = await request(app).patch('/products/99/toggle');
    expect(res.status).toBe(404);
  });

  it('toggles availability and returns updated product', async () => {
    const toggled = { id: 10, name: 'Pizza', is_available: false };
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 3 }] })
      .mockResolvedValueOnce({ rows: [toggled] });
    const res = await request(app).patch('/products/10/toggle');
    expect(res.status).toBe(200);
    expect(res.body.product.is_available).toBe(false);
  });
});

// ─── GET /analytics ───────────────────────────────────────────────────────────
describe('GET /analytics', () => {
  beforeEach(reset);

  it('returns 404 when no store', async () => {
    mockQuery.mockResolvedValue({ rows: [] });
    const res = await request(app).get('/analytics');
    expect(res.status).toBe(404);
  });

  it('returns analytics for default (week) period', async () => {
    const kpi = { ordersToday: '5', revenueToday: '2000', pendingOrders: '2' };
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 3 }] }) // getMerchantStore
      .mockResolvedValueOnce({ rows: [kpi] })        // kpiRes
      .mockResolvedValueOnce({ rows: [] })            // chartRes
      .mockResolvedValueOnce({ rows: [] })            // topRes
      .mockResolvedValueOnce({ rows: [{ rating: 4.5 }] }); // storeRes
    const res = await request(app).get('/analytics');
    expect(res.status).toBe(200);
    expect(res.body.ordersToday).toBe(5);
    expect(res.body.revenueToday).toBe(2000);
    expect(res.body.pendingOrders).toBe(2);
    expect(res.body.avgRating).toBe(4.5);
  });

  it('accepts month period parameter', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 3 }] })
      .mockResolvedValue({ rows: [{ ordersToday: '0', revenueToday: '0', pendingOrders: '0' }] });
    const res = await request(app).get('/analytics?period=month');
    expect(res.status).toBe(200);
  });
});
