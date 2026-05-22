/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

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
import ToxicityConfig from './ToxicityConfig';
import CorsConfig from './CorsConfig';
import EntityConfig from './EntityConfig';
import CaptchaConfig from './CaptchaConfig';
import OtherConfig from './OtherConfig';
import AuthWidgetConfig from './AuthWidgetConfig';
import GiphyConfig from './GiphyConfig';
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
 * 2 — Content Sources : Entity selector — which DOM elements are comments attached to?
 * 3 — Identity Widget : Floating or embedded navigation widget settings.
 */
const BASIC_TABS = [
    { key: 'general',      labelKey: 'client.tab_general' },
    { key: 'login',        labelKey: 'client.tab_login' },
    { key: 'entity',       labelKey: 'client.tab_content_sources' },
    { key: 'authWidget',   labelKey: 'client.tab_identity_widget' },
];

/**
 * Tab descriptors for Advanced mode.
 *
 * Advanced covers security, integration, and policy guardrails.
 *
 * 0 — Toxicity    : Anti-harassment scoring thresholds.
 * 1 — Moderation  : Content policy and LLM guardrails.
 * 2 — CAPTCHA     : Bot mitigation.
 * 3 — GIF / Giphy : Multimedia settings.
 * 4 — CORS        : Allowed origins.
 * 5 — Other       : Auto-translation and language detection APIs.
 */
const ADVANCED_TABS = [
    { key: 'toxicity',   labelKey: 'client.toxicity_config' },
    { key: 'moderation', labelKey: 'client.tab_moderation' },
    { key: 'captcha',    labelKey: 'client.tab_captcha' },
    { key: 'giphy',      labelKey: 'client.tab_giphy' },
    { key: 'cors',       labelKey: 'client.tab_cors' },
    { key: 'other',      labelKey: 'client.tab_other' },
];

/**
 * Renders the modal dialog for creating or editing a Client's core settings.
 *
 * Divides the configuration surface into two distinct modes ('basic' and
 * 'advanced') to prevent overwhelming non-technical operators while still
 * providing granular control to developers.
 *
 * State and API interactions are managed externally by the `useClient` hook
 * to keep this component strictly presentational.
 *
 * @param {Object}     props
 * @param {boolean}    props.open                      - Visibility state.
 * @param {Function}   props.setOpenConfigDialog       - Visibility setter.
 * @param {Object}     props.config                    - Current active config state.
 * @param {Function}   props.setConfig                 - Config state setter.
 * @param {Object}     props.editingClient             - The client being edited (null if creating).
 * @param {Function}   props.setEditingClient          - Clears the editing reference on close.
 * @param {Function}   props.handleUpsertClient        - Triggers the save API call.
 * @param {Function}   props.resetConfig               - Resets the form state.
 * @param {boolean}    props.loading                   - Loading state for the save operation.
 * @param {boolean}    props.isFormSubmitted           - Toggled on submit to show validation errors.
 * @param {ConfigMode} [props.initialMode='basic']     - The mode to render when the dialog opens.
 * @returns {JSX.Element}
 */
const ConfigDialog = ({
    open,
    setOpenConfigDialog,
    config,
    setConfig,
    editingClient,
    setEditingClient,
    handleUpsertClient,
    resetConfig,
    loading,
    isFormSubmitted,
    initialMode = 'basic',
}) => {
    const { t } = useTranslation();

    /** @type {[ConfigMode, Function]} */
    const [mode, setMode] = useState(initialMode);
    
    /** @type {[number, Function]} */
    const [activeTabIndex, setActiveTabIndex] = useState(0);

    // Sync mode when the dialog opens from different entry points.
    useEffect(() => {
        if (open) {
            setMode(initialMode);
            setActiveTabIndex(0);
        }
    }, [open, initialMode]);

    /**
     * Handles switching between basic and advanced configuration modes.
     * Resetting the tab index ensures we don't land out-of-bounds.
     *
     * @param {React.MouseEvent} _event
     * @param {ConfigMode}       newMode
     */
    const handleModeChange = (_event, newMode) => {
        if (newMode !== null) {
            setMode(newMode);
            setActiveTabIndex(0);
        }
    };

    /**
     * Standard Material-UI Tab handler.
     *
     * @param {React.SyntheticEvent} _event
     * @param {number}               newValue
     */
    const handleTabChange = (_event, newValue) => {
        setActiveTabIndex(newValue);
    };

    /**
     * Centralized change handler for standard primitive inputs in the General tab.
     * Deep updates use dot-notation inside specific sub-components.
     *
     * @param {React.ChangeEvent<HTMLInputElement>} e
     */
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setConfig(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    /**
     * Validates and processes the CID generation or update.
     */
    const handleGenerateOrUpdateCID = () => {
        handleUpsertClient();
    };

    // Arrays drive the tab structure.
    const currentTabs = mode === 'advanced' ? ADVANCED_TABS : BASIC_TABS;
    const activeTabKey = currentTabs[activeTabIndex]?.key;

    /**
     * Renders the active configuration panel based on the selected mode and tab index.
     * Passes the global validation flag `isFormSubmitted` down to sub-components
     * so they can light up invalid fields.
     *
     * @returns {JSX.Element|null}
     */
    const renderTabContent = () => {
        if (mode === 'basic') {
            switch (activeTabKey) {
                case 'general':
                    return (
                        <Box sx={{ mt: 2 }}>
                            <CustomTextField
                                fullWidth
                                label={t('client.description')}
                                name="description"
                                value={config.description}
                                onChange={handleInputChange}
                                margin="normal"
                                error={isFormSubmitted && (!config.description || config.description.trim().length < 3)}
                                helperText={isFormSubmitted && (!config.description || config.description.trim().length < 3) ? t('client.description_required_min_length') : ''}
                            />
                            <CustomTextField
                                fullWidth
                                label={t('client.api_url')}
                                name="apiUrl"
                                value={config.apiUrl}
                                onChange={handleInputChange}
                                margin="normal"
                                error={isFormSubmitted && !config.apiUrl}
                                helperText={isFormSubmitted && !config.apiUrl ? t('client.api_url_required') : ''}
                            />
                            <CustomTextField
                                fullWidth
                                label={t('client.site_url_label')}
                                name="siteUrl"
                                value={config.siteUrl}
                                onChange={handleInputChange}
                                margin="normal"
                                error={isFormSubmitted && !config.siteUrl}
                                helperText={isFormSubmitted && !config.siteUrl ? t('client.site_url_required_valid') : t('client.site_url_helper')}
                            />
                        </Box>
                    );
                case 'login':
                    return <LoginConfig config={config} setConfig={setConfig} isFormSubmitted={isFormSubmitted} />;
                case 'entity':
                    return <EntityConfig config={config} setConfig={setConfig} isFormSubmitted={isFormSubmitted} />;
                case 'authWidget':
                    return <AuthWidgetConfig config={config} setConfig={setConfig} isFormSubmitted={isFormSubmitted} />;
                default:
                    return null;
            }
        }

        if (mode === 'advanced') {
            switch (activeTabKey) {
                case 'toxicity':
                    return <ToxicityConfig config={config} setConfig={setConfig} isFormSubmitted={isFormSubmitted} />;
                case 'moderation':
                    return <CommentsConfig config={config} setConfig={setConfig} isFormSubmitted={isFormSubmitted} />;
                case 'captcha':
                    return <CaptchaConfig config={config} setConfig={setConfig} isFormSubmitted={isFormSubmitted} />;
                case 'giphy':
                    return <GiphyConfig config={config} setConfig={setConfig} isFormSubmitted={isFormSubmitted} />;
                case 'cors':
                    return <CorsConfig config={config} setConfig={setConfig} isFormSubmitted={isFormSubmitted} />;
                case 'other':
                    return <OtherConfig config={config} setConfig={setConfig} isFormSubmitted={isFormSubmitted} />;
                default:
                    return null;
            }
        }
        return null;
    };

    return (
        <Dialog
            open={open}
            onClose={() => {
                setOpenConfigDialog(false);
                setEditingClient(null);
                resetConfig();
            }}
            maxWidth="md"
            fullWidth
            PaperProps={{ className: 'client-dialog' }}
            disableEnforceFocus
        >
            <DialogTitle sx={{ pb: 1, pt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="h6" component="div" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                        {editingClient ? t('client.edit_cid') : t('client.add_new_cid')}
                        {editingClient && (
                            <Chip
                                label={editingClient.cid}
                                size="small"
                                sx={{ ml: 2, fontFamily: 'monospace', fontWeight: 'bold' }}
                                color="primary"
                                variant="outlined"
                            />
                        )}
                    </Typography>

                    {/* Compact Mode Toggle rendered in the Header to save vertical space */}
                    <ToggleButtonGroup
                        value={mode}
                        exclusive
                        onChange={handleModeChange}
                        aria-label="Configuration Mode"
                        size="small"
                        color="primary"
                        sx={{ height: 32 }}
                    >
                        <ToggleButton value="basic" aria-label="Basic Mode" sx={{ px: 2, textTransform: 'none' }}>
                            <BasicIcon fontSize="small" sx={{ mr: 0.5 }} />
                            {t('client.mode_basic')}
                        </ToggleButton>
                        <ToggleButton value="advanced" aria-label="Advanced Mode" sx={{ px: 2, textTransform: 'none' }}>
                            <AdvancedIcon fontSize="small" sx={{ mr: 0.5 }} />
                            {t('client.mode_advanced')}
                        </ToggleButton>
                    </ToggleButtonGroup>
                </Box>
            </DialogTitle>

            <Divider />

            <DialogContent sx={{ pt: 2 }}>
                <Grid container spacing={2}>
                    {/* Navigation Tabs */}
                    <Grid item xs={12}>
                        <Tabs
                            value={activeTabIndex}
                            onChange={handleTabChange}
                            variant="scrollable"
                            scrollButtons="auto"
                            sx={{
                                borderBottom: 1,
                                borderColor: 'divider',
                                '& .MuiTab-root': { fontWeight: 500 }
                            }}
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