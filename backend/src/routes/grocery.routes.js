const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /api/v1/grocery/categories
router.get('/categories', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, name, image_url, sort_order
       FROM grocery_categories
       WHERE is_active = TRUE
       ORDER BY sort_order ASC, name ASC`
    );

    // Seed default categories if empty
    if (rows.length === 0) {
      const defaults = [
        ['Fruits & Vegetables', null, 1],
        ['Dairy & Breakfast', null, 2],
        ['Snacks & Munchies', null, 3],
        ['Beverages', null, 4],
        ['Bakery & Biscuits', null, 5],
        ['Instant & Frozen', null, 6],
        ['Cleaning Essentials', null, 7],
        ['Personal Care', null, 8],
        ['Atta, Rice & Dal', null, 9],
        ['Oils & Ghee', null, 10],
        ['Baby Care', null, 11],
        ['Pet Care', null, 12],
      ];

      for (const [name, image_url, sort_order] of defaults) {
        await db.query(
          `INSERT INTO grocery_categories (name, image_url, sort_order)
           VALUES ($1, $2, $3)
           ON CONFLICT DO NOTHING`,
          [name, image_url, sort_order]
        );
      }

      const { rows: seeded } = await db.query(
        `SELECT id, name, image_url, sort_order FROM grocery_categories ORDER BY sort_order`
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
