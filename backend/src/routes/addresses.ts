import { Router } from 'express';
import pool from '../db';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

// ─── GET /addresses ─── List user's saved addresses ──────────────────────
router.get('/', async (req: AuthRequest, res) => {
  const result = await pool.query(
    `SELECT id, label, address_line, city, pincode, lat, lng, is_default
     FROM addresses WHERE user_id=$1 ORDER BY is_default DESC, created_at DESC`,
    [req.user!.id]
  );
  res.json({ addresses: result.rows });
});

// ─── POST /addresses ─── Add address ─────────────────────────────────────
router.post('/', async (req: AuthRequest, res) => {
  const { label = 'Home', address_line, city, pincode, lat, lng, is_default = false } = req.body as {
    label?: string; address_line: string; city?: string; pincode?: string;
    lat?: number; lng?: number; is_default?: boolean;
  };

  if (!address_line) {
    res.status(400).json({ error: 'address_line is required.' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (is_default) {
      await client.query(
        `UPDATE addresses SET is_default=FALSE WHERE user_id=$1`,
        [req.user!.id]
      );
    }
    const result = await client.query(
      `INSERT INTO addresses (user_id, label, address_line, city, pincode, lat, lng, is_default)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.user!.id, label, address_line, city ?? null, pincode ?? null,
       lat ?? null, lng ?? null, is_default]
    );
    await client.query('COMMIT');
    res.status(201).json({ address: result.rows[0] });
  } catch {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Could not save address.' });
  } finally {
    client.release();
  }
});

// ─── PATCH /addresses/:id ─── Update address ─────────────────────────────
router.patch('/:id', async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { label, address_line, city, pincode, lat, lng, is_default } = req.body as {
    label?: string; address_line?: string; city?: string; pincode?: string;
    lat?: number; lng?: number; is_default?: boolean;
  };

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (is_default) {
      await client.query(
        `UPDATE addresses SET is_default=FALSE WHERE user_id=$1`,
        [req.user!.id]
      );
    }
    const result = await client.query(
      `UPDATE addresses SET
         label        = COALESCE($1, label),
         address_line = COALESCE($2, address_line),
         city         = COALESCE($3, city),
         pincode      = COALESCE($4, pincode),
         lat          = COALESCE($5, lat),
         lng          = COALESCE($6, lng),
         is_default   = COALESCE($7, is_default)
       WHERE id=$8 AND user_id=$9
       RETURNING *`,
      [label ?? null, address_line ?? null, city ?? null, pincode ?? null,
       lat ?? null, lng ?? null, is_default ?? null, id, req.user!.id]
    );
    await client.query('COMMIT');
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Address not found.' });
      return;
    }
    res.json({ address: result.rows[0] });
  } catch {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Could not update address.' });
  } finally {
    client.release();
  }
});

// ─── DELETE /addresses/:id ────────────────────────────────────────────────
router.delete('/:id', async (req: AuthRequest, res) => {
  await pool.query(
    `DELETE FROM addresses WHERE id=$1 AND user_id=$2`,
    [req.params.id, req.user!.id]
  );
  res.json({ message: 'Address deleted.' });
});

export default router;
