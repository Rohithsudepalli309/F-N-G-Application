import pool from '../db';

/**
 * Earn points for a given order (Default 1 point per $1 spent)
 */
export async function earnPoints(userId: string, orderId: string, amount: number) {
  const points = Math.floor(amount);
  if (points <= 0) return;

  try {
    await pool.query(
      `INSERT INTO loyalty_points (user_id, order_id, points, transaction_type)
       VALUES ($1, $2, $3, 'earned')`,
      [userId, orderId, points]
    );
  } catch (error: any) {
    if (error?.code !== '42P01') {
      throw error;
    }
  }
}

/**
 * Get total unspent points for a user
 */
export async function getUserPoints(userId: string): Promise<number> {
  const result = await pool.query(
    `SELECT COALESCE(SUM(points), 0) as balance FROM loyalty_points WHERE user_id = $1`,
    [userId]
  );
  const balance = result.rows[0]?.balance;
  return Number.parseInt(String(balance ?? '0'), 10) || 0;
}

/**
 * Redeem loyalty points (100 points = $1 discount)
 */
export async function redeemPoints(userId: string, points: number): Promise<boolean> {
  const balance = await getUserPoints(userId);
  if (balance < points) return false;

  await pool.query(
    `INSERT INTO loyalty_points (user_id, points, transaction_type)
     VALUES ($1, $2, 'redeemed')`,
    [userId, -points]
  );
  return true;
}
