// ./src/components/Client/ConfigDialog.jsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Tabs,
    Tab,
    LinearProgress,
    Grid,
    Typography,
    FormControlLabel,
    Checkbox,
    Box
} from '@mui/material';
import LoginConfig from './LoginConfig';
import CommentsConfig from './CommentsConfig';
import OtherConfig from './OtherConfig';
import CorsConfig from './CorsConfig';
import EntityConfig from './EntityConfig';
import CaptchaConfig from './CaptchaConfig';
import NetworkConfig from './NetworkConfig';
import AuthWidgetConfig from './AuthWidgetConfig';

import CustomTextField from '../Common/CustomTextField';

/**
 * Main dialog component for creating or editing a Client's configuration.
 * Orchestrates the different configuration modules via a tabbed interface.
 *
 * @param {Object} props - Component properties.
 * @param {boolean} props.open - Controls the visibility of the dialog.
 * @param {Object|null} props.editingClient - The client being edited, or null if creating a new one.
 * @param {Object} props.config - The current configuration state object.
 * @param {Function} props.setConfig - State setter for the configuration.
 * @param {boolean} props.isFormSubmitted - Flag indicating if the save attempt has been triggered.
 * @param {boolean} props.loading - Flag indicating if an asynchronous operation is in progress.
 * @param {Function} props.handleGenerateOrUpdateCID - Callback to persist the client.
 * @param {Function} props.setOpenConfigDialog - State setter for dialog visibility.
 * @param {Function} props.setEditingClient - State setter for the active client being edited.
 * @param {Function} props.resetConfig - Callback to reset the form to its default state.
 * @param {string} props.cid - The current Client ID.
 */
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
    const MAX_SITE_URL_LENGTH = 300;

    const handleConfigTabChange = (event, newValue) => {
        setConfigTab(newValue);
    };

    const handleDescriptionChange = (e) => {
        const value = e.target.value;
        if (value.length <= MAX_DESCRIPTION_LENGTH) {
            setConfig({ ...config, description: value });
        }
    };

    const handleApiUrlChange = (e) => {
        const value = e.target.value;
        if (value.length <= MAX_API_URL_LENGTH) {
            setConfig({ ...config, apiUrl: value });
        }
    };

    const handleSiteUrlChange = (e) => {
        const value = e.target.value;
        if (value.length <= MAX_SITE_URL_LENGTH) {
            setConfig({ ...config, siteUrl: value });
        }
    };

    const handleLanguageChange = (e) => {
        const { checked } = e.target;
        setConfig(prev => ({
            ...prev,
            config: {
                ...prev.config,
                language: {
                    ...prev.config.language,
                    enabled: checked
                }
            }
        }));
    };

    const isApiUrlInvalid = config.apiUrl && !/^(https?:\/\/)?(localhost|[\w-]+(\.[\w-]+)+|(\d{1,3}\.){3}\d{1,3}|\[[a-f0-9:]+\])(:\d+)?(\/.*)?$/i.test(config.apiUrl);
    const isSiteUrlInvalid = config.siteUrl && !/^(https?:\/\/)?(localhost|[\w-]+(\.[\w-]+)+|(\d{1,3}\.){3}\d{1,3}|\[[a-f0-9:]+\])(:\d+)?(\/.*)?$/i.test(config.siteUrl);

    return (
        <Dialog 
            open={open} 
            onClose={() => {}} 
            maxWidth="md" 
            fullWidth 
            className="client-dialog"
            disableEscapeKeyDown
        >
            <DialogTitle className="client-dialog-title">
                {editingClient ? t('client.edit_cid') : t('client.add_new_cid')}
                {editingClient && (
                    <Typography variant="subtitle2" color="textSecondary" component="div">
                        CID: {cid}
                    </Typography>
                )}
            </DialogTitle>
            <DialogContent className="client-dialog-content">
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12}>
                        <Tabs 
                            value={configTab} 
                            onChange={handleConfigTabChange} 
                            indicatorColor="primary" 
                            textColor="primary" 
                            variant="scrollable" 
                            scrollButtons="auto"
                            className="client-tabs"
                        >
                            <Tab label={t('client.general')} />
                            <Tab label={t('client.login_config')} />
                            <Tab label={t('client.auth_widget_config') || 'Auth Widget'} />
                            <Tab label={t('client.comments_config')} />
                            <Tab label={t('client.entity_config')} />
                            <Tab label={t('client.captcha_config')} />
                            <Tab label={t('client.other_config')} />
                            <Tab label={t('client.cors_config')} />
                            <Tab label={t('client.network_config')} />
                        </Tabs>
                    </Grid>

                    <Grid item xs={12} sx={{ mt: 2 }}>
                        {configTab === 0 && (
                            <Box>
                                <CustomTextField
                                    label={t('client.description')}
                                    fullWidth
                                    margin="normal"
                                    value={config.description || ''}
                                    onChange={handleDescriptionChange}
                                    error={isFormSubmitted && !config.description?.trim()}
                                    helperText={
                                        isFormSubmitted && !config.description?.trim()
                                            ? t('client.description_required')
                                            : `${config.description?.length || 0}/${MAX_DESCRIPTION_LENGTH}`
                                    }
                                />

                                <CustomTextField
                                    label={t('client.api_url')}
                                    fullWidth
                                    margin="normal"
                                    value={config.apiUrl || ''}
                                    onChange={handleApiUrlChange}
                                    error={isFormSubmitted && (!config.apiUrl?.trim() || isApiUrlInvalid)}
                                    helperText={
                                        isFormSubmitted && !config.apiUrl?.trim() ? t('client.api_url_required') :
                                            isFormSubmitted && isApiUrlInvalid ? t('client.api_url_required_valid') :
                                                `${config.apiUrl?.length || 0}/${MAX_API_URL_LENGTH}`
                                    }
                                />
                                
                                <CustomTextField
                                    label={t('client.site_url_label')}
                                    fullWidth
                                    margin="normal"
                                    value={config.siteUrl || ''}
                                    onChange={handleSiteUrlChange}
                                    error={isFormSubmitted && (!config.siteUrl?.trim() || isSiteUrlInvalid)}
                                    helperText={
                                        isFormSubmitted && !config.siteUrl?.trim() ? t('client.site_url_required_valid') :
                                            isFormSubmitted && isSiteUrlInvalid ? t('client.site_url_required_valid') :
                                                t('client.site_url_helper')
                                    }
                                />

                                <Box sx={{ mt: 2 }}>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={config.config.language?.enabled || false}
                                                onChange={handleLanguageChange}
                                                name="languageEnabled"
                                                color="primary"
                                            />
                                        }
                                        label={t('client.language_config')}
                                    />
                                </Box>
                            </Box>
                        )}
                        {configTab === 1 && (
                            <LoginConfig config={config} setConfig={setConfig} isFormSubmitted={isFormSubmitted}/>
                        )}
                        {configTab === 2 && (
                            <AuthWidgetConfig config={config} setConfig={setConfig} isFormSubmitted={isFormSubmitted}/>
                        )}
                        {configTab === 3 && (
                            <CommentsConfig config={config} setConfig={setConfig} isFormSubmitted={isFormSubmitted}/>
                        )}
                        {configTab === 4 && (
                            <EntityConfig config={config} setConfig={setConfig} isFormSubmitted={isFormSubmitted}/>
                        )}
                        {configTab === 5 && (
                            <CaptchaConfig config={config} setConfig={setConfig} isFormSubmitted={isFormSubmitted}/>
                        )}
                        {configTab === 6 && (
                            <OtherConfig config={config} setConfig={setConfig} isFormSubmitted={isFormSubmitted}/>
                        )}
                        {configTab === 7 && (
                            <CorsConfig config={config} setConfig={setConfig} isFormSubmitted={isFormSubmitted}/>
                        )}
                        {configTab === 8 && (
                            <NetworkConfig config={config} setConfig={setConfig} isFormSubmitted={isFormSubmitted}/>
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
            {loading && <LinearProgress/>}
        </Dialog>
    );
};

export default ConfigDialog;