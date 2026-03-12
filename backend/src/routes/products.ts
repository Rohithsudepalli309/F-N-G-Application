/**
 * Global product catalog routes — no auth required.
 * Serves the customer app home screen product lists.
 *
 * GET /api/v1/products            — paginated, filterable list
 * GET /api/v1/products/categories — distinct category names
 * GET /api/v1/products/sub-categories — distinct sub_category names for a category
 */
import { Router } from 'express';
import pool from '../db';

const router = Router();

// ── GET /products ─────────────────────────────────────────────────────────
// Query params: category, sub_category, search, limit (default 20), offset (default 0)
router.get('/', async (req, res) => {
  try {
    const { category, sub_category, search } = req.query as Record<string, string>;
    const limit  = Math.min(Number(req.query.limit)  || 50, 100);
    const offset = Number(req.query.offset) || 0;

    let query = `
      SELECT p.id, p.name, p.description, p.price, p.original_price,
             p.category, p.sub_category, p.brand, p.image_url, p.stock, p.unit,
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
    if (sub_category) {
      query += ` AND p.sub_category ILIKE $${idx++}`;
      params.push(sub_category);
    }
    if (search) {
      query += ` AND (p.name ILIKE $${idx++} OR p.category ILIKE $${idx - 1} OR p.brand ILIKE $${idx - 1})`;
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

// ── GET /products/sub-categories?category=X ──────────────────────────────
router.get('/sub-categories', async (req, res) => {
  try {
    const { category } = req.query as Record<string, string>;
    const result = await pool.query(
      `SELECT DISTINCT sub_category FROM products
       WHERE sub_category IS NOT NULL AND is_available = true
       ${category ? 'AND category ILIKE $1' : ''}
       ORDER BY sub_category`,
      category ? [category] : []
    );
    res.json({ subCategories: result.rows.map((r) => r.sub_category) });
  } catch (err: any) {
    console.error('[products] GET /sub-categories', err.message);
    res.status(500).json({ error: 'Failed to fetch sub-categories' });
  }
});

export default router;
