import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (identifier: string, password: string, role: 'admin' | 'teacher' | 'student') => {
    return api.post(`/auth/${role}/login`, { identifier, password });
  },
  getProfile: (role: 'admin' | 'teacher' | 'student') => {
    return api.get(`/${role}/profile`);
  },
  forgotPassword: (target: string) => {
    return api.post('/auth/forgot-password', { target });
  },
  verifyOtp: (target: string, otp: string) => {
    return api.post('/auth/verify-otp', { target, otp });
  },
  resetPassword: (target: string, token: string, newPassword: string) => {
    return api.post('/auth/reset-password', { target, token, newPassword });
  },
};

export default api;
