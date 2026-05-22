/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    Avatar,
    TableCell,
    TableRow,
    styled,
    Chip,
    Autocomplete,
    TextField,
    CircularProgress
} from '@mui/material';
import PaginatedTable from '../Common/PaginatedTable';
import { searchAuthors } from '../../api/vapid';

const StyledTableRow = styled(TableRow)(({ theme }) => ({
    borderBottom: '1px solid var(--border-gray)',
    '&:last-child': { borderBottom: 'none' },
    '&:nth-of-type(odd)': { backgroundColor: 'rgba(0, 0, 0, 0.02)' },
    '&:hover': { backgroundColor: theme.palette.action.hover },
    '[data-theme="dark"] &:nth-of-type(odd)': { backgroundColor: 'rgba(255, 255, 255, 0.05)' },
}));

const LedgerHeaders = [
    { id: 'created_at', labelKey: 'gamification.ledger.date', numeric: false, sortable: true, minWidth: 150 },
    { id: 'user', labelKey: 'gamification.ledger.user', numeric: false, sortable: false, minWidth: 200 },
    { id: 'type', labelKey: 'gamification.ledger.type', numeric: false, sortable: true, minWidth: 120 },
    { id: 'source', labelKey: 'gamification.ledger.source', numeric: false, sortable: true, minWidth: 150 },
    { id: 'xp', labelKey: 'gamification.ledger.xp', numeric: true, sortable: false, minWidth: 80 },
    { id: 'coins', labelKey: 'gamification.ledger.coins', numeric: true, sortable: true, minWidth: 100 },
];

const GamificationLedgerTab = ({ t, fetchLedger, cid }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    const [selectedProfile, setSelectedProfile] = useState(null);
    const [searchValue, setSearchValue] = useState('');
    const [profileOptions, setProfileOptions] = useState([]);
    const DEBOUNCE_DELAY = 800;
    
    const [pagination, setPagination] = useState({
        page: 0,
        limit: 20,
        total: 0
    });

    useEffect(() => {
        if (!searchValue || searchValue.length < 2) {
            setProfileOptions([]);
            return;
        }

        const debounceSearch = setTimeout(async () => {
            try {
                const results = await searchAuthors(searchValue);
                setProfileOptions(results || []);
            } catch (error) {
                console.error("Error searching profiles", error);
            }
        }, DEBOUNCE_DELAY);

        return () => clearTimeout(debounceSearch);
    }, [searchValue]);

    const loadData = useCallback(async () => {
        if (!selectedProfile) {
            setData([]);
            setPagination(prev => ({ ...prev, total: 0 }));
            return;
        }

        setLoading(true);
        try {
            const profileId = selectedProfile.author || selectedProfile._id;
            const response = await fetchLedger(profileId, pagination.page + 1, pagination.limit);
            setData(response.data || []);
            setPagination(prev => ({ ...prev, total: response.pagination?.total || 0 }));
            setError(null);
        } catch (err) {
            console.error(err);
            setError(t('common.errorLoadingData'));
            setData([]);
        } finally {
            setLoading(false);
        }
    }, [fetchLedger, cid, pagination.page, pagination.limit, selectedProfile, t]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handlePageChange = (e, newPage) => setPagination(prev => ({ ...prev, page: newPage }));
    const handleLimitChange = (e) => setPagination(prev => ({ ...prev, limit: parseInt(e.target.value, 10), page: 0 }));

    const renderRow = (row) => (
        <StyledTableRow key={row._id} hover>
            <TableCell>
                {new Date(row.created_at).toLocaleString()}
            </TableCell>
            <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {row.profile_id?.avatar && (
                        <Avatar src={row.profile_id.avatar} sx={{ width: 24, height: 24 }} />
                    )}
                    <Typography variant="body2">
                        {row.profile_id?.username || row.profile_id?._id || t('common.unknown')}
                    </Typography>
                </Box>
            </TableCell>
            <TableCell>
                <Chip label={row.type} size="small" variant="outlined" />
            </TableCell>
            <TableCell>
                <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                    {row.source}
                </Typography>
            </TableCell>
            <TableCell align="right">
                {row.xpAmount > 0 ? (
                    <Typography fontWeight="bold" color="primary.main">
                        +{row.xpAmount} XP
                    </Typography>
                ) : (
                    <Typography variant="body2" color="text.disabled">-</Typography>
                )}
            </TableCell>
            <TableCell align="right">
                <Typography 
                    fontWeight="bold" 
                    sx={{ color: row.amount > 0 ? 'success.main' : row.amount < 0 ? 'error.main' : 'text.primary' }}
                >
                    {row.amount > 0 ? '+' : ''}{row.amount}
                </Typography>
            </TableCell>
        </StyledTableRow>
    );

    return (
        <Box sx={{ p: 2 }}>
            <Box sx={{ mb: 3, maxWidth: 500 }}>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                    {t('gamification.ledger.search_hint', 'Search and select a user profile to view history:')}
                </Typography>
                <Autocomplete
                    options={profileOptions}
                    getOptionLabel={(option) => option.name || option.username || ''}
                    onInputChange={(event, value) => setSearchValue(value)}
                    onChange={(event, newValue) => {
                        setSelectedProfile(newValue);
                        setPagination(prev => ({ ...prev, page: 0 })); 
                    }}
                    renderOption={(props, option) => (
                        <Box component="li" {...props} key={option._id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar src={option.picture || option.avatar} sx={{ width: 24, height: 24 }} />
                            <Box>
                                <Typography variant="body2">{option.name}</Typography>
                                <Typography variant="caption" color="textSecondary">{option._id}</Typography>
                            </Box>
                        </Box>
                    )}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label={t('gamification.ledger.search_user')}
                            variant="outlined"
                            size="small"
                            InputProps={{
                                ...params.InputProps,
                                endAdornment: (
                                    <>
                                        {false ? <CircularProgress color="inherit" size={20} /> : null}
                                        {params.InputProps.endAdornment}
                                    </>
                                ),
                            }}
                        />
                    )}
                />
            </Box>

            <PaginatedTable
                headers={LedgerHeaders}
                data={data}
                loading={loading}
                error={error}
                pagination={pagination}
                filters={{ sort: 'created_at', order: 'desc' }}
                fetchData={loadData}
                handleSort={() => {}} 
                handlePageChange={handlePageChange}
                handleLimitChange={handleLimitChange}
                renderRow={renderRow}
            />
        </Box>
    );
};

export default GamificationLedgerTab;