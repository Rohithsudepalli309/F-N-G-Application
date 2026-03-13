import pool from '../db';
import { trackEvent } from './observability';

/**
 * Advanced Loyalty Engine
 * 
 * Logic covers:
 * 1. "First Month Free": Check user age; if < 30 days, waive delivery fee.
 * 2. "Order Streak": Check total COMPLETED orders; if next order is multiple of 5, apply 10% discount.
 * 3. "Loyalty Points": Convert amount spent to points (₹100 = 1 point).
 */

export async function calculateLoyaltyBenefits(userId: string, subtotal: number) {
  let deliveryFeeOverride = null;
  let autoDiscount = 0;
  let reason = [];

  // 1. First Month Free Logic
  const userRes = await pool.query(`SELECT created_at FROM users WHERE id = $1`, [userId]);
  if (userRes.rows.length > 0) {
    const createdAt = new Date(userRes.rows[0].created_at);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    if (createdAt > thirtyDaysAgo) {
      deliveryFeeOverride = 0;
      reason.push('New User: First Month Free Delivery');
    }
  }

  // 2. Order Streak Logic (Every 5th order is 10% off)
  const orderCountRes = await pool.query(
    `SELECT COUNT(*) FROM orders WHERE customer_id = $1 AND status = 'delivered'`,
    [userId]
  );
  const completedCount = parseInt(orderCountRes.rows[0].count);
  if (completedCount > 0 && (completedCount + 1) % 5 === 0) {
    autoDiscount = Math.round(subtotal * 0.10);
    reason.push('Loyalty Streak: 10% Off on your 5th order!');
  }

  if (reason.length > 0) {
    trackEvent('LOYALTY_BENEFITS_APPLIED', { userId, benefits: reason.join(', ') });
  }

  return { deliveryFeeOverride, autoDiscount, reason };
}
