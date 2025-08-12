// ./src/api/posts.js
import api from './axiosConfig';

export const getClientPosts = async (cid, params = {}) => {
  try {
    const response = await api.get('/client/posts', {
      params: { cid, ...params }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching client posts:', error);
    throw error;
  }
};

export const upsertPost = async (postData) => {
  const response = await api.put('/client/upsert-post', postData);
  return response.data;
};

export const getPost = async (entityId) => {
  const response = await api.get(`/client/post/${entityId}`);
  return response.data;
};

export const getTestPost = async (url) => {
  const response = await api.get('/client/test', {
    params: { url }
  });
  return response.data;
};

export const movePostToTrash = async (cid, entityId) => {
  try {
    const response = await api.patch('/client/trash', { entity: entityId, cid });
    return response;
  } catch (error) {
    console.error('Failed to move post to trash:', error.response?.data || error.message);
    throw error;
  }
};

export const restorePostFromTrash = async (cid, entityId) => {
  try {
    const response = await api.patch('/client/restore', { entity: entityId, cid });
    return response;
  } catch (error) {
    console.error('Failed to restore post from trash:', error.response?.data || error.message);
    throw error;
  }
};

export const getPostComments = async (postId, params = {}) => {
  try {
    const response = await api.get(`/client/posts/${postId}`, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching post comments:', error);
    throw error;
  }
};