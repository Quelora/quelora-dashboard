/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { 
    Box, Typography, Paper, TableCell, TableRow, IconButton, Chip, 
    FormControl, InputLabel, Select, MenuItem, Avatar, Tooltip, Stack, styled 
} from '@mui/material';
import { 
    Refresh as RefreshIcon, Search as SearchIcon, FilterList as FilterListIcon, 
    Block as BlockIcon, CheckCircle as CheckCircleIcon, Bookmark as BookmarkIcon, 
    Comment as CommentIcon, People as PeopleIcon, Favorite as FavoriteIcon, 
    Share as ShareIcon, Send as SendIcon, ArrowDownward as ArrowDownwardIcon, 
    ArrowUpward as ArrowUpwardIcon, QueryStats as QueryStatsIcon, Email as EmailIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getUsersByClient, banUser, unbanUser } from '../api/users';
import { vapid } from '../api/vapid';
import Swal from 'sweetalert2';
import CustomTextField from '../components/Common/CustomTextField';
import usePaginatedList from '../hooks/usePaginatedList';
import PaginatedTable from '../components/Common/PaginatedTable';
import { loadClientsFromSession } from '../api/auth';
import UserCommentsModal from '../components/User/UserCommentsModal';

const cleanTextInput = (input) => {
    if (!input) return '';
    return input.toString()
        .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s-]/g, '')
        .substring(0, 30)
        .trim();
};

const StyledTableRow = styled(TableRow)(({ theme }) => ({
    borderBottom: '1px solid var(--border-gray)',
    '&:last-child': { borderBottom: 'none' },
    '&:nth-of-type(odd)': { backgroundColor: 'rgba(0, 0, 0, 0.02)' },
    '&:hover': { backgroundColor: theme.palette.action.hover },
    '[data-theme="dark"] &:nth-of-type(odd)': { backgroundColor: 'rgba(255, 255, 255, 0.05)' },
}));

const StatItem = ({ value, icon: Icon, label, color = 'text.secondary' }) => (
    <Tooltip title={label} arrow>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: color, minWidth: 45 }}>
            <Icon fontSize="inherit" sx={{ opacity: 0.7 }} />
            <Typography variant="caption" fontWeight="bold">{value || 0}</Typography>
        </Box>
    </Tooltip>
);

const UsersPage = () => {
    const { t } = useTranslation();
    const [clientList, setClientList] = useState([]);
    const [modalUser, setModalUser] = useState(null);
    const [modalInitialTab, setModalInitialTab] = useState(0);
    
    const UserTableHeaders = [
        { id: 'avatar', labelKey: '', numeric: false, sortable: false, minWidth: 30 },
        { id: 'name', labelKey: 'users.name', numeric: false, sortable: true, minWidth: 200 },
        { id: 'geo', labelKey: 'users.city', numeric: false, sortable: false, minWidth: 120 },
        { id: 'stats', labelKey: 'profileAnalytics.activity', numeric: false, sortable: false, minWidth: 250 },
        { id: 'date', labelKey: 'users.date', numeric: false, sortable: true, minWidth: 100 },
        { id: 'actions', labelKey: 'common.actions', numeric: false, sortable: false, minWidth: 100 },
    ];

    const { 
        data: users, loading, error, pagination, filters, tempInputs, selectedCid, 
        fetchData, handleDebouncedFilterChange, handleOrderToggle, handlePageChange, 
        handleLimitChange, handleCidChange, handleSortChange: handleSort, setSelectedCid, setTempInputs 
    } = usePaginatedList(getUsersByClient, null, {
        sort: 'created_at',
        order: 'desc',
        dataKey: 'users',
        paginationKey: 'pagination'
    });

    useEffect(() => {
        try {
            const clients = loadClientsFromSession();
            if (Array.isArray(clients) && clients.length > 0) {
                setClientList(clients);
                if (!selectedCid) {
                    setSelectedCid(clients[0].cid);
                    setTempInputs(prev => ({ ...prev, search: '' }));
                }
            } else {
                setClientList([]);
            }
        } catch (e) {
            console.error('Error loading clients:', e);
            setClientList([]);
        }
    }, [setSelectedCid, setTempInputs]);

    const handleSendPushNotification = async (userId) => {
        const { value: message } = await Swal.fire({
            title: t('users.send_push_title'),
            input: 'text',
            inputLabel: t('users.push_message'),
            inputPlaceholder: t('users.enter_message_placeholder'),
            showCancelButton: true,
            confirmButtonText: t('common.send'),
            cancelButtonText: t('common.cancel'),
            inputValidator: (value) => !value && t('users.message_required')
        });
        if (message) {
            try {
                await vapid(selectedCid, userId, t('users.new_message'), message);
                Swal.fire(t('common.success'), t('users.push_sent_success'), 'success');
            } catch (error) {
                Swal.fire(t('common.error'), t('users.push_send_error'), 'error');
            }
        }
    };

    const handleSearchChange = (e) => {
        handleDebouncedFilterChange('search', cleanTextInput(e.target.value));
    };

    const handleBanUser = async (userId, author, isBanned) => {
        const action = isBanned ? 'unban' : 'ban';
        const result = await Swal.fire({
            title: t(`users.confirm${action.charAt(0).toUpperCase() + action.slice(1)}Title`),
            text: t(`users.confirm${action.charAt(0).toUpperCase() + action.slice(1)}Text`),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: t(`users.${action}`),
            cancelButtonText: t('users.cancel')
        });
        if (!result.isConfirmed) return;
        try {
            const apiCall = isBanned ? unbanUser : banUser;
            await apiCall(author, selectedCid);
            Swal.fire({
                title: t(`users.${action}SuccessTitle`),
                text: t(`users.${action}SuccessText`),
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });
            fetchData();
        } catch (error) {
            Swal.fire(t(`users.${action}ErrorTitle`), error.message || t(`users.${action}ErrorText`), 'error');
        }
    };

    const handleViewComments = (user, tabIndex = 0) => {
        setModalUser(user);
        setModalInitialTab(tabIndex);
    };

    const renderUserRow = (user) => {
        const fullName = `${user.given_name || ''} ${user.family_name || ''}`.trim();
        const displayName = user.name || t('users.noName');
        const geoDisplay = [user.location?.city, user.location?.countryCode].filter(Boolean).join(' / ') || '--';
        
        return (
            <StyledTableRow key={user._id} hover>
                <TableCell>
                    <Avatar
                        src={user?.picture || undefined}
                        sx={{ width: 32, height: 32, cursor: 'pointer' }}
                        onClick={() => handleViewComments(user, 0)}
                    >
                        {!user?.picture && (user?.name?.charAt(0) || 'U')}
                    </Avatar>
                </TableCell>
                <TableCell>
                    <Box>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                            {user.isBanned && (
                                <Tooltip title={t('users.banned')}>
                                    <Chip icon={<BlockIcon />} label={t('users.banned')} color="error" size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
                                </Tooltip>
                            )}
                            <Typography variant="body2" sx={{ fontWeight: 500, cursor: 'pointer' }} onClick={() => handleViewComments(user, 0)}>
                                {displayName}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">{fullName ? `(${fullName})` : ''}</Typography>
                        </Stack>
                        {user.email && (
                            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.5 }}>
                                <EmailIcon fontSize="inherit" color="action" sx={{ fontSize: 14 }} />
                                <Typography variant="caption" color="textSecondary">
                                    <a href={`mailto:${user.email}`} style={{ textDecoration: 'none', color: 'inherit' }}>{user.email}</a>
                                </Typography>
                            </Stack>
                        )}
                    </Box>
                </TableCell>
                <TableCell>
                    <Typography variant="caption" color="textSecondary" display="block">{geoDisplay}</Typography>
                    {user.pushSubscriptions?.length > 0 && (
                        <Chip label="Push Active" size="small" color="success" variant="outlined" sx={{ height: 16, fontSize: '0.65rem', mt: 0.5 }} />
                    )}
                </TableCell>
                
                <TableCell>
                    <Stack spacing={1}>
                        <Stack direction="row" spacing={2}>
                            <StatItem value={user.commentsCount} icon={CommentIcon} label={t('users.comments')} />
                            <StatItem value={user.likesCount} icon={FavoriteIcon} label={t('users.likes')} />
                            <StatItem value={user.bookmarksCount} icon={BookmarkIcon} label={t('users.bookmarks')} />
                        </Stack>
                        <Stack direction="row" spacing={2}>
                            <StatItem value={user.followersCount} icon={PeopleIcon} label={t('users.followers')} color="primary.main" />
                            <StatItem value={user.followingCount} icon={PeopleIcon} label={t('users.following')} />
                            <StatItem value={user.sharesCount} icon={ShareIcon} label={t('users.shares')} />
                        </Stack>
                    </Stack>
                </TableCell>

                <TableCell>
                    <Typography variant="caption" color="textSecondary">
                        {new Date(user.created_at).toLocaleDateString()}
                    </Typography>
                </TableCell>
                <TableCell>
                    <Stack direction="row" spacing={0}>
                        <Tooltip title={t('users.viewComments')}>
                            <IconButton size="small" onClick={() => handleViewComments(user, 0)}>
                                <QueryStatsIcon fontSize="small"/>
                            </IconButton>
                        </Tooltip>
                        {user.pushSubscriptions?.length > 0 && (
                            <Tooltip title={t('users.send_push')}>
                                <IconButton size="small" onClick={() => handleSendPushNotification(user.author)}>
                                    <SendIcon fontSize="small" color="primary" />
                                </IconButton>
                            </Tooltip>
                        )}
                        <Tooltip title={user.isBanned ? t('users.unban') : t('users.ban')}>
                            <IconButton size="small" onClick={() => handleBanUser(user._id, user.author, user.isBanned)}>
                                {user.isBanned ? <CheckCircleIcon fontSize="small" color="success"/> : <BlockIcon fontSize="small" color="error"/>}
                            </IconButton>
                        </Tooltip>
                    </Stack>
                </TableCell>
            </StyledTableRow>
        );
    };

    return (
        <Box className="users-container">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', mb: 3, p: 2, background: 'var(--card-bg)', borderRadius: '12px' }}>
                <Typography variant="h4" className="title">{t('users.title')}</Typography>
                <IconButton onClick={fetchData} size="small"><RefreshIcon /></IconButton>
            </Box>
            
            <Paper elevation={0} sx={{ background: 'var(--content-bg)', p: 0, mb: 2 }}>
                <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'row', 
                    alignItems: 'center', 
                    gap: 2, 
                    p: 2, 
                    background: 'var(--surface-color)', 
                    borderRadius: '12px', 
                    flexWrap: 'wrap',
                    '& > .MuiFormControl-root': {
                        minWidth: '150px',
                        width: 'auto',
                        flexBasis: 'auto',
                        flexGrow: 0,
                        margin: 0
                    },
                    '& > .MuiTextField-root': {
                        margin: 0
                    }
                }}>
                    {Array.isArray(clientList) && clientList.length > 0 && (
                        <FormControl size="small">
                            <InputLabel>{t('users.selectClient')}</InputLabel>
                            <Select value={selectedCid || ''} onChange={handleCidChange} label={t('users.selectClient')}>
                                {clientList.map(c => <MenuItem key={c.cid} value={c.cid}>{c.description || c.cid}</MenuItem>)}
                            </Select>
                        </FormControl>
                    )}
                    
                    <CustomTextField
                        label={t('users.search')}
                        variant="outlined"
                        InputProps={{ startAdornment: <SearchIcon color="action" /> }}
                        value={tempInputs.search}
                        onChange={handleSearchChange}
                        sx={{ flexGrow: 1, minWidth: '200px' }}
                    />
                    
                    <CustomTextField
                        select
                        label={t('users.sortBy')}
                        variant="outlined"
                        value={filters.sort}
                        onChange={(e) => handleSort(e.target.value)}
                        sx={{ width: '150px', flexGrow: 0 }}
                    >
                        <MenuItem value="created_at">{t('users.date')}</MenuItem>
                        <MenuItem value="name">{t('users.name')}</MenuItem>
                        <MenuItem value="commentsCount">{t('users.comments')}</MenuItem>
                        <MenuItem value="likesCount">{t('users.likes')}</MenuItem>
                    </CustomTextField>
                    
                    <IconButton onClick={handleOrderToggle} sx={{ flexShrink: 0 }}>
                        <FilterListIcon/>
                        {filters.order === 'desc' ? <ArrowDownwardIcon fontSize="small"/> : <ArrowUpwardIcon fontSize="small"/>}
                    </IconButton>
                </Box>
            </Paper>

            <PaginatedTable
                headers={UserTableHeaders}
                data={users}
                loading={loading}
                error={error}
                pagination={pagination}
                filters={filters}
                fetchData={fetchData}
                handleSort={handleSort}
                handlePageChange={handlePageChange}
                handleLimitChange={handleLimitChange}
                renderRow={renderUserRow}
            />

            {modalUser && (
                <UserCommentsModal
                    open={Boolean(modalUser)}
                    onClose={() => setModalUser(null)}
                    user={modalUser}
                    cid={selectedCid}
                    initialTab={modalInitialTab}
                />
            )}
        </Box>
    );
};

export default UsersPage;