// Cleanup script: fix products with old source.unsplash.com or null image URLs
const db = require('./src/config/db');
const FALLBACK_IMG = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80';
async function run() {
  // Update image_url for products referenced by order_items (can't delete them)
  const u = await db.query(
    `UPDATE products SET image_url = $1
     WHERE (image_url LIKE 'https://source.%' OR image_url IS NULL OR image_url LIKE 'https://www.bigbasket.%')
     AND id IN (SELECT DISTINCT product_id FROM order_items)`,
    [FALLBACK_IMG]
  );
  console.log('Updated', u.rowCount, 'order-referenced products to fallback image');

  // Delete the rest (not referenced by any orders)
  const d = await db.query(
    `DELETE FROM products
     WHERE (image_url LIKE 'https://source.%' OR image_url IS NULL OR image_url LIKE 'https://www.bigbasket.%')
     AND id NOT IN (SELECT DISTINCT product_id FROM order_items)`
  );
  console.log('Deleted', d.rowCount, 'orphan products with broken image URLs');

  const total = await db.query('SELECT COUNT(*) as c FROM products');
  console.log('Remaining products:', total.rows[0].c);
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
