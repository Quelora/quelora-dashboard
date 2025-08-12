// ./src/api/users.js
import api from './axiosConfig';


export const getUsersByClient = async (clientId, payload) => {
  try {
    const response = await api.get(`/client/users?cid=${clientId}&search=${payload.search || ''}&page=${payload.page || 1 }&limit=${payload.limit || 10 }`);
    return response.data;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

export const banUser = async (userId) => {
  return api.patch(`/client/users/${userId}/ban`);
}