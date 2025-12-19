// ./src/pages/TrashPage.jsx
import { useState, useEffect } from 'react';
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
    FormControl,
    InputLabel,
    Select,
    styled,
    Tooltip
} from '@mui/material';
import {
    Refresh as RefreshIcon,
    Search as SearchIcon,
    FilterList as FilterListIcon,
    Restore as RestoreIcon,
    ArrowUpward as ArrowUpwardIcon,
    ArrowDownward as ArrowDownwardIcon,
} from '@mui/icons-material';
import { getClientPosts, restorePostFromTrash } from '../api/posts';
import Swal from 'sweetalert2';
import usePaginatedList from '../hooks/usePaginatedList';
import PaginatedTable from '../components/Common/PaginatedTable';
import { loadClientsFromSession } from '../api/auth';
import React from 'react';

const cleanTextInput = (input) => {
    if (!input) return '';
    return input.toString()
        .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s-]/g, '')
        .substring(0, 30)
        .trim();
};

const TrashTableHeaders = [
    {id: 'description', labelKey: 'trash.description', numeric: false, sortable: true, minWidth: 250},
    {id: 'category', labelKey: 'trash.category', numeric: false, sortable: true, minWidth: 100},
    {id: 'deleted_at', labelKey: 'trash.deletedDate', numeric: false, sortable: true, minWidth: 150},
    {id: 'actions', labelKey: 'trash.actions', numeric: false, sortable: false, minWidth: 100},
];

// Estilo para ListItem con efecto zebra (odd/even)
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

const TrashPage = () => {
    const { t } = useTranslation();
    
    const [clientList, setClientList] = useState([]);

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
        handleOrderToggle,
        handlePageChange,
        handleLimitChange,
        handleCidChange,
        handleSortChange: handleSort,
        setSelectedCid,
        setTempInputs
    } = usePaginatedList(getClientPosts, null, { 
        sort: 'deleted_at',
        order: 'desc',
        filters: {deleted: true}
    });

    useEffect(() => {
        try {
            const clients = loadClientsFromSession();
            setClientList(clients);
            if (clients.length > 0) {
                setSelectedCid(clients[0].cid);
                setTempInputs(prev => ({...prev, search: '', category: ''}));
            }
        } catch (e) {
            console.error('Error loading clients:', e);
            setClientList([]);
        }
    }, [setSelectedCid, setTempInputs]);

    const handleSearchChange = (e) => {
        const value = e.target.value;
        handleDebouncedFilterChange('search', value);
    };

    const handleCategoryChange = (e) => {
        const value = cleanTextInput(e.target.value);
        handleDebouncedFilterChange('category', value);
    };

    const handleRestore = async (cid, entityId, description) => {
        const result = await Swal.fire({
            title: t('trash.confirmRestoreTitle'),
            text: t('trash.confirmRestoreText', {description: description || t('trash.noDescription')}),
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: t('trash.restore'),
            cancelButtonText: t('trash.cancel')
        });

        if (!result.isConfirmed) return;

        try {
            const response = await restorePostFromTrash(cid, entityId);

            if (response.data.success) {
                await Swal.fire({
                    title: t('trash.restoreSuccessTitle'),
                    text: t('trash.restoreSuccessText'),
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
            console.error('Error restoring post:', error);
            Swal.fire({
                title: t('trash.restoreErrorTitle'),
                text: error.message || t('trash.restoreErrorText'),
                icon: 'error'
            });
        }
    };
    
    const renderTrashRow = (post) => (
        <StyledTableRow key={post._id} hover>
            <TableCell>
                <Typography variant="body2" className="post-title">
                    {post.description || t('trash.noDescription')}
                </Typography>
            </TableCell>
            <TableCell>
                {cleanTextInput(post.config?.category) || 'General'}
            </TableCell>
            <TableCell>
                {new Date(post.deleted_at || post.created_at).toLocaleDateString()}
            </TableCell>
            <TableCell>
                <IconButton 
                    onClick={() => handleRestore(post.cid, post.entity, post.description)} 
                    aria-label={t('trash.restore')}
                >
                    <RestoreIcon/>
                </IconButton>
            </TableCell>
        </StyledTableRow>
    );


    return (
        <Box className="post-comments-container" sx={{width: '100%', gap: 2, display: 'flex', flexDirection: 'column'}}>
            {/* CORRECCIÓN 1: Layout del Header */}
            <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', mb: 3, p: 2, background: 'var(--card-bg)', borderRadius: '12px'}}>
                <Typography variant="h4" className="title">
                    {t('trash.title')}
                </Typography>
                
                <Box className="actions-section" sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                    <IconButton onClick={fetchData} className="refresh-button" size="small">
                        <RefreshIcon/>
                    </IconButton>
                </Box>
            </Box>

            {/* CORRECCIÓN 2: Filters Container - Alinear Derecha y Fondo */}
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
                                value={selectedCid}
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
                    />
                    
                    <TextField
                        label={t('clientPosts.category')}
                        variant="outlined"
                        size="small"
                        value={tempInputs.category}
                        onChange={handleCategoryChange}
                        inputProps={{maxLength: 30}}
                        sx={{minWidth: '120px'}}
                    />
                    
                    <TextField
                        select
                        label={t('clientPosts.sortBy')}
                        variant="outlined"
                        size="small"
                        value={filters.sort}
                        onChange={(e) => handleSort(e.target.value)}
                        sx={{minWidth: '120px'}}
                    >
                        <MenuItem value="deleted_at">{t('trash.deletedDate')}</MenuItem>
                        <MenuItem value="title">{t('clientPosts.title')}</MenuItem>
                    </TextField>
                    
                    <IconButton 
                        onClick={handleOrderToggle}
                        aria-label={filters.order === 'desc' ? t('clientPosts.sortDesc') : t('clientPosts.sortAsc')}
                    >
                        <FilterListIcon/>
                        {filters.order === 'desc' ? (
                            <ArrowDownwardIcon fontSize="small"/>
                        ) : (
                            <ArrowUpwardIcon fontSize="small"/>
                        )}
                    </IconButton>
                </Box>
            </Paper>

            {/* CORRECCIÓN 3: Uso de PaginatedTable con StyledTableRow */}
            <PaginatedTable
                headers={TrashTableHeaders}
                data={posts}
                loading={loading}
                error={error}
                pagination={pagination}
                filters={filters}
                fetchData={fetchData}
                handleSort={handleSort}
                handlePageChange={handlePageChange}
                handleLimitChange={handleLimitChange}
                renderRow={renderTrashRow}
            />
        </Box>
    );
};

export default TrashPage;