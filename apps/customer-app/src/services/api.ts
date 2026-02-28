import axios from 'axios';
// In a real RN app, use react-native-keychain or AsyncStorage
import { getToken } from '../utils/storage'; 

import { Platform } from 'react-native';

// For Physical Devices via USB or Wi-Fi: Use the actual local IP address
const BASE_HOST = '192.168.221.78'; 

export const API_URL = `http://${BASE_HOST}:3000/api/v1`;

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

// 2. Response Interceptor: Error Handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Permanent Permanent Solution: Catch all Network/API errors
    // so they don't bubble up as unhandled promise rejections
    const originalRequest = error.config;
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error(`[API Error] ${error.response.status}: ${originalRequest?.url}`, error.response.data);
      
      if (error.response.status === 401) {
        console.warn('Session expired, please login again.');
        // Optional: Trigger global logout event
      } else if (error.response.status === 403) {
        console.error('Permission denied or Security block.');
      } else if (error.response.status === 500) {
        console.error('Server side explosion.');
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error(`[API Network Error] No response from: ${originalRequest?.url}`);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('[API Setup Error]', error.message);
    }

    // Always return a rejected promise with a clean error object
    // to prevent .map() or .length checks on undefined from crashing the UI
    return Promise.reject({
      ...error,
      handled: true, // Marker for screens to know this was already logged
      message: error.response?.data?.error || error.message || 'Network connectivity issue'
    });
  }
);
