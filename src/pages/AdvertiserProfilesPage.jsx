import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Typography,
    Paper,
    Button,
    IconButton,
    Avatar,
    TextField,
    InputAdornment,
    Chip,
    Switch,
    FormControlLabel,
    FormGroup,
    TableCell,
    TableRow,
    styled,
    Stack
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Search as SearchIcon,
    Restore as RestoreIcon,
    Email as EmailIcon,
    Link as LinkIcon,
    Twitter as TwitterIcon,
    Instagram as InstagramIcon,
    Facebook as FacebookIcon,
} from '@mui/icons-material';
import Swal from 'sweetalert2';
import { getAdvertiserProfiles, deleteAdvertiserProfile, restoreAdvertiserProfile } from '../api/advertiserProfiles';
import useAdvertiserProfileModal from '../hooks/useAdvertiserProfileModal';
import AdvertiserProfileModal from '../components/Advertiser/AdvertiserProfileModal';
import PaginatedTable from '../components/Common/PaginatedTable';

const apiBaseUrl = process.env.REACT_APP_API_URL || '';

// Headers para PaginatedTable
const AdvertiserTableHeaders = [
    { id: 'avatar', labelKey: '', numeric: false, sortable: false, minWidth: 60 }, // Columna para avatar
    { id: 'name', labelKey: 'advertiser.name', numeric: false, sortable: true, minWidth: 200 },
    { id: 'email', labelKey: 'advertiser.email', numeric: false, sortable: true, minWidth: 150 },
    { id: 'social', labelKey: 'advertiser.social', numeric: false, sortable: false, minWidth: 150 },
    { id: 'status', labelKey: 'common.status', numeric: false, sortable: false, minWidth: 100 },
    { id: 'actions', labelKey: 'clientPosts.actions', numeric: false, sortable: false, minWidth: 100 },
];

const StyledTableRow = styled(TableRow)(({ theme }) => ({
    borderBottom: '1px solid var(--border-gray)',
    '&:last-child': { borderBottom: 'none' },
    '&:nth-of-type(odd)': { backgroundColor: 'rgba(0, 0, 0, 0.02)' },
    '&:hover': { backgroundColor: theme.palette.action.hover },
    '[data-theme="dark"] &:nth-of-type(odd)': { backgroundColor: 'rgba(255, 255, 255, 0.05)' },
}));

const AdvertiserProfilesPage = () => {
    const { t } = useTranslation();
    
    // Estados para PaginatedTable
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    const [showArchived, setShowArchived] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Estado de paginación (local, ya que getAdvertiserProfiles parece devolver todo)
    // Si tu API soporta paginación real, ajusta esto. Aquí simulo paginación en cliente o asumo que la API cambiará.
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
        currentProfile,
        openModal,
        closeModal,
        mode: modalMode
    } = useAdvertiserProfileModal();

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Asumiendo que getAdvertiserProfiles devuelve todos los datos por ahora
            // Si la API soporta paginación, pasar params: page, limit, sort, order, search
            const response = await getAdvertiserProfiles(showArchived);
            let data = response.data || [];

            // Filtrado local (si la API no lo hace)
            if (searchTerm) {
                const lowerTerm = searchTerm.toLowerCase();
                data = data.filter(profile =>
                    profile.name.toLowerCase().includes(lowerTerm) ||
                    profile.email?.toLowerCase().includes(lowerTerm) ||
                    profile.profileLink?.toLowerCase().includes(lowerTerm) ||
                    (profile.cids && profile.cids.some(cid => cid.toLowerCase().includes(lowerTerm)))
                );
            }

            // Ordenamiento local (si la API no lo hace)
            data.sort((a, b) => {
                const valA = (a[filters.sort] || '').toLowerCase();
                const valB = (b[filters.sort] || '').toLowerCase();
                if (valA < valB) return filters.order === 'asc' ? -1 : 1;
                if (valA > valB) return filters.order === 'asc' ? 1 : -1;
                return 0;
            });

            setPagination(prev => ({ ...prev, total: data.length }));
            
            // Paginación local
            const start = pagination.page * pagination.limit;
            const end = start + pagination.limit;
            setProfiles(data.slice(start, end));

        } catch (error) {
            setError(error.message || t('common.errorLoadingData'));
        }
        setLoading(false);
    }, [showArchived, searchTerm, pagination.page, pagination.limit, filters, t]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Handlers de Tabla
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

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setPagination(prev => ({ ...prev, page: 0 }));
    };

    // Handlers de Acciones
    const handleNew = () => openModal({ name: '', avatarUrl: '', profileLink: '' });
    const handleEdit = (profile) => openModal(profile);
    
    const handleSave = () => {
        fetchData();
        closeModal();
    };

    const handleDelete = async (id, permanent = false) => {
        const result = await Swal.fire({
            title: permanent ?
                t('advertiser.confirmPermanentDeleteTitle', 'Permanently delete profile?') :
                t('advertiser.confirmDeleteTitle', 'Archive profile?'),
            text: permanent ?
                t('advertiser.confirmPermanentDeleteText', 'This action cannot be undone. All data will be lost.') :
                t('advertiser.confirmDeleteText', 'The profile will be archived and hidden from active use.'),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: permanent ?
                t('common.deletePermanently', 'Delete Permanently') :
                t('common.archive', 'Archive'),
            cancelButtonText: t('common.cancel', 'Cancel')
        });

        if (result.isConfirmed) {
            setLoading(true);
            try {
                await deleteAdvertiserProfile(id, permanent);
                Swal.fire(
                    t('common.success', 'Success'),
                    permanent ?
                        t('advertiser.deletedPermanentSuccess', 'The advertiser profile has been permanently deleted.') :
                        t('advertiser.archivedSuccess', 'The advertiser profile has been archived.'),
                    'success'
                );
                fetchData();
            } catch (error) {
                Swal.fire(t('common.error', 'Error'), error.message, 'error');
                setLoading(false);
            }
        }
    };

    const handleRestore = async (id) => {
        const result = await Swal.fire({
            title: t('advertiser.confirmRestoreTitle', 'Restore profile?'),
            text: t('advertiser.confirmRestoreText', 'The profile will be visible again for active use.'),
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: t('common.restore', 'Restore'),
            cancelButtonText: t('common.cancel', 'Cancel')
        });

        if (result.isConfirmed) {
            setLoading(true);
            try {
                await restoreAdvertiserProfile(id);
                Swal.fire(
                    t('common.success', 'Success'),
                    t('advertiser.restoredSuccess', 'The advertiser profile has been restored.'),
                    'success'
                );
                fetchData();
            } catch (error) {
                Swal.fire(t('common.error', 'Error'), error.message, 'error');
                setLoading(false);
            }
        }
    };

    // Helpers visuales
    const getPreviewUrl = (url) => {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        return `${apiBaseUrl}${url}`;
    };

    const formatUrl = (url) => {
        if (!url) return '';
        return url.length > 30 ? `${url.substring(0, 30)}...` : url;
    };

    const getSocialIcon = (platform) => {
        const icons = {
            twitter: <TwitterIcon fontSize="small" sx={{ color: '#1DA1F2' }} />,
            instagram: <InstagramIcon fontSize="small" sx={{ color: '#E4405F' }} />,
            facebook: <FacebookIcon fontSize="small" sx={{ color: '#1877F2' }} />
        };
        return icons[platform];
    };

    // Render Row
    const renderProfileRow = (profile) => (
        <StyledTableRow key={profile._id} hover>
            <TableCell>
                <Avatar
                    src={getPreviewUrl(profile.avatarUrl)}
                    sx={{ width: 40, height: 40 }}
                >
                    {profile.name.charAt(0)}
                </Avatar>
            </TableCell>
            <TableCell>
                <Box>
                    <Typography variant="body2" fontWeight={500}>{profile.name}</Typography>
                    {profile.profileLink && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                            <LinkIcon fontSize="inherit" color="action" sx={{ fontSize: 14 }} />
                            <Typography variant="caption" color="primary">
                                <a href={profile.profileLink} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
                                    {formatUrl(profile.profileLink)}
                                </a>
                            </Typography>
                        </Box>
                    )}
                </Box>
            </TableCell>
            <TableCell>
                {profile.email && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <EmailIcon fontSize="small" color="action" />
                        <Typography variant="body2">{profile.email}</Typography>
                    </Box>
                )}
            </TableCell>
            <TableCell>
                <Stack direction="row" spacing={1}>
                    {profile.twitterProfile && getSocialIcon('twitter')}
                    {profile.instagramProfile && getSocialIcon('instagram')}
                    {profile.facebookProfile && getSocialIcon('facebook')}
                </Stack>
            </TableCell>
            <TableCell>
                {profile.softDeleteVisibility === 'archived' ? (
                    <Chip label={t('common.archived', 'Archived')} size="small" color="default" variant="outlined" />
                ) : (
                    <Chip label={t('common.active', 'Active')} size="small" color="success" variant="outlined" />
                )}
            </TableCell>
            <TableCell>
                {profile.softDeleteVisibility === 'archived' ? (
                    <IconButton
                        size="small"
                        color="success"
                        onClick={() => handleRestore(profile._id)}
                        title={t('common.restore')}
                    >
                        <RestoreIcon fontSize="small" />
                    </IconButton>
                ) : (
                    <IconButton
                        size="small"
                        onClick={() => handleEdit(profile)}
                        title={t('common.edit')}
                    >
                        <EditIcon fontSize="small" />
                    </IconButton>
                )}
                <IconButton
                    size="small"
                    color={profile.softDeleteVisibility === 'archived' ? 'error' : 'default'}
                    onClick={() => handleDelete(profile._id, profile.softDeleteVisibility === 'archived')}
                    title={profile.softDeleteVisibility === 'archived' ? t('common.deletePermanently') : t('common.archive')}
                >
                    <DeleteIcon fontSize="small" />
                </IconButton>
            </TableCell>
        </StyledTableRow>
    );

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', mb: 3, p: 2, background: 'var(--card-bg)', borderRadius: '12px' }}>
                <Typography variant="h4" className="title">
                    {t('advertiser.title', 'Manage Advertiser Profiles')}
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleNew}
                    disabled={loading}
                >
                    {t('advertiser.new', 'New Profile')}
                </Button>
            </Box>

            <Paper elevation={0} sx={{ background: 'var(--content-bg)', p: 0, mb: 2 }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, p: 2, background: 'var(--surface-color)', borderRadius: '12px', alignItems: 'center' }}>
                    <TextField
                        placeholder={t('advertiser.searchPlaceholder', 'Search...')}
                        variant="outlined"
                        size="small"
                        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment> }}
                        value={searchTerm}
                        onChange={handleSearchChange}
                        sx={{ flexGrow: 1, minWidth: '200px' }}
                    />
                    <FormGroup>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={showArchived}
                                    onChange={(e) => {
                                        setShowArchived(e.target.checked);
                                        setPagination(prev => ({ ...prev, page: 0 }));
                                    }}
                                    color="primary"
                                />
                            }
                            label={t('advertiser.showArchived', 'Show archived')}
                        />
                    </FormGroup>
                </Box>
            </Paper>

            <PaginatedTable
                headers={AdvertiserTableHeaders}
                data={profiles}
                loading={loading}
                error={error}
                pagination={pagination}
                filters={filters}
                fetchData={fetchData}
                handleSort={handleSort}
                handlePageChange={handlePageChange}
                handleLimitChange={handleLimitChange}
                renderRow={renderProfileRow}
            />

            <AdvertiserProfileModal
                open={modalOpen}
                onClose={closeModal}
                initialData={currentProfile}
                mode={modalMode}
                onSave={handleSave}
            />
        </Box>
    );
};

export default AdvertiserProfilesPage;