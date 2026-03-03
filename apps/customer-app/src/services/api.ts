import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getToken, saveToken } from '../utils/storage';

// ─── Network Config ──────────────────────────────────────────────────────────
// For physical device via USB:  adb reverse tcp:3002 tcp:3002, then use 127.0.0.1
// For physical device via Wi-Fi: use your machine's LAN IP (e.g. 192.168.1.x)
// For Android Emulator:         use 10.0.2.2
// Docker backend is mapped to host port 3002.
const BASE_HOST = '192.168.221.78';
const BASE_PORT = '3002';

export const API_URL     = `http://${BASE_HOST}:${BASE_PORT}/api/v1`;
export const SOCKET_BASE = `http://${BASE_HOST}:${BASE_PORT}`;

export const api = axios.create({
  baseURL: API_URL, 
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, 
});

// 1. Request Interceptor: Attach Token
api.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 2. Response Interceptor: Auto Token Refresh + Error Handling
let _isRefreshing = false;
let _failedQueue: { resolve: Function; reject: Function }[] = [];

const processQueue = (error: any, token: string | null = null) => {
  _failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  _failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // ── Auto-refresh on 401 ──────────────────────────────────────────────
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (_isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve, reject) => {
          _failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      _isRefreshing = true;
      try {
        const refreshToken = await AsyncStorage.getItem('refresh_token');
        if (!refreshToken) throw new Error('No refresh token');
        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        const newToken = data.tokens?.accessToken || data.accessToken;
        await saveToken(newToken);
        await AsyncStorage.setItem('refresh_token', data.tokens?.refreshToken || data.refreshToken || refreshToken);
        api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        // Clear auth and let app re-login
        await AsyncStorage.multiRemove(['auth_token', 'refresh_token']);
        console.warn('[Auth] Refresh failed — user must re-login.');
      } finally {
        _isRefreshing = false;
      }
    }

    // ── General error logging ────────────────────────────────────────────
    if (error.response) {
      console.error(`[API ${error.response.status}] ${originalRequest?.url}`, error.response.data);
      if (error.response.status === 403) console.error('Permission denied.');
      if (error.response.status === 500) console.error('Server error.');
    } else if (error.request) {
      console.error(`[API Network] No response: ${originalRequest?.url}`);
    } else {
      console.error('[API Setup]', error.message);
    }

    return Promise.reject({
      ...error,
      handled: true,
      message: error.response?.data?.error || error.message || 'Network connectivity issue',
    });
  }
);
