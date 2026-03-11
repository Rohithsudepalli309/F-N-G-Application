import { Router } from 'express';
import crypto from 'crypto';
import pool from '../db';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

function generateReferralCode(userId: number): string {
  const hash = crypto.createHash('sha256').update(`fng-ref-${userId}`).digest('hex');
  return `FNG-${hash.slice(0, 6).toUpperCase()}`;
}

// ─── GET /referrals ── Return code + stats for the logged-in user ─────────────
router.get('/', async (req: AuthRequest, res) => {
  // Ensure user has a referral code (lazy-generate on first call)
  const userRes = await pool.query(
    `SELECT referral_code, coins FROM users WHERE id=$1`,
    [req.user!.id]
  );
  let code: string = userRes.rows[0]?.referral_code;
  if (!code) {
    code = generateReferralCode(req.user!.id);
    await pool.query(
      `UPDATE users SET referral_code=$1 WHERE id=$2`,
      [code, req.user!.id]
    );
  }

  const statsRes = await pool.query(
    `SELECT
       COUNT(*)                                  AS "totalInvites",
       COUNT(*) FILTER (WHERE coins_granted > 0) AS "successfulInvites",
       COALESCE(SUM(coins_granted), 0)           AS "coinsEarned"
     FROM referral_events
     WHERE referrer_id=$1`,
    [req.user!.id]
  );
  const s = statsRes.rows[0];

  res.json({
    code,
    totalInvites:      Number(s.totalInvites),
    successfulInvites: Number(s.successfulInvites),
    coinsEarned:       Number(s.coinsEarned),
    pendingCoins:      0,
  });
});

export default router;
