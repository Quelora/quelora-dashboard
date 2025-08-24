import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  FormControlLabel,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  IconButton,
  Typography
} from '@mui/material';
import { Visibility, VisibilityOff, Lock as LockIcon } from '@mui/icons-material';

/**
 * CaptchaConfig component for managing CAPTCHA settings
 * @param {Object} props - Component props
 * @param {Object} props.config - Current configuration object
 * @param {Function} props.setConfig - Function to update configuration
 * @param {boolean} props.isFormSubmitted - Flag indicating if form was submitted
 * @returns {JSX.Element} - Rendered component
 */
const CaptchaConfig = ({ config, setConfig, isFormSubmitted }) => {
  const { t } = useTranslation();
  const [showApiKeys, setShowApiKeys] = useState({});
  const [jsonError, setJsonError] = useState(false);

  const MAX_API_KEY_LENGTH = 250;
  const MAX_JSON_CREDENTIALS_LENGTH = 5000; // Increased to accommodate larger Google credentials

  // Default configurations for different providers
  const DEFAULT_CONFIGS = {
    turnstile: {
      siteKey: '',
      secretKey: '',
      enabled: false,
      provider: 'turnstile'
    },
    recaptcha: {
      siteKey: '',
      credentialsJson: '{}',
      enabled: false,
      provider: 'recaptcha'
    }
  };

  /**
   * Toggles API key visibility
   * @param {string} field - Field name ('siteKey', 'secretKey')
   */
  const toggleShowApiKey = (field) => {
    setShowApiKeys(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  /**
   * Handles provider changes
   * @param {string} provider - New provider value
   */
  const handleProviderChange = (provider) => {
    const defaultConfig = DEFAULT_CONFIGS[provider] || {};
    setConfig(prev => ({
      ...prev,
      config: {
        ...prev.config,
        captcha: {
          ...defaultConfig,
          ...prev.config.captcha,
          provider,
          enabled: prev.config.captcha?.enabled || false
        }
      }
    }));
  };

  /**
   * Handles API key changes with length validation
   * @param {string} field - Field name ('siteKey', 'secretKey')
   * @param {string} value - New value
   */
  const handleApiKeyChange = (field, value) => {
    if (value.length <= MAX_API_KEY_LENGTH) {
      setConfig(prev => ({
        ...prev,
        config: {
          ...prev.config,
          captcha: {
            ...prev.config.captcha,
            [field]: value
          }
        }
      }));
    }
  };

  /**
   * Handles JSON credentials changes with validation on form submission
   * @param {string} value - New JSON string value
   */
  const handleCredentialsJsonChange = (value) => {
    // Prevent deleting the minimum JSON structure
    if (value === '') {
      value = '{}';
    }
    if (value.length <= MAX_JSON_CREDENTIALS_LENGTH) {
      setConfig(prev => ({
        ...prev,
        config: {
          ...prev.config,
          captcha: {
            ...prev.config.captcha,
            credentialsJson: value
          }
        }
      }));
      // Only validate JSON when the form is submitted
      if (isFormSubmitted && value.trim() !== '{}') {
        try {
          JSON.parse(value);
          setJsonError(false);
        } catch (error) {
          setJsonError(true);
        }
      } else {
        setJsonError(false); // Reset error if not validating
      }
    }
  };

  return (
    <Box component="fieldset" sx={{ border: '1px solid #e0e0e0', borderRadius: '4px', padding: '16px' }}>
      <Typography component="legend" sx={{ padding: '0 8px' }}>{t('client.captcha_config')}</Typography>
      
      <Box className="client-config-details">
        {/* Enable CAPTCHA Checkbox */}
        <FormControlLabel
          control={
            <Checkbox
              checked={config.config.captcha?.enabled || false}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                config: {
                  ...prev.config,
                  captcha: {
                    ...prev.config.captcha,
                    enabled: e.target.checked
                  }
                }
              }))}
              className="client-checkbox"
            />
          }
          label={<Typography>{t('client.captcha_enabled')}</Typography>}
          className="client-form-control-label"
        />

        {config.config.captcha?.enabled && (
          <>
            {/* Provider Selection */}
            <FormControl fullWidth className="client-form-control" sx={{ mt: 2 }}>
              <InputLabel className="client-input-label">{t('client.provider')}</InputLabel>
              <Select
                value={config.config.captcha?.provider || ''}
                onChange={(e) => handleProviderChange(e.target.value)}
                size="small"
                className="client-select"
              >
                <MenuItem value="turnstile">Cloudflare Turnstile</MenuItem>
                <MenuItem value="recaptcha">Google reCAPTCHA v3</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ mt: 2 }}>
              {/* Site Key Field */}
              <TextField
                label={t('client.captcha_site_key')}
                fullWidth
                variant="outlined"
                size="small"
                value={config.config.captcha?.siteKey || ''}
                onChange={(e) => handleApiKeyChange('siteKey', e.target.value)}
                className="client-text-field"
                error={isFormSubmitted && (
                  !config.config.captcha?.siteKey?.trim() || 
                  config.config.captcha?.siteKey?.length > MAX_API_KEY_LENGTH
                )}
                helperText={
                  isFormSubmitted && (
                    !config.config.captcha?.siteKey?.trim()
                      ? t('client.captcha_site_key_required')
                      : config.config.captcha?.siteKey?.length > MAX_API_KEY_LENGTH
                        ? t('client.api_key_max_length', { max: MAX_API_KEY_LENGTH })
                        : ''
                  )
                }
                inputProps={{ maxLength: MAX_API_KEY_LENGTH }}
                sx={{ mb: 2 }}
              />
              <Typography 
                variant="caption" 
                color={
                  config.config.captcha?.siteKey?.length > MAX_API_KEY_LENGTH 
                    ? 'error' 
                    : 'textSecondary'
                }
                align="right"
                display="block"
                sx={{ mb: 2 }}
              >
                {config.config.captcha?.siteKey?.length || 0}/{MAX_API_KEY_LENGTH}
              </Typography>

              {/* Secret Key Field - Only for Turnstile */}
              {config.config.captcha?.provider === 'turnstile' && (
                <>
                  <TextField
                    label={t('client.captcha_secret_key')}
                    fullWidth
                    variant="outlined"
                    size="small"
                    value={config.config.captcha?.secretKey || ''}
                    onChange={(e) => handleApiKeyChange('secretKey', e.target.value)}
                    className="client-text-field"
                    error={isFormSubmitted && (
                      !config.config.captcha?.secretKey?.trim() || 
                      config.config.captcha?.secretKey?.length > MAX_API_KEY_LENGTH
                    )}
                    helperText={
                      isFormSubmitted && (
                        !config.config.captcha?.secretKey?.trim()
                          ? t('client.captcha_secret_key_required')
                          : config.config.captcha?.secretKey?.length > MAX_API_KEY_LENGTH
                            ? t('client.api_key_max_length', { max: MAX_API_KEY_LENGTH })
                            : ''
                      )
                    }
                    type={showApiKeys['secretKey'] ? 'text' : 'password'}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <LockIcon sx={{ fontSize: 16, color: '#5f6368' }} />
                          <IconButton
                            onClick={() => toggleShowApiKey('secretKey')}
                            edge="end"
                          >
                            {showApiKeys['secretKey'] ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                    inputProps={{ maxLength: MAX_API_KEY_LENGTH }}
                  />
                  <Typography 
                    variant="caption" 
                    color={
                      config.config.captcha?.secretKey?.length > MAX_API_KEY_LENGTH 
                        ? 'error' 
                        : 'textSecondary'
                    }
                    align="right"
                    display="block"
                  >
                    {config.config.captcha?.secretKey?.length || 0}/{MAX_API_KEY_LENGTH}
                  </Typography>
                </>
              )}

              {/* JSON Credentials - Only for reCAPTCHA */}
              {config.config.captcha?.provider === 'recaptcha' && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    {t('client.captcha_credentials_json')}
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={6}
                    variant="outlined"
                    value={config.config.captcha?.credentialsJson || '{}'}
                    onChange={(e) => handleCredentialsJsonChange(e.target.value)}
                    error={jsonError && isFormSubmitted}
                    helperText={(jsonError && isFormSubmitted) ? t('client.invalid_json_format') : t('client.captcha_credentials_json_help')}
                    sx={{
                      '& .MuiInputBase-root': {
                        fontFamily: 'monospace',
                        fontSize: '0.875rem'
                      }
                    }}
                    inputProps={{ maxLength: MAX_JSON_CREDENTIALS_LENGTH }}
                  />
                  <Typography 
                    variant="caption" 
                    color={
                      config.config.captcha?.credentialsJson?.length > MAX_JSON_CREDENTIALS_LENGTH 
                        ? 'error' 
                        : 'textSecondary'
                    }
                    align="right"
                    display="block"
                    sx={{ mt: 1 }}
                  >
                    {config.config.captcha?.credentialsJson?.length || 0}/{MAX_JSON_CREDENTIALS_LENGTH}
                  </Typography>
                </Box>
              )}
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
};

export default CaptchaConfig;