import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach user timezone
api.interceptors.request.use((config) => {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (tz) {
    config.headers['x-timezone'] = tz;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || 'Something went wrong';
    
    // If unauthorized, redirect to login
    if (error.response?.status === 401) {
      // Don't redirect if already on auth pages
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject({ ...error, message });
  }
);

export default api;
