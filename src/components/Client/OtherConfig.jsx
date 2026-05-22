/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
    Box, 
    FormControlLabel, 
    Checkbox, 
    FormControl, 
    InputLabel, 
    Select, 
    MenuItem, 
    InputAdornment, 
    IconButton, 
    Typography,
    Tabs,
    Tab,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    DialogContentText,
    CircularProgress,
    TextField,
    Grid
} from '@mui/material';
import { 
    Visibility, 
    VisibilityOff, 
    Lock as LockIcon,
    Public as PublicIcon,
    Science as ScienceIcon,
    Storage as StorageIcon,
    Update as UpdateIcon,
    Web as WebIcon,
    Dns as DnsIcon,
    Sync as SyncIcon
} from '@mui/icons-material';
import CustomTextField from '../Common/CustomTextField';
import api from '../../api/axiosConfig'; 
import React from 'react';

const OtherConfig = ({ config, setConfig, isFormSubmitted }) => {
    const { t } = useTranslation();
    const [showApiKeys, setShowApiKeys] = useState({});
    const [activeTab, setActiveTab] = useState(0);
    const [openTestDialog, setOpenTestDialog] = useState(false);
    const [testIp, setTestIp] = useState('8.8.8.8');
    const [testLoading, setTestLoading] = useState(false);
    const [testResult, setTestResult] = useState(null);
    const [testError, setTestError] = useState('');
    const [isForcingUpdate, setIsForcingUpdate] = useState(false);

    const toggleShowApiKey = (section) => {
        setShowApiKeys(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const updateConfigValue = (section, subsection, field, value) => {
        setConfig(prev => {
            const currentSection = prev.config[section] || {};
            let updatedSection = { ...currentSection };

            if (subsection) {
                updatedSection[subsection] = {
                    ...updatedSection[subsection],
                    [field]: value
                };
            } else {
                updatedSection[field] = value;
            }

            return {
                ...prev,
                config: {
                    ...prev.config,
                    [section]: updatedSection
                }
            };
        });
    };

    const handleOpenTestDialog = () => {
        setTestResult(null);
        setTestError('');
        setTestIp('8.8.8.8');
        setOpenTestDialog(true);
    };

    const handleCloseTestDialog = () => {
        setOpenTestDialog(false);
    };

    const handleTestGeolocation = async () => {
        if (!testIp) {
            setTestError(t('client.ip_required')); 
            return;
        }
        
        setTestLoading(true);
        setTestResult(null);
        setTestError('');

        try {
            const payload = {
                cid: config.cid,
                ip: testIp,
                config: config.config.geolocation 
            };

            const response = await api.post('/client/test-geolocation', payload);
            setTestResult(response.data);
        } catch (error) {
            console.error(error);
            setTestError(error.response?.data?.message || error.message || t('client.error'));
        } finally {
            setTestLoading(false);
        }
    };

    const handleForceUpdate = async () => {
        setIsForcingUpdate(true);
        try {
            await api.post('/client/force-geo-update', { 
                cid: config.cid 
            });
        } catch (error) {
            console.error(error);
        } finally {
            setIsForcingUpdate(false);
        }
    };

    const renderSimpleConfig = (section, title, providerOptions) => (
        <Box sx={{mb: 3}}>
            <Typography variant="h6" sx={{mb: 2, fontWeight: 500}}>{t(title)}</Typography>
            
            <FormControl fullWidth sx={{mb: 2}}>
                <InputLabel>{t('client.provider')}</InputLabel>
                <Select
                    value={config.config[section]?.provider || ''}
                    onChange={(e) => updateConfigValue(section, null, 'provider', e.target.value)}
                    size="small"
                >
                    {providerOptions}
                </Select>
            </FormControl>
            
            <CustomTextField
                label={t('client.api_key')}
                fullWidth
                variant="outlined"
                value={config.config[section]?.apiKey || ''}
                onChange={(e) => updateConfigValue(section, null, 'apiKey', e.target.value)}
                sx={{mb: 2}}
                error={isFormSubmitted && (config.config[section]?.enabled || false) && !config.config[section]?.apiKey?.trim()}
                helperText={
                    isFormSubmitted && (config.config[section]?.enabled || false) && !config.config[section]?.apiKey?.trim()
                        ? t('client.api_key_required')
                        : ''
                }
                type={showApiKeys[section] ? 'text' : 'password'}
                InputProps={{
                    endAdornment: (
                        <InputAdornment position="end">
                            <LockIcon sx={{fontSize: 16, color: 'text.secondary', mr: 1}}/>
                            <IconButton
                                onClick={() => toggleShowApiKey(section)}
                                edge="end"
                                size="small"
                            >
                                {showApiKeys[section] ? <VisibilityOff fontSize="small"/> : <Visibility fontSize="small"/>}
                            </IconButton>
                        </InputAdornment>
                    )
                }}
            />
            
            <FormControlLabel
                control={
                    <Checkbox
                        checked={config.config[section]?.enabled || false}
                        onChange={(e) => updateConfigValue(section, null, 'enabled', e.target.checked)}
                        size="small"
                    />
                }
                label={<Typography variant="body2">{t('client.enable_service')}</Typography>}
            />
        </Box>
    );

    const renderGeolocationConfig = () => {
        const geoConfig = config.config.geolocation || {};
        const frontend = geoConfig.frontend || {};
        const backend = geoConfig.backend || {};

        return (
            <Box>
                <Typography variant="h6" sx={{mb: 2, fontWeight: 500}}>{t('client.geolocation_config')}</Typography>
                
                <Box sx={{ mb: 3 }}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={geoConfig.enabled || false}
                                onChange={(e) => updateConfigValue('geolocation', null, 'enabled', e.target.checked)}
                                size="small"
                            />
                        }
                        label={<Typography variant="body2" sx={{fontWeight: 'bold'}}>{t('client.enable_service')}</Typography>}
                    />
                </Box>

                <Grid container spacing={4} sx={{ display: 'flex', alignItems: 'stretch', justifyContent: 'center' }}>
                    <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Box sx={{ 
                            p: 2, 
                            border: '1px solid #e0e0e0', 
                            borderRadius: 2, 
                            height: '100%', 
                            display: 'flex', 
                            flexDirection: 'column',
                            width: '100%',
                            maxWidth: 540,
                            minWidth: { md: 540, xs: '100%' } 
                        }}>
                            <Typography variant="subtitle1" sx={{ mb: 2, display: 'flex', alignItems: 'center', color: 'text.primary', fontWeight: 'bold' }}>
                                <WebIcon sx={{ mr: 1 }} /> Frontend Provider
                            </Typography>
                            
                            <FormControl fullWidth sx={{mb: 2}}>
                                <InputLabel>Provider</InputLabel>
                                <Select
                                    value={frontend.provider || ''}
                                    onChange={(e) => updateConfigValue('geolocation', 'frontend', 'provider', e.target.value)}
                                    size="small"
                                    label="Provider"
                                >
                                    <MenuItem value="ipapi">ipapi (Client Side)</MenuItem>
                                    <MenuItem value=""><em>None</em></MenuItem>
                                </Select>
                            </FormControl>

                            {frontend.provider && (
                                <CustomTextField
                                    label={t('client.api_key')}
                                    fullWidth
                                    variant="outlined"
                                    value={frontend.apiKey || ''}
                                    onChange={(e) => updateConfigValue('geolocation', 'frontend', 'apiKey', e.target.value)}
                                    type={showApiKeys['geo_front'] ? 'text' : 'password'}
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton onClick={() => toggleShowApiKey('geo_front')} edge="end" size="small">
                                                    {showApiKeys['geo_front'] ? <VisibilityOff fontSize="small"/> : <Visibility fontSize="small"/>}
                                                </IconButton>
                                            </InputAdornment>
                                        )
                                    }}
                                />
                            )}
                        </Box>
                    </Grid>

                    <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Box sx={{ 
                            p: 2, 
                            border: '1px solid #e0e0e0', 
                            borderRadius: 2, 
                            height: '100%', 
                            bgcolor: '#fafafa', 
                            display: 'flex', 
                            flexDirection: 'column',
                            width: '100%',
                            maxWidth: 540,
                            minWidth: { md: 540, xs: '100%' }
                        }}>
                            <Typography variant="subtitle1" sx={{ mb: 2, display: 'flex', alignItems: 'center', color: 'primary.main', fontWeight: 'bold' }}>
                                <DnsIcon sx={{ mr: 1 }} /> Backend Provider
                            </Typography>

                            <FormControl fullWidth sx={{mb: 2}}>
                                <InputLabel>Provider</InputLabel>
                                <Select
                                    value={backend.provider || ''}
                                    onChange={(e) => updateConfigValue('geolocation', 'backend', 'provider', e.target.value)}
                                    size="small"
                                    label="Provider"
                                >
                                    <MenuItem value="maxmind">MaxMind (Local DB)</MenuItem>
                                    <MenuItem value=""><em>None</em></MenuItem>
                                </Select>
                            </FormControl>

                            {backend.provider && (
                                <Box sx={{ flexGrow: 1 }}>
                                    <CustomTextField
                                        label={t('client.backend_geo_license_key')}
                                        fullWidth
                                        variant="outlined"
                                        value={backend.apiKey || ''}
                                        onChange={(e) => updateConfigValue('geolocation', 'backend', 'apiKey', e.target.value)}
                                        type={showApiKeys['geo_back'] ? 'text' : 'password'}
                                        sx={{ mb: 2 }}
                                        InputProps={{
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton onClick={() => toggleShowApiKey('geo_back')} edge="end" size="small">
                                                        {showApiKeys['geo_back'] ? <VisibilityOff fontSize="small"/> : <Visibility fontSize="small"/>}
                                                    </IconButton>
                                                </InputAdornment>
                                            )
                                        }}
                                    />

                                    <Typography variant="subtitle2" sx={{ mb: 2, display: 'flex', alignItems: 'center', fontWeight: 'bold', color: 'primary.main' }}>
                                        <StorageIcon sx={{ mr: 1, fontSize: 20 }} />
                                        {t('client.backend_geo_settings')}
                                    </Typography>

                                    <CustomTextField
                                        label={t('client.db_path')} 
                                        fullWidth
                                        variant="outlined"
                                        value={backend.dbPath || ''}
                                        onChange={(e) => updateConfigValue('geolocation', 'backend', 'dbPath', e.target.value)}
                                        helperText={t('client.db_path_help')}
                                        InputProps={{
                                            startAdornment: (<InputAdornment position="start"><StorageIcon fontSize="small" /></InputAdornment>),
                                        }}
                                        sx={{ mb: 2 }}
                                    />

                                    <CustomTextField
                                        label={t('client.update_frequency')} 
                                        fullWidth
                                        variant="outlined"
                                        type="number"
                                        value={backend.updateFrequency || 7}
                                        onChange={(e) => updateConfigValue('geolocation', 'backend', 'updateFrequency', parseInt(e.target.value) || 7)}
                                        InputProps={{
                                            startAdornment: (<InputAdornment position="start"><UpdateIcon fontSize="small" /></InputAdornment>),
                                        }}
                                        sx={{ mb: 2 }}
                                    />

                                    <Box sx={{ mb: 2 }}>
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            size="small"
                                            startIcon={isForcingUpdate ? <CircularProgress size={20} color="inherit" /> : <SyncIcon />}
                                            onClick={handleForceUpdate}
                                            disabled={isForcingUpdate || !config.cid}
                                            fullWidth
                                            sx={{ mt: 1 }}
                                        >
                                            {isForcingUpdate ? t('client.updating') : t('client.force_update')}
                                        </Button>
                                    </Box>

                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={backend.enableCron || false}
                                                onChange={(e) => updateConfigValue('geolocation', 'backend', 'enableCron', e.target.checked)}
                                                color="primary"
                                            />
                                        }
                                        label={<Typography variant="body2">{t('client.enable_cron')}</Typography>}
                                    />
                                    
                                    <Box sx={{ mt: 2 }}>
                                        <Button 
                                            variant="outlined" 
                                            size="small"
                                            startIcon={<ScienceIcon />}
                                            onClick={handleOpenTestDialog}
                                            disabled={!backend.dbPath?.trim()}
                                            fullWidth
                                        >
                                            {t('client.test_geolocation')}
                                        </Button>
                                    </Box>
                                </Box>
                            )}
                        </Box>
                    </Grid>
                </Grid>
            </Box>
        );
    };

    return (
        <Box sx={{width: '100%'}}>
            <Tabs 
                value={activeTab} 
                onChange={(_, newValue) => setActiveTab(newValue)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{ mb: 3 }}
            >
                <Tab label={t('client.translation_config')} value={0}/>
                <Tab label={t('client.geolocation_config')} value={1}/>
                <Tab label={t('client.language_config')} value={2}/>
            </Tabs>
            
            <Box sx={{p: 2}}>
                {activeTab === 0 && renderSimpleConfig(
                    'translation',
                    'client.translation_config',
                    [<MenuItem key="google" value="Google Translate">Google Translate</MenuItem>]
                )}
                
                {activeTab === 1 && renderGeolocationConfig()}
                
                {activeTab === 2 && renderSimpleConfig(
                    'language',
                    'client.language_config',
                    [<MenuItem key="DLA" value="Detect Language API">Detect Language API</MenuItem>]
                )}
            </Box>

            <Dialog open={openTestDialog} onClose={handleCloseTestDialog} maxWidth="sm" fullWidth>
                <DialogTitle>{t('client.test_geolocation_title')}</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mb: 2 }}>
                        {t('client.test_geolocation_desc')}
                    </DialogContentText>
                    <TextField
                        autoFocus
                        margin="dense"
                        label={t('client.ip_address')}
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={testIp}
                        onChange={(e) => setTestIp(e.target.value)}
                        error={!!testError}
                        helperText={testError}
                    />
                    
                    {testLoading && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                            <CircularProgress />
                        </Box>
                    )}

                    {testResult && (
                        <Box sx={{ mt: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1, overflow: 'auto', maxHeight: 300, border: '1px solid #ddd' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="subtitle2" sx={{fontWeight: 'bold'}}>{t('client.test_result')}:</Typography>
                                {testResult.found ? 
                                    <Typography variant="caption" sx={{color: 'success.main', fontWeight: 'bold'}}>Found</Typography> : 
                                    <Typography variant="caption" sx={{color: 'error.main', fontWeight: 'bold'}}>Not Found</Typography>
                                }
                            </Box>
                            <pre style={{ margin: 0, fontSize: '0.85rem', fontFamily: 'monospace' }}>
                                {JSON.stringify(testResult, null, 2)}
                            </pre>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseTestDialog}>{t('client.close')}</Button>
                    <Button onClick={handleTestGeolocation} variant="contained" disabled={testLoading}>
                        {t('client.test')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default OtherConfig;