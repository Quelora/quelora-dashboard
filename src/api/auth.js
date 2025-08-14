// ./src/api/auth.js
import api from './axiosConfig';

export const login = async (username, password) => {
  try {
    const response = await api.post('/auth/generate-token', { username, password });
    return {
      token: response.data.token,
      clients: response.data.clients || [],
      expiresIn: response.data.expiresIn || '2h'
    };
  } catch (error) {
    if (error.response?.status === 401) {
      throw new Error("Invalid credentials");
    }
    throw new Error("Connection error");
  }
};

export const renewToken = async (expiredToken) => {
  try {
    const response = await api.post('/auth/renew-token', { expiredToken });
    sessionStorage.setItem('token', response.data.token);
    sessionStorage.setItem('tokenExpiration', Date.now() + 7200000); // 2 hours in ms
    return response.data;
  } catch (error) {
    console.error('Token renewal failed:', error);
    throw error;
  }
};

export const checkTokenExpiration = async () => {
  const expiration = sessionStorage.getItem('tokenExpiration');
  if (!expiration) return;

  const timeLeft = parseInt(expiration) - Date.now();
  const token = sessionStorage.getItem('token');

  if (timeLeft < 600000 && timeLeft > 0) { // 10 minutes left
    try {
      await renewToken(token);
    } catch (error) {
      console.error('Failed to renew token:', error);
    }
  } else if (timeLeft <= 0) {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('tokenExpiration');
    sessionStorage.removeItem('clients');
    window.location.href = '/login';
  }
};

export const changePassword = async (currentPassword, newPassword) => {
  try {
    const response = await api.post('/auth/change-password', {
      currentPassword,
      newPassword
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || "Error changing password";
  }
};

export const upsertClient = async (cid, description, apiUrl, config, vapid, postConfig, email) => {
  try {
    const response = await api.post('/client/upsert', {
      cid,
      description,
      apiUrl,
      config,
      vapid,
      email,
      postConfig
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || "Error upserting client";
  }
};

export const deleteClient = async (cid) => {
  try {
    const response = await api.delete(`/client/delete/${cid}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || "Error deleting client";
  }
};
