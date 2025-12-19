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
    Public as PublicIcon
} from '@mui/icons-material';
import { upsertPlacement } from '../../api/placements';
import CustomTextField from '../Common/CustomTextField';

const PlacementForm = ({
    initialData = {},
    onSave,
    onCancel,
    mode = 'create',
}) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [newGeo, setNewGeo] = useState({ country: '', floorPriceCPM: '', floorPriceCPC: '' });

    const [formData, setFormData] = useState({
        name: '',
        key: '',
        width: 300,
        height: 250,
        device: 'all',
        renderType: 'display',
        pricingModel: 'hybrid',
        floorPriceCPM: 0.50,
        floorPriceCPC: 0.10,
        geoPricing: [],
        ...initialData
    });

    useEffect(() => {
        setFormData({
            name: '',
            key: '',
            width: 300,
            height: 250,
            device: 'all',
            renderType: 'display',
            pricingModel: 'hybrid',
            floorPriceCPM: 0.50,
            floorPriceCPC: 0.10,
            geoPricing: [],
            ...initialData
        });
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        let finalValue = value;
        if (name === 'key') {
            finalValue = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
        }
        setFormData(prev => ({ ...prev, [name]: finalValue }));
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.key || !formData.width || !formData.height) {
            setError(t('placement.formError', 'All fields are required.'));
            return;
        }

        setLoading(true);
        setError(null);
        
        try {
            const payload = {
                ...formData,
                width: Number(formData.width),
                height: Number(formData.height),
                floorPriceCPM: Number(formData.floorPriceCPM),
                floorPriceCPC: Number(formData.floorPriceCPC),
                geoPricing: Array.isArray(formData.geoPricing) ? formData.geoPricing : []
            };

            const response = await upsertPlacement(payload);
            if (onSave) {
                onSave(response.data);
            }
        } catch (err) {
            console.error("Error saving placement:", err);
            setError(err.message || t('placement.errorSaving', 'Error saving placement.'));
        } finally {
            setLoading(false);
        }
    };

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
                    <Tab icon={<SettingsIcon />} label={t('placement.general', 'General Settings')} iconPosition="start" />
                    <Tab icon={<PublicIcon />} label={t('placement.geoTargeting', 'Geo Pricing')} iconPosition="start" />
                </Tabs>

                <div role="tabpanel" hidden={activeTab !== 0}>
                    {activeTab === 0 && (
                        <Box sx={{ p: 3 }}>
                            <Grid container spacing={3} direction="column">
                                <Grid item>
                                    <CustomTextField
                                        label={t('placement.name', 'Name (e.g., Main Sidebar)')}
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        fullWidth
                                        required
                                        autoFocus
                                        autoComplete="off"
                                    />
                                </Grid>
                                <Grid item>
                                    <CustomTextField
                                        label={t('placement.key', 'Key (e.g., sidebar-top)')}
                                        name="key"
                                        value={formData.key}
                                        onChange={handleChange}
                                        fullWidth
                                        required
                                        autoComplete="off"
                                        helperText={t('placement.keyHelp', 'Unique identifier (lowercase, numbers, and hyphens only).')}
                                    />
                                </Grid>
                                <Grid item>
                                    <Grid container spacing={2}>
                                        <Grid item xs={6}>
                                            <CustomTextField
                                                label={t('placement.width', 'Width')}
                                                name="width"
                                                type="number"
                                                value={formData.width}
                                                onChange={handleNumberChange}
                                                fullWidth
                                                required
                                                InputProps={{
                                                    inputProps: { min: 0 },
                                                    endAdornment: <InputAdornment position="end">px</InputAdornment>
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={6}>
                                            <CustomTextField
                                                label={t('placement.height', 'Height')}
                                                name="height"
                                                type="number"
                                                value={formData.height}
                                                onChange={handleNumberChange}
                                                fullWidth
                                                required
                                                InputProps={{
                                                    inputProps: { min: 0 },
                                                    endAdornment: <InputAdornment position="end">px</InputAdornment>
                                                }}
                                            />
                                        </Grid>
                                    </Grid>
                                </Grid>
                                
                                <Grid item>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>{t('placement.device', 'Device')}</InputLabel>
                                        <Select
                                            label={t('placement.device', 'Device')}
                                            name="device"
                                            value={formData.device}
                                            onChange={handleChange}
                                        >
                                            <MenuItem value="all">{t('placement.allDevices', 'All Devices')}</MenuItem>
                                            <MenuItem value="desktop">{t('placement.desktopOnly', 'Desktop Only')}</MenuItem>
                                            <MenuItem value="mobile">{t('placement.mobileOnly', 'Mobile Only')}</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>{t('campaign.creativeType', 'Render Type')}</InputLabel>
                                        <Select
                                            label={t('campaign.creativeType', 'Render Type')}
                                            name="renderType"
                                            value={formData.renderType}
                                            onChange={handleChange}
                                        >
                                            <MenuItem value="display">Display (Banner/Video)</MenuItem>
                                            <MenuItem value="native">Native (Comment/Notification)</MenuItem>
                                            <MenuItem value="text">Text Link</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                
                                <Grid item>
                                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 1 }}>
                                        {t('placement.basePricing', 'Base Pricing (Global)')}
                                    </Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={6}>
                                            <CustomTextField
                                                label={t('placement.floorPriceCPM', 'Base CPM')}
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
                                                label={t('placement.floorPriceCPC', 'Base CPC')}
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
                            <Typography variant="h6" gutterBottom>{t('placement.geoPricing', 'Geographic Segmentation Pricing')}</Typography>
                            <Typography variant="caption" color="textSecondary" paragraph>
                                {t('placement.geoPricingHelp', 'Override base prices for specific countries. Higher prices for Tier-1 countries, lower for others.')}
                            </Typography>

                            {/* Base Pricing Reference */}
                            <Alert severity="info" icon={<SettingsIcon />} sx={{ mb: 3, '& .MuiAlert-message': { width: '100%' } }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                    <Typography variant="subtitle2">Global Base Pricing (Reference)</Typography>
                                    <Box>
                                        <Chip label={`CPM: $${Number(formData.floorPriceCPM).toFixed(2)}`} size="small" sx={{ mr: 1, bgcolor: 'rgba(255,255,255,0.9)' }} />
                                        <Chip label={`CPC: $${Number(formData.floorPriceCPC).toFixed(2)}`} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.9)' }} />
                                    </Box>
                                </Box>
                            </Alert>

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
                                        startIcon={<AddIcon />}
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
                                                        <Chip label={geo.country} size="small" />
                                                    </TableCell>
                                                    <TableCell align="right">${Number(geo.floorPriceCPM).toFixed(2)}</TableCell>
                                                    <TableCell align="right">${Number(geo.floorPriceCPC).toFixed(2)}</TableCell>
                                                    <TableCell align="center">
                                                        <IconButton size="small" color="error" onClick={() => handleRemoveGeo(index)}>
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={4} align="center">
                                                    <Typography variant="caption" color="textSecondary">No specific geo pricing added. Global Base Pricing applies.</Typography>
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

export default PlacementForm;