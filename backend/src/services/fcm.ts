import admin from 'firebase-admin';
import pool from '../db';
import { io } from '../server';

let initialized = false;

// ── Notification type helper ──────────────────────────────────────────────────
type NotifType = 'order' | 'offer' | 'system' | 'delivery';

function inferType(data: Record<string, string>): NotifType {
  if (data.screen === 'OrderTracking') return 'delivery';
  if (data.screen === 'Orders')        return 'order';
  return 'system';
}

/**
 * Persist a notification to the DB so the in-app inbox always works,
 * regardless of whether FCM is configured.
 */
async function saveNotification(
  userId: number,
  title: string,
  body: string,
  type: NotifType,
  data: Record<string, string>
): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO notifications (user_id, title, body, type, data)
       VALUES ($1,$2,$3,$4,$5)`,
      [userId, title, body, type, JSON.stringify(data)]
    );
    io.to(`user:${userId}`).emit('notification:new', {
      title,
      body,
      type,
      data,
      created_at: new Date().toISOString(),
    });
  } catch {/* non-critical — notifications table may not be migrated yet */}
}

export function initFCM(): void {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    console.log('[FCM] FIREBASE_SERVICE_ACCOUNT_JSON not set — push notifications disabled');
    return;
  }
  try {
    const serviceAccount = JSON.parse(raw) as admin.ServiceAccount;
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    initialized = true;
    console.log('[FCM] Firebase Admin initialized');
  } catch (e) {
    console.warn('[FCM] Init failed:', (e as Error).message);
  }
}

export async function sendPushToUser(
  userId: number,
  title: string,
  body: string,
  data: Record<string, string> = {}
): Promise<void> {
  const type = inferType(data);

  // Always persist to the DB notification inbox (FCM optional)
  await saveNotification(userId, title, body, type, data);

  if (!initialized) return;
  try {
    const r = await pool.query(`SELECT fcm_token FROM users WHERE id=$1`, [userId]);
    const token: string | null = r.rows[0]?.fcm_token ?? null;
    if (!token) return;
    await admin.messaging().send({
      token,
      notification: { title, body },
      data,
      android: { priority: 'high', notification: { sound: 'default' } },
      apns: { payload: { aps: { sound: 'default', badge: 1 } } },
    });
  } catch (e) {
    // Non-fatal — stale tokens are common; log and continue
    console.warn('[FCM] Send failed for user', userId, (e as Error).message);
  }
}

export async function sendPushToMany(
  userIds: number[],
  title: string,
  body: string,
  data: Record<string, string> = {}
): Promise<void> {
  await Promise.all(userIds.map((id) => sendPushToUser(id, title, body, data)));
}
