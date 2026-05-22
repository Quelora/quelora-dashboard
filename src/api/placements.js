/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

// filepath: ./src/api/placements.js
import api from './axiosConfig';

const API_URL = '/client/placements';

export const getPlacements = async (params = {}) => {
    try {
        const response = await api.get(API_URL, { params });
        return response.data;
    } catch (error) {
        throw error.response?.data?.error || 'Error fetching placements';
    }
};

export const upsertPlacement = async (placementData) => {
    try {
        const response = await api.post(API_URL, placementData);
        return response.data;
    } catch (error) {
        throw error.response?.data?.error || 'Error saving placement';
    }
};

export const deletePlacement = async (id) => {
    try {
        const response = await api.delete(`${API_URL}/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data?.error || 'Error deleting placement';
    }
};