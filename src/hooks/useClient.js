/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

// src/hooks/useClient.js
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Swal from 'sweetalert2';
import {
    saveClientConfig,
    deleteClient,
    loadClientsFromSession,
    updateClientResilienceInSession,
} from '../api/auth';

/**
 * @typedef {'basic'|'advanced'} ConfigMode
 */

/**
 * @typedef {Object} ClientConfig
 * @property {string}  description
 * @property {string}  apiUrl
 * @property {string}  siteUrl
 * @property {Object}  config
 * @property {Object}  vapid
 * @property {Object}  email
 * @property {Object}  postConfig
 * @property {Object}  turn
 * @property {Object}  nostr
 * @property {Object}  p2p
 */

/** @type {ClientConfig} */
const DEFAULT_CONFIG = {
    description: '',
    apiUrl:      'https://api.quelora.org',
    siteUrl:     'https://www.quelora.org',
    config: {
        login: {
            queloraSession:  false,
            loginUrl:        '',
            logoutUrl:       '',
            registrationUrl: '',
            baseUrl:         'https://api.quelora.org/login',
            providers:       [],
            providerDetails: {
                Google:   { clientId: '', clientSecret: '' },
                Facebook: { clientId: '', clientSecret: '' },
                X:        { clientId: '', clientSecret: '' },
                Apple:    { clientId: '', clientSecret: '' },
                Quelora:  { enabled: false },
            },
        },
        moderation:       { enabled: false, provider: 'OpenAI',          apiKey: '', configJson: '', prompt: '' },
        toxicity: {
            enabled: false,
            provider: 'Perspective',
            thresholds: {
                toxicity: 0.8,
                severe_toxicity: 0.8,
                obscene: 0.8,
                threat: 0.8,
                insult: 0.8,
                identity_attack: 0.8
            },
            providerDetails: {
                Perspective: { apiKey: '', url: '' },
                Detoxifi: { apiKey: '', url: '' }
            }
        },
        translation:      { enabled: false, provider: 'Google Translate', apiKey: '', configJson: '' },
        geolocation:      { enabled: false, provider: 'DLA',              apiKey: '' },
        language:         { enabled: false, provider: '',                 apiKey: '' },
        cors:             { enabled: false, allowedOrigins: [] },
        captcha:          { enabled: false, provider: 'turnstile', siteKey: '', secretKey: '', credentialsJson: '{}' },
        authWidget:       { enabled: false, selector: '', position: 'inside' },
        giphy:            { apiKey: '', searchUrl: '', trendingUrl: '' },
        entityConfig: {
            selector:             'article',
            entityIdAttribute:    'href',
            goTo:                 false,
            hrefAttribute:        'href',
            interactionPlacement: { position: 'after', relativeTo: '.article-actions', deterministic: false },
        },
    },
    vapid:      { publicKey: '', privateKey: '', email: '', iconBase64: '' },
    email:      { smtp_host: '', smtp_port: '', smtp_user: '', smtp_pass: '', requires_auth: true },
    turn:       { server: '', port: 3478, protocol: 'udp', transport: 'relay', realm: '', ttl: 300, staticAuthSecret: '' },
    nostr:      { url: '', authSecret: '', relays: [] },
    p2p:        { trackerUrls: [], rtcServers: [] },
    postConfig: {
        interaction: { allow_comments: true, allow_likes: true, allow_shares: true, allow_replies: true },
        moderation:  { enable_toxicity_filter: true, enable_content_moderation: false, moderation_prompt: '', banned_words: [] },
        limits:      { comment_text: 200, reply_text: 200 },
        editing:     { allow_edits: true, allow_delete: true, edit_time_limit: 5 },
        audio:       { enable_mic_transcription: false, save_comment_audio: false, max_recording_seconds: 60, bitrate: 16000 },
        comments:    { allowGif: false },
    },
};

const useClient = () => {
    const { t } = useTranslation();

    // ── Core state ────────────────────────────────────────────────────────────
    const [clients,         setClients]         = useState([]);
    const [config,          setConfig]          = useState(DEFAULT_CONFIG);
    const [editingClient,   setEditingClient]   = useState(null);
    const [loading,         setLoading]         = useState(false);
    const [isFormSubmitted, setIsFormSubmitted] = useState(false);
    const [snackbar,        setSnackbar]        = useState({ open: false, message: '', severity: 'success' });
    const [anchorEl,        setAnchorEl]        = useState(null);
    const [fieldErrors,     setFieldErrors]     = useState({});
    const [configDialogMode, setConfigDialogMode] = useState('basic');

    // ── Dialog / modal visibility ─────────────────────────────────────────────
    const [openConfigDialog,          setOpenConfigDialog]          = useState(false);
    const [openGeneralConfigModal,    setOpenGeneralConfigModal]    = useState(false);
    const [openVapidConfigModal,      setOpenVapidConfigModal]      = useState(false);
    const [openEmailConfigModal,      setOpenEmailConfigModal]      = useState(false);
    const [openReputationConfigModal, setOpenReputationConfigModal] = useState(false);
    const [openResilienceConfigModal, setOpenResilienceConfigModal] = useState(false);
    const [openNetworkConfigModal,    setOpenNetworkConfigModal]    = useState(false);
    const [openModulesConfigModal,    setOpenModulesConfigModal]    = useState(false);
    const [codeModalOpen,             setCodeModalOpen]             = useState(false);

    // ── Per-modal active client references ────────────────────────────────────
    const [editingGeneralConfigClient, setEditingGeneralConfigClient] = useState(null);
    const [editingVapidConfigClient,   setEditingVapidConfigClient]   = useState(null);
    const [editingEmailConfigClient,   setEditingEmailConfigClient]   = useState(null);
    const [editingReputationClient,    setEditingReputationClient]    = useState(null);
    const [editingResilienceClient,    setEditingResilienceClient]    = useState(null);
    const [editingNetworkClient,       setEditingNetworkClient]       = useState(null);
    const [editingModulesClient,       setEditingModulesClient]       = useState(null);
    const [currentCodeClient,          setCurrentCodeClient]          = useState(null);

    useEffect(() => {
        const clientsData = loadClientsFromSession();
        setClients(clientsData);
        if (clientsData.length === 0 && sessionStorage.getItem('clients')) {
            showErrorAlert(t('client.no_valid_clients'));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [t]);

    const showSnackbar = useCallback((message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    }, []);

    const handleSnackbarClose = useCallback((_event, reason) => {
        if (reason === 'clickaway') return;
        setSnackbar(prev => ({ ...prev, open: false }));
    }, []);

    const showSuccessAlert = (message) => {
        Swal.fire({
            icon:              'success',
            title:             message,
            showConfirmButton: false,
            timer:             1500,
            customClass:       { container: 'swal-custom-zindex' },
        });
    };

    const showErrorAlert = (message) => {
        Swal.fire({
            icon:              'error',
            title:             'Error',
            text:              message,
            confirmButtonText: 'OK',
            customClass:       { container: 'swal-custom-zindex' },
        });
    };

    const resetConfig = useCallback(() => {
        setConfig(DEFAULT_CONFIG);
        setIsFormSubmitted(false);
    }, []);

    const resetGeneralConfig = useCallback(() => {
        setConfig(prev => ({ ...prev, postConfig: DEFAULT_CONFIG.postConfig }));
    }, []);

    const resetVapidConfig = useCallback(() => {
        setConfig(prev => ({ ...prev, vapid: DEFAULT_CONFIG.vapid }));
    }, []);

    const resetEmailConfig = useCallback(() => {
        setConfig(prev => ({ ...prev, email: DEFAULT_CONFIG.email }));
    }, []);

    const resetNetworkConfig = useCallback(() => {
        setConfig(prev => ({
            ...prev,
            turn:  DEFAULT_CONFIG.turn,
            nostr: DEFAULT_CONFIG.nostr,
            p2p:   DEFAULT_CONFIG.p2p,
        }));
    }, []);

    const isValidUrl = (url) => {
        try { new URL(url); return true; } catch { return false; }
    };

    /**
     * Validador estricto para booleanos y strings que representan booleanos.
     */
    const isServiceEnabled = (flag) => flag === true || flag === 'true';

    /**
     * Valida la configuración del cliente antes de enviar al backend.
     * Solo evalúa los módulos que están estrictamente activos.
     */
    const validateConfig = () => {
        setIsFormSubmitted(true);

        // 1. Validaciones Generales (Siempre requeridas)
        if (!config.description || config.description.trim().length < 3) {
            showErrorAlert(t('client.description_required_min_length')); return false;
        }
        if (config.description.length > 50) {
            showErrorAlert(t('client.description_max_length_exceeded', { max: 50 })); return false;
        }
        if (!config.apiUrl || !isValidUrl(config.apiUrl)) {
            showErrorAlert(t('client.api_url_required_valid')); return false;
        }
        if (config.apiUrl.length > 300) {
            showErrorAlert(t('client.api_url_max_length_exceeded', { max: 300 })); return false;
        }
        if (!config.siteUrl || !isValidUrl(config.siteUrl)) {
            showErrorAlert(t('client.site_url_required_valid')); return false;
        }
        if (config.siteUrl.length > 300) {
            showErrorAlert(t('client.site_url_max_length_exceeded', { max: 300 })); return false;
        }

        // 2. Validación de Login / SSO
        const loginConfig = config.config?.login || {};
        
        // Limpiamos datos residuales (fantasmas) de arreglos viejos en base de datos.
        // Solo dejamos proveedores externos válidos (excluyendo 'Quelora' que es sesión nativa).
        const externalProviders = Array.isArray(loginConfig.providers) 
            ? loginConfig.providers.filter(p => typeof p === 'string' && p.trim() !== '' && p !== 'Quelora') 
            : [];
            
        const isQueloraSession = isServiceEnabled(loginConfig.queloraSession) || isServiceEnabled(loginConfig.providerDetails?.Quelora?.enabled);

        // Solo validamos si hay un proveedor externo configurado O la sesión Quelora nativa está activa
        if (externalProviders.length > 0 || isQueloraSession) {
            if (!loginConfig.baseUrl?.trim()) {
                showErrorAlert(t('client.login_base_url_required')); return false;
            }
            if (!loginConfig.jwtSecret?.trim()) {
                showErrorAlert(t('client.jwt_secret_required')); return false;
            }

            for (const provider of externalProviders) {
                const details = loginConfig.providerDetails?.[provider] || {};
                if (!details.clientId?.trim() || !details.clientSecret?.trim()) {
                    showErrorAlert(t('client.provider_credentials_required', { provider })); return false;
                }
            }
        }

        // 3. Validación de Moderación
        const modConfig = config.config?.moderation || {};
        if (isServiceEnabled(modConfig.enabled)) {
            if (!modConfig.apiKey?.trim() && modConfig.provider !== 'Confluence') {
                showErrorAlert(t('client.moderation_api_key_required')); return false;
            }
            if (!modConfig.prompt?.trim() && modConfig.provider !== 'Confluence') {
                showErrorAlert(t('client.moderation_prompt_required')); return false;
            }
        }

        // 4. Validación de Toxicidad
        const toxConfig = config.config?.toxicity || {};
        if (isServiceEnabled(toxConfig.enabled)) {
            const providerName = toxConfig.provider || 'Perspective';
            const details = toxConfig.providerDetails?.[providerName] || {};
            
            if (!details.apiKey?.trim() && !details.url?.trim()) {
                showErrorAlert(t('client.toxicity_credentials_required')); 
                return false;
            }
        }

        // 5. Validación de Traducción
        const transConfig = config.config?.translation || {};
        if (isServiceEnabled(transConfig.enabled)) {
            if (!transConfig.apiKey?.trim()) {
                showErrorAlert(t('client.translation_api_key_required')); return false;
            }
        }

        // 6. Validación de Detección de Lenguaje
        const langConfig = config.config?.language || {};
        if (isServiceEnabled(langConfig.enabled)) {
            if (!langConfig.apiKey?.trim()) {
                showErrorAlert(t('client.language_api_key_required')); return false;
            }
        }

        // 7. Validación de Captcha
        const captchaConfig = config.config?.captcha || {};
        if (isServiceEnabled(captchaConfig.enabled)) {
            if (!captchaConfig.siteKey?.trim()) {
                showErrorAlert(t('client.captcha_site_key_required')); return false;
            }
            if (captchaConfig.provider === 'turnstile' && !captchaConfig.secretKey?.trim()) {
                showErrorAlert(t('client.captcha_secret_key_required')); return false;
            }
        }

        // 8. Validación CORS
        const corsConfig = config.config?.cors || {};
        if (isServiceEnabled(corsConfig.enabled)) {
            if (!Array.isArray(corsConfig.allowedOrigins) || corsConfig.allowedOrigins.length === 0) {
                showErrorAlert(t('client.cors_origins_required')); return false;
            }
            const originRegex = /^(https?:\/\/)?(?:[\w-]+\.)*[\w-]+(?:\.\w{2,})?(?::\d+)?$|^https?:\/\/(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?$|^https?:\/\/\[[a-f0-9:]+\](?::\d+)?$/i;
            for (const origin of corsConfig.allowedOrigins) {
                if (!originRegex.test(origin)) {
                    showErrorAlert(t('client.cors_invalid_origin', { origin })); return false;
                }
            }
        }

        // 9. Validación de Widget Auth
        const widgetConfig = config.config?.authWidget || {};
        if (isServiceEnabled(widgetConfig.enabled)) {
            if (!widgetConfig.selector?.trim()) {
                showErrorAlert(t('client.auth_widget_selector_required')); return false;
            }
        }

        return true;
    };

    const validateVapidConfig = (vapid) => {
        setIsFormSubmitted(true);
        if (!vapid.publicKey || vapid.publicKey.trim().length < 10) {
            showErrorAlert(t('client.vapid_public_key_required')); return false;
        }
        if (!vapid.privateKey || vapid.privateKey.trim().length < 10) {
            showErrorAlert(t('client.vapid_private_key_required')); return false;
        }
        if (!vapid.email || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(vapid.email)) {
            showErrorAlert(t('client.vapid_email_invalid')); return false;
        }
        return true;
    };

    const validateEmailConfig = (email) => {
        setIsFormSubmitted(true);
        if (!email.smtp_host || email.smtp_host.trim().length < 3) {
            showErrorAlert(t('client.smtp_host_required')); return false;
        }
        const portNum = parseInt(email.smtp_port);
        if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
            showErrorAlert(t('client.smtp_port_invalid')); return false;
        }
        if (email.requires_auth !== false) {
            if (!email.smtp_user || email.smtp_user.trim().length < 3) {
                showErrorAlert(t('client.smtp_user_required')); return false;
            }
            if (!email.smtp_pass || email.smtp_pass.trim().length < 6) {
                showErrorAlert(t('client.smtp_pass_required')); return false;
            }
        }
        return true;
    };

    const validateGeneralConfig = (postConfig) => {
        if (!postConfig?.interaction || !postConfig?.moderation || !postConfig?.limits || !postConfig?.editing) {
            showErrorAlert(t('client.invalid_general_config')); return false;
        }
        
        const isEditTimeLimitInvalid = postConfig.editing?.allow_edits && 
                                       (postConfig.editing.edit_time_limit < 1 || postConfig.editing.edit_time_limit > 1440);

        const errors = {
            moderation_prompt: postConfig.moderation.enable_content_moderation && !postConfig.moderation.moderation_prompt?.trim(),
            comment_text:      postConfig.limits.comment_text < 50  || postConfig.limits.comment_text > 1000,
            reply_text:        postConfig.limits.reply_text   < 50  || postConfig.limits.reply_text   > 1000,
            edit_time_limit:   isEditTimeLimitInvalid,
        };
        
        if (Object.values(errors).some(Boolean)) {
            showErrorAlert(t('client.validation_errors')); return false;
        }
        return true;
    };

    const extractServerError = (err) =>
        typeof err === 'string' ? err : (err?.message ?? null);

    const parseFieldErrors = (errMsg) => {
        if (!errMsg || typeof errMsg !== 'string') return {};
        const errors = {};
        const re = /\b([a-z]\w+)\.([a-zA-Z]\w*)([^,]*)/g;
        let m;
        while ((m = re.exec(errMsg)) !== null) {
            const mod   = m[1];
            const field = m[2];
            const msg   = `${m[1]}.${m[2]}${m[3]}`.trim();
            if (!errors[mod]) errors[mod] = {};
            errors[mod][field] = msg;
        }
        return errors;
    };

    const handleUpsertClient = useCallback(async () => {
        if (!validateConfig()) return;
        try {
            setLoading(true);
            const cid = editingClient?.cid ?? null;
            const clientToProcess = {
                description: config.description,
                apiUrl:      config.apiUrl,
                siteUrl:     config.siteUrl,
                config:      config.config,
                vapid:       config.vapid,
                email:       config.email,
                postConfig:  config.postConfig,
                turn:        config.turn,
                nostr:       config.nostr,
                p2p:         config.p2p,
            };
            const { updatedClientList } = await saveClientConfig(cid, clientToProcess);
            setClients(updatedClientList);
            setFieldErrors({});
            setOpenConfigDialog(false);
            setEditingClient(null);
            resetConfig();
            showSuccessAlert(cid ? t('client.cid_updated') : t('client.cid_generated'));
        } catch (err) {
            console.error('useClient: handleUpsertClient error:', err);
            const msg = extractServerError(err);
            setFieldErrors(parseFieldErrors(msg));
            showErrorAlert(msg || t('client.save_client_error'));
        } finally {
            setLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [config, editingClient, t, resetConfig]);

    const handleEditClient = useCallback((client, mode = 'basic') => {
        setEditingClient(client);
        setConfigDialogMode(mode);
        
        // Fusión segura de toxicidad para soportar la arquitectura Legacy -> Polimórfica
        const clientToxicity = client.config?.toxicity || {};
        const mergedToxicity = {
            ...DEFAULT_CONFIG.config.toxicity,
            ...clientToxicity,
            thresholds: {
                ...DEFAULT_CONFIG.config.toxicity.thresholds,
                ...(clientToxicity.thresholds || {})
            },
            providerDetails: {
                Perspective: { 
                    ...DEFAULT_CONFIG.config.toxicity.providerDetails.Perspective, 
                    ...(clientToxicity.providerDetails?.Perspective || {}) 
                },
                Detoxifi: { 
                    ...DEFAULT_CONFIG.config.toxicity.providerDetails.Detoxifi, 
                    ...(clientToxicity.providerDetails?.Detoxifi || {}) 
                }
            }
        };

        setConfig({
            cid:         client.cid,
            description: client.description || '',
            apiUrl:      client.apiUrl  || 'https://api.quelora.org',
            siteUrl:     client.siteUrl || 'https://www.quelora.org',
            config:      { 
                ...DEFAULT_CONFIG.config,     
                ...client.config,
                toxicity: mergedToxicity
            },
            vapid:       { ...DEFAULT_CONFIG.vapid,      ...client.vapid },
            email:       { ...DEFAULT_CONFIG.email,      ...client.email },
            postConfig:  { ...DEFAULT_CONFIG.postConfig, ...client.postConfig },
            turn:        { ...DEFAULT_CONFIG.turn,       ...client.turn },
            nostr:       { ...DEFAULT_CONFIG.nostr,      ...client.nostr },
            p2p:         { ...DEFAULT_CONFIG.p2p,        ...client.p2p },
        });
        setOpenConfigDialog(true);
    }, []);

    const handleDeleteClient = useCallback(async (client) => {
        const { value: inputValue } = await Swal.fire({
            title:              t('client.delete_client_title'),
            html:               t('client.delete_client_html', { cid: client.cid }),
            input:              'text',
            inputLabel:         t('client.delete_client_input_label'),
            inputPlaceholder:   t('client.delete_client_input_placeholder'),
            showCancelButton:   true,
            confirmButtonColor: '#d33',
            cancelButtonColor:  '#3085d6',
            confirmButtonText:  t('client.delete_client_confirm'),
            cancelButtonText:   t('client.cancel'),
            inputValidator: (value) => {
                if (!value)               return t('client.delete_client_input_required');
                if (value !== client.cid) return t('client.delete_client_input_mismatch');
            },
        });
        if (inputValue !== client.cid) return;
        try {
            setLoading(true);
            await deleteClient(client.cid);
            setClients(loadClientsFromSession());
            showSuccessAlert(t('client.delete_client_success'));
        } catch (error) {
            console.error('useClient: handleDeleteClient error:', error);
            showErrorAlert(t('client.delete_client_error'));
        } finally {
            setLoading(false);
        }
    }, [t]);

    const handleShowCode = useCallback((client) => {
        setCurrentCodeClient(client);
        setCodeModalOpen(true);
    }, []);

    const handleGeneralConfig = useCallback((client) => {
        setEditingGeneralConfigClient(client);
        setConfig(prev => ({ ...prev, postConfig: { ...DEFAULT_CONFIG.postConfig, ...client.postConfig } }));
        setOpenGeneralConfigModal(true);
    }, []);

    const handleSaveGeneralConfig = useCallback(async (newGeneralConfig) => {
        if (!validateGeneralConfig(newGeneralConfig)) return;
        try {
            setLoading(true);
            const cid            = editingGeneralConfigClient.cid;
            const clientToUpdate = clients.find(c => c.cid === cid);
            const { updatedClientList } = await saveClientConfig(cid, { ...clientToUpdate, postConfig: newGeneralConfig });
            setClients(updatedClientList);
            setOpenGeneralConfigModal(false);
            setEditingGeneralConfigClient(null);
            resetGeneralConfig();
            showSuccessAlert(t('client.general_config_saved'));
        } catch (err) {
            console.error('useClient: handleSaveGeneralConfig error:', err);
            showErrorAlert(extractServerError(err) || t('client.save_general_config_error'));
        } finally {
            setLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editingGeneralConfigClient, clients, t, resetGeneralConfig]);

    const handleVapidConfig = useCallback((client) => {
        setEditingVapidConfigClient(client);
        setConfig(prev => ({ ...prev, vapid: { ...DEFAULT_CONFIG.vapid, ...client.vapid } }));
        setOpenVapidConfigModal(true);
    }, []);

    const handleSaveVapidConfig = useCallback(async (vapidConfig) => {
        if (!validateVapidConfig(vapidConfig)) return;
        try {
            setLoading(true);
            const cid            = editingVapidConfigClient.cid;
            const clientToUpdate = clients.find(c => c.cid === cid);
            const { updatedClientList } = await saveClientConfig(cid, { ...clientToUpdate, vapid: vapidConfig });
            setClients(updatedClientList);
            setOpenVapidConfigModal(false);
            setEditingVapidConfigClient(null);
            resetVapidConfig();
            showSuccessAlert(t('client.vapid_config_saved'));
        } catch (err) {
            console.error('useClient: handleSaveVapidConfig error:', err);
            showErrorAlert(extractServerError(err) || t('client.save_vapid_config_error'));
        } finally {
            setLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editingVapidConfigClient, clients, t, resetVapidConfig]);

    const handleEmailConfig = useCallback((client) => {
        setEditingEmailConfigClient(client);
        setConfig(prev => ({ ...prev, email: { ...DEFAULT_CONFIG.email, ...client.email } }));
        setOpenEmailConfigModal(true);
    }, []);

    const handleSaveEmailConfig = useCallback(async (emailConfig) => {
        if (!validateEmailConfig(emailConfig)) return false;
        try {
            setLoading(true);
            const cid            = editingEmailConfigClient.cid;
            const clientToUpdate = clients.find(c => c.cid === cid);
            const { updatedClientList } = await saveClientConfig(cid, { ...clientToUpdate, email: emailConfig });
            setClients(updatedClientList);
            setConfig(prev => ({ ...prev, email: { ...emailConfig } }));
            showSuccessAlert(t('client.email_config_saved'));
            return true;
        } catch (err) {
            console.error('useClient: handleSaveEmailConfig error:', err);
            showErrorAlert(extractServerError(err) || t('client.email_config_save_error'));
            return false;
        } finally {
            setLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editingEmailConfigClient, clients, t]);

    const handleReputationConfig = useCallback((client) => {
        setEditingReputationClient(client);
        setOpenReputationConfigModal(true);
    }, []);

    const handleResilienceConfig = useCallback((client) => {
        setEditingResilienceClient(client);
        setOpenResilienceConfigModal(true);
    }, []);

    const handleResilienceSaved = useCallback((cid, resilienceData) => {
        updateClientResilienceInSession(cid, resilienceData);
        setClients(prev => prev.map(c => (c.cid === cid ? { ...c, resilience: resilienceData } : c)));
    }, []);

    const handleNetworkConfig = useCallback((client) => {
        setEditingNetworkClient(client);
        setConfig(prev => ({
            ...prev,
            turn:  { ...DEFAULT_CONFIG.turn,  ...client.turn  },
            nostr: { ...DEFAULT_CONFIG.nostr, ...client.nostr },
            p2p:   { ...DEFAULT_CONFIG.p2p,   ...client.p2p   },
        }));
        setOpenNetworkConfigModal(true);
    }, []);

    const handleModulesConfig = useCallback((client) => {
        setEditingModulesClient(client);
        setOpenModulesConfigModal(true);
    }, []);

    const handleModulesSaved = useCallback(() => {
        const clientsData = loadClientsFromSession();
        setClients(clientsData);
    }, []);

    const handleSaveNetworkConfig = useCallback(async (networkConfig) => {
        try {
            setLoading(true);
            const cid            = editingNetworkClient.cid;
            const clientToUpdate = clients.find(c => c.cid === cid);
            const { updatedClientList } = await saveClientConfig(cid, { ...clientToUpdate, ...networkConfig });
            setClients(updatedClientList);
            setOpenNetworkConfigModal(false);
            setEditingNetworkClient(null);
            resetNetworkConfig();
            showSuccessAlert(t('client.network_config_saved'));
        } catch (err) {
            console.error('useClient: handleSaveNetworkConfig error:', err);
            showErrorAlert(extractServerError(err) || t('client.network_config_save_error'));
        } finally {
            setLoading(false);
        }
    }, [editingNetworkClient, clients, t, resetNetworkConfig]);

    return {
        clients,
        config,
        setConfig,
        editingClient,
        setEditingClient,
        loading,
        isFormSubmitted,
        fieldErrors,
        setFieldErrors,
        snackbar,
        anchorEl,
        setAnchorEl,
        configDialogMode,

        openConfigDialog,         setOpenConfigDialog,
        openGeneralConfigModal,   setOpenGeneralConfigModal,
        openVapidConfigModal,     setOpenVapidConfigModal,
        openEmailConfigModal,     setOpenEmailConfigModal,
        openReputationConfigModal,setOpenReputationConfigModal,
        openResilienceConfigModal,setOpenResilienceConfigModal,
        openNetworkConfigModal,   setOpenNetworkConfigModal,
        openModulesConfigModal,   setOpenModulesConfigModal,
        codeModalOpen,            setCodeModalOpen,

        editingReputationClient,
        editingResilienceClient,
        editingNetworkClient,
        editingModulesClient,
        currentCodeClient,

        showSnackbar,
        handleSnackbarClose,
        resetConfig,
        resetNetworkConfig,

        handleUpsertClient,
        handleEditClient,
        handleDeleteClient,
        handleShowCode,
        handleGeneralConfig,
        handleSaveGeneralConfig,
        handleVapidConfig,
        handleSaveVapidConfig,
        handleEmailConfig,
        handleSaveEmailConfig,
        handleReputationConfig,
        handleResilienceConfig,
        handleResilienceSaved,
        handleNetworkConfig,
        handleSaveNetworkConfig,
        handleModulesConfig,
        handleModulesSaved,
    };
};

export default useClient;