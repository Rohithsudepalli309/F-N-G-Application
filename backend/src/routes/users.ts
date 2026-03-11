import { Router } from 'express';
import pool from '../db';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

// ─── GET /users/favorites ─────────────────────────────────────────────────────
router.get('/favorites', async (req: AuthRequest, res) => {
  const result = await pool.query(
    `SELECT s.id, s.name, s.cuisine_tags, s.rating,
            s.delivery_time_min AS delivery_time, s.image_url, s.is_active
     FROM favourites f
     JOIN stores s ON s.id = f.store_id
     WHERE f.user_id=$1
     ORDER BY f.created_at DESC`,
    [req.user!.id]
  );
  res.json({ favorites: result.rows });
});

// ─── POST /users/favorites ─── Add a store to favourites ──────────────────────
router.post('/favorites', async (req: AuthRequest, res) => {
  const { storeId } = req.body as { storeId?: number };
  if (!storeId) {
    res.status(400).json({ error: 'storeId is required.' });
    return;
  }
  await pool.query(
    `INSERT INTO favourites (user_id, store_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
    [req.user!.id, storeId]
  );
  res.status(201).json({ ok: true });
});

// ─── DELETE /users/favorites/:storeId ─── Remove from favourites ─────────────
router.delete('/favorites/:storeId', async (req: AuthRequest, res) => {
  await pool.query(
    `DELETE FROM favourites WHERE user_id=$1 AND store_id=$2`,
    [req.user!.id, req.params.storeId]
  );
  res.json({ ok: true });
});

export default router;
