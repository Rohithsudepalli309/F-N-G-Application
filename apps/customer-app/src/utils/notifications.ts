/**
 * FCM Push Notification Utility
 *
 * Setup complete:
 *  ✅ @react-native-firebase/app + messaging installed
 *  ✅ android/app/google-services.json in place (fill in real Firebase values)
 *  ✅ Google Services Gradle plugin applied
 *
 * Final step before push notifications work:
 *  → Replace android/app/google-services.json with the real file from
 *    https://console.firebase.google.com → Project Settings → Android app
 *  → Set FCM_SERVER_KEY in backend/.env (from Firebase → Cloud Messaging tab)
 */
import messaging from '@react-native-firebase/messaging';
import { api } from '../services/api';

/**
 * Request notification permission and register the FCM device token
 * with the backend. Call this once after a successful login.
 * Non-fatal — push notifications degrade gracefully if Firebase is not
 * yet fully configured (e.g. placeholder google-services.json).
 */
export const registerFcmToken = async (): Promise<void> => {
  try {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      console.log('[FCM] Notification permission not granted.');
      return;
    }

    const token = await messaging().getToken();
    if (!token) return;

    await api.post('/auth/fcm-token', { token });
    console.log('[FCM] Device token registered with backend.');
  } catch (err) {
    // Non-fatal — app works without push
    console.warn('[FCM] Token registration failed:', err);
  }
};

/**
 * Subscribe to foreground message handler.
 * Returns an unsubscribe function — call it on component unmount.
 *
 * Usage:
 *   useEffect(() => subscribeForegroundMessages((title, body) => showBanner(title, body)), []);
 */
export const subscribeForegroundMessages = (
  onMessage: (title: string, body: string, data: Record<string, string>) => void
): (() => void) => {
  const unsubscribe = messaging().onMessage(async (remoteMessage) => {
    const { title = '', body = '' } = remoteMessage.notification ?? {};
    onMessage(title, body, (remoteMessage.data ?? {}) as Record<string, string>);
  });
  return unsubscribe;
};

/**
 * Set a background/quit-state message handler.
 * Must be called outside of any React component (top-level in index.js).
 *
 * Usage in index.js:
 *   import { setBackgroundMessageHandler } from './src/utils/notifications';
 *   setBackgroundMessageHandler();
 */
export const setBackgroundMessageHandler = (): void => {
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    // Background messages are auto-displayed by the system.
    // Handle any data-only messages here (e.g. badge updates).
    console.log('[FCM] Background message:', remoteMessage.data);
  });
};
