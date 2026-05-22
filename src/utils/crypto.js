/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

// ./src/utils/crypto.js
import CryptoJS from 'crypto-js';

/**
 * Generates a SHA-256 hash from an input string to be used as an AES encryption key.
 *
 * @param {string} inputString - The raw string to hash (e.g., a Client ID).
 * @returns {string} The Hex-encoded SHA-256 hash.
 * @throws {Error} If the input is not a valid non-empty string.
 */
export function generateKeyFromString(inputString) {
    if (!inputString || typeof inputString !== 'string') {
        throw new Error('Input must be a non-empty string');
    }
    return CryptoJS.SHA256(inputString).toString(CryptoJS.enc.Hex);
}

/**
 * Encrypts a JSON object into an AES-CBC encrypted string.
 * * @param {Object} data - The JSON object to encrypt.
 * @param {string} encryptionKey - The Hex-encoded encryption key.
 * @returns {string} The encrypted string in the format "ivHex:cipherTextHex".
 */
export function encryptJSON(data, encryptionKey) {
    if (data === null || data === undefined) return '';
    
    const iv = CryptoJS.lib.WordArray.random(16);
    const key = CryptoJS.enc.Hex.parse(encryptionKey);
    const jsonString = JSON.stringify(data);
    
    const encrypted = CryptoJS.AES.encrypt(jsonString, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });
    
    return iv.toString(CryptoJS.enc.Hex) + ':' + encrypted.ciphertext.toString(CryptoJS.enc.Hex);
}

/**
 * Decrypts an AES-CBC encrypted JSON string using the provided Hex-encoded key.
 *
 * @param {string} encryptedText - The encrypted payload in the format "ivHex:cipherTextHex".
 * @param {string} encryptionKey - The Hex-encoded decryption key.
 * @returns {Object} The parsed decrypted JSON object.
 * @throws {Error} If decryption fails, the data is malformed, or the payload is empty.
 */
export function decryptJSON(encryptedText, encryptionKey) {
    try {
        if (!encryptedText || typeof encryptedText !== 'string' || encryptedText.trim() === '') {
            throw new Error('Encrypted text must be a non-empty string');
        }

        const [ivHex, cipherTextHex] = encryptedText.split(':');
        if (!ivHex || !cipherTextHex) {
            throw new Error('Invalid encrypted text format, expected iv:cipherTextHex');
        }

        const iv = CryptoJS.enc.Hex.parse(ivHex);
        const key = CryptoJS.enc.Hex.parse(encryptionKey);
        const cipherParams = CryptoJS.lib.CipherParams.create({
            ciphertext: CryptoJS.enc.Hex.parse(cipherTextHex)
        });

        const decrypted = CryptoJS.AES.decrypt(cipherParams, key, {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });

        const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
        if (!decryptedString) {
            throw new Error('Decryption failed, result is empty');
        }

        return JSON.parse(decryptedString);
    } catch (error) {
        throw error;
    }
}

/**
 * Safely decrypts a field, returning a default object if decryption fails or is absent.
 *
 * @param {string|Object} encryptedData - The encrypted data to decrypt.
 * @param {Object} defaultConfig - The default fallback configuration.
 * @param {string} key - The decryption key.
 * @returns {Object} The decrypted data or the default configuration.
 */
function safeDecrypt(encryptedData, defaultConfig, key) {
    if (!encryptedData) return defaultConfig;
    try {
        return typeof encryptedData === 'string' 
            ? decryptJSON(encryptedData, key) 
            : encryptedData;
    } catch (error) {
        console.error('Safe decrypt failed:', error);
        return defaultConfig;
    }
}

/**
 * Decrypts an entire client payload deeply and applies fallback configurations.
 *
 * @param {Object} client - The encrypted client object.
 * @returns {Object} The decrypted client object ready for the frontend.
 */
export function getDecryptedClient(client) {
    const defaultClientConfig = {};
    const defaultVapidConfig = {};
    const defaultEmailConfig = {};
    const defaultPostConfig = {};
    const defaultTurnConfig = {};
    const defaultNostrConfig = {};
    const defaultP2pConfig = {};
    const defaultResilienceConfig = {};

    try {
        if (!client || !client.cid || typeof client.cid !== 'string') {
            throw new Error('Invalid client object');
        }

        const key = generateKeyFromString(client.cid);

        const decryptedConfig     = safeDecrypt(client.config,     defaultClientConfig,     key);
        const decryptedVapid      = safeDecrypt(client.vapid,      defaultVapidConfig,      key);
        const decryptedEmail      = safeDecrypt(client.email,      defaultEmailConfig,      key);
        const decryptedPostConfig = safeDecrypt(client.postConfig, defaultPostConfig,       key);
        const decryptedTurn       = safeDecrypt(client.turn,       defaultTurnConfig,       key);
        const decryptedNostr      = safeDecrypt(client.nostr,      defaultNostrConfig,      key);
        const decryptedP2p        = safeDecrypt(client.p2p,        defaultP2pConfig,        key);
        const decryptedResilience = safeDecrypt(client.resilience, defaultResilienceConfig, key);

        return {
            cid:               client.cid,
            description:       client.description,
            apiUrl:            client.apiUrl,
            siteUrl:           client.siteUrl,
            config:            { ...defaultClientConfig,     ...decryptedConfig },
            vapid:             { ...defaultVapidConfig,      ...decryptedVapid },
            email:             { ...defaultEmailConfig,      ...decryptedEmail },
            postConfig:        { ...defaultPostConfig,       ...decryptedPostConfig },
            turn:              { ...defaultTurnConfig,       ...decryptedTurn },
            nostr:             { ...defaultNostrConfig,      ...decryptedNostr },
            p2p:               { ...defaultP2pConfig,        ...decryptedP2p },
            resilience:        { ...defaultResilienceConfig, ...decryptedResilience },
            enterpriseModules: Array.isArray(client.enterpriseModules) ? client.enterpriseModules : [],
            communityPlugins:  Array.isArray(client.communityPlugins)  ? client.communityPlugins  : [],
        };
    } catch (error) {
        console.error(`Failed to construct decrypted client ${client?.cid}.`, error);
        return {
            ...client,
            config:          defaultClientConfig,
            vapid:           defaultVapidConfig,
            email:           defaultEmailConfig,
            postConfig:      defaultPostConfig,
            turn:            defaultTurnConfig,
            nostr:           defaultNostrConfig,
            p2p:             defaultP2pConfig,
            resilience:      defaultResilienceConfig,
            decryptionError: true
        };
    }
}

/**
 * Encrypts a plain-text frontend client object into an encrypted payload suitable
 * for backend persistence. All fields — including turn, nostr, p2p, and resilience — are
 * always encrypted and transmitted. The backend controller is responsible for
 * ignoring empty objects to prevent overwriting existing stored values.
 *
 * @param {Object} client - The plain-text client object.
 * @returns {Object} The fully encrypted client object.
 * @throws {Error} If the client object is missing a valid CID.
 */
export function getEncryptedClient(client) {
    if (!client || !client.cid || typeof client.cid !== 'string') {
        throw new Error('Invalid client object for encryption');
    }

    const key = generateKeyFromString(client.cid);

    return {
        cid:         client.cid,
        description: client.description,
        apiUrl:      client.apiUrl,
        siteUrl:     client.siteUrl,
        config:      encryptJSON(client.config     ?? {}, key),
        vapid:       encryptJSON(client.vapid      ?? {}, key),
        email:       encryptJSON(client.email      ?? {}, key),
        postConfig:  encryptJSON(client.postConfig ?? {}, key),
        turn:        encryptJSON(client.turn       ?? {}, key),
        nostr:       encryptJSON(client.nostr      ?? {}, key),
        p2p:         encryptJSON(client.p2p        ?? {}, key),
        resilience:  encryptJSON(client.resilience ?? {}, key),
    };
}