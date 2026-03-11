import request from 'supertest';
import express from 'express';

// ── Mocks ────────────────────────────────────────────────────────────────────
jest.mock('../db', () => ({
  __esModule: true,
  default: { query: jest.fn(), connect: jest.fn() },
}));
jest.mock('../middleware/auth', () => ({
  requireAuth: (_req: any, _res: any, next: any) => next(),
  requireRole: () => (_req: any, _res: any, next: any) => next(),
}));

import pool from '../db';
import storesRouter from '../routes/stores';

const mockQuery = pool.query as jest.Mock;

// ── App ───────────────────────────────────────────────────────────────────────
const app = express();
app.use(express.json());
app.use((req: any, _res: any, next: any) => {
  req.user = { id: 5, role: 'customer' };
  next();
});
app.use('/', storesRouter);

function reset() {
  mockQuery.mockReset().mockResolvedValue({ rows: [] });
}

// ─── GET / ────────────────────────────────────────────────────────────────────
describe('GET / (list stores)', () => {
  beforeEach(reset);

  it('returns empty array when no stores exist', async () => {
    mockQuery.mockResolvedValue({ rows: [] });
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.stores).toEqual([]);
  });

  it('returns list of active stores', async () => {
    const fakeStores = [
      { id: 1, name: 'FNG Kitchen', store_type: 'restaurant', is_active: true },
      { id: 2, name: 'FNG Mart',    store_type: 'grocery',    is_active: true },
    ];
    mockQuery.mockResolvedValue({ rows: fakeStores });
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.stores).toHaveLength(2);
  });

  it('appends type filter to query when provided', async () => {
    mockQuery.mockResolvedValue({ rows: [] });
    await request(app).get('/?type=restaurant');
    const params = mockQuery.mock.calls[0][1] as unknown[];
    expect(params).toContain('restaurant');
  });

  it('appends search filter to query when provided', async () => {
    mockQuery.mockResolvedValue({ rows: [] });
    await request(app).get('/?search=kitchen');
    const params = mockQuery.mock.calls[0][1] as unknown[];
    expect(params).toContain('%kitchen%');
  });

  it('respects limit and offset query params', async () => {
    mockQuery.mockResolvedValue({ rows: [] });
    await request(app).get('/?limit=5&offset=10');
    const params = mockQuery.mock.calls[0][1] as unknown[];
    expect(params).toContain(5);
    expect(params).toContain(10);
  });
});

// ─── GET /:storeId ────────────────────────────────────────────────────────────
describe('GET /:storeId', () => {
  beforeEach(reset);

  it('returns 404 when store does not exist', async () => {
    mockQuery.mockResolvedValue({ rows: [] });
    const res = await request(app).get('/999');
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });

  it('returns store detail', async () => {
    const fakeStore = { id: 1, name: 'FNG Kitchen', store_type: 'restaurant' };
    mockQuery.mockResolvedValue({ rows: [fakeStore] });
    const res = await request(app).get('/1');
    expect(res.status).toBe(200);
    expect(res.body.store.name).toBe('FNG Kitchen');
  });
});

// ─── GET /:storeId/products ───────────────────────────────────────────────────
describe('GET /:storeId/products', () => {
  beforeEach(reset);

  it('returns product list for a store', async () => {
    const products = [
      { id: 10, name: 'Paneer Pizza', price: 249, is_available: true },
      { id: 11, name: 'Margherita',   price: 199, is_available: true },
    ];
    mockQuery.mockResolvedValue({ rows: products });
    const res = await request(app).get('/1/products');
    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(2);
  });

  it('returns empty array when store has no products', async () => {
    mockQuery.mockResolvedValue({ rows: [] });
    const res = await request(app).get('/1/products');
    expect(res.status).toBe(200);
    expect(res.body.products).toEqual([]);
  });

  it('filters by category when provided', async () => {
    mockQuery.mockResolvedValue({ rows: [] });
    await request(app).get('/1/products?category=Pizza');
    const params = mockQuery.mock.calls[0][1] as unknown[];
    expect(params).toContain('Pizza');
  });

  it('filters by search when provided', async () => {
    mockQuery.mockResolvedValue({ rows: [] });
    await request(app).get('/1/products?search=paneer');
    const params = mockQuery.mock.calls[0][1] as unknown[];
    expect(params).toContain('%paneer%');
  });
});

// ─── GET /:storeId/products/:productId ───────────────────────────────────────
describe('GET /:storeId/products/:productId', () => {
  beforeEach(reset);

  it('returns 404 when product does not exist', async () => {
    mockQuery.mockResolvedValue({ rows: [] });
    const res = await request(app).get('/1/products/999');
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });

  it('returns product detail', async () => {
    const product = { id: 10, name: 'Paneer Pizza', price: 249 };
    mockQuery.mockResolvedValue({ rows: [product] });
    const res = await request(app).get('/1/products/10');
    expect(res.status).toBe(200);
    expect(res.body.product.name).toBe('Paneer Pizza');
  });
});

// ─── GET /:storeId/categories ─────────────────────────────────────────────────
describe('GET /:storeId/categories', () => {
  beforeEach(reset);

  it('returns unique category list', async () => {
    mockQuery.mockResolvedValue({
      rows: [{ category: 'Pizza' }, { category: 'Burgers' }, { category: 'Salads' }],
    });
    const res = await request(app).get('/1/categories');
    expect(res.status).toBe(200);
    expect(res.body.categories).toEqual(['Pizza', 'Burgers', 'Salads']);
  });

  it('returns empty array when no categories', async () => {
    mockQuery.mockResolvedValue({ rows: [] });
    const res = await request(app).get('/1/categories');
    expect(res.status).toBe(200);
    expect(res.body.categories).toEqual([]);
  });
});

// ─── GET /user/profile ────────────────────────────────────────────────────────
describe('GET /user/profile', () => {
  beforeEach(reset);

  it('returns null user when not found', async () => {
    mockQuery.mockResolvedValue({ rows: [] });
    const res = await request(app).get('/user/profile');
    expect(res.status).toBe(200);
    expect(res.body.user).toBeNull();
  });

  it('returns user profile', async () => {
    const user = { id: 5, phone: '+919876543210', email: 'c@fng.app', name: 'Customer' };
    mockQuery.mockResolvedValue({ rows: [user] });
    const res = await request(app).get('/user/profile');
    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe('Customer');
  });
});

// ─── PATCH /user/profile ──────────────────────────────────────────────────────
describe('PATCH /user/profile', () => {
  beforeEach(reset);

  it('updates and returns user', async () => {
    const updated = { id: 5, phone: '+919876543210', email: 'new@fng.app', name: 'Updated' };
    mockQuery.mockResolvedValue({ rows: [updated] });
    const res = await request(app)
      .patch('/user/profile')
      .send({ name: 'Updated', email: 'new@fng.app' });
    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe('Updated');
  });
});
