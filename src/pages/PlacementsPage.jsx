import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Typography,
    Button,
    IconButton,
    TableCell,
    TableRow,
    styled,
    Chip,
    Avatar
} from '@mui/material';
import {
    Add as AddIcon,
    Refresh as RefreshIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Devices as AllDevicesIcon,
    DesktopWindows as DesktopIcon,
    PhoneIphone as MobileIcon
} from '@mui/icons-material';
import Swal from 'sweetalert2';
import { getPlacements, deletePlacement } from '../api/placements';
import usePlacementModal from '../hooks/usePlacementModal';
import PlacementModal from '../components/Placement/PlacementModal';
import PaginatedTable from '../components/Common/PaginatedTable';
import EnterpriseGate from '../components/Common/EnterpriseGate';

// Definición de cabeceras compatible con PaginatedTable
const PlacementTableHeaders = [
    { id: 'name', labelKey: 'placement.name', numeric: false, sortable: true, minWidth: 200 },
    { id: 'key', labelKey: 'placement.key', numeric: false, sortable: true, minWidth: 150 },
    { id: 'floorPriceCPM', labelKey: 'placement.floorPriceCPM', numeric: true, sortable: true, minWidth: 100 },
    { id: 'floorPriceCPC', labelKey: 'placement.floorPriceCPC', numeric: true, sortable: true, minWidth: 100 },
    { id: 'size', labelKey: 'placement.size', numeric: false, sortable: false, minWidth: 100 },
    { id: 'device', labelKey: 'placement.device', numeric: false, sortable: true, minWidth: 100 },
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

const DeviceChip = ({ device, t }) => {
    const icons = {
        all: <AllDevicesIcon fontSize="small" />,
        desktop: <DesktopIcon fontSize="small" />,
        mobile: <MobileIcon fontSize="small" />
    };
    const labels = {
        all: t('placement.allDevices', 'All Devices'),
        desktop: t('placement.desktopOnly', 'Desktop Only'),
        mobile: t('placement.mobileOnly', 'Mobile Only')
    };
    return (
        <Chip
            icon={icons[device] || icons.all}
            label={labels[device] || labels.all}
            size="small"
            variant="outlined"
        />
    );
};

const PlacementsPage = () => {
    const { t } = useTranslation();
    const [isAdmin, setIsAdmin] = useState(false);
    
    // Estados para PaginatedTable
    const [placements, setPlacements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const [pagination, setPagination] = useState({
        page: 0,
        limit: 10,
        total: 0
    });

    const [filters, setFilters] = useState({ 
        sort: 'name', 
        order: 'asc' 
    });

    const {
        isOpen: modalOpen,
        currentPlacement,
        openModal,
        closeModal,
        mode: modalMode
    } = usePlacementModal();

    useEffect(() => {
        try {
            const userString = sessionStorage.getItem('user');
            if (userString) {
                const user = JSON.parse(userString);
                setIsAdmin(user?.role === 'god');
            }
        } catch (e) {
            console.error("Error reading user from sessionStorage", e);
            setIsAdmin(false);
        }
    }, []);
    
    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await getPlacements({
                page: pagination.page + 1, // API suele usar base-1
                limit: pagination.limit,
                sort: filters.sort,
                order: filters.order
            });
            
            // Ajustar según la respuesta real de tu API. 
            // Asumo que retorna { data: { placements: [], total: N } }
            // Si la API anterior devolvía todo con limit 1000, esto funcionará paginado si el backend lo soporta.
            const data = response.data?.placements || [];
            const total = response.data?.total || response.data?.totalItems || data.length;

            setPlacements(data);
            setPagination(prev => ({
                ...prev,
                total: total
            }));

        } catch (err) {
            setError(err.message || t('common.errorLoadingData'));
        }
        setLoading(false);
    }, [pagination.page, pagination.limit, filters]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Handlers para la tabla
    const handleSort = (columnId) => {
        setFilters(prev => ({
            sort: columnId,
            order: prev.sort === columnId && prev.order === 'asc' ? 'desc' : 'asc'
        }));
        setPagination(prev => ({ ...prev, page: 0 }));
    };

    const handlePageChange = (event, newPage) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    };

    const handleLimitChange = (event) => {
        setPagination(prev => ({ ...prev, limit: parseInt(event.target.value, 10), page: 0 }));
    };

    // Handlers de acciones
    const handleNewClick = () => openModal({});
    const handleEditClick = (placement) => openModal(placement);
    
    const handleSave = () => {
        fetchData();
        closeModal();
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: t('placement.confirmDeleteTitle', 'Delete placement?'),
            text: t('placement.confirmDeleteText', "You won't be able to revert this."),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: t('common.delete', 'Delete'),
            cancelButtonText: t('common.cancel', 'Cancel')
        });

        if (result.isConfirmed) {
            try {
                await deletePlacement(id);
                Swal.fire(
                    t('common.deleted', 'Deleted!'),
                    t('placement.deletedSuccess', 'The placement has been deleted.'),
                    'success'
                );
                fetchData(); // Recargar datos
            } catch (error) {
                Swal.fire(t('common.error', 'Error'), error.message, 'error');
            }
        }
    };

    // Render de filas para PaginatedTable
    const renderPlacementRow = (placement) => (
        <StyledTableRow key={placement._id} hover>
            <TableCell>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {placement.name}
                </Typography>
            </TableCell>
            <TableCell>
                <Chip label={placement.key} size="small" />
            </TableCell>
            <TableCell align="right">
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    ${placement.floorPriceCPM?.toFixed(2)} <span style={{fontSize: '0.75em', color: '#666'}}>CPM</span>
                </Typography>
            </TableCell>
            <TableCell align="right">
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    ${placement.floorPriceCPC?.toFixed(2)} <span style={{fontSize: '0.75em', color: '#666'}}>CPC</span>
                </Typography>
            </TableCell>
            <TableCell>
                <Typography variant="body2">
                    {placement.width}px × {placement.height}px
                </Typography>
            </TableCell>
            <TableCell>
                <DeviceChip device={placement.device} t={t} />
            </TableCell>
            <TableCell>
                {isAdmin && (
                    <>
                        <IconButton
                            size="small"
                            aria-label="edit"
                            onClick={(e) => { e.stopPropagation(); handleEditClick(placement); }}
                        ><EditIcon fontSize="small"/></IconButton>
                        <IconButton
                            size="small"
                            aria-label="delete"
                            onClick={(e) => { e.stopPropagation(); handleDelete(placement._id); }}
                        ><DeleteIcon fontSize="small"/></IconButton>
                    </>
                )}
            </TableCell>
        </StyledTableRow>
    );

    return (
        <EnterpriseGate module="advertising" fullPage>
        <Box>
            <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                flexWrap: 'wrap', 
                mb: 3, 
                p: 2, 
                background: 'var(--card-bg)', 
                borderRadius: '12px' 
            }}>
                <Typography variant="h4" className="title">
                    {t('placement.title', 'Manage Placements')}
                </Typography>
                <Box className="actions-section" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {isAdmin && (
                        <Button
                            variant="contained"
                            startIcon={<AddIcon/>}
                            onClick={handleNewClick}
                        >
                            {t('placement.new', 'New Placement')}
                        </Button>
                    )}
                    <IconButton onClick={fetchData} className="refresh-button" size="small" disabled={loading}>
                        <RefreshIcon/>
                    </IconButton>
                </Box>
            </Box>

            <PaginatedTable
                headers={PlacementTableHeaders}
                data={placements}
                loading={loading}
                error={error}
                pagination={pagination}
                filters={filters}
                fetchData={fetchData}
                handleSort={handleSort}
                handlePageChange={handlePageChange}
                handleLimitChange={handleLimitChange}
                renderRow={renderPlacementRow}
            />

            <PlacementModal
                open={modalOpen}
                onClose={closeModal}
                initialData={currentPlacement}
                mode={modalMode}
                onSave={handleSave}
            />
        </Box>
        </EnterpriseGate>
    );
};

export default PlacementsPage;