import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

// ─── GET /payment-methods ─── Saved payment methods for the authenticated user
// MVP: saved-card storage requires Razorpay advanced customer/token APIs.
// Returning an empty list here ensures the screen renders gracefully instead of crashing.
router.get('/', async (_req: AuthRequest, res) => {
  res.json({ methods: [] });
});

// ─── DELETE /payment-methods/:id ─── Remove a saved method (no-op for MVP)
router.delete('/:id', async (req: AuthRequest, res) => {
  const { id } = req.params;
  if (!id) {
    res.status(400).json({ error: 'Method id is required.' });
    return;
  }
  // Actual deletion would call Razorpay customer token delete API.
  res.json({ success: true, id });
});

export default router;
