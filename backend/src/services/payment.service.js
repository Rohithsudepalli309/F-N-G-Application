const Razorpay = require('razorpay');
const crypto = require('crypto');
const db = require('../config/db');
const env = require('../config/env');
const logger = require('../config/logger');

const razorpay = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID,
  key_secret: env.RAZORPAY_KEY_SECRET
});

class PaymentService {
  // 1. Create Razorpay Order
  async createOrder(userId, amountInPaisa, currency = 'INR') {
    if (!amountInPaisa || amountInPaisa < 100) {
      throw new Error('Invalid amount');
    }

    const options = {
      amount: amountInPaisa,
      currency,
      receipt: `receipt_${Date.now()}`,
      notes: { user_id: userId }
    };

    try {
      const order = await razorpay.orders.create(options);
      
      // Persist Pending Payment
      await db.query(
        `INSERT INTO payments (razorpay_order_id, amount, status, user_id) VALUES ($1, $2, 'pending', $3)`,
        [order.id, amountInPaisa, userId]
      );

      logger.info(`Payment order created: ${order.id}`);
      return order;
    } catch (err) {
      logger.error('Razorpay Order Creation Failed', err);
      throw new Error('Payment initialization failed');
    }
  }

  // 2. Verify Webhook Signature
  verifyWebhook(body, signature) {
    const generatedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
      .update(JSON.stringify(body))
      .digest('hex');

    return generatedSignature === signature;
  }

  // 3. Handle Webhook Event
  async handleWebhook(event) {
    logger.info(`Processing Webhook: ${event.event}`);

    if (event.event === 'payment.captured') {
      const { order_id, id: payment_id } = event.payload.payment.entity;
      
      // Update Payment Status
      await db.query(
        `UPDATE payments SET status = 'success', razorpay_payment_id = $1 WHERE razorpay_order_id = $2`,
        [payment_id, order_id]
      );

      // Trigger Order Service Update (Mocked for now)
      // await orderService.markPaid(order_id);
      logger.info(`Payment Success: ${order_id}`);
    } else if (event.event === 'payment.failed') {
       const { order_id } = event.payload.payment.entity;
       await db.query(
        `UPDATE payments SET status = 'failed' WHERE razorpay_order_id = $1`,
        [order_id]
      );
      logger.warn(`Payment Failed: ${order_id}`);
    }
  }
}

module.exports = new PaymentService();
