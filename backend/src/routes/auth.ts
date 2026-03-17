import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import pool from '../db';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { sendOtp } from '../services/sms';
import { getUserPoints } from '../services/loyalty';

const router = Router();

const ACCESS_TTL  = '24h';
const REFRESH_TTL = 30 * 24 * 60 * 60; // 30 days in seconds
const OTP_EXPIRY  = 10 * 60 * 1000;     // 10 minutes

function signAccess(payload: { id: number; role: string; storeId?: number }) {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: ACCESS_TTL });
}

function generateOtp(): string {
  // HIGH-3: cryptographically secure 6-digit OTP
  return String(crypto.randomInt(100000, 1000000));
}

// ─── POST /auth/otp ─── Send OTP ──────────────────────────────────────────
router.post('/otp', async (req, res) => {
  const { phone, role = 'customer' } = req.body as { phone?: string; role?: string };
  if (!phone || !/^\d{10}$/.test(phone)) {
    res.status(400).json({ error: 'A valid 10-digit phone number is required.' });
    return;
  }
  if (!['customer', 'driver'].includes(role)) {
    res.status(400).json({ error: 'Invalid role.' });
    return;
  }

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY);

  // Invalidate previous OTPs for this phone + purge globally expired records
  await pool.query(`DELETE FROM otp_records WHERE phone=$1 OR expires_at < NOW()`, [phone]);

  await pool.query(
    `INSERT INTO otp_records (phone, otp, expires_at) VALUES ($1, $2, $3)`,
    [phone, otp, expiresAt]
  );

  try {
    await sendOtp(phone, otp);
  } catch (err) {
    console.error('[OTP] SMS delivery failed:', (err as Error).message);
    if (process.env.NODE_ENV === 'production') {
      res.status(502).json({ error: 'Could not send OTP. Please try again later.' });
      return;
    }

    console.warn('[OTP] Continuing in non-production mode with fallback delivery.');
  }

  res.json({
    message: 'OTP sent successfully.',
    // Return OTP in response only in non-production environments (dev/test convenience)
    ...(process.env.NODE_ENV !== 'production' ? { otp } : {}),
  });
});

// ─── POST /auth/otp/verify ─── Verify OTP → JWT ───────────────────────────
router.post('/otp/verify', async (req, res) => {
  const { phone, otp, role = 'customer', referredBy } = req.body as {
    phone?: string; otp?: string; role?: string; referredBy?: string;
  };

  if (!phone || !otp) {
    res.status(400).json({ error: 'Phone and OTP are required.' });
    return;
  }

  // HIGH-4: fetch record first to enforce attempt lockout
  const recordRes = await pool.query(
    `SELECT * FROM otp_records
     WHERE phone=$1 AND verified=FALSE AND expires_at > NOW()
     LIMIT 1`,
    [phone]
  );

  if (recordRes.rows.length === 0) {
    res.status(400).json({ error: 'Invalid or expired OTP.' });
    return;
  }

  const record = recordRes.rows[0];
  if (record.attempts >= 5) {
    res.status(429).json({ error: 'Too many OTP attempts. Please request a new OTP.' });
    return;
  }

  if (record.otp !== otp) {
    // Increment attempt counter on wrong guess
    await pool.query(`UPDATE otp_records SET attempts = attempts + 1 WHERE id=$1`, [record.id]);
    res.status(400).json({ error: 'Invalid or expired OTP.' });
    return;
  }

  // Mark OTP as verified
  await pool.query(`UPDATE otp_records SET verified=TRUE WHERE id=$1`, [record.id]);

  // Upsert user
  let userRow;
  const existing = await pool.query(`SELECT * FROM users WHERE phone=$1`, [phone]);
  if (existing.rows.length > 0) {
    userRow = existing.rows[0];
  } else {
    const ins = await pool.query(
      `INSERT INTO users (phone, role) VALUES ($1, $2) RETURNING *`,
      [phone, role]
    );
    userRow = ins.rows[0];

    // H-3: Apply referral reward if a valid referredBy code was given
    if (referredBy && typeof referredBy === 'string') {
      const referrerRes = await pool.query(
        `SELECT id FROM users WHERE referral_code=$1 LIMIT 1`,
        [referredBy.trim().toUpperCase()]
      );
      const referrer = referrerRes.rows[0];
      if (referrer && referrer.id !== userRow.id) {
        // Grant 200 coins to referrer, 100 to new user (non-fatal)
        await pool.query(
          `UPDATE users SET coins = coins + 200 WHERE id=$1`,
          [referrer.id]
        ).catch(() => {/* ignore */});
        await pool.query(
          `UPDATE users SET coins = coins + 100 WHERE id=$1`,
          [userRow.id]
        ).catch(() => {/* ignore */});
        await pool.query(
          `INSERT INTO referral_events (referrer_id, referee_id, coins_granted)
           VALUES ($1, $2, 200)
           ON CONFLICT (referee_id) DO NOTHING`,
          [referrer.id, userRow.id]
        ).catch(() => {/* ignore */});
      }
    }
  }

  // Look up store for merchant
  let storeId: number | undefined;
  if (userRow.role === 'merchant') {
    const storeRes = await pool.query(
      `SELECT id FROM stores WHERE owner_id=$1 LIMIT 1`,
      [userRow.id]
    );
    storeId = storeRes.rows[0]?.id;
  }

  const accessToken = signAccess({ id: userRow.id, role: userRow.role, storeId });

  // MED-2: store SHA-256 hash of refresh token, return the raw token to client
  const rawRefreshToken = crypto.randomBytes(40).toString('hex');
  const hashedRefreshToken = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token, expires_at)
     VALUES ($1, $2, NOW() + INTERVAL '30 days')`,
    [userRow.id, hashedRefreshToken]
  );

  res.json({
    accessToken,
    refreshToken: rawRefreshToken,
    user: {
      id: userRow.id,
      phone: userRow.phone,
      name: userRow.name,
      role: userRow.role,
    },
  });
});

// ─── POST /auth/login ─── Email + Password (admin / merchant) ─────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  const result = await pool.query(
    `SELECT * FROM users WHERE email=LOWER($1) AND role IN ('admin','merchant')`,
    [email]
  );
  const user = result.rows[0];
  if (!user) {
    res.status(401).json({ error: 'Invalid credentials.' });
    return;
  }
  if (!user.is_active) {
    res.status(403).json({ error: 'Account is disabled.' });
    return;
  }

  const match = await bcrypt.compare(password, user.password ?? '');
  if (!match) {
    res.status(401).json({ error: 'Invalid credentials.' });
    return;
  }

  let storeId: number | undefined;
  if (user.role === 'merchant') {
    const storeRes = await pool.query(
      `SELECT id FROM stores WHERE owner_id=$1 LIMIT 1`,
      [user.id]
    );
    storeId = storeRes.rows[0]?.id;
  }

  const accessToken = signAccess({ id: user.id, role: user.role, storeId });

  // MED-2: store SHA-256 hash of refresh token, return the raw token to client
  const rawRefreshLogin = crypto.randomBytes(40).toString('hex');
  const hashedRefreshLogin = crypto.createHash('sha256').update(rawRefreshLogin).digest('hex');
  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token, expires_at)
     VALUES ($1, $2, NOW() + INTERVAL '30 days')`,
    [user.id, hashedRefreshLogin]
  );

  res.json({
    accessToken,
    refreshToken: rawRefreshLogin,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      storeId,
    },
  });
});

// ─── POST /auth/refresh ─── Rotate access token ───────────────────────────
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body as { refreshToken?: string };
  if (!refreshToken) {
    res.status(400).json({ error: 'refreshToken required.' });
    return;
  }

  // MED-2: look up by SHA-256 hash of the raw token
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  const result = await pool.query(
    `SELECT rt.*, u.role FROM refresh_tokens rt
     JOIN users u ON u.id = rt.user_id
     WHERE rt.token=$1 AND rt.expires_at > NOW()`,
    [tokenHash]
  );
  if (result.rows.length === 0) {
    res.status(401).json({ error: 'Invalid or expired refresh token.' });
    return;
  }

  const row = result.rows[0];
  let storeId: number | undefined;
  if (row.role === 'merchant') {
    const sr = await pool.query(`SELECT id FROM stores WHERE owner_id=$1 LIMIT 1`, [row.user_id]);
    storeId = sr.rows[0]?.id;
  }

  // Rotate token — store hash of the new token
  const newRawRefresh = crypto.randomBytes(40).toString('hex');
  const newHashedRefresh = crypto.createHash('sha256').update(newRawRefresh).digest('hex');
  await pool.query(`DELETE FROM refresh_tokens WHERE id=$1`, [row.id]);
  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token, expires_at)
     VALUES ($1, $2, NOW() + INTERVAL '30 days')`,
    [row.user_id, newHashedRefresh]
  );

  const accessToken = signAccess({ id: row.user_id, role: row.role, storeId });
  res.json({ accessToken, refreshToken: newRawRefresh });
});

// ─── POST /auth/logout ───────────────────────────────────────────────────
router.post('/logout', requireAuth, async (req: AuthRequest, res) => {
  const { refreshToken } = req.body as { refreshToken?: string };
  if (refreshToken) {
    // MED-2: look up by hash
    const logoutHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await pool.query(
      `DELETE FROM refresh_tokens WHERE token=$1 AND user_id=$2`,
      [logoutHash, req.user!.id]
    ).catch(() => {/* ignore */});
  }
  res.json({ message: 'Logged out.' });
});

// ─── GET /auth/me ─────────────────────────────────────────────────────────
router.get('/me', requireAuth, async (req: AuthRequest, res) => {
  const result = await pool.query(
    `SELECT id, phone, email, name, role, coins FROM users WHERE id=$1`,
    [req.user!.id]
  );
  const user = result.rows[0];
  if (user) {
    try {
      user.loyaltyPoints = await getUserPoints(String(user.id));
    } catch {
      user.loyaltyPoints = 0;
    }
  }
  res.json({ user: user ?? null });
});

export default router;
