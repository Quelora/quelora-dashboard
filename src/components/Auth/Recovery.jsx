/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import { requestRecovery, verifyRecovery, resetPassword, fetchCaptcha } from '../../api/auth';
import {
    TextField,
    Button,
    Typography,
    Link,
    Box,
    Alert,
    Divider,
    IconButton,
    Tooltip,
    CircularProgress,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

/**
 * Three-step password recovery form.
 *
 * Step 1 — `request`: user enters username/email + captcha → server sends OTP.
 * Step 2 — `verify`:  user enters the 6-digit OTP → server returns reset token.
 * Step 3 — `reset`:   user sets a new password → redirect prompt to /login.
 *
 * @component
 * @returns {JSX.Element}
 */
const Recovery = () => {
    const { t } = useTranslation();

    const [step,          setStep]          = useState('request');
    const [username,      setUsername]      = useState('');
    const [code,          setCode]          = useState('');
    const [resetToken,    setResetToken]    = useState('');
    const [password,      setPassword]      = useState('');
    const [confirm,       setConfirm]       = useState('');
    const [isLoading,     setIsLoading]     = useState(false);
    const [error,         setError]         = useState('');
    const [errorType,     setErrorType]     = useState('');
    const [done,          setDone]          = useState(false);
    const [captchaSvg,    setCaptchaSvg]    = useState('');
    const [captchaToken,  setCaptchaToken]  = useState('');
    const [captchaAnswer, setCaptchaAnswer] = useState('');
    const [captchaLoading,setCaptchaLoading]= useState(false);

    const loadCaptcha = useCallback(async () => {
        setCaptchaLoading(true);
        setCaptchaAnswer('');
        try {
            const { token, svg } = await fetchCaptcha();
            setCaptchaToken(token);
            setCaptchaSvg(svg);
        } catch {
            setError(t('login.error_service'));
            setErrorType('service');
        } finally {
            setCaptchaLoading(false);
        }
    }, [t]);

    useEffect(() => {
        loadCaptcha();
    }, [loadCaptcha]);

    /**
     * @param {React.FormEvent} e
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setErrorType('');
        setIsLoading(true);

        try {
            if (step === 'request') {
                await requestRecovery(username, captchaToken, captchaAnswer);
                setStep('verify');
            } else if (step === 'verify') {
                const token = await verifyRecovery(username, code);
                setResetToken(token);
                setStep('reset');
            } else {
                if (password !== confirm) {
                    setError(t('login.recovery_error_mismatch'));
                    setErrorType('credentials');
                    setIsLoading(false);
                    return;
                }
                await resetPassword(resetToken, password);
                setDone(true);
            }
        } catch (err) {
            if (err.message === 'SERVICE_UNAVAILABLE') {
                setError(t('login.error_service'));
                setErrorType('service');
            } else if (err.message === 'INVALID_CAPTCHA') {
                setError(t('login.recovery_error_captcha'));
                setErrorType('credentials');
                loadCaptcha();
            } else if (err.message === 'TOO_MANY_ATTEMPTS') {
                setError(t('login.recovery_error_too_many'));
                setErrorType('credentials');
            } else if (err.message === 'INVALID_CODE') {
                setError(t('login.recovery_error_invalid_code'));
                setErrorType('credentials');
            } else if (err.message === 'EXPIRED_TOKEN') {
                setError(t('login.recovery_error_expired_token'));
                setErrorType('credentials');
                setStep('request');
                setCode('');
                setResetToken('');
                loadCaptcha();
            } else if (err.message === 'WEAK_PASSWORD') {
                setError(t('login.recovery_error_weak_password'));
                setErrorType('credentials');
            } else {
                setError(t('login.recovery_error_generic'));
                setErrorType('credentials');
            }
        }

        setIsLoading(false);
    };

    if (done) {
        return (
            <Box>
                <Typography variant="h5" fontWeight={700} gutterBottom>
                    {t('login.recovery_title')}
                </Typography>
                <Alert severity="success" sx={{ mb: 2 }}>
                    {t('login.recovery_success')}
                </Alert>
                <Link component={RouterLink} to="/login" variant="body2" underline="hover">
                    {t('login.recovery_back_to_login')}
                </Link>
            </Box>
        );
    }

    const stepTitles = {
        request: t('login.recovery_title'),
        verify:  t('login.recovery_step_verify_title'),
        reset:   t('login.recovery_step_reset_title'),
    };

    return (
        <Box>
            <Typography variant="h5" fontWeight={700} gutterBottom>
                {stepTitles[step]}
            </Typography>

            {error && (
                <Alert severity={errorType === 'service' ? 'info' : 'error'} sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {step === 'request' && !error && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    {t('login.recovery_instructions')}
                </Alert>
            )}

            <form onSubmit={handleSubmit}>
                {step === 'request' && (
                    <>
                        <TextField
                            fullWidth
                            label={t('login.recovery_username_label')}
                            margin="normal"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            disabled={isLoading}
                            autoFocus
                        />

                        {/* Captcha */}
                        <Box sx={{ mt: 2, mb: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Box
                                    sx={{
                                        flex: 1,
                                        height: 56,
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        borderRadius: 1,
                                        overflow: 'hidden',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        bgcolor: 'background.default',
                                        opacity: captchaLoading ? 0.4 : 1,
                                        transition: 'opacity 0.2s',
                                        '& svg': {
                                            display: 'block',
                                            width: '100%',
                                            height: '100%',
                                        },
                                    }}
                                    dangerouslySetInnerHTML={{ __html: captchaSvg }}
                                />
                                <Tooltip title={t('login.recovery_captcha_refresh')}>
                                    <span>
                                        <IconButton
                                            onClick={loadCaptcha}
                                            disabled={captchaLoading || isLoading}
                                            size="small"
                                        >
                                            {captchaLoading
                                                ? <CircularProgress size={16} />
                                                : <RefreshIcon fontSize="small" />}
                                        </IconButton>
                                    </span>
                                </Tooltip>
                            </Box>
                            <TextField
                                fullWidth
                                label={t('login.recovery_captcha_label')}
                                value={captchaAnswer}
                                onChange={(e) => setCaptchaAnswer(e.target.value)}
                                required
                                disabled={isLoading || captchaLoading}
                                inputProps={{ maxLength: 8, autoComplete: 'off', spellCheck: false }}
                            />
                        </Box>
                    </>
                )}

                {step === 'verify' && (
                    <>
                        <Alert severity="success" sx={{ mb: 2 }}>
                            {t('login.recovery_code_sent')}
                        </Alert>
                        <TextField
                            fullWidth
                            label={t('login.recovery_code_label')}
                            margin="normal"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            required
                            autoFocus
                            disabled={isLoading}
                            inputProps={{ maxLength: 6, inputMode: 'numeric', pattern: '[0-9]*' }}
                        />
                    </>
                )}

                {step === 'reset' && (
                    <>
                        <TextField
                            fullWidth
                            label={t('login.recovery_new_password')}
                            type="password"
                            margin="normal"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoFocus
                            disabled={isLoading}
                        />
                        <TextField
                            fullWidth
                            label={t('login.recovery_confirm_password')}
                            type="password"
                            margin="normal"
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            required
                            disabled={isLoading}
                        />
                    </>
                )}

                <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    size="large"
                    sx={{ mt: 2 }}
                    disabled={isLoading || (step === 'request' && (captchaLoading || !captchaSvg))}
                    startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : null}
                >
                    {isLoading ? t('login.loading') : t(`login.recovery_submit_${step}`)}
                </Button>
            </form>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                <Link component={RouterLink} to="/login" variant="body2" underline="hover" color="text.secondary">
                    {t('login.recovery_back_to_login')}
                </Link>
                {step === 'verify' && (
                    <Link
                        component="button"
                        type="button"
                        variant="body2"
                        underline="hover"
                        onClick={() => { setStep('request'); setCode(''); setError(''); loadCaptcha(); }}
                    >
                        {t('login.recovery_resend_code')}
                    </Link>
                )}
            </Box>
        </Box>
    );
};

export default Recovery;
