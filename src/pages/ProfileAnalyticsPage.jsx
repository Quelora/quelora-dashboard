// ./src/pages/ProfileAnalyticsPage.jsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
    Box, Typography, Paper, TableCell, TableRow, Avatar, 
    FormControl, InputLabel, Select, MenuItem, Stack, 
    CircularProgress, IconButton, FormGroup, FormControlLabel, Checkbox
} from '@mui/material';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, 
    Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from 'recharts';
import { 
    QueryStats as QueryStatsIcon,
    Autorenew as AutoRenewIcon 
} from '@mui/icons-material';
import { fetchProfileAnalytics } from '../api/stats';
import { loadClientsFromSession } from '../api/auth';
import PaginatedTable from '../components/Common/PaginatedTable';
import DateRangeSelector from '../components/Common/DateRangeSelector';
import UserCommentsModal from '../components/User/UserCommentsModal';

const POLL_INTERVAL = 5000; // 5 Segundos

const getLast7DaysRange = () => {
    const dateTo = new Date();
    const dateFrom = new Date(dateTo);
    dateFrom.setDate(dateFrom.getDate() - 6);
    dateFrom.setHours(0, 0, 0, 0);
    dateTo.setHours(23, 59, 59, 999);
    return { dateFrom, dateTo };
};

const ProfileAnalyticsPage = () => {
    const { t } = useTranslation();
    const [clientList, setClientList] = useState([]);
    const [selectedCid, setSelectedCid] = useState('');
    const [dateRange, setDateRange] = useState(getLast7DaysRange());
    const [modalUser, setModalUser] = useState(null);

    const [profiles, setProfiles] = useState([]);
    const [timeSeries, setTimeSeries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    const [pagination, setPagination] = useState({
        page: 0,
        limit: 10,
        total: 0
    });
    
    const [filters, setFilters] = useState({
        sort: 'commentsAdded',
        order: 'desc'
    });

    const [visibleSeries, setVisibleSeries] = useState({
        commentsAdded: true,
        likesGiven: true,
        repliesAdded: true
    });

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

    const fetchData = useCallback(async (isBackground = false) => {
        if (!selectedCid) return;

        const params = {
            page: pagination.page + 1,
            limit: pagination.limit,
            sortBy: filters.sort,
            sortOrder: filters.order,
            dateFrom: dateRange.dateFrom,
            dateTo: dateRange.dateTo
        };

        const currentParamsStr = JSON.stringify({ cid: selectedCid, ...params });
        const now = Date.now();
        const threshold = isBackground ? 4000 : 1000; 

        if (lastFetchReq.current.params === currentParamsStr && (now - lastFetchReq.current.time) < threshold) {
            return;
        }
        lastFetchReq.current = { params: currentParamsStr, time: now };

        if (!isBackground) {
            setLoading(true);
            setError(null);
        }

        try {
            const response = await fetchProfileAnalytics(selectedCid, params);
            const normalizedSeries = Array.isArray(response.timeSeries)
                ? response.timeSeries.map(item => ({
                    date: new Date(item.date || item.day || item._id || Date.now())
                        .toISOString()
                        .split('T')[0],
                    commentsAdded: Number(item.commentsAdded ?? item.comments ?? 0),
                    likesGiven: Number(item.likesGiven ?? item.likes ?? 0),
                    repliesAdded: Number(item.repliesAdded ?? item.replies ?? 0)
                }))
                : [];

            setProfiles(response.profiles || []);
            setTimeSeries(normalizedSeries);
            setPagination(prev => ({
                ...prev,
                total: response.pagination?.totalItems || 0
            }));
            setLastUpdated(new Date());
        } catch (err) {
            console.error('Error fetching analytics:', err);
            if (!isBackground) {
                setError(err.message || 'Error fetching profile analytics');
                setProfiles([]);
                setTimeSeries([]);
            }
        } finally {
            if (!isBackground) setLoading(false);
        }
    }, [
        selectedCid,
        pagination.page,
        pagination.limit,
        filters.sort,
        filters.order,
        dateRange.dateFrom,
        dateRange.dateTo
    ]);

    useEffect(() => {
        fetchData(false);
    }, [fetchData]);

    useEffect(() => {
        if (!isRealTimeActive) return;
        const intervalId = setInterval(() => {
            fetchData(true);
        }, POLL_INTERVAL);
        return () => clearInterval(intervalId);
    }, [isRealTimeActive, fetchData]);

    const handleRealTimeToggle = useCallback((isActive) => {
        setIsRealTimeActive(isActive);
        if (isActive) {
            lastFetchReq.current.time = 0;
            fetchData(false);
        }
    }, [fetchData]);

    const chartData = useMemo(() => {
        const data = Array.isArray(timeSeries) ? timeSeries : [];
        if (data.length === 1) {
            const firstDate = new Date(data[0].date);
            const padDate = new Date(firstDate.getTime() + 86400000).toISOString().split('T')[0];
            return [
                { ...data[0] },
                { date: padDate, commentsAdded: data[0].commentsAdded, likesGiven: data[0].likesGiven, repliesAdded: data[0].repliesAdded }
            ];
        }
        return data;
    }, [timeSeries]);

    const handleDateRangeChange = (newRange) => {
        setIsRealTimeActive(false);
        setDateRange(newRange);
        setPagination(prev => ({ ...prev, page: 0 }));
    };

    const handleCidChange = (event) => {
        setIsRealTimeActive(false);
        setSelectedCid(event.target.value);
        setPagination(prev => ({ ...prev, page: 0 }));
    };

    const handleViewUserStats = (profile) => {
        setModalUser({
            author: profile.author,
            name: profile.profile?.name || t('users.noName'),
            picture: profile.profile?.picture
        });
    };
    
    const handlePageChange = (event, newPage) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    };

    const handleLimitChange = (event) => {
        setPagination(prev => ({ ...prev, limit: parseInt(event.target.value, 10), page: 0 }));
    };

    const handleSort = (key) => {
        setFilters(prev => ({
            ...prev,
            sort: key,
            order: prev.sort === key ? (prev.order === 'desc' ? 'asc' : 'desc') : 'desc'
        }));
        setPagination(prev => ({ ...prev, page: 0 }));
    };

    const toggleSeries = (key) => {
        setVisibleSeries(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const headers = [
        { id: 'user', labelKey: 'profileAnalytics.user', numeric: false, sortable: false },
        { id: 'commentsAdded', labelKey: 'profileAnalytics.comments', numeric: true, sortable: true },
        { id: 'repliesAdded', labelKey: 'profileAnalytics.replies', numeric: true, sortable: true },
        { id: 'likesGiven', labelKey: 'profileAnalytics.likesGiven', numeric: true, sortable: true },
        { id: 'sharesGiven', labelKey: 'profileAnalytics.sharesGiven', numeric: true, sortable: true },
        { id: 'likesReceived', labelKey: 'profileAnalytics.likesReceived', numeric: true, sortable: true },
        { id: 'repliesReceived', labelKey: 'profileAnalytics.repliesReceived', numeric: true, sortable: true },
        { id: 'toxicityScoreAvg', labelKey: 'profileAnalytics.avgToxicity', numeric: true, sortable: true },
    ];

    const renderProfileRow = (profile) => {
        const user = profile.profile || {};
        const displayName = user.name || t('users.noName');
        const toxicity = (profile.toxicityScoreAvg || 0).toFixed(2);

        return (
            <TableRow hover key={profile.author}>
                <TableCell>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <Avatar
                            src={user.picture || undefined}
                            sx={{ width: 32, height: 32, cursor: 'pointer' }}
                            onClick={() => handleViewUserStats(profile)}
                        >
                            {!user.picture && (displayName.charAt(0) || 'U')}
                        </Avatar>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {displayName}
                        </Typography>
                        <IconButton size="small" onClick={() => handleViewUserStats(profile)} sx={{ p: 0.25, ml: 0.5 }} title={t('users.viewComments')}>
                            <QueryStatsIcon fontSize="small"/>
                        </IconButton>
                    </Stack>
                </TableCell>
                <TableCell align="right">{profile.commentsAdded || 0}</TableCell>
                <TableCell align="right">{profile.repliesAdded || 0}</TableCell>
                <TableCell align="right">{profile.likesGiven || 0}</TableCell>
                <TableCell align="right">{profile.sharesGiven || 0}</TableCell>
                <TableCell align="right">{profile.likesReceived || 0}</TableCell>
                <TableCell align="right">{profile.repliesReceived || 0}</TableCell>
                <TableCell align="right">{toxicity}%</TableCell>
            </TableRow>
        );
    };

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
                    <Typography variant="h4">{t('profileAnalytics.title')}</Typography>
                    <Typography variant="body1" color="text.secondary">{t('profileAnalytics.subtitle')}</Typography>
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
                justifyContent: 'flex-end', 
                alignItems: 'center', 
                mb: 3, 
                gap: 2,
                flexWrap: 'wrap'
            }}>
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
            <Paper sx={{ p: 2, height: 360, width: '100%', mb: 3 }}>
                <Typography variant="h6" gutterBottom>{t('profileAnalytics.activityOverTime')}</Typography>

                <FormGroup row sx={{ mb: 1 }}>
                    {Object.entries(visibleSeries).map(([key, value]) => (
                        <FormControlLabel
                            key={key}
                            control={
                                <Checkbox 
                                    checked={value} 
                                    onChange={() => toggleSeries(key)} 
                                />
                            }
                            label={t(`profileAnalytics.${key}`)}
                        />
                    ))}
                </FormGroup>

                {loading && !isRealTimeActive && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                        <CircularProgress />
                    </Box>
                )}
                {!loading && chartData.length === 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                        <Typography>{t('common.no_data_available')}</Typography>
                    </Box>
                )}
                {(chartData.length > 0) && (
                    <Box sx={{ height: 260, width: '100%', opacity: (loading && isRealTimeActive) ? 0.7 : 1, transition: 'opacity 0.3s' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" fontSize="0.75rem" />
                                <YAxis allowDecimals={false} fontSize="0.75rem" />
                                <RechartsTooltip />
                                <Legend />
                                {visibleSeries.commentsAdded && (
                                    <Area type="monotone" dataKey="commentsAdded" name={t('profileAnalytics.comments')} stroke="#8884d8" fill="#8884d8" opacity={0.6} />
                                )}
                                {visibleSeries.likesGiven && (
                                    <Area type="monotone" dataKey="likesGiven" name={t('profileAnalytics.likesGiven')} stroke="#82ca9d" fill="#82ca9d" opacity={0.6} />
                                )}
                                {visibleSeries.repliesAdded && (
                                    <Area type="monotone" dataKey="repliesAdded" name={t('profileAnalytics.replies')} stroke="#ffc658" fill="#ffc658" opacity={0.6} />
                                )}
                            </AreaChart>
                        </ResponsiveContainer>
                    </Box>
                )}
            </Paper>

            <PaginatedTable
                headers={headers}
                data={profiles}
                loading={loading && !isRealTimeActive} 
                error={error}
                pagination={pagination}
                filters={filters}
                fetchData={() => fetchData(false)}
                handleSort={handleSort}
                handlePageChange={handlePageChange}
                handleLimitChange={handleLimitChange}
                renderRow={renderProfileRow}
            />

            {modalUser && (
                <UserCommentsModal
                    open={Boolean(modalUser)}
                    onClose={() => setModalUser(null)}
                    user={modalUser}
                    cid={selectedCid}
                />
            )}
        </Box>
    );
};

export default ProfileAnalyticsPage;