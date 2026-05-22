/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

// src/api/reputation.js
import api from './axiosConfig';

export const getReputationConfig = async (cid) => {
    if (!cid) throw new Error("Client ID is required");
    const response = await api.get(`/reputation/${cid}`);
    return response.data?.data; // Adjusted to match your backend response structure { success: true, data: ... }
};

export const saveReputationConfig = async (cid, data) => {
    if (!cid) throw new Error("Client ID is required");
    const response = await api.put(`/reputation/${cid}`, data);
    return response.data;
};