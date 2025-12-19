// ./src/hooks/useDashboardStats.js
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { fetchStats, fetchGeoStats } from '../api/stats';

const POLL_INTERVAL = 5000;
const POLL_INTERVAL_GEO = 7000;

const getTodayRange = () => {
    const today = new Date();
    const dateFrom = new Date(today);
    dateFrom.setHours(0, 0, 0, 0);
    const dateTo = new Date(today);
    dateTo.setHours(23, 59, 59, 999);
    return {dateFrom, dateTo};
};

const useDashboardStats = () => {
    const [stats, setStats] = useState(null);
    const [geoData, setGeoData] = useState({data: []});
    const [selectedCid, setSelectedCid] = useState('all');
    const [dateRange, setDateRange] = useState(getTodayRange());
    const [geoAction, setGeoAction] = useState('comment'); 
    const [lastUpdated, setLastUpdated] = useState(new Date());
    const [isRealTimeActive, setIsRealTimeActive] = useState(false);

    const lastStatsRequest = useRef({ params: '', time: 0 });
    const lastGeoRequest = useRef({ params: '', time: 0 });

    const cidApi = useMemo(() => (selectedCid === 'all' ? null : selectedCid), [selectedCid]);

    const loadStats = useCallback(async (cid, dateFrom, dateTo) => {
        if (!dateFrom || !dateTo) return;

        // Deduplicación: Si la petición es idéntica a la anterior y ocurrió hace menos de 1s, la ignoramos
        const currentParams = JSON.stringify({ cid, from: dateFrom.getTime(), to: dateTo.getTime() });
        const now = Date.now();
        if (lastStatsRequest.current.params === currentParams && (now - lastStatsRequest.current.time) < 1000) {
            return;
        }
        lastStatsRequest.current = { params: currentParams, time: now };

        try {
            const data = await fetchStats(cid, dateFrom, dateTo);
            setStats(data);
            setLastUpdated(new Date());
        } catch (error) {
            console.error('Error loading stats:', error);
            setStats(null);
        }
    }, []);

    const loadGeoStats = useCallback(async (cid, dateFrom, dateTo, action) => {
        if (!dateFrom || !dateTo) return;

        const currentParams = JSON.stringify({ cid, from: dateFrom.getTime(), to: dateTo.getTime(), action });
        const now = Date.now();
        if (lastGeoRequest.current.params === currentParams && (now - lastGeoRequest.current.time) < 1000) {
            return;
        }
        lastGeoRequest.current = { params: currentParams, time: now };

        try {
            const response = await fetchGeoStats(cid, dateFrom, dateTo, action);
            const apiDataArray = response.data; 
            setGeoData({data: apiDataArray || []}); 
        } catch (error) {
            console.error('Error loading geo stats:', error);
            setGeoData({data: []});
        }
    }, []);

    useEffect(() => {
        const {dateFrom, dateTo} = dateRange;
        loadStats(cidApi, dateFrom, dateTo);
    }, [cidApi, dateRange.dateFrom, dateRange.dateTo, loadStats]);

    useEffect(() => {
        const {dateFrom, dateTo} = dateRange;
        loadGeoStats(cidApi, dateFrom, dateTo, geoAction);
    }, [cidApi, dateRange.dateFrom, dateRange.dateTo, geoAction, loadGeoStats]);

    useEffect(() => {
        if (!isRealTimeActive) return;

        const {dateFrom, dateTo} = dateRange;
        
        const intervalId = setInterval(() => {
            lastStatsRequest.current.time = 0; 
            loadStats(cidApi, dateFrom, dateTo);
        }, POLL_INTERVAL);

        return () => clearInterval(intervalId);
    }, [isRealTimeActive, cidApi, dateRange.dateFrom, dateRange.dateTo, loadStats]);

    // EFECTO 4: Intervalo Real-Time Geo
    useEffect(() => {
        if (!isRealTimeActive) return;

        const {dateFrom, dateTo} = dateRange;

        const geoIntervalId = setInterval(() => {
            lastGeoRequest.current.time = 0;
            loadGeoStats(cidApi, dateFrom, dateTo, geoAction);
        }, POLL_INTERVAL_GEO);

        return () => clearInterval(geoIntervalId);
    }, [isRealTimeActive, cidApi, dateRange.dateFrom, dateRange.dateTo, geoAction, loadGeoStats]);

    
    const handleDateRangeChangeLegacy = useCallback((dateFrom, dateTo) => {
        setIsRealTimeActive(false); 
        setDateRange({dateFrom, dateTo});
    }, []);

    const handleGeoActionChange = useCallback((newAction) => {
        setGeoAction(newAction); 
    }, []);

    const handleRealTimeToggle = useCallback((isActive) => {
        setIsRealTimeActive(isActive);
        if (isActive) {
            lastStatsRequest.current.time = 0;
            lastGeoRequest.current.time = 0;
            loadStats(cidApi, dateRange.dateFrom, dateRange.dateTo);
            loadGeoStats(cidApi, dateRange.dateFrom, dateRange.dateTo, geoAction);
        }
    }, [cidApi, dateRange.dateFrom, dateRange.dateTo, geoAction, loadStats, loadGeoStats]);

    return {
        stats,
        geoData,
        selectedCid,
        dateRange,
        geoAction,
        lastUpdated,
        isRealTimeActive,
        handleCidChange: setSelectedCid,
        onDateRangeChange: handleDateRangeChangeLegacy,
        onGeoActionChange: handleGeoActionChange,
        onRealTimeToggle: handleRealTimeToggle
    };
};

export default useDashboardStats;