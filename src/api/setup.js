/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

/**
 * @fileoverview API functions for the Setup Wizard flow.
 * @module api/setup
 */

import api from './axiosConfig';

/**
 * Registers a new user account.
 *
 * @param {Object} params - Registration parameters.
 * @param {string} params.firstName - User's first name.
 * @param {string} params.lastName - User's last name.
 * @param {string} params.email - User's email address.
 * @param {string} params.password - User's chosen password.
 * @param {string} params.locale - User's locale (e.g., 'en', 'es').
 * @returns {Promise<Object>} API response data.
 * @throws {string} Error message on failure.
 */
export const registerUser = async ({ firstName, lastName, email, password, locale }) => {
    try {
        const response = await api.post('/auth/register', { firstName, lastName, email, password, locale });
        return response.data;
    } catch (error) {
        throw error.response?.data?.error || 'Registration failed';
    }
};

/**
 * Verifies a user's email with a 6-digit code.
 *
 * @param {Object} params - Verification parameters.
 * @param {string} params.email - User's email address.
 * @param {string} params.code - 6-digit verification code.
 * @returns {Promise<Object>} API response containing token, user, and client.
 * @throws {string} Error message on failure.
 */
export const verifyEmail = async ({ email, code }) => {
    try {
        const response = await api.post('/auth/verify-email', { email, code });
        return response.data;
    } catch (error) {
        throw error.response?.data?.error || 'Verification failed';
    }
};

/**
 * Resends a verification code to the user's email.
 *
 * @param {Object} params - Resend parameters.
 * @param {string} params.email - User's email address.
 * @returns {Promise<Object>} API response data.
 * @throws {string} Error message on failure.
 */
export const resendVerificationCode = async ({ email }) => {
    try {
        const response = await api.post('/auth/resend-verification', { email });
        return response.data;
    } catch (error) {
        throw error.response?.data?.error || 'Failed to resend code';
    }
};

/**
 * Completes the client setup wizard by sending the final configuration.
 *
 * @param {string} cid - Client identifier.
 * @param {Object} formData - Wizard form data.
 * @param {string} formData.siteName - Name of the site.
 * @param {string} formData.siteUrl - Base URL of the site.
 * @param {string} formData.description - Site description.
 * @param {string} formData.language - Default language code.
 * @param {string} formData.loginMode - 'quelora' or 'custom'.
 * @param {string} formData.jwtSecret - JWT secret for authentication.
 * @param {string} formData.loginUrl - External login URL (if custom mode).
 * @param {string} formData.logoutUrl - External logout URL (if custom mode).
 * @param {string} formData.registrationUrl - External registration URL (if custom mode).
 * @param {string} formData.entitySelector - CSS selector for entity containers.
 * @param {string} formData.entityIdAttribute - Attribute name for unique IDs.
 * @param {string} formData.interactionPosition - 'before', 'after', or 'inside'.
 * @param {string} formData.interactionRelativeTo - Relative selector for placement.
 * @param {string} formData.selectorMode - 'discovery' or 'deterministic'.
 * @returns {Promise<Object>} API response containing the updated client.
 * @throws {string} Error message on failure.
 */
export const completeSetup = async (cid, formData) => {
    const payload = {
        siteName: formData.siteName,
        siteUrl: formData.siteUrl,
        description: formData.description,
        language: formData.language,
        config: {
            login: {
                queloraSession: formData.loginMode === 'quelora',
                jwtSecret: formData.jwtSecret,
                loginUrl: formData.loginUrl || '',
                logoutUrl: formData.logoutUrl || '',
                registrationUrl: formData.registrationUrl || '',
                providers: formData.loginMode === 'quelora' ? ['Quelora'] : [],
                providerDetails: formData.loginMode === 'quelora'
                    ? { Quelora: { enabled: true } }
                    : {},
            },
            entityConfig: {
                selector: formData.entitySelector,
                entityIdAttribute: formData.entityIdAttribute,
                interactionPlacement: {
                    position: formData.interactionPosition,
                    relativeTo: formData.interactionRelativeTo,
                    deterministic: formData.selectorMode === 'deterministic',
                },
            },
            cors: {
                origins: [formData.siteUrl].filter(Boolean),
            },
        },
    };

    try {
        const response = await api.patch(`/client/${cid}/quick-setup`, payload);
        return response.data;
    } catch (error) {
        throw error.response?.data?.error || 'Setup save failed';
    }
};

/**
 * Performs AI-powered discovery of CSS selectors and placement rules for a given URL.
 *
 * @param {string} url - The target website URL to analyze.
 * @param {string|null} cid - Optional client ID for access validation.
 * @returns {Promise<Object>} Discovery result containing entitySelector, entityIdAttribute,
 *                            interactionPosition, and interactionRelativeTo.
 * @throws {string} Error message on failure.
 */
export const discoverSelectors = async (url, cid = null) => {
    try {
        const response = await api.post('/client/discover-selectors', { url, cid });
        return response.data;
    } catch (error) {
        throw error.response?.data?.error || 'AI discovery failed';
    }
};