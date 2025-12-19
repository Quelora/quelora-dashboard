// ./src/components/Client/Client.jsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Swal from 'sweetalert2';
import { Box, Snackbar, Alert } from '@mui/material';
import { saveClientConfig, deleteClient, loadClientsFromSession } from '../../api/auth';
import ClientList from './ClientList';
import ClientHeader from './ClientHeader';
import ConfigDialog from './ConfigDialog';
import CodeModal from './CodeModal';
import VapidConfigModal from './VapidConfigModal';
import EmailConfigModal from './EmailConfigModal';
import PostModal from '../Post/PostModal';
import ReputationConfigModal from './ReputationConfigModal'; // <--- IMPORTACIÓN NUEVA

const Client = () => {
    const { t } = useTranslation();
    const [clients, setClients] = useState([]);
    const [openConfigDialog, setOpenConfigDialog] = useState(false);
    const [openGeneralConfigModal, setOpenGeneralConfigModal] = useState(false);
    const [openVapidConfigModal, setOpenVapidConfigModal] = useState(false);
    const [openEmailConfigModal, setOpenEmailConfigModal] = useState(false);
    
    // --- ESTADOS NUEVOS PARA REPUTACIÓN ---
    const [openReputationConfigModal, setOpenReputationConfigModal] = useState(false);
    const [editingReputationClient, setEditingReputationClient] = useState(null);
    // ---------------------------------------

    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const defaultConfig = {
        description: '',
        apiUrl: 'https://api.quelora.org',
        siteUrl: 'https://www.quelora.org',
        config: {
            login: {
                baseUrl: 'https://api.quelora.org/login',
                providers: [],
                providerDetails: {
                    Google: { clientId: '', clientSecret: '' },
                    Facebook: { clientId: '', clientSecret: '' },
                    X: { clientId: '', clientSecret: '' },
                    Apple: { clientId: '', clientSecret: '' },
                    Quelora: { enabled: false },
                },
            },
            moderation: { enabled: false, provider: 'OpenAI', apiKey: '', configJson: '', prompt: '', },
            toxicity: { enabled: false, provider: 'Perspective', apiKey: '', configJson: '', },
            translation: { enabled: false, provider: 'Google Translate', apiKey: '', configJson: '', },
            geolocation: { enabled: false, provider: 'DLA', apiKey: '', },
            language: { enabled: false, provider: '', apiKey: '', },
            cors: { enabled: false, allowedOrigins: [], },
            captcha: { enabled: false, provider: 'turnstile', siteKey: '', secretKey: '', credentialsJson: '{}', },
            modeDiscovery: false,
            discoveryDataUrl: '',
            entityConfig: {
                selector: 'article',
                entityIdAttribute: 'href',
                interactionPlacement: { position: 'after', relativeTo: '.article-actions' }
            }
        },
        vapid: { publicKey: '', privateKey: '', email: '', iconBase64: '', },
        email: { smtp_host: '', smtp_port: '', smtp_user: '', smtp_pass: '', requires_auth: true },
        postConfig: {
            interaction: { allow_comments: true, allow_likes: true, allow_shares: true, allow_replies: true, },
            moderation: { enable_toxicity_filter: true, enable_content_moderation: false, moderation_prompt: '', banned_words: [], },
            limits: { comment_text: 200, reply_text: 200, },
            editing: { allow_edits: true, allow_delete: true, edit_time_limit: 5, },
            audio: { enable_mic_transcription: false, save_comment_audio: false, max_recording_seconds: 60, bitrate: 16000 }
        }
    };
    
    const [config, setConfig] = useState(defaultConfig);
    const [editingClient, setEditingClient] = useState(null);
    const [editingGeneralConfigClient, setEditingGeneralConfigClient] = useState(null);
    const [editingVapidConfigClient, setEditingVapidConfigClient] = useState(null);
    const [editingEmailConfigClient, setEditingEmailConfigClient] = useState(null);
    const [loading, setLoading] = useState(false);
    const [codeModalOpen, setCodeModalOpen] = useState(false);
    const [currentClientCode, setCurrentClientCode] = useState('');
    const [isFormSubmitted, setIsFormSubmitted] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);

    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleSnackbarClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbar({ ...snackbar, open: false });
    };

    const showSuccessAlert = (message) => {
        Swal.fire({
            icon: 'success',
            title: message,
            showConfirmButton: false,
            timer: 1500,
            customClass: {
                container: 'swal-custom-zindex',
            },
        });
    };

    const showErrorAlert = (message) => {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: message,
            confirmButtonText: 'OK',
            customClass: {
                container: 'swal-custom-zindex',
            },
        });
    };
    
    const resetConfig = () => {
        setConfig(defaultConfig);
        setIsFormSubmitted(false);
    };

    const resetGeneralConfig = () => {
        setConfig((prev) => ({
            ...prev,
            postConfig: defaultConfig.postConfig
        }));
    };

    const resetVapidConfig = () => {
        setConfig((prev) => ({
            ...prev,
            vapid: defaultConfig.vapid
        }));
    };

    const resetEmailConfig = () => {
        setConfig((prev) => ({
            ...prev,
            email: defaultConfig.email
        }));
    };

    const isValidUrl = (url) => {
        try {
            new URL(url);
            return true;
        } catch (e) {
            return false;
        }
    };

    const validateConfig = () => {
        setIsFormSubmitted(true);
        if (!config.description || config.description.trim().length < 3) {
            showErrorAlert(t('client.description_required_min_length'));
            return false;
        }

        if (config.description.length > 50) {
            showErrorAlert(t('client.description_max_length_exceeded', { max: 50 }));
            return false;
        }

        if (!config.apiUrl || !isValidUrl(config.apiUrl)) {
            showErrorAlert(t('client.api_url_required_valid'));
            return false;
        }

        if (config.apiUrl.length > 300) {
            showErrorAlert(t('client.api_url_max_length_exceeded', { max: 300 }));
            return false;
        }

        if (!config.siteUrl || !isValidUrl(config.siteUrl)) {
            showErrorAlert(t('client.site_url_required_valid'));
            return false;
        }

        if (config.siteUrl.length > 300) {
            showErrorAlert(t('client.site_url_max_length_exceeded', { max: 300 }));
            return false;
        }

        if (Array.isArray(config.config.login?.providers) && config.config.login.providers.length > 0) {
            if (!config.config.login.baseUrl || !config.config.login.baseUrl.trim()) {
                showErrorAlert(t('client.login_base_url_required'));
                return false;
            }
            for (const provider of config.config.login.providers) {
                if (provider !== 'Quelora') {
                    const { clientId, clientSecret } = config.config.login.providerDetails?.[provider] || {};
                    if (!clientId || !clientId.trim() || !clientSecret || !clientSecret.trim()) {
                        showErrorAlert(t('client.provider_credentials_required', { provider }));
                        return false;
                    }
                }
            }
        }

        if (config.config.moderation?.enabled && (!config.config.moderation.apiKey || !config.config.moderation.apiKey.trim())) {
            showErrorAlert(t('client.moderation_api_key_required'));
            return false;
        }

        if (config.config.moderation?.enabled && (!config.config.moderation.prompt || !config.config.moderation.prompt.trim())) {
            showErrorAlert(t('client.moderation_prompt_required'));
            return false;
        }

        if (config.config.toxicity?.enabled && (!config.config.toxicity.apiKey || !config.config.toxicity.apiKey.trim())) {
            showErrorAlert(t('client.toxicity_api_key_required'));
            return false;
        }

        if (config.config.translation?.enabled && (!config.config.translation.apiKey || !config.config.translation.apiKey.trim())) {
            showErrorAlert(t('client.translation_api_key_required'));
            return false;
        }

        if (config.config.language?.enabled && (!config.config.language.apiKey || !config.config.language.apiKey.trim())) {
            showErrorAlert(t('client.language_api_key_required'));
            return false;
        }

        if (config.config.captcha?.enabled && (!config.config.captcha.siteKey || !config.config.captcha.siteKey.trim())) {
            showErrorAlert(t('client.captcha_site_key_required'));
            return false;
        }

        if (config.config.captcha?.enabled && (!config.config.captcha.secretKey || !config.config.captcha.secretKey.trim())) {
            showErrorAlert(t('client.captcha_secret_key_required'));
            return false;
        }

        if (config.config.cors?.enabled && (!Array.isArray(config.config.cors.allowedOrigins) || config.config.cors.allowedOrigins.length === 0)) {
            showErrorAlert(t('client.cors_origins_required'));
            return false;
        }

        if (config.config.cors?.enabled) {
            const originRegex = /^(https?:\/\/)?(?:[\w-]+\.)*[\w-]+(?:\.\w{2,})?(?::\d+)?$|^https?:\/\/(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?$|^https?:\/\/\[[a-f0-9:]+\](?::\d+)?$/i;
            for (const origin of config.config.cors.allowedOrigins) {
                if (!originRegex.test(origin)) {
                    showErrorAlert(t('client.cors_invalid_origin', { origin }));
                    return false;
                }
            }
        }

        if (config.config.modeDiscovery && (!config.config.discoveryDataUrl || !isValidUrl(config.config.discoveryDataUrl))) {
            showErrorAlert(t('client.api_url_required_valid'));
            return false;
        }

        if (!config.config.login?.jwtSecret || !config.config.login.jwtSecret.trim()) {
            showErrorAlert(t('client.jwt_secret_required'));
            return false;
        }

        return true;
    };

    const validateVapidConfig = (vapid) => {
        setIsFormSubmitted(true);
        if (!vapid.publicKey || vapid.publicKey.trim().length < 10) {
            showErrorAlert(t('client.vapid_public_key_required'));
            return false;
        }
        if (!vapid.privateKey || vapid.privateKey.trim().length < 10) {
            showErrorAlert(t('client.vapid_private_key_required'));
            return false;
        }
        if (!vapid.email || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(vapid.email)) {
            showErrorAlert(t('client.vapid_email_invalid'));
            return false;
        }
        return true;
    };

    const validateEmailConfig = (email) => {
        setIsFormSubmitted(true);
        if (!email.smtp_host || email.smtp_host.trim().length < 3) {
            showErrorAlert(t('client.smtp_host_required'));
            return false;
        }
        const isValidPort = (port) => {
            const portNum = parseInt(port);
            return !isNaN(portNum) && portNum >= 1 && portNum <= 65535;
        };
        if (!email.smtp_port || !isValidPort(email.smtp_port)) {
            showErrorAlert(t('client.smtp_port_invalid'));
            return false;
        }

        if (email.requires_auth !== false) {
            if (!email.smtp_user || email.smtp_user.trim().length < 3) {
                showErrorAlert(t('client.smtp_user_required'));
                return false;
            }
            if (!email.smtp_pass || email.smtp_pass.trim().length < 6) {
                showErrorAlert(t('client.smtp_pass_required'));
                return false;
            }
        }
        return true;
    };

    const validateGeneralConfig = (postConfig) => {
        if (!postConfig || !postConfig.interaction || !postConfig.moderation || !postConfig.limits || !postConfig.editing) {
            console.error('Client: postConfig or its properties are undefined:', postConfig);
            showErrorAlert(t('client.invalid_general_config'));
            return false;
        }
        const errors = {
            moderation_prompt: postConfig.moderation.enable_content_moderation && !postConfig.moderation.moderation_prompt?.trim(),
            comment_text: postConfig.limits.comment_text < 50 || postConfig.limits.comment_text > 1000,
            reply_text: postConfig.limits.reply_text < 50 || postConfig.limits.reply_text > 1000,
            edit_time_limit: postConfig.editing.edit_time_limit < 1 || postConfig.editing.edit_time_limit > 1440,
        };

        if (Object.values(errors).some(Boolean)) {
            console.error('Client: Validation failed with errors:', errors);
            showErrorAlert(t('client.validation_errors'));
            return false;
        }
        return true;
    };

    const handleUpsertClient = async () => {
        if (!validateConfig()) {
            return;
        }

        try {
            setLoading(true);
            
            const clientToProcess = {
                cid: editingClient ? editingClient.cid : undefined, 
                description: config.description,
                apiUrl: config.apiUrl,
                siteUrl: config.siteUrl,
                config: config.config,
                vapid: config.vapid,
                email: config.email,
                postConfig: config.postConfig,
            };

            const isNewClient = !clientToProcess.cid;
            let dataToSend = clientToProcess; 

            const { newClient, updatedClientList } = await saveClientConfig(dataToSend, clients);

            setClients(updatedClientList);
            setOpenConfigDialog(false);
            setEditingClient(null);
            resetConfig();
            showSuccessAlert(isNewClient ? t('client.cid_generated') : t('client.cid_updated'));

        } catch (err) {
            console.error('Error in handleUpsertClient:', err);
            showErrorAlert(t('client.save_client_error'));
        } finally {
            setLoading(false);
        }
    };

    const handleSaveGeneralConfig = async (newGeneralConfig) => {
        if (!validateGeneralConfig(newGeneralConfig)) {
            console.error('Client: postConfig validation failed');
            return;
        }

        try {
            setLoading(true);
            const cid = editingGeneralConfigClient.cid;
            
            const clientToUpdate = clients.find((client) => client.cid === cid);
            const updatedClientData = { ...clientToUpdate, postConfig: newGeneralConfig };

            const { updatedClientList } = await saveClientConfig(updatedClientData, clients);

            setClients(updatedClientList);

            setOpenGeneralConfigModal(false);
            setEditingGeneralConfigClient(null);
            resetGeneralConfig();
            showSuccessAlert(t('client.general_config_saved'));
        } catch (err) {
            console.error('Client: Error saving general config:', err);
            showErrorAlert(t('client.save_general_config_error'));
        } finally {
            setLoading(false);
        }
    };

    const handleGeneralConfig = (client) => {
        setEditingGeneralConfigClient(client);
        setConfig((prev) => ({
            ...prev,
            postConfig: { ...defaultConfig.postConfig, ...client.postConfig }
        }));
        setOpenGeneralConfigModal(true);
    };

    const handleVapidConfig = (client) => {
        setEditingVapidConfigClient(client);
        setConfig((prev) => ({
            ...prev,
            vapid: { ...defaultConfig.vapid, ...client.vapid }
        }));
        setOpenVapidConfigModal(true);
    };

    const handleSaveVapidConfig = async (vapidConfig) => {
        if (!validateVapidConfig(vapidConfig)) {
            return;
        }

        try {
            setLoading(true);
            const cid = editingVapidConfigClient.cid;
            
            const clientToUpdate = clients.find((client) => client.cid === cid);
            const updatedClientData = { ...clientToUpdate, vapid: vapidConfig };

            const { updatedClientList } = await saveClientConfig(updatedClientData, clients);

            setClients(updatedClientList);

            setOpenVapidConfigModal(false);
            setEditingVapidConfigClient(null);
            resetVapidConfig();
            showSuccessAlert(t('client.vapid_config_saved'));
        } catch (err) {
            console.error('Client: Error saving VAPID config:', err);
            showErrorAlert(t('client.save_vapid_config_error'));
        } finally {
            setLoading(false);
        }
    };

    const handleSaveEmailConfig = async (emailConfig) => {
        if (!validateEmailConfig(emailConfig)) {
            return false; 
        }

        try {
            setLoading(true);
            const cid = editingEmailConfigClient.cid;

            const clientToUpdate = clients.find((client) => client.cid === cid);
            const updatedClientData = { ...clientToUpdate, email: emailConfig };

            const { updatedClientList } = await saveClientConfig(updatedClientData, clients);

            setClients(updatedClientList);

            setConfig((prev) => ({
                ...prev,
                email: { ...emailConfig }
            }));
            showSuccessAlert(t('client.email_config_saved'));
            return true;
        } catch (err) {
            console.error('Client: Error saving email config:', err);
            showErrorAlert(t('client.email_config_save_error'));
            return false; 
        } finally {
            setLoading(false);
        }
    };

    const handleEmailConfig = (client) => {
        setEditingEmailConfigClient(client);
        setConfig((prev) => ({
            ...prev,
            email: { ...defaultConfig.email, ...client.email }
        }));
        setOpenEmailConfigModal(true);
    };

    // --- MANEJADOR DE CONFIGURACIÓN DE REPUTACIÓN ---
    const handleReputationConfig = (client) => {
        setEditingReputationClient(client);
        setOpenReputationConfigModal(true);
    };
    // ------------------------------------------------

    const handleShowCode = (client) => {
        let clientConfig = client.config || {};
        let postConfig = client.postConfig || {};
        let vapidConfig = client.vapid || {};
        let captchaConfig = client.config.captcha || {};

        const fullGeolocation = clientConfig.geolocation || { enabled: false, provider: 'ipapi', apiKey: '' };

        const simpleGeolocation = {
            enabled: fullGeolocation.enabled || false,
            provider: fullGeolocation.provider || 'ipapi',
            apiKey: fullGeolocation.apiKey || '',
        };

        const baseLoginUrl = 'https://api.quelora.org/login';

        const providerDetails = clientConfig.login?.providerDetails || {};

        const configObj = {
            cid: client.cid,
            apiUrl: client.apiUrl,
            siteUrl: client.siteUrl,
            login: {
                baseUrl: clientConfig.login?.baseUrl || baseLoginUrl,
                providers: clientConfig.login?.providers || [],
                providerDetails: Object.keys(providerDetails).reduce((acc, provider) => {
                    if (clientConfig.login?.providers?.includes(provider)) {
                        acc[provider] = {
                            clientId: providerDetails[provider]?.clientId || '',
                            ...(provider === 'Quelora' ? { enabled: providerDetails[provider]?.enabled || false } : {}),
                        };
                    }
                    return acc;
                }, {}),
            },
            geolocation: simpleGeolocation, 
            audio: postConfig.audio || {
                enable_mic_transcription: false,
                save_comment_audio: false,
                max_recording_seconds: 60,
                bitrate: 16000
            },
            vapid: {
                publicKey: vapidConfig.publicKey || '',
                iconBase64: vapidConfig.iconBase64 || '',
            },
            captcha: {
                enabled: captchaConfig.enabled || false,
                provider: captchaConfig.provider || 'turnstile',
                siteKey: captchaConfig.siteKey || '',
            },
            entityConfig: clientConfig.entityConfig || {
                selector: 'article',
                entityIdAttribute: 'href',
                interactionPlacement: { position: 'after', relativeTo: '.article-actions' }
            }
        };

        const code = `<script> window.QUELORA_CONFIG = ${JSON.stringify(configObj, null, 2)}; </script>`;
        setCurrentClientCode(code);
        setCodeModalOpen(true);
    };

    const handleEditClient = (client) => {
        setEditingClient(client);
        setConfig({
            cid: client.cid,
            description: client.description || '',
            apiUrl: client.apiUrl || 'https://api.quelora.org',
            siteUrl: client.siteUrl || 'https://www.quelora.org',
            config: { ...defaultConfig.config, ...client.config },
            vapid: { ...defaultConfig.vapid, ...client.vapid },
            email: { ...defaultConfig.email, ...client.email },
            postConfig: { ...defaultConfig.postConfig, ...client.postConfig },
        });
        setOpenConfigDialog(true);
    };

    const handleDeleteClient = async (client) => {
        const { value: inputValue } = await Swal.fire({
            title: t('client.delete_client_title'),
            html: t('client.delete_client_html', { cid: client.cid }),
            input: 'text',
            inputLabel: t('client.delete_client_input_label'),
            inputPlaceholder: t('client.delete_client_input_placeholder'),
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: t('client.delete_client_confirm'),
            cancelButtonText: t('client.cancel'),
            inputValidator: (value) => {
                if (!value) {
                    return t('client.delete_client_input_required');
                }
                if (value !== client.cid) {
                    return t('client.delete_client_input_mismatch');
                }
            }
        });

        if (inputValue === client.cid) {
            try {
                setLoading(true);
                await deleteClient(client.cid);
                
                const updatedClients = loadClientsFromSession();
                setClients(updatedClients);
                
                showSuccessAlert(t('client.delete_client_success'));
            } catch (error) {
                console.error('Error deleting client:', error);
                showErrorAlert(t('client.delete_client_error'));
            } finally {
                setLoading(false);
            }
        }
    };
    
    useEffect(() => {
        const clientsData = loadClientsFromSession();
        setClients(clientsData);
        if (clientsData.length === 0 && sessionStorage.getItem('clients')) {
             showErrorAlert(t('client.no_valid_clients'));
        } else if (sessionStorage.getItem('clients') && clientsData.length === 0) {
             showErrorAlert(t('client.load_clients_error'));
        }
    }, [t]);


    return (
        <Box className="client-container" sx={{ p: 2 }}>
            <ClientHeader anchorEl={anchorEl} setAnchorEl={setAnchorEl} showToast={showSnackbar} />
            <ClientList
                clients={clients}
                handleShowCode={handleShowCode}
                handleEditClient={handleEditClient}
                setOpenConfigDialog={setOpenConfigDialog}
                resetConfig={resetConfig}
                showToast={showSnackbar}
                handleGeneralConfig={handleGeneralConfig}
                handleVapidConfig={handleVapidConfig}
                handleEmailConfig={handleEmailConfig}
                handleDeleteClient={handleDeleteClient}
                handleReputationConfig={handleReputationConfig} // <--- PASAMOS EL MANEJADOR
            />
            <ConfigDialog
                open={openConfigDialog}
                editingClient={editingClient}
                config={config || defaultConfig}
                setConfig={setConfig}
                isFormSubmitted={isFormSubmitted}
                loading={loading}
                handleGenerateOrUpdateCID={handleUpsertClient}
                setOpenConfigDialog={setOpenConfigDialog}
                setEditingClient={setEditingClient}
                resetConfig={resetConfig}
                cid={editingClient?.cid || ''}
            />
            <CodeModal
                open={codeModalOpen}
                currentClientCode={currentClientCode}
                setOpen={setCodeModalOpen}
                showToast={showSnackbar}
            />
            <PostModal
                open={openGeneralConfigModal}
                onClose={() => {
                    setOpenGeneralConfigModal(false);
                    setEditingGeneralConfigClient(null);
                    resetGeneralConfig();
                }}
                initialData={{ config: config.postConfig }}
                mode="edit"
                onSave={handleSaveGeneralConfig}
                title={t('client.general_comment_config_title')}
            />
            <VapidConfigModal
                open={openVapidConfigModal}
                onClose={() => {
                    setOpenVapidConfigModal(false);
                    setEditingGeneralConfigClient(null);
                    resetVapidConfig();
                }}
                initialData={{ vapid: config.vapid }}
                onSave={handleSaveVapidConfig}
                cid={editingVapidConfigClient?.cid}
                showToast={showSnackbar}
                loading={loading}
                isFormSubmitted={isFormSubmitted}
            />
            <EmailConfigModal
                open={openEmailConfigModal}
                onClose={() => {
                    setOpenEmailConfigModal(false);
                    setEditingEmailConfigClient(null);
                    resetEmailConfig();
                }}
                initialData={{ email: config.email }}
                onSave={async (emailConfig) => {
                    return await handleSaveEmailConfig(emailConfig);
                }}
                cid={editingEmailConfigClient?.cid}
                showToast={showSnackbar}
                loading={loading}
                setLoading={setLoading}
                isFormSubmitted={isFormSubmitted}
                keepOpenOnSave={true}
                setOpenEmailConfigModal={setOpenEmailConfigModal}
            />
            
            {/* --- MODAL NUEVO PARA REPUTACIÓN --- */}
            <ReputationConfigModal
                open={openReputationConfigModal}
                onClose={() => {
                    setOpenReputationConfigModal(false);
                    setEditingReputationClient(null);
                }}
                client={editingReputationClient}
                showToast={showSnackbar}
            />
            {/* ----------------------------------- */}

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert 
                    onClose={handleSnackbarClose} 
                    severity={snackbar.severity} 
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default Client;