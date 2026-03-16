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
        toxicity:         { enabled: false, provider: 'Perspective',      apiKey: '', configJson: '' },
        translation:      { enabled: false, provider: 'Google Translate', apiKey: '', configJson: '' },
        geolocation:      { enabled: false, provider: 'DLA',              apiKey: '' },
        language:         { enabled: false, provider: '',                  apiKey: '' },
        cors:             { enabled: false, allowedOrigins: [] },
        captcha:          { enabled: false, provider: 'turnstile', siteKey: '', secretKey: '', credentialsJson: '{}' },
        authWidget:       { enabled: false, selector: '', position: 'inside' },
        modeDiscovery:    false,
        discoveryDataUrl: '',
        entityConfig: {
            selector:             'article',
            entityIdAttribute:    'href',
            interactionPlacement: { position: 'after', relativeTo: '.article-actions' },
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
    },
};

/**
 * Custom hook encapsulating all state management and business logic for the
 * Client management page.
 *
 * Follows the same architectural pattern as useGamification, useCampaignModal,
 * and other hooks in this codebase — the Client component becomes a pure
 * orchestration/render layer with zero business logic.
 *
 * Key addition over the original Client.jsx logic:
 * `handleEditClient` now accepts an optional `mode` parameter
 * ('basic' | 'advanced') so the ClientCard's two edit buttons can
 * deep-link directly to the relevant ConfigDialog section.
 *
 * @returns {Object} All state values, setters, and handlers needed by Client.jsx.
 */
const useClient = () => {
    const { t } = useTranslation();

    // ── Core state ────────────────────────────────────────────────────────────
    const [clients,         setClients]         = useState([]);
    const [config,          setConfig]           = useState(DEFAULT_CONFIG);
    const [editingClient,   setEditingClient]    = useState(null);
    const [loading,         setLoading]          = useState(false);
    const [isFormSubmitted, setIsFormSubmitted]  = useState(false);
    const [snackbar,        setSnackbar]         = useState({ open: false, message: '', severity: 'success' });
    const [anchorEl,        setAnchorEl]         = useState(null);

    /**
     * Mode pre-selected when the ConfigDialog opens.
     * Set by handleEditClient via the card's "Edit Basic" / "Edit Advanced" buttons.
     *
     * @type {[ConfigMode, Function]}
     */
    const [configDialogMode, setConfigDialogMode] = useState('basic');

    // ── Dialog / modal visibility ─────────────────────────────────────────────
    const [openConfigDialog,          setOpenConfigDialog]          = useState(false);
    const [openGeneralConfigModal,    setOpenGeneralConfigModal]    = useState(false);
    const [openVapidConfigModal,      setOpenVapidConfigModal]      = useState(false);
    const [openEmailConfigModal,      setOpenEmailConfigModal]      = useState(false);
    const [openReputationConfigModal, setOpenReputationConfigModal] = useState(false);
    const [openResilienceConfigModal, setOpenResilienceConfigModal] = useState(false);
    const [openNetworkConfigModal,    setOpenNetworkConfigModal]    = useState(false);
    const [codeModalOpen,             setCodeModalOpen]             = useState(false);

    // ── Per-modal active client references ────────────────────────────────────
    const [editingGeneralConfigClient, setEditingGeneralConfigClient] = useState(null);
    const [editingVapidConfigClient,   setEditingVapidConfigClient]   = useState(null);
    const [editingEmailConfigClient,   setEditingEmailConfigClient]   = useState(null);
    const [editingReputationClient,    setEditingReputationClient]    = useState(null);
    const [editingResilienceClient,    setEditingResilienceClient]    = useState(null);
    const [editingNetworkClient,       setEditingNetworkClient]       = useState(null);
    const [currentCodeClient,         setCurrentCodeClient]          = useState(null);

    // ── Session bootstrap ──────────────────────────────────────────────────────
    useEffect(() => {
        const clientsData = loadClientsFromSession();
        setClients(clientsData);
        if (clientsData.length === 0 && sessionStorage.getItem('clients')) {
            showErrorAlert(t('client.no_valid_clients'));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [t]);

    // ── Notification helpers ───────────────────────────────────────────────────

    /**
     * Displays a transient Snackbar notification.
     *
     * @param {string} message
     * @param {'success'|'error'|'warning'|'info'} [severity='success']
     */
    const showSnackbar = useCallback((message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    }, []);

    /**
     * Closes the Snackbar, ignoring clickaway dismissals.
     *
     * @param {React.SyntheticEvent} _event
     * @param {string}               reason
     */
    const handleSnackbarClose = useCallback((_event, reason) => {
        if (reason === 'clickaway') return;
        setSnackbar(prev => ({ ...prev, open: false }));
    }, []);

    /**
     * Displays a SweetAlert2 auto-dismissing success dialog.
     *
     * @param {string} message
     */
    const showSuccessAlert = (message) => {
        Swal.fire({
            icon:              'success',
            title:             message,
            showConfirmButton: false,
            timer:             1500,
            customClass:       { container: 'swal-custom-zindex' },
        });
    };

    /**
     * Displays a SweetAlert2 error dialog requiring user confirmation.
     *
     * @param {string} message
     */
    const showErrorAlert = (message) => {
        Swal.fire({
            icon:              'error',
            title:             'Error',
            text:              message,
            confirmButtonText: 'OK',
            customClass:       { container: 'swal-custom-zindex' },
        });
    };

    // ── Config reset helpers ───────────────────────────────────────────────────

    /** Resets the entire config form to its default values. */
    const resetConfig = useCallback(() => {
        setConfig(DEFAULT_CONFIG);
        setIsFormSubmitted(false);
    }, []);

    /** Resets only the postConfig slice. */
    const resetGeneralConfig = useCallback(() => {
        setConfig(prev => ({ ...prev, postConfig: DEFAULT_CONFIG.postConfig }));
    }, []);

    /** Resets only the vapid slice. */
    const resetVapidConfig = useCallback(() => {
        setConfig(prev => ({ ...prev, vapid: DEFAULT_CONFIG.vapid }));
    }, []);

    /** Resets only the email slice. */
    const resetEmailConfig = useCallback(() => {
        setConfig(prev => ({ ...prev, email: DEFAULT_CONFIG.email }));
    }, []);

    /** Resets the network slices (turn, nostr, p2p). */
    const resetNetworkConfig = useCallback(() => {
        setConfig(prev => ({
            ...prev,
            turn:  DEFAULT_CONFIG.turn,
            nostr: DEFAULT_CONFIG.nostr,
            p2p:   DEFAULT_CONFIG.p2p,
        }));
    }, []);

    // ── Validators ────────────────────────────────────────────────────────────

    /** @param {string} url @returns {boolean} */
    const isValidUrl = (url) => {
        try { new URL(url); return true; } catch { return false; }
    };

    /**
     * Validates the full client configuration for create/update operations.
     * Sets isFormSubmitted so inline field errors become visible.
     *
     * @returns {boolean}
     */
    const validateConfig = () => {
        setIsFormSubmitted(true);

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
        if (Array.isArray(config.config.login?.providers) && config.config.login.providers.length > 0) {
            if (!config.config.login.baseUrl?.trim()) {
                showErrorAlert(t('client.login_base_url_required')); return false;
            }
            for (const provider of config.config.login.providers) {
                if (provider !== 'Quelora') {
                    const { clientId, clientSecret } = config.config.login.providerDetails?.[provider] || {};
                    if (!clientId?.trim() || !clientSecret?.trim()) {
                        showErrorAlert(t('client.provider_credentials_required', { provider })); return false;
                    }
                }
            }
        }
        if (config.config.moderation?.enabled && !config.config.moderation.apiKey?.trim()) {
            showErrorAlert(t('client.moderation_api_key_required')); return false;
        }
        if (config.config.moderation?.enabled && !config.config.moderation.prompt?.trim()) {
            showErrorAlert(t('client.moderation_prompt_required')); return false;
        }
        if (config.config.toxicity?.enabled && !config.config.toxicity.apiKey?.trim()) {
            showErrorAlert(t('client.toxicity_api_key_required')); return false;
        }
        if (config.config.translation?.enabled && !config.config.translation.apiKey?.trim()) {
            showErrorAlert(t('client.translation_api_key_required')); return false;
        }
        if (config.config.language?.enabled && !config.config.language.apiKey?.trim()) {
            showErrorAlert(t('client.language_api_key_required')); return false;
        }
        if (config.config.captcha?.enabled && !config.config.captcha.siteKey?.trim()) {
            showErrorAlert(t('client.captcha_site_key_required')); return false;
        }
        if (config.config.captcha?.enabled && config.config.captcha.provider === 'turnstile' && !config.config.captcha.secretKey?.trim()) {
            showErrorAlert(t('client.captcha_secret_key_required')); return false;
        }
        if (config.config.cors?.enabled) {
            if (!Array.isArray(config.config.cors.allowedOrigins) || config.config.cors.allowedOrigins.length === 0) {
                showErrorAlert(t('client.cors_origins_required')); return false;
            }
            const originRegex = /^(https?:\/\/)?(?:[\w-]+\.)*[\w-]+(?:\.\w{2,})?(?::\d+)?$|^https?:\/\/(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?$|^https?:\/\/\[[a-f0-9:]+\](?::\d+)?$/i;
            for (const origin of config.config.cors.allowedOrigins) {
                if (!originRegex.test(origin)) {
                    showErrorAlert(t('client.cors_invalid_origin', { origin })); return false;
                }
            }
        }
        if (config.config.modeDiscovery && !isValidUrl(config.config.discoveryDataUrl)) {
            showErrorAlert(t('client.api_url_required_valid')); return false;
        }
        if (!config.config.login?.jwtSecret?.trim()) {
            showErrorAlert(t('client.jwt_secret_required')); return false;
        }
        if (config.config.authWidget?.enabled && !config.config.authWidget.selector?.trim()) {
            showErrorAlert(t('client.auth_widget_selector_required')); return false;
        }
        return true;
    };

    /** @param {Object} vapid @returns {boolean} */
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

    /** @param {Object} email @returns {boolean} */
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

    /** @param {Object} postConfig @returns {boolean} */
    const validateGeneralConfig = (postConfig) => {
        if (!postConfig?.interaction || !postConfig?.moderation || !postConfig?.limits || !postConfig?.editing) {
            showErrorAlert(t('client.invalid_general_config')); return false;
        }
        const errors = {
            moderation_prompt: postConfig.moderation.enable_content_moderation && !postConfig.moderation.moderation_prompt?.trim(),
            comment_text:      postConfig.limits.comment_text < 50  || postConfig.limits.comment_text > 1000,
            reply_text:        postConfig.limits.reply_text   < 50  || postConfig.limits.reply_text   > 1000,
            edit_time_limit:   postConfig.editing.edit_time_limit < 1 || postConfig.editing.edit_time_limit > 1440,
        };
        if (Object.values(errors).some(Boolean)) {
            showErrorAlert(t('client.validation_errors')); return false;
        }
        return true;
    };

    // ── CRUD handlers ─────────────────────────────────────────────────────────

    /**
     * Creates or updates a client after validation.
     *
     * @async
     * @returns {Promise<void>}
     */
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
            setOpenConfigDialog(false);
            setEditingClient(null);
            resetConfig();
            showSuccessAlert(cid ? t('client.cid_updated') : t('client.cid_generated'));
        } catch (err) {
            console.error('useClient: handleUpsertClient error:', err);
            showErrorAlert(t('client.save_client_error'));
        } finally {
            setLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [config, editingClient, t, resetConfig]);

    /**
     * Populates the config form with the selected client's data and opens the
     * edit dialog pre-selected to the given mode.
     *
     * @param {Object}     client         - The client to edit.
     * @param {ConfigMode} [mode='basic'] - Dialog mode to pre-select on open.
     */
    const handleEditClient = useCallback((client, mode = 'basic') => {
        setEditingClient(client);
        setConfigDialogMode(mode);
        setConfig({
            cid:         client.cid,
            description: client.description || '',
            apiUrl:      client.apiUrl  || 'https://api.quelora.org',
            siteUrl:     client.siteUrl || 'https://www.quelora.org',
            config:      { ...DEFAULT_CONFIG.config,     ...client.config },
            vapid:       { ...DEFAULT_CONFIG.vapid,      ...client.vapid },
            email:       { ...DEFAULT_CONFIG.email,      ...client.email },
            postConfig:  { ...DEFAULT_CONFIG.postConfig, ...client.postConfig },
            turn:        { ...DEFAULT_CONFIG.turn,       ...client.turn },
            nostr:       { ...DEFAULT_CONFIG.nostr,      ...client.nostr },
            p2p:         { ...DEFAULT_CONFIG.p2p,        ...client.p2p },
        });
        setOpenConfigDialog(true);
    }, []);

    /**
     * Prompts for confirmation (requiring CID re-entry) then deletes the client.
     *
     * @async
     * @param {Object} client
     * @returns {Promise<void>}
     */
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

    // ── Code export ───────────────────────────────────────────────────────────

    /** @param {Object} client */
    const handleShowCode = useCallback((client) => {
        setCurrentCodeClient(client);
        setCodeModalOpen(true);
    }, []);

    // ── General (postConfig) modal ─────────────────────────────────────────────

    /** @param {Object} client */
    const handleGeneralConfig = useCallback((client) => {
        setEditingGeneralConfigClient(client);
        setConfig(prev => ({ ...prev, postConfig: { ...DEFAULT_CONFIG.postConfig, ...client.postConfig } }));
        setOpenGeneralConfigModal(true);
    }, []);

    /** @async @param {Object} newGeneralConfig */
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
            showErrorAlert(t('client.save_general_config_error'));
        } finally {
            setLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editingGeneralConfigClient, clients, t, resetGeneralConfig]);

    // ── VAPID modal ───────────────────────────────────────────────────────────

    /** @param {Object} client */
    const handleVapidConfig = useCallback((client) => {
        setEditingVapidConfigClient(client);
        setConfig(prev => ({ ...prev, vapid: { ...DEFAULT_CONFIG.vapid, ...client.vapid } }));
        setOpenVapidConfigModal(true);
    }, []);

    /** @async @param {Object} vapidConfig */
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
            showErrorAlert(t('client.save_vapid_config_error'));
        } finally {
            setLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editingVapidConfigClient, clients, t, resetVapidConfig]);

    // ── Email modal ───────────────────────────────────────────────────────────

    /** @param {Object} client */
    const handleEmailConfig = useCallback((client) => {
        setEditingEmailConfigClient(client);
        setConfig(prev => ({ ...prev, email: { ...DEFAULT_CONFIG.email, ...client.email } }));
        setOpenEmailConfigModal(true);
    }, []);

    /** @async @param {Object} emailConfig @returns {Promise<boolean>} */
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
            showErrorAlert(t('client.email_config_save_error'));
            return false;
        } finally {
            setLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editingEmailConfigClient, clients, t]);

    // ── Reputation modal ──────────────────────────────────────────────────────

    /** @param {Object} client */
    const handleReputationConfig = useCallback((client) => {
        setEditingReputationClient(client);
        setOpenReputationConfigModal(true);
    }, []);

    // ── Resilience modal ──────────────────────────────────────────────────────

    /** @param {Object} client */
    const handleResilienceConfig = useCallback((client) => {
        setEditingResilienceClient(client);
        setOpenResilienceConfigModal(true);
    }, []);

    /**
     * Patches resilience in sessionStorage and in-memory list after a successful save.
     *
     * @param {string} cid
     * @param {Object} resilienceData
     */
    const handleResilienceSaved = useCallback((cid, resilienceData) => {
        updateClientResilienceInSession(cid, resilienceData);
        setClients(prev => prev.map(c => (c.cid === cid ? { ...c, resilience: resilienceData } : c)));
    }, []);

    // ── Network modal ─────────────────────────────────────────────────────────

    /** @param {Object} client */
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

    /** @async @param {{ turn: Object, nostr: Object, p2p: Object }} networkConfig */
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
            showErrorAlert(t('client.network_config_save_error'));
        } finally {
            setLoading(false);
        }
    }, [editingNetworkClient, clients, t, resetNetworkConfig]);

    // ── Exposed surface ───────────────────────────────────────────────────────
    return {
        clients,
        config,
        setConfig,
        editingClient,
        setEditingClient,
        loading,
        isFormSubmitted,
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
        codeModalOpen,            setCodeModalOpen,

        editingReputationClient,
        editingResilienceClient,
        editingNetworkClient,
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
    };
};

export default useClient;