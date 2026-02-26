const express = require('express');
const router = express.Router();
const paymentService = require('../services/payment.service');
const { authenticate } = require('../middleware/auth');

// 1. Create Razorpay Order (Protected)
router.post('/orders', authenticate, async (req, res, next) => {
  try {
    const { amount, orderId } = req.body; 
    
    if (!orderId) {
       return res.status(400).json({ error: 'Internal orderId is required' });
    }

    const order = await paymentService.createOrder(req.user.id, amount, orderId);
    
    res.json({
      success: true,
      order_id: order.id, // Razorpay Order ID
      amount: order.amount,
      currency: order.currency,
      key_id: process.env.RAZORPAY_KEY_ID
    });
  } catch (err) {
    next(err);
  }
});

// 2. Webhook (Public, Verified by Signature)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const body = req.body; // Raw body needed for HMAC

  // Verify
  if (!paymentService.verifyWebhook(body, signature)) {
    return res.status(400).json({ status: 'invalid_signature' });
  }

  // Process
  try {
    const io = req.app.get('io');
    const event = JSON.parse(req.body.toString());
    await paymentService.handleWebhook(event, io);
    res.json({ status: 'ok' });
  } catch (err) {
    // Log but usually return 200 to Razorpay to prevent retries if logic fails
    console.error(err); 
    res.status(500).json({ status: 'error' });
  }
});

module.exports = router;
