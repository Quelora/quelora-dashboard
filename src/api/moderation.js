// ./src/api/moderation.js
import api from './axiosConfig';

export const moderation = async (cid, text, config) => {
  try {
    const response = await api.post('/client/moderation', { cid, text, config });
    return response.data;

  } catch (error) {
    throw new Error("Connection error");
  }
};
