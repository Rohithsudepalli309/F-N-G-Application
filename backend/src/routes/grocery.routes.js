const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /api/v1/grocery/categories?section=grocery|fashion|household|tools|daily
router.get('/categories', async (req, res) => {
  try {
    const { section } = req.query;
    const { rows } = await db.query(
      `SELECT id, name, image_url, sort_order, section
       FROM grocery_categories
       WHERE is_active = TRUE ${section ? 'AND section = $1' : ''}
       ORDER BY sort_order ASC, name ASC`,
      section ? [section] : []
    );

    // Seed default categories if empty
    if (rows.length === 0) {
      // [name, image_url, sort_order, section]
      const defaults = [
        // ── Grocery ─────────────────────────────────────────────
        ['Fruits & Vegetables',     null, 1,  'grocery'],
        ['Dairy & Breakfast',       null, 2,  'grocery'],
        ['Snacks & Munchies',       null, 3,  'grocery'],
        ['Beverages',               null, 4,  'grocery'],
        ['Bakery & Biscuits',       null, 5,  'grocery'],
        ['Instant & Frozen',        null, 6,  'grocery'],
        ['Atta, Rice & Dal',        null, 7,  'grocery'],
        ['Oils & Ghee',             null, 8,  'grocery'],
        ['Masala & Spices',         null, 9,  'grocery'],
        ['Baby Care',               null, 10, 'grocery'],
        ['Pet Care',                null, 11, 'grocery'],
        // ── Daily Essentials ─────────────────────────────────────
        ['Cleaning Essentials',     null, 1,  'daily'],
        ['Personal Care',           null, 2,  'daily'],
        ['Laundry Detergents',      null, 3,  'daily'],
        ['Toilet & Floor Cleaners', null, 4,  'daily'],
        ['Tissue & Paper Products', null, 5,  'daily'],
        ['Disinfectants & Sanitizers', null, 6, 'daily'],
        // ── Household ────────────────────────────────────────────
        ['Kitchen Storage',         null, 1,  'household'],
        ['Cookware & Pans',         null, 2,  'household'],
        ['Containers & Boxes',      null, 3,  'household'],
        ['Brooms & Cleaning Tools', null, 4,  'household'],
        ['Organizers & Shelves',    null, 5,  'household'],
        ['Light Bulbs & Batteries', null, 6,  'household'],
        // ── Tools ────────────────────────────────────────────────
        ['Hand Tools',              null, 1,  'tools'],
        ['Power Tool Accessories',  null, 2,  'tools'],
        ['Adhesives & Tapes',       null, 3,  'tools'],
        ['Locks & Safety',          null, 4,  'tools'],
        ['Plumbing Fittings',       null, 5,  'tools'],
        ['Electrical Fittings',     null, 6,  'tools'],
        // ── Fashion ──────────────────────────────────────────────
        ['Men\'s T-Shirts',         null, 1,  'fashion'],
        ['Women\'s Kurtas',         null, 2,  'fashion'],
        ['Kids Clothing',           null, 3,  'fashion'],
        ['Accessories & Belts',     null, 4,  'fashion'],
        ['Footwear',                null, 5,  'fashion'],
        ['Innerwear & Socks',       null, 6,  'fashion'],
      ];

      for (const [name, image_url, sort_order, section] of defaults) {
        await db.query(
          `INSERT INTO grocery_categories (name, image_url, sort_order, section)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT DO NOTHING`,
          [name, image_url, sort_order, section]
        );
      }

      const { rows: seeded } = await db.query(
        `SELECT id, name, image_url, sort_order, section FROM grocery_categories ORDER BY section, sort_order`
      );
      return res.json({ categories: seeded });
    }

    res.json({ categories: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// GET /api/v1/grocery/products?category=<name>&sort=price_asc|price_desc|discount&limit=40
router.get('/products', async (req, res) => {
  const { category, sort = 'default', limit = 40, offset = 0 } = req.query;

  try {
    let orderClause = 'p.name ASC';
    if (sort === 'price_asc') orderClause = 'p.price ASC';
    else if (sort === 'price_desc') orderClause = 'p.price DESC';
    else if (sort === 'discount') orderClause = '(p.mrp - p.price) DESC';

    let query, params;
    if (category) {
      query = `
        SELECT p.id, p.name, p.brand, p.unit, p.price, p.mrp,
               p.image_url, p.stock_quantity, p.is_available,
               c.name AS category_name
        FROM grocery_products p
        JOIN grocery_categories c ON p.category_id = c.id
        WHERE p.is_available = TRUE
          AND c.name ILIKE $1
        ORDER BY ${orderClause}
        LIMIT $2 OFFSET $3`;
      params = [`%${category}%`, Number(limit), Number(offset)];
    } else {
      query = `
        SELECT p.id, p.name, p.brand, p.unit, p.price, p.mrp,
               p.image_url, p.stock_quantity, p.is_available,
               c.name AS category_name
        FROM grocery_products p
        JOIN grocery_categories c ON p.category_id = c.id
        WHERE p.is_available = TRUE
        ORDER BY ${orderClause}
        LIMIT $1 OFFSET $2`;
      params = [Number(limit), Number(offset)];
    }

    const { rows } = await db.query(query, params);
    res.json({ products: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch grocery products' });
  }
});

// GET /api/v1/grocery/products/:id
router.get('/products/:id', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT p.*, c.name AS category_name
       FROM grocery_products p
       JOIN grocery_categories c ON p.category_id = c.id
       WHERE p.id = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Product not found' });
    res.json({ product: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

module.exports = router;
