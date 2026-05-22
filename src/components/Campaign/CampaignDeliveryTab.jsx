/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

import React from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Divider,
    Grid,
    InputAdornment
} from '@mui/material';
import { AccessTime as TimeIcon } from '@mui/icons-material';
import CustomTextField from '../Common/CustomTextField';

const CampaignDeliveryTab = ({
    formData,
    handleNestedChange,
    t
}) => {
    return (
        <Box sx={{ pt: 2 }}>
            <Card variant="outlined">
                <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <TimeIcon color="primary" sx={{ mr: 1 }} />
                        <Typography variant="h6" color="primary">
                            {t('campaign.deliveryControl', 'Delivery Controls')}
                        </Typography>
                    </Box>
                    <Divider sx={{ mb: 3 }} />
                    
                    <Typography variant="subtitle2" gutterBottom>
                        {t('campaign.frequencyCap', 'Frequency Capping')}
                    </Typography>
                    <Typography variant="caption" color="textSecondary" paragraph sx={{ mb: 3 }}>
                        {t('campaign.frequencyCapDesc', 'Limit how often a single user sees ads from this campaign to prevent ad fatigue.')}
                    </Typography>

                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <CustomTextField
                                label={t('campaign.maxImpressions', 'Max Impressions per User')}
                                type="number"
                                value={formData.frequencyCap?.impressions || 0}
                                onChange={(e) => handleNestedChange('frequencyCap.impressions', Number(e.target.value))}
                                fullWidth
                                helperText={t('campaign.freqImpressionsHelp', 'Set to 0 for unlimited impressions.')}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <CustomTextField
                                label={t('campaign.timePeriod', 'Time Period (Hours)')}
                                type="number"
                                value={formData.frequencyCap?.perHours || 24}
                                onChange={(e) => handleNestedChange('frequencyCap.perHours', Number(e.target.value))}
                                fullWidth
                                InputProps={{
                                    endAdornment: <InputAdornment position="end">{t('common.hours', 'h')}</InputAdornment>,
                                }}
                                helperText={t('campaign.freqTimeHelp', 'Reset counter after this many hours.')}
                            />
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>
        </Box>
    );
};

export default CampaignDeliveryTab;