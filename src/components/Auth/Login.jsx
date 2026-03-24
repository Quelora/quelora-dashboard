/**
 * @fileoverview Login form component.
 *
 * Handles both standard credential submission and TOTP-based two-factor
 * verification. After a successful authentication the component reads the
 * stored redirect path (preserved by PrivateRoute before bouncing to /login)
 * and navigates there, falling back to the role-based default route.
 *
 * @module components/Auth/Login
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { login, verifyTwoFactor, clearAuthData } from '../../api/auth';
import {
    TextField,
    Button,
    Typography,
    Link,
    Box,
} from '@mui/material';
import embedStorage from '../../utils/embedStorage';
import { encryptJSON, generateKeyFromString } from '../../utils/crypto';

/**
 * Maps each user role to its default post-login route.
 *
 * The `god` role routes to `/dashboard` where `GodClientSelector` is
 * rendered and immediately prompts the user to pick an active client.
 *
 * @type {Object.<string, string>}
 */
const ROLE_REDIRECTS = {
    god:        '/dashboard',
    admin:      '/client',
    editor:     '/posts',
    analyst:    '/dashboard',
    advertiser: '/campaigns',
    moderator:  '/reports',
    user:       '/profile',
};

/**
 * Converts a JWT `expiresIn` value into milliseconds.
 *
 * The API may return the TTL as a plain number of seconds (`7200`, `'7200'`)
 * or as a shorthand duration string (`'1h'`, `'3d'`, `'30m'`).
 *
 * The previous implementation used `parseInt(expiresIn, 10)` which silently
 * truncates unit suffixes: `parseInt('3d', 10) === 3`, producing a
 * `tokenExpiration` only 3 seconds in the future.  `isTokenValid()` in
 * `auth.js` then expired the session almost immediately after login and called
 * `clearAuthData()`, wiping the token before the first API call could fire.
 *
 * Supported suffixes: `s` · `m` · `h` · `d`.
 * Bare numeric strings are treated as seconds.
 * Unrecognised formats fall back to 2 hours.
 *
 * @param {string|number} expiresIn - Raw value from the API response.
 * @returns {number} Duration in milliseconds.
 */
const parseTtlToMs = (expiresIn) => {
    const FALLBACK_MS = 2 * 60 * 60 * 1000;

    if (!expiresIn) return FALLBACK_MS;

    const raw = String(expiresIn).trim().toLowerCase();

    const MULTIPLIERS = { s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 };
    const match = raw.match(/^(\d+(?:\.\d+)?)(s|m|h|d)$/);

    if (match) {
        const ms = parseFloat(match[1]) * MULTIPLIERS[match[2]];
        return isFinite(ms) && ms > 0 ? ms : FALLBACK_MS;
    }

    const numeric = Number(raw);
    if (!isNaN(numeric) && numeric > 0) {
        return numeric * 1_000;
    }

    return FALLBACK_MS;
};

/**
 * Derives a deterministic AES encryption key for the user object.
 *
 * @param {Object} user - The user profile object returned by the API.
 * @returns {string} Hex-encoded SHA-256 key, or empty string if derivation fails.
 */
const deriveUserKey = (user) => {
    try {
        return generateKeyFromString(user.username || user.email || user._id);
    } catch {
        return '';
    }
};

/**
 * Persists all authentication data returned by the API into the
 * context-appropriate storage backend via {@link module:utils/embedStorage}.
 *
 * Before writing new credentials, any existing auth data is explicitly
 * cleared from both storage backends via `clearAuthData`. This prevents a
 * previous session from persisting alongside the new one when a different
 * user logs in on the same browser.
 *
 * @param {Object} response             - Successful auth API response.
 * @param {string} response.token       - JWT access token.
 * @param {Array}  response.clients     - Encrypted client list.
 * @param {Object} response.user        - Plain-text user profile object.
 * @param {string} [response.expiresIn] - Token lifetime e.g. `'1h'`, `'7200'`.
 * @returns {void}
 */
const persistAuthData = (response) => {
    const { token, clients, user, expiresIn } = response;

    clearAuthData();

    embedStorage.setItem('token',   token);
    embedStorage.setItem('clients', JSON.stringify(clients));

    const userKeySource = user.username || user.email || user._id;
    const userKey       = deriveUserKey(user);

    if (userKey) {
        embedStorage.setItem('user',    encryptJSON(user, userKey));
        embedStorage.setItem('userKey', userKeySource);
    } else {
        embedStorage.setItem('user', JSON.stringify(user));
    }

    const expiresInMs = parseTtlToMs(expiresIn);
    embedStorage.setItem('tokenExpiration', String(Date.now() + expiresInMs));

    if (Array.isArray(clients) && clients.length === 1) {
        embedStorage.setItem('currentCid', clients[0].cid);
    }
};

/**
 * Login form component that handles both standard credential submission
 * and TOTP-based two-factor verification.
 *
 * @component
 * @returns {JSX.Element}
 */
const Login = () => {
    const { t }    = useTranslation();
    const navigate = useNavigate();

    const [username,  setUsername]  = useState('');
    const [password,  setPassword]  = useState('');
    const [error,     setError]     = useState('');
    const [step,      setStep]      = useState('login');
    const [totpCode,  setTotpCode]  = useState('');
    const [tempToken, setTempToken] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    /**
     * Persists auth data and navigates to the appropriate post-login route.
     *
     * Route resolution order:
     *  1. `redirectPath` stored by PrivateRoute before bouncing to /login.
     *  2. Role-based default from {@link ROLE_REDIRECTS}.
     *  3. Hard fallback to `/dashboard`.
     *
     * @param {Object} response - Successful auth API response.
     * @returns {void}
     */
    const handleLoginSuccess = (response) => {
        persistAuthData(response);

        const storedRedirectPath = embedStorage.getItem('redirectPath');
        embedStorage.removeItem('redirectPath');

        if (storedRedirectPath) {
            navigate(storedRedirectPath);
            return;
        }

        const userRole   = response.user?.role;
        const targetPath = ROLE_REDIRECTS[userRole] || '/dashboard';
        navigate(targetPath);
    };

    /**
     * Handles form submission for both the credential step and the 2FA step.
     *
     * @param {React.FormEvent<HTMLFormElement>} e - Form submit event.
     * @returns {Promise<void>}
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
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
                setError(
                    err.message === 'LOCKED_ACCOUNT'
                        ? t('login.error_locked')
                        : t('login.error')
                );
            }
        } else {
            try {
                const response = await verifyTwoFactor(totpCode, tempToken);
                handleLoginSuccess(response);
            } catch (err) {
                const message = err.message || '';
                setError(message || t('login.error_2fa'));

                if (
                    message.includes('expired') ||
                    message.includes('expirado')
                ) {
                    setStep('login');
                    setTempToken('');
                    setTotpCode('');
                }
            }
        }

        setIsLoading(false);
    };

    /**
     * Resets all 2FA state and returns the form to the credential step.
     *
     * @returns {void}
     */
    const handleBackToLogin = () => {
        setStep('login');
        setError('');
        setTotpCode('');
        setTempToken('');
        setPassword('');
    };

    return (
        <Box className='login-acrylic'>
            <Typography variant="h4" className='login-title'>
                {step === 'login' ? t('login.title') : t('login.title_2fa')}
            </Typography>

            {error && (
                <Typography className='login-error'>
                    {error}
                </Typography>
            )}

            <form onSubmit={handleSubmit} className='login-form'>
                {step === 'login' ? (
                    <>
                        <TextField
                            fullWidth
                            label={t('login.username')}
                            margin="normal"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            variant="filled"
                            className='login-input'
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
                            variant="filled"
                            className='login-input'
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
                            variant="filled"
                            className='login-input'
                            autoFocus
                            disabled={isLoading}
                            inputProps={{
                                maxLength:  6,
                                inputMode:  'numeric',
                                pattern:    '[0-9]*',
                            }}
                        />
                    </>
                )}

                <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    className='login-button'
                    disabled={isLoading}
                >
                    {isLoading
                        ? t('login.loading')
                        : step === 'login'
                            ? t('login.submit')
                            : t('login.verify')
                    }
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
        </Box>
    );
};

export default Login;