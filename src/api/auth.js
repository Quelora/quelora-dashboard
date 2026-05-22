/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

/**
 * @fileoverview Authentication API layer.
 *
 * Handles credential submission, two-factor verification, client config
 * persistence, and session hydration/teardown. All storage operations are
 * routed through {@link module:utils/embedStorage} to guarantee correct
 * backend selection in both dashboard and embed contexts.
 *
 * @module api/auth
 */

import api from './axiosConfig';
import {
    getEncryptedClient,
    getDecryptedClient,
    encryptJSON,
    decryptJSON,
    generateKeyFromString,
} from '../utils/crypto';
import embedStorage from '../utils/embedStorage';

// ---------------------------------------------------------------------------
// Auth requests
// ---------------------------------------------------------------------------

/**
 * Authenticates a user with username and password.
 *
 * @async
 * @param {string} username - The user's username.
 * @param {string} password - The user's password.
 * @returns {Promise<Object>} Login result including token, clients, user and role.
 * @throws {Error} On invalid credentials, locked account, or connection failure.
 */
export const login = async (username, password) => {
    try {
        const response = await api.post('/auth/generate-token', { username, password });

        if (response.data.requires2FA) {
            return {
                requires2FA: true,
                tempToken:   response.data.tempToken,
            };
        }

        return {
            requires2FA: false,
            token:     response.data.token,
            clients:   response.data.clients   || [],
            user:      response.data.user       || {},
            expiresIn: response.data.expiresIn  || '2h',
            role:      response.data.role,
        };
    } catch (error) {
        if (error.response?.status === 429) {
            const err = new Error('LOCKED_ACCOUNT');
            const retryAfter = error.response.data?.retryAfter;
            if (retryAfter !== undefined) err.retryAfter = retryAfter;
            throw err;
        }
        if (error.response?.status === 401) {
            const err = new Error('INVALID_CREDENTIALS');
            const remaining = error.response.data?.remainingAttempts;
            if (remaining !== undefined) err.remainingAttempts = remaining;
            throw err;
        }
        throw new Error('SERVICE_UNAVAILABLE');
    }
};

/**
 * Completes a two-factor authentication flow using a TOTP code and a
 * pre-auth token.
 *
 * @async
 * @param {string} totpToken - The 6-digit TOTP code.
 * @param {string} tempToken - The temporary token received from the initial login step.
 * @returns {Promise<Object>} Login result including token, clients, user and role.
 * @throws {Error} On invalid TOTP code or connection failure.
 */
export const verifyTwoFactor = async (totpToken, tempToken) => {
    try {
        const response = await api.post('/auth/verify-2fa', { totpToken, tempToken });
        return {
            token:     response.data.token,
            clients:   response.data.clients   || [],
            user:      response.data.user       || {},
            expiresIn: response.data.expiresIn  || '2h',
            role:      response.data.role,
        };
    } catch (error) {
        if (error.response?.status === 400) throw new Error('INVALID_2FA_CODE');
        if (error.response?.status === 401) throw new Error('EXPIRED_2FA_SESSION');
        throw new Error('SERVICE_UNAVAILABLE');
    }
};

/** @deprecated Use {@link verifyTwoFactor} directly. Kept for backward compatibility. */
export const verify2FA = verifyTwoFactor;

// ---------------------------------------------------------------------------
// Password recovery
// ---------------------------------------------------------------------------

/**
 * Fetches a new CAPTCHA challenge from the server.
 *
 * @async
 * @returns {Promise<{token: string, svg: string}>}
 * @throws {Error} On server failure.
 */
export const fetchCaptcha = async () => {
    try {
        const response = await api.get('/auth/captcha');
        return { token: response.data.token, svg: response.data.svg };
    } catch (error) {
        throw new Error('SERVICE_UNAVAILABLE');
    }
};

/**
 * Requests a password recovery code for the given username or email.
 * Always resolves — the server never reveals whether the account exists.
 *
 * @async
 * @param {string} username
 * @param {string} captchaToken  - Token from fetchCaptcha.
 * @param {string} captchaAnswer - Text typed by the user.
 * @returns {Promise<void>}
 * @throws {Error} On invalid captcha, connection, or server failure.
 */
export const requestRecovery = async (username, captchaToken, captchaAnswer) => {
    try {
        await api.post('/auth/request-recovery', { username, captchaToken, captchaAnswer });
    } catch (error) {
        if (error.response?.status === 400 && error.response.data?.captchaInvalid) throw new Error('INVALID_CAPTCHA');
        if (error.response?.status >= 500 || !error.response) throw new Error('SERVICE_UNAVAILABLE');
        throw new Error('REQUEST_FAILED');
    }
};

/**
 * Validates a recovery OTP and returns a short-lived reset token.
 *
 * @async
 * @param {string} username
 * @param {string} code     - The 6-digit OTP.
 * @returns {Promise<string>} The reset token.
 * @throws {Error} On invalid code, too many attempts, or server failure.
 */
export const verifyRecovery = async (username, code) => {
    try {
        const response = await api.post('/auth/verify-recovery', { username, code });
        return response.data.resetToken;
    } catch (error) {
        if (error.response?.status === 429) throw new Error('TOO_MANY_ATTEMPTS');
        if (error.response?.status >= 500 || !error.response) throw new Error('SERVICE_UNAVAILABLE');
        throw new Error('INVALID_CODE');
    }
};

/**
 * Resets the account password using a valid reset token.
 *
 * @async
 * @param {string} resetToken  - JWT issued by verifyRecovery.
 * @param {string} newPassword - The new plain-text password.
 * @returns {Promise<void>}
 * @throws {Error} On expired token, weak password, or server failure.
 */
export const resetPassword = async (resetToken, newPassword) => {
    try {
        await api.post('/auth/reset-password', { resetToken, newPassword });
    } catch (error) {
        if (error.response?.status === 401) throw new Error('EXPIRED_TOKEN');
        if (error.response?.status === 400) throw new Error('WEAK_PASSWORD');
        if (error.response?.status >= 500 || !error.response) throw new Error('SERVICE_UNAVAILABLE');
        throw new Error('RESET_FAILED');
    }
};

// ---------------------------------------------------------------------------
// Session helpers
// ---------------------------------------------------------------------------

/**
 * Transforms a plain-text client object into an encrypted session object.
 *
 * @param {Object} client - The decrypted client configuration.
 * @returns {Object} The encrypted client object for session storage.
 */
const toSessionClient = (client) => ({ ...getEncryptedClient(client) });

/**
 * Returns `true` when the stored token expiration timestamp has not yet
 * been reached.
 *
 * An absent, non-numeric, or already-elapsed value is treated as expired so
 * the session is always cleared rather than silently reused.
 *
 * @returns {boolean}
 */
const isTokenValid = () => {
    try {
        const expiration = embedStorage.getItem('tokenExpiration');
        if (!expiration) return false;
        const expiresAt = parseInt(expiration, 10);
        if (isNaN(expiresAt)) return false;
        return Date.now() < expiresAt;
    } catch {
        return false;
    }
};

/**
 * Reads and decrypts the `user` object from the context-appropriate storage.
 *
 * Returns `null` — and clears all auth data — when the stored token has
 * expired. This prevents a stale identity from being used to resolve roles
 * in {@link module:utils/permissions} or to skip the login flow in
 * `PrivateRoute` after a session has naturally expired.
 *
 * @returns {Object|null} The decrypted user profile, or `null` if absent,
 *   unreadable, or expired.
 */
export const loadUserFromStorage = () => {
    try {
        if (!isTokenValid()) {
            clearAuthData();
            return null;
        }

        const raw        = embedStorage.getItem('user');
        const userSource = embedStorage.getItem('userKey');

        if (!raw) return null;

        if (userSource && raw.includes(':')) {
            try {
                const key = generateKeyFromString(userSource);
                return decryptJSON(raw, key);
            } catch {
                // Encrypted with a different key or malformed — fall through.
            }
        }

        return JSON.parse(raw);
    } catch (e) {
        console.error('Failed to load user from storage:', e);
        return null;
    }
};

/**
 * Loads and decrypts the client configurations stored in the
 * context-appropriate storage backend.
 *
 * @returns {Array<Object>} An array of fully decrypted client configurations.
 */
export const loadClientsFromSession = () => {
    try {
        const clientsDataRaw = embedStorage.getItem('clients');
        if (!clientsDataRaw) return [];

        const clientsData = JSON.parse(clientsDataRaw);
        if (!Array.isArray(clientsData)) return [];

        return clientsData
            .map((client) => {
                if (!client.cid || !client.description) {
                    console.warn('Invalid client data structure in session, skipping:', client);
                    return null;
                }
                try {
                    return getDecryptedClient(client);
                } catch (error) {
                    console.error(`Failed to decrypt configuration for client ${client.cid}.`, error);
                    return null;
                }
            })
            .filter(Boolean);
    } catch (e) {
        console.error('Error processing clients from session:', e);
        return [];
    }
};

/**
 * Fetches the encrypted client list for the authenticated user's current
 * active context from `GET /user/clients` and atomically replaces the
 * `clients` key in storage with the new payload.
 *
 * This is the counterpart to `/admin/set` in the God-mode CID-switch flow.
 * After the backend updates Redis with the new active CID, this function
 * must be called so that `loadClientsFromSession()` — and all components
 * that derive their `cid` query parameter from it — resolve to the correct
 * client on the next render cycle.
 *
 * The raw encrypted array returned by the API is stored directly without
 * re-encryption, preserving the per-CID AES keys applied server-side
 * (same scheme as the login payload).
 *
 * Additionally writes `currentCid` from the first client in the returned
 * list so that the Axios request interceptor picks up the new CID on
 * subsequent requests without requiring a page reload.
 *
 * @async
 * @returns {Promise<Array<Object>>} The decrypted client list, or the
 *   existing session clients if the request fails (fail-safe).
 */
export const fetchSessionClients = async () => {
    try {
        const response = await api.get('/user/clients');
        const rawClients = response.data?.clients;

        if (!Array.isArray(rawClients)) return loadClientsFromSession();

        embedStorage.setItem('clients', JSON.stringify(rawClients));

        if (rawClients.length > 0 && rawClients[0].cid) {
            embedStorage.setItem('currentCid', rawClients[0].cid);
        }

        return rawClients
            .map((client) => {
                try {
                    return getDecryptedClient(client);
                } catch {
                    return null;
                }
            })
            .filter(Boolean);
    } catch (error) {
        console.error('fetchSessionClients failed, keeping existing session clients:', error);
        return loadClientsFromSession();
    }
};

/**
 * Removes all authentication keys from storage using the symmetric cleanup
 * provided by {@link module:utils/embedStorage}.
 *
 * Operates on both `localStorage` and `sessionStorage` regardless of the
 * current context so that a logout triggered in any window leaves no
 * residual credentials in either backend.
 *
 * @returns {void}
 */
export const clearAuthData = () => {
    const keys = ['token', 'clients', 'tokenExpiration', 'user', 'userKey', 'currentCid'];
    keys.forEach((key) => embedStorage.removeItem(key));
};

// ---------------------------------------------------------------------------
// Client config persistence
// ---------------------------------------------------------------------------

/**
 * Creates or updates a client configuration on the backend, then syncs the
 * result into the active session storage array.
 *
 * @async
 * @param {string|null} cid        - The client identifier, or `null` when creating.
 * @param {Object}      clientData - The new or updated configuration object.
 * @returns {Promise<Object>} Contains the newly updated client and the full updated list.
 * @throws {string} The error message from the API response if the request fails.
 */
export const saveClientConfig = async (cid, clientData) => {
    try {
        const payload  = cid ? getEncryptedClient({ ...clientData, cid }) : { ...clientData };
        const endpoint = cid ? '/client/update-cid' : '/client/generate-cid';
        const method   = cid ? 'put' : 'post';

        const response = await api[method](endpoint, payload);

        const currentClients     = loadClientsFromSession();
        const newClientRaw       = response.data.client;
        const newClientDecrypted = getDecryptedClient(newClientRaw);

        const updatedClientList = cid
            ? currentClients.map((c) =>
                c.cid === newClientDecrypted.cid ? newClientDecrypted : c)
            : [...currentClients, newClientDecrypted];

        embedStorage.setItem(
            'clients',
            JSON.stringify(updatedClientList.map(toSessionClient))
        );

        return { newClient: newClientDecrypted, updatedClientList };
    } catch (error) {
        throw error.response?.data?.error || 'Error saving client configuration';
    }
};

/**
 * Deletes a client by CID via the API and removes it from storage.
 *
 * @async
 * @param {string} cid - The client identifier to delete.
 * @returns {Promise<Object>} The API response data.
 * @throws {string} The error message from the API response if the request fails.
 */
export const deleteClient = async (cid) => {
    try {
        const response = await api.delete(`/client/delete/${cid}`);

        const currentClients = loadClientsFromSession();
        const updatedClients = currentClients.filter((c) => c.cid !== cid);

        embedStorage.setItem(
            'clients',
            JSON.stringify(updatedClients.map(toSessionClient))
        );

        return response.data;
    } catch (error) {
        throw (
            error.response?.data?.message ||
            error.response?.data?.error ||
            'Error deleting client'
        );
    }
};

/**
 * Directly updates the resilience configuration of a specific client within
 * the encrypted storage payload, preserving the rest of the array.
 *
 * @param {string} cid            - The client identifier to update.
 * @param {Object} resilienceData - The plain-text resilience configuration.
 * @returns {void}
 */
export const updateClientResilienceInSession = (cid, resilienceData) => {
    try {
        const raw = embedStorage.getItem('clients');
        if (!raw) return;

        const clients = JSON.parse(raw);
        if (!Array.isArray(clients)) return;

        const key     = generateKeyFromString(cid);
        const updated = clients.map((c) =>
            c.cid === cid
                ? { ...c, resilience: resilienceData ? encryptJSON(resilienceData, key) : null }
                : c
        );

        embedStorage.setItem('clients', JSON.stringify(updated));
    } catch (e) {
        console.error('Failed to update resilience in session:', e);
    }
};