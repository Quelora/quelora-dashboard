// ./src/pages/ReportsPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Typography,
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
    styled,
    Tooltip,
    Stack
} from '@mui/material';
import {
    Refresh as RefreshIcon,
    FilterList as FilterListIcon,
    ArrowUpward as ArrowUpwardIcon,
    ArrowDownward as ArrowDownwardIcon,
    CheckCircle as CheckCircleIcon,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
    Block as BlockIcon,
    Delete as DeleteIcon,
    RestoreFromTrash as RestoreIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import usePaginatedList from '../hooks/usePaginatedList';
import PaginatedTable from '../components/Common/PaginatedTable';
import { loadClientsFromSession } from '../api/auth';
import { getReports, resolveReport, hideComment, unhideComment } from '../api/reports';
import { banUser, unbanUser } from '../api/users';
import React from 'react';

const ReportTableHeaders = [
    { id: 'comment', labelKey: 'reports.comment', numeric: false, sortable: false, minWidth: 300 },
    { id: 'post', labelKey: 'reports.post', numeric: false, sortable: false, minWidth: 200 },
    { id: 'report_count', labelKey: 'reports.reports', numeric: true, sortable: true, minWidth: 100 },
    { id: 'types', labelKey: 'reports.types.title', numeric: false, sortable: false, minWidth: 150 },
    { id: 'created_at', labelKey: 'reports.date', numeric: false, sortable: true, minWidth: 120 },
    { id: 'actions', labelKey: 'reports.actions', numeric: false, sortable: false, minWidth: 150 },
];

const StyledTableRow = styled(TableRow)(({ theme }) => ({
    borderBottom: '1px solid var(--border-gray)',
    '&:last-child': { borderBottom: 'none' },
    '&:nth-of-type(odd)': { backgroundColor: 'rgba(0, 0, 0, 0.02)' },
    '&:hover': { backgroundColor: theme.palette.action.hover },
    '[data-theme="dark"] &:nth-of-type(odd)': { backgroundColor: 'rgba(255, 255, 255, 0.05)' },
}));

const ReportsPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [clientList, setClientList] = useState([]);

    const {
        data: reports,
        loading,
        error,
        pagination,
        filters,
        selectedCid,
        fetchData,
        forceRefresh,
        handleOrderToggle,
        handlePageChange,
        handleLimitChange,
        handleCidChange,
        handleSortChange: handleSort,
        setSelectedCid,
    } = usePaginatedList(getReports, null, {
        sort: 'report_count',
        order: 'desc',
        filters: { deleted: false },
        dataKey: 'reports',
        paginationKey: 'pagination'
    });

    useEffect(() => {
        document.title = t('sidebar.reports');
        try {
            const clients = loadClientsFromSession();
            setClientList(clients);
            if (clients.length > 0 && !selectedCid) {
                setSelectedCid(clients[0].cid);
            }
        } catch (e) {
            console.error('Error loading clients:', e);
            setClientList([]);
        }
    }, [setSelectedCid, t, selectedCid]);

    const getReportTypesSummary = (reportsArray) => {
        const counts = reportsArray.reduce((acc, report) => {
            acc[report.report_type] = (acc[report.report_type] || 0) + 1;
            return acc;
        }, {});

        return Object.entries(counts)
            .sort(([, countA], [, countB]) => countB - countA)
            .map(([type, count]) => (
                <Chip key={type} label={`${t(`reports.types.${type}`)} (${count})`} size="small" sx={{mr: 0.5, mb: 0.5}} />
            ));
    };

    const handleResolve = async (reportId) => {
        const { value: reason, isConfirmed } = await Swal.fire({
            title: t('reports.confirmResolveTitle'),
            input: 'textarea',
            inputLabel: t('reports.resolveReasonInputLabel'),
            inputPlaceholder: t('reports.resolveReasonPlaceholder'),
            inputAttributes: {
                'aria-label': t('reports.resolveReasonInputLabel')
            },
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: t('reports.resolve'),
            cancelButtonText: t('common.cancel')
        });

        if (!isConfirmed) return;

        try {
            await resolveReport(reportId, reason);
            Swal.fire({
                title: t('common.success'),
                text: t('reports.resolveSuccessText'),
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
            forceRefresh();
        } catch (err) {
            Swal.fire(t('common.error'), err.toString(), 'error');
        }
    };

    const handleBan = async (authorId, authorName, isBanned) => {
        const action = isBanned ? 'unban' : 'ban';
        const result = await Swal.fire({
            title: t(`users.confirm${action.charAt(0).toUpperCase() + action.slice(1)}Title`),
            text: t(`users.confirm${action.charAt(0).toUpperCase() + action.slice(1)}Text`, { user: authorName || 'este usuario' }),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: t(`users.${action}`),
            cancelButtonText: t('common.cancel'),
            confirmButtonColor: action === 'ban' ? '#d33' : '#3085d6'
        });

        if (!result.isConfirmed) return;

        try {
            const apiCall = isBanned ? unbanUser : banUser;
            await apiCall(authorId, selectedCid);
            
            Swal.fire({
                title: t(`users.${action}SuccessTitle`),
                text: t(`users.${action}SuccessText`),
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
            forceRefresh();
        } catch (err) {
             Swal.fire(t('common.error'), err.toString(), 'error');
        }
    };

    const handleHideComment = async (commentId, commentText) => {
        const result = await Swal.fire({
            title: t('reports.confirmHideTitle'),
            html: t('reports.confirmHideText', { comment: commentText }),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: t('reports.hide'),
            cancelButtonText: t('common.cancel'),
            confirmButtonColor: '#d33'
        });

        if (!result.isConfirmed) return;

        try {
            await hideComment(commentId, selectedCid);
            Swal.fire({
                title: t('common.success'),
                text: t('reports.hideSuccessText'),
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
            forceRefresh();
        } catch (err) {
            Swal.fire(t('common.error'), err.toString(), 'error');
        }
    };

    const handleUnhideComment = async (commentId, commentText) => {
        const result = await Swal.fire({
            title: t('reports.confirmUnhideTitle'),
            html: t('reports.confirmUnhideText', { comment: commentText }),
            icon: 'info',
            showCancelButton: true,
            confirmButtonText: t('reports.unhide'),
            cancelButtonText: t('common.cancel')
        });

    
        if (!result.isConfirmed) return;
    
        try {
            await unhideComment(commentId, selectedCid);
            Swal.fire({
                title: t('common.success'),
                text: t('reports.unhideSuccessText'),
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
            forceRefresh();
        } catch (err) {
            Swal.fire(t('common.error'), err.toString(), 'error');
        }
    };

    const renderReportRow = (report) => {
        const { comment, post, report_count, created_at, _id } = report;
        const authorName = comment?.profile?.name || t('comments.unknownAuthor');
        const commentTextTruncated = comment ? (comment.text.length > 100 ? `${comment.text.substring(0, 100)}...` : comment.text) : "";
        const isCommentVisible = comment?.visible !== false;
        const isUserBanned = comment?.profile?.isBanned === true;

        return (
            <StyledTableRow key={_id} hover>
                <TableCell>
                    {comment ? (
                        <Box>
                            <Stack direction="row" spacing={0.5} alignItems="center">
                                {!isCommentVisible && (
                                    <Tooltip title={t('reports.hidden')}>
                                        <Chip
                                            icon={<VisibilityOffIcon />}
                                            label={t('reports.hidden')}
                                            color="warning"
                                            size="small"
                                            variant="outlined"
                                            sx={{ height: 20, fontSize: '0.7rem', '.MuiChip-icon': { fontSize: '0.8rem' } }}
                                        />
                                    </Tooltip>
                                )}
                                {isUserBanned && (
                                    <Tooltip title={t('users.banned')}>
                                        <Chip
                                            icon={<BlockIcon />}
                                            label={t('users.banned')}
                                            color="error"
                                            size="small"
                                            variant="outlined"
                                            sx={{ height: 20, fontSize: '0.7rem', '.MuiChip-icon': { fontSize: '0.8rem' } }}
                                        />
                                    </Tooltip>
                                )}
                                <Typography variant="body2" sx={{fontWeight: 500}}>
                                    {comment.profile?.name || t('comments.unknownAuthor')}
                                </Typography>
                            </Stack>
                            <Typography 
                                variant="caption" 
                                color="text.secondary" 
                                sx={{
                                    fontStyle: 'italic', 
                                    textDecoration: !isCommentVisible ? 'line-through' : 'none'
                                }}
                            >
                                "{comment.text}"
                            </Typography>
                        </Box>
                    ) : (
                        <Chip label={t('reports.commentDeleted')} size="small" color="error" variant="outlined" />
                    )}
                </TableCell>
                <TableCell>
                    <Typography variant="caption" noWrap>
                        {post?.title || t('reports.postNotFound')}
                    </Typography>
                </TableCell>
                <TableCell align="center">
                    <Chip label={report_count} color="error" size="small" />
                </TableCell>
                <TableCell>
                    <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 0.5}}>
                        {getReportTypesSummary(report.reports)}
                    </Box>
                </TableCell>
                <TableCell>
                    {new Date(created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                    <Stack direction="row" spacing={0.5}>
                        <Tooltip title={t('reports.resolve')}>
                            <IconButton size="small" color="success" onClick={() => handleResolve(_id)}>
                                <CheckCircleIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title={t('reports.viewComment')}>
                            <IconButton size="small" onClick={() => navigate(`/post/${report.entity_id}/comments`)}>
                                <VisibilityIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        
                        {comment && isCommentVisible && (
                            <Tooltip title={isUserBanned ? t('users.unban') : t('users.ban', { user: authorName })}>
                                <IconButton size="small" onClick={() => handleBan(comment.author, authorName, isUserBanned)}>
                                    {isUserBanned ? (
                                        <CheckCircleIcon fontSize="small" color="success" />
                                    ) : (
                                        <BlockIcon fontSize="small" color="error" />
                                    )}
                                </IconButton>
                            </Tooltip>
                        )}
                        
                        {comment && isCommentVisible && (
                            <Tooltip title={t('reports.hide')}>
                                <IconButton size="small" color="warning" onClick={() => handleHideComment(comment._id, commentTextTruncated)}>
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        )}
                        
                        {comment && !isCommentVisible && (
                            <Tooltip title={t('reports.unhide')}>
                                <IconButton size="small" color="info" onClick={() => handleUnhideComment(comment._id, commentTextTruncated)}>
                                    <RestoreIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Stack>
                </TableCell>
            </StyledTableRow>
        );
    };

    return (
        <Box className="reports-container" sx={{width: '100%', gap: 2, display: 'flex', flexDirection: 'column'}}>

            <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', mb: 3, p: 2, background: 'var(--card-bg)', borderRadius: '12px'}}>
                <Typography variant="h4" className="title">
                    {t('sidebar.reports')}
                </Typography>
                <Box className="actions-section" sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                    <IconButton onClick={fetchData} className="refresh-button" size="small" disabled={loading}>
                        <RefreshIcon />
                    </IconButton>
                </Box>
            </Box>

            <Paper elevation={0} sx={{ background: 'var(--content-bg)', p: 0, mb: 2, textAlign: {xs: 'left', sm: 'right'} }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, p: 2, background: 'var(--surface-color)', borderRadius: '12px' }}>

                    {clientList.length > 0 && (
                        <FormControl size="small" sx={{minWidth: 200, flexShrink: 0}}>
                            <InputLabel>{t('clientPosts.selectClient')}</InputLabel>
                            <Select
                                value={selectedCid || 'all'}
                                onChange={handleCidChange}
                                label={t('clientPosts.selectClient')}
                                className="client-select"
                            >
                                <MenuItem value="all">{t('dashboard.all_clients')}</MenuItem>
                                {clientList.map(client => (
                                    <MenuItem key={client.cid} value={client.cid}>
                                        {client.description || client.cid}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}

                    <Box sx={{flexGrow: 1}} />

                    <TextField
                        select
                        label={t('clientPosts.sortBy')}
                        variant="outlined"
                        size="small"
                        value={filters.sort}
                        onChange={(e) => handleSort(e.target.value)}
                        sx={{minWidth: '150px'}}
                        disabled={!selectedCid}
                    >
                        <MenuItem value="report_count">{t('reports.mostReported')}</MenuItem>
                        <MenuItem value="created_at">{t('reports.mostRecent')}</MenuItem>
                    </TextField>

                    <IconButton
                        onClick={handleOrderToggle}
                        aria-label={filters.order === 'desc' ? t('clientPosts.sortDesc') : t('clientPosts.sortAsc')}
                        disabled={!selectedCid}
                    >
                        <FilterListIcon/>
                        {filters.order === 'desc' ? <ArrowDownwardIcon fontSize="small"/> : <ArrowUpwardIcon fontSize="small"/>}
                    </IconButton>
                </Box>
            </Paper>

            <PaginatedTable
                headers={ReportTableHeaders}
                data={reports}
                loading={loading}
                error={error}
                pagination={pagination}
                filters={filters}
                fetchData={fetchData}
                handleSort={handleSort}
                handlePageChange={handlePageChange}
                handleLimitChange={handleLimitChange}
                renderRow={renderReportRow}
            />
        </Box>
    );
};

export default ReportsPage;