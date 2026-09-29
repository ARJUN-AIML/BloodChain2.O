import axios from 'axios';

const resolveApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    if (typeof window !== 'undefined' && window.location) {
      const isRemoteDevice = window.location.hostname !== 'localhost' && 
                             window.location.hostname !== '127.0.0.1' && 
                             window.location.hostname !== '0.0.0.0';
      if (isRemoteDevice && (envUrl.includes('localhost') || envUrl.includes('127.0.0.1'))) {
        return '/api';
      }
    }
    return envUrl;
  }
  return '/api';
};

const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('bloodchain_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('bloodchain_token');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
