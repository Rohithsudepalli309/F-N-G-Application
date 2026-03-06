const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');

// All referral routes require authentication
router.use(authenticate);

// GET /api/v1/referrals — get current user's referral code + stats
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Fetch or generate a deterministic referral code for this user
    const { rows: userRows } = await db.query(
      'SELECT referral_code FROM users WHERE id = $1',
      [userId]
    );
    let code = userRows[0]?.referral_code;

    if (!code) {
      code = `FNG-${userId.toString().padStart(6, '0')}`;
      await db.query(
        'UPDATE users SET referral_code = $1 WHERE id = $2',
        [code, userId]
      );
    }

    // Aggregate stats for this referrer
    const { rows: stats } = await db.query(
      `SELECT
         COUNT(*) FILTER (WHERE status IN ('pending','completed'))          AS "totalInvites",
         COUNT(*) FILTER (WHERE status = 'completed')                       AS "successfulInvites",
         COALESCE(SUM(coins_awarded) FILTER (WHERE status = 'completed'), 0) AS "coinsEarned",
         COALESCE(SUM(coins_awarded) FILTER (WHERE status = 'pending'),   0) AS "pendingCoins"
       FROM referrals
       WHERE referrer_id = $1`,
      [userId]
    );

    res.json({
      code,
      totalInvites:      parseInt(stats[0].totalInvites,      10),
      successfulInvites: parseInt(stats[0].successfulInvites, 10),
      coinsEarned:       parseInt(stats[0].coinsEarned,       10),
      pendingCoins:      parseInt(stats[0].pendingCoins,      10),
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/referrals/apply — apply a referral code (called once per referred user)
router.post('/apply', async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Referral code is required' });
    }

    const normalized = code.trim().toUpperCase();

    // Find the referrer
    const { rows: referrerRows } = await db.query(
      'SELECT id FROM users WHERE referral_code = $1',
      [normalized]
    );
    if (referrerRows.length === 0) {
      return res.status(404).json({ error: 'Invalid referral code' });
    }

    const referrerId = referrerRows[0].id;
    if (referrerId === req.user.id) {
      return res.status(400).json({ error: 'Cannot apply your own referral code' });
    }

    // Each user can only be referred once
    const { rows: existing } = await db.query(
      'SELECT id FROM referrals WHERE referred_id = $1',
      [req.user.id]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: 'A referral code has already been applied to this account' });
    }

    await db.query(
      `INSERT INTO referrals (referrer_id, referred_id, code, status, coins_awarded)
       VALUES ($1, $2, $3, 'completed', 50)`,
      [referrerId, req.user.id, normalized]
    );

    res.json({ success: true, coinsAwarded: 50 });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
