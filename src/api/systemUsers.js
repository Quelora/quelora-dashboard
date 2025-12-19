import api from './axiosConfig';

export const getSystemUsers = async (showDeleted = false) => {
    try {
        const response = await api.get('/user/list', {
            params: { showDeleted }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching system users:', error);
        throw error;
    }
};

export const createSystemUser = async (userData) => {
    try {
        const response = await api.post('/user/create', userData);
        return response.data;
    } catch (error) {
        console.error('Error creating system user:', error);
        throw error.response?.data?.error || 'Error creating user';
    }
};

export const resetSystemUserPassword = async (userId, newPassword) => {
    try {
        const response = await api.post(`/user/${userId}/reset-password`, { newPassword });
        return response.data;
    } catch (error) {
        console.error('Error resetting password:', error);
        throw error.response?.data?.error || 'Error resetting password';
    }
};

export const deleteSystemUser = async (userId) => {
    try {
        const response = await api.delete(`/user/${userId}`);
        return response.data;
    } catch (error) {
        console.error('Error deleting user:', error);
        throw error.response?.data?.error || 'Error deleting user';
    }
};

export const restoreSystemUser = async (userId) => {
    try {
        const response = await api.patch(`/user/${userId}/restore`);
        return response.data;
    } catch (error) {
        console.error('Error restoring user:', error);
        throw error.response?.data?.error || 'Error restoring user';
    }
};

export const unlockSystemUser = async (userId) => {
    try {
        const response = await api.patch(`/user/${userId}/unlock`);
        return response.data;
    } catch (error) {
        console.error('Error unlocking user:', error);
        throw error.response?.data?.error || 'Error unlocking user';
    }
};