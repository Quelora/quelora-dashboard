// src/components/Auth/Login.jsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { login, verifyTwoFactor } from '../../api/auth';
import {
    TextField,
    Button,
    Typography,
    Link,
    Box
} from '@mui/material';
import embedStorage from '../../utils/embedStorage';
import { encryptJSON, generateKeyFromString } from '../../utils/crypto';

/**
 * @typedef {Object} RoleRedirectMap
 * Maps user role strings to their default post-login route.
 */
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
 * Derives a deterministic AES encryption key for the user object.
 *
 * The key is derived from the username because `user` has no `cid` of its
 * own. Using the username keeps the key stable across sessions while still
 * being unique per account.
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
 * context-appropriate storage backend (localStorage for embed windows,
 * sessionStorage for the dashboard).
 *
 * Persistence decisions:
 *  - `token`           → plain string (already opaque JWT).
 *  - `clients`         → AES-encrypted via `getEncryptedClient` (handled by auth.js).
 *  - `user`            → AES-CBC encrypted with a key derived from the username.
 *  - `tokenExpiration` → plain numeric timestamp.
 *  - `userKey`         → plain-text identifier used to re-derive the decryption
 *                        key for `user` (username, email, or _id — not a secret).
 *  - `currentCid`      → written when the user belongs to exactly one client,
 *                        so that embed windows can resolve the CID without an
 *                        explicit query-string parameter.
 *
 * @param {Object} response             - Successful auth API response.
 * @param {string} response.token       - JWT access token.
 * @param {Array}  response.clients     - Encrypted client list.
 * @param {Object} response.user        - Plain-text user profile object.
 * @param {string} [response.expiresIn] - Token lifetime in seconds (default 7200).
 * @returns {void}
 */
const persistAuthData = (response) => {
    const { token, clients, user, expiresIn } = response;

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

    const expiresInMs = (parseInt(expiresIn) || 7200) * 1000;
    embedStorage.setItem('tokenExpiration', String(Date.now() + expiresInMs));

    if (Array.isArray(clients) && clients.length === 1) {
        embedStorage.setItem('currentCid', clients[0].cid);
    }
};

/**
 * Login form component that handles both standard credential submission
 * and TOTP-based two-factor verification.
 *
 * After a successful authentication the component reads the stored redirect
 * path (preserved by PrivateRoute before bouncing to /login) and navigates
 * there, falling back to the role-based default route.
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
     * @param {Object} response - Successful auth API response.
     * @returns {void}
     */
    const handleLoginSuccess = (response) => {
        persistAuthData(response);

        const storedRedirectPath = embedStorage.getItem('redirectPath');
        embedStorage.removeItem('redirectPath');

        if (storedRedirectPath) {
            navigate(storedRedirectPath);
        } else {
            const userRole   = response.user?.role;
            const targetPath = ROLE_REDIRECTS[userRole] || '/profile';
            navigate(targetPath);
        }
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
                setError(err.message || t('login.error_2fa'));
                if (err.message?.includes('expirado')) {
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
                            inputProps={{ maxLength: 6, inputMode: 'numeric', pattern: '[0-9]*' }}
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