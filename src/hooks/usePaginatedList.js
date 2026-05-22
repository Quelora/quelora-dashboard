/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

// ./src/hooks/usePaginatedList.js
import { useState, useEffect, useCallback, useRef } from 'react';
import embedStorage from '../utils/embedStorage';

const DEBOUNCE_DELAY = 500;

const usePaginatedList = (fetchApiFn, initialCid, initialConfig = {}) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedCid, setSelectedCid] = useState(
        () => (initialCid !== null && initialCid !== undefined)
            ? initialCid
            : (embedStorage.getItem('currentCid') || null)
    );
    const [refreshKey, setRefreshKey] = useState(0);

    const [pagination, setPagination] = useState({
        page: 0,
        limit: initialConfig.limit || 10,
        total: 0,
    });

    const [filters, setFilters] = useState({
        search: initialConfig.search || '',
        sort: initialConfig.sort || 'created_at',
        order: initialConfig.order || 'desc',
        ...initialConfig.filters,
    });

    const [tempInputs, setTempInputs] = useState({
        search: filters.search,
        category: filters.category || ''
    });

    const debounceTimeout = useRef(null);
    
    const { dataKey = 'posts', paginationKey = 'pagination' } = initialConfig;

    useEffect(() => {
        if (selectedCid) {
            embedStorage.setItem('currentCid', selectedCid);
        }
    }, [selectedCid]);

    const fetchData = useCallback(async () => {
        if (!selectedCid) return;

        try {
            setLoading(true);
            setError(null);

            const response = await fetchApiFn(selectedCid, {
                page: pagination.page + 1,
                limit: pagination.limit,
                ...filters,
            });
            
            const responseData = response[dataKey] || response.data?.[dataKey] || response.data?.posts || response.data?.users || [];
            const responsePagination = response[paginationKey] || response.data?.[paginationKey] || response.data?.pagination || {};

            setData(responseData);
            setPagination(prev => ({
                ...prev,
                total: responsePagination.totalItems || 0,
                sort: filters.sort,
                order: filters.order
            }));

        } catch (err) {
            console.error('Error fetching list:', err);
            setError(err.response?.data?.error || 'Error fetching data');
            setData([]);
        } finally {
            setLoading(false);
        }
    }, [selectedCid, pagination.page, pagination.limit, filters, fetchApiFn, dataKey, paginationKey, refreshKey]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleFilterChange = useCallback((filterName, value) => {
        setFilters(prev => ({...prev, [filterName]: value}));
        setPagination(prev => ({...prev, page: 0}));
    }, []);

    const handleDebouncedFilterChange = useCallback((filterName, value) => {
        setTempInputs(prev => ({...prev, [filterName]: value}));

        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }

        debounceTimeout.current = setTimeout(() => {
            handleFilterChange(filterName, value);
        }, DEBOUNCE_DELAY);
    }, [handleFilterChange]);

    const handleSortChange = useCallback((key) => {
        setFilters(prev => ({
            ...prev,
            sort: key,
            order: prev.sort === key ? (prev.order === 'desc' ? 'asc' : 'desc') : prev.order,
        }));
        setPagination(prev => ({...prev, page: 0}));
    }, []);

    const handleOrderToggle = useCallback(() => {
        setFilters(prev => ({
            ...prev,
            order: prev.order === 'desc' ? 'asc' : 'desc',
        }));
    }, []);

    const handlePageChange = useCallback((event, newPage) => {
        setPagination(prev => ({...prev, page: newPage}));
    }, []);

    const handleLimitChange = useCallback((event) => {
        setPagination(prev => ({
            ...prev,
            limit: parseInt(event.target.value, 10),
            page: 0
        }));
    }, []);

    const handleCidChange = useCallback((event) => {
        const newCid = event.target.value;
        embedStorage.setItem('currentCid', newCid);
        setSelectedCid(newCid);
        setPagination(prev => ({...prev, page: 0}));
    }, []);

    const forceRefresh = useCallback(() => {
        setRefreshKey(prev => prev + 1);
    }, []);


    return {
        data,
        loading,
        error,
        pagination,
        filters,
        tempInputs,
        selectedCid,
        fetchData,
        forceRefresh,
        handleFilterChange,
        handleDebouncedFilterChange,
        handleSortChange,
        handleOrderToggle,
        handlePageChange,
        handleLimitChange,
        handleCidChange,
        setSelectedCid,
        setTempInputs,
        setError,
        setLoading,
        setData,
        setPagination
    };
};

export default usePaginatedList;