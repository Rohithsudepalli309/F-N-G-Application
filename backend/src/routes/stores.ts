import { Router } from 'express';
import pool from '../db';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// ─── GET /stores ─── List active stores ──────────────────────────────────
router.get('/', async (req, res) => {
  const { type, search, limit = '20', offset = '0' } = req.query as Record<string, string>;

  let query = `
    SELECT id, name, description, store_type, cuisine_tags,
           image_url, delivery_time_min, min_order_amount,
           rating, total_ratings, is_active
    FROM stores
    WHERE is_active = TRUE
  `;
  const params: unknown[] = [];
  let idx = 1;

  if (type) {
    query += ` AND store_type = $${idx++}`;
    params.push(type);
  }
  if (search) {
    query += ` AND (name ILIKE $${idx++} OR description ILIKE $${idx - 1})`;
    params.push(`%${search}%`);
  }

  query += ` ORDER BY rating DESC, created_at DESC LIMIT $${idx++} OFFSET $${idx++}`;
  params.push(Number(limit), Number(offset));

  const result = await pool.query(query, params);
  res.json({ stores: result.rows });
});

// ─── GET /stores/:storeId ─── Store detail ────────────────────────────────
router.get('/:storeId', async (req, res) => {
  const { storeId } = req.params;
  const result = await pool.query(
    `SELECT s.*, u.phone AS owner_phone
     FROM stores s LEFT JOIN users u ON u.id = s.owner_id
     WHERE s.id=$1`,
    [storeId]
  );
  if (result.rows.length === 0) {
    res.status(404).json({ error: 'Store not found.' });
    return;
  }
  res.json({ store: result.rows[0] });
});

// ─── GET /stores/:storeId/products ─── Products for a store ──────────────
router.get('/:storeId/products', async (req, res) => {
  const { storeId } = req.params;
  const { category, search } = req.query as Record<string, string>;

  let query = `
    SELECT id, name, description, price, original_price,
           category, brand, image_url, stock, unit,
           is_veg, is_available, sort_order
    FROM products
    WHERE store_id=$1
  `;
  const params: unknown[] = [storeId];
  let idx = 2;

  if (category) {
    query += ` AND category = $${idx++}`;
    params.push(category);
  }
  if (search) {
    query += ` AND (name ILIKE $${idx++} OR category ILIKE $${idx - 1})`;
    params.push(`%${search}%`);
  }

  query += ` ORDER BY sort_order ASC, is_available DESC, name ASC`;

  const result = await pool.query(query, params);
  res.json({ products: result.rows });
});

// ─── GET /stores/:storeId/products/:productId ─── Single product ─────────
router.get('/:storeId/products/:productId', async (req, res) => {
  const { storeId, productId } = req.params;
  const result = await pool.query(
    `SELECT * FROM products WHERE id=$1 AND store_id=$2`,
    [productId, storeId]
  );
  if (result.rows.length === 0) {
    res.status(404).json({ error: 'Product not found.' });
    return;
  }
  res.json({ product: result.rows[0] });
});

// ─── GET /stores/:storeId/categories ─── Unique categories ───────────────
router.get('/:storeId/categories', async (req, res) => {
  const { storeId } = req.params;
  const result = await pool.query(
    `SELECT DISTINCT category FROM products
     WHERE store_id=$1 AND category IS NOT NULL
     ORDER BY category`,
    [storeId]
  );
  res.json({ categories: result.rows.map((r) => r.category) });
});

// ─── GET /user/profile ─── Logged-in customer profile ───────────────────
router.get('/user/profile', requireAuth, async (req: AuthRequest, res) => {
  const result = await pool.query(
    `SELECT id, phone, email, name FROM users WHERE id=$1`,
    [req.user!.id]
  );
  res.json({ user: result.rows[0] ?? null });
});

// ─── PATCH /user/profile ─────────────────────────────────────────────────
router.patch('/user/profile', requireAuth, async (req: AuthRequest, res) => {
  const { name, email, fcmToken } = req.body as {
    name?: string; email?: string; fcmToken?: string;
  };
  const result = await pool.query(
    `UPDATE users SET
       name     = COALESCE($1, name),
       email    = COALESCE($2, email),
       fcm_token = COALESCE($3, fcm_token)
     WHERE id=$4 RETURNING id, phone, email, name`,
    [name ?? null, email ?? null, fcmToken ?? null, req.user!.id]
  );
  res.json({ user: result.rows[0] });
});

export default router;
