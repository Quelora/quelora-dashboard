import { useState, useEffect, useCallback } from 'react';
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
    DialogContentText,
    CircularProgress,
    Snackbar, // Asumiendo que puede necesitar Snackbar
    Alert, // Asumiendo que puede necesitar Alert
} from '@mui/material';
import Slider from '@mui/material/Slider'; // NUEVO IMPORT
import { green, yellow, red } from '@mui/material/colors'; // NUEVO IMPORT
import { Visibility, VisibilityOff, Lock as LockIcon } from '@mui/icons-material';
import { moderation } from '../../api/moderation'; // Se asume que existe
import CustomTextField from '../Common/CustomTextField'; // Se asume que existe
import React from 'react';

const CommentsConfig = ({ config, setConfig, isFormSubmitted }) => {
    const { t } = useTranslation();
    const [showApiKeys, setShowApiKeys] = useState({});
    const [moderationTab, setModerationTab] = useState(0);
    const [toxicityTab, setToxicityTab] = useState(0);
    const [openTestDialog, setOpenTestDialog] = useState(false);
    const [testComment, setTestComment] = useState('');
    const [testCommentError, setTestCommentError] = useState('');
    const [openResultDialog, setOpenResultDialog] = useState(false);
    const [moderationResult, setModerationResult] = useState({isApproved: false, reason: ''});
    const [jsonError, setJsonError] = useState({moderation: false, toxicity: false});
    const [isTesting, setIsTesting] = useState(false);
    
    // NUEVO ESTADO: para el color del indicador de threshold
    const [thresholdColor, setThresholdColor] = useState(green[500]); 

    const MAX_API_KEY_LENGTH = 250;
    const MAX_PROMPT_LENGTH = 5000;
    
    // VALOR POR DEFECTO DEL THRESHOLD
    const DEFAULT_TOXICITY_THRESHOLD = 0.8; 

    const DEFAULT_CONFIGS = {
        moderation: {
            DeepSeek: {
                apiKey: '',
                enabled: false,
                provider: 'DeepSeek',
                prompt: 'Analyze the following comment: "{text}". Determine if it meets our community guidelines. Respond with "Comment Rejected" if the comment contains offensive language, discrimination, spam or inappropriate content. Otherwise, respond with "Comment Approved".',
                configJson: {
                    model: 'deepseek-chat',
                    temperature: 0.7,
                    max_tokens: 1000,
                    max_retries: 3,
                    timeout: 5000
                }
            },
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
                prompt: '', // No prompt for Confluence
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
                threshold: DEFAULT_TOXICITY_THRESHOLD, // VALOR POR DEFECTO DEL NUEVO PARÁMETRO
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

    // FUNCIÓN DE AYUDA PARA EL COLOR (NUEVA)
    const getThresholdColor = (value) => {
        if (value >= 0.8) return green[500];
        if (value >= 0.5) return yellow[700];
        return red[500];
    };

    const initializeConfig = (section, provider) => {
        const defaultConfig = DEFAULT_CONFIGS[section][provider] || {};
        setConfig(prev => ({
            ...prev,
            config: {
                ...prev.config,
                [section]: {
                    ...defaultConfig,
                    ...prev.config[section],
                    provider,
                    // Asegura que el threshold se inicialice para Perspective
                    threshold: section === 'toxicity' && provider === 'Perspective' ? 
                               (prev.config.toxicity?.threshold !== undefined ? prev.config.toxicity.threshold : defaultConfig.threshold) :
                               defaultConfig.threshold,
                    configJson: defaultConfig.configJson || {}
                }
            }
        }));
    };

    useEffect(() => {
        const moderationProvider = config.config.moderation?.provider;
        const toxicityProvider = config.config.toxicity?.provider;

        if (moderationProvider && (!config.config.moderation.configJson || Object.keys(config.config.moderation.configJson).length === 0)) {
            setConfig(prev => ({
                ...prev,
                config: {
                    ...prev.config,
                    moderation: {
                        ...prev.config.moderation,
                        configJson: DEFAULT_CONFIGS.moderation[moderationProvider]?.configJson || {}
                    }
                }
            }));
        }

        if (toxicityProvider && (!config.config.toxicity.configJson || Object.keys(config.config.toxicity.configJson).length === 0)) {
            setConfig(prev => ({
                ...prev,
                config: {
                    ...prev.config,
                    toxicity: {
                        ...prev.config.toxicity,
                        configJson: DEFAULT_CONFIGS.toxicity[toxicityProvider]?.configJson || {}
                    }
                }
            }));
        }

        const currentThreshold = config.config.toxicity?.threshold || DEFAULT_TOXICITY_THRESHOLD;
        setThresholdColor(getThresholdColor(currentThreshold));
        
    }, [config.config.moderation?.provider, config.config.toxicity?.provider, config.config.toxicity?.threshold, setConfig]);



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
                    [section]: {...prev.config[section], apiKey: value}
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
                    [section]: {...prev.config[section], prompt: value}
                }
            }));
        }
    };

    const handleConfigJsonChange = (section, value) => {
        try {
            const currentProvider = config.config[section]?.provider || Object.keys(DEFAULT_CONFIGS[section])[0];
            const parsedValue = value.trim() === '' ? 
                DEFAULT_CONFIGS[section][currentProvider]?.configJson || {} : 
                JSON.parse(value);
            
            setJsonError(prev => ({...prev, [section]: false}));
            setConfig(prev => ({
                ...prev,
                config: {
                    ...prev.config,
                    [section]: { 
                        ...prev.config[section], 
                        configJson: parsedValue 
                    }
                }
            }));
        } catch (error) {
            setJsonError(prev => ({...prev, [section]: true}));
        }
    };

    const handleProviderChange = (section, provider) => {
        initializeConfig(section, provider);
    };
    
    // HANDLER PARA EL SLIDER (NUEVO)
    const handleThresholdChange = (event, newValue) => {
        if (newValue === null) return; 
        
        setThresholdColor(getThresholdColor(newValue));

        setConfig(prev => ({
            ...prev,
            config: {
                ...prev.config,
                toxicity: {
                    ...prev.config.toxicity,
                    threshold: newValue 
                }
            }
        }));
    };


    const handleTestModeration = async () => {
        // Validación simplificada para el test
        if (!config.config.moderation?.apiKey?.trim()) {
            // Reemplazar por un toast o Swal más específico
            return; 
        }

        setOpenTestDialog(true);
    };

    const handleTestCommentSubmit = async () => {
        if (!testComment.trim()) {
            setTestCommentError(t('client.test_comment_required'));
            return;
        }

        setIsTesting(true);
        try {
            const moderationConfig = {
                ...config.config.moderation,
                provider: config.config.moderation.provider,
                apiKey: config.config.moderation.apiKey,
                prompt: config.config.moderation.prompt || DEFAULT_CONFIGS.moderation[config.config.moderation.provider].prompt,
                configJson: config.config.moderation.configJson || DEFAULT_CONFIGS.moderation[config.config.moderation.provider].configJson,
            };

            // Se asume que `config.cid` existe en el contexto superior
            const response = await moderation(config.cid, testComment, moderationConfig); 
            const {isApproved, reason = t('client.test_approved_default')} = response;

            setModerationResult({isApproved, reason});
            setOpenTestDialog(false);
            setOpenResultDialog(true);
        } catch (error) {
            console.error('Error testing moderation:', error);
            setModerationResult({
                isApproved: false,
                reason: t('client.test_moderation_error')
            });
            setOpenResultDialog(true);
        } finally {
            setIsTesting(false);
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
        setModerationResult({isApproved: false, reason: ''});
    };

    const handleModerationTabChange = (event, newValue) => {
        setModerationTab(newValue);
    };

    const handleToxicityTabChange = (event, newValue) => {
        setToxicityTab(newValue);
    };

    const stringifyConfigJson = (section) => {
        try {
            const provider = config.config[section]?.provider || Object.keys(DEFAULT_CONFIGS[section])[0];
            const jsonToDisplay = config.config[section]?.configJson || 
                DEFAULT_CONFIGS[section][provider]?.configJson || 
                {};
            return JSON.stringify(jsonToDisplay, null, 2);
        } catch {
            return '{}';
        }
    };

    // Obtener la configuración actual para un acceso más limpio
    const moderationConfig = config.config.moderation || {};
    const toxicityConfig = config.config.toxicity || {};
    const currentToxicityThreshold = toxicityConfig.threshold !== undefined ? toxicityConfig.threshold : DEFAULT_TOXICITY_THRESHOLD;

    // Lógica de validación de campos para visualización
    const isModerationApiKeyInvalid = !moderationConfig.apiKey?.trim() || moderationConfig.apiKey?.length > MAX_API_KEY_LENGTH;
    const isModerationPromptInvalid = !moderationConfig.prompt?.trim() || moderationConfig.prompt?.length > MAX_PROMPT_LENGTH;
    const isToxicityApiKeyInvalid = !toxicityConfig.apiKey?.trim() || toxicityConfig.apiKey?.length > MAX_API_KEY_LENGTH;

    return (
        <Grid container spacing={2} direction="column">
            <Grid item xs={12}>
                <Box component="fieldset" sx={{border: '1px solid #e0e0e0', borderRadius: '4px', padding: '16px', mb: 3}}>
                    <Typography component="legend" sx={{padding: '0 8px'}}>{t('client.moderation_config')}</Typography>
                    <Box className="client-config-details">
                        <Tabs 
                            value={moderationTab} 
                            onChange={handleModerationTabChange}
                            variant="fullWidth"
                            className="client-sub-tabs"
                        >
                            <Tab label={t('client.general')}/>
                            <Tab label={t('client.prompt')}/>
                            <Tab label={t('client.advanced')}/>
                        </Tabs>

                        {moderationTab === 0 && (
                            <Box sx={{mt: 2}}>
                                <FormControl fullWidth className="client-form-control">
                                    <InputLabel className="client-input-label">{t('client.provider')}</InputLabel>
                                    <Select
                                        value={moderationConfig.provider || ''}
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

                                <CustomTextField
                                    label={t('client.api_key')}
                                    fullWidth
                                    variant="outlined"
                                    value={moderationConfig.apiKey || ''}
                                    onChange={(e) => handleApiKeyChange('moderation', e.target.value)}
                                    error={isFormSubmitted && isModerationApiKeyInvalid}
                                    helperText={
                                        isFormSubmitted && isModerationApiKeyInvalid
                                            ? (!moderationConfig.apiKey?.trim()
                                                ? t('client.api_key_required')
                                                : t('client.api_key_max_length', {max: MAX_API_KEY_LENGTH}))
                                            : ''
                                    }
                                    type={showApiKeys['moderation'] ? 'text' : 'password'}
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <LockIcon sx={{fontSize: 16, color: '#5f6368'}}/>
                                                <IconButton
                                                    onClick={() => toggleShowApiKey('moderation')}
                                                    edge="end"
                                                >
                                                    {showApiKeys['moderation'] ? <VisibilityOff/> : <Visibility/>}
                                                </IconButton>
                                            </InputAdornment>
                                        )
                                    }}
                                    inputProps={{maxLength: MAX_API_KEY_LENGTH}}
                                />
                                <Typography 
                                    variant="caption" 
                                    color={moderationConfig.apiKey?.length > MAX_API_KEY_LENGTH ? 'error' : 'textSecondary'}
                                    align="right"
                                    display="block"
                                >
                                    {moderationConfig.apiKey?.length || 0}/{MAX_API_KEY_LENGTH}
                                </Typography>
                                <FormControlLabel control={
                                    <Checkbox
                                        checked={moderationConfig.enabled || false}
                                        onChange={(e) => setConfig(prev => ({
                                            ...prev,
                                            config: {
                                                ...prev.config,
                                                moderation: {...prev.config.moderation, enabled: e.target.checked}
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
                            <Box sx={{mt: 2}}>
                                <TextField
                                    label={t('client.moderation_prompt')}
                                    fullWidth
                                    variant="outlined"
                                    size="small"
                                    multiline
                                    rows={10}
                                    value={moderationConfig.prompt || DEFAULT_CONFIGS.moderation[moderationConfig.provider]?.prompt || ''}
                                    onChange={(e) => handlePromptChange('moderation', e.target.value)}
                                    error={isFormSubmitted && isModerationPromptInvalid}
                                    helperText={
                                        isFormSubmitted && isModerationPromptInvalid
                                            ? (!moderationConfig.prompt?.trim()
                                                ? t('client.moderation_prompt_required')
                                                : t('client.prompt_max_length', {max: MAX_PROMPT_LENGTH}))
                                            : t('client.moderation_prompt_instructions')
                                    }
                                    inputProps={{maxLength: MAX_PROMPT_LENGTH}}
                                />
                                <Typography 
                                    variant="caption" 
                                    color={moderationConfig.prompt?.length > MAX_PROMPT_LENGTH ? 'error' : 'textSecondary'}
                                    align="right"
                                    display="block"
                                >
                                    {moderationConfig.prompt?.length || 0}/{MAX_PROMPT_LENGTH}
                                </Typography>
                                
                                <Button 
                                    variant="outlined" 
                                    onClick={handleTestModeration}
                                    sx={{mt: 2}}
                                    disabled={!moderationConfig.enabled || isTesting}
                                >
                                    {t('client.test_moderation')}
                                </Button>
                            </Box>
                        )}

                        {moderationTab === 2 && (
                            <Box sx={{mt: 2}}>
                                <Typography variant="body2" sx={{mb: 1}}>{t('client.config_json')}</Typography>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={10}
                                    variant="outlined"
                                    value={stringifyConfigJson('moderation')}
                                    onChange={(e) => handleConfigJsonChange('moderation', e.target.value)}
                                    error={jsonError.moderation}
                                    helperText={jsonError.moderation ? t('client.invalid_json_format') : t('client.config_json_help')}
                                    sx={{
                                        '& .MuiInputBase-root': {
                                            fontFamily: 'monospace',
                                            fontSize: '0.875rem'
                                        }
                                    }}
                                />
                            </Box>
                        )}
                    </Box>
                </Box>
            </Grid>

            <Grid item xs={12}>
                <Box component="fieldset" sx={{border: '1px solid #e0e0e0', borderRadius: '4px', padding: '16px'}}>
                    <Typography component="legend" sx={{padding: '0 8px'}}>{t('client.toxicity_config')}</Typography>
                    <Box className="client-config-details">
                        <Tabs 
                            value={toxicityTab} 
                            onChange={handleToxicityTabChange}
                            variant="fullWidth"
                            className="client-sub-tabs"
                        >
                            <Tab label={t('client.general')}/>
                            <Tab label={t('client.advanced')}/>
                        </Tabs>

                        {toxicityTab === 0 && (
                            <Box sx={{mt: 2}}>
                                <FormControl fullWidth className="client-form-control">
                                    <InputLabel className="client-input-label">{t('client.provider')}</InputLabel>
                                    <Select
                                        value={toxicityConfig.provider || 'Perspective'}
                                        onChange={(e) => handleProviderChange('toxicity', e.target.value)}
                                        size="small"
                                        className="client-select"
                                    >
                                        <MenuItem value="Perspective">Perspective</MenuItem>
                                    </Select>
                                </FormControl>

                                <CustomTextField
                                    label={t('client.api_key')}
                                    fullWidth
                                    variant="outlined"
                                    value={toxicityConfig.apiKey || ''}
                                    onChange={(e) => handleApiKeyChange('toxicity', e.target.value)}
                                    error={isFormSubmitted && isToxicityApiKeyInvalid}
                                    helperText={
                                        isFormSubmitted && isToxicityApiKeyInvalid
                                            ? (!toxicityConfig.apiKey?.trim()
                                                ? t('client.api_key_required')
                                                : t('client.api_key_max_length', {max: MAX_API_KEY_LENGTH}))
                                            : ''
                                    }
                                    type={showApiKeys['toxicity'] ? 'text' : 'password'}
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <LockIcon sx={{fontSize: 16, color: '#5f6368'}}/>
                                                <IconButton
                                                    onClick={() => toggleShowApiKey('toxicity')}
                                                    edge="end"
                                                >
                                                    {showApiKeys['toxicity'] ? <VisibilityOff/> : <Visibility/>}
                                                </IconButton>
                                            </InputAdornment>
                                        )
                                    }}
                                    inputProps={{maxLength: MAX_API_KEY_LENGTH}}
                                />
                                <Typography 
                                    variant="caption" 
                                    color={toxicityConfig.apiKey?.length > MAX_API_KEY_LENGTH ? 'error' : 'textSecondary'}
                                    align="right"
                                    display="block"
                                >
                                    {toxicityConfig.apiKey?.length || 0}/{MAX_API_KEY_LENGTH}
                                </Typography>
                                
                                <FormControlLabel control={
                                    <Checkbox
                                        checked={toxicityConfig.enabled || false}
                                        onChange={(e) => setConfig(prev => ({
                                            ...prev,
                                            config: {
                                                ...prev.config,
                                                toxicity: {...prev.config.toxicity, enabled: e.target.checked}
                                            }
                                        }))}
                                        className="client-checkbox"
                                    />
                                }
                                label={<Typography>{t('client.toxicity_enabled')}</Typography>}
                                className="client-form-control-label client-config-label"
                                />

                                {/* ---------------------------------------------------- */}
                                {/* NUEVO CAMPO: SLIDER DE THRESHOLD CON INDICADOR */}
                                {/* ---------------------------------------------------- */}
                                <Box sx={{ mt: 3, px: 1 }}>
                                    <Typography gutterBottom variant="subtitle2">
                                        {t('client.toxicity_threshold')} ({currentToxicityThreshold})
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                        <Slider
                                            value={currentToxicityThreshold}
                                            onChange={handleThresholdChange}
                                            step={0.01}
                                            min={0.1}
                                            max={1.0}
                                            valueLabelDisplay="auto"
                                            marks
                                            sx={{ 
                                                mr: 2, 
                                                flexGrow: 1, 
                                                '& .MuiSlider-thumb': { 
                                                    boxShadow: 'none',
                                                    border: `2px solid ${thresholdColor}`,
                                                    '&:hover, &.Mui-focusVisible': {
                                                        boxShadow: `0 0 0 8px ${thresholdColor}40`,
                                                    }
                                                },
                                                '& .MuiSlider-track': {
                                                    backgroundColor: thresholdColor,
                                                    borderColor: thresholdColor
                                                },
                                                '& .MuiSlider-rail': {
                                                    opacity: 0.5
                                                }
                                            }}
                                        />
                                        <Box 
                                            sx={{ 
                                                width: 12, 
                                                height: 12, 
                                                borderRadius: '50%', 
                                                bgcolor: thresholdColor,
                                                ml: 1 
                                            }}
                                            title={t('client.threshold_security_indicator')}
                                        />
                                    </Box>
                                    <Typography variant="caption" color="textSecondary">
                                        {t('client.toxicity_threshold_help')}
                                    </Typography>
                                </Box>
                                {/* ---------------------------------------------------- */}
                                {/* FIN NUEVO CAMPO */}
                                {/* ---------------------------------------------------- */}

                            </Box>
                        )}

                        {toxicityTab === 1 && (
                            <Box sx={{mt: 2}}>
                                <Typography variant="body2" sx={{mb: 1}}>{t('client.config_json')}</Typography>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={10}
                                    variant="outlined"
                                    value={stringifyConfigJson('toxicity')}
                                    onChange={(e) => handleConfigJsonChange('toxicity', e.target.value)}
                                    error={jsonError.toxicity}
                                    helperText={jsonError.toxicity ? t('client.invalid_json_format') : t('client.config_json_help')}
                                    sx={{
                                        '& .MuiInputBase-root': {
                                            fontFamily: 'monospace',
                                            fontSize: '0.875rem'
                                        }
                                    }}
                                />
                            </Box>
                        )}
                    </Box>
                </Box>
            </Grid>

            {/* Diálogo de prueba de moderación (existente) */}
            <Dialog
                open={openTestDialog}
                onClose={handleTestDialogClose}
                aria-labelledby="test-moderation-dialog-title"
                maxWidth="md"
                sx={{'& .MuiDialog-paper': {width: '80%', maxWidth: 800, padding: 2}}}
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
                        variant="outlined"
                    />
                </DialogContent>
                <DialogActions>
                    <Button 
                        onClick={handleTestDialogClose} 
                        className="client-swal-cancel-button"
                        disabled={isTesting}
                    >
                        {t('client.cancel')}
                    </Button>
                    <Button 
                        onClick={handleTestCommentSubmit} 
                        variant="contained" 
                        className="client-swal-confirm-button"
                        disabled={isTesting || !testComment.trim()}
                    >
                        {isTesting ? (
                            <><CircularProgress size={24} sx={{color: 'white', mr: 1}}/>{t('client.testing')}</>
                        ) : (
                            t('client.test')
                        )}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Diálogo de resultados de moderación (existente) */}
            <Dialog
                open={openResultDialog}
                onClose={handleResultDialogClose}
                aria-labelledby="moderation-result-dialog-title"
                sx={{'& .MuiDialog-paper': {padding: 2}}}
            >
                <DialogTitle id="moderation-result-dialog-title">{t('client.test_result')}</DialogTitle>
                <DialogContent>
                    <Box sx={{textAlign: 'left'}}>
                        <Typography>
                            <strong>{t('client.comment_approved')}:</strong> {moderationResult.isApproved ? '✅ Yes' : '❌ No'}
                        </Typography>
                        <Typography sx={{mt: 1}}>
                            <strong>{t('client.moderation_response')}:</strong>
                        </Typography>
                        <Box sx={{background: '#f5f5f5', padding: 1, borderRadius: 1, mt: 1}}>
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