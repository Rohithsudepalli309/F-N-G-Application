import { Router } from 'express';
import pool from '../db';
import crypto from 'crypto';
import { AppError } from '../middleware/errorHandler';
import { io } from '../server';

const router = Router();

router.post('/razorpay', async (req, res, next) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    return next(new AppError('Webhook secret not configured.', 500));
  }

  const signature = req.headers['x-razorpay-signature'];
  if (!signature || typeof signature !== 'string') {
    return next(new AppError('Missing or invalid webhook signature.', 400));
  }

  const rawBody = Buffer.isBuffer(req.body)
    ? req.body
    : Buffer.from(JSON.stringify(req.body));

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  if (!crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature))) {
    return next(new AppError('Invalid webhook signature', 400));
  }

  let payloadBody: any;
  try {
    payloadBody = Buffer.isBuffer(req.body)
      ? JSON.parse(req.body.toString('utf8'))
      : req.body;
  } catch {
    return next(new AppError('Invalid webhook payload.', 400));
  }

  const { event, payload } = payloadBody;

  try {
    if (event === 'payment.captured') {
      const payment = payload.payment.entity;
      const orderId = payment.notes?.fng_order_id; // Custom note passed during order creation

      // Update Order Status to PAID/CONFIRMED
      await pool.query(
        `UPDATE orders SET 
          status = 'confirmed', 
          payment_status = 'paid', 
          metadata = metadata || $2::jsonb,
          updated_at = NOW() 
         WHERE id = $1`,
        [orderId, JSON.stringify({ razorpay_payment_id: payment.id })]
      );

      // Notify User and Store via Socket
      io.to(`order:${orderId}`).emit('order.payment_confirmed', { orderId });
      console.log(`✅ Payment captured for Order ${orderId}`);
    }

    if (event === 'payment.failed') {
      // Log failure for recovery
      console.error(`❌ Payment failed: ${payload.payment.entity.id}`);
    }

    res.json({ status: 'ok' });
  } catch (err) {
    next(err);
  }
});

export default router;
