/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

// filepath: ./src/api/advertiserProfiles.js
import api from './axiosConfig';

const API_URL = '/client/advertiser-profiles';

export const getAdvertiserProfiles = async (showArchived = false, cid = null) => {
    try {
        const params = { showArchived: showArchived.toString() };
        if (cid) params.cid = cid;
        const response = await api.get(API_URL, { params });
        return response.data;
    } catch (error) {
        console.error('Error fetching advertiser profiles:', error);
        throw error.response?.data?.error || 'Error fetching advertiser profiles';
    }
};

export const upsertAdvertiserProfile = async (profileData) => {
    try {
        const response = await api.post(API_URL, profileData);
        return response.data;
    } catch (error) {
        console.error('Error saving advertiser profile:', error);
        throw error.response?.data?.error || 'Error saving advertiser profile';
    }
};

export const deleteAdvertiserProfile = async (id, permanent = false) => {
    try {
        const response = await api.delete(`${API_URL}/${id}`, {
            params: { permanent: permanent.toString() }
        });
        return response.data;
    } catch (error) {
        console.error('Error deleting advertiser profile:', error);
        throw error.response?.data?.error || 'Error deleting advertiser profile';
    }
};

export const restoreAdvertiserProfile = async (id) => {
    try {
        const response = await api.patch(`${API_URL}/${id}/restore`);
        return response.data;
    } catch (error) {
        console.error('Error restoring advertiser profile:', error);
        throw error.response?.data?.error || 'Error restoring advertiser profile';
    }
};