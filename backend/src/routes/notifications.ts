import { Router } from 'express';
import pool from '../db';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

// ─── GET /notifications ───────────────────────────────────────────────────────
router.get('/', async (req: AuthRequest, res) => {
  const { limit = '30', offset = '0' } = req.query as Record<string, string>;
  const result = await pool.query(
    `SELECT id, title, body, type, is_read, data, created_at
     FROM notifications
     WHERE user_id=$1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [req.user!.id, Number(limit), Number(offset)]
  );
  res.json({ notifications: result.rows });
});

// ─── PATCH /notifications/read-all ────────────────────────────────────────────
router.patch('/read-all', async (req: AuthRequest, res) => {
  await pool.query(
    `UPDATE notifications SET is_read=TRUE WHERE user_id=$1 AND is_read=FALSE`,
    [req.user!.id]
  );
  res.json({ ok: true });
});

// ─── PATCH /notifications/:id/read ───────────────────────────────────────────
router.patch('/:id/read', async (req: AuthRequest, res) => {
  await pool.query(
    `UPDATE notifications SET is_read=TRUE WHERE id=$1 AND user_id=$2`,
    [req.params.id, req.user!.id]
  );
  res.json({ ok: true });
});

// ─── DELETE /notifications/clear ─── Delete all read notifications ───────────────────
router.delete('/clear', async (req: AuthRequest, res) => {
  await pool.query(
    `DELETE FROM notifications WHERE user_id=$1 AND is_read=TRUE`,
    [req.user!.id]
  );
  res.json({ ok: true });
});

export default router;
