/**
 * Global product catalog routes — no auth required.
 * Serves the customer app home screen product lists.
 *
 * GET /api/v1/products            — paginated, filterable list
 * GET /api/v1/products/categories — distinct category names
 */
import { Router } from 'express';
import pool from '../db';

const router = Router();

// ── GET /products ─────────────────────────────────────────────────────────
// Query params: category, search, limit (default 20), offset (default 0)
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query as Record<string, string>;
    const limit  = Math.min(Number(req.query.limit)  || 20, 100);
    const offset = Number(req.query.offset) || 0;

    let query = `
      SELECT p.id, p.name, p.description, p.price, p.original_price,
             p.category, p.brand, p.image_url, p.stock, p.unit,
             p.is_veg, p.is_available, p.sort_order, p.store_id
      FROM products p
      WHERE p.is_available = true
    `;
    const params: unknown[] = [];
    let idx = 1;

    if (category) {
      query += ` AND p.category ILIKE $${idx++}`;
      params.push(category);
    }
    if (search) {
      query += ` AND (p.name ILIKE $${idx++} OR p.category ILIKE $${idx - 1})`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY p.sort_order ASC, p.name ASC LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err: any) {
    console.error('[products] GET /', err.message);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// ── GET /products/categories ──────────────────────────────────────────────
router.get('/categories', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT category FROM products
       WHERE category IS NOT NULL AND is_available = true
       ORDER BY category`
    );
    res.json({ categories: result.rows.map((r) => r.category) });
  } catch (err: any) {
    console.error('[products] GET /categories', err.message);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

export default router;
