import axios from 'axios';

// Always use relative /api path so Vite proxy handles it (avoids CORS entirely)
const api = axios.create({
  baseURL: '/api',
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
