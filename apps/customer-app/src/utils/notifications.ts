/**
 * FCM Push Notification Utility
 *
 * To activate:
 *  1. Install: pnpm add @react-native-firebase/app @react-native-firebase/messaging
 *  2. Add google-services.json to android/app/
 *  3. Follow RN Firebase setup: https://rnfirebase.io/
 *  4. Uncomment the firebase import blocks below.
 */
import { api } from '../services/api';

// ── Step 1: Uncomment once firebase is installed ──────────────────────────────
// import messaging from '@react-native-firebase/messaging';

/**
 * Request notification permission and register the FCM device token
 * with the backend. Call this once after a successful login.
 */
export const registerFcmToken = async (): Promise<void> => {
  try {
    // ── Step 2: Replace the stub below with the real FCM call ──────────────
    // const authStatus = await messaging().requestPermission();
    // const enabled =
    //   authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    //   authStatus === messaging.AuthorizationStatus.PROVISIONAL;
    // if (!enabled) return;
    // const token = await messaging().getToken();

    // ── Stub: remove once real firebase token retrieval is wired in ─────────
    const token: string | null = null;
    if (!token) return; // No-op until Firebase is configured

    await api.post('/auth/fcm-token', { token });
    console.log('[FCM] Device token registered with backend.');
  } catch (err) {
    // Non-fatal — push notifications degrade gracefully
    console.warn('[FCM] Token registration failed:', err);
  }
};

/**
 * Subscribe to foreground message handler.
 * Returns an unsubscribe function — call it on component unmount.
 */
export const subscribeForegroundMessages = (
  onMessage: (title: string, body: string, data: Record<string, string>) => void
): (() => void) => {
  // ── Uncomment once @react-native-firebase/messaging is installed ──────────
  // const unsubscribe = messaging().onMessage(async (remoteMessage) => {
  //   const { title = '', body = '' } = remoteMessage.notification ?? {};
  //   onMessage(title, body, (remoteMessage.data ?? {}) as Record<string, string>);
  // });
  // return unsubscribe;

  // Stub no-op until Firebase is configured
  return () => {};
};
