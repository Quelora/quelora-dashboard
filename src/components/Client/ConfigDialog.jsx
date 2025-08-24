// ./src/components/Client/ConfigDialog.jsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Tabs,
  Tab,
  LinearProgress,
  Grid,
  Typography,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import LoginConfig from './LoginConfig';
import CommentsConfig from './CommentsConfig';
import OtherConfig from './OtherConfig';
import CorsConfig from './CorsConfig';
import EntityConfig from './EntityConfig';
import CaptchaConfig from './CaptchaConfig';
import Swal from 'sweetalert2';
import { getTestPost } from '../../api/posts';

const ConfigDialog = ({
  open,
  editingClient,
  config,
  setConfig,
  isFormSubmitted,
  loading,
  handleGenerateOrUpdateCID,
  setOpenConfigDialog,
  setEditingClient,
  resetConfig,
  cid
}) => {
  const { t } = useTranslation();
  const [configTab, setConfigTab] = useState(0);
  const MAX_DESCRIPTION_LENGTH = 50;
  const MAX_API_URL_LENGTH = 300;

  const handleConfigTabChange = (event, newValue) => {
    setConfigTab(newValue);
  };

  const handleDescriptionChange = (e) => {
    const value = e.target.value;
    if (value.length <= MAX_DESCRIPTION_LENGTH) {
      setConfig((prev) => ({ ...prev, description: value }));
    }
  };

  const handleApiUrlChange = (e) => {
    const value = e.target.value;
    if (value.length <= MAX_API_URL_LENGTH) {
      setConfig((prev) => ({ ...prev, apiUrl: value }));
    }
  };

  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };

  const testDiscoveryUrl = async () => {
    setOpenConfigDialog(false);

    const { value: referenceId, isDismissed } = await Swal.fire({
      title: t('client.test_discovery_url'),
      text: t('client.enter_reference_id'),
      input: 'text',
      inputPlaceholder: '12345',
      showCancelButton: true,
      allowOutsideClick: false,
      inputValidator: (value) => {
        if (!value && !isDismissed) {
          return t('client.reference_id_required');
        }
      }
    });

    if (isDismissed || !referenceId) {
      setOpenConfigDialog(true);
      return;
    }

    try {
      const rawUrl = config.config.discoveryDataUrl;
      const urlWithReplacedReference = rawUrl.replace(/\{\{?reference\}?\}/g, referenceId);
      const urlWithReference = new URL(urlWithReplacedReference);
      
      setOpenConfigDialog(false);
      Swal.fire({
        title: t('client.testing_url'),
        text: urlWithReference.toString(),
        icon: 'info',
        showConfirmButton: false,
        showCancelButton: true,
        cancelButtonText: t('client.cancel'),
        allowOutsideClick: false,
        allowEscapeKey: false,
        allowEnterKey: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const response = await getTestPost(urlWithReference.toString());
      const { data } = response;

      await Swal.fire({
        title: t('client.test_results'),
        html: `
          <div style="text-align: left;">
            <p><strong>${t('client.url_tested')}:</strong> ${urlWithReference}</p>
            <p><strong>${t('client.title')}:</strong> ${data.title}</p>
            <p><strong>${t('client.description')}:</strong> ${data.description}</p>
            <p><strong>${t('client.canonical')}:</strong> ${data.canonical}</p>
          </div>
        `,
        icon: 'success',
        confirmButtonText: t('client.close')
      });

    } catch (error) {
      await Swal.fire({
        title: t('client.test_failed'),
        text: error.message,
        icon: 'error',
        confirmButtonText: t('client.close')
      });
    } finally {
      setOpenConfigDialog(true);
    }
  };
  
  return (
    <Dialog
      open={open}
      onClose={() => {
        setOpenConfigDialog(false);
        setEditingClient(null);
        resetConfig();
      }}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        className: 'client-dialog client-config-dialog',
        elevation: 3
      }}
    >
      <DialogTitle className="client-dialog-title">
        {editingClient ? t('client.edit_cid') : t('client.add_newCID')} {cid}
      </DialogTitle>
      <DialogContent className="client-dialog-content">
        <Grid container direction="column" spacing={2}>
          <Grid item>
            <Tabs
              value={configTab}
              onChange={handleConfigTabChange}
              className="client-config-tabs"
              variant="fullWidth"
            >
              <Tab label={t('client.general')} />
              <Tab label={t('client.entity_config')} />
              <Tab label={t('client.login_config')} />
              <Tab label={t('client.comments_config')} />
              <Tab label={t('client.captcha_config')} />
              <Tab label={t('client.other_config')} />
              <Tab label={t('client.cors_config')} />
            </Tabs>
          </Grid>
          <Grid item>
            {configTab === 0 && (
              <Grid container direction="column" spacing={2}>
                <Grid item>
                  <TextField
                    label={t('client.description')}
                    fullWidth
                    variant="outlined"
                    size="small"
                    value={config.description || ''}
                    onChange={handleDescriptionChange}
                    className="client-text-field"
                    error={
                      isFormSubmitted &&
                      (!config.description ||
                        config.description.trim().length < 3 ||
                        config.description.length > MAX_DESCRIPTION_LENGTH)
                    }
                    helperText={
                      isFormSubmitted &&
                      (!config.description || config.description.trim().length < 3
                        ? t('client.description_required_min_length')
                        : config.description.length > MAX_DESCRIPTION_LENGTH
                        ? t('client.description_max_length_exceeded', { max: MAX_DESCRIPTION_LENGTH })
                        : '')
                    }
                    inputProps={{
                      maxLength: MAX_DESCRIPTION_LENGTH,
                    }}
                  />
                  <Typography
                    variant="caption"
                    color={config.description?.length > MAX_DESCRIPTION_LENGTH ? 'error' : 'textSecondary'}
                    align="right"
                    display="block"
                  >
                    {config.description?.length || 0}/{MAX_DESCRIPTION_LENGTH}
                  </Typography>
                </Grid>
                <Grid item>
                  <TextField
                    label={t('client.api_url')}
                    fullWidth
                    variant="outlined"
                    size="small"
                    value={config.apiUrl || ''}
                    onChange={handleApiUrlChange}
                    error={isFormSubmitted && (!isValidUrl(config.apiUrl))}
                    helperText={
                      isFormSubmitted && !isValidUrl(config.apiUrl)
                        ? t('client.api_url_required')
                        : config.apiUrl?.length > MAX_API_URL_LENGTH
                        ? t('client.api_url_max_length_exceeded', { max: MAX_API_URL_LENGTH })
                        : ''
                    }
                    required
                    inputProps={{
                      maxLength: MAX_API_URL_LENGTH,
                    }}
                  />
                  <Typography
                    variant="caption"
                    color={config.apiUrl?.length > MAX_API_URL_LENGTH ? 'error' : 'textSecondary'}
                    align="right"
                    display="block"
                  >
                    {config.apiUrl?.length || 0}/{MAX_API_URL_LENGTH}
                  </Typography>
                </Grid>
                <Grid item>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={config.config.modeDiscovery || false}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          config: {
                            ...prev.config,
                            modeDiscovery: e.target.checked
                          }
                        }))}
                      />
                    }
                    label={t('client.discovery_mode')}
                  />
                  <Typography variant="caption" color="textSecondary">
                    {t('client.discovery_mode_help')}
                  </Typography>
                </Grid>
                {config.config.modeDiscovery && (
                  <Grid item>
                    <TextField
                      label={t('client.discovery_data_url')}
                      fullWidth
                      variant="outlined"
                      size="small"
                      value={config.config.discoveryDataUrl || ''}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        config: {
                          ...prev.config,
                          discoveryDataUrl: e.target.value
                        }
                      }))}
                      error={isFormSubmitted && config.config.modeDiscovery && !isValidUrl(config.config.discoveryDataUrl)}
                      helperText={
                        isFormSubmitted && 
                        config.config.modeDiscovery && 
                        !isValidUrl(config.config.discoveryDataUrl) 
                          ? t('client.api_url_required_valid')
                          : t('client.discovery_data_url_help')
                      }
                      required={config.config.modeDiscovery}
                    />
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={testDiscoveryUrl}
                      disabled={!config.config.discoveryDataUrl || !isValidUrl(config.config.discoveryDataUrl)}
                      style={{ marginTop: '8px' }}
                    >
                      {t('client.test_discovery_url')}
                    </Button>
                  </Grid>
                )}
              </Grid>
            )}
            {configTab === 1 && (
              <EntityConfig config={config} setConfig={setConfig} isFormSubmitted={isFormSubmitted} />
            )}
            {configTab === 2 && (
              <LoginConfig config={config} setConfig={setConfig} isFormSubmitted={isFormSubmitted} />
            )}
            {configTab === 3 && (
              <CommentsConfig config={config} setConfig={setConfig} isFormSubmitted={isFormSubmitted} />
            )}
            {configTab === 4 && (
              <CaptchaConfig config={config} setConfig={setConfig} isFormSubmitted={isFormSubmitted} />
            )}
            {configTab === 5 && (
              <OtherConfig config={config} setConfig={setConfig} isFormSubmitted={isFormSubmitted} />
            )}
            {configTab === 6 && (
              <CorsConfig config={config} setConfig={setConfig} isFormSubmitted={isFormSubmitted} />
            )}
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions className="client-dialog-actions">
        <Button
          onClick={() => {
            setOpenConfigDialog(false);
            setEditingClient(null);
            resetConfig();
          }}
          className="client-cancel-button"
        >
          {t('client.cancel')}
        </Button>
        <Button
          onClick={handleGenerateOrUpdateCID}
          variant="contained"
          disabled={loading}
          className="client-save-button"
        >
          {editingClient ? t('client.save') : t('client.generate')}
        </Button>
      </DialogActions>
      {loading && <LinearProgress />}
    </Dialog>
  );
};

export default ConfigDialog;