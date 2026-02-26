const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('../src/config/db');

async function migratePayment() {
  try {
    console.log('Migrating products table to add stock...');
    // Add stock column to products
    await db.query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS stock INTEGER NOT NULL DEFAULT 100;
    `);

    console.log('Creating transactions table...');
    // Create transactions table to log payment events
    await db.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        order_id VARCHAR(50) REFERENCES orders(id),
        razorpay_payment_id VARCHAR(100),
        razorpay_order_id VARCHAR(100),
        razorpay_signature TEXT,
        amount INTEGER NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'failed',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('Payment migration successful!');
  } catch (err) {
    console.error('Payment migration failed:', err);
  } finally {
    await db.pool.end();
  }
}

migratePayment();
