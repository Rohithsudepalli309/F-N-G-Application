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
  async createOrder(userId, amountInPaisa, orderId) {
    if (!amountInPaisa || amountInPaisa < 100) {
      throw new Error('Invalid amount');
    }

    const options = {
      amount: amountInPaisa,
      currency: 'INR',
      receipt: `rcpt_${orderId}`,
      notes: { user_id: userId, order_id: orderId }
    };

    try {
      const rpOrder = await razorpay.orders.create(options);
      
      // Persist Transaction Ledger
      await db.query(
        `INSERT INTO transactions (order_id, razorpay_order_id, amount, status) VALUES ($1, $2, $3, 'pending')`,
        [orderId, rpOrder.id, amountInPaisa]
      );

      logger.info(`Razorpay order ${rpOrder.id} created for F&G Order ${orderId}`);
      return rpOrder;
    } catch (err) {
      logger.error('Razorpay Order Creation Failed', err);
      throw new Error('Payment initialization failed');
    }
  }

  // 2. Verify Webhook Signature
  verifyWebhook(rawBody, signature) {
    const expectedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    return expectedSignature === signature;
  }

  // 2b. Verify Client Payment Signature (after Razorpay SDK success)
  verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, signature) {
    const body = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');
    return expectedSignature === signature;
  }

  // 2c. Record verified payment and mark order paid
  async markVerified(orderId, razorpayPaymentId, razorpayOrderId, io) {
    await db.query(
      `UPDATE transactions
       SET status = 'success', razorpay_payment_id = $1, razorpay_signature = $2
       WHERE order_id = $3`,
      [razorpayPaymentId, razorpayOrderId, orderId]
    );
    const orderService = require('./order.service');
    await orderService.markPaid(orderId, io);
    logger.info(`Payment verified client-side for order ${orderId}`);
  }

  // 3. Handle Webhook Event
  async handleWebhook(event, io) {
    logger.info(`Processing Webhook: ${event.event}`);

    if (event.event === 'payment.captured') {
      const { order_id: rpOrderId, id: paymentId, notes } = event.payload.payment.entity;
      const internalOrderId = notes.order_id;
      
      // Update Transaction
      await db.query(
        `UPDATE transactions SET status = 'success', razorpay_payment_id = $1, razorpay_signature = $2 
         WHERE razorpay_order_id = $3`,
        [paymentId, 'webhook_verified', rpOrderId]
      );

      // Trigger Order Update
      const orderService = require('./order.service');
      await orderService.markPaid(internalOrderId, io);
      
      logger.info(`Payment Success: Internal Order ${internalOrderId}`);
    } else if (event.event === 'payment.failed') {
       const { order_id: rpOrderId } = event.payload.payment.entity;
       await db.query(
        `UPDATE transactions SET status = 'failed' WHERE razorpay_order_id = $1`,
        [rpOrderId]
      );
      logger.warn(`Payment Failed for Razorpay Order: ${rpOrderId}`);
    }
  }
}

module.exports = new PaymentService();
