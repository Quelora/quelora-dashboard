// ./src/components/Client/LoginConfig.jsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Typography,
    FormControlLabel,
    Checkbox,
    Switch,
    InputAdornment,
    IconButton,
    Grid,
    Tabs,
    Tab,
    Button
} from '@mui/material';
import { Visibility, VisibilityOff, Refresh } from '@mui/icons-material';
import CustomTextField from '../Common/CustomTextField';
import React from 'react';

/**
 * Generates a 32-character random alphanumeric string to be used as a JWT secret.
 *
 * @returns {string} The randomly generated JWT secret.
 */
const generateRandomJWTSecret = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

/**
 * TabPanel component to conditionally render tab content.
 * Declared outside the main component to maintain a stable reference
 * across renders and prevent input focus loss.
 *
 * @param {Object} props - The component props.
 * @param {React.ReactNode} props.children - The content to render inside the panel.
 * @param {string} props.value - The currently active tab value.
 * @param {string} props.index - The index/value of this specific tab panel.
 * @returns {JSX.Element} The rendered TabPanel.
 */
const TabPanel = ({ children, value, index }) => {
    return (
        <div role="tabpanel" hidden={value !== index}>
            {value === index && (
                <Box sx={{p: 3}}>
                    {children}
                </Box>
            )}
        </div>
    );
};

/**
 * Configuration panel for setting up login options, SSO providers and JWT settings.
 *
 * @param {Object} props - The component props.
 * @param {Object} props.config - The current configuration state.
 * @param {Function} props.setConfig - State setter function for the configuration.
 * @param {boolean} props.isFormSubmitted - Indicates if the form has been submitted, triggering validation UI.
 * @returns {JSX.Element} The rendered LoginConfig component.
 */
const LoginConfig = ({ config, setConfig, isFormSubmitted }) => {
    const { t } = useTranslation();
    const [showSecrets, setShowSecrets] = useState({});
    const [activeTab, setActiveTab] = useState('Google');
    const MAX_API_KEY_LENGTH = 250;
    const MAX_CLIENT_ID_LENGTH = 100;
    const MAX_JWT_SECRET_LENGTH = 100;

    const providers = ['Google', 'Facebook', 'X', 'Apple', 'Quelora'];

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const handleGenerateJWTSecret = () => {
        setConfig(prev => ({
            ...prev,
            config: {
                ...prev.config,
                login: {
                    ...prev.config.login,
                    jwtSecret: generateRandomJWTSecret()
                }
            }
        }));
    };

    const handleJWTSecretChange = (value) => {
        if (value.length <= MAX_JWT_SECRET_LENGTH) {
            setConfig(prev => ({
                ...prev,
                config: {
                    ...prev.config,
                    login: {
                        ...prev.config.login,
                        jwtSecret: value
                    }
                }
            }));
        }
    };

    const handleSessionToggle = (checked) => {
        setConfig(prev => ({
            ...prev,
            config: {
                ...prev.config,
                login: {
                    ...prev.config.login,
                    queloraSession: checked
                }
            }
        }));
    };

    const handleLoginUrlChange = (value) => {
        setConfig(prev => ({
            ...prev,
            config: {
                ...prev.config,
                login: { ...prev.config.login, loginUrl: value }
            }
        }));
    };

    const handleLogoutUrlChange = (value) => {
        setConfig(prev => ({
            ...prev,
            config: {
                ...prev.config,
                login: { ...prev.config.login, logoutUrl: value }
            }
        }));
    };

    const handleRegistrationUrlChange = (value) => {
        setConfig(prev => ({
            ...prev,
            config: {
                ...prev.config,
                login: { ...prev.config.login, registrationUrl: value }
            }
        }));
    };

    const handleProviderChange = (provider, checked) => {
        setConfig(prev => {
            const prevLogin = prev.config.login || {};
            const currentProviders = prevLogin.providers || [];
            const currentDetails = prevLogin.providerDetails || {};

            if (checked) {
                return {
                    ...prev,
                    config: {
                        ...prev.config,
                        login: {
                            ...prevLogin,
                            providers: [...currentProviders, provider],
                            providerDetails: {
                                ...currentDetails,
                                [provider]: {
                                    clientId: '',
                                    clientSecret: '',
                                    ...(currentDetails[provider] || {})
                                }
                            }
                        }
                    }
                };
            } else {
                return {
                    ...prev,
                    config: {
                        ...prev.config,
                        login: {
                            ...prevLogin,
                            providers: currentProviders.filter(p => p !== provider)
                        }
                    }
                };
            }
        });
    };

    const toggleShowSecret = (field) => {
        setShowSecrets(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    const handleClientIdChange = (provider, value) => {
        if (value.length <= MAX_CLIENT_ID_LENGTH) {
            setConfig(prev => ({
                ...prev,
                config: {
                    ...prev.config,
                    login: {
                        ...prev.config.login,
                        providerDetails: {
                            ...(prev.config.login.providerDetails || {}),
                            [provider]: {
                                ...(prev.config.login.providerDetails?.[provider] || {}),
                                clientId: value
                            }
                        }
                    }
                }
            }));
        }
    };

    const handleApiKeyChange = (provider, value) => {
        if (value.length <= MAX_API_KEY_LENGTH) {
            setConfig(prev => ({
                ...prev,
                config: {
                    ...prev.config,
                    login: {
                        ...prev.config.login,
                        providerDetails: {
                            ...(prev.config.login.providerDetails || {}),
                            [provider]: {
                                ...(prev.config.login.providerDetails?.[provider] || {}),
                                clientSecret: value
                            }
                        }
                    }
                }
            }));
        }
    };

    const getProviderValue = (provider, field) => {
        return config.config.login?.providerDetails?.[provider]?.[field] || '';
    };

    const loginConfig = config.config.login || {};
    const isJwtSecretInvalid = !loginConfig.jwtSecret?.trim();
    const isBaseUrlInvalid = loginConfig.queloraSession &&
        (loginConfig.providers?.length > 0) && !loginConfig.baseUrl?.trim();

    return (
        <Box>
            <Grid container direction="column" spacing={2}>

                {/* JWT Secret — first and only required field */}
                <Grid item>
                    <CustomTextField
                        label={t('client.jwt_secret')}
                        fullWidth
                        variant="outlined"
                        value={loginConfig.jwtSecret || ''}
                        onChange={(e) => handleJWTSecretChange(e.target.value)}
                        type={showSecrets.jwtSecret ? 'text' : 'password'}
                        error={isFormSubmitted && isJwtSecretInvalid}
                        helperText={
                            isFormSubmitted && isJwtSecretInvalid
                                ? t('client.jwt_secret_required')
                                : ''
                        }
                        InputProps={{
                            endAdornment: (
                                <>
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => toggleShowSecret('jwtSecret')}
                                            edge="end"
                                        >
                                            {showSecrets.jwtSecret ? <VisibilityOff/> : <Visibility/>}
                                        </IconButton>
                                    </InputAdornment>
                                    <Button
                                        startIcon={<Refresh/>}
                                        onClick={handleGenerateJWTSecret}
                                        size="small"
                                    >
                                        {t('client.generate')}
                                    </Button>
                                </>
                            )
                        }}
                    />
                </Grid>

                {/* Quelora Session toggle */}
                <Grid item>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={!!loginConfig.queloraSession}
                                onChange={(e) => handleSessionToggle(e.target.checked)}
                            />
                        }
                        label={t('client.quelora_session')}
                    />
                </Grid>

                {/* Mode: custom URLs (queloraSession = false) */}
                {!loginConfig.queloraSession && (
                    <>
                        <Grid item>
                            <CustomTextField
                                label={t('client.login_url')}
                                fullWidth
                                variant="outlined"
                                value={loginConfig.loginUrl || ''}
                                onChange={(e) => handleLoginUrlChange(e.target.value)}
                            />
                        </Grid>
                        <Grid item>
                            <CustomTextField
                                label={t('client.logout_url')}
                                fullWidth
                                variant="outlined"
                                value={loginConfig.logoutUrl || ''}
                                onChange={(e) => handleLogoutUrlChange(e.target.value)}
                            />
                        </Grid>
                        <Grid item>
                            <CustomTextField
                                label={t('client.registration_url')}
                                fullWidth
                                variant="outlined"
                                value={loginConfig.registrationUrl || ''}
                                onChange={(e) => handleRegistrationUrlChange(e.target.value)}
                            />
                        </Grid>
                    </>
                )}

                {/* Mode: SSO providers (queloraSession = true) */}
                {loginConfig.queloraSession && (
                    <>
                        <Grid item>
                            <CustomTextField
                                label={t('client.login_base_url')}
                                fullWidth
                                variant="outlined"
                                value={loginConfig.baseUrl || ''}
                                onChange={(e) => setConfig(prev => ({
                                    ...prev,
                                    config: {
                                        ...prev.config,
                                        login: {
                                            ...prev.config.login,
                                            baseUrl: e.target.value
                                        }
                                    }
                                }))}
                                error={isFormSubmitted && isBaseUrlInvalid}
                                helperText={
                                    isFormSubmitted && isBaseUrlInvalid
                                        ? t('client.login_base_url_required')
                                        : ''
                                }
                            />
                        </Grid>

                        <Grid item>
                            <Box component="fieldset" sx={{border: '1px solid #e0e0e0', borderRadius: '4px', p: 2}}>
                                <Typography component="legend" variant="subtitle2">
                                    {t('client.auth_providers.label')}
                                </Typography>

                                <Tabs
                                    value={activeTab}
                                    onChange={handleTabChange}
                                    variant="scrollable"
                                    scrollButtons="auto"
                                    sx={{
                                        '& .MuiTab-root': {
                                            minHeight: 48,
                                            padding: '6px 12px',
                                            borderRadius: '4px',
                                            marginRight: '8px',
                                            '&.Mui-selected': {
                                                backgroundColor: 'rgba(25, 118, 210, 0.08)',
                                            }
                                        }
                                    }}
                                >
                                    {providers.map(provider => (
                                        <Tab
                                            label={provider}
                                            key={provider}
                                            value={provider}
                                            sx={{
                                                textTransform: 'none',
                                                fontWeight: activeTab === provider ? 'bold' : 'normal'
                                            }}
                                        />
                                    ))}
                                </Tabs>

                                {providers.map(provider => (
                                    <TabPanel value={activeTab} index={provider} key={provider}>
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={Array.isArray(loginConfig.providers) &&
                                                            loginConfig.providers.includes(provider)}
                                                    onChange={(e) => handleProviderChange(provider, e.target.checked)}
                                                />
                                            }
                                            label={t(`client.enable_provider`, {provider})}
                                        />

                                        {Array.isArray(loginConfig.providers) &&
                                        loginConfig.providers.includes(provider) && provider !== 'Quelora' && (
                                            <Box sx={{mt: 2}}>
                                                <CustomTextField
                                                    label={t('client.client_id')}
                                                    fullWidth
                                                    variant="outlined"
                                                    value={getProviderValue(provider, 'clientId')}
                                                    onChange={(e) => handleClientIdChange(provider, e.target.value)}
                                                    error={isFormSubmitted && !getProviderValue(provider, 'clientId')?.trim()}
                                                    helperText={
                                                        isFormSubmitted && !getProviderValue(provider, 'clientId')?.trim()
                                                            ? t('client.client_id_required')
                                                            : ''
                                                    }
                                                    sx={{mb: 2}}
                                                />

                                                <CustomTextField
                                                    label={t('client.client_secret')}
                                                    fullWidth
                                                    variant="outlined"
                                                    value={getProviderValue(provider, 'clientSecret')}
                                                    onChange={(e) => handleApiKeyChange(provider, e.target.value)}
                                                    type={showSecrets[provider] ? 'text' : 'password'}
                                                    InputProps={{
                                                        endAdornment: (
                                                            <InputAdornment position="end">
                                                                <IconButton
                                                                    onClick={() => toggleShowSecret(provider)}
                                                                    edge="end"
                                                                >
                                                                    {showSecrets[provider] ? <VisibilityOff/> : <Visibility/>}
                                                                </IconButton>
                                                            </InputAdornment>
                                                        )
                                                    }}
                                                    sx={{mb: 2}}
                                                />

                                                <Box sx={{
                                                    backgroundColor: '#f5f5f5',
                                                    borderRadius: '4px',
                                                    p: 2,
                                                    mb: 2
                                                }}>
                                                    <Typography variant="body2">
                                                        {t(`client.${provider.toLowerCase()}_instructions`, {
                                                            baseUrl: loginConfig.baseUrl
                                                        })}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        )}
                                    </TabPanel>
                                ))}
                            </Box>
                        </Grid>
                    </>
                )}

            </Grid>
        </Box>
    );
};

export default LoginConfig;
