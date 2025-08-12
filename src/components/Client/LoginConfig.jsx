// ./src/components/Client/LoginConfig.jsx
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
  Grid
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

const LoginConfig = ({ config, setConfig, isFormSubmitted }) => {
  const { t } = useTranslation();
  const [showSecrets, setShowSecrets] = useState({});
  const MAX_API_KEY_LENGTH = 250;
  const MAX_CLIENT_ID_LENGTH = 100;

  const handleProviderChange = (provider, checked) => {
    setConfig(prev => {
      const newConfig = { ...prev };
      
      if (checked) {
        // Si se activa el provider, asegurarnos de que existe la estructura
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
        // Si se desactiva el provider, quitarlo de la lista
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

  const toggleShowSecret = (provider) => {
    setShowSecrets(prev => ({
      ...prev,
      [provider]: !prev[provider]
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

  // Función para obtener valores seguros
  const getProviderValue = (provider, field) => {
    return config.config.login.providerDetails?.[provider]?.[field] || '';
  };

  return (
    <Box>
      <Grid container direction="column" spacing={2}>
        {/* Base URL - 100% width */}
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
            className="client-text-field"
            error={isFormSubmitted && config.config.login.providers?.length > 0 && (!config.config.login.baseUrl || !config.config.login.baseUrl.trim())}
            helperText={
              isFormSubmitted && config.config.login.providers?.length > 0 && (!config.config.login.baseUrl || !config.config.login.baseUrl.trim())
                ? t('client.login_base_url_required')
                : ''
            }
          />
        </Grid>
        {/* Authentication Providers - Fieldset */}
        <Grid item xs={12}>
          <Box component="fieldset" sx={{ border: '1px solid #e0e0e0', borderRadius: '4px', padding: '16px' }}>
            <Typography component="legend" variant="subtitle2" className="client-section-label">
              {t('client.auth_providers.label')}
            </Typography>
            <Grid container spacing={2} direction="column">
              {['Google', 'Facebook', 'X', 'Apple', 'Quelora'].map(provider => (
                <Grid item xs={12} key={provider}>
                  <Box className="client-provider-section">
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={Array.isArray(config.config.login.providers) && config.config.login.providers.includes(provider)}
                          onChange={(e) => handleProviderChange(provider, e.target.checked)}
                          className="client-checkbox"
                        />
                      }
                      label={<Typography>{provider}</Typography>}
                      className="client-form-control-label"
                    />
                    {Array.isArray(config.config.login.providers) && config.config.login.providers.includes(provider) && provider !== 'Quelora' && (
                      <Box className="client-provider-details">
                        <TextField
                          label={t('client.client_id')}
                          fullWidth
                          variant="outlined"
                          size="small"
                          value={getProviderValue(provider, 'clientId')}
                          onChange={(e) => handleClientIdChange(provider, e.target.value)}
                          className="client-text-field"
                          error={isFormSubmitted && (
                            !getProviderValue(provider, 'clientId')?.trim() || 
                            getProviderValue(provider, 'clientId')?.length > MAX_CLIENT_ID_LENGTH
                          )}
                          helperText={
                            isFormSubmitted && (
                              !getProviderValue(provider, 'clientId')?.trim()
                                ? t('client.client_id_required')
                                : getProviderValue(provider, 'clientId')?.length > MAX_CLIENT_ID_LENGTH
                                  ? t('client.client_id_max_length', { max: MAX_CLIENT_ID_LENGTH })
                                  : ''
                            )
                          }
                          inputProps={{
                            maxLength: MAX_CLIENT_ID_LENGTH
                          }}
                        />
                        <Typography 
                          variant="caption" 
                          color={
                            getProviderValue(provider, 'clientId')?.length > MAX_CLIENT_ID_LENGTH 
                              ? 'error' 
                              : 'textSecondary'
                          }
                          align="right"
                          display="block"
                        >
                          {getProviderValue(provider, 'clientId')?.length || 0}/{MAX_CLIENT_ID_LENGTH}
                        </Typography>

                        <TextField
                          label={t('client.client_secret')}
                          fullWidth
                          variant="outlined"
                          size="small"
                          value={getProviderValue(provider, 'clientSecret')}
                          onChange={(e) => handleApiKeyChange(provider, e.target.value)}
                          className="client-text-field"
                          error={isFormSubmitted && (
                            !getProviderValue(provider, 'clientSecret')?.trim() || 
                            getProviderValue(provider, 'clientSecret')?.length > MAX_API_KEY_LENGTH
                          )}
                          helperText={
                            isFormSubmitted && (
                              !getProviderValue(provider, 'clientSecret')?.trim()
                                ? t('client.client_secret_required')
                                : getProviderValue(provider, 'clientSecret')?.length > MAX_API_KEY_LENGTH
                                  ? t('client.api_key_max_length', { max: MAX_API_KEY_LENGTH })
                                  : ''
                            )
                          }
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
                          inputProps={{
                            maxLength: MAX_API_KEY_LENGTH
                          }}
                        />
                        <Typography 
                          variant="caption" 
                          color={
                            getProviderValue(provider, 'clientSecret')?.length > MAX_API_KEY_LENGTH 
                              ? 'error' 
                              : 'textSecondary'
                          }
                          align="right"
                          display="block"
                        >
                          {getProviderValue(provider, 'clientSecret')?.length || 0}/{MAX_API_KEY_LENGTH}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default LoginConfig;