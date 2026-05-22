/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

/* filepath: src/api/gamification.js */
/**
 * @fileoverview Gamification API client.
 * Thin wrappers around the axios instance for all gamification-related endpoints.
 * Every function that targets a specific client requires a non-empty `cid` argument.
 */

import api from './axiosConfig';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Builds an axios config object that injects the `X-Client-Id` header.
 *
 * @param {string} cid - Client identifier.
 * @returns {import('axios').AxiosRequestConfig}
 */
const getHeaders = (cid) => (cid ? { headers: { 'X-Client-Id': cid } } : {});

// ─── Config ───────────────────────────────────────────────────────────────────

/**
 * Fetches the gamification configuration for a client.
 *
 * @param {string} cid
 * @returns {Promise<Object|null>} The config document, or null if no cid is provided.
 */
export const getGamificationConfig = async (cid) => {
    if (!cid) return null;
    const response = await api.get('/gamification/config', getHeaders(cid));
    return response.data;
};

/**
 * Creates or updates the gamification configuration for a client.
 *
 * @param {string} cid
 * @param {Object} data - Partial or full config fields.
 * @returns {Promise<Object>} `{ success, config }`
 */
export const updateGamificationConfig = async (cid, data) => {
    if (!cid) throw new Error('Client ID is required');
    const response = await api.put('/gamification/config', data, getHeaders(cid));
    return response.data;
};

// ─── Rules ────────────────────────────────────────────────────────────────────

/**
 * Returns all gamification rules for a client (existing + defaults for missing actions).
 *
 * @param {string} cid
 * @returns {Promise<Array>}
 */
export const getGamificationRules = async (cid) => {
    if (!cid) return [];
    const response = await api.get('/gamification/rules', getHeaders(cid));
    return response.data;
};

/**
 * Creates or updates a single gamification rule.
 *
 * @param {string} cid
 * @param {Object} ruleData - Rule document including `actionType`.
 * @returns {Promise<Object>} `{ success, rule }`
 */
export const updateGamificationRule = async (cid, ruleData) => {
    if (!cid) throw new Error('Client ID is required');
    const response = await api.put('/gamification/rules', ruleData, getHeaders(cid));
    return response.data;
};

// ─── Levels ───────────────────────────────────────────────────────────────────

/**
 * Returns all gamification levels for a client, sorted by minimum points.
 *
 * @param {string} cid
 * @returns {Promise<Array>}
 */
export const getGamificationLevels = async (cid) => {
    if (!cid) return [];
    const response = await api.get('/gamification/levels', getHeaders(cid));
    return response.data;
};

/**
 * Creates or updates a gamification level.
 *
 * @param {string} cid
 * @param {Object} levelData - Level document. Include `_id` to update an existing level.
 * @returns {Promise<Object>} `{ success, level }`
 */
export const upsertGamificationLevel = async (cid, levelData) => {
    if (!cid) throw new Error('Client ID is required');
    const response = await api.post('/gamification/levels', levelData, getHeaders(cid));
    return response.data;
};

/**
 * Deletes a gamification level by ID.
 *
 * @param {string} cid
 * @param {string} levelId - MongoDB ObjectId of the level to delete.
 * @returns {Promise<Object>} `{ success }`
 */
export const deleteGamificationLevel = async (cid, levelId) => {
    if (!cid) throw new Error('Client ID is required');
    const response = await api.delete(`/gamification/levels/${levelId}`, getHeaders(cid));
    return response.data;
};

// ─── Quests ───────────────────────────────────────────────────────────────────

/**
 * Returns all gamification quests for a client.
 *
 * @param {string} cid
 * @returns {Promise<Array>}
 */
export const getGamificationQuests = async (cid) => {
    if (!cid) return [];
    const response = await api.get('/gamification/quests', getHeaders(cid));
    return response.data;
};

/**
 * Creates a new gamification quest.
 *
 * @param {string} cid
 * @param {Object} questData
 * @returns {Promise<Object>} `{ success, quest }`
 */
export const createGamificationQuest = async (cid, questData) => {
    if (!cid) throw new Error('Client ID is required');
    const response = await api.post('/gamification/quests', questData, getHeaders(cid));
    return response.data;
};

/**
 * Updates an existing quest.
 *
 * @param {string} cid
 * @param {string} questId
 * @param {Object} questData
 * @returns {Promise<Object>} `{ success, quest }`
 */
export const updateGamificationQuest = async (cid, questId, questData) => {
    if (!cid) throw new Error('Client ID is required');
    const response = await api.put(`/gamification/quests/${questId}`, questData, getHeaders(cid));
    return response.data;
};

/**
 * Deletes a quest by ID.
 *
 * @param {string} cid
 * @param {string} questId
 * @returns {Promise<Object>} `{ success }`
 */
export const deleteGamificationQuest = async (cid, questId) => {
    if (!cid) throw new Error('Client ID is required');
    const response = await api.delete(`/gamification/quests/${questId}`, getHeaders(cid));
    return response.data;
};

// ─── Shop Items ───────────────────────────────────────────────────────────────

/**
 * Returns all shop items for a client (admin view — includes inactive items).
 *
 * @param {string} cid
 * @returns {Promise<Array>}
 */
export const getGamificationShopItems = async (cid) => {
    if (!cid) return [];
    const response = await api.get('/gamification/shop/items', getHeaders(cid));
    return response.data;
};

/**
 * Creates a new shop item.
 *
 * @param {string} cid
 * @param {Object} itemData
 * @returns {Promise<Object>} `{ success, item }`
 */
export const createGamificationShopItem = async (cid, itemData) => {
    if (!cid) throw new Error('Client ID is required');
    const response = await api.post('/gamification/shop/items', itemData, getHeaders(cid));
    return response.data;
};

/**
 * Updates an existing shop item.
 *
 * @param {string} cid
 * @param {string} itemId
 * @param {Object} itemData
 * @returns {Promise<Object>} `{ success, item }`
 */
export const updateGamificationShopItem = async (cid, itemId, itemData) => {
    if (!cid) throw new Error('Client ID is required');
    const response = await api.put(`/gamification/shop/items/${itemId}`, itemData, getHeaders(cid));
    return response.data;
};

/**
 * Deletes a shop item by ID.
 *
 * @param {string} cid
 * @param {string} itemId
 * @returns {Promise<Object>} `{ success }`
 */
export const deleteGamificationShopItem = async (cid, itemId) => {
    if (!cid) throw new Error('Client ID is required');
    const response = await api.delete(`/gamification/shop/items/${itemId}`, getHeaders(cid));
    return response.data;
};

// ─── Asset Uploads ────────────────────────────────────────────────────────────

/**
 * Uploads a full-resolution asset image (main frame image) for a shop item.
 * Animated images (APNG, GIF, WebP) are sent as-is; static images are typically
 * cropped client-side before calling this function.
 *
 * @param {string} cid
 * @param {File}   file - The image file to upload. Field name: `media`.
 * @returns {Promise<{ success: boolean, mediaUrl: string, mediaType: string }>}
 */
export const uploadGamificationMedia = async (cid, file) => {
    if (!cid) throw new Error('Client ID is required for upload');
    const formData = new FormData();
    formData.append('media', file);
    const response = await api.post('/gamification/upload/asset', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
            'X-Client-Id': cid,
        },
    });
    return response.data;
};

/**
 * Uploads a thumbnail image for a shop item.
 * Thumbnails must be pre-processed to 46×46 px before upload.
 * For animated frames (APNG/GIF), use the bundled `resize-thumbs.py` script
 * to resize while preserving animation frames.
 *
 * @param {string} cid
 * @param {File}   file - The thumbnail file to upload. Field name: `media`.
 * @returns {Promise<{ success: boolean, mediaUrl: string, mediaType: string }>}
 */
export const uploadGamificationThumb = async (cid, file) => {
    if (!cid) throw new Error('Client ID is required for upload');
    const formData = new FormData();
    formData.append('media', file);
    const response = await api.post('/gamification/upload/thumb', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
            'X-Client-Id': cid,
        },
    });
    return response.data;
};

/**
 * Bulk-imports shop items from a `.gpack` archive (tar.gz).
 *
 * Expected archive structure:
 *   manifest.json          — array of item definitions (see backend docs)
 *   assets/                — full-resolution images
 *   assets/thumbs/         — pre-generated 46×46 thumbnails
 *
 * Duplicate prevention: items are matched by `{ cid, name }`.
 * Existing items are updated; new items are inserted.
 *
 * @param {string} cid
 * @param {File}   file - The `.gpack` file. Field name: `pack`.
 * @returns {Promise<{
 *   success:  boolean,
 *   summary:  { total: number, inserted: number, updated: number, failed: number },
 *   errors:   Array<{ name: string, error: string }>
 * }>}
 */
export const importGamificationPack = async (cid, file) => {
    if (!cid) throw new Error('Client ID is required for import');
    const formData = new FormData();
    formData.append('pack', file);
    const response = await api.post('/gamification/shop/import', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
            'X-Client-Id': cid,
        },
    });
    return response.data;
};

// ─── Ledger ───────────────────────────────────────────────────────────────────

/**
 * Returns the transaction ledger for a user profile.
 *
 * @param {string} cid
 * @param {string} author  - Profile `author` string or MongoDB ObjectId.
 * @param {number} [page=1]
 * @param {number} [limit=20]
 * @returns {Promise<{ data: Array, pagination: Object }>}
 */
export const getUserLedger = async (cid, author, page = 1, limit = 20) => {
    if (!cid)    throw new Error('Client ID is required');
    if (!author) throw new Error('Author is required');
    const response = await api.get(`/gamification/ledger/${author}`, {
        params: { page, limit },
        ...getHeaders(cid),
    });
    return response.data;
};

// ─── Economy ──────────────────────────────────────────────────────────────────

/**
 * Returns aggregated economy statistics for a client over an optional date range.
 *
 * @param {string}     cid
 * @param {Date|null}  [from=null] - Start of the range (inclusive).
 * @param {Date|null}  [to=null]   - End of the range (inclusive).
 * @returns {Promise<{ success: boolean, stats: Object }|null>}
 */
export const getEconomyStats = async (cid, from = null, to = null) => {
    if (!cid) return null;
    const params = {};
    if (from) params.from = from instanceof Date ? from.toISOString() : from;
    if (to)   params.to   = to   instanceof Date ? to.toISOString()   : to;
    const response = await api.get('/gamification/economy', {
        params,
        ...getHeaders(cid),
    });
    return response.data;
};

// ─── Admin Actions ────────────────────────────────────────────────────────────

/**
 * Applies a manual coin balance adjustment to a user profile.
 *
 * @param {string} cid
 * @param {{ profileId: string, amount: number, type: string, description: string }} data
 * @returns {Promise<Object>} `{ success }`
 */
export const adjustUserBalance = async (cid, data) => {
    if (!cid) throw new Error('Client ID is required');
    const response = await api.post('/gamification/adjustment', data, getHeaders(cid));
    return response.data;
};

/**
 * Manually assigns a gamification level to a user profile.
 *
 * @param {string} cid
 * @param {{ profileId: string, levelId: string, reason: string }} data
 * @returns {Promise<Object>} `{ success }`
 */
export const assignUserLevel = async (cid, data) => {
    if (!cid) throw new Error('Client ID is required');
    const response = await api.post('/gamification/level/assign', data, getHeaders(cid));
    return response.data;
};

/**
 * Fetches the full gamification status for a user profile (admin view).
 *
 * @param {string} cid
 * @param {string} author - Profile `author` string or MongoDB ObjectId.
 * @returns {Promise<Object|null>}
 */
export const getGamificationUserProfile = async (cid, author) => {
    if (!cid || !author) return null;
    try {
        const response = await api.get(`/gamification/status/${author}`, getHeaders(cid));
        return response.data;
    } catch (error) {
        console.error('Error fetching gamification profile', error);
        return null;
    }
};

/**
 * Dispatches a test gamification notification to a user profile.
 *
 * @param {string} cid
 * @param {{ profileId: string, type: string, metadata?: Object }} data
 * @returns {Promise<Object>} `{ success, message }`
 */
export const sendTestNotification = async (cid, data) => {
    if (!cid) throw new Error('Client ID is required');
    const response = await api.post('/gamification/test/notify', data, getHeaders(cid));
    return response.data;
};