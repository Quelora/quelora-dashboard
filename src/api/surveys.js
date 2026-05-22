/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

// filepath: ./src/api/surveys.js
import api from './axiosConfig';

export const getSurveys = async (cid, params = {}) => {
    try {
        const response = await api.get('/client/surveys', {
            params: { cid, ...params }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching surveys:', error);
        throw error.response?.data?.error || 'Error fetching surveys';
    }
};

export const getSurvey = async (surveyId) => {
    try {
        const response = await api.get(`/client/surveys/${surveyId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching survey:', error);
        throw error.response?.data?.error || 'Error fetching survey details';
    }
};

export const upsertSurvey = async (surveyData) => {
    try {
        const response = await api.post('/client/surveys', surveyData);
        return response.data;
    } catch (error) {
        console.error('Error upserting survey:', error);
        throw error.response?.data?.error || 'Error saving survey';
    }
};

export const deleteSurvey = async (surveyId, cid) => {
    try {
        const response = await api.delete(`/client/surveys/${surveyId}`, {
            params: { cid }
        });
        return response.data;
    } catch (error) {
        console.error('Error deleting survey:', error);
        throw error.response?.data?.error || 'Error deleting survey';
    }
};