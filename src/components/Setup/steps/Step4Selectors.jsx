/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    Box, Typography, Paper, RadioGroup, FormControlLabel, Radio,
    Chip, Accordion, AccordionSummary, AccordionDetails,
    FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import CustomTextField from '../../Common/CustomTextField';

const CMS_KEYS = ['wordpress', 'ghost', 'drupal', 'joomla', 'custom'];

const SelectorFields = ({ formData, errors, onChange, t }) => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <CustomTextField
            label={t('setup.selectors.selector_label')}
            fullWidth
            value={formData.entitySelector}
            onChange={(e) => onChange({ entitySelector: e.target.value })}
            error={!!errors.entitySelector}
            helperText={errors.entitySelector || t('setup.selectors.selector_help')}
        />
        <CustomTextField
            label={t('setup.selectors.id_attribute_label')}
            fullWidth
            value={formData.entityIdAttribute}
            onChange={(e) => onChange({ entityIdAttribute: e.target.value })}
            helperText={t('setup.selectors.id_attribute_help')}
        />
        <FormControl fullWidth size="small">
            <InputLabel>{t('setup.selectors.position_label')}</InputLabel>
            <Select
                value={formData.interactionPosition}
                label={t('setup.selectors.position_label')}
                onChange={(e) => onChange({ interactionPosition: e.target.value })}
            >
                <MenuItem value="before">{t('setup.selectors.position_before')}</MenuItem>
                <MenuItem value="after">{t('setup.selectors.position_after')}</MenuItem>
                <MenuItem value="inside">{t('setup.selectors.position_inside')}</MenuItem>
            </Select>
        </FormControl>
        <CustomTextField
            label={t('setup.selectors.relative_to_label')}
            fullWidth
            value={formData.interactionRelativeTo}
            onChange={(e) => onChange({ interactionRelativeTo: e.target.value })}
            helperText={t('setup.selectors.relative_to_help')}
        />
    </Box>
);

const Step4Selectors = ({ formData, errors, onChange, cmsPresets }) => {
    const { t } = useTranslation();

    const handleCmsSelect = (cms) => {
        const preset = cmsPresets[cms] || cmsPresets.custom;
        onChange({ cmsPreset: cms, ...preset });
    };

    const modeCardSx = (active) => ({
        p: 2,
        mb: 1.5,
        cursor: 'pointer',
        borderColor: active ? 'primary.main' : 'divider',
        borderWidth: active ? 2 : 1,
        transition: 'border-color 0.15s',
    });

    return (
        <Box>
            <Typography variant="h5" fontWeight={700} gutterBottom>
                {t('setup.selectors.title')}
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
                {t('setup.selectors.subtitle')}
            </Typography>

            <RadioGroup
                value={formData.selectorMode}
                onChange={(e) => onChange({ selectorMode: e.target.value })}
            >
                {/* Discovery mode */}
                <Paper
                    variant="outlined"
                    sx={modeCardSx(formData.selectorMode === 'discovery')}
                    onClick={() => onChange({ selectorMode: 'discovery' })}
                >
                    <FormControlLabel
                        value="discovery"
                        control={<Radio size="small" />}
                        label={
                            <Box>
                                <Typography variant="body2" fontWeight={600}>
                                    {t('setup.selectors.mode_discovery')}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {t('setup.selectors.mode_discovery_desc')}
                                </Typography>
                            </Box>
                        }
                        sx={{ m: 0, width: '100%', alignItems: 'flex-start', pt: 0.5 }}
                    />

                    {formData.selectorMode === 'discovery' && (
                        <Box sx={{ mt: 2, pl: 4 }} onClick={(e) => e.stopPropagation()}>
                            {/* CMS presets */}
                            <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                                {t('setup.selectors.cms_label')}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                                {CMS_KEYS.map((cms) => (
                                    <Chip
                                        key={cms}
                                        label={t(`setup.selectors.cms_${cms}`)}
                                        onClick={() => handleCmsSelect(cms)}
                                        color={formData.cmsPreset === cms ? 'primary' : 'default'}
                                        variant={formData.cmsPreset === cms ? 'filled' : 'outlined'}
                                        size="small"
                                        clickable
                                    />
                                ))}
                            </Box>

                            {/* Advanced selector override */}
                            <Accordion
                                disableGutters
                                elevation={0}
                                sx={{ border: 1, borderColor: 'divider', borderRadius: '4px !important' }}
                            >
                                <AccordionSummary expandIcon={<ExpandMore fontSize="small" />}>
                                    <Typography variant="caption" color="text.secondary">
                                        {t('setup.selectors.advanced_settings')}
                                    </Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <SelectorFields
                                        formData={formData}
                                        errors={errors}
                                        onChange={onChange}
                                        t={t}
                                    />
                                </AccordionDetails>
                            </Accordion>
                        </Box>
                    )}
                </Paper>

                {/* Deterministic mode */}
                <Paper
                    variant="outlined"
                    sx={modeCardSx(formData.selectorMode === 'deterministic')}
                    onClick={() => onChange({ selectorMode: 'deterministic' })}
                >
                    <FormControlLabel
                        value="deterministic"
                        control={<Radio size="small" />}
                        label={
                            <Box>
                                <Typography variant="body2" fontWeight={600}>
                                    {t('setup.selectors.mode_deterministic')}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {t('setup.selectors.mode_deterministic_desc')}
                                </Typography>
                            </Box>
                        }
                        sx={{ m: 0, width: '100%', alignItems: 'flex-start', pt: 0.5 }}
                    />

                    {formData.selectorMode === 'deterministic' && (
                        <Box sx={{ mt: 2, pl: 4 }} onClick={(e) => e.stopPropagation()}>
                            <SelectorFields
                                formData={formData}
                                errors={errors}
                                onChange={onChange}
                                t={t}
                            />
                        </Box>
                    )}
                </Paper>
            </RadioGroup>
        </Box>
    );
};

export default Step4Selectors;
