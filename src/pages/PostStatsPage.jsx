import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchPostListStats, fetchPostAnalytics } from '../api/stats';
import DateRangeSelector from '../components/Common/DateRangeSelector';
import PostStatsTable from '../components/Dashboard/PostStatsTable';
import PostTimeChart from '../components/Dashboard/PostTimeChart';
import PostGeoView from '../components/Dashboard/PostGeoView';
import useDebounce from '../hooks/useDebounce';
import { Box, Typography, CircularProgress, Grid, Tabs, Tab } from '@mui/material';

const DEFAULT_PAGINATION_CONFIG = {
    page: 1,
    limit: 10,
    sortBy: 'viewsCount',
    sortOrder: 'desc',
    totalPosts: 0,
    totalPages: 0,
    currentPage: 1,
};

const getDefaultDateRange = () => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    return { dateFrom: thirtyDaysAgo, dateTo: today };
};

const getClientsFromSession = () => {
    try {
        const clients = JSON.parse(sessionStorage.getItem('clients') || '[]');
        return clients;
    } catch (e) {
        console.error('Error parsing clients from session:', e);
        return [];
    }
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
                <Box sx={{ pt: 2, minHeight: 400 }}>
                    {children}
                </Box>
            )}
        </div>
    );
};

const PostStatsPage = () => {
    const { t } = useTranslation();
    
    const clientList = getClientsFromSession();
    const currentCid = clientList?.[0]?.cid || null;

    const [postStats, setPostStats] = useState([]);
    const [pagination, setPagination] = useState(DEFAULT_PAGINATION_CONFIG);
    const [dateRange, setDateRange] = useState(getDefaultDateRange());
    const [loadingTable, setLoadingTable] = useState(true);

    const [selectedPostEntities, setSelectedPostEntities] = useState([]);
    const [analyzedPostsData, setAnalyzedPostsData] = useState({});
    const [loadingAnalytics, setLoadingAnalytics] = useState(false);
    
    const [currentTab, setCurrentTab] = useState(0); 
    const [chartMetric, setChartMetric] = useState('total'); 
    
    const colors = useMemo(() => ['#4285F4', '#DB4437', '#F4B400', '#0F9D58', '#42B883'], []);

    const debouncedEntities = useDebounce(selectedPostEntities, 300);
    const debouncedDateRange = useDebounce(dateRange, 300);

    const fetchAnalytics = useCallback(async (entityIds, currentRange) => {
        if (!entityIds || entityIds.length === 0 || !currentCid) {
            setAnalyzedPostsData({});
            return;
        }
        setLoadingAnalytics(true);
        
        const analyticsPromises = entityIds.map(entityId => 
            fetchPostAnalytics(entityId, currentCid, currentRange)
                .then(res => ({ entityId, data: res }))
                .catch(() => ({ entityId, data: null }))
        );

        try {
            const results = await Promise.all(analyticsPromises);
            const newAnalyzedData = {};
            results.forEach(item => {
                if (item.data) {
                    newAnalyzedData[item.entityId] = item.data;
                }
            });
            
            setAnalyzedPostsData(newAnalyzedData);
        } catch (error) {
            console.error('Error fetching post analytics batch:', error);
        } finally {
            setLoadingAnalytics(false);
        }
    }, [currentCid]);

    const fetchStatsList = useCallback(async (config, currentRange) => {
        if (!currentCid) {
            setLoadingTable(false);
            return;
        }
        setLoadingTable(true);

        const params = {
            ...config,
            dateFrom: currentRange.dateFrom,
            dateTo: currentRange.dateTo
        };

        try {
            const res = await fetchPostListStats(currentCid, params);
            
            setPostStats(res.data);
            setPagination(prev => ({
                ...prev,
                ...res.pagination,
                sortBy: config.sortBy,
                sortOrder: config.sortOrder,
                currentPage: res.pagination.currentPage,
            }));
            
            if (selectedPostEntities.length === 0 && res.data.length > 0) {
                setSelectedPostEntities([res.data[0].entity]);
            }

        } catch (error) {
            console.error('Error fetching post list stats:', error);
            setPostStats([]);
        } finally {
            setLoadingTable(false);
        }
    }, [currentCid, selectedPostEntities.length]);

    const handleTogglePost = useCallback((entityId) => {
        let newSelection;
        if (selectedPostEntities.includes(entityId)) {
            newSelection = selectedPostEntities.filter(id => id !== entityId);
            setAnalyzedPostsData(prev => {
                const newState = { ...prev };
                delete newState[entityId];
                return newState;
            });
        } else if (selectedPostEntities.length < 5) {
            newSelection = [...selectedPostEntities, entityId];
        } else {
            newSelection = selectedPostEntities;
        }
        setSelectedPostEntities(newSelection);
    }, [selectedPostEntities]);

    useEffect(() => {
        fetchStatsList({ 
            page: pagination.currentPage, 
            limit: pagination.limit, 
            sortBy: pagination.sortBy, 
            sortOrder: pagination.sortOrder 
        }, dateRange);
        
        document.title = t('dashboard.postStats.page_title');
    }, [
        dateRange,
        pagination.currentPage, 
        pagination.limit, 
        pagination.sortBy, 
        pagination.sortOrder,
        fetchStatsList,
        t
    ]);

    useEffect(() => {
        if (debouncedEntities.length > 0 || Object.keys(analyzedPostsData).length > 0) {
            fetchAnalytics(debouncedEntities, debouncedDateRange);
        } else {
            setAnalyzedPostsData({});
        }
    }, [debouncedEntities, debouncedDateRange, fetchAnalytics]);


    const handleDateRangeChange = useCallback((newDateRange) => {
        setDateRange(newDateRange);
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    }, []); 
    
    const handlePostPageChange = useCallback((newPage) => {
        setPagination(prev => ({ ...prev, currentPage: newPage }));
    }, []);

    const handlePostLimitChange = useCallback((newLimit) => {
        const newPage = 1;
        setPagination(prev => ({ ...prev, limit: newLimit, currentPage: newPage }));
    }, []);

    const handlePostSort = useCallback((key) => {
        const isAsc = pagination.sortBy === key && pagination.sortOrder === 'asc';
        const newSortOrder = isAsc ? 'desc' : 'asc';
        const newConfig = {
            page: 1,
            limit: pagination.limit,
            sortBy: key,
            sortOrder: newSortOrder
        };

        setPagination(prev => ({ ...prev, ...newConfig }));
    }, [pagination.sortBy, pagination.limit]);

    const handleChartMetricChange = useCallback((metric) => {
        setChartMetric(metric);
    }, []);


    const aggregatedGeoData = useMemo(() => {
        const allGeo = Object.values(analyzedPostsData).flatMap(data => data.geoStats || []);
        if (allGeo.length === 0) return [];
        
        const geoMap = {};
        allGeo.forEach(item => {
            const key = `${item.countryCode}:${item.action}`;
            if (!geoMap[key]) {
                geoMap[key] = { 
                    country: item.country, 
                    countryCode: item.countryCode, 
                    action: item.action, 
                    total: 0,
                    latitude: item.latitude,
                    longitude: item.longitude,
                    region: item.region,
                    city: item.city
                };
            }
            geoMap[key].total += item.total;
        });
        return Object.values(geoMap);

    }, [analyzedPostsData]);

    const postTitlesMap = useMemo(() => {
        return postStats.reduce((map, post) => {
            map[post.entity] = post.title;
            return map;
        }, {});
    }, [postStats]);

    const handleChangeTab = (event, newValue) => {
        setCurrentTab(newValue);
    };

    return (
        <Box sx={{ p: 2, flexGrow: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4">{t('dashboard.postStats.title')}</Typography>
                <DateRangeSelector onRangeChange={handleDateRangeChange} dateFrom={dateRange.dateFrom} dateTo={dateRange.dateTo} />
            </Box>

            <Box sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="h5" sx={{ mb: 1 }}>
                    {t('dashboard.postStats.currentlyComparing')}: {
                        selectedPostEntities.length > 0 
                            ? selectedPostEntities.map(id => postTitlesMap[id] || t('common.loading')).join(', ')
                            : t('dashboard.postStats.selectPostPrompt')
                    }
                </Typography>
                {selectedPostEntities.length >= 5 && (
                    <Typography variant="caption" color="error">
                        {t('dashboard.postStats.maxSelectionReached')}
                    </Typography>
                )}

                <Tabs value={currentTab} onChange={handleChangeTab} aria-label="analytics tabs">
                    <Tab label={t('dashboard.postStats.tab.evolution')} />
                    <Tab label={t('dashboard.postStats.tab.geo')} />
                </Tabs>
            </Box>
            
            
            <TabPanel value={currentTab} index={0}>
                <Box sx={{ minHeight: 400 }}>
                    <PostTimeChart 
                        key={`post-time-chart-${currentTab}`}
                        analyzedPostsData={analyzedPostsData} 
                        postTitlesMap={postTitlesMap}
                        colors={colors}
                        loading={loadingAnalytics}
                        dateRange={dateRange}
                        chartMetric={chartMetric} 
                        onMetricChange={handleChartMetricChange} 
                    />
                </Box>
            </TabPanel>
            
            <TabPanel value={currentTab} index={1}>
                <Box sx={{ minHeight: 400 }}>
                    <PostGeoView 
                        aggregatedGeoData={aggregatedGeoData} 
                        loading={loadingAnalytics}
                    />
                </Box>
            </TabPanel>


            {loadingTable ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <CircularProgress />
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
        </Box>
    );
};

export default PostStatsPage;