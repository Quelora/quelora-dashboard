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
    Box, Typography, FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import CustomTextField from '../../Common/CustomTextField';
import { SUPPORTED_LOCALES } from '../../../i18n';

const Step2Basics = ({ formData, errors, onChange }) => {
    const { t } = useTranslation();

    return (
        <Box>
            <Typography variant="h5" fontWeight={700} gutterBottom>
                {t('setup.basics.title')}
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
                {t('setup.basics.subtitle')}
            </Typography>

            <CustomTextField
                label={t('setup.basics.site_name')}
                fullWidth
                required
                autoFocus
                value={formData.siteName}
                onChange={(e) => onChange({ siteName: e.target.value })}
                error={!!errors.siteName}
                helperText={errors.siteName || t('setup.basics.site_name_help')}
            />

            <CustomTextField
                label={t('setup.basics.site_url')}
                fullWidth
                required
                value={formData.siteUrl}
                onChange={(e) => onChange({ siteUrl: e.target.value })}
                error={!!errors.siteUrl}
                helperText={errors.siteUrl || t('setup.basics.site_url_help')}
                placeholder="https://"
                sx={{ mt: 2 }}
            />

            <CustomTextField
                label={t('setup.basics.description')}
                fullWidth
                multiline
                rows={2}
                value={formData.description}
                onChange={(e) => onChange({ description: e.target.value })}
                sx={{ mt: 2 }}
            />

            <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>{t('setup.basics.language')}</InputLabel>
                <Select
                    value={formData.language}
                    label={t('setup.basics.language')}
                    onChange={(e) => onChange({ language: e.target.value })}
                    size="small"
                >
                    {SUPPORTED_LOCALES.map(({ code, native, label }) => (
                        <MenuItem key={code} value={code}>
                            {native} ({label})
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        </Box>
    );
};

export default Step2Basics;
