/**
 * utils/api.js — Axios Instance with JWT Interceptor
 * All API calls should use this instance so the auth token is always attached.
 */

import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach the stored JWT to every outgoing request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('nex_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global response error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired — clear storage so AuthContext picks it up on  next render
      localStorage.removeItem('nex_token');
    }
    return Promise.reject(error);
  }
);

export default api;
