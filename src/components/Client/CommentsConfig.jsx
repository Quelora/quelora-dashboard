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
  Tab,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText
} from '@mui/material';
import { Visibility, VisibilityOff, Lock as LockIcon } from '@mui/icons-material';
import { JsonEditor } from 'json-edit-react';
import { moderation } from '../../api/moderation';

const CommentsConfig = ({ config, setConfig, isFormSubmitted }) => {
  const { t } = useTranslation();
  const [showApiKeys, setShowApiKeys] = useState({});
  const [moderationTab, setModerationTab] = useState(0);
  const [toxicityTab, setToxicityTab] = useState(0);
  const [openTestDialog, setOpenTestDialog] = useState(false);
  const [testComment, setTestComment] = useState('');
  const [testCommentError, setTestCommentError] = useState('');
  const [openResultDialog, setOpenResultDialog] = useState(false);
  const [moderationResult, setModerationResult] = useState({ isApproved: false, reason: '' });

  const MAX_API_KEY_LENGTH = 250;
  const MAX_PROMPT_LENGTH = 5000;

  // Configuraciones estándar para diferentes proveedores
  const DEFAULT_CONFIGS = {
    moderation: {
      OpenAI: {
        apiKey: '',
        enabled: false,
        provider: 'OpenAI',
        prompt: 'Analyze the following comment: "{text}." Determine if it meets our community guidelines. Respond with "Comment Rejected" if the comment contains offensive language, discrimination, spam, or inappropriate content. Otherwise, respond with "Comment Approved."',
        configJson: {
          model: 'gpt-3.5-turbo',
          temperature: 0.7,
          max_tokens: 1000,
          max_retries: 3,
          timeout: 5000
        }
      },
      Confluence: {
        apiKey: '',
        enabled: false,
        provider: 'Confluence',
        configJson: {
          strictness: 'medium',
          filters: {
            profanity: true,
            personal_attacks: true,
            sexual_content: true,
            discrimination: true
          }
        }
      }
    },
    toxicity: {
      Perspective: {
        apiKey: '',
        enabled: false,
        provider: 'Perspective',
        configJson: {
          requestedAttributes: {
            TOXICITY: {},
            SEVERE_TOXICITY: {},
            IDENTITY_ATTACK: {},
            INSULT: {},
            PROFANITY: {},
            THREAT: {}
          },
          languages: ['es', 'en']
        }
      }
    }
  };

  // Inicializar configuraciones si están vacías
  const initializeConfig = (section, provider) => {
    if (!config.config[section]?.provider || !config.config[section]?.configJson) {
      const defaultConfig = DEFAULT_CONFIGS[section][provider] || {};
      setConfig(prev => ({
        ...prev,
        config: {
          ...prev.config,
          [section]: {
            ...defaultConfig,
            // Solo mantener el prompt existente si ya tiene valor
            ...(prev.config[section]?.prompt ? { prompt: prev.config[section].prompt } : {}),
            ...prev.config[section]
          }
        }
      }));
    }
  };

  const toggleShowApiKey = (section) => {
    setShowApiKeys(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleApiKeyChange = (section, value) => {
    if (value.length <= MAX_API_KEY_LENGTH) {
      setConfig(prev => ({
        ...prev,
        config: {
          ...prev.config,
          [section]: { ...prev.config[section], apiKey: value }
        }
      }));
    }
  };

  const handlePromptChange = (section, value) => {
    if (value.length <= MAX_PROMPT_LENGTH) {
      setConfig(prev => ({
        ...prev,
        config: {
          ...prev.config,
          [section]: { ...prev.config[section], prompt: value }
        }
      }));
    }
  };

  const handleConfigJsonChange = (section, newJson) => {
    setConfig(prev => ({
      ...prev,
      config: {
        ...prev.config,
        [section]: { ...prev.config[section], configJson: newJson }
      }
    }));
  };

  const handleProviderChange = (section, provider) => {
    initializeConfig(section, provider);
    setConfig(prev => ({
      ...prev,
      config: {
        ...prev.config,
        [section]: {
          ...prev.config[section],
          provider
        }
      }
    }));
  };

  const handleTestModeration = async () => {
    setOpenTestDialog(true);
  };

  const handleTestCommentSubmit = async () => {
    if (!testComment.trim()) {
      setTestCommentError(t('client.test_comment_required'));
      return;
    }

    try {
      const response = await moderation(config.cid, testComment, config.config.moderation);
      const { isApproved, reason = 'This comment complies with our community guidelines.' } = response;

      setModerationResult({ isApproved, reason });
      setOpenTestDialog(false);
      setOpenResultDialog(true);
      setTestComment('');
      setTestCommentError('');
    } catch (error) {
      console.error('Error testing moderation:', error);
      setOpenTestDialog(false);
      setModerationResult({
        isApproved: false,
        reason: t('client.test_moderation_error')
      });
      setOpenResultDialog(true);
      setTestComment('');
      setTestCommentError('');
    }
  };

  const handleTestDialogClose = () => {
    setOpenTestDialog(false);
    setTestComment('');
    setTestCommentError('');
  };

  const handleResultDialogClose = () => {
    setOpenResultDialog(false);
    setModerationResult({ isApproved: false, reason: '' });
  };

  const handleModerationTabChange = (event, newValue) => {
    setModerationTab(newValue);
  };

  const handleToxicityTabChange = (event, newValue) => {
    setToxicityTab(newValue);
  };

  const parseConfigJson = (json, defaultConfig) => {
    try {
      return typeof json === 'string' ? JSON.parse(json) : json || defaultConfig;
    } catch {
      return defaultConfig;
    }
  };

  return (
    <Grid container spacing={2} direction="column">
      {/* Moderation Fieldset */}
      <Grid item xs={12}>
        <Box component="fieldset" sx={{ border: '1px solid #e0e0e0', borderRadius: '4px', padding: '16px', mb: 3 }}>
          <Typography component="legend" sx={{ padding: '0 8px' }}>{t('client.moderation_config')}</Typography>
          <Box className="client-config-details">
            <Tabs 
              value={moderationTab} 
              onChange={handleModerationTabChange}
              variant="fullWidth"
              className="client-sub-tabs"
            >
              <Tab label={t('client.general')} />
              <Tab label={t('client.prompt')} />
              <Tab label={t('client.advanced')} />
            </Tabs>

            {moderationTab === 0 && (
              <Box sx={{ mt: 2 }}>
                <FormControl fullWidth className="client-form-control">
                  <InputLabel className="client-input-label">{t('client.provider')}</InputLabel>
                  <Select
                    value={config.config.moderation.provider || ''}
                    onChange={(e) => handleProviderChange('moderation', e.target.value)}
                    size="small"
                    className="client-select"
                  >
                    <MenuItem value="DeepSeek">DeepSeek</MenuItem>
                    <MenuItem value="Gemini">Gemini</MenuItem>
                    <MenuItem value="Grok">Grok</MenuItem>
                    <MenuItem value="OpenAI">OpenAI</MenuItem>
                    <MenuItem value="Confluence">Confluence</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  label={t('client.api_key')}
                  fullWidth
                  variant="outlined"
                  size="small"
                  value={config.config.moderation.apiKey || ''}
                  onChange={(e) => handleApiKeyChange('moderation', e.target.value)}
                  className="client-text-field"
                  error={isFormSubmitted && (
                    !config.config.moderation.apiKey?.trim() || 
                    config.config.moderation.apiKey?.length > MAX_API_KEY_LENGTH
                  )}
                  helperText={
                    isFormSubmitted && (
                      !config.config.moderation.apiKey?.trim()
                        ? t('client.api_key_required')
                        : config.config.moderation.apiKey?.length > MAX_API_KEY_LENGTH
                          ? t('client.api_key_max_length', { max: MAX_API_KEY_LENGTH })
                          : ''
                    )
                  }
                  type={showApiKeys['moderation'] ? 'text' : 'password'}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <LockIcon sx={{ fontSize: 16, color: '#5f6368' }} />
                        <IconButton
                          onClick={() => toggleShowApiKey('moderation')}
                          edge="end"
                        >
                          {showApiKeys['moderation'] ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                  inputProps={{ maxLength: MAX_API_KEY_LENGTH }}
                />
                <Typography 
                  variant="caption" 
                  color={
                    config.config.moderation.apiKey?.length > MAX_API_KEY_LENGTH 
                      ? 'error' 
                      : 'textSecondary'
                  }
                  align="right"
                  display="block"
                >
                  {config.config.moderation.apiKey?.length || 0}/{MAX_API_KEY_LENGTH}
                </Typography>
                <FormControlLabel  control={
                      <Checkbox
                        checked={config.config.moderation.enabled}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          config: {
                            ...prev.config,
                            moderation: { ...prev.config.moderation, enabled: e.target.checked }
                          }
                        }))}
                        className="client-checkbox"
                      />
                    }
                    label={<Typography>{t('client.moderation_enabled')}</Typography>}
                    className="client-form-control-label client-config-label"
                />
              </Box>
            )}

            {moderationTab === 1 && (
              <Box sx={{ mt: 2 }}>
                <TextField
                  label={t('client.moderation_prompt')}
                  fullWidth
                  variant="outlined"
                  size="small"
                  multiline
                  rows={10}
                  value={config.config.moderation.prompt || DEFAULT_CONFIGS.moderation[config.config.moderation.provider]?.prompt || ''}
                  onChange={(e) => handlePromptChange('moderation', e.target.value)}
                  className="client-text-field"
                  error={isFormSubmitted && (
                    !config.config.moderation.prompt?.trim() || 
                    config.config.moderation.prompt?.length > MAX_PROMPT_LENGTH
                  )}
                  helperText={
                    isFormSubmitted && (
                      !config.config.moderation.prompt?.trim()
                        ? t('client.moderation_prompt_required')
                        : config.config.moderation.prompt?.length > MAX_PROMPT_LENGTH
                          ? t('client.prompt_max_length', { max: MAX_PROMPT_LENGTH })
                          : ''
                    )
                  }
                  inputProps={{ maxLength: MAX_PROMPT_LENGTH }}
                />
                <Typography 
                  variant="caption" 
                  color={
                    config.config.moderation.prompt?.length > MAX_PROMPT_LENGTH 
                      ? 'error' 
                      : 'textSecondary'
                  }
                  align="right"
                  display="block"
                >
                  {config.config.moderation.prompt?.length || 0}/{MAX_PROMPT_LENGTH}
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  {t('client.moderation_prompt_instructions')}
                </Typography>
                <Button 
                  variant="outlined" 
                  onClick={handleTestModeration}
                  sx={{ mt: 2 }}
                >
                  {t('client.test_moderation')}
                </Button>
              </Box>
            )}

            {moderationTab === 2 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>{t('client.config_json')}</Typography>
                <JsonEditor
                  data={parseConfigJson(config.config.moderation.configJson, DEFAULT_CONFIGS.moderation[config.config.moderation.provider]?.configJson || {})}
                  onChange={(newJson) => handleConfigJsonChange('moderation', newJson)}
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
        </Box>
      </Grid>

      {/* Toxicity Fieldset */}
      <Grid item xs={12}>
        <Box component="fieldset" sx={{ border: '1px solid #e0e0e0', borderRadius: '4px', padding: '16px' }}>
          <Typography component="legend" sx={{ padding: '0 8px' }}>{t('client.toxicity_config')}</Typography>
          <Box className="client-config-details">
            <Tabs 
              value={toxicityTab} 
              onChange={handleToxicityTabChange}
              variant="fullWidth"
              className="client-sub-tabs"
            >
              <Tab label={t('client.general')} />
              <Tab label={t('client.advanced')} />
            </Tabs>

            {toxicityTab === 0 && (
              <Box sx={{ mt: 2 }}>
                <FormControl fullWidth className="client-form-control">
                  <InputLabel className="client-input-label">{t('client.provider')}</InputLabel>
                  <Select
                    value={config.config.toxicity.provider || 'Perspective'}
                    onChange={(e) => handleProviderChange('toxicity', e.target.value)}
                    size="small"
                    className="client-select"
                  >
                    <MenuItem value="Perspective">Perspective</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  label={t('client.api_key')}
                  fullWidth
                  variant="outlined"
                  size="small"
                  value={config.config.toxicity.apiKey || ''}
                  onChange={(e) => handleApiKeyChange('toxicity', e.target.value)}
                  className="client-text-field"
                  error={isFormSubmitted && (
                    !config.config.toxicity.apiKey?.trim() || 
                    config.config.toxicity.apiKey?.length > MAX_API_KEY_LENGTH
                  )}
                  helperText={
                    isFormSubmitted && (
                      !config.config.toxicity.apiKey?.trim()
                        ? t('client.api_key_required')
                        : config.config.toxicity.apiKey?.length > MAX_API_KEY_LENGTH
                          ? t('client.api_key_max_length', { max: MAX_API_KEY_LENGTH })
                          : ''
                    )
                  }
                  type={showApiKeys['toxicity'] ? 'text' : 'password'}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <LockIcon sx={{ fontSize: 16, color: '#5f6368' }} />
                        <IconButton
                          onClick={() => toggleShowApiKey('toxicity')}
                          edge="end"
                        >
                          {showApiKeys['toxicity'] ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                  inputProps={{ maxLength: MAX_API_KEY_LENGTH }}
                />
                <Typography 
                  variant="caption" 
                  color={
                    config.config.toxicity.apiKey?.length > MAX_API_KEY_LENGTH 
                      ? 'error' 
                      : 'textSecondary'
                  }
                  align="right"
                  display="block"
                >
                  {config.config.toxicity.apiKey?.length || 0}/{MAX_API_KEY_LENGTH}
                </Typography>
                <FormControlLabel control={
                    <Checkbox
                      checked={config.config.toxicity.enabled}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        config: {
                          ...prev.config,
                          toxicity: { ...prev.config.toxicity, enabled: e.target.checked }
                        }
                      }))}
                      className="client-checkbox"
                    />
                  }
                  label={<Typography>{t('client.toxicity_enabled')}</Typography>}
                  className="client-form-control-label client-config-label"
                />
              </Box>
            )}

            {toxicityTab === 1 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>{t('client.config_json')}</Typography>
                <JsonEditor
                  data={parseConfigJson(config.config.toxicity.configJson, DEFAULT_CONFIGS.toxicity.Perspective.configJson)}
                  onChange={(newJson) => handleConfigJsonChange('toxicity', newJson)}
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
        </Box>
      </Grid>

      {/* Test Comment Dialog */}
      <Dialog
        open={openTestDialog}
        onClose={handleTestDialogClose}
        aria-labelledby="test-moderation-dialog-title"
        maxWidth="md"
        sx={{ '& .MuiDialog-paper': { width: '80%', maxWidth: 800, padding: 2 } }}
      >
        <DialogTitle id="test-moderation-dialog-title">{t('client.test_moderation')}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t('client.test_comment_input')}</DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label={t('client.test_comment_input')}
            placeholder={t('client.test_comment_placeholder')}
            fullWidth
            multiline
            rows={10}
            value={testComment}
            onChange={(e) => {
              setTestComment(e.target.value);
              setTestCommentError('');
            }}
            error={!!testCommentError}
            helperText={testCommentError}
            className="client-text-field"
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleTestDialogClose} className="client-swal-cancel-button">
            {t('client.cancel')}
          </Button>
          <Button onClick={handleTestCommentSubmit} variant="contained" className="client-swal-confirm-button">
            {t('client.test')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Result Dialog */}
      <Dialog
        open={openResultDialog}
        onClose={handleResultDialogClose}
        aria-labelledby="moderation-result-dialog-title"
        sx={{ '& .MuiDialog-paper': { padding: 2 } }}
      >
        <DialogTitle id="moderation-result-dialog-title">{t('client.test_result')}</DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'left' }}>
            <Typography>
              <strong>{t('client.comment_approved')}:</strong> {moderationResult.isApproved ? '✅ Yes' : '❌ No'}
            </Typography>
            <Typography sx={{ mt: 1 }}>
              <strong>{t('client.moderation_response')}:</strong>
            </Typography>
            <Box sx={{ background: '#f5f5f5', padding: 1, borderRadius: 1, mt: 1 }}>
              <Typography>{moderationResult.reason}</Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleResultDialogClose} variant="contained" className="client-swal-confirm-button">
            {t('client.close')}
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
};

export default CommentsConfig;