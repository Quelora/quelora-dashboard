/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

// filepath: ./src/api/media.js
import api from './axiosConfig';

export const uploadMedia = async (file, onUploadProgress) => {
    const formData = new FormData();
    formData.append('media', file);

    try {
        const response = await api.post('/media/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            onUploadProgress,
        });
        return response.data;
    } catch (error) {
        throw error.response?.data?.error || 'Error uploading file';
    }
};