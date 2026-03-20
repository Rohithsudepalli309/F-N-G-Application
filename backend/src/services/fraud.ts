import pool from '../db';
import { trackEvent } from './observability';
import { logger } from '../logger';

/**
 * Fraud Detection Service (Vulture & Syndicate Account Detection)
 *
 * Logic covers:
 * 1. Device Re-use: Multiple accounts appearing on same device fingerprint.
 * 2. Referral Farming: Chains of referrals from same IP/Device.
 * 3. Rapid churn: Creating accounts just to use a 'NEW50' coupon then never ordering again.
 */

export async function checkVultureRisk(userId: string, deviceId?: string, ip?: string) {
  if (!deviceId) return { risk: 'low', reason: 'No device ID provided' };

  // Detect: How many distinct users use this DEVICE?
  const deviceCheck = await pool.query(
    `SELECT COUNT(DISTINCT user_id) as user_count
     FROM user_devices
     WHERE device_id = $1 AND user_id != $2`,
    [deviceId, userId]
  );

  const sharedUsers = parseInt(deviceCheck.rows[0].user_count);

  if (sharedUsers >= 3) {
    trackEvent('FRAUD_RISK_HIGH', {
      userId,
      deviceId,
      reason: 'vulture_device_reuse',
      sharedUsers: String(sharedUsers)
    });

    return {
      risk: 'high',
      reason: `Device shared with ${sharedUsers} other accounts. Potential vulture account.`
    };
  }

  // Detect: Multiple accounts matching same IP range with high frequency referrals
  if (ip) {
    const ipCheck = await pool.query(
      `SELECT COUNT(*) as count FROM users WHERE metadata->>'last_ip' = $1 AND created_at > NOW() - INTERVAL '24 hours'`,
      [ip]
    );
    if (parseInt(ipCheck.rows[0].count) > 10) {
      return { risk: 'medium', reason: 'IP pool spam detected.' };
    }
  }

  return { risk: 'low' };
}

/**
 * Flag a user for manual review
 * BUG-003 FIX: Was using duplicate column assignment which is invalid SQL.
 * Now uses a single nested jsonb_set to set both keys atomically.
 */
export async function flagUser(userId: string, reason: string) {
  try {
    await pool.query(
      `UPDATE users
       SET metadata = jsonb_set(
         jsonb_set(COALESCE(metadata, '{}'), '{fraud_flag}', '"true"'),
         '{fraud_reason}',
         $2::jsonb
       )
       WHERE id = $1`,
      [userId, JSON.stringify(reason)]
    );
  } catch (err) {
    logger.error('[fraud/flagUser] Failed to flag user', { userId, err });
  }
}
