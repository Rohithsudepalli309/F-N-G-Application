const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('../src/config/db');

async function migrate() {
  try {
    console.log('Migrating orders table...');
    
    // Add columns to orders if they don't exist
    await db.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS delivery_address TEXT,
      ADD COLUMN IF NOT EXISTS delivery_lat DECIMAL(10,8),
      ADD COLUMN IF NOT EXISTS delivery_lng DECIMAL(11,8),
      ADD COLUMN IF NOT EXISTS otp VARCHAR(6);
    `);

    // Drop the strict constraint on status if it exists and let it be open, or add new statuses
    try {
      await db.query(`ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;`);
    } catch(e) {}

    console.log('Creating deliveries table...');
    // Create deliveries table
    await db.query(`
      CREATE TABLE IF NOT EXISTS deliveries (
        id SERIAL PRIMARY KEY,
        order_id VARCHAR(50) REFERENCES orders(id) ON DELETE CASCADE,
        driver_id INTEGER REFERENCES users(id),
        status VARCHAR(20) NOT NULL DEFAULT 'assigned',
        delivery_time TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('Migration successful!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await db.pool.end();
  }
}

migrate();
