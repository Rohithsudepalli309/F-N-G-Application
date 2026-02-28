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

// 5. Register FCM Token (Authenticated)
router.post('/fcm-token', authenticate, async (req, res, next) => {
  try {
    const { token } = req.body;
    await authService.updateFcmToken(req.user.id, token);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// 6. Refresh Token — POST /auth/refresh
const jwt = require('jsonwebtoken');
const env = require('../config/env');
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: 'refreshToken required' });

  try {
    const payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET || env.JWT_SECRET);
    const accessToken = jwt.sign(
      { id: payload.id, role: payload.role },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.json({ accessToken });
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});

// 7. GET /auth/me — get current user profile
const db = require('../config/db');
router.get('/me', authenticate, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, name, phone, email, role, fng_coins, created_at FROM users WHERE id = $1`,
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    res.json({ user: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

module.exports = router;
