const db = require('./src/config/db');
async function run() {
  const r = await db.query("SELECT COUNT(*) as c, CASE WHEN image_url LIKE 'https://source.%' THEN 'source.unsplash' WHEN image_url LIKE 'https://images.%' THEN 'images.unsplash' WHEN image_url IS NULL THEN 'null' ELSE 'other' END as type FROM products GROUP BY type ORDER BY c DESC");
  r.rows.forEach(row => console.log(row.type, '→', row.c));
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
