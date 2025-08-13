// ./src/api/vapid.js
import api from './axiosConfig';

export const vapid = async (cid, author, title, body) => {
  try {
    const response = await api.post('/notifications/send', { cid, author, title, body });
    return response.data;
  } catch (error) {
    throw new Error("Connection error");
  }
};

export const searchAuthors = async (searchTerm) => {
  try {
    const response = await api.get('/notifications/search', {
      params: { name: searchTerm }
    });
    return response.data;
  } catch (error) {
    throw new Error("Author search error");
  }
};

export const generateVapidKeys = async () => {
  try {
    const response = await api.get('/notifications/generate-vapid-keys');
    return response.data;
  } catch (error) {
    throw new Error("VAPID keys generation error");
  }
};