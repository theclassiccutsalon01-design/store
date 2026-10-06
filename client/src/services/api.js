import axios from 'axios';

const getBaseUrl = () => {
  let url = import.meta.env.VITE_API_URL ? String(import.meta.env.VITE_API_URL).trim() : '';

  if (!url) {
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
