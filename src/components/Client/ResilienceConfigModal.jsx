/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

// src/components/Client/ResilienceConfigModal.jsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Box, Grid, Tabs, Tab, Alert, Typography,
    Switch, FormControlLabel, Select, MenuItem,
    FormControl, InputLabel, Chip, Divider, CircularProgress,
    FormHelperText
} from '@mui/material';
import {
    Save as SaveIcon,
    VpnKey as KeyIcon,
    Shield as ShieldIcon,
} from '@mui/icons-material';
import CustomTextField from '../Common/CustomTextField';
import { saveResilienceConfig, generateResilienceKeys } from '../../api/resilience';
import EnterpriseGate from '../Common/EnterpriseGate';
import { useEnterprise } from '../../hooks/useEnterprise';

/** Modes available for the resilience engine. */
const RESILIENCE_MODES = ['HYBRID', 'P2P_ONLY', 'SERVER_ONLY', 'PASSIVE'];

/**
 * Default state — mirrors the server-side schema and DEFAULT_RESILIENCE_PAYLOAD
 * in authController so the form always has a valid baseline.
 *
 * @type {Object}
 */
const DEFAULT_CONFIG = {
    enabled:   false,
    algorithm: 'ed25519',
    keyId:     '',
    publicKey: '',
    updatedAt: null,
    forceMode: false,
    mode:      'HYBRID',
    triggers: {
        maxEventLoopLag: 200,
        maxMemoryHeap:   85,
        maxConnections:  0,
    },
    weights: {
        trust:    0.4,
        activity: 0.4,
        geo:      0.2,
    },
};

/**
 * Merges the resilience data coming from the client object (loaded at login)
 * into the DEFAULT_CONFIG baseline, ensuring all fields are always present.
 *
 * @param {Object|null} clientResilience - The resilience field from the client object.
 * @returns {Object} A fully populated resilience config ready for form state.
 */
function buildInitialData(clientResilience) {
    if (!clientResilience) return DEFAULT_CONFIG;
    return {
        ...DEFAULT_CONFIG,
        ...clientResilience,
        triggers: { ...DEFAULT_CONFIG.triggers, ...(clientResilience.triggers || {}) },
        weights:  { ...DEFAULT_CONFIG.weights,  ...(clientResilience.weights  || {}) },
    };
}

/**
 * Modal for editing the Resilience Mode configuration of a client.
 * Data is sourced directly from the `client` prop (populated at login),
 * so no additional HTTP request is needed to open the form.
 *
 * Covers three sections via tabs:
 * 0 — General: enabled toggle, mode, forceMode, key info and generation
 * 1 — Triggers: numeric thresholds that activate fallback behaviour
 * 2 — Weights: peer-scoring weights (must sum to 1.0)
 *
 * @param {Object}   props
 * @param {boolean}  props.open      - Controls dialog visibility.
 * @param {Function} props.onClose   - Callback to close the dialog.
 * @param {Object}   props.client    - Decrypted client object (includes resilience field).
 * @param {Function} props.onSave    - Called with (cid, resilienceData) after a successful save.
 * @param {Function} props.showToast - Transient notification callback.
 */
const ResilienceConfigModal = ({ open, onClose, onSave, client, showToast }) => {
    const { t } = useTranslation();
    const { hasModule } = useEnterprise();

    const [saving,       setSaving]       = useState(false);
    const [keysLoading,  setKeysLoading]  = useState(false);
    const [currentTab,   setCurrentTab]   = useState(0);
    const [weightsError, setWeightsError] = useState('');
    const [data,         setData]         = useState(DEFAULT_CONFIG);

    /**
     * Re-populate the form every time the modal opens or the client changes.
     * The resilience field is already present on the client object from the
     * login payload — no HTTP call is needed.
     */
    useEffect(() => {
        if (open && client) {
            setData(buildInitialData(client.resilience));
            setWeightsError('');
            setCurrentTab(0);
        }
    }, [open, client]);

    /**
     * Validates that the three peer-scoring weights sum to 1.0 within float tolerance.
     *
     * @param {Object} weights - The weights object to validate.
     * @returns {string} An error message string, or an empty string if valid.
     */
    const validateWeights = (weights) => {
        const sum = (weights.trust || 0) + (weights.activity || 0) + (weights.geo || 0);
        if (Math.abs(sum - 1.0) > 0.001) {
            return t('client.resilience_weights_sum_error');
        }
        return '';
    };

    /**
     * Persists the editable resilience configuration to the server.
     * Key material fields (keyId, publicKey, updatedAt) are stripped from the
     * payload — they are managed exclusively by the generate-keys endpoint.
     * The algorithm is preserved in state but excluded from the save payload.
     *
     * @async
     * @returns {Promise<void>}
     */
    const handleSave = async () => {
        const weightErr = validateWeights(data.weights);
        if (weightErr) {
            setWeightsError(weightErr);
            setCurrentTab(2);
            return;
        }

        setSaving(true);
        try {
            const { keyId, publicKey, updatedAt, algorithm, ...payload } = data;
            const saved = await saveResilienceConfig(client.cid, payload);
            if (onSave) onSave(client.cid, { ...data, ...saved });
            showToast(t('client.resilience_saved'), 'success');
            onClose();
        } catch (error) {
            console.error(error);
            showToast(t('client.resilience_save_error'), 'error');
        } finally {
            setSaving(false);
        }
    };

    /**
     * Requests a new ed25519 keypair from the server and updates the local form
     * state with the returned public key metadata.
     * The private key is never returned — it is encrypted at rest server-side.
     *
     * @async
     * @returns {Promise<void>}
     */
    const handleGenerateKeys = async () => {
        setKeysLoading(true);
        try {
            const result = await generateResilienceKeys(client.cid);
            setData(prev => ({
                ...prev,
                keyId:     result.keyId     || prev.keyId,
                publicKey: result.publicKey || prev.publicKey,
                algorithm: result.algorithm || prev.algorithm,
                updatedAt: result.updatedAt || prev.updatedAt,
            }));
            showToast(t('client.resilience_keys_generated'), 'success');
        } catch (error) {
            console.error(error);
            showToast(t('client.resilience_keys_error'), 'error');
        } finally {
            setKeysLoading(false);
        }
    };

    /** @param {string} field - Top-level boolean field to toggle. */
    const handleToggle = (field) =>
        setData(prev => ({ ...prev, [field]: !prev[field] }));

    /**
     * @param {string} field - Top-level field name.
     * @param {*}      value - New value to set.
     */
    const handleField = (field, value) =>
        setData(prev => ({ ...prev, [field]: value }));

    /**
     * @param {string} field - Key within the triggers object.
     * @param {string} value - Raw string value from the input.
     */
    const handleTrigger = (field, value) =>
        setData(prev => ({
            ...prev,
            triggers: { ...prev.triggers, [field]: parseFloat(value) || 0 },
        }));

    /**
     * Updates a single weight field and re-validates the sum constraint.
     *
     * @param {string} field - Key within the weights object.
     * @param {string} value - Raw string value from the input.
     */
    const handleWeight = (field, value) => {
        const updated = { ...data.weights, [field]: parseFloat(value) || 0 };
        setWeightsError(validateWeights(updated));
        setData(prev => ({ ...prev, weights: updated }));
    };

    const weightSum   = ((data.weights.trust || 0) + (data.weights.activity || 0) + (data.weights.geo || 0)).toFixed(2);
    const weightSumOk = Math.abs(parseFloat(weightSum) - 1.0) <= 0.001;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                {t('client.resilience_config_title')} — {client?.description || client?.cid}
            </DialogTitle>

            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={currentTab} onChange={(_, v) => setCurrentTab(v)} variant="fullWidth">
                    <Tab label={t('client.resilience_tab_general')}  />
                    <Tab label={t('client.resilience_tab_triggers')} />
                    <Tab label={t('client.resilience_tab_weights')}  />
                </Tabs>
            </Box>

            <DialogContent>
                <EnterpriseGate module="resilience">
                <>
                    {/* ── TAB 0: GENERAL ──────────────────────────────────── */}
                    {currentTab === 0 && (
                        <Box sx={{ mt: 2 }}>
                            <Alert severity="info" sx={{ mb: 3 }}>
                                {t('client.resilience_general_help')}
                            </Alert>

                            <Grid container spacing={3}>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={data.enabled}
                                                onChange={() => handleToggle('enabled')}
                                                color="primary"
                                            />
                                        }
                                        label={t('client.resilience_enabled')}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={data.forceMode}
                                                onChange={() => handleToggle('forceMode')}
                                                color="warning"
                                                disabled={!data.enabled}
                                            />
                                        }
                                        label={t('client.resilience_force_mode')}
                                    />
                                </Grid>

                                <Grid size={12}>
                                    <FormControl fullWidth size="small" disabled={!data.enabled}>
                                        <InputLabel>{t('client.resilience_mode')}</InputLabel>
                                        <Select
                                            value={data.mode}
                                            label={t('client.resilience_mode')}
                                            onChange={(e) => handleField('mode', e.target.value)}
                                        >
                                            {RESILIENCE_MODES.map(m => (
                                                <MenuItem key={m} value={m}>{m}</MenuItem>
                                            ))}
                                        </Select>
                                        <FormHelperText>
                                            {t(`client.resilience_mode_desc_${data.mode.toLowerCase()}`)}
                                        </FormHelperText>
                                    </FormControl>
                                </Grid>
                            </Grid>

                            <Divider sx={{ my: 3 }} />

                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                                <KeyIcon fontSize="small" color="action" />
                                <Typography variant="subtitle2">
                                    {t('client.resilience_key_info')}
                                </Typography>
                                {data.keyId && (
                                    <Chip
                                        size="small"
                                        icon={<ShieldIcon />}
                                        label={t('client.resilience_key_active')}
                                        color="success"
                                        variant="outlined"
                                    />
                                )}
                            </Box>

                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <CustomTextField
                                        label={t('client.resilience_key_id')}
                                        value={data.keyId || t('client.resilience_no_key')}
                                        disabled
                                        fullWidth
                                        size="small"
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <CustomTextField
                                        label={t('client.resilience_updated_at')}
                                        value={
                                            data.updatedAt
                                                ? new Date(data.updatedAt).toLocaleString()
                                                : '—'
                                        }
                                        disabled
                                        fullWidth
                                        size="small"
                                    />
                                </Grid>
                                <Grid size={12}>
                                    <CustomTextField
                                        label={t('client.resilience_public_key')}
                                        value={data.publicKey || ''}
                                        disabled
                                        fullWidth
                                        size="small"
                                        multiline
                                        rows={3}
                                        helperText={t('client.resilience_public_key_help')}
                                    />
                                </Grid>
                                <Grid size={12}>
                                    <Alert severity="warning" sx={{ mb: 1 }}>
                                        {t('client.resilience_key_regenerate_warning')}
                                    </Alert>
                                    <Button
                                        variant="outlined"
                                        startIcon={keysLoading ? <CircularProgress size={16} /> : <KeyIcon />}
                                        onClick={handleGenerateKeys}
                                        disabled={keysLoading || saving}
                                    >
                                        {t('client.resilience_generate_keys')}
                                    </Button>
                                </Grid>
                            </Grid>
                        </Box>
                    )}

                    {/* ── TAB 1: TRIGGERS ─────────────────────────────────── */}
                    {currentTab === 1 && (
                        <Box sx={{ mt: 2 }}>
                            <Alert severity="info" sx={{ mb: 3 }}>
                                {t('client.resilience_triggers_help')}
                            </Alert>
                            <Grid container spacing={3}>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <CustomTextField
                                        label={t('client.resilience_trigger_event_loop')}
                                        type="number"
                                        value={data.triggers.maxEventLoopLag}
                                        onChange={(e) => handleTrigger('maxEventLoopLag', e.target.value)}
                                        inputProps={{ min: 0 }}
                                        helperText={t('client.resilience_trigger_event_loop_help')}
                                        fullWidth
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <CustomTextField
                                        label={t('client.resilience_trigger_memory')}
                                        type="number"
                                        value={data.triggers.maxMemoryHeap}
                                        onChange={(e) => handleTrigger('maxMemoryHeap', e.target.value)}
                                        inputProps={{ min: 0, max: 100 }}
                                        helperText={t('client.resilience_trigger_memory_help')}
                                        fullWidth
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <CustomTextField
                                        label={t('client.resilience_trigger_connections')}
                                        type="number"
                                        value={data.triggers.maxConnections}
                                        onChange={(e) => handleTrigger('maxConnections', e.target.value)}
                                        inputProps={{ min: 0 }}
                                        helperText={t('client.resilience_trigger_connections_help')}
                                        fullWidth
                                    />
                                </Grid>
                            </Grid>
                        </Box>
                    )}

                    {/* ── TAB 2: WEIGHTS ──────────────────────────────────── */}
                    {currentTab === 2 && (
                        <Box sx={{ mt: 2 }}>
                            <Alert severity="info" sx={{ mb: 3 }}>
                                {t('client.resilience_weights_help')}
                            </Alert>

                            {weightsError && (
                                <Alert severity="error" sx={{ mb: 2 }}>
                                    {weightsError}
                                </Alert>
                            )}

                            <Grid container spacing={3}>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <CustomTextField
                                        label={t('client.resilience_weight_trust')}
                                        type="number"
                                        value={data.weights.trust}
                                        onChange={(e) => handleWeight('trust', e.target.value)}
                                        inputProps={{ step: 0.05, min: 0, max: 1 }}
                                        helperText={t('client.resilience_weight_trust_help')}
                                        fullWidth
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <CustomTextField
                                        label={t('client.resilience_weight_activity')}
                                        type="number"
                                        value={data.weights.activity}
                                        onChange={(e) => handleWeight('activity', e.target.value)}
                                        inputProps={{ step: 0.05, min: 0, max: 1 }}
                                        helperText={t('client.resilience_weight_activity_help')}
                                        fullWidth
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <CustomTextField
                                        label={t('client.resilience_weight_geo')}
                                        type="number"
                                        value={data.weights.geo}
                                        onChange={(e) => handleWeight('geo', e.target.value)}
                                        inputProps={{ step: 0.05, min: 0, max: 1 }}
                                        helperText={t('client.resilience_weight_geo_help')}
                                        fullWidth
                                    />
                                </Grid>
                            </Grid>

                            <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" color="text.secondary">
                                    {t('client.resilience_weights_sum')}:
                                </Typography>
                                <Chip
                                    size="small"
                                    label={weightSum}
                                    color={weightSumOk ? 'success' : 'error'}
                                    variant="outlined"
                                />
                                {!weightSumOk && (
                                    <Typography variant="caption" color="error">
                                        {t('client.resilience_weights_sum_target')}
                                    </Typography>
                                )}
                            </Box>
                        </Box>
                    )}
                </>
                </EnterpriseGate>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} disabled={saving}>
                    {t('common.cancel')}
                </Button>
                {hasModule('resilience') && (
                    <Button
                        onClick={handleSave}
                        variant="contained"
                        disabled={saving || !!weightsError}
                        startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
                    >
                        {t('common.save')}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default ResilienceConfigModal;