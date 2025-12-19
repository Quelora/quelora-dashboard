import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchPostListStats, fetchPostAnalytics } from '../api/stats';
import DateRangeSelector from '../components/Common/DateRangeSelector';
import PostStatsTable from '../components/Dashboard/PostStatsTable';
import PostTimeChart from '../components/Dashboard/PostTimeChart';
import PostGeoView from '../components/Dashboard/PostGeoView';
import useDebounce from '../hooks/useDebounce';
import { 
    Box, 
    Typography, 
    CircularProgress, 
    Tabs, 
    Tab, 
    Select,
    MenuItem,
    FormControl,
    InputLabel,
} from '@mui/material';
import { Autorenew as AutoRenewIcon } from '@mui/icons-material';
import { loadClientsFromSession } from '../api/auth';

const DEFAULT_PAGINATION_CONFIG = {
    page: 1,
    limit: 10,
    sortBy: 'commentCount', 
    sortOrder: 'desc',
    totalPosts: 0,
    totalPages: 0,
    currentPage: 1,
};

const POLL_INTERVAL = 5000; 

const getDefaultDateRange = () => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const dateTo = new Date(today);
    dateTo.setHours(23, 59, 59, 999);
    
    return {dateFrom: thirtyDaysAgo, dateTo: dateTo};
};

const TabPanel = (props) => {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`tabpanel-${index}`}
            aria-labelledby={`tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{pt: 2, minHeight: 400}}>
                    {children}
                </Box>
            )}
        </div>
    );
};

const PostStatsPage = () => {
    const { t } = useTranslation();
    
    // --- ESTADO DE CLIENTES ---
    const [clientList, setClientList] = useState([]);
    const [selectedCid, setSelectedCid] = useState('');

    const [postStats, setPostStats] = useState([]);
    const [pagination, setPagination] = useState(DEFAULT_PAGINATION_CONFIG);
    const [dateRange, setDateRange] = useState(getDefaultDateRange()); 
    const [loadingTable, setLoadingTable] = useState(true);

    const [selectedPostEntities, setSelectedPostEntities] = useState([]);
    const [analyzedPostsData, setAnalyzedPostsData] = useState({});
    const [loadingAnalytics, setLoadingAnalytics] = useState(false);
    
    const [currentTab, setCurrentTab] = useState(0); 
    const [chartMetric, setChartMetric] = useState('total'); 
    const [isRealTimeActive, setIsRealTimeActive] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(new Date());

    // Refs para deduplicación
    const lastListReq = useRef({ params: '', time: 0 });
    const lastAnalyticsReq = useRef({ params: '', time: 0 });
    
    const colors = useMemo(() => ['#4285F4', '#DB4437', '#F4B400', '#0F9D58', '#42B883'], []);

    const debouncedEntities = useDebounce(selectedPostEntities, 300);
    const debouncedDateRange = useDebounce(dateRange, 300);

    // --- CARGA INICIAL DE CLIENTES ---
    useEffect(() => {
        const clients = loadClientsFromSession() || [];
        setClientList(clients);
        if (clients.length > 0) {
            setSelectedCid(clients[0].cid);
        }
    }, []);

    useEffect(() => {
        document.title = t('dashboard.postStats.page_title');
    }, [t]);

    const handleCidChange = useCallback((newCid) => {
        setSelectedCid(newCid);
        setPagination(prev => ({...prev, currentPage: 1}));
        setSelectedPostEntities([]);
        setAnalyzedPostsData({});
    }, []);

    // --- FETCHING ---
    const fetchAnalytics = useCallback(async (entityIds, currentRange, isBackground = false) => {
        if (!entityIds || entityIds.length === 0 || !selectedCid || !currentRange.dateFrom || !currentRange.dateTo) {
            if (!isBackground) setAnalyzedPostsData({});
            return;
        }

        const currentParams = JSON.stringify({ cid: selectedCid, ids: entityIds, from: currentRange.dateFrom, to: currentRange.dateTo });
        const now = Date.now();
        const threshold = isBackground ? 4000 : 1000;
        
        if (lastAnalyticsReq.current.params === currentParams && (now - lastAnalyticsReq.current.time) < threshold) {
            return;
        }
        lastAnalyticsReq.current = { params: currentParams, time: now };

        if (!isBackground) setLoadingAnalytics(true);
        
        const analyticsPromises = entityIds.map(entityId => 
            fetchPostAnalytics(entityId, selectedCid, currentRange)
                .then(res => ({entityId, data: res}))
                .catch(() => ({entityId, data: null}))
        );

        try {
            const results = await Promise.all(analyticsPromises);
            const newAnalyzedData = {};
            results.forEach(item => {
                if (item.data) newAnalyzedData[item.entityId] = item.data;
            });
            setAnalyzedPostsData(newAnalyzedData);
            setLastUpdated(new Date());
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            if (!isBackground) setLoadingAnalytics(false);
        }
    }, [selectedCid]);

    const fetchStatsList = useCallback(async (config, currentRange, isBackground = false) => {
        if (!selectedCid || !currentRange.dateFrom || !currentRange.dateTo) {
            if (!isBackground) setLoadingTable(false);
            return;
        }

        const currentParams = JSON.stringify({ cid: selectedCid, config, from: currentRange.dateFrom, to: currentRange.dateTo });
        const now = Date.now();
        const threshold = isBackground ? 4000 : 1000;
        
        if (lastListReq.current.params === currentParams && (now - lastListReq.current.time) < threshold) {
            return;
        }
        lastListReq.current = { params: currentParams, time: now };

        if (!isBackground) setLoadingTable(true);

        try {
            const res = await fetchPostListStats(selectedCid, { ...config, dateFrom: currentRange.dateFrom, dateTo: currentRange.dateTo });
            
            setPostStats(res.data);
            setPagination(prev => ({
                ...prev,
                ...res.pagination,
                sortBy: config.sortBy,
                sortOrder: config.sortOrder,
                currentPage: res.pagination.currentPage,
            }));
            
            if (!isBackground && res.data.length > 0) {
                const currentSelectionValid = selectedPostEntities.some(id => res.data.find(p => p.entity === id));
                if (selectedPostEntities.length === 0 || (!currentSelectionValid && pagination.currentPage === 1)) {
                     const sortedByComments = [...res.data].sort((a, b) => (b.commentCount || 0) - (a.commentCount || 0));
                     if (sortedByComments.length > 0) setSelectedPostEntities([sortedByComments[0].entity]);
                }
            } else if (!isBackground && res.data.length === 0) {
                 setSelectedPostEntities([]);
            }
            setLastUpdated(new Date());
        } catch (error) {
            console.error('Error fetching list:', error);
            if (!isBackground) setPostStats([]);
        } finally {
            if (!isBackground) setLoadingTable(false);
        }
    }, [selectedCid, selectedPostEntities, pagination.currentPage]);

    const handleTogglePost = useCallback((entityId) => {
        let newSelection;
        if (selectedPostEntities.includes(entityId)) {
            newSelection = selectedPostEntities.filter(id => id !== entityId);
            setAnalyzedPostsData(prev => {
                const newState = {...prev};
                delete newState[entityId];
                return newState;
            });
        } else {
            newSelection = [...selectedPostEntities, entityId];
        }
        setSelectedPostEntities(newSelection);
    }, [selectedPostEntities]);

    // Efectos
    useEffect(() => {
        fetchStatsList({ 
            page: pagination.currentPage, limit: pagination.limit, sortBy: pagination.sortBy, sortOrder: pagination.sortOrder 
        }, dateRange);
    }, [selectedCid, dateRange, pagination.currentPage, pagination.limit, pagination.sortBy, pagination.sortOrder, fetchStatsList]);

    useEffect(() => {
        if (selectedCid && dateRange.dateFrom && (debouncedEntities.length > 0 || Object.keys(analyzedPostsData).length > 0)) {
            fetchAnalytics(debouncedEntities, debouncedDateRange);
        } else if (debouncedEntities.length === 0) {
            setAnalyzedPostsData({});
        }
    }, [selectedCid, debouncedEntities, debouncedDateRange, fetchAnalytics, dateRange.dateFrom]);

    useEffect(() => {
        if (!isRealTimeActive || !selectedCid) return;
        const intervalId = setInterval(() => {
            fetchStatsList({ page: pagination.currentPage, limit: pagination.limit, sortBy: pagination.sortBy, sortOrder: pagination.sortOrder }, dateRange, true);
            if (selectedPostEntities.length > 0) fetchAnalytics(selectedPostEntities, dateRange, true);
        }, POLL_INTERVAL);
        return () => clearInterval(intervalId);
    }, [isRealTimeActive, selectedCid, pagination, dateRange, selectedPostEntities, fetchStatsList, fetchAnalytics]);

    // Handlers
    const handleDateRangeChange = useCallback((newRange) => { setIsRealTimeActive(false); setDateRange(newRange); setPagination(prev => ({...prev, currentPage: 1})); }, []); 
    const handlePostPageChange = useCallback((newPage) => { setPagination(prev => ({...prev, currentPage: newPage})); }, []);
    const handlePostLimitChange = useCallback((newLimit) => { setPagination(prev => ({...prev, limit: newLimit, currentPage: 1})); }, []);
    const handlePostSort = useCallback((key) => {
        const isAsc = pagination.sortBy === key && pagination.sortOrder === 'asc';
        setPagination(prev => ({ ...prev, page: 1, sortBy: key, sortOrder: isAsc ? 'desc' : 'asc' }));
    }, [pagination.sortBy, pagination.sortOrder]);
    const handleChartMetricChange = useCallback((metric) => setChartMetric(metric), []);
    const handleRealTimeToggle = useCallback((isActive) => {
        setIsRealTimeActive(isActive);
        if (isActive) {
            lastListReq.current.time = 0;
            lastAnalyticsReq.current.time = 0;
            fetchStatsList(pagination, dateRange, false);
            if (selectedPostEntities.length > 0) fetchAnalytics(selectedPostEntities, dateRange, false);
        }
    }, [pagination, dateRange, selectedPostEntities, fetchStatsList, fetchAnalytics]);

    const aggregatedGeoData = useMemo(() => {
        const allGeo = Object.values(analyzedPostsData).flatMap(data => data.geoStats || []);
        if (allGeo.length === 0) return [];
        const geoMap = {};
        allGeo.forEach(item => {
            const key = `${item.countryCode}:${item.action}`;
            if (!geoMap[key]) geoMap[key] = { ...item, total: 0 };
            geoMap[key].total += item.total;
        });
        return Object.values(geoMap);
    }, [analyzedPostsData]);

    const postTitlesMap = useMemo(() => {
        return postStats.reduce((map, post) => { map[post.entity] = post.title; return map; }, {});
    }, [postStats]);

    const handleChangeTab = (event, newValue) => {
        setCurrentTab(newValue);
        setTimeout(() => { window.dispatchEvent(new Event('resize')); }, 50);
    };

    return (
        <Box sx={{p: 2, flexGrow: 1}}>
            {/* --- HEADER PRINCIPAL (Igual que Dashboard) --- */}
            {/* Título a la izquierda, Selector de Cliente a la derecha */}
            <Box className="client-header" sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                mb: 2, // Margen para separar de la toolbar de fecha
                flexDirection: {xs: 'column', sm: 'row'},
                gap: 2
            }}>
                <Typography variant="h4">
                    {t('dashboard.postStats.title')}
                </Typography>
                
                {/* Selector de Cliente aislado */}
                {clientList.length > 0 && (
                    <FormControl size="small" sx={{minWidth: 250}}>
                        <InputLabel>{t('dashboard.select_client')}</InputLabel>
                        <Select
                            value={selectedCid}
                            onChange={(e) => handleCidChange(e.target.value)}
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

            {/* --- TOOLBAR SECUNDARIA (Fechas y RealTime) --- */}
            {/* Alineada a la derecha, debajo del header */}
            <Box sx={{
                display: 'flex', 
                justifyContent: 'flex-end', 
                alignItems: 'center', 
                mb: 3, 
                gap: 2,
                flexWrap: 'wrap'
            }}>
                <Box sx={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end'}}>
                    <DateRangeSelector 
                        onRangeChange={handleDateRangeChange} 
                        dateFrom={dateRange.dateFrom} 
                        dateTo={dateRange.dateTo}
                        isRealTimeActive={isRealTimeActive}
                        onRealTimeToggle={handleRealTimeToggle}
                    />
                    
                    <Box sx={{display: 'flex', alignItems: 'center', gap: 1, mt: 0.5}}>
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
            {!selectedCid ? (
                 <Box sx={{display: 'flex', justifyContent: 'center', p: 4, flexDirection: 'column', alignItems: 'center'}}>
                    <CircularProgress/>
                    <Typography variant="caption" sx={{mt:2}}>Cargando...</Typography>
                </Box>
            ) : (
                <>
                    <Box sx={{mb: 2, borderBottom: 1, borderColor: 'divider'}}>
                        <Typography variant="h6" sx={{mb: 1, fontSize: '1rem', color: 'text.secondary'}}>
                            {t('dashboard.postStats.currentlyComparing')}: <Box component="span" sx={{color: 'text.primary', fontWeight: 500}}>
                                {selectedPostEntities.length > 0 
                                    ? selectedPostEntities.map(id => postTitlesMap[id] || t('common.loading')).join(', ')
                                    : t('dashboard.postStats.selectPostPrompt')
                                }
                            </Box>
                        </Typography>

                        <Tabs value={currentTab} onChange={handleChangeTab} aria-label="analytics tabs">
                            <Tab label={t('dashboard.postStats.tab.evolution')}/>
                            <Tab label={t('dashboard.postStats.tab.geo')}/>
                        </Tabs>
                    </Box>
                    
                    <TabPanel value={currentTab} index={0}>
                        <Box sx={{minHeight: 400}}>
                            {currentTab === 0 && (
                                <PostTimeChart 
                                    key={`time-chart-${currentTab}`}
                                    analyzedPostsData={analyzedPostsData} 
                                    postTitlesMap={postTitlesMap}
                                    colors={colors}
                                    loading={loadingAnalytics && !isRealTimeActive} 
                                    dateRange={dateRange}
                                    chartMetric={chartMetric} 
                                    onMetricChange={handleChartMetricChange} 
                                />
                            )}
                        </Box>
                    </TabPanel>
                    
                    <TabPanel value={currentTab} index={1}>
                        <Box sx={{minHeight: 400}}>
                            {currentTab === 1 && (
                                <PostGeoView 
                                    aggregatedGeoData={aggregatedGeoData} 
                                    loading={loadingAnalytics && !isRealTimeActive}
                                />
                            )}
                        </Box>
                    </TabPanel>

                    {loadingTable && !isRealTimeActive ? (
                        <Box sx={{display: 'flex', justifyContent: 'center', mt: 4}}>
                            <CircularProgress/>
                        </Box>
                    ) : (
                        <PostStatsTable
                            data={postStats}
                            pagination={pagination}
                            handleSort={handlePostSort}
                            handlePageChange={handlePostPageChange}
                            handleLimitChange={handlePostLimitChange}
                            selectedPostEntities={selectedPostEntities}
                            handleTogglePost={handleTogglePost}
                        />
                    )}
                </>
            )}
        </Box>
    );
};

export default PostStatsPage;