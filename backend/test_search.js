const db = require('./src/config/db');
const like = '%milk%';
db.query(
  'SELECT id, name, type, rating, distance, image_url FROM stores WHERE is_active = TRUE AND (name ILIKE $1 OR type ILIKE $1) ORDER BY rating DESC LIMIT 5',
  [like]
)
.then(r => { console.log('stores OK rows:', r.rows.length); return db.query('SELECT p.id, p.name, p.price FROM products p JOIN stores s ON p.store_id = s.id WHERE p.is_available = TRUE AND s.is_active = TRUE AND (p.name ILIKE $1 OR p.category ILIKE $1) ORDER BY p.name LIMIT 5', [like]); })
.then(r => { console.log('products OK rows:', r.rows.length); })
.catch(e => { console.error('ERR:', e.message); })
.finally(() => process.exit(0));
