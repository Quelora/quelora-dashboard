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

const ROLE_REDIRECTS = {
    god_mode: '/client',
    admin: '/client',
    editor: '/posts',
    analyst: '/dashboard',
    advertiser: '/campaigns',
    moderator: '/reports',
    user: '/profile',
};

const Login = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    
    const [step, setStep] = useState('login');
    const [totpCode, setTotpCode] = useState('');
    const [tempToken, setTempToken] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLoginSuccess = (response) => {
        sessionStorage.setItem('token', response.token);
        sessionStorage.setItem('clients', JSON.stringify(response.clients));
        sessionStorage.setItem('user', JSON.stringify(response.user));
        
        const expiresInMs = (parseInt(response.expiresIn) || 7200) * 1000;
        sessionStorage.setItem('tokenExpiration', Date.now() + expiresInMs);

        const storedRedirectPath = sessionStorage.getItem('redirectPath');
        sessionStorage.removeItem('redirectPath');

        if (storedRedirectPath) {
            navigate(storedRedirectPath);
        } else {
            const userRole = response.user?.role; 
            const targetPath = ROLE_REDIRECTS[userRole] || '/profile';
            navigate(targetPath);
        }
    };

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
                if (err.message === "LOCKED_ACCOUNT") {
                    setError(t('login.error_locked'));
                } else {
                    setError(t('login.error'));
                }
            }
        } else {
            try {
                const response = await verifyTwoFactor(totpCode, tempToken);
                handleLoginSuccess(response);
            } catch (err) {
                setError(err.message || t('login.error_2fa'));
                if (err.message && err.message.includes("expirado")) {
                    setStep('login');
                    setTempToken('');
                    setTotpCode('');
                }
            }
        }
        
        setIsLoading(false);
    };

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
                    {isLoading ? t('login.loading') : (step === 'login' ? t('login.submit') : t('login.verify'))}
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