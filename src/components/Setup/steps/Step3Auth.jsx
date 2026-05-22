/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Box, Typography, Paper, RadioGroup, FormControlLabel, Radio,
    Button, InputAdornment, IconButton, Divider, Chip, Stack,
} from '@mui/material';
import { Visibility, VisibilityOff, Refresh } from '@mui/icons-material';
import CustomTextField from '../../Common/CustomTextField';

const AUTH_CMS_PRESETS = {
    wordpress: {
        loginUrl:        '/wp-login.php',
        logoutUrl:       '/wp-login.php?action=logout',
        registrationUrl: '/wp-login.php?action=register',
    },
    ghost: {
        loginUrl:        '/signin',
        logoutUrl:       '/signout',
        registrationUrl: '/signup',
    },
    drupal: {
        loginUrl:        '/user/login',
        logoutUrl:       '/user/logout',
        registrationUrl: '/user/register',
    },
    joomla: {
        loginUrl:        '/index.php?option=com_users&view=login',
        logoutUrl:       '/index.php?option=com_users&task=user.logout',
        registrationUrl: '/index.php?option=com_users&view=registration',
    },
    custom: { loginUrl: '', logoutUrl: '', registrationUrl: '' },
};

const Step3Auth = ({ formData, errors, onChange, onGenerateSecret }) => {
    const { t } = useTranslation();
    const [showSecret,      setShowSecret]      = useState(false);
    const [selectedAuthCms, setSelectedAuthCms] = useState(null);

    const modeCardSx = (active) => ({
        p: 2, mb: 1.5, cursor: 'pointer',
        borderColor: active ? 'primary.main' : 'divider',
        borderWidth: active ? 2 : 1,
        transition: 'border-color 0.15s',
    });

    const applyAuthPreset = (cms) => {
        setSelectedAuthCms(cms);
        const base   = (formData.siteUrl || '').replace(/\/$/, '');
        const preset = AUTH_CMS_PRESETS[cms];
        onChange({
            loginUrl:        preset.loginUrl        ? base + preset.loginUrl        : '',
            logoutUrl:       preset.logoutUrl        ? base + preset.logoutUrl        : '',
            registrationUrl: preset.registrationUrl ? base + preset.registrationUrl : '',
        });
    };

    const cmsOptions = [
        { key: 'wordpress', label: 'WordPress' },
        { key: 'ghost',     label: 'Ghost' },
        { key: 'drupal',    label: 'Drupal' },
        { key: 'joomla',    label: 'Joomla' },
        { key: 'custom',    label: t('setup.selectors.cms_custom', 'Custom') },
    ];

    return (
        <Box>
            <Typography variant="h5" fontWeight={700} gutterBottom>
                {t('setup.auth.title')}
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
                {t('setup.auth.subtitle')}
            </Typography>

            {/* JWT Secret */}
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                {t('setup.auth.jwt_section')}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
                {t('setup.auth.jwt_body')}
            </Typography>

            <CustomTextField
                label={t('setup.auth.jwt_label')}
                fullWidth
                required
                type={showSecret ? 'text' : 'password'}
                value={formData.jwtSecret}
                onChange={(e) => onChange({ jwtSecret: e.target.value })}
                error={!!errors.jwtSecret}
                helperText={errors.jwtSecret}
                InputProps={{
                    endAdornment: (
                        <>
                            <InputAdornment position="end">
                                <IconButton
                                    onClick={() => setShowSecret((p) => !p)}
                                    edge="end"
                                    size="small"
                                >
                                    {showSecret ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                </IconButton>
                            </InputAdornment>
                            <Button
                                startIcon={<Refresh />}
                                onClick={onGenerateSecret}
                                size="small"
                                sx={{ ml: 0.5, whiteSpace: 'nowrap' }}
                            >
                                {t('setup.auth.jwt_generate')}
                            </Button>
                        </>
                    ),
                }}
            />

            <Divider sx={{ my: 3 }} />

            {/* Login mode */}
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                {t('setup.auth.login_mode_title')}
            </Typography>

            <RadioGroup
                value={formData.loginMode}
                onChange={(e) => onChange({ loginMode: e.target.value })}
            >
                {/* Quelora SSO */}
                <Paper
                    variant="outlined"
                    sx={modeCardSx(formData.loginMode === 'quelora')}
                    onClick={() => onChange({ loginMode: 'quelora' })}
                >
                    <FormControlLabel
                        value="quelora"
                        control={<Radio size="small" />}
                        label={
                            <Box>
                                <Typography variant="body2" fontWeight={600}>
                                    {t('setup.auth.mode_quelora')}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {t('setup.auth.mode_quelora_desc')}
                                </Typography>
                            </Box>
                        }
                        sx={{ m: 0, width: '100%', alignItems: 'flex-start', pt: 0.5 }}
                    />
                </Paper>

                {/* Custom login */}
                <Paper
                    variant="outlined"
                    sx={modeCardSx(formData.loginMode === 'custom')}
                    onClick={() => onChange({ loginMode: 'custom' })}
                >
                    <FormControlLabel
                        value="custom"
                        control={<Radio size="small" />}
                        label={
                            <Box>
                                <Typography variant="body2" fontWeight={600}>
                                    {t('setup.auth.mode_custom')}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {t('setup.auth.mode_custom_desc')}
                                </Typography>
                            </Box>
                        }
                        sx={{ m: 0, width: '100%', alignItems: 'flex-start', pt: 0.5 }}
                    />

                    {formData.loginMode === 'custom' && (
                        <Box sx={{ mt: 2, pl: 4 }} onClick={(e) => e.stopPropagation()}>

                            {/* CMS preset chips */}
                            <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                                {t('setup.auth.cms_hint', 'Select your CMS to pre-fill the URLs:')}
                            </Typography>
                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
                                {cmsOptions.map(({ key, label }) => (
                                    <Chip
                                        key={key}
                                        label={label}
                                        size="small"
                                        clickable
                                        color={selectedAuthCms === key ? 'primary' : 'default'}
                                        variant={selectedAuthCms === key ? 'filled' : 'outlined'}
                                        onClick={() => applyAuthPreset(key)}
                                    />
                                ))}
                            </Stack>

                            {/* URL fields */}
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <CustomTextField
                                    label={t('setup.auth.login_url')}
                                    fullWidth
                                    value={formData.loginUrl}
                                    onChange={(e) => onChange({ loginUrl: e.target.value })}
                                    placeholder="https://"
                                />
                                <CustomTextField
                                    label={t('setup.auth.logout_url')}
                                    fullWidth
                                    value={formData.logoutUrl}
                                    onChange={(e) => onChange({ logoutUrl: e.target.value })}
                                    placeholder="https://"
                                />
                                <CustomTextField
                                    label={t('setup.auth.register_url')}
                                    fullWidth
                                    value={formData.registrationUrl}
                                    onChange={(e) => onChange({ registrationUrl: e.target.value })}
                                    placeholder="https://"
                                />
                            </Box>
                        </Box>
                    )}
                </Paper>
            </RadioGroup>
        </Box>
    );
};

export default Step3Auth;
