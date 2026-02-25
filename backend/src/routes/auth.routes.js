const express = require('express');
const router = express.Router();
const authService = require('../services/auth.service');
const { authLimiter } = require('../middleware/security');

// 1. Signup
router.post('/signup', async (req, res, next) => {
  try {
    const result = await authService.signup(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

// 2. Login (Rate Limited)
router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    res.json(result);
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

const { authenticate } = require('../middleware/auth');

// 1. Signup
// ... previous routes ...

// 3. Send OTP
router.post('/otp', async (req, res, next) => {
  try {
    const logger = require('../config/logger');
    logger.info(`OTP request body: ${JSON.stringify(req.body)}`);
    const io = req.app.get('io');
    const result = await authService.sendOtp(req.body.phone, io);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// 4. Update Profile (Authenticated)
router.put('/profile', authenticate, async (req, res, next) => {
  try {
    const result = await authService.updateProfile(req.user.id, req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
