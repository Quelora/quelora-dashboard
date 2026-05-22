/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

// filepath: ./src/api/admin.js
import api from './axiosConfig';

export const searchClients = async (searchTerm) => {
    try {
        const response = await api.get('/admin/search', {
            params: { q: searchTerm }
        });
        return response.data; 
    } catch (error) {
        console.error('Error searching clients:', error);
        throw error;
    }
};


export const setActiveClient = async (cid) => {
    try {
        const response = await api.post('/admin/set', { cid });
        return response.data;
    } catch (error) {
        console.error('Error setting active client:', error);
        throw error;
    }
};

/**
 * Updates the enterprise modules and/or community plugins for a client.
 * God users may set both; admin users may only set communityPlugins.
 *
 * @param {string}   cid
 * @param {Object}   payload
 * @param {string[]} [payload.enterpriseModules] - god only
 * @param {string[]} [payload.communityPlugins]  - admin+
 * @returns {Promise<Object>}
 */
export const updateClientModules = async (cid, payload) => {
    try {
        const response = await api.patch(`/client/${cid}/modules`, payload);
        return response.data;
    } catch (error) {
        console.error('Error updating client modules:', error);
        throw error.response?.data?.error || 'Error updating client modules';
    }
};