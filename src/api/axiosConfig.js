// ./src/api/axiosConfig.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

api.interceptors.request.use(config => {
  const token = sessionStorage.getItem('token');
  const cid = sessionStorage.getItem('currentCid');
  
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  
  if (cid) {
    config.headers['X-Client-Id'] = cid;
  }
  
  return config;
}, error => {
  return Promise.reject(error);
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('currentCid');
      sessionStorage.removeItem('tokenExpiration');
      sessionStorage.removeItem('clients');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;