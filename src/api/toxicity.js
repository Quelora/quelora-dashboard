/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

// src/api/toxicity.js
import api from './axiosConfig';

/**
 * @fileoverview API service for Toxicity and Compliance testing.
 */

/**
 * Sends a raw text comment and a live configuration payload to the backend
 * to evaluate the text against the specified toxicity provider.
 * * This allows administrators to test thresholds and provider credentials
 * in real-time before saving the configuration to the database.
 *
 * @async
 * @param {string} cid - The Client ID context for the request.
 * @param {string} text - The text comment to analyze.
 * @param {Object} toxicityConfig - The live toxicity configuration object from the form state.
 * @param {string} [language='es'] - The expected language of the text.
 * @returns {Promise<Object>} An object containing { success, isPolite, scores }.
 * @throws {Error} If the API request fails or the provider rejects the credentials.
 */
export const testToxicity = async (cid, text, toxicityConfig, language = 'es') => {
    try {
        const response = await api.post(`/client/${cid}/test-toxicity`, {
            text,
            language,
            toxicityConfig
        });
        
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};