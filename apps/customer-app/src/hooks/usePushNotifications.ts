import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../services/api';
import { navigate } from '../navigation/navigationRef';

function handleNotificationTap(data?: Record<string, unknown>) {
  if (!data) return;
  const screen = data.screen as string | undefined;
  if (!screen) return;
  if (screen === 'OrderTracking' || screen === 'OrderDetail') {
    navigate(screen, data.orderId ? { orderId: data.orderId } : undefined);
  } else {
    navigate(screen);
  }
}

/**
 * usePushNotifications
 *
 * Handles the full FCM lifecycle:
 *  1. Request OS permission (iOS prompt / Android 13+ POST_NOTIFICATIONS)
 *  2. Obtain FCM token and register it with the F&G backend
 *  3. Refresh token listener (token rotation)
 *  4. Foreground message handler → in-app Alert
 *  5. Background / quit-state tap handler → deep-link ready
 */
export const usePushNotifications = () => {
  const { isAuthenticated, user } = useAuthStore((state: any) => ({
    isAuthenticated: state.isAuthenticated,
    user: state.user,
  }));
  const isRegistered = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // ── 1. Request permission ────────────────────────────────────────────────
    const setup = async () => {
      try {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (!enabled) {
          console.warn('[Push] Permission denied');
          return;
        }

        // ── 2. Get & register FCM token ──────────────────────────────────────
        if (!isRegistered.current) {
          const token = await messaging().getToken();
          await api.patch('/users/fcm-token', { token });
          isRegistered.current = true;
          console.log('[Push] Token registered');
        }
      } catch (err) {
        console.warn('[Push] Setup error:', err);
      }
    };

    setup();

    // ── 3. Token refresh ─────────────────────────────────────────────────────
    const unsubRefresh = messaging().onTokenRefresh(async (token) => {
      try {
        await api.patch('/users/fcm-token', { token });
        console.log('[Push] Token refreshed + re-registered');
      } catch (err) {
        console.warn('[Push] Token refresh registration failed:', err);
      }
    });

    // ── 4. Foreground messages ───────────────────────────────────────────────
    const unsubForeground = messaging().onMessage(async (remoteMessage) => {
      const title = remoteMessage.notification?.title ?? 'F&G';
      const body  = remoteMessage.notification?.body  ?? '';
      Alert.alert(title, body, [{ text: 'OK' }]);
    });

    // ── 5. Background / quit-state tap ───────────────────────────────────────
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('[Push] App opened from background:', remoteMessage.data);
      handleNotificationTap(remoteMessage.data as Record<string, unknown>);
    });

    messaging().getInitialNotification().then((remoteMessage) => {
      if (remoteMessage) {
        console.log('[Push] App opened from quit state:', remoteMessage.data);
        handleNotificationTap(remoteMessage.data as Record<string, unknown>);
      }
    });

    return () => {
      unsubRefresh();
      unsubForeground();
    };
  }, [isAuthenticated, user]);
};
