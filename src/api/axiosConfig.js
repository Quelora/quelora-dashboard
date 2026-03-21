// src/api/axiosConfig.js
import axios from 'axios';
import embedStorage from '../utils/embedStorage';

const API_URL = process.env.REACT_APP_API_URL || '/api';

/**
 * Recursively deserializes a compressed API response payload by expanding
 * short dictionary keys back into their original long-form field names.
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
        return compressedData.map(item => deserializeData(item, dictionary));
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
 * Both values are read via `embedStorage.getItem`, which transparently
 * resolves to `localStorage` in embed windows (with a `sessionStorage`
 * fallback) and to `sessionStorage` in the main dashboard. This ensures
 * that API calls made inside embed popups reuse the token stored during a
 * previous authentication without requiring a new login.
 */
api.interceptors.request.use(
    config => {
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
    error => Promise.reject(error)
);

/**
 * Response interceptor — handles two concerns:
 *
 * 1. **Dictionary decompression**: when the server returns a payload shaped
 *    as `{ dictionary, data }` the response body is transparently replaced
 *    with the fully expanded object so call-sites never need to be aware of
 *    the compression scheme.
 *
 * 2. **401 handling**: clears all auth data via `embedStorage.removeItem`
 *    (which in embed context removes from both `localStorage` and
 *    `sessionStorage`) and redirects to `/login`.
 */
api.interceptors.response.use(
    response => {
        const responseData = response.data;

        if (responseData?.dictionary && responseData?.data) {
            response.data = deserializeData(responseData.data, responseData.dictionary);
        }

        return response;
    },
    error => {
        if (error.response?.status === 401) {
            embedStorage.removeItem('token');
            embedStorage.removeItem('currentCid');
            embedStorage.removeItem('tokenExpiration');
            embedStorage.removeItem('clients');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;