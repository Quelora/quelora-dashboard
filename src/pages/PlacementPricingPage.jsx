import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Typography,
    Paper,
    Button,
    IconButton,
    TableCell,
    TableRow,
    styled,
    Chip,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import {
    Add as AddIcon,
    Refresh as RefreshIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Search as SearchIcon,
    ArrowUpward as ArrowUpwardIcon,
    ArrowDownward as ArrowDownwardIcon,
    FilterList as FilterListIcon
} from '@mui/icons-material';
import Swal from 'sweetalert2';
import { getPlacementPricing, deletePlacementPricing } from '../api/placementPricing';
import { getPlacements } from '../api/placements';
import { loadClientsFromSession } from '../api/auth';
import usePlacementPricingModal from '../hooks/usePlacementPricingModal';
import PlacementPricingModal from '../components/Placement/PlacementPricingModal';
import PaginatedTable from '../components/Common/PaginatedTable';

const PlacementPricingTableHeaders = [
    { id: 'placement', labelKey: 'placementPricing.placement', numeric: false, sortable: true, minWidth: 200 },
    { id: 'cid', labelKey: 'placementPricing.cid', numeric: false, sortable: true, minWidth: 200 },
    { id: 'floorPriceCPM', labelKey: 'placementPricing.floorPriceCPM', numeric: true, sortable: true, minWidth: 100 },
    { id: 'floorPriceCPC', labelKey: 'placementPricing.floorPriceCPC', numeric: true, sortable: true, minWidth: 100 },
    { id: 'geoCount', labelKey: 'placementPricing.geoCount', numeric: false, sortable: false, minWidth: 150 },
    { id: 'actions', labelKey: 'clientPosts.actions', numeric: false, sortable: false, minWidth: 100 },
];

const StyledTableRow = styled(TableRow)(({ theme }) => ({
    borderBottom: '1px solid var(--border-gray)',
    '&:last-child': { borderBottom: 'none' },
    '&:nth-of-type(odd)': { backgroundColor: 'rgba(0, 0, 0, 0.02)' },
    '&:hover': { backgroundColor: theme.palette.action.hover },
    '[data-theme="dark"] &:nth-of-type(odd)': { backgroundColor: 'rgba(255, 255, 255, 0.05)' },
}));

const PlacementPricingPage = () => {
    const { t } = useTranslation();
    const [clientList, setClientList] = useState([]);
    const [placements, setPlacements] = useState([]);
    
    const [pricingRules, setPricingRules] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedCid, setSelectedCid] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const [pagination, setPagination] = useState({
        page: 0,
        limit: 10,
        total: 0
    });

    const [filters, setFilters] = useState({
        sort: 'cid',
        order: 'asc'
    });

    const {
        isOpen: modalOpen,
        currentPricing,
        openModal,
        closeModal,
        mode: modalMode
    } = usePlacementPricingModal();

    useEffect(() => {
        const loadDependencies = async () => {
            try {
                const placementsRes = await getPlacements();
                setPlacements(placementsRes.data.placements || []);

                const clients = loadClientsFromSession();
                setClientList(clients);
                if (clients.length > 0 && !selectedCid) {
                    setSelectedCid(clients[0].cid);
                }
            } catch (err) {
                console.error('Error loading dependencies:', err);
            }
        };
        loadDependencies();
    }, []);

    const fetchData = async () => {
        if (clientList.length > 0 && !selectedCid) return;

        setLoading(true);
        setError(null);
        try {
            // CORRECCIÓN AQUÍ: Separamos los queryParams del argumento CID
            const queryParams = {
                page: pagination.page + 1,
                limit: pagination.limit,
                sort: filters.sort,
                order: filters.order,
                search: searchTerm
            };

            // Pasamos selectedCid como primer argumento y el resto como objeto
            const response = await getPlacementPricing(selectedCid, queryParams);
            
            const data = response.data || [];
            const total = response.total || response.pagination?.totalItems || data.length;

            setPricingRules(data);
            setPagination(prev => ({ ...prev, total }));

        } catch (err) {
            console.error(err);
            setError(err.message || t('common.errorLoadingData'));
            setPricingRules([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [pagination.page, pagination.limit, filters, selectedCid, searchTerm]); 

    const handleSort = (columnId) => {
        setFilters(prev => ({
            sort: columnId,
            order: prev.sort === columnId && prev.order === 'asc' ? 'desc' : 'asc'
        }));
        setPagination(prev => ({ ...prev, page: 0 }));
    };

    const handleOrderToggle = () => {
        setFilters(prev => ({
            ...prev,
            order: prev.order === 'asc' ? 'desc' : 'asc'
        }));
    };

    const handlePageChange = (event, newPage) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    };

    const handleLimitChange = (event) => {
        setPagination(prev => ({ ...prev, limit: parseInt(event.target.value, 10), page: 0 }));
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setPagination(prev => ({ ...prev, page: 0 }));
    };

    const handleCidChange = (e) => {
        setSelectedCid(e.target.value);
        setPagination(prev => ({ ...prev, page: 0 }));
    };

    const handleNewClick = () => openModal({ cid: selectedCid });
    const handleEditClick = (pricing) => openModal(pricing);
    
    const handleSave = () => {
        fetchData();
        closeModal();
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: t('placementPricing.confirmDeleteTitle', 'Delete pricing rule?'),
            text: t('placementPricing.confirmDeleteText', "This will remove the custom pricing for this client."),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: t('common.delete', 'Delete'),
            cancelButtonText: t('common.cancel', 'Cancel')
        });

        if (result.isConfirmed) {
            try {
                await deletePlacementPricing(id);
                Swal.fire(
                    t('common.deleted', 'Deleted!'),
                    t('placementPricing.deletedSuccess', 'The pricing rule has been deleted.'),
                    'success'
                );
                fetchData();
            } catch (error) {
                Swal.fire(t('common.error', 'Error'), error.message, 'error');
            }
        }
    };

    const getPlacementName = (placementId) => {
        const placement = placements.find(p => p._id === placementId);
        return placement ? `${placement.name} (${placement.key})` : 'Unknown Placement';
    };

    const getClientDisplayInfo = (cid) => {
        const client = clientList.find(c => c.cid === cid);
        if (client) {
            return {
                name: client.description || client.name || cid,
                sub: client.cid
            };
        }
        return { name: cid, sub: '' };
    };

    const renderPricingRow = (pricing) => {
        const placementName = getPlacementName(pricing.placementId);
        const clientInfo = getClientDisplayInfo(pricing.cid);
        const geoPricing = pricing.geoPricing || [];

        return (
            <StyledTableRow key={pricing._id} hover>
                <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {placementName}
                    </Typography>
                </TableCell>
                <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {clientInfo.name}
                        </Typography>
                        {clientInfo.sub && clientInfo.sub !== clientInfo.name && (
                            <Typography variant="caption" color="textSecondary" sx={{ fontFamily: 'monospace' }}>
                                ({clientInfo.sub})
                            </Typography>
                        )}
                    </Box>
                </TableCell>
                <TableCell align="right">
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        ${pricing.floorPriceCPM?.toFixed(2)} <span style={{ fontSize: '0.75em', color: '#666' }}>CPM</span>
                    </Typography>
                </TableCell>
                <TableCell align="right">
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        ${pricing.floorPriceCPC?.toFixed(2)} <span style={{ fontSize: '0.75em', color: '#666' }}>CPC</span>
                    </Typography>
                </TableCell>
                <TableCell align="left">
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
                        {geoPricing.length === 0 ? (
                            <Chip label="Global" size="small" variant="outlined" />
                        ) : (
                            geoPricing.slice(0, 3).map(geo => (
                                <Chip
                                    key={geo.country}
                                    label={geo.country}
                                    size="small"
                                    variant="outlined"
                                    color="primary"
                                    sx={{ mr: 0.5, mb: 0.5, fontSize: '0.7rem', height: '20px' }}
                                />
                            ))
                        )}
                        {geoPricing.length > 3 && (
                            <Chip label={`+${geoPricing.length - 3}`} size="small" variant="outlined" sx={{ height: '20px' }} />
                        )}
                    </Box>
                </TableCell>
                <TableCell>
                    <IconButton
                        size="small"
                        aria-label="edit"
                        onClick={() => handleEditClick(pricing)}
                    >
                        <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                        size="small"
                        aria-label="delete"
                        onClick={() => handleDelete(pricing._id)}
                    >
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                </TableCell>
            </StyledTableRow>
        );
    };

    return (
        <Box className="client-posts-container">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', mb: 3, p: 2, background: 'var(--card-bg)', borderRadius: '12px' }}>
                <Typography variant="h4" className="title">
                    {t('placementPricing.title', 'Manage Placement Pricing')}
                </Typography>
                <Box className="actions-section" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleNewClick}
                        disabled={!selectedCid}
                    >
                        {t('placementPricing.new', 'New Pricing Rule')}
                    </Button>
                    <IconButton onClick={fetchData} className="refresh-button" size="small" disabled={loading}>
                        <RefreshIcon />
                    </IconButton>
                </Box>
            </Box>

            <Paper elevation={0} sx={{ background: 'var(--content-bg)', p: 0, mb: 2, textAlign: { xs: 'left', sm: 'right' } }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, p: 2, background: 'var(--surface-color)', borderRadius: '12px' }}>
                    {clientList.length > 0 && (
                        <FormControl size="small" sx={{ minWidth: 200, flexShrink: 0 }}>
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
                        label={t('placementPricing.searchPlaceholder', 'Search...')}
                        variant="outlined"
                        size="small"
                        InputProps={{ startAdornment: <SearchIcon color="action" /> }}
                        value={searchTerm}
                        onChange={handleSearchChange}
                        sx={{ flexGrow: 1, minWidth: '150px' }}
                        disabled={!selectedCid}
                    />
                    <TextField
                        select
                        label={t('clientPosts.sortBy')}
                        variant="outlined"
                        size="small"
                        value={filters.sort}
                        onChange={(e) => handleSort(e.target.value)}
                        sx={{ minWidth: '120px' }}
                        disabled={!selectedCid}
                    >
                        <MenuItem value="cid">{t('placementPricing.cid')}</MenuItem>
                        <MenuItem value="placement">{t('placementPricing.placement')}</MenuItem>
                        <MenuItem value="floorPriceCPM">{t('placementPricing.floorPriceCPM')}</MenuItem>
                        <MenuItem value="floorPriceCPC">{t('placementPricing.floorPriceCPC')}</MenuItem>
                    </TextField>
                    <IconButton
                        onClick={handleOrderToggle}
                        aria-label={filters.order === 'desc' ? t('clientPosts.sortDesc') : t('clientPosts.sortAsc')}
                        disabled={!selectedCid}
                    >
                        <FilterListIcon />
                        {filters.order === 'desc' ? (<ArrowDownwardIcon fontSize="small" />) : (<ArrowUpwardIcon fontSize="small" />)}
                    </IconButton>
                </Box>
            </Paper>

            <PaginatedTable
                headers={PlacementPricingTableHeaders}
                data={pricingRules}
                loading={loading}
                error={error}
                pagination={pagination}
                filters={filters}
                fetchData={fetchData}
                handleSort={handleSort}
                handlePageChange={handlePageChange}
                handleLimitChange={handleLimitChange}
                renderRow={renderPricingRow}
            />

            <PlacementPricingModal
                open={modalOpen}
                onClose={closeModal}
                initialData={currentPricing}
                mode={modalMode}
                onSave={handleSave}
            />
        </Box>
    );
};

export default PlacementPricingPage;