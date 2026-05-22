/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

// src/components/Client/ToxicityConfig.jsx
import React, { useState, useEffect } from 'react';
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
    CircularProgress,
    Paper,
    LinearProgress,
    Alert,
    Link,
    Chip,
} from '@mui/material';
import Slider from '@mui/material/Slider';
import { green, yellow, red } from '@mui/material/colors';
import { Visibility, VisibilityOff, Lock as LockIcon, CheckCircle as CheckCircleIcon, Cancel as CancelIcon, HelpOutline as HelpIcon } from '@mui/icons-material';
import CustomTextField from '../Common/CustomTextField';
import { testToxicity } from '../../api/toxicity';

/**
 * @typedef {Object} ToxicityTestResult
 * @property {boolean|null} isPolite   - Server-side verdict: true if no threshold was breached.
 * @property {Object}       scores     - Normalized per-metric scores from the provider.
 */

/**
 * @typedef {Object} ProviderMeta
 * @property {string}      apiKeyUrl   - URL where the user can obtain an API key.
 * @property {string}      apiKeyHost  - Human-readable hostname for the link label.
 * @property {string}      placeholder - Default endpoint URL shown as a copyable placeholder.
 * @property {string}      i18nKey     - Translation key for the help alert body text.
 */

/**
 * Per-provider metadata driving the API-key help UI in the General tab.
 *
 * Perspective: keys are issued at the Google Cloud Console after enabling the
 * Comment Analyzer API. Detoxifi runs locally, so no external key is needed
 * but an endpoint URL must still be configured.
 *
 * @type {Record<string, ProviderMeta>}
 */
const PROVIDER_META = {
    Perspective: {
        apiKeyUrl:   'https://developers.perspectiveapi.com/s/docs-get-started',
        apiKeyHost:  'perspectiveapi.com',
        placeholder: 'https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze',
        i18nKey:     'client.toxicity_perspective_api_key_instructions',
    },
    Detoxifi: {
        apiKeyUrl:   null,
        apiKeyHost:  null,
        placeholder: 'http://quelora-ml-detoxify:8000/moderate',
        i18nKey:     'client.toxicity_detoxifi_url_instructions',
    },
};

/**
 * ToxicityConfig component.
 *
 * Manages the toxicity sub-system configuration surface inside the Advanced
 * tab of ConfigDialog.  The component is divided into three inner tabs:
 *
 * - **General**    — provider selection, API key, endpoint override.
 * - **Thresholds** — per-metric sliders + live test panel.
 * - **Advanced**   — raw JSON config editor for power users.
 *
 * ### Bug fix (isPolite verdict)
 * The previous implementation stored only `response.scores` in local state,
 * silently discarding `response.isPolite`.  The test result panel therefore
 * had no way to surface the server's final blocking decision.  This version
 * stores the complete `{ isPolite, scores }` shape and renders a dedicated
 * verdict banner above the per-metric breakdown.
 *
 * @param {Object}   props
 * @param {Object}   props.config           - Global client configuration object.
 * @param {Function} props.setConfig        - Config state setter.
 * @param {boolean}  props.isFormSubmitted  - Validation trigger flag.
 * @returns {JSX.Element}
 */
const ToxicityConfig = ({ config, setConfig, isFormSubmitted }) => {
    const { t } = useTranslation();

    const [toxicityTab,        setToxicityTab]        = useState(0);
    const [showApiKeys,        setShowApiKeys]         = useState({});
    const [jsonError,          setJsonError]           = useState(false);
    const [toxicityTestComment, setToxicityTestComment] = useState('');
    const [isTestingToxicity,  setIsTestingToxicity]  = useState(false);

    /**
     * Stores the full server response shape so both `isPolite` and `scores`
     * are available to the results panel.
     *
     * @type {[ToxicityTestResult|null, Function]}
     */
    const [toxicityTestResult, setToxicityTestResult] = useState(null);
    const [toxicityTestError,  setToxicityTestError]  = useState('');

    const MAX_API_KEY_LENGTH       = 250;
    const DEFAULT_TOXICITY_THRESHOLD = 0.8;

    const DEFAULT_CONFIGS = {
        Perspective: {
            enabled:  false,
            provider: 'Perspective',
            thresholds: {
                toxicity:        DEFAULT_TOXICITY_THRESHOLD,
                severe_toxicity: DEFAULT_TOXICITY_THRESHOLD,
                obscene:         DEFAULT_TOXICITY_THRESHOLD,
                threat:          DEFAULT_TOXICITY_THRESHOLD,
                insult:          DEFAULT_TOXICITY_THRESHOLD,
                identity_attack: DEFAULT_TOXICITY_THRESHOLD,
            },
            providerDetails: {
                Perspective: { apiKey: '', url: '' },
                Detoxifi:    { apiKey: '', url: '' },
            },
            configJson: {
                requestedAttributes: {
                    TOXICITY: {}, SEVERE_TOXICITY: {}, IDENTITY_ATTACK: {},
                    INSULT: {}, PROFANITY: {}, THREAT: {},
                },
                languages: ['es', 'en'],
            },
        },
        Detoxifi: {
            enabled:  false,
            provider: 'Detoxifi',
            thresholds: {
                toxicity:        DEFAULT_TOXICITY_THRESHOLD,
                severe_toxicity: DEFAULT_TOXICITY_THRESHOLD,
                obscene:         DEFAULT_TOXICITY_THRESHOLD,
                threat:          DEFAULT_TOXICITY_THRESHOLD,
                insult:          DEFAULT_TOXICITY_THRESHOLD,
                identity_attack: DEFAULT_TOXICITY_THRESHOLD,
            },
            providerDetails: {
                Perspective: { apiKey: '', url: '' },
                Detoxifi:    { apiKey: '', url: '' },
            },
            configJson: {},
        },
    };

    /** @type {Array<{key: string, labelKey: string, helpKey: string}>} */
    const toxicityMetrics = [
        { key: 'toxicity',        labelKey: 'client.toxicity_metric_toxicity', helpKey: 'client.toxicity_metric_toxicity_help' },
        { key: 'severe_toxicity', labelKey: 'client.toxicity_metric_severe',   helpKey: 'client.toxicity_metric_severe_help' },
        { key: 'obscene',         labelKey: 'client.toxicity_metric_obscene',  helpKey: 'client.toxicity_metric_obscene_help' },
        { key: 'threat',          labelKey: 'client.toxicity_metric_threat',   helpKey: 'client.toxicity_metric_threat_help' },
        { key: 'insult',          labelKey: 'client.toxicity_metric_insult',   helpKey: 'client.toxicity_metric_insult_help' },
        { key: 'identity_attack', labelKey: 'client.toxicity_metric_identity', helpKey: 'client.toxicity_metric_identity_help' },
    ];

    /**
     * Maps a threshold value to a traffic-light color.
     * High threshold (≥ 0.8) = permissive = green.
     * Mid threshold  (≥ 0.5) = moderate  = yellow.
     * Low threshold  (< 0.5) = strict    = red.
     *
     * @param {number} value - Threshold value in [0, 1].
     * @returns {string} A CSS color string.
     */
    const getThresholdColor = (value) => {
        if (value >= 0.8) return green[500];
        if (value >= 0.5) return yellow[700];
        return red[500];
    };

    /**
     * Re-initializes config state when the active provider is switched.
     * Preserves user-entered credentials already stored under each provider key.
     *
     * @param {string} provider - The provider name ('Perspective' | 'Detoxifi').
     */
    const handleProviderChange = (provider) => {
        const defaultConfig = DEFAULT_CONFIGS[provider] || {};
        setConfig(prev => {
            const currentSectionData = prev.config.toxicity || {};
            return {
                ...prev,
                config: {
                    ...prev.config,
                    toxicity: {
                        ...defaultConfig,
                        ...currentSectionData,
                        provider,
                        thresholds: {
                            ...defaultConfig.thresholds,
                            ...(currentSectionData.thresholds || {}),
                        },
                        providerDetails: {
                            ...defaultConfig.providerDetails,
                            ...(currentSectionData.providerDetails || {}),
                        },
                        configJson: defaultConfig.configJson || {},
                    },
                },
            };
        });
    };

    useEffect(() => {
        const toxicityProvider = config.config.toxicity?.provider;
        if (
            toxicityProvider &&
            (!config.config.toxicity.configJson ||
                Object.keys(config.config.toxicity.configJson).length === 0)
        ) {
            setConfig(prev => ({
                ...prev,
                config: {
                    ...prev.config,
                    toxicity: {
                        ...prev.config.toxicity,
                        configJson: DEFAULT_CONFIGS[toxicityProvider]?.configJson || {},
                    },
                },
            }));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [config.config.toxicity?.provider, setConfig]);

    /**
     * Toggles visibility of the API key field for the current provider.
     */
    const toggleShowApiKey = () => {
        setShowApiKeys(prev => ({ ...prev, toxicity: !prev.toxicity }));
    };

    /**
     * Handles API key input, enforcing the maximum character length.
     *
     * @param {string} value - The new API key string.
     */
    const handleApiKeyChange = (value) => {
        if (value.length > MAX_API_KEY_LENGTH) return;
        setConfig(prev => {
            const currentProvider = prev.config.toxicity?.provider || 'Perspective';
            return {
                ...prev,
                config: {
                    ...prev.config,
                    toxicity: {
                        ...prev.config.toxicity,
                        providerDetails: {
                            ...prev.config.toxicity?.providerDetails,
                            [currentProvider]: {
                                ...prev.config.toxicity?.providerDetails?.[currentProvider],
                                apiKey: value,
                            },
                        },
                    },
                },
            };
        });
    };

    /**
     * Handles custom endpoint URL overrides per provider.
     *
     * @param {string} value - The new endpoint URL string.
     */
    const handleToxicityUrlChange = (value) => {
        setConfig(prev => {
            const currentProvider = prev.config.toxicity?.provider || 'Perspective';
            return {
                ...prev,
                config: {
                    ...prev.config,
                    toxicity: {
                        ...prev.config.toxicity,
                        providerDetails: {
                            ...prev.config.toxicity?.providerDetails,
                            [currentProvider]: {
                                ...prev.config.toxicity?.providerDetails?.[currentProvider],
                                url: value,
                            },
                        },
                    },
                },
            };
        });
    };

    /**
     * Handles raw JSON edits in the Advanced tab, validating on every keystroke.
     *
     * @param {string} value - The raw JSON string from the textarea.
     */
    const handleConfigJsonChange = (value) => {
        try {
            const currentProvider = config.config.toxicity?.provider || Object.keys(DEFAULT_CONFIGS)[0];
            const parsedValue = value.trim() === ''
                ? DEFAULT_CONFIGS[currentProvider]?.configJson || {}
                : JSON.parse(value);

            setJsonError(false);
            setConfig(prev => ({
                ...prev,
                config: {
                    ...prev.config,
                    toxicity: { ...prev.config.toxicity, configJson: parsedValue },
                },
            }));
        } catch {
            setJsonError(true);
        }
    };

    /**
     * Updates a single threshold value by metric key.
     *
     * @param {string} metric   - The metric key (e.g. 'toxicity', 'insult').
     * @param {number} newValue - The new threshold in [0.1, 1.0].
     */
    const handleThresholdChange = (metric, newValue) => {
        setConfig(prev => ({
            ...prev,
            config: {
                ...prev.config,
                toxicity: {
                    ...prev.config.toxicity,
                    thresholds: {
                        ...prev.config.toxicity?.thresholds,
                        [metric]: newValue,
                    },
                },
            },
        }));
    };

    /**
     * Executes a live toxicity test against the backend using the current
     * unsaved configuration payload.
     *
     * Stores the complete `{ isPolite, scores }` response shape so the
     * results panel can render both the per-metric breakdown and the final
     * server-side blocking verdict.
     *
     * @async
     * @returns {Promise<void>}
     */
    const handleTestToxicity = async () => {
        if (!toxicityTestComment.trim()) return;

        setIsTestingToxicity(true);
        setToxicityTestError('');
        setToxicityTestResult(null);

        try {
            const cid     = config.cid || 'new_client';
            const payload = config.config.toxicity;

            const response = await testToxicity(cid, toxicityTestComment, payload, 'es');

            if (response && response.scores) {
                setToxicityTestResult({
                    isPolite: response.isPolite ?? null,
                    scores:   response.scores,
                });
            } else {
                setToxicityTestError(t('client.test_failed'));
            }
        } catch (error) {
            const errorMsg = error.message || error.error || t('client.error');
            setToxicityTestError(errorMsg);
        } finally {
            setIsTestingToxicity(false);
        }
    };

    /**
     * Safely serializes the current configJson to a pretty-printed string
     * for the Advanced tab textarea, falling back to the provider default.
     *
     * @returns {string} Formatted JSON string.
     */
    const stringifyConfigJson = () => {
        try {
            const provider      = config.config.toxicity?.provider || Object.keys(DEFAULT_CONFIGS)[0];
            const jsonToDisplay = config.config.toxicity?.configJson
                || DEFAULT_CONFIGS[provider]?.configJson
                || {};
            return JSON.stringify(jsonToDisplay, null, 2);
        } catch {
            return '{}';
        }
    };

    const toxicityConfig          = config.config.toxicity || {};
    const toxicityProvider        = toxicityConfig.provider || 'Perspective';
    const currentProviderDetails  = toxicityConfig.providerDetails?.[toxicityProvider] || { apiKey: '', url: '' };
    const toxicityThresholds      = toxicityConfig.thresholds || {};
    const providerMeta            = PROVIDER_META[toxicityProvider] || PROVIDER_META.Perspective;

    const isToxicityInvalid = !currentProviderDetails.apiKey?.trim() && !currentProviderDetails.url?.trim();

    return (
        <Box className="client-config-details">
            <Tabs
                value={toxicityTab}
                onChange={(e, val) => setToxicityTab(val)}
                variant="fullWidth"
                className="client-sub-tabs"
                sx={{ mb: 3 }}
            >
                <Tab label={t('client.general')} />
                <Tab label={t('client.toxicity_thresholds')} />
                <Tab label={t('client.advanced')} />
            </Tabs>

            {/* ── Tab 0: General ──────────────────────────────────────────── */}
            {toxicityTab === 0 && (
                <Box>
                    {/* API-key acquisition help — provider-aware */}
                    <Alert severity="info" sx={{ mb: 2 }}>
                        {t(providerMeta.i18nKey)}{' '}
                        {providerMeta.apiKeyUrl && (
                            <Link
                                href={providerMeta.apiKeyUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {providerMeta.apiKeyHost}
                            </Link>
                        )}
                    </Alert>

                    <Grid container spacing={2}>
                        <Grid item xs={12} md={4}>
                            <FormControl fullWidth className="client-form-control">
                                <InputLabel className="client-input-label">
                                    {t('client.provider')}
                                </InputLabel>
                                <Select
                                    value={toxicityProvider}
                                    onChange={(e) => handleProviderChange(e.target.value)}
                                    size="small"
                                    className="client-select"
                                >
                                    <MenuItem value="Perspective">Perspective (Google)</MenuItem>
                                    <MenuItem value="Detoxifi">Detoxifi (Local)</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md={8}>
                            {/*
                             * The placeholder doubles as a copyable default URL.
                             * When the field is empty, users can read the canonical
                             * endpoint without having to look it up externally.
                             */}
                            <CustomTextField
                                label={t('client.api_url_override')}
                                fullWidth
                                variant="outlined"
                                value={currentProviderDetails.url || ''}
                                onChange={(e) => handleToxicityUrlChange(e.target.value)}
                                placeholder={providerMeta.placeholder}
                                helperText={t('client.api_url_override_help')}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <CustomTextField
                                label={t('client.api_key')}
                                fullWidth
                                variant="outlined"
                                value={currentProviderDetails.apiKey || ''}
                                onChange={(e) => handleApiKeyChange(e.target.value)}
                                error={isFormSubmitted && isToxicityInvalid}
                                helperText={
                                    isFormSubmitted && isToxicityInvalid
                                        ? t('client.toxicity_credentials_required')
                                        : t('client.toxicity_api_key_help')
                                }
                                type={showApiKeys['toxicity'] ? 'text' : 'password'}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <LockIcon sx={{ fontSize: 16, color: '#5f6368' }} />
                                            <IconButton onClick={toggleShowApiKey} edge="end">
                                                {showApiKeys['toxicity'] ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                                inputProps={{ maxLength: MAX_API_KEY_LENGTH }}
                            />
                        </Grid>
                    </Grid>

                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={toxicityConfig.enabled || false}
                                onChange={(e) =>
                                    setConfig(prev => ({
                                        ...prev,
                                        config: {
                                            ...prev.config,
                                            toxicity: { ...prev.config.toxicity, enabled: e.target.checked },
                                        },
                                    }))
                                }
                                className="client-checkbox"
                            />
                        }
                        label={<Typography>{t('client.toxicity_enabled')}</Typography>}
                        sx={{ mt: 2 }}
                    />
                </Box>
            )}

            {/* ── Tab 1: Thresholds & Testing ─────────────────────────────── */}
            {toxicityTab === 1 && (
                <Box sx={{ mt: 1 }}>
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>

                        {/* Left column — threshold sliders */}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                                {t('client.toxicity_thresholds')}
                            </Typography>
                            <Typography variant="body2" color="textSecondary" sx={{ mb: 4 }}>
                                {t('client.toxicity_thresholds_help')}
                            </Typography>

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {toxicityMetrics.map((metric) => {
                                    const thresholdValue = toxicityThresholds[metric.key] ?? DEFAULT_TOXICITY_THRESHOLD;
                                    const thresholdColor = getThresholdColor(thresholdValue);

                                    return (
                                        <Box key={metric.key}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                    {t(metric.labelKey)} ({thresholdValue.toFixed(2)})
                                                </Typography>
                                            </Box>
                                            <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 1, lineHeight: 1.3 }}>
                                                {t(metric.helpKey)}
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <Slider
                                                    value={thresholdValue}
                                                    onChange={(e, val) => handleThresholdChange(metric.key, val)}
                                                    step={0.01}
                                                    min={0.1}
                                                    max={1.0}
                                                    valueLabelDisplay="auto"
                                                    sx={{
                                                        mr: 2,
                                                        flexGrow: 1,
                                                        '& .MuiSlider-thumb': { border: `2px solid ${thresholdColor}` },
                                                        '& .MuiSlider-track': { backgroundColor: thresholdColor, borderColor: thresholdColor },
                                                    }}
                                                />
                                                <Box
                                                    sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: thresholdColor, flexShrink: 0 }}
                                                    title={t('client.threshold_security_indicator')}
                                                />
                                            </Box>
                                        </Box>
                                    );
                                })}
                            </Box>
                        </Box>

                        {/* Right column — live test panel */}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Box sx={{ position: 'sticky', top: 16 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                                    {t('client.test_toxicity_title')}
                                </Typography>
                                <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                                    {t('client.test_toxicity_help')}
                                </Typography>

                                <TextField
                                    fullWidth
                                    multiline
                                    rows={4}
                                    variant="outlined"
                                    placeholder={t('client.test_comment_placeholder')}
                                    value={toxicityTestComment}
                                    onChange={(e) => {
                                        setToxicityTestComment(e.target.value);
                                        setToxicityTestError('');
                                    }}
                                    sx={{ mb: 2 }}
                                    error={!!toxicityTestError}
                                    helperText={toxicityTestError}
                                />

                                <Button
                                    variant="contained"
                                    onClick={handleTestToxicity}
                                    disabled={isTestingToxicity || !toxicityTestComment.trim() || !toxicityConfig.enabled}
                                    fullWidth
                                    sx={{ mb: 4, height: 48 }}
                                >
                                    {isTestingToxicity
                                        ? <CircularProgress size={24} sx={{ color: 'white' }} />
                                        : t('client.test_toxicity_button')
                                    }
                                </Button>

                                {toxicityTestResult && (
                                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>

                                        {/* ── Final verdict banner ── */}
                                        {toxicityTestResult.isPolite === null ? (
                                            <Alert
                                                severity="warning"
                                                icon={<HelpIcon />}
                                                sx={{ mb: 2 }}
                                            >
                                                {t('client.test_verdict_unavailable')}
                                            </Alert>
                                        ) : toxicityTestResult.isPolite ? (
                                            <Alert
                                                severity="success"
                                                icon={<CheckCircleIcon />}
                                                sx={{ mb: 2 }}
                                            >
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    {t('client.test_verdict_polite')}
                                                    <Chip
                                                        label={t('client.test_verdict_polite_chip')}
                                                        color="success"
                                                        size="small"
                                                        variant="outlined"
                                                    />
                                                </Box>
                                            </Alert>
                                        ) : (
                                            <Alert
                                                severity="error"
                                                icon={<CancelIcon />}
                                                sx={{ mb: 2 }}
                                            >
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    {t('client.test_verdict_toxic')}
                                                    <Chip
                                                        label={t('client.test_verdict_toxic_chip')}
                                                        color="error"
                                                        size="small"
                                                        variant="outlined"
                                                    />
                                                </Box>
                                            </Alert>
                                        )}

                                        {/* ── Per-metric breakdown ── */}
                                        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                                            {t('client.test_results')}
                                        </Typography>

                                        {toxicityMetrics.map((metric) => {
                                            const score            = toxicityTestResult.scores[metric.key] || 0;
                                            const currentThreshold = toxicityThresholds[metric.key] ?? DEFAULT_TOXICITY_THRESHOLD;
                                            const isViolation      = score >= currentThreshold;

                                            return (
                                                <Box key={`res-${metric.key}`} sx={{ mb: 2 }}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                        <Typography
                                                            variant="body2"
                                                            color={isViolation ? 'error.main' : 'textPrimary'}
                                                            sx={{ fontWeight: isViolation ? 600 : 400 }}
                                                        >
                                                            {t(metric.labelKey)}
                                                        </Typography>
                                                        <Typography
                                                            variant="body2"
                                                            color={isViolation ? 'error.main' : 'textSecondary'}
                                                            sx={{ fontWeight: isViolation ? 600 : 400 }}
                                                        >
                                                            {(score * 100).toFixed(1)}%{' '}
                                                            {isViolation && `(> ${(currentThreshold * 100).toFixed(0)}%)`}
                                                        </Typography>
                                                    </Box>
                                                    <LinearProgress
                                                        variant="determinate"
                                                        value={score * 100}
                                                        color={isViolation ? 'error' : 'success'}
                                                        sx={{ height: 6, borderRadius: 3, bgcolor: '#e0e0e0' }}
                                                    />
                                                </Box>
                                            );
                                        })}
                                    </Paper>
                                )}
                            </Box>
                        </Box>
                    </Box>
                </Box>
            )}

            {/* ── Tab 2: Advanced JSON ─────────────────────────────────────── */}
            {toxicityTab === 2 && (
                <Box>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                        {t('client.config_json')}
                    </Typography>
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
                                fontSize:   '0.875rem',
                            },
                        }}
                    />
                </Box>
            )}
        </Box>
    );
};

export default ToxicityConfig;