/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Button,
    CircularProgress,
    Grid,
    Alert,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    InputAdornment,
    Typography,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Tabs,
    Tab,
    Chip
} from '@mui/material';
import {
    Save as SaveIcon,
    Cancel as CancelIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
    Settings as SettingsIcon,
    Public as PublicIcon,
    AttachMoney as AttachMoneyIcon // Icono para referencia de precios
} from '@mui/icons-material';
import { upsertPlacementPricing } from '../../api/placementPricing';
import { getPlacements } from '../../api/placements';
import { loadClientsFromSession } from '../../api/auth';
import CustomTextField from '../Common/CustomTextField';

const PlacementPricingForm = ({
    initialData = {},
    onSave,
    onCancel,
    mode = 'create',
}) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [placements, setPlacements] = useState([]);
    const [clientList, setClientList] = useState([]);
    const [newGeo, setNewGeo] = useState({ country: '', floorPriceCPM: '', floorPriceCPC: '' });

    const [formData, setFormData] = useState({
        placementId: '',
        cid: '',
        floorPriceCPM: 0.50,
        floorPriceCPC: 0.10,
        geoPricing: [],
        ...initialData
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetching placements
                const [placementsResponse] = await Promise.all([
                    getPlacements()
                ]);
                setPlacements(placementsResponse.data.placements || []);
                
                // Loading clients
                const clients = loadClientsFromSession();
                setClientList(clients);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        setFormData({
            placementId: '',
            cid: '',
            floorPriceCPM: 0.50,
            floorPriceCPC: 0.10,
            geoPricing: [],
            ...initialData
        });
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleNumberChange = (e) => {
        const { name, value } = e.target;
        if (value !== '' && Number(value) < 0) return;
        setFormData(prev => ({ ...prev, [name]: value === '' ? '' : Number(value) }));
    };

    const handleNewGeoChange = (field, value) => {
        if ((field === 'floorPriceCPM' || field === 'floorPriceCPC') && value !== '' && Number(value) < 0) return;
        
        setNewGeo(prev => ({
            ...prev,
            [field]: field === 'country' ? value.toUpperCase().slice(0, 2) : value
        }));
    };

    const handleAddGeo = () => {
        if (newGeo.country && newGeo.floorPriceCPM !== '' && newGeo.floorPriceCPC !== '') {
            if (formData.geoPricing.some(g => g.country === newGeo.country)) {
                return;
            }

            setFormData(prev => ({
                ...prev,
                geoPricing: [
                    ...(prev.geoPricing || []), 
                    { 
                        country: newGeo.country, 
                        floorPriceCPM: Number(newGeo.floorPriceCPM), 
                        floorPriceCPC: Number(newGeo.floorPriceCPC) 
                    }
                ]
            }));
            setNewGeo({ country: '', floorPriceCPM: '', floorPriceCPC: '' });
        }
    };

    const handleRemoveGeo = (index) => {
        setFormData(prev => ({
            ...prev,
            geoPricing: (prev.geoPricing || []).filter((_, i) => i !== index)
        }));
    };

    const getSelectedPlacement = () => {
        return placements.find(p => p._id === formData.placementId);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.placementId || !formData.cid) {
            setError(t('placementPricing.formError', 'Placement and CID are required.'));
            return;
        }

        setLoading(true);
        setError(null);
        
        try {
            const payload = {
                ...formData,
                floorPriceCPM: Number(formData.floorPriceCPM),
                floorPriceCPC: Number(formData.floorPriceCPC),
                geoPricing: Array.isArray(formData.geoPricing) ? formData.geoPricing : []
            };

            const response = await upsertPlacementPricing(payload);
            if (onSave) {
                onSave(response.data);
            }
        } catch (err) {
            console.error("Error saving placement pricing:", err);
            setError(err.message || t('placementPricing.errorSaving', 'Error saving placement pricing.'));
        } finally {
            setLoading(false);
        }
    };

    const selectedPlacement = getSelectedPlacement();

    return (
        <Box component="form" onSubmit={handleSubmit} noValidate className="post-form-container">
            {error && <Alert severity="error" sx={{ mb: 2, m: 3 }}>{error}</Alert>}

            <Paper elevation={0} className="settings-paper" sx={{ borderRadius: 0 }}>
                <Tabs
                    value={activeTab}
                    onChange={(_, newValue) => setActiveTab(newValue)}
                    className="settings-tabs"
                    variant="fullWidth"
                    sx={{ minHeight: 'unset', '& .MuiTab-root': { minHeight: 'unset' } }}
                >
                    <Tab icon={<SettingsIcon/>} label={t('placementPricing.general', 'General Settings')} iconPosition="start"/>
                    <Tab icon={<PublicIcon/>} label={t('placementPricing.geoTargeting', 'Geo Pricing')} iconPosition="start"/>
                </Tabs>

                <div role="tabpanel" hidden={activeTab !== 0}>
                    {activeTab === 0 && (
                        <Box sx={{ p: 3 }}>
                            <Grid container spacing={3} direction="column">
                                <Grid item>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>{t('placementPricing.placement', 'Placement')}</InputLabel>
                                        <Select
                                            label={t('placementPricing.placement', 'Placement')}
                                            name="placementId"
                                            value={formData.placementId}
                                            onChange={handleChange}
                                            required
                                            // Deshabilitar la edición del placement si estamos en modo edición
                                            disabled={mode === 'edit'}
                                        >
                                            {placements.map(placement => (
                                                <MenuItem key={placement._id} value={placement._id}>
                                                    {placement.name} ({placement.key})
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                
                                <Grid item>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>{t('placementPricing.cid', 'Client')}</InputLabel>
                                        <Select
                                            label={t('placementPricing.cid', 'Client')}
                                            name="cid"
                                            value={formData.cid}
                                            onChange={handleChange}
                                            required
                                            // Deshabilitar la edición del cliente si estamos en modo edición
                                            disabled={mode === 'edit'}
                                        >
                                            {clientList.map(client => (
                                                <MenuItem key={client.cid} value={client.cid}>
                                                    {client.description || client.cid}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>

                                {selectedPlacement && (
                                    <Grid item>
                                        <Alert severity="info" sx={{ mb: 2 }}>
                                            <Typography variant="subtitle2" gutterBottom>
                                                Base Pricing from Placement
                                            </Typography>
                                            <Box sx={{ display: 'flex', gap: 2 }}>
                                                <Chip 
                                                    label={`CPM: $${Number(selectedPlacement.floorPriceCPM).toFixed(2)}`} 
                                                    size="small" 
                                                    variant="outlined" 
                                                />
                                                <Chip 
                                                    label={`CPC: $${Number(selectedPlacement.floorPriceCPC).toFixed(2)}`} 
                                                    size="small" 
                                                    variant="outlined" 
                                                />
                                            </Box>
                                        </Alert>
                                    </Grid>
                                )}
                                
                                <Grid item>
                                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 1 }}>
                                        {t('placementPricing.clientPricing', 'Client-Specific Pricing')}
                                    </Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={6}>
                                            <CustomTextField
                                                label={t('placementPricing.floorPriceCPM', 'Client CPM')}
                                                name="floorPriceCPM"
                                                type="number"
                                                value={formData.floorPriceCPM}
                                                onChange={handleNumberChange}
                                                fullWidth
                                                required
                                                InputProps={{
                                                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                                    inputProps: { min: 0, step: 0.01 }
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={6}>
                                            <CustomTextField
                                                label={t('placementPricing.floorPriceCPC', 'Client CPC')}
                                                name="floorPriceCPC"
                                                type="number"
                                                value={formData.floorPriceCPC}
                                                onChange={handleNumberChange}
                                                fullWidth
                                                required
                                                InputProps={{
                                                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                                    inputProps: { min: 0, step: 0.01 }
                                                }}
                                            />
                                        </Grid>
                                    </Grid>
                                </Grid>
                            </Grid>
                        </Box>
                    )}
                </div>

                <div role="tabpanel" hidden={activeTab !== 1}>
                    {activeTab === 1 && (
                        <Box sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>{t('placementPricing.geoPricing', 'Client Geographic Pricing')}</Typography>
                            <Typography variant="caption" color="textSecondary" paragraph>
                                {t('placementPricing.geoPricingHelp', 'Override client prices for specific countries.')}
                            </Typography>
                            
                            {/* UX IMPROVEMENT: Mostrar valores de referencia globales (Global/Client Base Pricing) */}
                            <Alert severity="info" icon={<AttachMoneyIcon />} sx={{ mb: 3, '& .MuiAlert-message': { width: '100%' } }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', width: '100%' }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                        Precios Base del Cliente (Globales)
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <Chip label={`CPM: $${Number(formData.floorPriceCPM).toFixed(2)}`} size="small" />
                                        <Chip label={`CPC: $${Number(formData.floorPriceCPC).toFixed(2)}`} size="small" />
                                    </Box>
                                </Box>
                            </Alert>
                            {/* FIN UX IMPROVEMENT */}

                            <Grid container spacing={2} alignItems="flex-end" sx={{ mb: 2 }}>
                                <Grid item xs={3}>
                                     <CustomTextField
                                        label="Country (ISO 2)"
                                        value={newGeo.country}
                                        onChange={(e) => handleNewGeoChange('country', e.target.value)}
                                        fullWidth
                                        placeholder="US"
                                     />
                                </Grid>
                                <Grid item xs={3}>
                                     <CustomTextField
                                        label="CPM Override"
                                        type="number"
                                        value={newGeo.floorPriceCPM}
                                        onChange={(e) => handleNewGeoChange('floorPriceCPM', e.target.value)}
                                        fullWidth
                                        InputProps={{ 
                                            startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                            inputProps: { min: 0, step: 0.01 }
                                        }}
                                     />
                                </Grid>
                                <Grid item xs={3}>
                                     <CustomTextField
                                        label="CPC Override"
                                        type="number"
                                        value={newGeo.floorPriceCPC}
                                        onChange={(e) => handleNewGeoChange('floorPriceCPC', e.target.value)}
                                        fullWidth
                                        InputProps={{ 
                                            startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                            inputProps: { min: 0, step: 0.01 }
                                        }}
                                     />
                                </Grid>
                                <Grid item xs={3}>
                                    <Button 
                                        variant="contained" 
                                        fullWidth
                                        sx={{ height: '40px' }} 
                                        onClick={handleAddGeo}
                                        startIcon={<AddIcon/>}
                                        disabled={!newGeo.country || newGeo.floorPriceCPM === '' || newGeo.floorPriceCPC === ''}
                                    >
                                        {t('common.add', 'Add')}
                                    </Button>
                                </Grid>
                            </Grid>

                            <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 300 }}>
                                <Table size="small" stickyHeader>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Country</TableCell>
                                            <TableCell align="right">CPM Override</TableCell>
                                            <TableCell align="right">CPC Override</TableCell>
                                            <TableCell align="center">Action</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {formData.geoPricing && formData.geoPricing.length > 0 ? (
                                            formData.geoPricing.map((geo, index) => (
                                                <TableRow key={`${geo.country}-${index}`}>
                                                    <TableCell>
                                                        <Chip label={geo.country} size="small"/>
                                                    </TableCell>
                                                    <TableCell align="right">${Number(geo.floorPriceCPM).toFixed(2)}</TableCell>
                                                    <TableCell align="right">${Number(geo.floorPriceCPC).toFixed(2)}</TableCell>
                                                    <TableCell align="center">
                                                        <IconButton size="small" color="error" onClick={() => handleRemoveGeo(index)}><DeleteIcon fontSize="small"/></IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={4} align="center">
                                                    <Typography variant="caption" color="textSecondary">No specific geo pricing added. Client Base Pricing applies.</Typography>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    )}
                </div>
            </Paper>

            <Box className="form-actions" sx={{ mt: 3, textAlign: 'right', p: 3 }}>
                <Button
                    variant="outlined"
                    onClick={onCancel}
                    startIcon={<CancelIcon/>}
                    className="cancel-button"
                >
                    {t('common.cancel', 'Cancel')}
                </Button>
                <Button
                    type="submit"
                    variant="contained"
                    startIcon={<SaveIcon/>}
                    disabled={loading}
                    sx={{ ml: 2 }}
                >
                    {loading ? <CircularProgress size={24}/> : t(`common.${mode === 'create' ? 'create' : 'save'}`)}
                </Button>
            </Box>
        </Box>
    );
};

export default PlacementPricingForm;