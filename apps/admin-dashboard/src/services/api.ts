import axios from 'axios';

// API configuration
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3002/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // SEC-005: send httpOnly cookies automatically
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: no longer needed for tokens since we use httpOnly cookies
api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

// Response interceptor for auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear generic storage but the cookie is httpOnly (browser clears it if expired)
      localStorage.removeItem('admin-auth-storage');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
