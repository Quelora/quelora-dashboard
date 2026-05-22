/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

import React, { useState, useEffect } from 'react';
import {
    Box,
    Grid,
    Typography,
    Button,
    CircularProgress,
    FormControlLabel,
    Switch,
    Divider,
    Card,
    CardContent,
    Paper,
    useTheme
} from '@mui/material';
import { 
    Save as SaveIcon, 
    MonetizationOn as CoinIcon, 
    TrendingUp as MintIcon, 
    TrendingDown as BurnIcon,
    SwapHoriz as TxIcon,
    EmojiEvents as XPIcon
} from '@mui/icons-material';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import CustomTextField from '../Common/CustomTextField';
import DateRangeSelector from '../Common/DateRangeSelector';

const StatCard = ({ title, value, icon, color }) => (
    <Paper elevation={0} sx={{ p: 2, border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ p: 1.5, borderRadius: '50%', backgroundColor: `${color}20`, color: color }}>
            {icon}
        </Box>
        <Box>
            <Typography variant="caption" color="textSecondary" sx={{ textTransform: 'uppercase', fontWeight: 'bold' }}>
                {title}
            </Typography>
            <Typography variant="h5" fontWeight="bold">
                {value !== undefined ? value.toLocaleString() : '-'}
            </Typography>
        </Box>
    </Paper>
);

const GamificationConfigTab = ({ t, config, economy, onSave, loading, cid, fetchEconomy }) => {
    const theme = useTheme();
    const [localConfig, setLocalConfig] = useState(config);
    const [dateRange, setDateRange] = useState({
        from: new Date(new Date().setDate(new Date().getDate() - 30)),
        to: new Date()
    });
    const [isRealTime, setIsRealTime] = useState(false);

    useEffect(() => { 
        setLocalConfig(config); 
    }, [config]);

    useEffect(() => {
        let interval;
        if (isRealTime && fetchEconomy) {
            interval = setInterval(() => {
                fetchEconomy(dateRange.from, dateRange.to);
            }, 5000); 
        }
        return () => clearInterval(interval);
    }, [isRealTime, dateRange, fetchEconomy]);

    const handleChange = (field, value) => {
        setLocalConfig(prev => ({ ...prev, [field]: value }));
    };

    const handleCurrencyChange = (field, value) => {
        setLocalConfig(prev => ({ 
            ...prev, 
            currency: { ...prev.currency, [field]: value } 
        }));
    };

    const handleDateRangeChange = (newFrom, newTo) => {
        if (newFrom && newTo) {
            setDateRange({ from: newFrom, to: newTo });
            if (fetchEconomy) {
                fetchEconomy(newFrom, newTo);
            }
        }
    };

    const handleRealTimeToggle = (isActive) => {
        setIsRealTime(isActive);
        if (isActive && fetchEconomy) {
            fetchEconomy(dateRange.from, dateRange.to);
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h6">
                    {t('gamification.config.economy_stats', 'Economy Stats')}
                </Typography>
                
                <Box sx={{ width: { xs: '100%', md: 'auto' } }}>
                    <DateRangeSelector 
                        dateFrom={dateRange.from}
                        dateTo={dateRange.to}
                        onDateRangeChange={handleDateRangeChange}
                        isRealTimeActive={isRealTime}
                        onRealTimeToggle={handleRealTimeToggle}
                    />
                </Box>
            </Box>
            
            <Grid container spacing={2} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard 
                        title={t('gamification.config.total_supply', 'Total Supply')} 
                        value={economy?.totalCirculation} 
                        icon={<CoinIcon />} 
                        color="#f1c40f" 
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard 
                        title={t('gamification.config.total_xp', 'Total XP')} 
                        value={economy?.totalLifetimeMinted} 
                        icon={<XPIcon />} 
                        color="#9b59b6" 
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard 
                        title={t('gamification.config.minted_period', 'Minted (Period)')} 
                        value={economy?.flowStats?.minted_period} 
                        icon={<MintIcon />} 
                        color="#2ecc71" 
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard 
                        title={t('gamification.config.burned_period', 'Burned (Period)')} 
                        value={economy?.flowStats?.burned_period} 
                        icon={<BurnIcon />} 
                        color="#e74c3c" 
                    />
                </Grid>
            </Grid>

            {economy?.dailyStats && economy.dailyStats.length > 0 && (
                <Card variant="outlined" sx={{ mb: 4 }}>
                    <CardContent>
                        <Typography variant="subtitle2" gutterBottom>
                            {t('gamification.config.daily_movements', 'Daily Movements')}
                        </Typography>
                        <Box sx={{ width: '100%', height: 300, mt: 2 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={economy.dailyStats}
                                    margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis 
                                        dataKey="date" 
                                        tickFormatter={(val) => val.slice(5)} 
                                        fontSize={12}
                                        tick={{ fill: theme.palette.text.secondary }}
                                    />
                                    <YAxis 
                                        fontSize={12}
                                        tick={{ fill: theme.palette.text.secondary }}
                                    />
                                    <Tooltip 
                                        contentStyle={{ 
                                            backgroundColor: theme.palette.background.paper,
                                            border: `1px solid ${theme.palette.divider}`,
                                            borderRadius: '8px'
                                        }}
                                        labelFormatter={(label) => new Date(label).toLocaleDateString()}
                                    />
                                    <Legend />
                                    <Bar 
                                        dataKey="minted" 
                                        name={t('gamification.config.minted_label', 'Minted')} 
                                        fill="#2ecc71" 
                                        radius={[4, 4, 0, 0]} 
                                    />
                                    <Bar 
                                        dataKey="burned" 
                                        name={t('gamification.config.burned_label', 'Burned')} 
                                        fill="#e74c3c" 
                                        radius={[4, 4, 0, 0]} 
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </Box>
                    </CardContent>
                </Card>
            )}

            <Divider sx={{ mb: 4 }} />

            <Card variant="outlined" sx={{ mb: 3 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" color="primary">
                            {t('gamification.config.tab_title')}
                        </Typography>
                        <FormControlLabel
                            control={
                                <Switch 
                                    checked={localConfig.enabled || false} 
                                    onChange={(e) => handleChange('enabled', e.target.checked)}
                                    color="success"
                                />
                            }
                            label={t('gamification.config.enable_module')}
                        />
                    </Box>
                    <Divider sx={{ mb: 3 }} />

                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                        {t('gamification.config.currency_settings')}
                    </Typography>
                    
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={4}>
                            <CustomTextField 
                                label={t('gamification.config.currency_name')} 
                                value={localConfig.currency?.name || ''}
                                onChange={(e) => handleCurrencyChange('name', e.target.value)}
                                fullWidth
                                helperText={t('gamification.config.currency_name_help', 'Ex: Coins, Points')}
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <CustomTextField 
                                label={t('gamification.config.currency_singular')} 
                                value={localConfig.currency?.singularName || ''}
                                onChange={(e) => handleCurrencyChange('singularName', e.target.value)}
                                fullWidth
                                helperText={t('gamification.config.currency_singular_help', 'Ex: Coin, Point')}
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <CustomTextField 
                                label={t('gamification.config.currency_symbol')} 
                                value={localConfig.currency?.symbol || ''}
                                onChange={(e) => handleCurrencyChange('symbol', e.target.value)}
                                fullWidth
                                helperText={t('gamification.config.currency_symbol_help', 'Ex: 💎, 🪙, $')}
                            />
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button 
                    variant="contained" 
                    startIcon={loading ? null : <SaveIcon />} 
                    onClick={() => onSave(localConfig)}
                    disabled={loading}
                    size="large"
                >
                    {loading ? <CircularProgress size={24} color="inherit" /> : t('common.save', 'Save')}
                </Button>
            </Box>
        </Box>
    );
};

export default GamificationConfigTab;