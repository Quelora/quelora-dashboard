/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

// src/api/jobs.js
import api from './axiosConfig';

export const getJobs = async () => {
    const response = await api.get('/jobs');
    return response.data;
};

export const updateJob = async (jobKey, data) => {
    const response = await api.patch(`/jobs/${jobKey}`, data);
    return response.data;
};

export const triggerJob = async (jobKey) => {
    const response = await api.post(`/jobs/${jobKey}/trigger`);
    return response.data;
};

export const getJobLogs = async ({ jobName, status, page = 1, limit = 50 } = {}) => {
    const params = { page, limit };
    if (jobName) params.jobName = jobName;
    if (status)  params.status  = status;
    const response = await api.get('/jobs/logs', { params });
    return response.data;
};
