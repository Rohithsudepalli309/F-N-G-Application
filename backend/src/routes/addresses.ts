import { Router } from 'express';
import pool from '../db';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

// helper: normalise a row to the shape the frontend expects
function toClientAddress(row: Record<string, unknown>) {
  return {
    id:           row.id,
    label:        row.label,
    line1:        row.address_line,  // primary line (flat / street)
    line2:        row.line2 ?? null, // optional apartment / area
    landmark:     row.landmark ?? null,
    city:         row.city,
    pincode:      row.pincode,
    lat:          row.lat,
    lng:          row.lng,
    is_default:   row.is_default,
  };
}

// ─── GET /addresses ─── List user's saved addresses ──────────────────────
router.get('/', async (req: AuthRequest, res) => {
  const result = await pool.query(
    `SELECT id, label, address_line, line2, landmark, city, pincode, lat, lng, is_default
     FROM addresses WHERE user_id=$1 ORDER BY is_default DESC, created_at DESC`,
    [req.user!.id]
  );
  res.json({ addresses: result.rows.map(toClientAddress) });
});

// ─── POST /addresses ─── Add address ─────────────────────────────────────
router.post('/', async (req: AuthRequest, res) => {
  const {
    label = 'Home',
    line1, address_line,  // accept both names
    line2 = null, landmark = null,
    city, pincode, lat, lng, is_default = false,
  } = req.body as {
    label?: string; line1?: string; address_line?: string;
    line2?: string | null; landmark?: string | null;
    city?: string; pincode?: string;
    lat?: number; lng?: number; is_default?: boolean;
  };

  const addr = line1 ?? address_line;
  if (!addr) {
    res.status(400).json({ error: 'Address line (line1) is required.' });
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
      `INSERT INTO addresses (user_id, label, address_line, line2, landmark, city, pincode, lat, lng, is_default)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [req.user!.id, label, addr, line2 ?? null, landmark ?? null,
       city ?? null, pincode ?? null, lat ?? null, lng ?? null, is_default]
    );
    await client.query('COMMIT');
    res.status(201).json({ address: toClientAddress(result.rows[0]) });
  } catch {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Could not save address.' });
  } finally {
    client.release();
  }
});

// ─── PATCH /addresses/:id/default ─── Set as default ────────────────────
router.patch('/:id/default', async (req: AuthRequest, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`UPDATE addresses SET is_default=FALSE WHERE user_id=$1`, [req.user!.id]);
    const result = await client.query(
      `UPDATE addresses SET is_default=TRUE WHERE id=$1 AND user_id=$2 RETURNING *`,
      [id, req.user!.id]
    );
    await client.query('COMMIT');
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Address not found.' });
      return;
    }
    res.json({ address: toClientAddress(result.rows[0]) });
  } catch {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Could not update default address.' });
  } finally {
    client.release();
  }
});

// ─── PATCH /addresses/:id ─── Update address ─────────────────────────────
router.patch('/:id', async (req: AuthRequest, res) => {
  const { id } = req.params;
  const {
    label, line1, address_line,
    line2, landmark,
    city, pincode, lat, lng, is_default,
  } = req.body as {
    label?: string; line1?: string; address_line?: string;
    line2?: string | null; landmark?: string | null;
    city?: string; pincode?: string;
    lat?: number; lng?: number; is_default?: boolean;
  };
  const addr = line1 ?? address_line ?? null;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (is_default) {
      await client.query(
        `UPDATE addresses SET is_default=FALSE WHERE user_id=$1`,
        [req.user!.id]
      );
    }
    if (is_default) {
      await client.query(`UPDATE addresses SET is_default=FALSE WHERE user_id=$1`, [req.user!.id]);
    }
    const result = await client.query(
      `UPDATE addresses SET
         label        = COALESCE($1, label),
         address_line = COALESCE($2, address_line),
         line2        = COALESCE($3, line2),
         landmark     = COALESCE($4, landmark),
         city         = COALESCE($5, city),
         pincode      = COALESCE($6, pincode),
         lat          = COALESCE($7, lat),
         lng          = COALESCE($8, lng),
         is_default   = COALESCE($9, is_default)
       WHERE id=$10 AND user_id=$11
       RETURNING *`,
      [label ?? null, addr, line2 ?? null, landmark ?? null,
       city ?? null, pincode ?? null,
       lat ?? null, lng ?? null, is_default ?? null, id, req.user!.id]
    );
    await client.query('COMMIT');
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Address not found.' });
      return;
    }
    res.json({ address: toClientAddress(result.rows[0]) });
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
