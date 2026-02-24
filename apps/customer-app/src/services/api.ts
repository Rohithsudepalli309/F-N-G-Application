import axios from 'axios';
// In a real RN app, use react-native-keychain or AsyncStorage
import { getToken } from '../utils/storage'; 

import { Platform } from 'react-native';

const API_URL = Platform.OS === 'android' 
  ? 'http://10.0.2.2:3000/api/v1' 
  : 'http://localhost:3000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
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

// 2. Response Interceptor: Error Handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle Token Expiry (Logout logic here)
      console.warn('Session expired, please login again.');
    }
    return Promise.reject(error);
  }
);
