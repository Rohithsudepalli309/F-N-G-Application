/**
 * Network configuration for the driver app.
 *
 * Set these in a .env file at the driver-app-rn root or inline for dev:
 *   API_HOST=<your-machine-LAN-IP>  (real device on Wi-Fi)
 *   API_HOST=10.0.2.2               (Android emulator → host loopback)
 *   API_HOST=127.0.0.1              (iOS simulator after `adb reverse`)
 *
 * Production builds set __DEV__ = false; the prodOrigin is used.
 */
const DEV_HOST   = '192.168.1.100';  // <-- change to your dev machine's LAN IP
const DEV_PORT   = '3002';
const PROD_ORIGIN = 'https://api.fng.in';

export const BASE_ORIGIN: string = __DEV__
  ? `http://${DEV_HOST}:${DEV_PORT}`
  : PROD_ORIGIN;

export const API_URL     = `${BASE_ORIGIN}/api/v1`;
export const SOCKET_BASE = BASE_ORIGIN;
