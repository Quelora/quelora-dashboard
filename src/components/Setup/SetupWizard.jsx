/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
    Box, AppBar, Toolbar, Typography, Stepper, Step, StepLabel,
    Paper, Button, CircularProgress, Divider, Select, MenuItem,
} from '@mui/material';
import Step0Register from './steps/Step0Register';
import Step1Verify from './steps/Step1Verify';
import Step2Basics from './steps/Step2Basics';
import Step3Auth from './steps/Step3Auth';
import Step4Selectors from './steps/Step4Selectors';
import Step5Integration from './steps/Step5Integration';
import ThemeSwitcher from '../Common/ThemeSwitcher';
import { registerUser, verifyEmail, resendVerificationCode, completeSetup } from '../../api/setup';
import embedStorage from '../../utils/embedStorage';
import { encryptJSON, generateKeyFromString } from '../../utils/crypto';
import '../../assets/css/SetupWizard.css';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SUPPORTED_LANGUAGES = [
    { code: 'en', label: 'EN' }, { code: 'es', label: 'ES' },
    { code: 'pt', label: 'PT' }, { code: 'fr', label: 'FR' },
    { code: 'de', label: 'DE' }, { code: 'it', label: 'IT' },
    { code: 'ru', label: 'RU' }, { code: 'zh', label: 'ZH' },
    { code: 'ja', label: 'JA' }, { code: 'ar', label: 'AR' },
    { code: 'hi', label: 'HI' }, { code: 'he', label: 'HE' },
];

const RTL_LANGS = new Set(['ar', 'he']);

export const CMS_PRESETS = {
    wordpress:  { entitySelector: 'article', entityIdAttribute: 'id', interactionPosition: 'after', interactionRelativeTo: '.entry-footer' },
    ghost:      { entitySelector: 'article.post-card', entityIdAttribute: 'data-url', interactionPosition: 'after', interactionRelativeTo: '.post-card-footer' },
    drupal:     { entitySelector: '.node--type-article', entityIdAttribute: 'data-history-node-id', interactionPosition: 'after', interactionRelativeTo: '.field--name-body' },
    joomla:     { entitySelector: '.com-content-article', entityIdAttribute: 'id', interactionPosition: 'after', interactionRelativeTo: '.article-footer' },
    custom:     { entitySelector: '', entityIdAttribute: '', interactionPosition: 'after', interactionRelativeTo: '' },
};

const INITIAL_FORM = {
    // Registration
    firstName: '', lastName: '', email: '', password: '', confirmPassword: '',
    // Step 1 — Basics
    siteName: '', siteUrl: '', description: '', language: 'en',
    // Step 2 — Auth
    jwtSecret: '', loginMode: 'custom',
    loginUrl: '', logoutUrl: '', registrationUrl: '',
    // Step 3 — Selectors
    selectorMode: 'discovery', cmsPreset: 'wordpress',
    ...CMS_PRESETS.wordpress,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const generateSecret = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({ length: 32 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

const parseTtlMs = (raw) => {
    const FALLBACK = 7200000;
    const s = String(raw).trim().toLowerCase();
    const m = s.match(/^(\d+(?:\.\d+)?)(s|m|h|d)$/);
    if (m) {
        const mult = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
        const ms = parseFloat(m[1]) * mult[m[2]];
        return ms > 0 ? ms : FALLBACK;
    }
    const n = Number(s);
    return !isNaN(n) && n > 0 ? n * 1000 : FALLBACK;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const SetupWizard = ({ toggleTheme, currentTheme }) => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();

    const [phase, setPhase]             = useState('register');  // 'register' | 'verify' | 'wizard'
    const [wizardStep, setWizardStep]   = useState(0);           // 0–3
    const [formData, setFormData]       = useState(INITIAL_FORM);
    const [errors, setErrors]           = useState({});
    const [loading, setLoading]         = useState(false);
    const [apiError, setApiError]       = useState('');
    const [savedClient, setSavedClient] = useState(null);
    const [saveError, setSaveError]     = useState(false);

    const isWizard = phase === 'wizard';

    // Auto-generate JWT secret when arriving at auth step
    useEffect(() => {
        if (isWizard && wizardStep === 1 && !formData.jwtSecret) {
            setFormData((prev) => ({ ...prev, jwtSecret: generateSecret() }));
        }
    }, [isWizard, wizardStep]); // eslint-disable-line react-hooks/exhaustive-deps

    const updateForm = (updates) => setFormData((prev) => ({ ...prev, ...updates }));

    const changeLanguage = (code) => {
        i18n.changeLanguage(code);
        document.documentElement.setAttribute('dir', RTL_LANGS.has(code) ? 'rtl' : 'ltr');
    };

    // ---------------------------------------------------------------------------
    // Validation
    // ---------------------------------------------------------------------------

    const validateRegister = () => {
        const e = {};
        if (!formData.firstName.trim())
            e.firstName = t('setup.register.err_first_name_required');
        if (!formData.email.trim())
            e.email = t('setup.register.err_email_required');
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
            e.email = t('setup.register.err_email_invalid');
        if (!formData.password)
            e.password = t('setup.register.err_password_required');
        else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(formData.password))
            e.password = t('setup.register.err_password_weak');
        if (formData.password !== formData.confirmPassword)
            e.confirmPassword = t('setup.register.err_password_mismatch');
        return e;
    };

    const validateStep = (step) => {
        if (step === 0) {
            const e = {};
            if (!formData.siteName.trim())
                e.siteName = t('setup.basics.err_site_name_required');
            if (!formData.siteUrl.trim())
                e.siteUrl = t('setup.basics.err_site_url_required');
            else if (!/^https?:\/\/.+/.test(formData.siteUrl))
                e.siteUrl = t('setup.basics.err_site_url_invalid');
            return e;
        }
        if (step === 1) {
            const e = {};
            if (!formData.jwtSecret.trim())
                e.jwtSecret = t('setup.auth.err_jwt_required');
            return e;
        }
        if (step === 2) {
            const e = {};
            if (formData.selectorMode === 'deterministic' && !formData.entitySelector.trim())
                e.entitySelector = t('setup.selectors.err_selector_required');
            return e;
        }
        return {};
    };

    // ---------------------------------------------------------------------------
    // Auth persistence
    // ---------------------------------------------------------------------------

    const persistSession = ({ token, user, clients, client, expiresIn }) => {
        embedStorage.setItem('token', token);
        const list = clients || (client ? [client] : []);
        embedStorage.setItem('clients', JSON.stringify(list));
        const key = generateKeyFromString(user.username || user.email || user._id);
        if (key) {
            embedStorage.setItem('user', encryptJSON(user, key));
            embedStorage.setItem('userKey', user.username || user.email || user._id);
        } else {
            embedStorage.setItem('user', JSON.stringify(user));
        }
        embedStorage.setItem('tokenExpiration', String(Date.now() + parseTtlMs(expiresIn || '2h')));
        const cid = client?.cid || (list.length === 1 ? list[0].cid : null);
        if (cid) embedStorage.setItem('currentCid', cid);
    };

    // ---------------------------------------------------------------------------
    // Handlers
    // ---------------------------------------------------------------------------

    const handleRegisterSubmit = async () => {
        const errs = validateRegister();
        if (Object.keys(errs).length) { setErrors(errs); return; }
        setErrors({});
        setLoading(true);
        setApiError('');
        try {
            await registerUser({
                firstName: formData.firstName,
                lastName:  formData.lastName,
                email:     formData.email,
                password:  formData.password,
                locale:    i18n.language?.slice(0, 2) || 'en',
            });
            setPhase('verify');
        } catch (err) {
            setApiError(typeof err === 'string' ? err : t('common.error'));
        } finally {
            setLoading(false);
        }
    };

    const handleVerifySubmit = async (code) => {
        setLoading(true);
        setApiError('');
        try {
            const data = await verifyEmail({ email: formData.email, code });
            persistSession(data);
            if (data.client) setSavedClient(data.client);
            setPhase('wizard');
        } catch (err) {
            setApiError(typeof err === 'string' ? err : t('setup.verify.err_code_invalid'));
        } finally {
            setLoading(false);
        }
    };

    const handleNext = async () => {
        const errs = validateStep(wizardStep);
        if (Object.keys(errs).length) { setErrors(errs); return; }
        setErrors({});

        // On last input step: try to save before showing integration
        if (wizardStep === 2) {
            setLoading(true);
            setSaveError(false);
            try {
                const result = await completeSetup(savedClient?.cid, formData);
                if (result?.client) setSavedClient(result.client);
            } catch {
                setSaveError(true);
            } finally {
                setLoading(false);
            }
        }

        setWizardStep((s) => s + 1);
    };

    const handleBack = () => {
        if (wizardStep === 0) {
            setPhase('verify');
            setErrors({});
            return;
        }
        setWizardStep((s) => s - 1);
        setErrors({});
    };

    const handleGoToDashboard = () => {
        // Clear the temporary wizard session — user must log in manually
        embedStorage.clear();
        navigate('/login');
    };

    // ---------------------------------------------------------------------------
    // Render
    // ---------------------------------------------------------------------------

    const stepLabels = [
        t('setup.wizard_steps.step1'),
        t('setup.wizard_steps.step2'),
        t('setup.wizard_steps.step3'),
        t('setup.wizard_steps.step4'),
    ];

    const contentMaxWidth = wizardStep === 3 ? 720 : 600;
    const isLastInputStep = wizardStep === 2;

    return (
        <Box className="setup-wizard-root">
            {/* ── Animated background ───────────────────────────────────── */}
            <div className="bg"></div>
            <div className="bg bg2"></div>
            <div className="bg bg3"></div>

            {/* ── Header ────────────────────────────────────────────────── */}
            <AppBar
                position="sticky"
                color="default"
                elevation={0}
                sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper', borderRadius: 0 }}
            >
                <Toolbar sx={{ justifyContent: 'space-between', minHeight: 56, px: { xs: 2, sm: 4 } }}>
                    <Typography variant="h6" fontWeight={800} color="primary" sx={{ letterSpacing: -0.5 }}>
                        Quelora
                    </Typography>

                    {isWizard && (
                        <Stepper
                            activeStep={wizardStep}
                            sx={{
                                flex: 1,
                                mx: { xs: 1, sm: 3 },
                                display: { xs: 'none', sm: 'flex' },
                                '& .MuiStepLabel-label': { fontSize: '0.75rem' },
                                '& .MuiStepConnector-line': { borderColor: 'divider' },
                            }}
                        >
                            {stepLabels.map((label) => (
                                <Step key={label}>
                                    <StepLabel>{label}</StepLabel>
                                </Step>
                            ))}
                        </Stepper>
                    )}

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {/* Compact language selector */}
                        <Select
                            value={i18n.language?.slice(0, 2) || 'en'}
                            onChange={(e) => changeLanguage(e.target.value)}
                            size="small"
                            variant="outlined"
                            sx={{ minWidth: 72, fontSize: '0.8rem' }}
                        >
                            {SUPPORTED_LANGUAGES.map(({ code, label }) => (
                                <MenuItem key={code} value={code} sx={{ fontSize: '0.8rem' }}>
                                    {label}
                                </MenuItem>
                            ))}
                        </Select>
                        {toggleTheme && (
                            <ThemeSwitcher theme={currentTheme} toggleTheme={toggleTheme} />
                        )}
                    </Box>
                </Toolbar>
            </AppBar>


            {/* ── Content ───────────────────────────────────────────────── */}
            <Box
                sx={{
                    flex: 1,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: !isWizard ? 'center' : 'flex-start',
                    py: { xs: 3, sm: 5 },
                    px: 2,
                }}
            >
                <Paper
                    elevation={2}
                    sx={{
                        width: '100%',
                        maxWidth: contentMaxWidth,
                        p: { xs: 3, sm: 4 },
                    }}
                >
                    {/* Registration */}
                    {phase === 'register' && (
                        <Step0Register
                            formData={formData}
                            errors={errors}
                            apiError={apiError}
                            loading={loading}
                            onChange={updateForm}
                            onSubmit={handleRegisterSubmit}
                        />
                    )}

                    {/* Email verification */}
                    {phase === 'verify' && (
                        <Step1Verify
                            email={formData.email}
                            apiError={apiError}
                            loading={loading}
                            onSubmit={handleVerifySubmit}
                            onResend={() => resendVerificationCode({ email: formData.email })}
                            onBack={() => { setPhase('register'); setApiError(''); }}
                        />
                    )}

                    {/* Wizard step 0 — Basics */}
                    {isWizard && wizardStep === 0 && (
                        <Step2Basics
                            formData={formData}
                            errors={errors}
                            onChange={updateForm}
                        />
                    )}

                    {/* Wizard step 1 — Auth */}
                    {isWizard && wizardStep === 1 && (
                        <Step3Auth
                            formData={formData}
                            errors={errors}
                            onChange={updateForm}
                            onGenerateSecret={() => updateForm({ jwtSecret: generateSecret() })}
                        />
                    )}

                    {/* Wizard step 2 — Selectors */}
                    {isWizard && wizardStep === 2 && (
                        <Step4Selectors
                            formData={formData}
                            errors={errors}
                            onChange={updateForm}
                            cmsPresets={CMS_PRESETS}
                        />
                    )}

                    {/* Wizard step 3 — Integration */}
                    {isWizard && wizardStep === 3 && (
                        <Step5Integration
                            formData={formData}
                            savedClient={savedClient}
                            saveError={saveError}
                            onGoToDashboard={handleGoToDashboard}
                        />
                    )}

                    {/* ── Wizard navigation buttons ────────────────────── */}
                    {isWizard && wizardStep < 3 && (
                        <>
                            <Divider sx={{ mt: 4, mb: 2 }} />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Button
                                    variant="outlined"
                                    onClick={handleBack}
                                >
                                    {t('setup.nav.back')}
                                </Button>
                                <Button
                                    variant="contained"
                                    onClick={handleNext}
                                    disabled={loading}
                                    startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
                                >
                                    {isLastInputStep ? t('setup.nav.finish') : t('setup.nav.next')}
                                </Button>
                            </Box>
                        </>
                    )}
                </Paper>
            </Box>

            {/* ── Footer ────────────────────────────────────────────────── */}
            <Box className="setup-wizard-footer" component="footer">
                © {new Date().getFullYear()} Quelora - Versión 1.0
            </Box>
        </Box>
    );
};

export default SetupWizard;
