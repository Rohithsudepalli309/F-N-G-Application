/**
 * api.ts — Axios instance with JWT bearer auth + silent token refresh.
 *
 * FLOW:
 *  1. Every request attaches `Authorization: Bearer <accessToken>` from the
 *     auth store.
 *  2. On 401, the interceptor calls POST /auth/refresh with the stored
 *     refreshToken, persists the new access + refresh tokens, retries the
 *     original request once.
 *  3. If refresh also fails, both tokens are cleared and the user is
 *     redirected to the login screen (via auth store `logout()`).
 */
import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';
import {API_URL} from '../config';
import {useAuthStore} from '../store/useAuthStore';

// Ensure this module is not imported before React Native is ready
const api = axios.create({
  baseURL: API_URL,
  timeout: 15_000,
  headers: {'Content-Type': 'application/json'},
});

// ── Request interceptor — attach access token ───────────────────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

// ── Response interceptor — handle 401 + refresh ─────────────────────────
let refreshing = false;
let waitQueue: Array<() => void> = [];

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & {_retry?: boolean};

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    // Mark request so we don't retry indefinitely
    original._retry = true;

    if (refreshing) {
      // Queue subsequent 401 requests until the refresh completes
      return new Promise<void>((resolve) => {
        waitQueue.push(resolve);
      }).then(() => api(original));
    }

    refreshing = true;
    try {
      const {refreshToken, setTokens, logout} = useAuthStore.getState();
      if (!refreshToken) {
        logout();
        return Promise.reject(error);
      }

      const res = await axios.post<{accessToken: string; refreshToken: string}>(
        `${API_URL}/auth/refresh`,
        {refreshToken},
      );

      setTokens(res.data.accessToken, res.data.refreshToken);

      // Resume queued requests
      waitQueue.forEach((resolve) => resolve());
      waitQueue = [];

      return api(original);
    } catch (_refreshError) {
      useAuthStore.getState().logout();
      return Promise.reject(error);
    } finally {
      refreshing = false;
    }
  },
);

export default api;
