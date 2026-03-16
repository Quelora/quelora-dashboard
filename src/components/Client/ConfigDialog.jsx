// src/components/Client/ConfigDialog.jsx
import React, { useState, useEffect } from 'react';
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
    Box,
    ToggleButtonGroup,
    ToggleButton,
    Divider,
    Chip,
} from '@mui/material';
import {
    TuneOutlined as BasicIcon,
    BuildOutlined as AdvancedIcon,
} from '@mui/icons-material';
import LoginConfig from './LoginConfig';
import CommentsConfig from './CommentsConfig';
import CorsConfig from './CorsConfig';
import EntityConfig from './EntityConfig';
import CaptchaConfig from './CaptchaConfig';
import OtherConfig from './OtherConfig';
import AuthWidgetConfig from './AuthWidgetConfig';
import CustomTextField from '../Common/CustomTextField';

/**
 * @typedef {'basic'|'advanced'} ConfigMode
 */

/**
 * Tab descriptors for Basic mode.
 *
 * Basic targets users without deep technical expertise.
 * It covers the configuration required to get a client site operational:
 * metadata, authentication, how to find content on the page, and the
 * identity widget displayed in the site's navigation bar.
 *
 * 0 — General         : Description, API URL, Site URL, language toggle.
 * 1 — Login           : OAuth providers, JWT secret, base URL.
 * 2 — Content Sources : Entity selector — which DOM elements are articles
 *                       and where interaction widgets are injected.
 * 3 — Identity Widget : Auth widget — avatar + username element embedded
 *                       in the client site's navbar.
 *
 * @type {Array<{labelKey: string}>}
 */
const BASIC_TABS = [
    { labelKey: 'client.tab_general'         },
    { labelKey: 'client.tab_login'           },
    { labelKey: 'client.tab_content_sources' },
    { labelKey: 'client.tab_identity_widget' },
];

/**
 * Tab descriptors for Advanced mode.
 *
 * Advanced targets technical operators who need to configure security,
 * compliance, and content-policy features.
 *
 * 0 — Moderation : AI content moderation + toxicity filter.
 * 1 — CAPTCHA    : Bot-protection provider and key setup.
 * 2 — CORS       : Allowed-origin cross-domain policy.
 * 3 — Other      : Geolocation, translation, discovery mode.
 *
 * Note: Network configuration (TURN / Nostr / P2P) is intentionally
 * excluded from this dialog — it has been promoted to the standalone
 * NetworkConfigModal accessible from the client card, following the same
 * pattern as VapidConfigModal and EmailConfigModal.
 *
 * @type {Array<{labelKey: string}>}
 */
const ADVANCED_TABS = [
    { labelKey: 'client.tab_moderation' },
    { labelKey: 'client.tab_captcha'    },
    { labelKey: 'client.tab_cors'       },
    { labelKey: 'client.tab_other'      },
];

/**
 * Main dialog for creating or editing a Client configuration.
 *
 * The dialog exposes two modes toggled via a ToggleButtonGroup in the
 * title bar — **Basic** and **Advanced** — each with its own tab set.
 * The active mode can be pre-selected on open by passing an `initialMode`
 * prop, which allows the client card's "Edit Basic" and "Edit Advanced"
 * buttons to deep-link directly to the relevant context.
 *
 * @param {Object}         props
 * @param {boolean}        props.open                      - Controls dialog visibility.
 * @param {Object|null}    props.editingClient             - Client being edited, null when creating.
 * @param {Object}         props.config                    - Current configuration state.
 * @param {Function}       props.setConfig                 - State setter for configuration.
 * @param {boolean}        props.isFormSubmitted           - Enables inline field validation display.
 * @param {boolean}        props.loading                   - True while async operation is in flight.
 * @param {Function}       props.handleGenerateOrUpdateCID - Persists the client.
 * @param {Function}       props.setOpenConfigDialog       - Controls dialog visibility.
 * @param {Function}       props.setEditingClient          - Clears the active editing client.
 * @param {Function}       props.resetConfig               - Resets the form to default state.
 * @param {string}         props.cid                       - Current Client ID (edit mode).
 * @param {ConfigMode}     [props.initialMode='basic']     - Mode to activate when dialog opens.
 * @returns {JSX.Element}
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
    cid,
    initialMode = 'basic',
}) => {
    const { t } = useTranslation();

    const [mode,      setMode]      = useState(initialMode);
    const [activeTab, setActiveTab] = useState(0);

    const MAX_DESCRIPTION_LENGTH = 50;
    const MAX_API_URL_LENGTH     = 300;
    const MAX_SITE_URL_LENGTH    = 300;

    /**
     * Sync mode and reset tab index when the dialog opens or initialMode changes.
     * This allows the card's edit buttons to pre-select Basic or Advanced.
     */
    useEffect(() => {
        if (open) {
            setMode(initialMode);
            setActiveTab(0);
        }
    }, [open, initialMode]);

    /**
     * Switches mode and resets to tab 0 so the user always lands on the
     * first tab of the newly selected mode.
     *
     * @param {React.MouseEvent} _event
     * @param {ConfigMode|null}  newMode - Null when the active button is re-clicked (no-op).
     */
    const handleModeChange = (_event, newMode) => {
        if (!newMode) return;
        setMode(newMode);
        setActiveTab(0);
    };

    const handleDescriptionChange = (e) => {
        if (e.target.value.length <= MAX_DESCRIPTION_LENGTH) {
            setConfig({ ...config, description: e.target.value });
        }
    };

    const handleApiUrlChange = (e) => {
        if (e.target.value.length <= MAX_API_URL_LENGTH) {
            setConfig({ ...config, apiUrl: e.target.value });
        }
    };

    const handleSiteUrlChange = (e) => {
        if (e.target.value.length <= MAX_SITE_URL_LENGTH) {
            setConfig({ ...config, siteUrl: e.target.value });
        }
    };

    const handleLanguageChange = (e) => {
        setConfig(prev => ({
            ...prev,
            config: {
                ...prev.config,
                language: { ...prev.config.language, enabled: e.target.checked },
            },
        }));
    };

    const isApiUrlInvalid  = config.apiUrl  && !/^(https?:\/\/)?(localhost|[\w-]+(\.[\w-]+)+|(\d{1,3}\.){3}\d{1,3}|\[[a-f0-9:]+\])(:\d+)?(\/.*)?$/i.test(config.apiUrl);
    const isSiteUrlInvalid = config.siteUrl && !/^(https?:\/\/)?(localhost|[\w-]+(\.[\w-]+)+|(\d{1,3}\.){3}\d{1,3}|\[[a-f0-9:]+\])(:\d+)?(\/.*)?$/i.test(config.siteUrl);

    const currentTabs = mode === 'basic' ? BASIC_TABS : ADVANCED_TABS;

    /**
     * Renders the active tab panel for the current mode.
     *
     * @returns {JSX.Element|null}
     */
    const renderTabContent = () => {
        if (mode === 'basic') {
            switch (activeTab) {
                case 0:
                    return (
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
                                    isFormSubmitted && !config.apiUrl?.trim()
                                        ? t('client.api_url_required')
                                        : isFormSubmitted && isApiUrlInvalid
                                            ? t('client.api_url_required_valid')
                                            : `${config.apiUrl?.length || 0}/${MAX_API_URL_LENGTH}`
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
                                    isFormSubmitted && !config.siteUrl?.trim()
                                        ? t('client.site_url_required_valid')
                                        : isFormSubmitted && isSiteUrlInvalid
                                            ? t('client.site_url_required_valid')
                                            : t('client.site_url_helper')
                                }
                            />
                        </Box>
                    );
                case 1:
                    return (
                        <LoginConfig
                            config={config}
                            setConfig={setConfig}
                            isFormSubmitted={isFormSubmitted}
                        />
                    );
                case 2:
                    return (
                        <EntityConfig
                            config={config}
                            setConfig={setConfig}
                            isFormSubmitted={isFormSubmitted}
                        />
                    );
                case 3:
                    return (
                        <AuthWidgetConfig
                            config={config}
                            setConfig={setConfig}
                            isFormSubmitted={isFormSubmitted}
                        />
                    );
                default:
                    return null;
            }
        }

        // Advanced mode
        switch (activeTab) {
            case 0:
                return (
                    <CommentsConfig
                        config={config}
                        setConfig={setConfig}
                        isFormSubmitted={isFormSubmitted}
                    />
                );
            case 1:
                return (
                    <CaptchaConfig
                        config={config}
                        setConfig={setConfig}
                        isFormSubmitted={isFormSubmitted}
                    />
                );
            case 2:
                return (
                    <CorsConfig
                        config={config}
                        setConfig={setConfig}
                        isFormSubmitted={isFormSubmitted}
                    />
                );
            case 3:
                return (
                    <OtherConfig
                        config={config}
                        setConfig={setConfig}
                        isFormSubmitted={isFormSubmitted}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <Dialog
            open={open}
            onClose={() => {}}
            maxWidth="md"
            fullWidth
            className="client-dialog"
            disableEscapeKeyDown
        >
            {/* ── Title row: label + mode switcher ─────────────────────── */}
            <DialogTitle className="client-dialog-title" sx={{ pb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                    <Box>
                        <Typography variant="h6" component="div">
                            {editingClient ? t('client.edit_cid') : t('client.add_new_cid')}
                        </Typography>
                        {editingClient && (
                            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                                {cid}
                            </Typography>
                        )}
                    </Box>

                    <ToggleButtonGroup
                        value={mode}
                        exclusive
                        onChange={handleModeChange}
                        size="small"
                        sx={{ alignSelf: 'center' }}
                    >
                        <ToggleButton
                            value="basic"
                            sx={{ textTransform: 'none', px: 2, gap: 0.5 }}
                        >
                            <BasicIcon fontSize="small" />
                            {t('client.mode_basic')}
                        </ToggleButton>
                        <ToggleButton
                            value="advanced"
                            sx={{ textTransform: 'none', px: 2, gap: 0.5 }}
                        >
                            <AdvancedIcon fontSize="small" />
                            {t('client.mode_advanced')}
                        </ToggleButton>
                    </ToggleButtonGroup>
                </Box>

                {/* Mode context chip */}
                <Box sx={{ mt: 1 }}>
                    <Chip
                        size="small"
                        label={mode === 'basic'
                            ? t('client.mode_basic_desc')
                            : t('client.mode_advanced_desc')
                        }
                        variant="outlined"
                        color={mode === 'basic' ? 'primary' : 'warning'}
                        sx={{ fontSize: '0.7rem' }}
                    />
                </Box>
            </DialogTitle>

            <Divider />

            <DialogContent className="client-dialog-content" sx={{ px: 3, pt: 0 }}>
                <Grid container spacing={2} sx={{ mt: 0 }}>
                    <Grid item xs={12}>
                        <Tabs
                            value={activeTab}
                            onChange={(_, v) => setActiveTab(v)}
                            indicatorColor="primary"
                            textColor="primary"
                            variant="scrollable"
                            scrollButtons="auto"
                            className="client-tabs"
                            sx={{ borderBottom: 1, borderColor: 'divider' }}
                        >
                            {currentTabs.map((tab) => (
                                <Tab
                                    key={tab.labelKey}
                                    label={t(tab.labelKey)}
                                    sx={{ textTransform: 'none', minHeight: 48 }}
                                />
                            ))}
                        </Tabs>
                    </Grid>

                    <Grid item xs={12} sx={{ mt: 1 }}>
                        {renderTabContent()}
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