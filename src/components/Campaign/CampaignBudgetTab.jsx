/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

import React from 'react';
import {
    Grid,
    Box,
    Typography,
    InputAdornment,
    LinearProgress,
    Chip,
    Divider,
    Card,
    CardContent,
    Alert
} from '@mui/material';
import CustomTextField from '../Common/CustomTextField';

const CampaignBudgetTab = ({
    formData,
    handleChange,
    validationErrors,
    t
}) => {
    // Visual calculations
    const budgetTotal = Number(formData.budgetTotal) || 0;
    const budgetSpent = Number(formData.budgetSpent) || 0;
    const percentSpent = budgetTotal > 0 ? Math.min((budgetSpent / budgetTotal) * 100, 100) : 0;

    let budgetColor = 'primary';
    if (percentSpent > 80) budgetColor = 'warning';
    if (percentSpent >= 100) budgetColor = 'error';

    return (
        <Box sx={{ pt: 2 }}>
            {formData.budgetStatus === 'exhausted' && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {t('campaign.budgetExhaustedAlert', 'This campaign has exhausted its budget and is currently paused automatically. Increase the budget to resume.')}
                </Alert>
            )}

            <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom color="primary">
                        {t('campaign.financialSettings', 'Financial Settings')}
                    </Typography>
                    <Divider sx={{ mb: 3 }} />

                    <Grid container spacing={3} sx={{ display: 'flex', flexDirection: 'column' }}>
                        {/* Money Input Section */}
                        <Grid item xs={12} md={6}>
                            <CustomTextField
                                label={t('campaign.budgetTotal', 'Total Campaign Budget')}
                                name="budgetTotal"
                                type="number"
                                value={formData.budgetTotal}
                                onChange={handleChange}
                                fullWidth
                                required
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                }}
                                error={!!validationErrors.budgetTotal}
                                helperText={validationErrors.budgetTotal ? t(validationErrors.budgetTotal) : t('campaign.budgetHelp', 'Maximum amount to spend across the entire lifetime of the campaign.')}
                            />
                        </Grid>

                        {/* Consumption Visualization */}
                        <Grid item xs={12} md={6}>
                            <Box sx={{ p: 2, bgcolor: 'var(--surface-color)', borderRadius: 1, border: '1px solid var(--border-gray)' }}>
                                <Typography variant="subtitle2" gutterBottom>
                                    {t('campaign.spendingOverview', 'Spending Overview')}
                                </Typography>
                                
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 1 }}>
                                    <Box>
                                        <Typography variant="caption" color="textSecondary" display="block">
                                            {t('campaign.spent', 'Spent')}
                                        </Typography>
                                        <Typography variant="h5" sx={{ fontWeight: 600 }}>
                                            ${budgetSpent.toFixed(2)}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ textAlign: 'right' }}>
                                        <Typography variant="caption" color="textSecondary" display="block">
                                            {t('campaign.remaining', 'Remaining')}
                                        </Typography>
                                        <Typography variant="body1" color={budgetTotal - budgetSpent < 0 ? 'error' : 'textPrimary'}>
                                            ${(budgetTotal - budgetSpent).toFixed(2)}
                                        </Typography>
                                    </Box>
                                </Box>

                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box sx={{ width: '100%', mr: 1 }}>
                                        <LinearProgress 
                                            variant="determinate" 
                                            value={percentSpent} 
                                            color={budgetColor}
                                            sx={{ height: 10, borderRadius: 5 }} 
                                        />
                                    </Box>
                                    <Box sx={{ minWidth: 35 }}>
                                        <Typography variant="body2" color="textSecondary">{`${Math.round(percentSpent)}%`}</Typography>
                                    </Box>
                                </Box>
                                
                                <Box sx={{ mt: 2 }}>
                                    <Chip 
                                        label={t(`campaign.budgetStatus.${formData.budgetStatus}`, formData.budgetStatus === 'active' ? 'Budget Active' : 'Budget Exhausted')} 
                                        color={formData.budgetStatus === 'active' ? 'success' : 'error'} 
                                        size="small" 
                                        variant="outlined"
                                    />
                                </Box>
                            </Box>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>
        </Box>
    );
};

export default CampaignBudgetTab;