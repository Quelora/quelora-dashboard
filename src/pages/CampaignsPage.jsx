// filepath: ./src/pages/CampaignsPage.jsx
import React, { useState, useEffect } from 'react';
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
    CircularProgress,
    Tooltip,
    LinearProgress
} from '@mui/material';
import {
    Add as AddIcon,
    Refresh as RefreshIcon,
    Search as SearchIcon,
    FilterList as FilterListIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    ArrowUpward as ArrowUpwardIcon,
    ArrowDownward as ArrowDownwardIcon,
    CheckCircle as CheckCircleIcon,
    PauseCircle as PauseCircleIcon,
    HighlightOff as HighlightOffIcon,
    DoNotDisturbOn as DoNotDisturbOnIcon,
    Drafts as DraftsIcon,
    StopCircle as StopIcon,
    PlayArrow as ActiveIcon,
    Pause as PauseIcon,
    Stop as EndedIcon
} from '@mui/icons-material';
import Swal from 'sweetalert2';
import { getCampaigns, deleteCampaign, getCampaign } from '../api/campaigns';
import useCampaignModal from '../hooks/useCampaignModal';
import CampaignModal from '../components/Campaign/CampaignModal';
import usePaginatedList from '../hooks/usePaginatedList';
import PaginatedTable from '../components/Common/PaginatedTable';
import { loadClientsFromSession } from '../api/auth';
import EnterpriseGate from '../components/Common/EnterpriseGate';

// --- Headers actualizados con Budget ---
const CampaignTableHeaders = [
    { id: 'name', labelKey: 'campaign.name', numeric: false, sortable: true, minWidth: 250 },
    { id: 'status', labelKey: 'campaign.status', numeric: false, sortable: true, minWidth: 100 },
    { id: 'budget', labelKey: 'campaign.budget', numeric: false, sortable: false, minWidth: 180 },
    { id: 'startDate', labelKey: 'campaign.startDate', numeric: false, sortable: true, minWidth: 120 },
    { id: 'endDate', labelKey: 'campaign.endDate', numeric: false, sortable: true, minWidth: 120 },
    { id: 'impressionsCount', labelKey: 'campaign.impressions', numeric: true, sortable: true, minWidth: 100 },
    { id: 'clicksCount', labelKey: 'campaign.clicks', numeric: true, sortable: true, minWidth: 100 },
    { id: 'actions', labelKey: 'clientPosts.actions', numeric: false, sortable: false, minWidth: 120 },
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

// --- Nuevos Componentes Visuales ---

const StatusChip = ({ campaign, t }) => {
    const { status, budgetStatus, startDate, endDate } = campaign;
    const now = new Date();
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    let color = 'default';
    let icon = <DoNotDisturbOnIcon fontSize="small" />;
    let labelKey = 'campaign.statusUnknown';

    if (status === 'draft') {
        labelKey = 'campaign.statusDraft';
        color = 'default';
        icon = <DraftsIcon fontSize="small" />;
    } else if (status === 'paused') {
        labelKey = 'campaign.statusPaused';
        color = 'warning';
        icon = <PauseIcon fontSize="small" />;
    } else if (end && end < now) {
        labelKey = 'campaign.statusEnded';
        color = 'default'; // Gris para finalizadas
        icon = <EndedIcon fontSize="small" />;
    } else if (start && start > now) {
        labelKey = 'campaign.statusScheduled';
        color = 'info';
        icon = <PauseCircleIcon fontSize="small" />;
    } else if (status === 'active') {
        if (budgetStatus === 'exhausted') {
            labelKey = 'campaign.budgetExhausted';
            color = 'error';
            icon = <StopIcon fontSize="small" />;
        } else {
            labelKey = 'campaign.statusActive';
            color = 'success';
            icon = <ActiveIcon fontSize="small" />;
        }
    }

    return (
        <Chip 
            icon={icon} 
            label={t(labelKey)} 
            color={color} 
            size="small" 
            variant="outlined" 
            sx={{ minWidth: 90, justifyContent: 'flex-start' }}
        />
    );
};

const BudgetProgress = ({ spent, total }) => {
    const percent = total > 0 ? Math.min((spent / total) * 100, 100) : 0;
    let color = 'primary';
    if (percent > 80) color = 'warning';
    if (percent >= 100) color = 'error';

    return (
        <Box sx={{ width: '100%', minWidth: 140 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5, alignItems: 'baseline' }}>
                <Typography variant="body2" sx={{fontWeight: 600, fontSize: '0.80rem'}}>
                    ${spent.toFixed(2)}
                </Typography>
                <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.70rem' }}>
                    / ${total.toLocaleString()}
                </Typography>
            </Box>
            <Tooltip title={`${percent.toFixed(1)}% Used`}>
                <LinearProgress 
                    variant="determinate" 
                    value={percent} 
                    color={color} 
                    sx={{ 
                        height: 6, 
                        borderRadius: 3,
                        backgroundColor: 'rgba(0,0,0,0.05)'
                    }} 
                />
            </Tooltip>
        </Box>
    );
};

// --- Componente Principal ---

const CampaignsPage = () => {
    const { t } = useTranslation();
    const {
        isOpen: campaignModalOpen,
        currentCampaign,
        openModal: openCampaignModal,
        closeModal: closeCampaignModal,
        mode: campaignModalMode
    } = useCampaignModal();

    const [clientList, setClientList] = useState([]);
    const [modalLoading, setModalLoading] = useState(false);

    const {
        data: campaigns,
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
    } = usePaginatedList(getCampaigns, null, {
        sort: 'created_at',
        order: 'desc',
        dataKey: 'campaigns'
    });

    useEffect(() => {
        try {
            const clients = loadClientsFromSession();
            setClientList(clients);
            if (clients.length > 0 && !selectedCid) {
                setSelectedCid(clients[0].cid);
                setTempInputs(prev => ({ ...prev, search: '' }));
            }
        } catch (e) {
            console.error('Error loading clients:', e);
            setClientList([]);
        }
    }, [setSelectedCid, setTempInputs]);

    const handleSearchChange = (e) => {
        handleDebouncedFilterChange('search', e.target.value);
    };

    const handleNewCampaignClick = () => {
        openCampaignModal({ cid: selectedCid, creatives: [] });
    };

    const handleEditCampaign = async (campaign) => {
        setModalLoading(true);
        openCampaignModal(null, 'edit');
        try {
            const response = await getCampaign(campaign._id);
            openCampaignModal(response.data, 'edit');
        } catch (error) {
            Swal.fire(t('common.error', 'Error'), t('campaign.errorLoading', 'Could not load campaign data.'), 'error');
            closeCampaignModal();
        }
        setModalLoading(false);
    };

    const handleDeleteCampaign = async (campaignId) => {
        const result = await Swal.fire({
            title: t('campaign.confirmDeleteTitle', 'Delete campaign?'),
            text: t('campaign.confirmDeleteText', "You won't be able to revert this."),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: t('common.delete', 'Delete'),
            cancelButtonText: t('common.cancel', 'Cancel')
        });

        if (!result.isConfirmed) return;
        try {
            await deleteCampaign(campaignId, selectedCid);
            Swal.fire({
                title: t('campaign.deletedSuccessTitle', 'Deleted!'),
                text: t('campaign.deletedSuccessText', 'The campaign has been deleted.'),
                icon: 'success',
                timer: 2000,
                timerProgressBar: true,
                showConfirmButton: false
            });
            fetchData();
        } catch (error) {
            Swal.fire({
                title: t('campaign.deleteErrorTitle', 'Error'),
                text: error.message || t('campaign.deleteErrorText', 'Could not delete the campaign.'),
                icon: 'error'
            });
        }
    };

    const handleCampaignSave = () => {
        fetchData();
        closeCampaignModal();
    };

    const renderCampaignRow = (campaign) => {
        return (
            <StyledTableRow key={campaign._id} hover>
                <TableCell>
                    <Typography variant="body2" className="post-title" noWrap sx={{ maxWidth: 300, fontWeight: 500 }}>
                        {campaign.name}
                    </Typography>
                </TableCell>
                <TableCell>
                    <StatusChip campaign={campaign} t={t} />
                </TableCell>
                <TableCell>
                    <BudgetProgress 
                        spent={campaign.budgetSpent || 0} 
                        total={campaign.budgetTotal || 0} 
                    />
                </TableCell>
                <TableCell>
                    {campaign.startDate ? new Date(campaign.startDate).toLocaleDateString() : 'N/A'}
                </TableCell>
                <TableCell>
                    {campaign.endDate ? new Date(campaign.endDate).toLocaleDateString() : t('common.none', 'None')}
                </TableCell>
                <TableCell align="center">
                    {campaign.impressionsCount || 0}
                </TableCell>
                <TableCell align="center">
                    {campaign.clicksCount || 0}
                </TableCell>
                <TableCell>
                    <IconButton
                        size="small"
                        aria-label={t('clientPosts.edit')}
                        onClick={() => handleEditCampaign(campaign)}
                    ><EditIcon fontSize="small"/></IconButton><IconButton
                        size="small"
                        aria-label={t('common.delete')}
                        onClick={() => handleDeleteCampaign(campaign._id)}
                    ><DeleteIcon fontSize="small"/></IconButton>
                </TableCell>
            </StyledTableRow>
        );
    };

    return (
        <EnterpriseGate module="advertising" fullPage>
        <Box className="client-posts-container">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', mb: 3, p: 2, background: 'var(--card-bg)', borderRadius: '12px' }}>
                <Typography variant="h4" className="title">
                    {t('campaign.title', 'Campaigns')}
                </Typography>
                <Box className="actions-section" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon/>}
                        onClick={handleNewCampaignClick}
                        disabled={!selectedCid}
                    >
                        {t('campaign.newCampaign', 'New Campaign')}
                    </Button>
                    <IconButton onClick={fetchData} className="refresh-button" size="small" disabled={loading}>
                        <RefreshIcon/>
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
                        label={t('clientPosts.search')}
                        variant="outlined"
                        size="small"
                        InputProps={{ startAdornment: <SearchIcon color="action"/> }}
                        value={tempInputs.search || ''}
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
                        <MenuItem value="created_at">{t('clientPosts.date')}</MenuItem>
                        <MenuItem value="name">{t('campaign.name')}</MenuItem>
                        <MenuItem value="status">{t('campaign.status')}</MenuItem>
                        <MenuItem value="impressionsCount">{t('campaign.impressions')}</MenuItem>
                        <MenuItem value="clicksCount">{t('campaign.clicks')}</MenuItem>
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
                headers={CampaignTableHeaders}
                data={campaigns}
                loading={loading}
                error={error}
                pagination={pagination}
                filters={filters}
                fetchData={fetchData}
                handleSort={handleSort}
                handlePageChange={handlePageChange}
                handleLimitChange={handleLimitChange}
                renderRow={renderCampaignRow}
            />
            
            <CampaignModal
                open={campaignModalOpen}
                onClose={closeCampaignModal}
                initialData={currentCampaign}
                mode={campaignModalMode}
                onSave={handleCampaignSave}
                isLoading={modalLoading}
                cid={selectedCid}
            />
        </Box>
        </EnterpriseGate>
    );
};

export default CampaignsPage;