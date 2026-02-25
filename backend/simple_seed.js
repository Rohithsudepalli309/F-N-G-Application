const db = require('./src/config/db');
async function run() {
  try {
    const user = await db.query('SELECT id FROM users LIMIT 1');
    const store = await db.query('SELECT id FROM stores LIMIT 1');
    const product = await db.query('SELECT id, name, price FROM products LIMIT 1');
    
    if (!user.rows[0] || !store.rows[0] || !product.rows[0]) {
       console.log('Missing data to seed order');
       process.exit(0);
    }

    const oid = 'ORD-' + Math.floor(Math.random() * 10000);
    
    await db.query(
      'INSERT INTO orders (id, customer_id, store_id, status, total_amount, address) VALUES ($1, $2, $3, $4, $5, $6)',
      [oid, user.rows[0].id, store.rows[0].id, 'Delivered', product.rows[0].price, '123 Zepto Lane, Mumbai']
    );
    
    await db.query(
      'INSERT INTO order_items (order_id, product_id, name, price, quantity) VALUES ($1, $2, $3, $4, $5)',
      [oid, product.rows[0].id, product.rows[0].name, product.rows[0].price, 1]
    );

    console.log(`Successfully seeded order ${oid}`);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
run();
