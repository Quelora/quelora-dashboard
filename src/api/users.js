// filepath: ./src/api/users.js
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

export const banUser = async (author, cid) => {
    return api.patch(`/client/users/${author}/ban?cid=${cid}`);
};

export const unbanUser = async (author, cid) => {
    return api.patch(`/client/users/${author}/unban?cid=${cid}`);
};

export const getUserCommentStats = async (author, cid, dateRange = {}) => {
    try {
        const params = { cid };
        if (dateRange.dateFrom) params.dateFrom = new Date(dateRange.dateFrom).toISOString();
        if (dateRange.dateTo) params.dateTo = new Date(dateRange.dateTo).toISOString();

        const response = await api.get(`/client/users/${author}/stats`, { params });
        return response.data;
    } catch (error) {
        console.error('Error fetching user stats:', error);
        throw error.response?.data?.error || 'Error fetching user stats';
    }
};

export const getCommentsListByUser = async (author, cid, params = {}) => {
    try {
        const response = await api.get(`/client/users/${author}/comments-list`, {
            params: {
                cid,
                ...params
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching comments by user:', error);
        throw error.response?.data?.error || 'Error fetching comments';
    }
};

export const getUserNolanAnalysis = async (author, cid, limit = 50) => {
    try {
        const response = await api.get(`/client/users/${author}/nolan`, {
            params: { cid, limit }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching Nolan analysis:', error);
        throw error.response?.data?.error || 'Error fetching Nolan analysis';
    }
};

export const getUserReputationLogs = async (author, cid, page = 1, limit = 10) => {
    try {
        const response = await api.get(`/stats/get/users/${author}/reputation`, {
            params: { cid, page, limit }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching reputation logs:', error);
        throw error.response?.data?.error || 'Error fetching reputation logs';
    }
};