/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Box, Typography, Button, Paper, Alert, IconButton, Divider, Tooltip,
    Accordion, AccordionSummary, AccordionDetails,
} from '@mui/material';
import {
    Visibility, VisibilityOff, Download, CheckCircle, ContentCopy, ExpandMore,
} from '@mui/icons-material';
import { compileIntegrationSnippet } from '../../Client/CodeModal';

/**
 * Final step of the SetupWizard.
 *
 * Primary display: the connection string (`apiUrl:cid:jwtSecret`) ready to
 * paste into the WordPress plugin wizard.  An "Advanced" accordion exposes
 * the individual credentials and the downloadable compiled snippet for
 * non-WordPress or manual setups.
 *
 * @param {Object}   props
 * @param {Object}   props.formData          - Wizard form state.
 * @param {Object}   props.savedClient       - The persisted client object returned by the API.
 * @param {boolean}  props.saveError         - True when the automatic save failed.
 * @param {Function} props.onGoToDashboard   - Navigates to the dashboard after setup.
 * @returns {JSX.Element}
 */
const Step5Integration = ({ formData, savedClient, saveError, onGoToDashboard }) => {
    const { t } = useTranslation();

    const [showSecret,   setShowSecret]   = useState(false);
    const [copiedStr,    setCopiedStr]    = useState(false);
    const [copiedConfig, setCopiedConfig] = useState(false);
    const [copiedJwt,    setCopiedJwt]    = useState(false);

    const cid       = savedClient?.cid || 'YOUR_CID';
    const jwtSecret = formData.jwtSecret || '';
    const apiUrl    = (process.env.REACT_APP_API_BASE_URL || '').replace(/\/$/, '');

    const connectionStr = `${apiUrl}:${cid}:${jwtSecret}`;
    const maskedStr     = `${apiUrl}:${cid}:${'•'.repeat(Math.min(jwtSecret.length || 20, 20))}`;

    const configObject = { cid, apiUrl };
    const configCode   = `window.QUELORA_CONFIG = ${JSON.stringify(configObject, null, 2)};`;

    const compiledSnippet = useMemo(
        () => compileIntegrationSnippet(savedClient),
        [savedClient],
    );

    const copy = (text, setter) => {
        navigator.clipboard.writeText(text);
        setter(true);
        setTimeout(() => setter(false), 2500);
    };

    const handleDownload = () => {
        const blob = new Blob([compiledSnippet], { type: 'text/javascript' });
        const url  = window.URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `quelora-config-${cid}.js`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    return (
        <Box>
            {/* ── Header ─────────────────────────────────────────────── */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <CheckCircle color="success" sx={{ fontSize: 32 }} />
                <Typography variant="h5" fontWeight={700}>
                    {t('setup.integration.title')}
                </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" mb={3}>
                {t('setup.integration.subtitle')}
            </Typography>

            {saveError && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                    {t('setup.integration.save_error')}
                </Alert>
            )}

            {/* ── Connection String ───────────────────────────────────── */}
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                {t('setup.integration.auto_label')}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                {t('setup.integration.auto_hint')}
            </Typography>

            <Paper
                variant="outlined"
                sx={{
                    display: 'flex', alignItems: 'center', px: 2, py: 1, mb: 1, gap: 1,
                    bgcolor: 'action.hover', borderRadius: 1,
                }}
            >
                <Typography
                    sx={{
                        flex:       1,
                        fontFamily: 'monospace',
                        fontSize:   '0.8rem',
                        wordBreak:  'break-all',
                    }}
                >
                    {showSecret ? connectionStr : maskedStr}
                </Typography>
                <Tooltip title={showSecret ? t('common.hide', 'Hide') : t('common.show', 'Show')}>
                    <IconButton size="small" onClick={() => setShowSecret((p) => !p)}>
                        {showSecret ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                </Tooltip>
                <Tooltip title={copiedStr ? t('setup.integration.copied') : t('setup.integration.copy')}>
                    <IconButton
                        size="small"
                        onClick={() => copy(connectionStr, setCopiedStr)}
                        color={copiedStr ? 'success' : 'default'}
                    >
                        <ContentCopy fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Paper>

            {copiedStr && (
                <Typography variant="caption" color="success.main" sx={{ ml: 0.5 }}>
                    {t('setup.integration.copied')}
                </Typography>
            )}

            <Divider sx={{ my: 2.5 }} />

            {/* ── Instructions ───────────────────────────────────────── */}
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                {t('setup.integration.instructions_title')}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2.5 }}>
                {[
                    t('setup.integration.auto_step1'),
                    t('setup.integration.auto_step2'),
                    t('setup.integration.auto_step3'),
                ].map((step, i) => (
                    <Box key={i} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                        <Box
                            sx={{
                                minWidth:       22,
                                height:         22,
                                borderRadius:   '50%',
                                bgcolor:        'primary.main',
                                color:          'primary.contrastText',
                                display:        'flex',
                                alignItems:     'center',
                                justifyContent: 'center',
                                fontSize:       '0.75rem',
                                fontWeight:     700,
                                mt:             0.1,
                            }}
                        >
                            {i + 1}
                        </Box>
                        <Typography variant="body2" color="text.secondary">{step}</Typography>
                    </Box>
                ))}
            </Box>

            {/* ── Advanced / individual credentials ──────────────────── */}
            <Accordion
                elevation={0}
                sx={{
                    border:       '1px solid',
                    borderColor:  'divider',
                    borderRadius: 1,
                    mb: 2,
                    '&:before':   { display: 'none' },
                }}
            >
                <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="body2" fontWeight={600}>
                        {t('setup.integration.advanced_label')}
                    </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

                    {/* window.QUELORA_CONFIG */}
                    <Box>
                        <Typography variant="caption" fontWeight={600} display="block" gutterBottom>
                            {t('setup.integration.config_label')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                            {t('setup.integration.config_hint')}
                        </Typography>
                        <Paper
                            variant="outlined"
                            sx={{ px: 2, py: 1.5, bgcolor: 'action.hover', borderRadius: 1, position: 'relative' }}
                        >
                            <Typography
                                component="pre"
                                sx={{
                                    fontFamily: 'monospace',
                                    fontSize:   '0.8rem',
                                    whiteSpace: 'pre-wrap',
                                    wordBreak:  'break-all',
                                    m: 0,
                                    pr: 4,
                                }}
                            >
                                {configCode}
                            </Typography>
                            <Tooltip title={copiedConfig ? t('setup.integration.copied') : t('setup.integration.copy')}>
                                <IconButton
                                    size="small"
                                    onClick={() => copy(configCode, setCopiedConfig)}
                                    color={copiedConfig ? 'success' : 'default'}
                                    sx={{ position: 'absolute', top: 6, right: 6 }}
                                >
                                    <ContentCopy fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </Paper>
                    </Box>

                    {/* JWT Secret */}
                    <Box>
                        <Typography variant="caption" fontWeight={600} display="block" gutterBottom>
                            {t('setup.integration.jwt_section')}
                        </Typography>
                        <Alert severity="warning" icon={false} sx={{ mb: 1, py: 0.5 }}>
                            <Typography variant="caption">{t('setup.integration.jwt_warning')}</Typography>
                        </Alert>
                        <Paper
                            variant="outlined"
                            sx={{
                                display:      'flex',
                                alignItems:   'center',
                                px: 2, py: 1, gap: 1,
                                bgcolor:      'action.hover',
                                borderRadius: 1,
                            }}
                        >
                            <Typography
                                sx={{
                                    flex:          1,
                                    fontFamily:    'monospace',
                                    fontSize:      '0.85rem',
                                    letterSpacing: showSecret ? 0.5 : 2,
                                    overflow:      'hidden',
                                    textOverflow:  'ellipsis',
                                    whiteSpace:    'nowrap',
                                }}
                            >
                                {showSecret ? jwtSecret : '••••••••••••••••••••••••••••••••'}
                            </Typography>
                            <Tooltip title={showSecret ? t('common.hide', 'Hide') : t('common.show', 'Show')}>
                                <IconButton size="small" onClick={() => setShowSecret((p) => !p)}>
                                    {showSecret ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                </IconButton>
                            </Tooltip>
                            <Tooltip title={copiedJwt ? t('setup.integration.copied') : t('setup.integration.copy')}>
                                <IconButton
                                    size="small"
                                    onClick={() => copy(jwtSecret, setCopiedJwt)}
                                    color={copiedJwt ? 'success' : 'default'}
                                >
                                    <ContentCopy fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </Paper>
                    </Box>

                    {/* Download */}
                    <Box>
                        <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                            {t('setup.integration.download_hint')}
                        </Typography>
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<Download fontSize="small" />}
                            onClick={handleDownload}
                        >
                            {t('setup.integration.download')}
                        </Button>
                    </Box>

                </AccordionDetails>
            </Accordion>

            <Divider sx={{ my: 2 }} />

            <Button variant="contained" size="large" fullWidth onClick={onGoToDashboard}>
                {t('setup.integration.go_dashboard')}
            </Button>
        </Box>
    );
};

export default Step5Integration;
