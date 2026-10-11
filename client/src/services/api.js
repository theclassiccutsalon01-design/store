import axios from 'axios';

const getBaseUrl = () => {
  let url = import.meta.env.VITE_API_URL ? String(import.meta.env.VITE_API_URL).trim() : '';

  if (!url) {
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return 'https://the-classic-cut-salon-api.onrender.com/api';
    }
    return '/api';
  }

  // Remove any trailing slashes
  url = url.replace(/\/+$/, '');

  // If user provided domain without /api (e.g. https://xxx.onrender.com), auto-append /api
  if (url.startsWith('http') && !url.endsWith('/api')) {
    url = `${url}/api`;
  }

  return url;
};

const API = axios.create({
  baseURL: getBaseUrl(),
});

// Request interceptor to attach JWT token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('classic_cut_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;
