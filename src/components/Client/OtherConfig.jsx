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
  Tabs,
  Tab
} from '@mui/material';
import { Visibility, VisibilityOff, Lock as LockIcon } from '@mui/icons-material';

const OtherConfig = ({ config, setConfig, isFormSubmitted }) => {
  const { t } = useTranslation();
  const [showApiKeys, setShowApiKeys] = useState({});
  const [activeTab, setActiveTab] = useState(0);

  const toggleShowApiKey = (section) => {
    setShowApiKeys(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const renderServiceConfig = (section, title, providerOptions, providerValue, requireApiKey = true) => (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>{t(title)}</Typography>
      
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>{t('client.provider')}</InputLabel>
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
        sx={{ mb: 2 }}
        error={requireApiKey && isFormSubmitted && config.config[section]?.enabled && !config.config[section]?.apiKey?.trim()}
        helperText={
          requireApiKey && isFormSubmitted && config.config[section]?.enabled && !config.config[section]?.apiKey?.trim()
            ? t('client.api_key_required')
            : ''
        }
        type={showApiKeys[section] ? 'text' : 'password'}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <LockIcon sx={{ fontSize: 16, color: 'text.secondary', mr: 1 }} />
              <IconButton
                onClick={() => toggleShowApiKey(section)}
                edge="end"
                size="small"
              >
                {showApiKeys[section] ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
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
            size="small"
          />
        }
        label={<Typography variant="body2">{t('client.enable_service')}</Typography>}
      />
    </Box>
  );

  return (
    <Box sx={{ width: '100%' }}>
      <Tabs 
        value={activeTab} 
        onChange={(_, newValue) => setActiveTab(newValue)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          mb: 3,
          '& .MuiTab-root': {
            minHeight: 48,
            padding: '6px 12px',
            borderRadius: '4px',
            marginRight: '8px',
            textTransform: 'none',
            fontWeight: (theme) => activeTab === theme ? 'bold' : 'normal',
            '&.Mui-selected': {
              backgroundColor: 'rgba(25, 118, 210, 0.08)',
            }
          }
        }}
      >
        <Tab label={t('client.translation_config')} value={0} />
        <Tab label={t('client.geolocation_config')} value={1} />
        <Tab label={t('client.language_config')} value={2} />
      </Tabs>
      
      <Box sx={{ p: 2 }}>
        {activeTab === 0 && (
          renderServiceConfig(
            'translation',
            'client.translation_config',
            [
              <MenuItem key="google" value="Google Translate">
                Google Translate
              </MenuItem>
            ],
            config.config.translation.provider
          )
        )}
        
        {activeTab === 1 && (
          renderServiceConfig(
            'geolocation',
            'client.geolocation_config',
            [
              <MenuItem key="ipapi" value="ipapi">
                ipapi (Client Side)
              </MenuItem>,
              <MenuItem key="maxmind" value="maxmind">
                MaxMind (Server Side)
              </MenuItem>
            ],
            config.config.geolocation.provider,
            false 
          )
        )}
        
        {activeTab === 2 && (
          renderServiceConfig(
            'language',
            'client.language_config',
            [
              <MenuItem key="DLA" value="Detect Language API">
                Detect Language API
              </MenuItem>
            ],
            config.config.language?.provider || ''
          )
        )}
      </Box>
    </Box>
  );
};

export default OtherConfig;