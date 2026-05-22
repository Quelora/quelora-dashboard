/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

// ./src/api/logs.js
import api from './axiosConfig';

export const getLogs = async (params = {}) => {
    try {
        const queryParams = {};
        if (params.from) {
            queryParams.from = params.from;
        }
        if (params.level && params.level !== 'all') {
            queryParams.level = params.level;
        }

        const response = await api.get('/client/logs', {
            params: queryParams
        });

        const apiData = response.data?.data; 

        if (!apiData) {
            return {logs: [], database: null, app: null, cache: null};
        }

        const logs = apiData.logs?.sort((a, b) => new Date(b.time) - new Date(a.time)) || [];
        
        return {logs, database: apiData.database, app: apiData.app, cache: apiData.cache};

    } catch (error) {
        console.error('Error fetching logs:', error);
        return {logs: [], database: null, app: null, cache: null};
    }
};