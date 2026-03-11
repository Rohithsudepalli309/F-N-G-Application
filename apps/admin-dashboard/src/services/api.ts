import axios from 'axios';

// API configuration
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3002/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for JWT
api.interceptors.request.use(
  (config) => {
    const stored = localStorage.getItem('admin-auth-storage');
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
  },
  (error) => Promise.reject(error)
);

// Response interceptor for auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin-auth-storage');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
