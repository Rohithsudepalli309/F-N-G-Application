import { Router } from 'express';
import pool from '../db';
import crypto from 'crypto';
import { AppError } from '../middleware/errorHandler';
import { io } from '../server';

const router = Router();

// RAZORPAY_WEBHOOK_SECRET should be in .env
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || 'fng_test_secret';

router.post('/razorpay', async (req, res, next) => {
  const signature = req.headers['x-razorpay-signature'];
  
  // Verify signature
  const expectedSignature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (signature !== expectedSignature) {
    return next(new AppError('Invalid webhook signature', 400));
  }

  const { event, payload } = req.body;

  try {
    if (event === 'payment.captured') {
      const payment = payload.payment.entity;
      const orderId = payment.notes.order_id; // Custom note passed during order creation

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
