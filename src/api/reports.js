/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

// ./src/api/reports.js
import api from './axiosConfig';

/**
 * Obtiene la lista de reportes pendientes, paginados y ordenados.
 * @param {string} cid - El Client ID (o 'all').
 * @param {object} params - Parámetros como page, limit, sort, order.
 */
export const getReports = async (cid, params = {}) => {
    try {
        // Combinar el cid y los otros parámetros para la consulta
        const allParams = {
            ...params,
            cid: cid === 'all' ? null : cid
        };

        const response = await api.get('/client/reports', { params: allParams });
        // La data viene en response.data.data.reports y response.data.data.pagination
        return response.data.data;
    } catch (error) {
        console.error('Error fetching reports:', error);
        throw error.response?.data?.error || 'Error fetching reports';
    }
};

/**
 * Marca un reporte de comentario como resuelto.
 * @param {string} reportId - El ID del documento Reported.
 * @param {string} [reason] - Razón opcional de la resolución.
 */
export const resolveReport = async (reportId, reason = null) => {
    try {
        const payload = {};
        if (reason) {
            payload.resolution_reason = reason;
        }
        const response = await api.patch(`/client/reports/${reportId}/resolve`, payload);
        return response.data;
    } catch (error) {
        console.error('Error resolving report:', error);
        throw error.response?.data?.error || 'Error resolving report';
    }
};

export const hideComment = async (commentId, cid) => {
    try {
        const response = await api.patch(`/client/comments/${commentId}/hide?cid=${cid}`);
        return response.data;
    } catch (error) {
        console.error('Error hiding comment:', error);
        throw error.response?.data?.error || 'Error hiding comment';
    }
};

export const unhideComment = async (commentId, cid) => {
    try {
        const response = await api.patch(`/client/comments/${commentId}/unhide?cid=${cid}`);
        return response.data;
    } catch (error) {
        console.error('Error unhiding comment:', error);
        throw error.response?.data?.error || 'Error unhiding comment';
    }
};