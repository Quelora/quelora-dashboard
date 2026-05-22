/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Dialog, DialogTitle, DialogContent, IconButton, Tabs, Tab, Box,
    CircularProgress, Typography, Grid, Paper, List, TextField,
    TablePagination, Link, Alert, Avatar, Stack, Button, Chip, TableRow, TableCell
} from '@mui/material';
import {
    Close as CloseIcon, Search as SearchIcon, Comment as CommentIcon,
    ThumbUp as ThumbUpIcon, Reply as ReplyIcon, Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon, Autorenew as AutoRenewIcon,
    VerifiedUser as ReputationIcon
} from '@mui/icons-material';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { 
    getUserCommentStats, getCommentsListByUser, getUserNolanAnalysis, getUserReputationLogs 
} from '../../api/users';
import useDebounce from '../../hooks/useDebounce';
import StatsCard from '../Dashboard/StatsCard';
import DateRangeSelector from '../Common/DateRangeSelector';
import NolanChart from './NolanChart';
import PaginatedTable from '../Common/PaginatedTable';

const POLL_INTERVAL = 5000;

const TabPanel = (props) => {
    const { children, value, index, ...other } = props;
    return (
        <div role="tabpanel" hidden={value !== index} {...other} style={{height: '100%'}}>
            {value === index && <Box sx={{ p: { xs: 1, sm: 3 }, height: '100%' }}>{children}</Box>}
        </div>
    );
};

const getDefaultDateRange = () => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);
    const dateTo = new Date(today);
    dateTo.setHours(23, 59, 59, 999);
    return { dateFrom: thirtyDaysAgo, dateTo: dateTo };
};

const UserCommentsModal = ({ open, onClose, user, cid, initialTab = 0 }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [tab, setTab] = useState(initialTab);
    
    const [stats, setStats] = useState(null);
    const [loadingStats, setLoadingStats] = useState(false);
    
    const [comments, setComments] = useState([]);
    const [loadingList, setLoadingList] = useState(false);
    const [listPagination, setListPagination] = useState({ page: 0, limit: 10, totalItems: 0 });
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 500);
    
    const [nolanData, setNolanData] = useState(null);
    const [loadingNolan, setLoadingNolan] = useState(false);
    const [nolanLimit, setNolanLimit] = useState(50);
    const [nolanError, setNolanError] = useState(null);

    const [reputationLogs, setReputationLogs] = useState([]);
    const [reputationPagination, setReputationPagination] = useState({ page: 0, limit: 10, total: 0 });
    const [loadingReputation, setLoadingReputation] = useState(false);
    const [currentTrust, setCurrentTrust] = useState({ score: 0, level: 0 });

    const [error, setError] = useState(null);
    const [dateRange, setDateRange] = useState(getDefaultDateRange());
    const [isRealTimeActive, setIsRealTimeActive] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(new Date());
    const lastStatsReq = useRef({ params: '', time: 0 });

    useEffect(() => {
        if (open) setTab(initialTab);
    }, [initialTab, open]);

    const handleTabChange = (event, newValue) => {
        setTab(newValue);
        setError(null);
    };

    const fetchUserStats = useCallback(async (isBackground = false) => {
        if (!open || !user || !cid) return;
        const currentParams = JSON.stringify({ uid: user.author, cid, from: dateRange.dateFrom, to: dateRange.dateTo });
        const now = Date.now();
        if (lastStatsReq.current.params === currentParams && (now - lastStatsReq.current.time) < (isBackground ? 4000 : 1000)) return;
        lastStatsReq.current = { params: currentParams, time: now };

        if (!isBackground) setLoadingStats(true);
        try {
            const response = await getUserCommentStats(user.author, cid, dateRange);
            if (response.success) {
                setStats(response.data.stats);
                setLastUpdated(new Date());
            }
        } catch (err) { if (!isBackground) setError(err.toString()); } 
        finally { if (!isBackground) setLoadingStats(false); }
    }, [open, user, cid, dateRange]);

    const fetchNolanAnalysis = useCallback(async () => {
        if (!user?.author || !cid) return;
        setLoadingNolan(true);
        try {
            const data = await getUserNolanAnalysis(user.author, cid, nolanLimit);
            setNolanData({ x: data.economic_score, y: data.personal_score, label: user?.name });
        } catch (err) { setNolanError(err.message); } 
        finally { setLoadingNolan(false); }
    }, [user, cid, nolanLimit]);

    useEffect(() => {
        if (open && tab === 1 && user && cid) {
            setLoadingList(true);
            getCommentsListByUser(user.author, cid, { page: listPagination.page + 1, limit: listPagination.limit, search: debouncedSearchTerm })
                .then(res => {
                    setComments(res.data.comments);
                    setListPagination(prev => ({ ...prev, totalItems: res.data.pagination.totalItems }));
                })
                .catch(err => setError(err.toString()))
                .finally(() => setLoadingList(false));
        }
    }, [open, tab, user, cid, listPagination.page, listPagination.limit, debouncedSearchTerm]);

    const fetchReputation = useCallback(async () => {
        if (!user?.author || !cid) return;
        setLoadingReputation(true);
        try {
            const res = await getUserReputationLogs(user.author, cid, reputationPagination.page + 1, reputationPagination.limit);
            if (res.success) {
                setReputationLogs(res.data.logs);
                setCurrentTrust({ score: res.data.currentScore, level: res.data.currentLevel });
                setReputationPagination(prev => ({ ...prev, total: res.data.pagination.totalItems }));
            }
        } catch (err) {
            setError(err.toString());
        } finally {
            setLoadingReputation(false);
        }
    }, [user, cid, reputationPagination.page, reputationPagination.limit]);

    useEffect(() => {
        if (open && tab === 3) fetchReputation();
    }, [open, tab, fetchReputation]);

    const renderReputationRow = (log) => (
        <TableRow key={log._id} hover>
            <TableCell>{new Date(log.created_at).toLocaleString()}</TableCell>
            <TableCell>
                <Typography variant="body2" fontWeight="bold">{log.event_type}</Typography>
                {log.reason && <Typography variant="caption" color="textSecondary">{log.reason}</Typography>}
            </TableCell>
            <TableCell>
                <Chip label={log.source_type} size="small" variant="outlined" />
                {log.entity_id && <Typography variant="caption" display="block" sx={{fontFamily:'monospace', fontSize: '0.7rem'}}>{log.entity_id.toString().substring(0,8)}...</Typography>}
            </TableCell>
            <TableCell align="right">
                <Typography 
                    fontWeight="bold" 
                    sx={{ color: log.delta > 0 ? 'success.main' : 'error.main' }}
                >
                    {log.delta > 0 ? '+' : ''}{log.delta}
                </Typography>
            </TableCell>
        </TableRow>
    );

    useEffect(() => {
        if (open && user && cid) fetchUserStats(false);
    }, [fetchUserStats]);

    useEffect(() => {
        if (!isRealTimeActive || !open || tab !== 0) return;
        const intervalId = setInterval(() => fetchUserStats(true), POLL_INTERVAL);
        return () => clearInterval(intervalId);
    }, [isRealTimeActive, open, tab, fetchUserStats]);

    const handleModalClose = () => {
        setIsRealTimeActive(false);
        setTab(0);
        onClose();
    };

    const handleViewPost = (postId) => {
        navigate(`/post/${postId}/comments`);
        handleModalClose();
    };

    const chartData = useMemo(() => {
        if (!stats?.chartData) return [];
        const data = stats.chartData.map(item => ({ date: new Date(item.date).toLocaleDateString(), count: item.count }));
        return data.length === 1 ? [...data, { date: ' ', count: data[0].count }] : data;
    }, [stats]);

    return (
        <Dialog open={open} onClose={handleModalClose} fullWidth maxWidth="md">
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar src={user?.picture}>{user?.name?.charAt(0)}</Avatar>
                    <Box>
                        <Typography variant="h6" sx={{ lineHeight: 1.2 }}>{user?.name || t('users.noName')}</Typography>
                        <Typography variant="caption" color="text.secondary">{user?.author}</Typography>
                    </Box>
                </Box>
                <IconButton onClick={handleModalClose}><CloseIcon /></IconButton>
            </DialogTitle>
            
            <DialogContent dividers sx={{ p: 0 }}>
                <Tabs value={tab} onChange={handleTabChange} variant="fullWidth" sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tab icon={<AutoRenewIcon />} iconPosition="start" label={t('users.statsTab')} />
                    <Tab icon={<CommentIcon />} iconPosition="start" label={t('users.commentsListTab')} />
                    <Tab icon={<SearchIcon />} iconPosition="start" label={t('users.nolanTab')} />
                    <Tab icon={<ReputationIcon />} iconPosition="start" label={t('profileAnalytics.reputation')} />
                </Tabs>

                <TabPanel value={tab} index={0}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                        <DateRangeSelector 
                            onRangeChange={(newRange) => { setIsRealTimeActive(false); setDateRange(newRange); }} 
                            dateFrom={dateRange.dateFrom} dateTo={dateRange.dateTo} 
                            isRealTimeActive={isRealTimeActive} onRealTimeToggle={setIsRealTimeActive}
                        />
                    </Box>
                    {loadingStats && !stats ? <CircularProgress /> : (
                        <Stack spacing={3}>
                            <Grid container spacing={2}>
                                <Grid xs={12} sm={4}>
                                    <StatsCard title="users.totalComments" value={stats?.totalComments} icon={<CommentIcon />} />
                                </Grid>
                                <Grid xs={12} sm={4}>
                                    <StatsCard title="users.likesReceived" value={stats?.totalLikesReceived} icon={<ThumbUpIcon />} />
                                </Grid>
                                <Grid xs={12} sm={4}>
                                    <StatsCard title="users.repliesReceived" value={stats?.totalRepliesReceived} icon={<ReplyIcon />} />
                                </Grid>
                            </Grid>
                            <Box sx={{ height: 300 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <RechartsTooltip />
                                        <Area type="monotone" dataKey="count" stroke="#8884d8" fill="#8884d8" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </Box>
                        </Stack>
                    )}
                </TabPanel>

                <TabPanel value={tab} index={1}>
                    <TextField fullWidth size="small" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} sx={{mb: 2}} />
                    {loadingList ? <CircularProgress /> : (
                        <>
                            <List>
                                {comments.map(c => (
                                    <Paper key={c._id} sx={{ p: 2, mb: 1 }}>
                                        <Typography variant="body2">{c.text}</Typography>
                                        <Typography variant="caption" color="text.secondary">{new Date(c.created_at).toLocaleString()}</Typography>
                                        <Link component="button" variant="caption" onClick={() => handleViewPost(c.post._id)} sx={{ display: 'block', mt: 0.5 }}>View Post</Link>
                                    </Paper>
                                ))}
                            </List>
                            <TablePagination
                                component="div" count={listPagination.totalItems} page={listPagination.page} rowsPerPage={listPagination.limit}
                                onPageChange={(e, p) => setListPagination(prev => ({...prev, page: p}))}
                                onRowsPerPageChange={(e) => setListPagination(prev => ({...prev, limit: e.target.value, page: 0}))}
                                labelRowsPerPage={t('common.rowsPerPage')}
                            />
                        </>
                    )}
                </TabPanel>

                <TabPanel value={tab} index={2}>
                    <Box sx={{display:'flex', gap: 2, alignItems: 'center', mb: 2}}>
                        <TextField type="number" size="small" value={nolanLimit} onChange={e => setNolanLimit(e.target.value)} label={t('users.nolan.commentLimit')} />
                        <Button variant="contained" onClick={fetchNolanAnalysis}>{t('users.nolan.generateChart')}</Button>
                    </Box>
                    {loadingNolan ? <CircularProgress /> : nolanData && <NolanChart data={nolanData} user={user} />}
                </TabPanel>

                <TabPanel value={tab} index={3}>
                    <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'rgba(0,0,0,0.02)', p: 2, borderRadius: 1 }}>
                        <Box>
                            <Typography variant="overline" color="text.secondary">{t('profileAnalytics.current_score')}</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                                <Typography variant="h4" color={currentTrust.score >= 0 ? "success.main" : "error.main"}>
                                    {currentTrust.score.toFixed(2)}
                                </Typography>
                                <Typography variant="caption">pts</Typography>
                            </Box>
                        </Box>
                        <Chip label={`${t('users.trust_level')} ${currentTrust.level}`} color="primary" variant="outlined" />
                    </Box>

                    <PaginatedTable
                        headers={[
                            { id: 'created_at', labelKey: 'profileAnalytics.date', numeric: false },
                            { id: 'event_type', labelKey: 'profileAnalytics.event_type', numeric: false },
                            { id: 'source', labelKey: 'profileAnalytics.source', numeric: false },
                            { id: 'delta', labelKey: 'profileAnalytics.delta', numeric: true },
                        ]}
                        data={reputationLogs}
                        loading={loadingReputation}
                        error={error}
                        pagination={reputationPagination}
                        filters={{ sort: 'created_at', order: 'desc' }}
                        fetchData={fetchReputation}
                        handlePageChange={(e, p) => setReputationPagination(prev => ({ ...prev, page: p }))}
                        handleLimitChange={(e) => setReputationPagination(prev => ({ ...prev, limit: e.target.value, page: 0 }))}
                        handleSort={() => {}}
                        renderRow={renderReputationRow}
                    />
                </TabPanel>
            </DialogContent>
        </Dialog>
    );
};

export default UserCommentsModal;