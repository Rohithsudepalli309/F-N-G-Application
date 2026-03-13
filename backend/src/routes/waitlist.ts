import { Router, Request, Response } from 'express';
import pool from '../db';
import { validate } from '../utils/validation';
import { z } from 'zod';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// Waitlist Schema
const waitlistSchema = z.object({
  body: z.object({
    email: z.string().email(),
    phone: z.string().regex(/^\d{10}$/),
    city: z.string().min(2),
    pincode: z.string().length(6),
  }),
});

// POST /api/v1/waitlist - Joining the pre-launch waitlist
router.post('/', validate(waitlistSchema), async (req: Request, res, next) => {
  const { email, phone, city, pincode } = req.body;

  try {
    // Check if duplicate
    const existing = await pool.query(
        'SELECT id FROM waitlist WHERE email = $1 OR phone = $2',
        [email, phone]
    );

    if (existing.rows.length > 0) {
        return next(new AppError('You are already on the waitlist! We will notify you soon.', 400));
    }

    await pool.query(
      'INSERT INTO waitlist (email, phone, city, pincode) VALUES ($1, $2, $3, $4)',
      [email, phone, city, pincode]
    );

    res.status(201).json({ 
        message: "Successfully joined F&G Waitlist. You'll be the first to know when we launch in your area!",
        priority: true
    });
  } catch (err) {
    next(err);
  }
});

export default router;
