/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

/**
 * @fileoverview Unified storage abstraction that selects the correct Web Storage
 * backend based on the rendering context and ensures full session isolation.
 *
 * ## Context detection
 * A request is considered an **embed context** exclusively when the current
 * pathname starts with `/embed/`. The previous heuristic (`window.opener !== null`)
 * has been removed because any `window.open()` call — including unrelated popups —
 * activated `localStorage`, causing auth data written by an embed login to persist
 * across browser sessions and contaminate subsequent dashboard logins.
 *
 * ## Storage routing
 * | Context   | Primary storage | Auth-key mirror |
 * |-----------|-----------------|-----------------|
 * | Dashboard | sessionStorage  | localStorage    |
 * | Embed     | localStorage    | —               |
 *
 * Dashboard writes auth keys to **both** storages so that embed windows opened
 * afterwards can reuse the active session without requiring a separate login.
 * The embed context reads **exclusively** from `localStorage` — there is no
 * cross-storage fallback. This eliminates the identity-crossover bug where an
 * admin session stored in `sessionStorage` leaked into embed windows.
 *
 * ## Cleanup guarantee
 * `removeItem` and `clear` always operate on **both** storages, regardless of
 * context. This ensures that a dashboard logout never leaves stale credentials in
 * `localStorage` that could be picked up by a future embed window.
 *
 * @module utils/embedStorage
 */

/**
 * Keys that carry authentication or session-identity data.
 * When the dashboard writes any of these keys, the value is mirrored to
 * `localStorage` so that embed windows can reuse the active session.
 *
 * @type {Set<string>}
 */
const AUTH_KEYS = new Set([
    'token',
    'clients',
    'user',
    'userKey',
    'tokenExpiration',
    'currentCid',
]);

/**
 * Returns `true` when the current page is running inside an embed window.
 *
 * Detection is based solely on the pathname starting with `/embed/`.
 * The `window.opener` heuristic has been intentionally removed: relying on
 * the opener caused every `window.open()` call to be treated as an embed
 * context, which routed auth writes to `localStorage` and allowed stale
 * credentials to survive browser restarts.
 *
 * @returns {boolean}
 */
export const isEmbedContext = () => {
    try {
        return window.location.pathname.startsWith('/embed/');
    } catch {
        return false;
    }
};

/**
 * Resolves the primary `Storage` instance for the current context.
 *
 * @returns {Storage} `localStorage` in embed context, `sessionStorage` otherwise.
 */
const resolveStorage = () => (isEmbedContext() ? localStorage : sessionStorage);

/**
 * Stores `value` under `key` in the context-appropriate storage.
 *
 * In **dashboard context**, auth keys are additionally mirrored to
 * `localStorage` so that embed windows opened from the same browser can read
 * the active session without requiring a separate login flow.
 *
 * In **embed context**, the value is written only to `localStorage`.
 *
 * @param {string} key   - Storage key.
 * @param {string} value - String value to store.
 * @returns {void}
 */
export const setItem = (key, value) => {
    resolveStorage().setItem(key, value);

    if (!isEmbedContext() && AUTH_KEYS.has(key)) {
        localStorage.setItem(key, value);
    }
};

/**
 * Retrieves the string value associated with `key` from the context-appropriate
 * storage.
 *
 * Unlike the previous implementation, there is **no cross-storage fallback**.
 * The embed context reads exclusively from `localStorage`; the dashboard context
 * reads exclusively from `sessionStorage`. The fallback that previously read
 * from `sessionStorage` when `localStorage` was empty was the root cause of
 * admin credentials leaking into embed windows.
 *
 * @param {string} key - Storage key.
 * @returns {string|null} The stored value, or `null` if not found.
 */
export const getItem = (key) => resolveStorage().getItem(key);

/**
 * Removes `key` from **both** `localStorage` and `sessionStorage`,
 * regardless of the current context.
 *
 * This guarantees that a dashboard logout clears any copy of the key that
 * may have been written to `localStorage` via the auth-key mirror, preventing
 * stale credentials from being picked up by future embed windows.
 *
 * @param {string} key - Storage key.
 * @returns {void}
 */
export const removeItem = (key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
};

/**
 * Clears all authentication data from both storage backends.
 *
 * - Auth keys are explicitly removed from `localStorage`.
 * - `sessionStorage` is cleared in full.
 *
 * This guarantees complete cleanup on logout or forced re-authentication,
 * regardless of which context triggered the call.
 *
 * @returns {void}
 */
export const clear = () => {
    AUTH_KEYS.forEach((key) => localStorage.removeItem(key));
    sessionStorage.clear();
};

const embedStorage = { isEmbedContext, setItem, getItem, removeItem, clear };

export default embedStorage;