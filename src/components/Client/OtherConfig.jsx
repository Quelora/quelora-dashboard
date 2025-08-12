// ./src/components/Client/OtherConfig.jsx
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
  Typography,
  Grid,
  Tabs,
  Tab
} from '@mui/material';
import { Visibility, VisibilityOff, Lock as LockIcon } from '@mui/icons-material';
import { JsonEditor } from 'json-edit-react';

const OtherConfig = ({ config, setConfig, isFormSubmitted }) => {
  const { t } = useTranslation();
  const [showApiKeys, setShowApiKeys] = useState({});
  const [tabValues, setTabValues] = useState({
    translation: 0,
    geolocation: 0,
    language: 0
  });

  const toggleShowApiKey = (section) => {
    setShowApiKeys(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleTabChange = (section, newValue) => {
    setTabValues(prev => ({
      ...prev,
      [section]: newValue
    }));
  };

  const renderServiceConfig = (section, label, providerOptions, providerValue) => (
    <Box component="fieldset" sx={{ border: '1px solid #e0e0e0', borderRadius: '4px', padding: '16px', mb: 2 }}>
      <legend>{t(label)}</legend>
      <Tabs 
        value={tabValues[section]} 
        onChange={(_, newValue) => handleTabChange(section, newValue)}
        sx={{ mb: 2 }}
      >
        <Tab label={t('client.general')} />
        <Tab label={t('client.advanced')} />
      </Tabs>
      
      {tabValues[section] === 0 && (
        <Box className="client-config-details">
          <FormControl fullWidth className="client-form-control">
            <InputLabel className="client-input-label">{t('client.provider')}</InputLabel>
            <Select
              value={providerValue}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                config: {
                  ...prev.config,
                  [section]: { ...prev.config[section], provider: e.target.value }
                }
              }))}
              size="small"
              className="client-select"
            >
              {providerOptions}
            </Select>
          </FormControl>
          <TextField
            label={t('client.api_key')}
            fullWidth
            variant="outlined"
            size="small"
            value={config.config[section]?.apiKey || ''}
            onChange={(e) => setConfig(prev => ({
              ...prev,
              config: {
                ...prev.config,
                [section]: { ...prev.config[section], apiKey: e.target.value }
              }
            }))}
            className="client-text-field"
            error={isFormSubmitted && !config.config[section]?.apiKey?.trim()}
            helperText={
              isFormSubmitted && !config.config[section]?.apiKey?.trim()
                ? t('client.api_key_required')
                : ''
            }
            type={showApiKeys[section] ? 'text' : 'password'}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <LockIcon sx={{ fontSize: 16, color: '#5f6368' }} />
                  <IconButton
                    onClick={() => toggleShowApiKey(section)}
                    edge="end"
                  >
                    {showApiKeys[section] ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={config.config[section]?.enabled || false}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  config: {
                    ...prev.config,
                    [section]: { ...prev.config[section], enabled: e.target.checked }
                  }
                }))}
                className="client-checkbox"
              />
            }
            label={<Typography>{t('client.enable_service')}</Typography>}
            className="client-form-control-label"
          />
        </Box>
      )}
      
      {tabValues[section] === 1 && (
        <Box className="client-config-details" sx={{ mt: 2 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>{t('client.config_json')}</Typography>
          <JsonEditor
            data={config.config[section]?.configJson || {}}
            onChange={({ newData }) => setConfig(prev => ({
              ...prev,
              config: {
                ...prev.config,
                [section]: { ...prev.config[section], configJson: newData }
              }
            }))}
            restrictEdit={false}
            restrictAdd={false}
            restrictDelete={false}
            rootFontSize="14px"
            style={{ minHeight: '300px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
          <Typography variant="caption" color="textSecondary" sx={{ mt: 1 }}>
            {t('client.config_json_help')}
          </Typography>
        </Box>
      )}
    </Box>
  );

  return (
    <Grid container spacing={2} direction="column">
      <Grid item xs={12}>
        {renderServiceConfig(
          'translation',
          'client.translation_config',
          [<MenuItem key="google" value="Google Translate">Google Translate</MenuItem>],
          config.config.translation.provider
        )}
        {renderServiceConfig(
          'geolocation',
          'client.geolocation_config',
          [<MenuItem key="ipapi" value="ipapi">ipapi</MenuItem>],
          config.config.geolocation.provider
        )}
        {renderServiceConfig(
          'language',
          'client.language_config',
          [<MenuItem key="DLA" value="Detect Language API">Detect Language API</MenuItem>],
          config.config.language?.provider || ''
        )}
      </Grid>
    </Grid>
  );
};

export default OtherConfig;