import pool from '../db';
import { io } from '../server';

type NotificationType = 'order' | 'offer' | 'system' | 'delivery';

/**
 * Insert a notification row (non-fatal: errors are swallowed so callers never crash).
 */
export async function notifyUser(
  userId: number,
  title: string,
  body: string,
  type: NotificationType = 'order',
  data?: Record<string, string>
): Promise<void> {
  pool.query(
    `INSERT INTO notifications (user_id, title, body, type, data)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, title, body, type, data ? JSON.stringify(data) : null]
  ).then(() => {
    io.to(`user:${userId}`).emit('notification:new', {
      title,
      body,
      type,
      data: data ?? {},
      created_at: new Date().toISOString(),
    });
  }).catch(() => {/* non-critical */});
}
