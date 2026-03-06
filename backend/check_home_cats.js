const db = require('./src/config/db');
const cats = ['Fruits & Vegetables','Munchies','Dairy, Bread & Eggs','Cold Drinks & Juices','Atta, Rice, Oil & Dals'];
async function run() {
  for (const cat of cats) {
    const r = await db.query('SELECT COUNT(*) as cnt FROM products WHERE category=$1', [cat]);
    console.log(r.rows[0].cnt, '|', cat);
  }
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
