import request from 'supertest';
import jwt from 'jsonwebtoken';
import pool from '../db';
import { redis } from '../redis';

describe('Order Lifecycle Integration Test', () => {
  jest.setTimeout(30000);
  const runId = `${Date.now()}`.slice(-5);
  const customerPhone = `90001${runId}`;
  const merchantPhone = `90002${runId}`;
  const driverPhone = `90003${runId}`;

  let app: import('express').Express;
  let customerToken: string;
  let merchantToken: string;
  let driverToken: string;
  let orderId: number;
  let deliveryOtp: string;

  let customerId: number;
  let merchantId: number;
  let driverUserId: number;
  let storeId: number;
  let productId: number;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_32_chars_long__';

    ({ app } = await import('../server'));
    const cust = await pool.query(
      `INSERT INTO users (phone, name, role) VALUES ($1,$2,'customer') RETURNING id`,
      [customerPhone, 'Test Customer']
    );
    customerId = cust.rows[0].id;

    const merch = await pool.query(
      `INSERT INTO users (phone, name, role) VALUES ($1,$2,'merchant') RETURNING id`,
      [merchantPhone, 'Test Merchant']
    );
    merchantId = merch.rows[0].id;

    const store = await pool.query(
      `INSERT INTO stores (owner_id, name, store_type, lat, lng, is_active, is_verified)
       VALUES ($1,$2,'restaurant',$3,$4,TRUE,TRUE) RETURNING id`,
      [merchantId, 'Test Store', 17.385, 78.4867]
    );
    storeId = store.rows[0].id;

    const product = await pool.query(
      `INSERT INTO products (store_id, name, price, stock, is_available)
       VALUES ($1,$2,$3,$4,TRUE) RETURNING id`,
      [storeId, 'Test Item', 19900, 100]
    );
    productId = product.rows[0].id;

    const driverUser = await pool.query(
      `INSERT INTO users (phone, name, role) VALUES ($1,$2,'driver') RETURNING id`,
      [driverPhone, 'Test Driver']
    );
    driverUserId = driverUser.rows[0].id;

    await pool.query(
      `INSERT INTO drivers (user_id, name, phone, is_available, is_active, current_lat, current_lng)
       VALUES ($1,$2,$3,TRUE,TRUE,$4,$5)`,
      [driverUserId, 'Test Driver', driverPhone, 17.386, 78.487]
    );

    customerToken = jwt.sign({ id: customerId, role: 'customer' }, process.env.JWT_SECRET!);
    merchantToken = jwt.sign({ id: merchantId, role: 'merchant', storeId }, process.env.JWT_SECRET!);
    driverToken = jwt.sign({ id: driverUserId, role: 'driver' }, process.env.JWT_SECRET!);
  });

  afterAll(async () => {
    await pool.query(`DELETE FROM order_items WHERE order_id = $1`, [orderId]).catch(() => undefined);
    await pool.query(`DELETE FROM orders WHERE id = $1`, [orderId]).catch(() => undefined);
    await pool.query(`DELETE FROM products WHERE id = $1`, [productId]).catch(() => undefined);
    await pool.query(`DELETE FROM stores WHERE id = $1`, [storeId]).catch(() => undefined);
    await pool.query(`DELETE FROM drivers WHERE user_id = $1`, [driverUserId]).catch(() => undefined);
    await pool.query(`DELETE FROM users WHERE id IN ($1,$2,$3)`, [customerId, merchantId, driverUserId]).catch(() => undefined);

    await pool.end();
    await redis.quit();
  });

  it('Flow: Customer places order -> Merchant accepts -> Driver delivers', async () => {
    const orderRes = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        storeId,
        items: [{ productId, quantity: 2 }],
        deliveryAddress: {
          label: 'Home',
          address_line: 'Test Street 123',
          city: 'Hyderabad',
          pincode: '500001',
          lat: 17.385,
          lng: 78.4867,
        },
        paymentMethod: 'cod',
      });

    expect(orderRes.status).toBe(201);
    orderId = orderRes.body.order.id;
    deliveryOtp = orderRes.body.order.deliveryOtp;

    const acceptRes = await request(app)
      .patch(`/api/v1/merchant/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({ action: 'accept' });
    expect(acceptRes.status).toBe(200);

    const readyRes = await request(app)
      .patch(`/api/v1/merchant/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({ action: 'ready' });
    expect(readyRes.status).toBe(200);

    const acceptDriver = await request(app)
      .post('/api/v1/driver/accept')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ orderId });
    expect(acceptDriver.status).toBe(200);

    const pickupRes = await request(app)
      .post('/api/v1/driver/pickup')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ orderId });
    expect(pickupRes.status).toBe(200);

    const deliveryRes = await request(app)
      .post('/api/v1/driver/complete')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ orderId, otp: deliveryOtp });
    expect(deliveryRes.status).toBe(200);
  }, 30000);
});
