/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

// filepath: ./src/api/stats.js
import api from './axiosConfig';

export const fetchStats = async (cid = null, dateFrom = null, dateTo = null) => {
    try {
        const params = new URLSearchParams();
        
        if (cid) params.append('cid', cid);
        
        if (dateFrom) {
            const isoDateFrom = new Date(dateFrom).toISOString();
            params.append('dateFrom', isoDateFrom);
        }
        
        if (dateTo) {
            const isoDateTo = new Date(dateTo).toISOString();
            params.append('dateTo', isoDateTo);
        }

        const response = await api.get('/stats/get', {
            params: params
        });
        
        const adjustToClientTimezone = (dateHourString) => {
            const [datePart, utcHour] = dateHourString.split(' ');
            const utcDate = new Date(`${datePart}T${utcHour.padStart(2, '0')}:00:00Z`);
            const clientTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            
            return utcDate.toLocaleString('en-CA', {
                timeZone: clientTimeZone,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                hour12: false
            })
            .replace(/(\d{4})-(\d{2})-(\d{2}),? (\d{2}).*/, '$1-$2-$3 $4');
        };

        if (response.data?.statsByHour) {
            response.data.statsByHour = response.data.statsByHour.map(stat => ({
                ...stat,
                dateHour: adjustToClientTimezone(stat.dateHour)
            }));
        }
        
        return response.data;
    } catch (error) {
        console.error('Error fetching stats:', error);
        throw error;
    }
};

export const fetchGeoStats = async (cid = null, dateFrom = null, dateTo = null, action = 'comment') => {
    try {
        const params = new URLSearchParams();
        
        if (cid) params.append('cid', cid);
        
        if (dateFrom) {
            const isoDateFrom = new Date(dateFrom).toISOString();
            params.append('dateFrom', isoDateFrom);
        }
        
        if (dateTo) {
            const isoDateTo = new Date(dateTo).toISOString();
            params.append('dateTo', isoDateTo);
        }

        if (action) params.append('action', action);

        const response = await api.get('/stats/get/geo', {
            params: params
        });
        
        const adjustToClientTimezone = (dateHourString) => {
            const [datePart, utcHour] = dateHourString.split(' ');
            const utcDate = new Date(`${datePart}T${utcHour.padStart(2, '0')}:00:00Z`);
            const clientTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            
            return utcDate.toLocaleString('en-CA', {
                timeZone: clientTimeZone,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                hour12: false
            })
            .replace(/(\d{4})-(\d{2})-(\d{2}),? (\d{2}).*/, '$1-$2-$3 $4');
        };

        if (response.data?.statsByHour) {
            response.data.statsByHour = response.data.statsByHour.map(stat => ({
                ...stat,
                dateHour: adjustToClientTimezone(stat.dateHour)
            }));
        }
        
        return response.data;
    } catch (error) {
        console.error('Error fetching stats:', error);
        throw error;
    }
};

export const fetchPostListStats = async (cid, params) => {
    try {
        const urlParams = new URLSearchParams();

        if (cid) urlParams.append('cid', cid);
        urlParams.append('page', params.page || 1);
        urlParams.append('limit', params.limit || 10);
        urlParams.append('sortBy', params.sortBy || 'viewsCount');
        urlParams.append('sortOrder', params.sortOrder || 'desc');
        
        if (params.dateFrom) urlParams.append('dateFrom', new Date(params.dateFrom).toISOString());
        if (params.dateTo) urlParams.append('dateTo', new Date(params.dateTo).toISOString());

        const response = await api.get('/stats/get/posts/list', {
            params: urlParams
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching post list stats:', error);
        throw error;
    }
};

export const fetchPostAnalytics = async (entityId, cid, dates) => {
    try {
        const params = new URLSearchParams();
        
        if (cid) params.append('cid', cid);
        
        if (dates.dateFrom) {
            params.append('dateFrom', new Date(dates.dateFrom).toISOString());
        }
        
        if (dates.dateTo) {
            params.append('dateTo', new Date(dates.dateTo).toISOString());
        }

        const response = await api.get(`/stats/get/post/${entityId}`, {
            params: params
        });

        return response.data;
    } catch (error) {
        console.error(`Error fetching analytics for post ${entityId}:`, error);
        throw error;
    }
};

export const fetchTopUsers = async (cid, dateFrom, dateTo, limit = 10) => {
    const url = `/stats/get/top-users/comments?cid=${cid}&dateFrom=${dateFrom.toISOString()}&dateTo=${dateTo.toISOString()}&limit=${limit}`;

    const response = await api.get(url);

    if (!response.success) {
        throw new Error(response.error || 'Error fetchTopUsers.');
    }
    return response.data;
};

export const fetchProfileAnalytics = async (cid, params) => {
    try {
        const urlParams = new URLSearchParams();
        if (cid) urlParams.append('cid', cid);
        
        urlParams.append('page', params.page || 1);
        urlParams.append('limit', params.limit || 10);
        urlParams.append('sortBy', params.sortBy || 'commentsAdded');
        urlParams.append('sortOrder', params.sortOrder || 'desc');
        
        if (params.dateFrom) urlParams.append('dateFrom', new Date(params.dateFrom).toISOString());
        if (params.dateTo) urlParams.append('dateTo', new Date(params.dateTo).toISOString());

        const response = await api.get('/stats/get/profile-analytics', {
            params: urlParams
        });
        
        return response.data;
    } catch (error) {
        console.error('Error fetching profile analytics:', error);
        throw error;
    }
};

export const fetchModerationAnalytics = async (cid, dateFrom, dateTo, provider, taskType) => {
    try {
        const params = new URLSearchParams();
        if (cid) params.append('cid', cid);
        if (dateFrom) params.append('dateFrom', new Date(dateFrom).toISOString());
        if (dateTo) params.append('dateTo', new Date(dateTo).toISOString());
        if (provider && provider !== 'all') params.append('provider', provider);
        if (taskType && taskType !== 'all') params.append('taskType', taskType);

        const response = await api.get('/stats/get/moderation-analytics', {
            params: params
        });
        
        return response.data;
    } catch (error) {
        console.error('Error fetching moderation analytics:', error);
        throw error;
    }
};