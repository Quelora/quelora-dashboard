/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

// filepath: ./src/pages/SurveysPage.jsx
import React, { useState, useEffect, useRef } from 'react';
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
    Edit as EditIcon,
    Delete as DeleteIcon,
    ArrowUpward as ArrowUpwardIcon,
    ArrowDownward as ArrowDownwardIcon,
    CheckCircle as CheckCircleIcon,
    PauseCircle as PauseCircleIcon,
    HighlightOff as HighlightOffIcon,
    DoNotDisturbOn as DoNotDisturbOnIcon
} from '@mui/icons-material';
import Swal from 'sweetalert2';
import { getSurveys, deleteSurvey } from '../api/surveys';
import useSurveyModal from '../hooks/useSurveyModal';
import SurveyModal from '../components/Survey/SurveyModal';
import usePaginatedList from '../hooks/usePaginatedList';
import PaginatedTable from '../components/Common/PaginatedTable';
import { loadClientsFromSession } from '../api/auth';
import EnterpriseGate from '../components/Common/EnterpriseGate';

const SurveyTableHeaders = [
    { id: 'question', labelKey: 'survey.question', numeric: false, sortable: true, minWidth: 300 },
    { id: 'status', labelKey: 'survey.status', numeric: false, sortable: false, minWidth: 100 },
    { id: 'startTime', labelKey: 'survey.startTime', numeric: false, sortable: true, minWidth: 120 },
    { id: 'endTime', labelKey: 'survey.endTime', numeric: false, sortable: true, minWidth: 120 },
    { id: 'viewsCount', labelKey: 'survey.totalViews', numeric: true, sortable: true, minWidth: 100 },
    { id: 'totalVotes', labelKey: 'survey.totalVotes', numeric: true, sortable: true, minWidth: 100 },
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

const getStatus = (survey) => {
    const { startTime, endTime, isActive } = survey;

    if (!isActive) {
        return { label: 'survey.statusDisabled', color: 'error' };
    }
    
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (end < now) return { label: 'survey.statusFinished', color: 'default' };
    if (start > now) return { label: 'survey.statusScheduled', color: 'info' };
    return { label: 'survey.statusActive', color: 'success' };
};

const SurveysPage = () => {
    const { t } = useTranslation();
    const {
        isOpen: surveyModalOpen,
        currentSurvey,
        openModal: openSurveyModal,
        closeModal: closeSurveyModal,
        mode: surveyModalMode
    } = useSurveyModal();

    const [clientList, setClientList] = useState([]);
    const [filterActive, setFilterActive] = useState(true);
    const filterActiveInitialRef = useRef(true);

    const {
        data: surveys,
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
    } = usePaginatedList(getSurveys, null, {
        sort: 'created_at',
        order: 'desc',
        dataKey: 'surveys',
        filters: { active: true }
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

    useEffect(() => {
        if (filterActiveInitialRef.current) {
            filterActiveInitialRef.current = false;
            return;
        }
        handleFilterChange('active', filterActive);
    }, [filterActive, handleFilterChange]);

    const handleSearchChange = (e) => {
        handleDebouncedFilterChange('search', e.target.value);
    };

    const handleActiveFilterChange = (event) => {
        setFilterActive(event.target.checked);
    };

    const handleNewSurveyClick = () => {
        openSurveyModal({ cid: selectedCid });
    };

    const handleEditSurvey = (survey) => {
        openSurveyModal(survey);
    };

    const handleDeleteSurvey = async (surveyId) => {
        const result = await Swal.fire({
            title: t('survey.confirmDeleteTitle'),
            text: t('survey.confirmDeleteText'),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: t('common.delete'),
            cancelButtonText: t('common.cancel')
        });

        if (!result.isConfirmed) return;
        try {
            await deleteSurvey(surveyId, selectedCid);
            Swal.fire({
                title: t('survey.deletedSuccessTitle'),
                text: t('survey.deletedSuccessText'),
                icon: 'success',
                timer: 2000,
                timerProgressBar: true,
                showConfirmButton: false
            });
            fetchData();
        } catch (error) {
            Swal.fire({
                title: t('survey.deleteErrorTitle'),
                text: error.message || t('survey.deleteErrorText'),
                icon: 'error'
            });
        }
    };

    const handleSurveySave = () => {
        fetchData();
        closeSurveyModal();
    };

    const renderSurveyRow = (survey) => {
        const status = getStatus(survey);
        const totalVotes = survey.totalVotes || 0;
        
        const statusIcons = {
            'survey.statusActive': <CheckCircleIcon fontSize="small" color="success"/>,
            'survey.statusScheduled': <PauseCircleIcon fontSize="small" color="info"/>,
            'survey.statusFinished': <HighlightOffIcon fontSize="small" color="action"/>,
            'survey.statusDisabled': <DoNotDisturbOnIcon fontSize="small" color="error"/>,
        };

        return (
            <StyledTableRow key={survey._id} hover>
                <TableCell>
                    <Typography variant="body2" className="post-title" noWrap sx={{ maxWidth: 400 }}>
                        {survey.question}
                    </Typography>
                </TableCell>
                <TableCell>
                    <Chip
                        icon={statusIcons[status.label]}
                        label={t(status.label)}
                        size="small"
                        color={status.color}
                        variant="outlined"
                    />
                </TableCell>
                <TableCell>
                    {new Date(survey.startTime).toLocaleDateString()}
                </TableCell>
                <TableCell>
                    {new Date(survey.endTime).toLocaleDateString()}
                </TableCell>
                <TableCell align="center">
                    {survey.viewsCount || 0}
                </TableCell>
                <TableCell align="center">
                    {totalVotes}
                </TableCell>
                <TableCell>
                    <IconButton
                        size="small"
                        aria-label={t('clientPosts.edit')}
                        onClick={() => handleEditSurvey(survey)}
                    ><EditIcon fontSize="small"/></IconButton><IconButton
                        size="small"
                        aria-label={t('common.delete')}
                        onClick={() => handleDeleteSurvey(survey._id)}
                    ><DeleteIcon fontSize="small"/></IconButton>
                </TableCell>
            </StyledTableRow>
        );
    };

    return (
        <EnterpriseGate module="surveys" fullPage>
        <Box className="client-posts-container">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', mb: 3, p: 2, background: 'var(--card-bg)', borderRadius: '12px' }}>
                <Typography variant="h4" className="title">
                    {t('survey.title')}
                </Typography>
                <Box className="actions-section" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon/>}
                        onClick={handleNewSurveyClick}
                        disabled={!selectedCid}
                    >
                        {t('survey.newSurvey')}
                    </Button>
                    <IconButton onClick={fetchData} className="refresh-button" size="small" disabled={loading}>
                        <RefreshIcon/>
                    </IconButton>
                </Box>
            </Box>
            <Paper elevation={0} sx={{ background: 'var(--content-bg)', p: 0, mb: 2, textAlign: { xs: 'left', sm: 'right' } }}>
                <Box sx={{ display: 'flex' , flexWrap: 'wrap', gap: 1, p: 2, background: 'var(--surface-color)', borderRadius: '12px' }}>
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
                    <FormControlLabel
                        control={
                            <Switch
                                checked={filterActive}
                                onChange={handleActiveFilterChange}
                                size="small"
                                color="success"
                            />
                        }
                        label={t('survey.showActiveOnly')}
                        sx={{ mr: 1, '& .MuiFormControlLabel-label': { fontSize: '0.8rem' } }}
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
                        <MenuItem value="question">{t('survey.question')}</MenuItem>
                        <MenuItem value="endTime">{t('survey.endTime')}</MenuItem>
                        <MenuItem value="viewsCount">{t('survey.totalViews')}</MenuItem>
                        <MenuItem value="totalVotes">{t('survey.totalVotes')}</MenuItem>
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
                headers={SurveyTableHeaders}
                data={surveys}
                loading={loading}
                error={error}
                pagination={pagination}
                filters={filters}
                fetchData={fetchData}
                handleSort={handleSort}
                handlePageChange={handlePageChange}
                handleLimitChange={handleLimitChange}
                renderRow={renderSurveyRow}
            />

            <SurveyModal
                open={surveyModalOpen}
                onClose={closeSurveyModal}
                initialData={currentSurvey}
                mode={surveyModalMode}
                onSave={handleSurveySave}
            />
        </Box>
        </EnterpriseGate>
    );
};

export default SurveysPage;