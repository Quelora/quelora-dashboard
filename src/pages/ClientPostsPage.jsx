/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

// ./src/pages/ClientPostsPage.jsx
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Typography,
    CircularProgress,
    Paper,
    TableCell,
    TableRow,
    TextField,
    MenuItem,
    Button,
    IconButton,
    Chip,
    FormControl,
    InputLabel,
    Select,
    Tooltip,
    styled,
    Switch,
    FormControlLabel
} from '@mui/material';
import {
    Add as AddIcon,
    Refresh as RefreshIcon,
    Search as SearchIcon,
    FilterList as FilterListIcon,
    Visibility as VisibilityIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    ArrowUpward as ArrowUpwardIcon,
    ArrowDownward as ArrowDownwardIcon,
    ThumbUp as ThumbUpIcon,
    Share as ShareIcon,
    Comment as CommentIcon,
    LiveTv as LiveTvIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getClientPosts, movePostToTrash } from '../api/posts';
import usePostModal from '../hooks/usePostModal';
import Swal from 'sweetalert2';
import PostModal from '../components/Post/PostModal';
import usePaginatedList from '../hooks/usePaginatedList';
import PaginatedTable from '../components/Common/PaginatedTable';
import React from 'react';
import { loadClientsFromSession } from '../api/auth';

const cleanTextInput = (input) => {
    if (!input) return '';
    return input.toString()
        .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s-]/g, '')
        .substring(0, 30)
        .trim();
};

const PostTableHeaders = [
    {id: 'reference', labelKey: '#', numeric: false, sortable: false, minWidth: 60},
    {id: 'title', labelKey: 'clientPosts.title', numeric: false, sortable: true, minWidth: 250},
    {id: 'category', labelKey: 'clientPosts.category', numeric: false, sortable: true, minWidth: 100},
    {id: 'created_at', labelKey: 'clientPosts.date', numeric: false, sortable: true, minWidth: 100},
    {id: 'visibility', labelKey: 'clientPosts.visibility', numeric: false, sortable: false, minWidth: 100},
    {id: 'likesCount', labelKey: 'dashboard.statistics.likes', numeric: true, sortable: true, minWidth: 70},
    {id: 'sharesCount', labelKey: 'dashboard.statistics.shares', numeric: true, sortable: true, minWidth: 70},
    {id: 'commentsCount', labelKey: 'dashboard.statistics.comments', numeric: true, sortable: true, minWidth: 70},
    {id: 'actions', labelKey: 'clientPosts.actions', numeric: false, sortable: false, minWidth: 120},
];

const StyledTableRow = styled(TableRow)(({ theme }) => ({
    borderBottom: '1px solid var(--border-gray)',
    '&:last-child': {
        borderBottom: 'none',
    },
    '&:nth-of-type(odd)': {
        backgroundColor: 'rgba(0, 0, 0, 0.02)',
    },
    '&:hover': {
        backgroundColor: theme.palette.action.hover,
    },
    '[data-theme="dark"] &:nth-of-type(odd)': {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
}));


const ClientPostsPage = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const {
        isOpen: postModalOpen,
        currentPost,
        openModal: openPostModal,
        closeModal: closePostModal,
        mode: postModalMode
    } = usePostModal();

    const [clientList, setClientList] = useState([]);
    const [filterLive, setFilterLive] = useState(false);
    const filterLiveInitialRef = useRef(true);

    const {
        data: posts,
        loading,
        error,
        pagination,
        filters,
        tempInputs,
        selectedCid,
        fetchData,
        handleDebouncedFilterChange,
        handleFilterChange,
        handleOrderToggle,
        handlePageChange,
        handleLimitChange,
        handleCidChange,
        handleSortChange: handleSort,
        setSelectedCid,
        setTempInputs
    } = usePaginatedList(getClientPosts, null, {
        sort: 'created_at',
        order: 'desc',
        filters: { deleted: false, isLive: false }
    });

    useEffect(() => {
        try {
            const clients = loadClientsFromSession();
            setClientList(clients);
            if (clients.length > 0 && !selectedCid) {
                 setSelectedCid(clients[0].cid);
                 setTempInputs(prev => ({...prev, search: '', category: ''}));
            }
        } catch (e) {
            console.error('Error loading clients:', e);
            setClientList([]);
        }
    }, [setSelectedCid, setTempInputs]);

    useEffect(() => {
        if (filterLiveInitialRef.current) {
            filterLiveInitialRef.current = false;
            return;
        }
        handleFilterChange('isLive', filterLive);
    }, [filterLive, handleFilterChange]);


    const handleSearchChange = (e) => {
        const value = e.target.value;
        handleDebouncedFilterChange('search', value);
    };

    const handleCategoryChange = (e) => {
        const value = cleanTextInput(e.target.value);
        handleDebouncedFilterChange('category', value);
    };

    const handleLiveFilterChange = (event) => {
        setFilterLive(event.target.checked);
    };

    const handleNewPostClick = () => {
        openPostModal({
            cid: selectedCid,
            entity: '',
            description: '',
            config: {
                tags: [],
                category: tempInputs.category || 'General',
                moderation: {
                    banned_words: []
                },
                liveMode: { isLiveActive: false, startTime: null, maxClients: 300 }
            }
        });
    };

    const handleEditPost = (post) => {
        openPostModal(post);
    };

    const handleMoveToTrash = async (entityId) => {
        const result = await Swal.fire({
            title: t('clientPosts.confirmMoveToTrashTitle'),
            text: t('clientPosts.confirmMoveToTrashText'),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: t('clientPosts.moveToTrash'),
            cancelButtonText: t('clientPosts.cancel')
        });

        if (!result.isConfirmed) return;
        try {
            const response = await movePostToTrash(selectedCid, entityId);
            if (response.status === 200) {
                Swal.fire({
                    title: t('clientPosts.movedToTrashSuccessTitle'),
                    text: t('clientPosts.movedToTrashSuccessText'),
                    icon: 'success',
                    timer: 2000,
                    timerProgressBar: true,
                    showConfirmButton: false
                });
                fetchData();
            } else {
                throw new Error(response.error || t('trash.restoreErrorText'));
            }
        } catch (error) {
            console.error('Error moving to trash:', error);
            Swal.fire({
                title: t('clientPosts.moveToTrashErrorTitle'),
                text: error.message || t('clientPosts.moveToTrashErrorText'),
                icon: 'error'
            });
        }
    };

    const handlePostSave = () => {
        fetchData();
        closePostModal();
    };

    const renderPostRow = (post) => {
        const isLive = post.config?.liveMode?.isLiveActive === true;

        return (
            <StyledTableRow key={post._id} hover>
                <TableCell>
                    <Tooltip title={post.reference || '--'} placement="top" arrow>
                        <Typography variant="body2" className="post-title">
                            {post.reference ? `...${post.reference.slice(-5)}` : '--'}
                        </Typography>
                    </Tooltip>
                </TableCell>
                <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {isLive && (
                            <Chip
                                label={t('clientPosts.live')}
                                size="small"
                                color="error"
                                sx={{ height: '20px', fontSize: '0.7rem' }}
                            />
                        )}
                        <Typography variant="body2" className="post-title" noWrap sx={{ maxWidth: 300 }}>
                            {post.title || t('clientPosts.noTitle')}
                        </Typography>
                    </Box>
                </TableCell>
                <TableCell>
                    {cleanTextInput(post.config?.category) || 'General'}
                </TableCell>
                <TableCell>
                    {new Date(post.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                    <Chip
                        label={post.config?.visibility === 'public'
                            ? t('clientPosts.public')
                            : t('clientPosts.private')}
                        size="small"
                        className={`visibility-chip ${post.config?.visibility}`}
                    />
                </TableCell>
                 <TableCell align="center">
                    <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                        <Tooltip title={t('dashboard.statistics.likes')} arrow><ThumbUpIcon fontSize="small" sx={{mr: 0.5}}/></Tooltip>{post.likesCount || 0}
                    </Box>
                </TableCell>
                <TableCell align="center">
                    <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                        <Tooltip title={t('dashboard.statistics.shares')} arrow><ShareIcon fontSize="small" sx={{mr: 0.5}}/></Tooltip>{post.sharesCount || 0}
                    </Box>
                </TableCell>
                <TableCell align="center">
                    <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                        <Tooltip title={t('dashboard.statistics.comments')} arrow><CommentIcon fontSize="small" sx={{mr: 0.5}}/></Tooltip>{post.commentsCount || 0}
                    </Box>
                </TableCell>
                <TableCell>
                    <IconButton
                        size="small"
                        aria-label={t('clientPosts.view')}
                        onClick={() => navigate(`/post/${post._id}/comments`)}><VisibilityIcon fontSize="small"/></IconButton><IconButton
                        size="small"
                        aria-label={t('clientPosts.edit')}
                        onClick={() => handleEditPost(post)}
                    ><EditIcon fontSize="small"/></IconButton><IconButton
                        size="small"
                        aria-label={t('clientPosts.moveToTrash')}
                        onClick={() => handleMoveToTrash(post.entity)}
                    ><DeleteIcon fontSize="small"/></IconButton>
                </TableCell>
            </StyledTableRow>
        );
    };

    return (
        <Box className="client-posts-container">
            <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', mb: 3, p: 2, background: 'var(--card-bg)', borderRadius: '12px'}}>
                <Typography variant="h4" className="title">
                    {t('clientPosts.title')}
                </Typography>
                <Box className="actions-section" sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon/>}
                        onClick={handleNewPostClick}
                        disabled={!selectedCid}
                    >
                        {t('clientPosts.newPost')}
                    </Button>
                    <IconButton onClick={fetchData} className="refresh-button" size="small" disabled={loading}>
                        {loading ? <CircularProgress size={20} /> : <RefreshIcon/>}
                    </IconButton>
                </Box>
            </Box>
            <Paper elevation={0} sx={{
                background: 'var(--content-bg)',
                p: 0,
                mb: 2,
                textAlign: {xs: 'left', sm: 'right'}
            }}>
                <Box sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 1,
                    p: 2,
                    background: 'var(--surface-color)',
                    borderRadius: '12px'
                }}>
                    {clientList.length > 0 && (
                        <FormControl size="small" sx={{minWidth: 200, flexShrink: 0}}>
                            <InputLabel>{t('clientPosts.selectClient')}</InputLabel>
                            <Select
                                value={selectedCid || ''}
                                onChange={handleCidChange}
                                label={t('clientPosts.selectClient')}
                                className="client-select"
                            >
                                {clientList.map(client => (
                                    <MenuItem key={client.cid} value={client.cid}>
                                        {client.description || client.cid}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}
                    <TextField
                        label={t('clientPosts.search')}
                        variant="outlined"
                        size="small"
                        InputProps={{
                            startAdornment: <SearchIcon color="action"/>
                        }}
                        value={tempInputs.search}
                        onChange={handleSearchChange}
                        sx={{flexGrow: 1, minWidth: '150px'}}
                        disabled={!selectedCid}
                    />
                    <TextField
                        label={t('clientPosts.category')}
                        variant="outlined"
                        size="small"
                        value={tempInputs.category}
                        onChange={handleCategoryChange}
                        inputProps={{maxLength: 30}}
                        sx={{minWidth: '120px'}}
                        disabled={!selectedCid}
                    />
                    <FormControlLabel
                        control={
                            <Switch
                                checked={filterLive}
                                onChange={handleLiveFilterChange}
                                size="small"
                                color="error"
                            />
                        }
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <LiveTvIcon fontSize="small" sx={{ mr: 0.5 }} color={filterLive ? "error" : "action"} />
                                {t('clientPosts.live')}
                            </Box>
                        }
                        sx={{mr: 1, '& .MuiFormControlLabel-label': {fontSize: '0.8rem'}}}
                        disabled={!selectedCid}
                    />
                    <TextField
                        select
                        label={t('clientPosts.sortBy')}
                        variant="outlined"
                        size="small"
                        value={filters.sort}
                        onChange={(e) => handleSort(e.target.value)}
                        sx={{minWidth: '120px'}}
                        disabled={!selectedCid}
                    >
                        <MenuItem value="created_at">{t('clientPosts.date')}</MenuItem>
                        <MenuItem value="title">{t('clientPosts.title')}</MenuItem>
                        <MenuItem value="likesCount">{t('dashboard.statistics.likes')}</MenuItem>
                        <MenuItem value="commentsCount">{t('dashboard.statistics.comments')}</MenuItem>
                    </TextField>
                    <IconButton
                        onClick={handleOrderToggle}
                        aria-label={filters.order === 'desc' ? t('clientPosts.sortDesc') : t('clientPosts.sortAsc')}
                        disabled={!selectedCid}
                    >
                        <FilterListIcon/>
                        {filters.order === 'desc' ? (<ArrowDownwardIcon fontSize="small"/>) : (<ArrowUpwardIcon fontSize="small"/>)}
                    </IconButton>
                </Box>
            </Paper>
            <PaginatedTable
                headers={PostTableHeaders}
                data={posts}
                loading={loading}
                error={error}
                pagination={pagination}
                filters={filters}
                fetchData={fetchData}
                handleSort={handleSort}
                handlePageChange={handlePageChange}
                handleLimitChange={handleLimitChange}
                renderRow={renderPostRow}
            />
            <PostModal
                open={postModalOpen}
                onClose={closePostModal}
                initialData={currentPost}
                mode={postModalMode}
                onSave={handlePostSave}
            />
        </Box>
    );
};

export default ClientPostsPage;