const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const analyticsService = require('../services/analytics.service');

// 1. Get Demand Heatmap (Admins Only)
router.get('/heatmap', authenticate, authorize(['admin']), async (req, res, next) => {
  try {
    const data = await analyticsService.getOrderHeatmap();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// 2. Get Fleet Status (Admins Only)
router.get('/fleet', authenticate, authorize(['admin']), async (req, res, next) => {
  try {
    const data = await analyticsService.getFleetStatus();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// 3. Get Platform Stats (Admins Only)
router.get('/stats', authenticate, authorize(['admin']), async (req, res, next) => {
  try {
    const data = await analyticsService.getPlatformStats();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
