const db = require('./src/config/db');
const cats = ['Fruits & Vegetables','Munchies','Dairy, Bread & Eggs','Carbonated Drinks','Atta & Flours'];
async function run() {
  for (const c of cats) {
    const r = await db.query('SELECT name, image_url FROM products WHERE category=$1 LIMIT 3', [c]);
    const sample = r.rows.map(p => p.name).join(', ');
    const img = r.rows[0] ? r.rows[0].image_url.substring(0, 50) + '...' : 'N/A';
    console.log(c, '→', r.rows.length, 'products |', sample);
    if (r.rows[0]) console.log('  img:', img);
  }
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
