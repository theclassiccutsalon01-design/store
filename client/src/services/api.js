import axios from 'axios';

const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return String(import.meta.env.VITE_API_URL).trim();
  return '/api';
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
