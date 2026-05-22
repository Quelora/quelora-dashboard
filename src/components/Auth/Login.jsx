/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { login, verifyTwoFactor } from '../../api/auth';
import embedStorage from '../../utils/embedStorage';
import {
    TextField,
    Button,
    Typography,
    Link,
    Box,
    Divider,
    Alert,
    CircularProgress,
} from '@mui/material';

/** @type {Object<string, string>} Default landing route keyed by user role. */
const ROLE_REDIRECTS = {
    god_mode:   '/client',
    admin:      '/client',
    editor:     '/posts',
    analyst:    '/dashboard',
    advertiser: '/campaigns',
    moderator:  '/reports',
    user:       '/profile',
};

/**
 * Login form component.
 *
 * Handles both the primary credentials step and the optional 2FA verification
 * step. After a successful authentication the user is redirected either to the
 * path that was stored in `sessionStorage` before the forced logout, or to
 * their role-based default route.
 *
 * Secondary actions:
 * - "Forgot password?" → `/recovery`
 * - "Create account"   → `/register`
 *
 * @component
 * @returns {JSX.Element}
 */
const Login = () => {
    const { t }    = useTranslation();
    const navigate = useNavigate();

    const [username,          setUsername]          = useState('');
    const [password,          setPassword]          = useState('');
    const [error,             setError]             = useState('');
    const [errorType,         setErrorType]         = useState('');
    const [step,              setStep]              = useState('login');
    const [totpCode,          setTotpCode]          = useState('');
    const [tempToken,         setTempToken]         = useState('');
    const [isLoading,         setIsLoading]         = useState(false);
    const [lockedUntil,       setLockedUntil]       = useState(null);
    const [countdownSecs,     setCountdownSecs]     = useState(0);
    const [remainingAttempts, setRemainingAttempts] = useState(null);

    /** Drives the live countdown when an account lock is active. */
    useEffect(() => {
        if (!lockedUntil) {
            setCountdownSecs(0);
            return;
        }
        const tick = () => {
            const secs = Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000));
            setCountdownSecs(secs);
            if (secs === 0) setLockedUntil(null);
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [lockedUntil]);

    /**
     * Formats a number of seconds as M:SS.
     *
     * @param {number} totalSeconds
     * @returns {string}
     */
    const formatCountdown = (totalSeconds) => {
        const m = Math.floor(totalSeconds / 60);
        const s = totalSeconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    /**
     * Converts a JWT `expiresIn` value (e.g. `'72h'`, `'30m'`, `7200`) to
     * milliseconds so it can be stored as an absolute expiry timestamp.
     *
     * `parseInt` alone is insufficient because JWT duration strings include a
     * unit suffix (`h`, `m`, `d`).  `parseInt('72h')` returns `72`, which
     * would set the expiry only 72 seconds in the future instead of 72 hours.
     *
     * @param {string|number} expiresIn - JWT `expiresIn` value from the API.
     * @returns {number} Duration in milliseconds.
     */
    const parseExpiresInMs = (expiresIn) => {
        if (!expiresIn) return 7200 * 1000;
        if (typeof expiresIn === 'number') return expiresIn * 1000;
        const match = String(expiresIn).match(/^(\d+)([smhd]?)$/);
        if (!match) return 7200 * 1000;
        const value = parseInt(match[1], 10);
        switch (match[2]) {
            case 'd': return value * 86400 * 1000;
            case 'h': return value * 3600  * 1000;
            case 'm': return value * 60    * 1000;
            default:  return value         * 1000; // bare number → seconds
        }
    };

    /**
     * Persists session data and navigates to the correct landing route.
     *
     * @param {Object} response          - Successful auth API response.
     * @param {string} response.token
     * @param {Array}  response.clients
     * @param {Object} response.user
     * @param {string} response.expiresIn
     */
    const handleLoginSuccess = (response) => {
        embedStorage.setItem('token',           response.token);
        embedStorage.setItem('clients',         JSON.stringify(response.clients));
        embedStorage.setItem('user',            JSON.stringify(response.user));
        embedStorage.setItem('tokenExpiration', String(Date.now() + parseExpiresInMs(response.expiresIn)));

        if (Array.isArray(response.clients) && response.clients[0]?.cid) {
            embedStorage.setItem('currentCid', response.clients[0].cid);
        }

        const storedRedirectPath = embedStorage.getItem('redirectPath');
        embedStorage.removeItem('redirectPath');

        if (storedRedirectPath) {
            navigate(storedRedirectPath);
        } else {
            const userRole  = response.user?.role;
            const targetPath = ROLE_REDIRECTS[userRole] || '/profile';
            navigate(targetPath);
        }
    };

    /**
     * Handles form submission for both the login and 2FA steps.
     *
     * @param {React.FormEvent} e
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setErrorType('');
        setRemainingAttempts(null);
        setIsLoading(true);

        if (step === 'login') {
            try {
                const response = await login(username, password);
                if (response.requires2FA) {
                    setTempToken(response.tempToken);
                    setStep('verify2FA');
                } else {
                    handleLoginSuccess(response);
                }
            } catch (err) {
                if (err.message === 'LOCKED_ACCOUNT') {
                    setErrorType('locked');
                    if (err.retryAfter) {
                        setLockedUntil(Date.now() + err.retryAfter * 1000);
                    } else {
                        setError(t('login.error_locked'));
                    }
                } else if (err.message === 'SERVICE_UNAVAILABLE') {
                    setErrorType('service');
                    setError(t('login.error_service'));
                } else {
                    setErrorType('credentials');
                    setError(t('login.error'));
                    if (err.remainingAttempts !== undefined) {
                        setRemainingAttempts(err.remainingAttempts);
                    }
                }
            }
        } else {
            try {
                const response = await verifyTwoFactor(totpCode, tempToken);
                handleLoginSuccess(response);
            } catch (err) {
                if (err.message === 'EXPIRED_2FA_SESSION') {
                    setErrorType('credentials');
                    setError(t('login.error_2fa_expired'));
                    setStep('login');
                    setTempToken('');
                    setTotpCode('');
                } else if (err.message === 'SERVICE_UNAVAILABLE') {
                    setErrorType('service');
                    setError(t('login.error_service'));
                } else {
                    setErrorType('credentials');
                    setError(t('login.error_2fa'));
                }
            }
        }

        setIsLoading(false);
    };

    /** Returns to the credentials step from 2FA, clearing ephemeral state. */
    const handleBackToLogin = () => {
        setStep('login');
        setError('');
        setErrorType('');
        setRemainingAttempts(null);
        setTotpCode('');
        setTempToken('');
        setPassword('');
    };

    return (
        <Box>
            <Typography variant="h5" fontWeight={700} gutterBottom>
                {step === 'login' ? t('login.title') : t('login.title_2fa')}
            </Typography>

            {errorType === 'locked' && lockedUntil && countdownSecs > 0 && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                    {t('login.error_locked_countdown', { time: formatCountdown(countdownSecs) })}
                </Alert>
            )}
            {errorType === 'locked' && !lockedUntil && error && (
                <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>
            )}
            {errorType === 'credentials' && error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                    {remainingAttempts !== null && (
                        <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                            {t('login.remaining_attempts', { count: remainingAttempts })}
                        </Typography>
                    )}
                </Alert>
            )}
            {errorType === 'service' && error && (
                <Alert severity="info" sx={{ mb: 2 }}>{error}</Alert>
            )}

            <form onSubmit={handleSubmit}>
                {step === 'login' ? (
                    <>
                        <TextField
                            fullWidth
                            label={t('login.username')}
                            margin="normal"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            disabled={isLoading}
                        />
                        <TextField
                            fullWidth
                            label={t('login.password')}
                            type="password"
                            margin="normal"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={isLoading}
                        />
                    </>
                ) : (
                    <>
                        <Typography variant="body2" sx={{ textAlign: 'center', mb: 2 }}>
                            {t('login.prompt_2fa')}
                        </Typography>
                        <TextField
                            fullWidth
                            label={t('login.code_2fa')}
                            margin="normal"
                            value={totpCode}
                            onChange={(e) => setTotpCode(e.target.value)}
                            required
                            autoFocus
                            disabled={isLoading}
                            inputProps={{
                                maxLength:   6,
                                inputMode:   'numeric',
                                pattern:     '[0-9]*',
                            }}
                        />
                    </>
                )}

                <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    size="large"
                    sx={{ mt: 2 }}
                    disabled={isLoading || (errorType === 'locked' && countdownSecs > 0)}
                    startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : null}
                >
                    {isLoading
                        ? t('login.loading')
                        : step === 'login'
                            ? t('login.submit')
                            : t('login.verify')}
                </Button>

                {step === 'verify2FA' && !isLoading && (
                    <Link
                        component="button"
                        type="button"
                        variant="body2"
                        onClick={handleBackToLogin}
                        sx={{ mt: 2, textAlign: 'center', display: 'block' }}
                    >
                        {t('login.back')}
                    </Link>
                )}
            </form>

            {/* Secondary actions — only shown on the primary login step */}
            {step === 'login' && (
                <>
                    <Divider sx={{ my: 2 }} />

                    <Box
                        sx={{
                            display:        'flex',
                            justifyContent: 'space-between',
                            alignItems:     'center',
                            flexWrap:       'wrap',
                            gap:            1,
                        }}
                    >
                        <Link
                            component={RouterLink}
                            to="/recovery"
                            variant="body2"
                            underline="hover"
                            color="text.secondary"
                        >
                            {t('login.forgot_password')}
                        </Link>

                        <Link
                            component={RouterLink}
                            to="/register"
                            variant="body2"
                            underline="hover"
                        >
                            {t('login.register_link')}
                        </Link>
                    </Box>
                </>
            )}
        </Box>
    );
};

export default Login;