// src/api/auth.js
import api from './axiosConfig';
import { getEncryptedClient, getDecryptedClient, encryptJSON, decryptJSON, generateKeyFromString } from '../utils/crypto';
import embedStorage from '../utils/embedStorage';

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
            token:       response.data.token,
            clients:     response.data.clients || [],
            user:        response.data.user    || {},
            expiresIn:   response.data.expiresIn || '2h',
            role:        response.data.role,
        };
    } catch (error) {
        if (error.response?.status === 429) throw new Error('LOCKED_ACCOUNT');
        if (error.response?.status === 401) throw new Error('Invalid credentials');
        throw new Error('Connection error');
    }
};

/**
 * Completes a two-factor authentication flow using a TOTP code and a
 * pre-auth token.
 *
 * @async
 * @param {string} totpToken - The 6-digit TOTP code.
 * @param {string} tempToken - The temporary token received from the initial
 *   login step.
 * @returns {Promise<Object>} Login result including token, clients, user and role.
 * @throws {Error} On invalid TOTP code or connection failure.
 */
export const verify2FA = async (totpToken, tempToken) => {
    try {
        const response = await api.post('/auth/verify-2fa', { totpToken, tempToken });
        return {
            token:     response.data.token,
            clients:   response.data.clients || [],
            user:      response.data.user    || {},
            expiresIn: response.data.expiresIn || '2h',
            role:      response.data.role,
        };
    } catch (error) {
        throw new Error('Invalid 2FA code or session expired');
    }
};

/**
 * Transforms a plain-text client object into an encrypted session object.
 *
 * @param {Object} client - The decrypted client configuration.
 * @returns {Object} The encrypted client object for session storage.
 */
const toSessionClient = (client) => ({ ...getEncryptedClient(client) });

/**
 * Reads and decrypts the `user` object from the context-appropriate storage.
 *
 * Decryption strategy:
 *  1. Reads the raw `user` value via `embedStorage.getItem`.
 *  2. Reads `userKey` (the plain-text identifier used to derive the AES key).
 *  3. If both are present and the value looks like an encrypted payload
 *     (`ivHex:cipherHex` format), decrypts with AES-CBC.
 *  4. Falls back to `JSON.parse` for sessions created before encryption was
 *     introduced, ensuring backwards compatibility during the transition.
 *
 * @returns {Object|null} The decrypted user profile, or `null` if absent or
 *   unreadable.
 */
export const loadUserFromStorage = () => {
    try {
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
 * In embed windows `embedStorage.getItem` resolves from `localStorage`
 * (with a `sessionStorage` fallback), so clients stored during a dashboard
 * login are immediately available to the embed without re-authentication.
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
 * Creates or updates a client configuration on the backend, then syncs the
 * result into the active session storage array.
 *
 * @async
 * @param {string|null} cid        - The client identifier, or `null` when
 *   creating a new client.
 * @param {Object}      clientData - The new or updated configuration object.
 * @returns {Promise<Object>} Contains the newly updated client and the full
 *   updated list.
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
            ? currentClients.map(c =>
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

        const currentClients  = loadClientsFromSession();
        const updatedClients  = currentClients.filter(c => c.cid !== cid);

        embedStorage.setItem(
            'clients',
            JSON.stringify(updatedClients.map(toSessionClient))
        );

        return response.data;
    } catch (error) {
        throw error.response?.data?.message || error.response?.data?.error || 'Error deleting client';
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
        const updated = clients.map(c =>
            c.cid === cid
                ? { ...c, resilience: resilienceData ? encryptJSON(resilienceData, key) : null }
                : c
        );

        embedStorage.setItem('clients', JSON.stringify(updated));
    } catch (e) {
        console.error('Failed to update resilience in session:', e);
    }
};

/** Alias for components that import `verifyTwoFactor` by name. */
export const verifyTwoFactor = verify2FA;