const db = require('./src/config/db');
const logger = require('./src/config/logger');

async function seed() {
  try {
    logger.info('Starting test order seeding...');

    // 1. Get or Create Customer
    let userResult = await db.query("SELECT id FROM users WHERE role = 'customer' LIMIT 1");
    let customerId;
    if (userResult.rows.length === 0) {
      const newUser = await db.query(
        "INSERT INTO users (name, phone, role) VALUES ($1, $2, $3) RETURNING id",
        ['Test Customer', '9999999999', 'customer']
      );
      customerId = newUser.rows[0].id;
      logger.info('Created test customer');
    } else {
      customerId = userResult.rows[0].id;
      logger.info(`Using existing customer ID: ${customerId}`);
    }

    // 2. Get or Create Store
    let storeResult = await db.query("SELECT id FROM stores LIMIT 1");
    let storeId;
    if (storeResult.rows.length === 0) {
      storeId = 'store_test_01';
      await db.query(
        "INSERT INTO stores (id, name, type, store_type) VALUES ($1, $2, $3, $4)",
        [storeId, 'Test Mart', 'Grocery', 'grocery']
      );
      logger.info('Created test store');
    } else {
      storeId = storeResult.rows[0].id;
      logger.info(`Using existing store ID: ${storeId}`);
    }

    // 3. Get or Create Product
    let productResult = await db.query("SELECT id, name, price FROM products LIMIT 1");
    let product;
    if (productResult.rows.length === 0) {
      product = { id: 'prod_test_01', name: 'Amul Gold Milk', price: 6600 };
      await db.query(
        "INSERT INTO products (id, store_id, name, price, category) VALUES ($1, $2, $3, $4, $5)",
        [product.id, storeId, product.name, product.price, 'Dairy']
      );
      logger.info('Created test product');
    } else {
      product = productResult.rows[0];
      logger.info(`Using existing product: ${product.name}`);
    }

    // 4. Create Order
    const orderId = `FNG-TEST-${Date.now().toString().slice(-4)}`;
    await db.query(
      "INSERT INTO orders (id, customer_id, store_id, status, total_amount, address) VALUES ($1, $2, $3, $4, $5, $6)",
      [orderId, customerId, storeId, 'Delivered', product.price, 'Test Address, Mumbai']
    );

    // 5. Create Order Items
    await db.query(
      "INSERT INTO order_items (order_id, product_id, name, price, quantity) VALUES ($1, $2, $3, $4, $5)",
      [orderId, product.id, product.name, product.price, 1]
    );

    logger.info(`Successfully seeded order ${orderId} for customer ${customerId}`);
    process.exit(0);
  } catch (err) {
    logger.error('Seeding failed:', err);
    process.exit(1);
  }
}

seed();
