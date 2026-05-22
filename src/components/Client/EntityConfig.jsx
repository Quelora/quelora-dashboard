/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

// ./src/components/Client/EntityConfig.jsx
import { useTranslation } from 'react-i18next';
import {
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Typography,
    FormControlLabel,
    Switch,
    Alert,
    Box
} from '@mui/material';
import CustomTextField from '../Common/CustomTextField';
import React from 'react';

const DETERMINISTIC_SNIPPET =
    `<span class="ql-deterministic"\n` +
    `      data-entity="{unique-identifier}"\n` +
    `      data-href="{entity-page-url}">\n` +
    `</span>`;

const DEFAULT_ENTITY_CONFIG = {
    selector: 'article',
    entityIdAttribute: 'href',
    goTo: false,
    hrefAttribute: 'href',
    interactionPlacement: {
        position: 'after',
        relativeTo: '.article-actions',
        deterministic: false
    }
};

const EntityConfig = ({ config, setConfig, isFormSubmitted }) => {
    const { t } = useTranslation();
    const MAX_SELECTOR_LENGTH    = 100;
    const MAX_ATTRIBUTE_LENGTH   = 100;
    const MAX_RELATIVE_TO_LENGTH = 100;

    const currentConfig   = config.config.entityConfig || DEFAULT_ENTITY_CONFIG;
    const isDeterministic = currentConfig.interactionPlacement?.deterministic === true;

    const _setEntityConfig = (patch) =>
        setConfig(prev => ({
            ...prev,
            config: {
                ...prev.config,
                entityConfig: { ...currentConfig, ...patch }
            }
        }));

    const _setPlacement = (patch) =>
        setConfig(prev => ({
            ...prev,
            config: {
                ...prev.config,
                entityConfig: {
                    ...currentConfig,
                    interactionPlacement: { ...currentConfig.interactionPlacement, ...patch }
                }
            }
        }));

    /**
     * Toggling deterministic ON strips all fields irrelevant in that mode so
     * they are not persisted to the server.
     * Toggling OFF restores safe defaults.
     */
    const handleDeterministicChange = (enabled) => {
        if (enabled) {
            setConfig(prev => ({
                ...prev,
                config: {
                    ...prev.config,
                    entityConfig: {
                        goTo: currentConfig.goTo,
                        interactionPlacement: { deterministic: true }
                    }
                }
            }));
        } else {
            setConfig(prev => ({
                ...prev,
                config: {
                    ...prev.config,
                    entityConfig: {
                        ...DEFAULT_ENTITY_CONFIG,
                        goTo: currentConfig.goTo,
                        interactionPlacement: { ...DEFAULT_ENTITY_CONFIG.interactionPlacement, deterministic: false }
                    }
                }
            }));
        }
    };

    const handleTextField = (field, value, maxLen) => {
        if (value.length <= maxLen) _setEntityConfig({ [field]: value });
    };

    const isValidSelector = (s) => /^[a-zA-Z0-9\-_.#[\]:*()=~^$]+$/.test(s);

    const isSelectorInvalid      = !isDeterministic && (!currentConfig.selector || !isValidSelector(currentConfig.selector));
    const isAttributeInvalid     = !isDeterministic && !currentConfig.entityIdAttribute;
    const isRelativeToInvalid    = !isDeterministic && !currentConfig.interactionPlacement?.relativeTo;
    const isHrefAttributeInvalid = !isDeterministic && currentConfig.goTo && !currentConfig.hrefAttribute;

    return (
        <Grid container direction="column" spacing={2}>

            {/* ── Deterministic toggle (always visible, controls everything else) ── */}
            <Grid>
                <FormControlLabel
                    control={
                        <Switch
                            checked={isDeterministic}
                            onChange={(e) => handleDeterministicChange(e.target.checked)}
                            size="small"
                        />
                    }
                    label={t('client.interaction_deterministic')}
                />
                <Typography variant="caption" color="textSecondary" display="block">
                    {t('client.interaction_deterministic_help')}
                </Typography>
            </Grid>

            {/* ── Deterministic mode: HTML marker hint ── */}
            {isDeterministic && (
                <Grid>
                    <Alert severity="info">
                        <Typography variant="body2" sx={{ mb: 1 }}>
                            {t('client.interaction_deterministic_hint')}
                        </Typography>
                        <Box
                            component="pre"
                            sx={{
                                fontFamily: 'monospace',
                                fontSize: '0.78rem',
                                bgcolor: 'action.hover',
                                borderRadius: 1,
                                p: 1.5,
                                overflowX: 'auto',
                                whiteSpace: 'pre',
                                m: 0
                            }}
                        >
                            {DETERMINISTIC_SNIPPET}
                        </Box>
                        <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 1 }}>
                            <strong>data-entity</strong>{' — '}{t('client.interaction_deterministic_attr_entity')}
                        </Typography>
                        <Typography variant="caption" color="textSecondary" display="block">
                            <strong>data-href</strong>{' — '}{t('client.interaction_deterministic_attr_href')}
                        </Typography>
                    </Alert>
                </Grid>
            )}

            {/* ── Standard-mode fields (hidden in deterministic mode) ── */}
            {!isDeterministic && (
                <>
                    <Grid>
                        <CustomTextField
                            label={t('client.entity_selector')}
                            fullWidth
                            variant="outlined"
                            value={currentConfig.selector || ''}
                            onChange={(e) => handleTextField('selector', e.target.value, MAX_SELECTOR_LENGTH)}
                            error={isFormSubmitted && isSelectorInvalid}
                            helperText={
                                isFormSubmitted && isSelectorInvalid
                                    ? (!currentConfig.selector
                                        ? t('client.entity_selector_required')
                                        : t('client.entity_selector_invalid'))
                                    : t('client.entity_selector_help')
                            }
                            inputProps={{ maxLength: MAX_SELECTOR_LENGTH }}
                        />
                        <Typography
                            variant="caption"
                            color={(currentConfig.selector?.length || 0) > MAX_SELECTOR_LENGTH ? 'error' : 'textSecondary'}
                            align="right"
                            display="block"
                        >
                            {currentConfig.selector?.length || 0}/{MAX_SELECTOR_LENGTH}
                        </Typography>
                    </Grid>
                    <Grid>
                        <CustomTextField
                            label={t('client.entity_id_attribute')}
                            fullWidth
                            variant="outlined"
                            value={currentConfig.entityIdAttribute || ''}
                            onChange={(e) => handleTextField('entityIdAttribute', e.target.value, MAX_ATTRIBUTE_LENGTH)}
                            error={isFormSubmitted && isAttributeInvalid}
                            helperText={
                                isFormSubmitted && isAttributeInvalid
                                    ? t('client.entity_id_attribute_required')
                                    : t('client.entity_id_attribute_help')
                            }
                            inputProps={{ maxLength: MAX_ATTRIBUTE_LENGTH }}
                        />
                        <Typography
                            variant="caption"
                            color={(currentConfig.entityIdAttribute?.length || 0) > MAX_ATTRIBUTE_LENGTH ? 'error' : 'textSecondary'}
                            align="right"
                            display="block"
                        >
                            {currentConfig.entityIdAttribute?.length || 0}/{MAX_ATTRIBUTE_LENGTH}
                        </Typography>
                    </Grid>
                    <Grid>
                        <FormControl fullWidth>
                            <InputLabel>{t('client.interaction_position')}</InputLabel>
                            <Select
                                value={currentConfig.interactionPlacement?.position || 'after'}
                                onChange={(e) => _setPlacement({ position: e.target.value })}
                                size="small"
                            >
                                <MenuItem value="before">{t('client.position_before')}</MenuItem>
                                <MenuItem value="after">{t('client.position_after')}</MenuItem>
                                <MenuItem value="inside">{t('client.position_inside')}</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid>
                        <CustomTextField
                            label={t('client.interaction_relative_to')}
                            fullWidth
                            variant="outlined"
                            value={currentConfig.interactionPlacement?.relativeTo || ''}
                            onChange={(e) => _setPlacement({ relativeTo: e.target.value.slice(0, MAX_RELATIVE_TO_LENGTH) })}
                            error={isFormSubmitted && isRelativeToInvalid}
                            helperText={
                                isFormSubmitted && isRelativeToInvalid
                                    ? t('client.interaction_relative_to_required')
                                    : t('client.interaction_relative_to_help')
                            }
                            inputProps={{ maxLength: MAX_RELATIVE_TO_LENGTH }}
                        />
                        <Typography
                            variant="caption"
                            color={(currentConfig.interactionPlacement?.relativeTo?.length || 0) > MAX_RELATIVE_TO_LENGTH ? 'error' : 'textSecondary'}
                            align="right"
                            display="block"
                        >
                            {currentConfig.interactionPlacement?.relativeTo?.length || 0}/{MAX_RELATIVE_TO_LENGTH}
                        </Typography>
                    </Grid>
                </>
            )}

            {/* ── goTo toggle (visible in both modes) ── */}
            <Grid>
                <FormControlLabel
                    control={
                        <Switch
                            checked={currentConfig.goTo === true}
                            onChange={(e) => _setEntityConfig({ goTo: e.target.checked })}
                            size="small"
                        />
                    }
                    label={t('client.entity_goto')}
                />
                <Typography variant="caption" color="textSecondary" display="block">
                    {t('client.entity_goto_help')}
                </Typography>
            </Grid>

            {/* ── hrefAttribute — standard mode only, shown when goTo is active ── */}
            {!isDeterministic && currentConfig.goTo === true && (
                <Grid>
                    <CustomTextField
                        label={t('client.entity_href_attribute')}
                        fullWidth
                        variant="outlined"
                        value={currentConfig.hrefAttribute || ''}
                        onChange={(e) => handleTextField('hrefAttribute', e.target.value, MAX_ATTRIBUTE_LENGTH)}
                        error={isFormSubmitted && isHrefAttributeInvalid}
                        helperText={
                            isFormSubmitted && isHrefAttributeInvalid
                                ? t('client.entity_href_attribute_required')
                                : t('client.entity_href_attribute_help')
                        }
                        inputProps={{ maxLength: MAX_ATTRIBUTE_LENGTH }}
                    />
                    <Typography
                        variant="caption"
                        color={(currentConfig.hrefAttribute?.length || 0) > MAX_ATTRIBUTE_LENGTH ? 'error' : 'textSecondary'}
                        align="right"
                        display="block"
                    >
                        {currentConfig.hrefAttribute?.length || 0}/{MAX_ATTRIBUTE_LENGTH}
                    </Typography>
                </Grid>
            )}
        </Grid>
    );
};

export default EntityConfig;
