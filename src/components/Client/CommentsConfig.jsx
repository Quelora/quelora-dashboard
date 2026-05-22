/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

// src/components/Client/CommentsConfig.jsx
import { useState, useEffect } from 'react';
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
    CircularProgress
} from '@mui/material';
import { Visibility, VisibilityOff, Lock as LockIcon } from '@mui/icons-material';
import { moderation } from '../../api/moderation';
import CustomTextField from '../Common/CustomTextField';
import React from 'react';

/**
 * CommentsConfig Component
 * Manages Content Moderation settings (LLMs) exclusively.
 * Toxicity has been extracted to its own dedicated component.
 *
 * @param {Object} props
 * @param {Object} props.config
 * @param {Function} props.setConfig
 * @param {boolean} props.isFormSubmitted
 */
const CommentsConfig = ({ config, setConfig, isFormSubmitted }) => {
    const { t } = useTranslation();
    const [showApiKeys, setShowApiKeys] = useState({});
    const [moderationTab, setModerationTab] = useState(0);
    const [openTestDialog, setOpenTestDialog] = useState(false);
    const [testComment, setTestComment] = useState('');
    const [testCommentError, setTestCommentError] = useState('');
    const [openResultDialog, setOpenResultDialog] = useState(false);
    const [moderationResult, setModerationResult] = useState({isApproved: false, reason: ''});
    const [jsonError, setJsonError] = useState(false);
    const [isTesting, setIsTesting] = useState(false);

    const MAX_API_KEY_LENGTH = 250;
    const MAX_PROMPT_LENGTH = 5000;

    const DEFAULT_CONFIGS = {
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
            prompt: '',
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
    };

    const initializeConfig = (provider) => {
        const defaultConfig = DEFAULT_CONFIGS[provider] || {};
        setConfig(prev => ({
            ...prev,
            config: {
                ...prev.config,
                moderation: {
                    ...defaultConfig,
                    ...(prev.config.moderation || {}),
                    provider,
                    configJson: defaultConfig.configJson || {}
                }
            }
        }));
    };

    useEffect(() => {
        const moderationProvider = config.config.moderation?.provider;

        if (moderationProvider && (!config.config.moderation.configJson || Object.keys(config.config.moderation.configJson).length === 0)) {
            setConfig(prev => ({
                ...prev,
                config: {
                    ...prev.config,
                    moderation: {
                        ...prev.config.moderation,
                        configJson: DEFAULT_CONFIGS[moderationProvider]?.configJson || {}
                    }
                }
            }));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [config.config.moderation?.provider, setConfig]);

    const toggleShowApiKey = () => {
        setShowApiKeys(prev => ({ ...prev, moderation: !prev.moderation }));
    };

    const handleApiKeyChange = (value) => {
        if (value.length > MAX_API_KEY_LENGTH) return;
        setConfig(prev => ({
            ...prev,
            config: {
                ...prev.config,
                moderation: { ...prev.config.moderation, apiKey: value }
            }
        }));
    };

    const handlePromptChange = (value) => {
        if (value.length <= MAX_PROMPT_LENGTH) {
            setConfig(prev => ({
                ...prev,
                config: {
                    ...prev.config,
                    moderation: { ...prev.config.moderation, prompt: value }
                }
            }));
        }
    };

    const handleConfigJsonChange = (value) => {
        try {
            const currentProvider = config.config.moderation?.provider || Object.keys(DEFAULT_CONFIGS)[0];
            const parsedValue = value.trim() === '' ? 
                DEFAULT_CONFIGS[currentProvider]?.configJson || {} : 
                JSON.parse(value);
            
            setJsonError(false);
            setConfig(prev => ({
                ...prev,
                config: {
                    ...prev.config,
                    moderation: { 
                        ...prev.config.moderation, 
                        configJson: parsedValue 
                    }
                }
            }));
        } catch (error) {
            setJsonError(true);
        }
    };

    const handleTestModeration = async () => {
        if (!config.config.moderation?.apiKey?.trim()) return; 
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
                prompt: config.config.moderation.prompt || DEFAULT_CONFIGS[config.config.moderation.provider].prompt,
                configJson: config.config.moderation.configJson || DEFAULT_CONFIGS[config.config.moderation.provider].configJson,
            };

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

    const stringifyConfigJson = () => {
        try {
            const provider = config.config.moderation?.provider || Object.keys(DEFAULT_CONFIGS)[0];
            const jsonToDisplay = config.config.moderation?.configJson || 
                DEFAULT_CONFIGS[provider]?.configJson || 
                {};
            return JSON.stringify(jsonToDisplay, null, 2);
        } catch {
            return '{}';
        }
    };

    const moderationConfig = config.config.moderation || {};
    const isModerationApiKeyInvalid = !moderationConfig.apiKey?.trim() || moderationConfig.apiKey?.length > MAX_API_KEY_LENGTH;
    const isModerationPromptInvalid = !moderationConfig.prompt?.trim() || moderationConfig.prompt?.length > MAX_PROMPT_LENGTH;

    return (
        <Grid container spacing={2} direction="column">
            <Grid item xs={12}>
                <Box component="fieldset" sx={{border: '1px solid #e0e0e0', borderRadius: '4px', padding: '16px'}}>
                    <Typography component="legend" sx={{padding: '0 8px'}}>{t('client.moderation_config')}</Typography>
                    <Box className="client-config-details">
                        <Tabs 
                            value={moderationTab} 
                            onChange={(e, val) => setModerationTab(val)}
                            variant="fullWidth"
                            className="client-sub-tabs"
                            sx={{ mb: 3 }}
                        >
                            <Tab label={t('client.general')}/>
                            <Tab label={t('client.prompt')}/>
                            <Tab label={t('client.advanced')}/>
                        </Tabs>

                        {moderationTab === 0 && (
                            <Box>
                                <FormControl fullWidth className="client-form-control" sx={{ mb: 3 }}>
                                    <InputLabel className="client-input-label">{t('client.provider')}</InputLabel>
                                    <Select
                                        value={moderationConfig.provider || ''}
                                        onChange={(e) => initializeConfig(e.target.value)}
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
                                    onChange={(e) => handleApiKeyChange(e.target.value)}
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
                                                <IconButton onClick={toggleShowApiKey} edge="end">
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
                                    sx={{ mb: 2 }}
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
                            <Box>
                                <TextField
                                    label={t('client.moderation_prompt')}
                                    fullWidth
                                    variant="outlined"
                                    size="small"
                                    multiline
                                    rows={10}
                                    value={moderationConfig.prompt || DEFAULT_CONFIGS[moderationConfig.provider]?.prompt || ''}
                                    onChange={(e) => handlePromptChange(e.target.value)}
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
                            <Box>
                                <Typography variant="body2" sx={{mb: 1}}>{t('client.config_json')}</Typography>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={10}
                                    variant="outlined"
                                    value={stringifyConfigJson()}
                                    onChange={(e) => handleConfigJsonChange(e.target.value)}
                                    error={jsonError}
                                    helperText={jsonError ? t('client.invalid_json_format') : t('client.config_json_help')}
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