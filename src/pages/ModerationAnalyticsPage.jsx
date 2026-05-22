/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

// ./src/pages/ModerationAnalyticsPage.jsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography, Paper, FormControl, InputLabel, Select, MenuItem, Grid, Stack, CircularProgress, Alert } from '@mui/material';
import {
    DataUsage as TokenIcon,
    Input as PromptIcon,
    CheckCircleOutline as CompletionIcon,
    Autorenew as AutoRenewIcon
} from '@mui/icons-material';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { fetchModerationAnalytics } from '../api/stats';
import { loadClientsFromSession } from '../api/auth';
import DateRangeSelector from '../components/Common/DateRangeSelector';
import StatsCard from '../components/Dashboard/StatsCard';

const POLL_INTERVAL = 5000; // 5 Segundos

const getLast7DaysRange = () => {
    const dateTo = new Date();
    const dateFrom = new Date(dateTo);
    dateFrom.setDate(dateFrom.getDate() - 6);
    dateFrom.setHours(0, 0, 0, 0);
    dateTo.setHours(23, 59, 59, 999);
    return { dateFrom, dateTo };
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];

const ModerationAnalyticsPage = () => {
    const { t } = useTranslation();
    const [clientList, setClientList] = useState([]);
    const [selectedCid, setSelectedCid] = useState('');
    const [dateRange, setDateRange] = useState(getLast7DaysRange());
    const [taskType, setTaskType] = useState('all');
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Estado Real-Time
    const [isRealTimeActive, setIsRealTimeActive] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(new Date());

    // Ref para deduplicación de peticiones (throttling)
    const lastFetchReq = useRef({ params: '', time: 0 });

    useEffect(() => {
        const clients = loadClientsFromSession() || [];
        setClientList(clients);
        if (clients.length > 0) {
            setSelectedCid(clients[0].cid);
        }
    }, []);

    const loadStats = useCallback(async (isBackground = false) => {
        if (!selectedCid) return;

        // Deduplicación para evitar ráfagas
        const currentParams = JSON.stringify({ 
            cid: selectedCid, 
            from: dateRange.dateFrom, 
            to: dateRange.dateTo, 
            task: taskType 
        });
        const now = Date.now();
        const threshold = isBackground ? 4000 : 1000;

        if (lastFetchReq.current.params === currentParams && (now - lastFetchReq.current.time) < threshold) {
            return;
        }
        lastFetchReq.current = { params: currentParams, time: now };

        if (!isBackground) {
            setLoading(true);
            setError(null);
        }

        try {
            const data = await fetchModerationAnalytics(selectedCid, dateRange.dateFrom, dateRange.dateTo, 'all', taskType);
            setStats(data);
            setLastUpdated(new Date());
        } catch (err) {
            console.error('Error fetching moderation stats:', err);
            if (!isBackground) {
                setError(err.message || 'Error fetching moderation stats');
                setStats(null);
            }
        } finally {
            if (!isBackground) setLoading(false);
        }
    }, [selectedCid, dateRange.dateFrom, dateRange.dateTo, taskType]);

    // Efecto: Carga inicial y cambios de filtro
    useEffect(() => {
        loadStats(false);
    }, [loadStats]);

    // Efecto: Intervalo Real-Time
    useEffect(() => {
        if (!isRealTimeActive) return;

        const intervalId = setInterval(() => {
            loadStats(true); // Carga en background
        }, POLL_INTERVAL);

        return () => clearInterval(intervalId);
    }, [isRealTimeActive, loadStats]);

    const handleRealTimeToggle = useCallback((isActive) => {
        setIsRealTimeActive(isActive);
        if (isActive) {
            lastFetchReq.current.time = 0; // Reset throttle
            loadStats(false); 
        }
    }, [loadStats]);

    const handleDateRangeChange = (newRange) => {
        setIsRealTimeActive(false);
        setDateRange(newRange);
    };

    const handleCidChange = (e) => {
        setIsRealTimeActive(false);
        setSelectedCid(e.target.value);
    };

    const handleTaskTypeChange = (e) => {
        setIsRealTimeActive(false);
        setTaskType(e.target.value);
    };

    const totals = stats?.totals || {};
    
    const byTask = useMemo(() => {
        const raw = stats?.byTask;
        if (Array.isArray(raw)) return raw;
        if (typeof raw === 'object' && raw !== null) {
            return Object.entries(raw).map(([key, value]) => ({
                _id: key,
                totalTokens: value.totalTokens || 0
            }));
        }
        return [];
    }, [stats?.byTask]);

    const chartData = useMemo(() => {
        const rawData = stats?.timeSeries || [];
        if (!Array.isArray(rawData) || rawData.length === 0) return [];

        return rawData.map(item => ({
            date: item.date,
            promptTokens: item.promptTokens || 0,
            completionTokens: item.completionTokens || 0,
            totalTokens: item.totalTokens || 0
        }));
    }, [stats?.timeSeries]);

    return (
        <Box sx={{ p: 2 }}>
            {/* --- HEADER PRINCIPAL --- */}
            <Box className="client-header" sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: {xs: 'flex-start', md: 'center'}, 
                mb: 2,
                flexDirection: {xs: 'column', md: 'row'},
                gap: 2
            }}>
                <Box>
                    <Typography variant="h4">{t('moderationAnalytics.title')}</Typography>
                    <Typography variant="body1" color="text.secondary">{t('moderationAnalytics.subtitle')}</Typography>
                </Box>
                
                {/* Selector de Cliente */}
                {clientList.length > 0 && (
                    <FormControl size="small" sx={{ minWidth: 250 }}>
                        <InputLabel>{t('dashboard.select_client')}</InputLabel>
                        <Select
                            value={selectedCid || ''}
                            onChange={handleCidChange}
                            label={t('dashboard.select_client')}
                        >
                            {clientList.map(client => (
                                <MenuItem key={client.cid} value={client.cid}>
                                    {client.description || client.cid}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                )}
            </Box>

            {/* --- TOOLBAR SECUNDARIA --- */}
            <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-end', 
                mb: 3, 
                flexWrap: 'wrap',
                gap: 2 
            }}>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>{t('moderationAnalytics.filterByTask')}</InputLabel>
                    <Select
                        value={taskType}
                        onChange={handleTaskTypeChange}
                        label={t('moderationAnalytics.filterByTask')}
                    >
                        <MenuItem value="all">{t('moderationAnalytics.allTasks')}</MenuItem>
                        <MenuItem value="moderation">{t('moderationAnalytics.task')}: moderation</MenuItem>
                        <MenuItem value="nolan_analysis">{t('moderationAnalytics.task')}: nolan_analysis</MenuItem>
                    </Select>
                </FormControl>

                <Box sx={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1}}>
                    <DateRangeSelector
                        onRangeChange={handleDateRangeChange}
                        dateFrom={dateRange.dateFrom}
                        dateTo={dateRange.dateTo}
                        isRealTimeActive={isRealTimeActive}
                        onRealTimeToggle={handleRealTimeToggle}
                    />
                    <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                        {isRealTimeActive && (
                            <AutoRenewIcon color="primary" sx={{fontSize: 16, animation: 'spin 1s linear infinite', '@keyframes spin': { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' }}}}/>
                        )}
                        <Typography variant="caption" color="text.secondary">
                            {isRealTimeActive 
                                ? t('dashboard.statistics.realtime_active', { interval: 5 }) 
                                : t('dashboard.statistics.last_updated', {time: lastUpdated?.toLocaleTimeString() || '--'})
                            }
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {/* --- CONTENIDO PRINCIPAL --- */}
            {loading && !isRealTimeActive && (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                </Box>
            )}

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {!loading && !stats && !error && (
                <Alert severity="info">{t('common.no_data_available')}</Alert>
            )}

            {(stats || (loading && isRealTimeActive)) && (
                <Grid container spacing={3} sx={{ opacity: (loading && isRealTimeActive) ? 0.7 : 1, transition: 'opacity 0.3s' }}>
                    {/* Columna 1: Indicadores */}
                    <Grid item xs={12} md={4} sx={{ minWidth: 300 }}>
                        <Stack spacing={2}>
                            <StatsCard title="moderationAnalytics.totalTokens" value={totals.totalTokens?.toLocaleString() || '0'} icon={<TokenIcon />} />
                            <StatsCard title="moderationAnalytics.promptTokens" value={totals.promptTokens?.toLocaleString() || '0'} icon={<PromptIcon />} />
                            <StatsCard title="moderationAnalytics.completionTokens" value={totals.completionTokens?.toLocaleString() || '0'} icon={<CompletionIcon />} />
                        </Stack>
                    </Grid>

                    {/* Columna 2: Gráfico de Área */}
                    <Grid item xs={12} md={4} sx={{ minWidth: 300 }}>
                        <Paper sx={{ p: 2, width: '100%' }}>
                            <Typography variant="h6" gutterBottom>{t('moderationAnalytics.tokensOverTime')}</Typography>
                            {chartData.length === 0 ? (
                                <Typography color="text.secondary" sx={{ textAlign: 'center', height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {t('common.no_data_available')}
                                </Typography>
                            ) : (
                                <ResponsiveContainer width="100%" height={380}>
                                    <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis 
                                            dataKey="date" 
                                            tick={{ fontSize: 12 }}
                                            tickFormatter={(value) => {
                                                const date = new Date(value);
                                                return `${date.getMonth() + 1}/${date.getDate()}`;
                                            }}
                                        />
                                        <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                                        <RechartsTooltip 
                                            formatter={(value) => value.toLocaleString()}
                                            labelFormatter={(label) => {
                                                const date = new Date(label);
                                                return date.toLocaleDateString();
                                            }}
                                        />
                                        <Legend />
                                        <Area
                                            type="monotone"
                                            dataKey="promptTokens"
                                            name={t('moderationAnalytics.promptTokens')}
                                            stackId="1"
                                            stroke="#8884d8"
                                            fill="#8884d8"
                                            strokeWidth={2}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="completionTokens"
                                            name={t('moderationAnalytics.completionTokens')}
                                            stackId="1"
                                            stroke="#82ca9d"
                                            fill="#82ca9d"
                                            strokeWidth={2}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </Paper>
                    </Grid>

                    {/* Columna 3: Gráfico de Pastel */}
                    <Grid item xs={12} md={4} sx={{ minWidth: 300 }}>
                        <Paper sx={{ p: 2, width: '100%' }}>
                            <Typography variant="h6" gutterBottom>{t('moderationAnalytics.tokensByTask')}</Typography>
                            {byTask.length === 0 ? (
                                <Typography color="text.secondary" sx={{ textAlign: 'center', height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {t('common.no_data_available')}
                                </Typography>
                            ) : (
                                <ResponsiveContainer width="100%" height={380}>
                                    <PieChart>
                                        <Pie
                                            data={byTask}
                                            dataKey="totalTokens"
                                            nameKey="_id"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={90}
                                            label={({ _id, totalTokens }) => `${_id}: ${totalTokens.toLocaleString()}`}
                                        >
                                            {byTask.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip formatter={(value) => value.toLocaleString()} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </Paper>
                    </Grid>
                </Grid>
            )}
        </Box>
    );
};

export default ModerationAnalyticsPage;