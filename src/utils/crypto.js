// ./src/utils/crypto.js
import CryptoJS from 'crypto-js';

export function generateKeyFromString(inputString) {
    if (!inputString || typeof inputString !== 'string') {
        throw new Error('Input must be a non-empty string');
    }
    return CryptoJS.SHA256(inputString).toString(CryptoJS.enc.Hex);
}

export function decryptJSON(encryptedText, encryptionKey) {

    try {
        if (!encryptedText || typeof encryptedText !== 'string' || encryptedText.trim() === '') {
            throw new Error('Encrypted text must be a non-empty string');
        }

        const [ivHex, cipherText] = encryptedText.split(':');
        if (!ivHex || !cipherText) {
            throw new Error('Invalid encrypted text format, expected iv:ciphertext');
        }

        const iv = CryptoJS.enc.Hex.parse(ivHex);
        const key = CryptoJS.enc.Hex.parse(encryptionKey);

        const decrypted = CryptoJS.AES.decrypt(
            {ciphertext: CryptoJS.enc.Hex.parse(cipherText)},
            key,
            {iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7}
        );

        const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
        if (!decryptedText) {
            throw new Error('Decryption failed, no data returned');
        }
        return JSON.parse(decryptedText);
    } catch (error) {
        throw error;
    }
}

export function encryptJSON(jsonObject, encryptionKey) {
    if (typeof jsonObject !== 'object' || jsonObject === null) {
         throw new Error('Input must be a valid JSON object');
    }

    const iv = CryptoJS.lib.WordArray.random(16);
    const key = CryptoJS.enc.Hex.parse(encryptionKey);
    const text = JSON.stringify(jsonObject);

    const encrypted = CryptoJS.AES.encrypt(text, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
    });

    return `${iv.toString(CryptoJS.enc.Hex)}:${encrypted.ciphertext.toString(CryptoJS.enc.Hex)}`;
}

export function getDecryptedClient(client) {
    const defaultClientConfig = {
        login: {}, moderation: {}, toxicity: {}, translation: {},
        geolocation: {}, language: {}, cors: {allowedOrigins: []},
        captcha: {}, modeDiscovery: false, discoveryDataUrl: '',
        entityConfig: {selector: 'article', entityIdAttribute: 'href', interactionPlacement: {position: 'after', relativeTo: '.article-actions'}}
    };
    const defaultVapidConfig = {publicKey: '', privateKey: '', email: '', iconBase64: ''};
    const defaultEmailConfig = {smtp_host: '', smtp_port: '', smtp_user: '', smtp_pass: ''};
    const defaultPostConfig = {
        interaction: {allow_comments: true, allow_likes: true, allow_shares: true, allow_replies: true},
        moderation: {enable_toxicity_filter: true, enable_content_moderation: false, moderation_prompt: '', banned_words: []},
        limits: {comment_text: 200, reply_text: 200},
        editing: {allow_edits: true, allow_delete: true, edit_time_limit: 5},
        audio: {enable_mic_transcription: false, save_comment_audio: false, max_recording_seconds: 60, bitrate: 16000}
    };

    if (!client || !client.cid || typeof client.cid !== 'string' || client.cid.trim() === '') {
        throw new Error('Invalid client object for decryption');
    }

    const key = generateKeyFromString(client.cid);
    
    const safeDecrypt = (encryptedData, defaultValue) => {
        if (!encryptedData || typeof encryptedData !== 'string' || encryptedData.trim() === '') {
            return defaultValue; 
        }
        try {
            return decryptJSON(encryptedData, key);
        } catch (error) {
            console.error(`Decryption failed for key in client ${client.cid}.`, error.message);
            return defaultValue; 
        }
    };
    
    try {
        const decryptedConfig = safeDecrypt(client.config, defaultClientConfig);
        const decryptedVapid = safeDecrypt(client.vapid, defaultVapidConfig);
        const decryptedEmail = safeDecrypt(client.email, defaultEmailConfig);
        const decryptedPostConfig = safeDecrypt(client.postConfig, defaultPostConfig);

        return {
            cid: client.cid,
            description: client.description,
            apiUrl: client.apiUrl,
            siteUrl: client.siteUrl,
            config: {...defaultClientConfig, ...decryptedConfig},
            vapid: {...defaultVapidConfig, ...decryptedVapid},
            email: {...defaultEmailConfig, ...decryptedEmail},
            postConfig: {...defaultPostConfig, ...decryptedPostConfig},
        };

    } catch (error) {
        console.error(`Failed to construct decrypted client ${client.cid}.`, error);
        return {...client, config: defaultClientConfig, vapid: defaultVapidConfig, email: defaultEmailConfig, postConfig: defaultPostConfig, decryptionError: true};
    }
}

export function getEncryptedClient(client) {
    if (!client || !client.cid || typeof client.cid !== 'string') {
        throw new Error('Invalid client object for encryption');
    }

    const key = generateKeyFromString(client.cid);
    
    return {
        cid: client.cid,
        description: client.description,
        apiUrl: client.apiUrl,
        siteUrl: client.siteUrl,
        config: encryptJSON(client.config ?? {}, key), 
        vapid: encryptJSON(client.vapid ?? {}, key),
        email: encryptJSON(client.email ?? {}, key),
        postConfig: encryptJSON(client.postConfig ?? {}, key),
    };
}