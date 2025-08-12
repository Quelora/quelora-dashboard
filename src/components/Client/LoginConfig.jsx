import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Box, 
  Typography, 
  TextField, 
  FormControlLabel, 
  Checkbox, 
  InputAdornment, 
  IconButton,
  Grid,
  Tabs,
  Tab,
  Button
} from '@mui/material';
import { Visibility, VisibilityOff, Refresh } from '@mui/icons-material';

const generateRandomJWTSecret = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

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

  const handleProviderChange = (provider, checked) => {
    setConfig(prev => {
      const newConfig = { ...prev };
      
      if (checked) {
        newConfig.config = {
          ...newConfig.config,
          login: {
            ...newConfig.config.login,
            providers: [...(newConfig.config.login.providers || []), provider],
            providerDetails: {
              ...(newConfig.config.login.providerDetails || {}),
              [provider]: {
                clientId: '',
                clientSecret: '',
                ...(newConfig.config.login.providerDetails?.[provider] || {})
              }
            }
          }
        };
      } else {
        newConfig.config = {
          ...newConfig.config,
          login: {
            ...newConfig.config.login,
            providers: (newConfig.config.login.providers || []).filter(p => p !== provider)
          }
        };
      }
      
      return newConfig;
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

  const getProviderValue = (provider, field) => {
    return config.config.login.providerDetails?.[provider]?.[field] || '';
  };

  const TabPanel = ({ children, value, index }) => {
    return (
      <div role="tabpanel" hidden={value !== index}>
        {value === index && (
          <Box sx={{ p: 3 }}>
            {children}
          </Box>
        )}
      </div>
    );
  };

  return (
    <Box>
      <Grid container direction="column" spacing={2}>
        {/* Base URL */}
        <Grid item xs={12}>
          <TextField
            label={t('client.login_base_url')}
            fullWidth
            variant="outlined"
            size="small"
            value={config.config.login.baseUrl || ''}
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
            error={isFormSubmitted && config.config.login.providers?.length > 0 && !config.config.login.baseUrl?.trim()}
            helperText={
              isFormSubmitted && config.config.login.providers?.length > 0 && !config.config.login.baseUrl?.trim()
                ? t('client.login_base_url_required')
                : ''
            }
          />
        </Grid>

        {/* JWT Secret */}
        <Grid item xs={12}>
          <TextField
            label={t('client.jwt_secret')}
            fullWidth
            variant="outlined"
            size="small"
            value={config.config.login.jwtSecret || ''}
            onChange={(e) => handleJWTSecretChange(e.target.value)}
            type={showSecrets.jwtSecret ? 'text' : 'password'}
            error={isFormSubmitted && !config.config.login.jwtSecret?.trim()}
            helperText={
              isFormSubmitted && !config.config.login.jwtSecret?.trim()
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
                      {showSecrets.jwtSecret ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                  <Button
                    startIcon={<Refresh />}
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

        {/* Providers Tabs */}
        <Grid item xs={12}>
          <Box component="fieldset" sx={{ border: '1px solid #e0e0e0', borderRadius: '4px', p: 2 }}>
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
                      checked={Array.isArray(config.config.login.providers) && 
                               config.config.login.providers.includes(provider)}
                      onChange={(e) => handleProviderChange(provider, e.target.checked)}
                    />
                  }
                  label={t(`client.enable_provider`, { provider })}
                />

                {Array.isArray(config.config.login.providers) && 
                 config.config.login.providers.includes(provider) && provider !== 'Quelora' && (
                  <Box sx={{ mt: 2 }}>
                    <TextField
                      label={t('client.client_id')}
                      fullWidth
                      variant="outlined"
                      size="small"
                      value={getProviderValue(provider, 'clientId')}
                      onChange={(e) => handleClientIdChange(provider, e.target.value)}
                      error={isFormSubmitted && !getProviderValue(provider, 'clientId')?.trim()}
                      helperText={
                        isFormSubmitted && !getProviderValue(provider, 'clientId')?.trim()
                          ? t('client.client_id_required')
                          : ''
                      }
                      sx={{ mb: 2 }}
                    />

                    <TextField
                      label={t('client.client_secret')}
                      fullWidth
                      variant="outlined"
                      size="small"
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
                              {showSecrets[provider] ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        )
                      }}
                      sx={{ mb: 2 }}
                    />

                    <Box sx={{ 
                      backgroundColor: '#f5f5f5',
                      borderRadius: '4px',
                      p: 2,
                      mb: 2
                    }}>
                      <Typography variant="body2">
                        {t(`client.${provider.toLowerCase()}_instructions`)}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </TabPanel>
            ))}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default LoginConfig;