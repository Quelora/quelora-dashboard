// ./src/components/Client/Client.jsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Swal from 'sweetalert2';
import { Box } from '@mui/material';
import { upsertClient, deleteClient } from '../../api/auth';
import ClientList from './ClientList';
import ClientHeader from './ClientHeader';
import ConfigDialog from './ConfigDialog';
import CodeModal from './CodeModal';
import VapidConfigModal from './VapidConfigModal';
import EmailConfigModal from './EmailConfigModal';
import PostModal from '../Post/PostModal';
import '../../assets/css/Client.css';
import { generateKeyFromString, encryptJSON, decryptJSON } from '../../utils/crypto';

const Client = () => {
  const { t } = useTranslation();
  const [clients, setClients] = useState([]);
  const [openConfigDialog, setOpenConfigDialog] = useState(false);
  const [openGeneralConfigModal, setOpenGeneralConfigModal] = useState(false);
  const [openVapidConfigModal, setOpenVapidConfigModal] = useState(false);
  const [openEmailConfigModal, setOpenEmailConfigModal] = useState(false);
  const defaultConfig = {
    description: '',
    apiUrl: 'https://api.quelora.org',
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
      moderation: {
        enabled: false,
        provider: 'OpenAI',
        apiKey: '',
        configJson: '',
        prompt: '',
      },
      toxicity: {
        enabled: false,
        provider: 'Perspective',
        apiKey: '',
        configJson: '',
      },
      translation: {
        enabled: false,
        provider: 'Google Translate',
        apiKey: '',
        configJson: '',
      },
      geolocation: {
        enabled: false,
        provider: 'DLA',
        apiKey: '',
      },
      language: {
        enabled: false,
        provider: '',
        apiKey: '',
      },
      cors: {
        enabled: false,
        allowedOrigins: [],
      },
      captcha: {
        enabled: false,
        provider: 'turnstile',
        siteKey: '',
        secretKey: '',
        credentialsJson: '{}',
      },
      modeDiscovery: false,
      discoveryDataUrl: '',
      entityConfig: {
        selector: 'article',
        entityIdAttribute: 'href',
        interactionPlacement: {
          position: 'after',
          relativeTo: '.article-actions'
        }
      }
    },
    vapid: {
      publicKey: '',
      privateKey: '',
      email: '',
      iconBase64: '',
    },
    email: {
      smtp_host: '',
      smtp_port: '',
      smtp_user: '',
      smtp_pass: ''
    },
    postConfig: {
      interaction: {
        allow_comments: true,
        allow_likes: true,
        allow_shares: true,
        allow_replies: true,
      },
      moderation: {
        enable_toxicity_filter: true,
        enable_content_moderation: false,
        moderation_prompt: '',
        banned_words: [],
      },
      limits: {
        comment_text: 200,
        reply_text: 200,
      },
      editing: {
        allow_edits: true,
        allow_delete: true,
        edit_time_limit: 5,
      },
      audio: {
        enable_mic_transcription: false,
        save_comment_audio: false,
        max_recording_seconds: 60,
        bitrate: 16000
      }
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

  const baseLoginUrl = 'https://api.quelora.org/login';

  useEffect(() => {
    const loadClients = () => {
      try {
        const clientsDataRaw = sessionStorage.getItem('clients');
        if (!clientsDataRaw) {
          setClients([]);
          return;
        }

        const clientsData = JSON.parse(clientsDataRaw);

        if (!Array.isArray(clientsData)) {
          setClients([]);
          showErrorAlert(t('client.load_clients_error'));
          return;
        }

        const sanitizedClients = clientsData
          .map((client) => {
            if (!client.cid || !client.description) {
              console.warn('Invalid client data, skipping:', client);
              return null;
            }

            let decryptedConfig, decryptedVapid, decryptedEmail, decryptedPostConfig;
            try {
              const key = generateKeyFromString(client.cid);
              decryptedConfig = decryptJSON(client.config || {}, key);
              decryptedVapid = decryptJSON(client.vapid || {}, key);
              decryptedEmail = decryptJSON(client.email || {}, key);
              decryptedPostConfig = decryptJSON(client.postConfig || {}, key);
            } catch (error) {
              console.error(`Error decrypting data for client ${client.cid}:`, error);
              return null;
            }

            return {
              cid: client.cid,
              description: client.description,
              apiUrl: client.apiUrl || 'https://api.quelora.org',
              config: {
                ...decryptedConfig,
                entityConfig: decryptedConfig.entityConfig || {
                  selector: 'article',
                  entityIdAttribute: 'href',
                  interactionPlacement: {
                    position: 'after',
                    relativeTo: '.article-actions'
                  }
                }
              },
              vapid: decryptedVapid || { publicKey: '', privateKey: '', email: '', iconBase64: '' },
              email: decryptedEmail || { smtp_host: '', smtp_port: '', smtp_user: '', smtp_pass: '' },
              postConfig: decryptedPostConfig || {
                interaction: {
                  allow_comments: true,
                  allow_likes: true,
                  allow_shares: true,
                  allow_replies: true,
                },
                moderation: {
                  enable_toxicity_filter: true,
                  enable_content_moderation: false,
                  moderation_prompt: '',
                  banned_words: [],
                },
                limits: {
                  comment_text: 200,
                  reply_text: 200,
                },
                editing: {
                  allow_edits: true,
                  allow_delete: true,
                  edit_time_limit: 5,
                },
                audio: {
                  enable_mic_transcription: false,
                  save_comment_audio: false,
                  max_recording_seconds: 60,
                  bitrate: 16000
                }
              }
            };
          })
          .filter((client) => client !== null);

        setClients(sanitizedClients);
        if (sanitizedClients.length === 0 && clientsData.length > 0) {
          showErrorAlert(t('client.no_valid_clients'));
        }
      } catch (e) {
        console.error('Error loading clients:', e);
        setClients([]);
        showErrorAlert(t('client.load_clients_error'));
      }
    };

    loadClients();
  }, [t]);

  const showToast = (message) => {
    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 2000);
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
      postConfig: {
        interaction: {
          allow_comments: true,
          allow_likes: true,
          allow_shares: true,
          allow_replies: true,
        },
        moderation: {
          enable_toxicity_filter: true,
          enable_content_moderation: false,
          moderation_prompt: '',
          banned_words: [],
        },
        limits: {
          comment_text: 200,
          reply_text: 200,
        },
        editing: {
          allow_edits: true,
          allow_delete: true,
          edit_time_limit: 5,
        },
        audio: {
          enable_mic_transcription: false,
          save_comment_audio: false,
          max_recording_seconds: 60,
          bitrate: 16000
        }
      }
    }));
  };

  const resetVapidConfig = () => {
    setConfig((prev) => ({
      ...prev,
      vapid: {
        publicKey: '',
        privateKey: '',
        email: '',
        iconBase64: '',
      },
    }));
  };

  const resetEmailConfig = () => {
    setConfig((prev) => ({
      ...prev,
      email: {
        smtp_host: '',
        smtp_port: '',
        smtp_user: '',
        smtp_pass: ''
      }
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

  const filterEmptyConfig = (configObj) => {
    const filtered = {};
    Object.entries(configObj).forEach(([key, value]) => {
      if (key === 'modeDiscovery' || key === 'discoveryDataUrl' || key === 'entityConfig') {
        filtered[key] = value;
        return;
      }
      if (typeof value === 'object' && value !== null && 'enabled' in value && !value.enabled) {
        return;
      }
      if (typeof value === 'string' && value.trim() !== '') {
        filtered[key] = value;
      } else if (Array.isArray(value) && value.length > 0) {
        filtered[key] = value;
      } else if (typeof value === 'object' && value !== null && Object.keys(value).length > 0) {
        const nestedFiltered = filterEmptyConfig(value);
        if (Object.keys(nestedFiltered).length > 0) {
          filtered[key] = nestedFiltered;
        }
      } else if (typeof value === 'boolean') {
        filtered[key] = value;
      }
    });
    return filtered;
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

    if (config.config.login.providers.length > 0) {
      if (!config.config.login.baseUrl || !config.config.login.baseUrl.trim()) {
        showErrorAlert(t('client.login_base_url_required'));
        return false;
      }
      for (const provider of config.config.login.providers) {
        if (provider !== 'Quelora') {
          const { clientId, clientSecret } = config.config.login.providerDetails[provider];
          if (!clientId || !clientId.trim() || !clientSecret || !clientSecret.trim()) {
            showErrorAlert(t('client.provider_credentials_required', { provider }));
            return false;
          }
        }
      }
    }

    if (config.config.moderation.enabled && (!config.config.moderation.apiKey || !config.config.moderation.apiKey.trim())) {
      showErrorAlert(t('client.moderation_api_key_required'));
      return false;
    }

    if (config.config.moderation.enabled && (!config.config.moderation.prompt || !config.config.moderation.prompt.trim())) {
      showErrorAlert(t('client.moderation_prompt_required'));
      return false;
    }

    if (config.config.toxicity.enabled && (!config.config.toxicity.apiKey || !config.config.toxicity.apiKey.trim())) {
      showErrorAlert(t('client.toxicity_api_key_required'));
      return false;
    }

    if (config.config.translation.enabled && (!config.config.translation.apiKey || !config.config.translation.apiKey.trim())) {
      showErrorAlert(t('client.translation_api_key_required'));
      return false;
    }

    if (config.config.language.enabled && (!config.config.language.apiKey || !config.config.language.apiKey.trim())) {
      showErrorAlert(t('client.language_api_key_required'));
      return false;
    }

    if (config.config.captcha.enabled && (!config.config.captcha.siteKey || !config.config.captcha.siteKey.trim())) {
      showErrorAlert(t('client.captcha_site_key_required'));
      return false;
    }

    if (config.config.captcha.enabled && (!config.config.captcha.secretKey || !config.config.captcha.secretKey.trim())) {
      showErrorAlert(t('client.captcha_secret_key_required'));
      return false;
    }

    if (config.config.cors.enabled && (!config.config.cors.allowedOrigins || config.config.cors.allowedOrigins.length === 0)) {
      showErrorAlert(t('client.cors_origins_required'));
      return false;
    }

    if (config.config.cors.enabled) {
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

    if (!config.config.login.jwtSecret || !config.config.login.jwtSecret.trim()) {
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
    if (!email.smtp_port || !isValidPort(email.smtp_port)) {
      showErrorAlert(t('client.smtp_port_invalid'));
      return false;
    }
    if (!email.smtp_user || email.smtp_user.trim().length < 3) {
      showErrorAlert(t('client.smtp_user_required'));
      return false;
    }
    if (!email.smtp_pass || email.smtp_pass.trim().length < 6) {
      showErrorAlert(t('client.smtp_pass_required'));
      return false;
    }
    return true;
  };

  const isValidPort = (port) => {
    const portNum = parseInt(port);
    return !isNaN(portNum) && portNum >= 1 && portNum <= 65535;
  };

  const validateGeneralConfig = (postConfig) => {
    if (!postConfig || !postConfig.interaction || !postConfig.moderation || !postConfig.limits || !postConfig.editing) {
      console.error('Client: postConfig o sus propiedades están indefinidas:', postConfig);
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
      console.error('Client: Validación falló con errores:', errors);
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
      let updatedClients;

      const key = generateKeyFromString(editingClient ? editingClient.cid : config.cid);
      const encryptedConfig = encryptJSON(config.config, key);
      const encryptedVapid = encryptJSON(config.vapid, key);
      const encryptedEmail = encryptJSON(config.email, key);
      const encryptedPostConfig = encryptJSON(config.postConfig, key);
      
      const response = await upsertClient(
        editingClient ? editingClient.cid : undefined,
        config.description,
        config.apiUrl,
        encryptedConfig,
        encryptedVapid,
        encryptedPostConfig,
        encryptedEmail
      );

      const newClient = {
        cid: response.client.cid,
        description: config.description,
        apiUrl: config.apiUrl,
        config: config.config,
        vapid: config.vapid,
        email: config.email,
        postConfig: config.postConfig,
      };

      if (editingClient) {
        updatedClients = clients.map((client) =>
          client.cid === editingClient.cid ? newClient : client
        );
        showSuccessAlert(t('client.cid_updated'));
      } else {
        updatedClients = [...clients, newClient];
        showSuccessAlert(t('client.cid_generated'));
      }

      const encryptedClients = updatedClients.map((client) => {
        if (!client.cid || typeof client.cid !== 'string' || client.cid.trim() === '') {
          throw new Error(`Invalid CID for client: ${JSON.stringify(client)}`);
        }
        const key = generateKeyFromString(client.cid);
        return {
          ...client,
          config: encryptJSON(client.config, key),
          vapid: encryptJSON(client.vapid, key),
          email: encryptJSON(client.email, key),
          postConfig: encryptJSON(client.postConfig, key),
        };
      });

      sessionStorage.setItem('clients', JSON.stringify(encryptedClients));

      setClients(updatedClients);
      setOpenConfigDialog(false);
      setEditingClient(null);
      resetConfig();
    } catch (err) {
      console.error('Error in handleUpsertClient:', err);
      showErrorAlert(t('client.save_client_error'));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGeneralConfig = async (newGeneralConfig) => {
    if (!validateGeneralConfig(newGeneralConfig)) {
      console.error('Client: Validación de postConfig falló');
      return;
    }

    try {
      setLoading(true);
      const updatedClients = clients.map((client) =>
        client.cid === editingGeneralConfigClient.cid
          ? {
              ...client,
              postConfig: {
                interaction: newGeneralConfig.interaction,
                moderation: newGeneralConfig.moderation,
                limits: newGeneralConfig.limits,
                editing: newGeneralConfig.editing,
                audio: newGeneralConfig.audio
              },
            }
          : client
      );

      const clientToUpdate = updatedClients.find((client) => client.cid === editingGeneralConfigClient.cid);
      const key = generateKeyFromString(clientToUpdate.cid);

      await upsertClient(
        clientToUpdate.cid,
        clientToUpdate.description,
        clientToUpdate.apiUrl,
        encryptJSON(clientToUpdate.config, key),
        encryptJSON(clientToUpdate.vapid, key),
        encryptJSON({
          interaction: newGeneralConfig.interaction,
          moderation: newGeneralConfig.moderation,
          limits: newGeneralConfig.limits,
          editing: newGeneralConfig.editing,
          audio: newGeneralConfig.audio
        }, key),
        encryptJSON(clientToUpdate.email, key)
      );

      const encryptedClients = updatedClients.map((client) => {
        if (!client.cid || typeof client.cid !== 'string' || client.cid.trim() === '') {
          throw new Error(`Invalid CID for client: ${JSON.stringify(client)}`);
        }
        const key = generateKeyFromString(client.cid);
        return {
          ...client,
          config: encryptJSON(client.config, key),
          vapid: encryptJSON(client.vapid, key),
          email: encryptJSON(client.email, key),
          postConfig: encryptJSON(client.postConfig, key),
        };
      });

      sessionStorage.setItem('clients', JSON.stringify(encryptedClients));
      setClients(updatedClients);
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

  const handleSaveVapidConfig = async (vapidConfig) => {
    if (!validateVapidConfig(vapidConfig)) {
      return;
    }

    try {
      setLoading(true);
      const updatedClients = clients.map((client) =>
        client.cid === editingVapidConfigClient.cid
          ? { ...client, vapid: vapidConfig }
          : client
      );

      const clientToUpdate = updatedClients.find((client) => client.cid === editingVapidConfigClient.cid);
      const key = generateKeyFromString(clientToUpdate.cid);

      await upsertClient(
        clientToUpdate.cid,
        clientToUpdate.description,
        clientToUpdate.apiUrl,
        encryptJSON(clientToUpdate.config, key),
        encryptJSON(vapidConfig, key),
        encryptJSON(clientToUpdate.postConfig, key),
        encryptJSON(clientToUpdate.email, key)
      );

      const encryptedClients = updatedClients.map((client) => {
        if (!client.cid || typeof client.cid !== 'string' || client.cid.trim() === '') {
          throw new Error(`Invalid CID for client: ${JSON.stringify(client)}`);
        }
        const key = generateKeyFromString(client.cid);
        return {
          ...client,
          config: encryptJSON(client.config, key),
          vapid: encryptJSON(client.vapid, key),
          email: encryptJSON(client.email, key),
          postConfig: encryptJSON(client.postConfig, key),
        };
      });

      sessionStorage.setItem('clients', JSON.stringify(encryptedClients));
      setClients(updatedClients);
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

  const handleGeneralConfig = (client) => {
    setEditingGeneralConfigClient(client);
    setConfig((prev) => ({
      ...prev,
      postConfig: client.postConfig || {
        interaction: {
          allow_comments: true,
          allow_likes: true,
          allow_shares: true,
          allow_replies: true,
        },
        moderation: {
          enable_toxicity_filter: true,
          enable_content_moderation: false,
          moderation_prompt: '',
          banned_words: [],
        },
        limits: {
          comment_text: 200,
          reply_text: 200,
        },
        editing: {
          allow_edits: true,
          allow_delete: true,
          edit_time_limit: 5,
        },
        audio: {
          enable_mic_transcription: false,
          save_comment_audio: false,
          max_recording_seconds: 60,
          bitrate: 16000
        }
      }
    }));
    setOpenGeneralConfigModal(true);
  };

  const handleVapidConfig = (client) => {
    setEditingVapidConfigClient(client);
    setConfig((prev) => ({
      ...prev,
      vapid: {
        publicKey: client.vapid?.publicKey || '',
        privateKey: client.vapid?.privateKey || '',
        email: client.vapid?.email || '',
        iconBase64: client.vapid?.iconBase64 || ''
      }
    }));
    setOpenVapidConfigModal(true);
  };

  const handleSaveEmailConfig = async (emailConfig) => {
    if (!validateEmailConfig(emailConfig)) {
      return false; // Validation failed, modal stays open
    }

    try {
      setLoading(true);
      const updatedClients = clients.map((client) =>
        client.cid === editingEmailConfigClient.cid
          ? { ...client, email: emailConfig }
          : client
      );

      const clientToUpdate = updatedClients.find((client) => client.cid === editingEmailConfigClient.cid);
      const key = generateKeyFromString(clientToUpdate.cid);

      await upsertClient(
        clientToUpdate.cid,
        clientToUpdate.description,
        clientToUpdate.apiUrl,
        encryptJSON(clientToUpdate.config, key),
        encryptJSON(clientToUpdate.vapid, key),
        encryptJSON(clientToUpdate.postConfig, key),
        encryptJSON(emailConfig, key)
      );

      const encryptedClients = updatedClients.map((client) => {
        if (!client.cid || typeof client.cid !== 'string' || client.cid.trim() === '') {
          throw new Error(`Invalid CID for client: ${JSON.stringify(client)}`);
        }
        const key = generateKeyFromString(client.cid);
        return {
          ...client,
          config: encryptJSON(client.config, key),
          vapid: encryptJSON(client.vapid, key),
          email: encryptJSON(client.email, key),
          postConfig: encryptJSON(client.postConfig, key),
        };
      });

      sessionStorage.setItem('clients', JSON.stringify(encryptedClients));
      setClients(updatedClients);
      // Update config state to reflect the new email configuration
      setConfig((prev) => ({
        ...prev,
        email: { ...emailConfig }
      }));
      showSuccessAlert(t('client.email_config_saved'));
      return true; // Indicate success, keep modal open
    } catch (err) {
      console.error('Client: Error saving email config:', err);
      showErrorAlert(t('client.email_config_save_error'));
      return false; // Keep modal open on error
    } finally {
      setLoading(false);
    }
  };

  const handleEmailConfig = (client) => {
    setEditingEmailConfigClient(client);
    setConfig((prev) => ({
      ...prev,
      email: {
        smtp_host: client.email?.smtp_host || '',
        smtp_port: client.email?.smtp_port || '',
        smtp_user: client.email?.smtp_user || '',
        smtp_pass: client.email?.smtp_pass || ''
      }
    }));
    setOpenEmailConfigModal(true);
  };

  const handleShowCode = (client) => {
    let clientConfig = client.config || {};
    let postConfig = client.postConfig || {};
    let vapidConfig = client.vapid || {};
    let captchaConfig = client.config.captcha || {};

    const providerDetails = clientConfig.login?.providerDetails || {};

    const configObj = {
      cid: client.cid,
      apiUrl: client.apiUrl,
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
      geolocation: clientConfig.geolocation || { enabled: false, provider: 'ipapi', apiKey: '' },
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
        interactionPlacement: {
          position: 'after',
          relativeTo: '.article-actions'
        }
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
      config: {
        ...client.config,
        login: {
          baseUrl: client.config?.login?.baseUrl || baseLoginUrl,
          jwtSecret: client.config?.login?.jwtSecret || '',
          providers: Array.isArray(client.config?.login?.providers) ? client.config.login.providers : [],
          providerDetails: client.config?.login?.providerDetails || {
            Google: { clientId: '', clientSecret: '' },
            Facebook: { clientId: '', clientSecret: '' },
            X: { clientId: '', clientSecret: '' },
            Apple: { clientId: '', clientSecret: '' },
            Quelora: { enabled: false },
          },
        },
        moderation: client.config?.moderation || {
          enabled: false,
          provider: 'OpenAI',
          apiKey: '',
          configJson: '',
          prompt: '',
        },
        toxicity: client.config?.toxicity || { enabled: false, provider: 'Perspective', apiKey: '', configJson: '' },
        translation: client.config?.translation || {
          enabled: false,
          provider: 'Google Translate',
          apiKey: '',
          configJson: '',
        },
        geolocation: client.config?.geolocation || { enabled: false, provider: 'ipapi', apiKey: '' },
        language: client.config?.language || { enabled: false, provider: 'DLA', apiKey: '' },
        cors: client.config?.cors || { enabled: false, allowedOrigins: [] },
        captcha: client.config?.captcha || {
          enabled: false,
          provider: 'turnstile',
          siteKey: '',
          secretKey: '',
          credentialsJson: '{}',
        },
        modeDiscovery: client.config?.modeDiscovery || false,
        discoveryDataUrl: client.config?.discoveryDataUrl || '',
        entityConfig: client.config?.entityConfig || {
          selector: 'article',
          entityIdAttribute: 'href',
          interactionPlacement: {
            position: 'after',
            relativeTo: '.article-actions'
          }
        }
      },
      vapid: client.vapid || {
        publicKey: '',
        privateKey: '',
        email: '',
        iconBase64: '',
      },
      email: client.email || {
        smtp_host: '',
        smtp_port: '',
        smtp_user: '',
        smtp_pass: ''
      },
      postConfig: client.postConfig || {
        interaction: {
          allow_comments: true,
          allow_likes: true,
          allow_shares: true,
          allow_replies: true,
        },
        moderation: {
          enable_toxicity_filter: true,
          enable_content_moderation: false,
          moderation_prompt: '',
          banned_words: [],
        },
        limits: {
          comment_text: 200,
          reply_text: 200,
        },
        editing: {
          allow_edits: true,
          allow_delete: true,
          edit_time_limit: 5,
        },
        audio: {
          enable_mic_transcription: false,
          save_comment_audio: false,
          max_recording_seconds: 60,
          bitrate: 16000
        }
      }
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
        
        const updatedClients = clients.filter(c => c.cid !== client.cid);

        const encryptedClients = updatedClients.map((client) => {
          if (!client.cid || typeof client.cid !== 'string' || client.cid.trim() === '') {
            throw new Error(`Invalid CID for client: ${JSON.stringify(client)}`);
          }
          const key = generateKeyFromString(client.cid);
          return {
            ...client,
            config: encryptJSON(client.config, key),
            vapid: encryptJSON(client.vapid, key),
            email: encryptJSON(client.email, key),
            postConfig: encryptJSON(client.postConfig, key),
          };
        });

        sessionStorage.setItem('clients', JSON.stringify(encryptedClients));
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
  
  return (
    <Box className="client-container">
      <ClientHeader anchorEl={anchorEl} setAnchorEl={setAnchorEl} />
      <ClientList
        clients={clients}
        handleShowCode={handleShowCode}
        handleEditClient={handleEditClient}
        setOpenConfigDialog={setOpenConfigDialog}
        resetConfig={resetConfig}
        showToast={showToast}
        handleGeneralConfig={handleGeneralConfig}
        handleVapidConfig={handleVapidConfig}
        handleEmailConfig={handleEmailConfig}
        handleDeleteClient={handleDeleteClient}
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
        showToast={showToast}
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
          setEditingVapidConfigClient(null);
          resetVapidConfig();
        }}
        initialData={{ vapid: config.vapid }}
        onSave={handleSaveVapidConfig}
        cid={editingVapidConfigClient?.cid}
        showToast={showToast}
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
        showToast={showToast}
        loading={loading}
        setLoading={setLoading}
        isFormSubmitted={isFormSubmitted}
        keepOpenOnSave={true}
        setOpenEmailConfigModal={setOpenEmailConfigModal}
      />
    </Box>
  );
};

export default Client;