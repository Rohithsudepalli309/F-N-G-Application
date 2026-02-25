const express = require('express');
const router = express.Router();
const orderService = require('../services/order.service');
const { authenticate } = require('../middleware/auth');

// GET /api/v1/orders - Get all orders for the current user
router.get('/', authenticate, async (req, res, next) => {
  try {
    const orders = await orderService.getOrdersByCustomer(req.user.id);
    res.json(orders);
  } catch (err) {
    next(err);
  }
});

// Initial endpoint for creating an order (will be used by Checkout)
router.post('/', authenticate, async (req, res, next) => {
  try {
    const order = await orderService.createOrder(req.body, req.user.id);
    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
