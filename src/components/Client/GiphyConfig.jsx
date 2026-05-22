/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

// src/components/Client/GiphyConfig.jsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Box,
    FormControlLabel,
    Checkbox,
    Typography,
    Alert,
    InputAdornment,
    IconButton,
    Divider,
    Link,
} from '@mui/material';
import { Visibility, VisibilityOff, Lock as LockIcon } from '@mui/icons-material';
import CustomTextField from '../Common/CustomTextField';

/**
 * Configuration panel for Giphy integration.
 *
 * Manages two distinct slices of client state:
 * - `config.config.giphy`      — API credentials (apiKey, searchUrl, trendingUrl).
 *                                The apiKey is stored encrypted (pre-save hook in Client.js).
 * - `config.postConfig.comments.allowGif` — public toggle surfaced in QUELORA_CONFIG.
 *
 * Rendered as an Advanced tab inside ConfigDialog.
 *
 * @param {Object}   props
 * @param {Object}   props.config             - Current client config state from useClient.
 * @param {Function} props.setConfig          - State setter from useClient.
 * @param {Object}   [props.fieldErrors={}]   - Server-side field errors keyed by field name.
 * @param {Function} [props.onClearFieldError]- Clears one field error when the user edits it.
 * @returns {JSX.Element}
 */
const GiphyConfig = ({ config, setConfig, fieldErrors = {}, onClearFieldError }) => {
    const { t } = useTranslation();
    const [showApiKey, setShowApiKey] = useState(false);

    const giphyConfig = config.config?.giphy     || {};
    const allowGif    = config.postConfig?.comments?.allowGif ?? false;

    const handleGiphyFieldChange = (field, value) => {
        onClearFieldError?.(field);
        setConfig(prev => ({
            ...prev,
            config: {
                ...prev.config,
                giphy: { ...prev.config.giphy, [field]: value },
            },
        }));
    };

    const handleAllowGifChange = (checked) => {
        setConfig(prev => ({
            ...prev,
            postConfig: {
                ...prev.postConfig,
                comments: { ...prev.postConfig?.comments, allowGif: checked },
            },
        }));
    };

    return (
        <Box component="fieldset" sx={{ border: '1px solid #e0e0e0', borderRadius: '4px', padding: '16px' }}>
            <Typography component="legend" sx={{ padding: '0 8px' }}>
                {t('client.giphy_config')}
            </Typography>

            <Alert severity="info" sx={{ mb: 2 }}>
                {t('client.giphy_get_key_instructions')}{' '}
                <Link href="https://developers.giphy.com" target="_blank" rel="noopener noreferrer">
                    developers.giphy.com
                </Link>
            </Alert>

            <Box className="client-config-details">
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={allowGif}
                            onChange={e => handleAllowGifChange(e.target.checked)}
                            className="client-checkbox"
                        />
                    }
                    label={<Typography>{t('client.giphy_enable_gif_label')}</Typography>}
                    className="client-form-control-label"
                />

                {allowGif && (
                    <Box sx={{ mt: 2 }}>
                        <Divider sx={{ mb: 2 }} />

                        <CustomTextField
                            label={t('client.giphy_api_key')}
                            fullWidth
                            value={giphyConfig.apiKey || ''}
                            onChange={e => handleGiphyFieldChange('apiKey', e.target.value)}
                            type={showApiKey ? 'text' : 'password'}
                            error={!!fieldErrors.apiKey}
                            helperText={fieldErrors.apiKey || t('client.giphy_api_key_help')}
                            inputProps={{ maxLength: 255 }}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <LockIcon sx={{ fontSize: 16, color: '#5f6368' }} />
                                        <IconButton
                                            onClick={() => setShowApiKey(p => !p)}
                                            edge="end"
                                        >
                                            {showApiKey ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <CustomTextField
                            label={t('client.giphy_search_url')}
                            fullWidth
                            value={giphyConfig.searchUrl || ''}
                            onChange={e => handleGiphyFieldChange('searchUrl', e.target.value)}
                            error={!!fieldErrors.searchUrl}
                            helperText={fieldErrors.searchUrl || t('client.giphy_search_url_help')}
                            inputProps={{ maxLength: 500 }}
                            sx={{ mt: 2 }}
                        />

                        <CustomTextField
                            label={t('client.giphy_trending_url')}
                            fullWidth
                            value={giphyConfig.trendingUrl || ''}
                            onChange={e => handleGiphyFieldChange('trendingUrl', e.target.value)}
                            error={!!fieldErrors.trendingUrl}
                            helperText={fieldErrors.trendingUrl || t('client.giphy_trending_url_help')}
                            inputProps={{ maxLength: 500 }}
                            sx={{ mt: 2 }}
                        />
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default GiphyConfig;
