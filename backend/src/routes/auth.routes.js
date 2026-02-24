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

// 3. Send OTP
router.post('/otp', async (req, res, next) => {
  try {
    const result = await authService.sendOtp(req.body.phone);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
