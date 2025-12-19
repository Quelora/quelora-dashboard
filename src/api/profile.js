// ./src/api/profile.js
import api from './axiosConfig';

export const getProfile = async () => {
    try {
        const response = await api.get('/user/profile');
        return response.data;
    } catch (error) {
        console.error('Error fetching profile:', error);
        throw error.response?.data?.message || "Error fetching profile";
    }
};

export const updateProfile = async (profileData) => {
    try {
        const response = await api.patch('/user/profile', profileData);
        return response.data;
    } catch (error) {
        console.error('Error updating profile:', error);
        throw error.response?.data?.message || "Error updating profile";
    }
};

export const changePassword = async (currentPassword, newPassword) => {
    try {
        const response = await api.post('/user/change-password', {
            currentPassword,
            newPassword
        });
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || "Error changing password";
    }
};

export const setupTwoFactor = async () => {
    try {
        const response = await api.post('/user/2fa/setup');
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.error || 'Error setting up 2FA');
    }
};

export const verifyTwoFactorSetup = async (totpToken) => {
    try {
        const response = await api.post('/user/2fa/verify', { totpToken });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.error || 'Error verifying 2FA token');
    }
};

export const disableTwoFactor = async (password) => {
    try {
        const response = await api.post('/user/2fa/disable', { password });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.error || 'Error disabling 2FA');
    }
};