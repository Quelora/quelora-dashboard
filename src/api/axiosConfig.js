/**
 * @fileoverview Axios instance configuration.
 *
 * Provides a pre-configured Axios instance with:
 *  - Request interceptor that attaches the JWT Bearer token and the active
 *    client CID to every outgoing request via {@link module:utils/embedStorage}.
 *  - Response interceptor that transparently decompresses dictionary-encoded
 *    payloads and handles 401 responses with a centralized cleanup.
 *
 * @module api/axiosConfig
 */

import axios from 'axios';
import embedStorage from '../utils/embedStorage';
import { clearAuthData } from './auth';

const API_URL = process.env.REACT_APP_API_URL || '/api';

/**
 * Recursively deserializes a compressed API response payload by expanding
 * short numeric dictionary keys back into their original field names.
 *
 * @param {*}      compressedData - The compressed value to deserialize.
 * @param {Object} dictionary     - Map of short key → long key.
 * @returns {*} The fully deserialized value.
 */
const deserializeData = (compressedData, dictionary) => {
    if (typeof compressedData !== 'object' || compressedData === null) {
        return compressedData;
    }

    if (Array.isArray(compressedData)) {
        return compressedData.map((item) => deserializeData(item, dictionary));
    }

    const decompressed = {};
    for (const shortKey in compressedData) {
        const longKey = dictionary[shortKey] || shortKey;
        decompressed[longKey] = deserializeData(compressedData[shortKey], dictionary);
    }
    return decompressed;
};

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * Request interceptor — attaches the JWT Bearer token and the active client
 * identifier to every outgoing request.
 *
 * Both values are read via `embedStorage.getItem`, which resolves to
 * `localStorage` in embed windows and `sessionStorage` in the dashboard.
 * This ensures that API calls made inside embed popups reuse the session
 * established during the last login without requiring re-authentication.
 */
api.interceptors.request.use(
    (config) => {
        const token = embedStorage.getItem('token');
        const cid   = embedStorage.getItem('currentCid');

        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        if (cid) {
            config.headers['X-Client-Id'] = cid;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

/**
 * Response interceptor — handles two concerns:
 *
 * 1. **Dictionary decompression**: when the server returns a payload shaped
 *    as `{ dictionary, data }` the response body is transparently replaced
 *    with the fully expanded object so call-sites never need to be aware of
 *    the compression scheme.
 *
 * 2. **401 handling**: calls `clearAuthData()` which removes all auth keys
 *    from **both** `localStorage` and `sessionStorage` via the embedStorage
 *    abstraction, then redirects to `/login`.
 *    Previously this handler iterated a hardcoded subset of keys and only
 *    removed them from one storage backend, leaving residual credentials that
 *    could be picked up by the next session.
 */
api.interceptors.response.use(
    (response) => {
        const responseData = response.data;

        if (responseData?.dictionary && responseData?.data) {
            response.data = deserializeData(responseData.data, responseData.dictionary);
        }

        return response;
    },
    (error) => {
        if (error.response?.status === 401) {
            clearAuthData();
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;