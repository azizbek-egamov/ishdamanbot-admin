import axios from 'axios';

const getApiBaseUrl = () => {
  const envApi = import.meta.env.VITE_API_URL;
  if (envApi && (envApi.startsWith('http://') || envApi.startsWith('https://'))) {
    return envApi.replace(/\/+$/, '');
  }

  const envBackend = import.meta.env.VITE_BACKEND_URL;
  if (envBackend && (envBackend.startsWith('http://') || envBackend.startsWith('https://'))) {
    return `${envBackend.replace(/\/+$/, '')}/api`;
  }

  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return '/api';
    }
  }

  return 'https://core.ishdaman.uz/api';
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('th_admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 - redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('th_admin_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
