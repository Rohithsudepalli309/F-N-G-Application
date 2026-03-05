import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api/v1';

const api = axios.create({ baseURL: BASE_URL });

// Attach stored JWT to every request
api.interceptors.request.use((config) => {
  const stored = localStorage.getItem('merchant_auth');
  if (stored) {
    try {
      const { state } = JSON.parse(stored) as { state: { token: string } };
      if (state?.token) {
        config.headers.Authorization = `Bearer ${state.token}`;
      }
    } catch {
      // Ignore malformed storage
    }
  }
  return config;
});

// Auto-redirect on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('merchant_auth');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
