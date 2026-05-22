/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

// ./src/api/moderation.js
import api from './axiosConfig';

export const moderation = async (cid, text, config) => {
	try {
		const response = await api.post('/client/moderation', {cid, text, config});
		return response.data;

	} catch (error) {
		throw new Error("Connection error");
	}
};