// src/utils/embedStorage.js

/**
 * @fileoverview
 * Unified storage abstraction that transparently selects the correct
 * Web Storage backend depending on the rendering context:
 *
 *  - **Embed context**  (`/embed/*` routes, or when `window.opener` is set):
 *    uses `localStorage` so that authentication data survives across
 *    multiple `window.open()` calls originating from the host site.
 *
 *  - **Dashboard context** (all other routes):
 *    uses `sessionStorage` to preserve the existing tab-isolated
 *    security model.
 *
 * All call-sites that previously referenced `sessionStorage` directly
 * should import and use this module instead.
 */

/**
 * Returns `true` when the current page is running inside an embed window.
 *
 * Detection criteria (either is sufficient):
 *  1. The pathname starts with `/embed/`.
 *  2. The window was opened by another window (`window.opener !== null`).
 *
 * @returns {boolean}
 */
export const isEmbedContext = () => {
    try {
        const isEmbedPath = window.location.pathname.startsWith('/embed/');
        const hasOpener   = window.opener !== null;
        return isEmbedPath || hasOpener;
    } catch {
        return false;
    }
};

/**
 * Resolves the appropriate `Storage` instance for the current context.
 *
 * @returns {Storage} `localStorage` in embed context, `sessionStorage` otherwise.
 */
const resolveStorage = () =>
    isEmbedContext() ? localStorage : sessionStorage;

/**
 * Stores a string value under `key` in the context-appropriate storage.
 *
 * @param {string} key   - Storage key.
 * @param {string} value - String value to store.
 * @returns {void}
 */
export const setItem = (key, value) => {
    resolveStorage().setItem(key, value);
};

/**
 * Retrieves the string value associated with `key` from the
 * context-appropriate storage.
 *
 * When running in embed context the function first checks `localStorage`;
 * if the key is absent it falls back to `sessionStorage` so that a user
 * who authenticated in the dashboard can reuse that session in an embed
 * window without re-logging in.
 *
 * @param {string} key - Storage key.
 * @returns {string|null} The stored value, or `null` if not found.
 */
export const getItem = (key) => {
    if (isEmbedContext()) {
        return localStorage.getItem(key) ?? sessionStorage.getItem(key);
    }
    return sessionStorage.getItem(key);
};

/**
 * Removes `key` from the context-appropriate storage.
 * In embed context, the key is removed from **both** storages to avoid
 * stale data surviving in the fallback backend.
 *
 * @param {string} key - Storage key.
 * @returns {void}
 */
export const removeItem = (key) => {
    if (isEmbedContext()) {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
    } else {
        sessionStorage.removeItem(key);
    }
};

/**
 * Clears all keys from the context-appropriate storage.
 * In embed context only `localStorage` is cleared; `sessionStorage`
 * is left untouched because it belongs to the dashboard tab.
 *
 * @returns {void}
 */
export const clear = () => {
    if (isEmbedContext()) {
        localStorage.clear();
    } else {
        sessionStorage.clear();
    }
};

const embedStorage = { isEmbedContext, setItem, getItem, removeItem, clear };

export default embedStorage;