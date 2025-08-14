// ./src/api/email.js
import api from './axiosConfig';

export const email = async (cid, email, title, body) => {
  try {
    const response = await api.post('/notifications/send-mail', { cid, email, title, body });
    return response.data;
  } catch (error) {
    throw new Error("Connection error");
  }
};