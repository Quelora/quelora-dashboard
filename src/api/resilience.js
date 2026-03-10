// src/api/resilience.js
import api from './axiosConfig';

/**
 * Persists the editable resilience configuration for a client.
 * Key material (publicKey, keyId, updatedAt, algorithm) is managed server-side
 * and must not be included in the payload sent from the frontend.
 *
 * @param {string} cid    - The client identifier.
 * @param {Object} config - The resilience config to save (no key fields).
 * @returns {Promise<Object>} The updated resilience config returned by the server.
 */
export const saveResilienceConfig = async (cid, config) => {
    const response = await api.post(`/client/${cid}/resilience`, config);
    return response.data.data;
};

/**
 * Requests the server to generate a new ed25519 keypair for the given client.
 * The private key is stored encrypted server-side and never returned to the caller.
 *
 * @param {string} cid - The client identifier.
 * @returns {Promise<Object>} Object containing { keyId, publicKey, algorithm, updatedAt }.
 */
export const generateResilienceKeys = async (cid) => {
    const response = await api.post(`/client/${cid}/resilience/generate-keys`);
    return response.data.data;
};