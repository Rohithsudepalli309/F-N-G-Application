const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('../src/config/db');

async function seedTestOrder() {
  try {
    // 1. Find a customer (or create one)
    let res = await db.query("SELECT id FROM users WHERE role = 'customer' LIMIT 1");
    if (res.rows.length === 0) {
      console.log('Creating a dummy customer...');
      res = await db.query(
        "INSERT INTO users (phone, role, verified) VALUES ('+919999999999', 'customer', true) RETURNING id"
      );
    }
    const customerId = res.rows[0].id;

    // 2. Generate a 6-digit OTP and Order ID
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const newOrderId = 'ORD-TEST-' + Date.now();

    // 3. Create an order in "ready" state so it shows up for drivers
    await db.query(
      `INSERT INTO orders (
        id,
        customer_id, 
        total_amount, 
        status, 
        delivery_address, 
        delivery_lat, 
        delivery_lng,
        otp
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [newOrderId, customerId, 45000, 'ready', '123 Fake Street, Tech Park Phase 2', 12.9716, 77.5946, otp]
    );

    const orderId = newOrderId;

    console.log('✅ Test order created successfully!');
    console.log('===================================');
    console.log(`Order ID  : ${orderId}`);
    console.log(`Status    : READY (Awaiting Driver)`);
    console.log(`Amount    : ₹450.00`);
    console.log(`OTP       : ${otp} (Driver needs this to complete delivery)`);
    console.log('===================================');

  } catch (err) {
    console.error('❌ Failed to seed test order:', err);
  } finally {
    await db.pool.end();
  }
}


seedTestOrder();
