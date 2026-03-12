import { Router } from 'express';
import pool from '../db';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

// ─── GET /wallet/balance ─── Current wallet balance + recent transactions ────
router.get('/balance', async (req: AuthRequest, res) => {
  try {
    // Ensure wallet row exists
    await pool.query(
      `INSERT INTO wallets (user_id, balance) VALUES ($1, 0)
       ON CONFLICT (user_id) DO NOTHING`,
      [req.user!.id]
    );
    const walletRes = await pool.query(
      `SELECT id, balance FROM wallets WHERE user_id=$1`,
      [req.user!.id]
    );
    const wallet = walletRes.rows[0];

    const txRes = await pool.query(
      `SELECT id, amount, type, reference_id, note, created_at
       FROM wallet_transactions
       WHERE wallet_id=$1
       ORDER BY created_at DESC
       LIMIT 20`,
      [wallet.id]
    );

    res.json({
      balance: wallet.balance,
      transactions: txRes.rows,
    });
  } catch (err) {
    console.error('[wallet/balance] error:', err);
    res.status(500).json({ error: 'Could not fetch wallet balance.' });
  }
});

// ─── POST /wallet/topup ─── Credit wallet after Razorpay payment verified ────
router.post('/topup', async (req: AuthRequest, res) => {
  const { amount, razorpayPaymentId } = req.body as {
    amount?: number;
    razorpayPaymentId?: string;
  };
  if (!amount || amount < 100) {
    res.status(400).json({ error: 'Minimum top-up is ₹1 (100 paise).' });
    return;
  }
  if (!razorpayPaymentId) {
    res.status(400).json({ error: 'razorpayPaymentId is required.' });
    return;
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Ensure wallet exists
    await client.query(
      `INSERT INTO wallets (user_id, balance) VALUES ($1, 0)
       ON CONFLICT (user_id) DO NOTHING`,
      [req.user!.id]
    );
    const walletRes = await client.query(
      `UPDATE wallets SET balance = balance + $1, updated_at=NOW()
       WHERE user_id=$2 RETURNING id, balance`,
      [amount, req.user!.id]
    );
    const wallet = walletRes.rows[0];
    await client.query(
      `INSERT INTO wallet_transactions (wallet_id, amount, type, reference_id, note)
       VALUES ($1, $2, 'credit', $3, 'Wallet top-up')`,
      [wallet.id, amount, razorpayPaymentId]
    );
    await client.query('COMMIT');
    res.json({ balance: wallet.balance });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[wallet/topup] error:', err);
    res.status(500).json({ error: 'Could not process top-up.' });
  } finally {
    client.release();
  }
});

export default router;
