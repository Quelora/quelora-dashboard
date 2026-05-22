/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

// ./src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './assets/css/index.css';
import './i18n';

const originalError = console.error;
console.error = (msg, ...args) => {
    if (
        typeof msg === 'string' &&
        (
            msg.includes('defaultProps') ||
            msg.includes('React Router Future Flag') ||
            msg.includes('Warning: XAxis') ||
            msg.includes('Warning: YAxis')
        )
    ) return;
    originalError(msg, ...args);
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <App/>
);