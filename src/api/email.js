/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

// ./src/api/email.js
import api from './axiosConfig';

export const email = async (cid, recipient, subject, body) => {
	try {
		const response = await api.post('/notifications/send-mail', {cid, recipient, subject, body});
		return response.data;
	} catch (error) {
		throw error.response?.data?.message || "Error sending email";
	}
};