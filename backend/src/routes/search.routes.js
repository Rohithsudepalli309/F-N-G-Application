const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /api/v1/search?q=&type=all|stores|products&limit=20
router.get('/', async (req, res) => {
  const { q = '', type = 'all', limit = 20 } = req.query;
  const term = q.trim();

  if (term.length < 2) {
    return res.json({ stores: [], products: [] });
  }

  const likePattern = `%${term}%`;

  try {
    const [storesResult, productsResult] = await Promise.all([
      type !== 'products'
        ? db.query(
            `SELECT id, name, type, rating, distance, image_url, delivery_time_min
             FROM stores
             WHERE is_active = TRUE
               AND (name ILIKE $1 OR type ILIKE $1)
             ORDER BY rating DESC
             LIMIT $2`,
            [likePattern, Math.min(Number(limit), 10)]
          )
        : { rows: [] },

      type !== 'stores'
        ? db.query(
            `SELECT p.id, p.name, p.price, p.original_price, p.unit, p.category,
                    p.image_url, p.is_available,
                    s.id AS store_id, s.name AS store_name
             FROM products p
             JOIN stores s ON p.store_id = s.id
             WHERE p.is_available = TRUE
               AND s.is_active = TRUE
               AND (p.name ILIKE $1 OR p.category ILIKE $1 OR p.brand ILIKE $1)
             ORDER BY p.name
             LIMIT $2`,
            [likePattern, Math.min(Number(limit), 20)]
          )
        : { rows: [] },
    ]);

    res.json({
      query: term,
      stores: storesResult.rows,
      products: productsResult.rows,
    });
  } catch (err) {
    res.status(500).json({ error: 'Search failed' });
  }
});

// GET /api/v1/search/suggestions?q= — lightweight autocomplete
router.get('/suggestions', async (req, res) => {
  const { q = '' } = req.query;
  const term = q.trim();
  if (term.length < 2) return res.json({ suggestions: [] });

  try {
    const { rows } = await db.query(
      `(SELECT name, 'store' AS type FROM stores WHERE name ILIKE $1 AND is_active = TRUE LIMIT 5)
       UNION
       (SELECT DISTINCT name, 'product' AS type FROM products WHERE name ILIKE $1 AND is_available = TRUE LIMIT 5)`,
      [`${term}%`]
    );
    res.json({ suggestions: rows.map((r) => r.name) });
  } catch (err) {
    res.status(500).json({ error: 'Suggestions failed' });
  }
});

module.exports = router;
