/**
 * Network configuration — reads from .env (via babel-plugin-dotenv-import).
 *
 * To switch environments edit .env in the customer-app root:
 *   API_HOST=<your-machine-LAN-IP>  (Wi-Fi)
 *   API_HOST=127.0.0.1              (USB after `adb reverse tcp:3002 tcp:3002`)
 *   API_HOST=10.0.2.2               (Android emulator)
 *
 * Production builds use API_PROD_ORIGIN automatically via __DEV__ flag.
 */
import { API_HOST, API_PORT, API_PROD_ORIGIN } from '@env';

const host       = API_HOST       ?? '192.168.221.78';
const port       = API_PORT       ?? '3002';
const prodOrigin = API_PROD_ORIGIN ?? 'https://api.fng.in';

export const BASE_ORIGIN = __DEV__
  ? `http://${host}:${port}`
  : prodOrigin;

export const API_URL     = `${BASE_ORIGIN}/api/v1`;
export const SOCKET_BASE = BASE_ORIGIN;
