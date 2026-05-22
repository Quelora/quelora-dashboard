/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

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

/**
 * Updates the enterprise plan attributes of a system user.
 *
 * @param {string}   userId  - Target user ID.
 * @param {Object}   payload
 * @param {string}   payload.accountType        - 'community' | 'enterprise'
 * @param {string[]} payload.enterpriseModules  - List of enabled module identifiers.
 * @returns {Promise<Object>} Updated user object.
 */
/**
 * Updates editable profile fields of a staff user.
 * God can edit anyone; admin can only edit users from their own CIDs.
 *
 * @param {string} userId
 * @param {Object} payload
 * @param {string}   [payload.given_name]
 * @param {string}   [payload.family_name]
 * @param {string}   [payload.email]
 * @param {string}   [payload.locale]
 * @param {string}   [payload.role]
 * @param {string[]} [payload.clientIds]
 */
export const updateSystemUser = async (userId, payload) => {
    try {
        const response = await api.patch(`/user/${userId}`, payload);
        return response.data;
    } catch (error) {
        console.error('Error updating system user:', error);
        throw error.response?.data?.error || 'Error updating user';
    }
};

export const updateUserEnterprise = async (userId, { accountType, enterpriseModules }) => {
    try {
        const response = await api.patch(`/user/${userId}/enterprise`, {
            accountType,
            enterpriseModules,
        });
        return response.data;
    } catch (error) {
        console.error('Error updating enterprise plan:', error);
        throw error.response?.data?.error || 'Error updating enterprise plan';
    }
};