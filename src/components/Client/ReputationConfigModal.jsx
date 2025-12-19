import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    Box, Typography, Grid, IconButton, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Paper, 
    Tabs, Tab, Alert
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Save as SaveIcon } from '@mui/icons-material';
import CustomTextField from '../Common/CustomTextField';
import { getReputationConfig, saveReputationConfig } from '../../api/reputation';

const ReputationConfigModal = ({ open, onClose, client, showToast }) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [currentTab, setCurrentTab] = useState(0); // 0: Weights, 1: Levels, 2: Limits
    
    // Inicializamos con valores por defecto para evitar warnings de uncontrolled inputs
    const [data, setData] = useState({
        weights: {
            helpful_mark: 10, pinned: 50, correction: 20, upvote: 1, downvote: -2,
            spam_report: -50, mod_removal: -100, post_created: 0, reply_created: 0
        },
        limits: { max_daily_reputation_gain: 100, decay_rate: 0.05 },
        trust_levels: []
    });

    useEffect(() => {
        if (open && client?.cid) {
            loadConfig();
        }
    }, [open, client]);

    const loadConfig = async () => {
        setLoading(true);
        try {
            const config = await getReputationConfig(client.cid);
            if (config) {
                setData(prev => ({
                    weights: { ...prev.weights, ...(config.weights || {}) },
                    limits: { ...prev.limits, ...(config.limits || {}) },
                    trust_levels: config.trust_levels || []
                }));
            }
        } catch (error) {
            console.error(error);
            showToast(t('client.error_loading_reputation'), 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const sortedLevels = [...data.trust_levels].sort((a, b) => a.min - b.min);
            
            await saveReputationConfig(client.cid, { 
                ...data, 
                trust_levels: sortedLevels 
            });
            
            showToast(t('client.reputation_saved_success'), 'success');
            onClose();
        } catch (error) {
            console.error(error);
            showToast(t('client.reputation_save_error'), 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleWeightChange = (key, value) => {
        setData(prev => ({
            ...prev,
            weights: { ...prev.weights, [key]: parseFloat(value) || 0 }
        }));
    };

    const handleLimitChange = (key, value) => {
        setData(prev => ({
            ...prev,
            limits: { ...prev.limits, [key]: parseFloat(value) || 0 }
        }));
    };

    const handleLevelChange = (index, field, value) => {
        const newLevels = [...data.trust_levels];
        newLevels[index] = { 
            ...newLevels[index], 
            [field]: field === 'label' ? value : (parseInt(value) || 0) 
        };
        setData(prev => ({ ...prev, trust_levels: newLevels }));
    };

    const addLevel = () => {
        const nextLvl = data.trust_levels.length > 0 
            ? Math.max(...data.trust_levels.map(l => l.lvl)) + 1 
            : 0;
        
        setData(prev => ({
            ...prev,
            trust_levels: [...prev.trust_levels, { lvl: nextLvl, min: 0, label: 'New Rank' }]
        }));
    };

    const removeLevel = (index) => {
        const newLevels = data.trust_levels.filter((_, i) => i !== index);
        setData(prev => ({ ...prev, trust_levels: newLevels }));
    };

    const handleTabChange = (event, newValue) => {
        setCurrentTab(newValue);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                {t('client.reputation_config_title')} - {client?.description || client?.cid}
            </DialogTitle>
            
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={currentTab} onChange={handleTabChange} variant="fullWidth">
                    <Tab label={t('client.reputation_weights_title')} />
                    <Tab label={t('client.reputation_levels_title')} />
                    <Tab label={t('client.reputation_limits_title')} />
                </Tabs>
            </Box>

            <DialogContent>
                {/* --- TAB 0: WEIGHTS (Vertical List) --- */}
                {currentTab === 0 && (
                    <Box sx={{ mt: 2 }}>
                        <Alert severity="info" sx={{ mb: 2 }}>
                            {t('gamification.reputation.weight_helper', 'Define points added/subtracted per action.')}
                        </Alert>
                        <Grid container spacing={2}>
                            {Object.keys(data.weights).map((key) => (
                                <Grid xs={12} key={key} sx={{ mb: 1 }}> {/* xs={12} fuerza una columna */}
                                    <CustomTextField
                                        label={t(`client.reputation_weights.${key}`, key)}
                                        type="number"
                                        value={data.weights[key] ?? 0}
                                        onChange={(e) => handleWeightChange(key, e.target.value)}
                                        size="small"
                                        fullWidth
                                    />
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                )}

                {/* --- TAB 1: LEVELS --- */}
                {currentTab === 1 && (
                    <Box sx={{ mt: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                            <Button startIcon={<AddIcon />} variant="outlined" size="small" onClick={addLevel}>
                                {t('common.add')}
                            </Button>
                        </Box>
                        <TableContainer component={Paper} variant="outlined">
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell width="10%">Lvl</TableCell>
                                        <TableCell width="30%">Min Score</TableCell>
                                        <TableCell width="50%">Label</TableCell>
                                        <TableCell width="10%" align="right">Action</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {data.trust_levels.map((level, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{level.lvl}</TableCell>
                                            <TableCell>
                                                <CustomTextField
                                                    type="number"
                                                    value={level.min ?? 0}
                                                    onChange={(e) => handleLevelChange(index, 'min', e.target.value)}
                                                    size="small"
                                                    fullWidth
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <CustomTextField
                                                    value={level.label || ''}
                                                    onChange={(e) => handleLevelChange(index, 'label', e.target.value)}
                                                    size="small"
                                                    fullWidth
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                <IconButton size="small" color="error" onClick={() => removeLevel(index)}>
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {data.trust_levels.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} align="center">
                                                <Typography variant="body2" color="textSecondary" sx={{ py: 2 }}>
                                                    {t('common.no_data_available', 'No levels defined')}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                )}

                {/* --- TAB 2: LIMITS --- */}
                {currentTab === 2 && (
                    <Box sx={{ mt: 2 }}>
                        <Grid container spacing={3}>
                            <Grid xs={12} sm={6}>
                                <CustomTextField
                                    label={t('client.reputation_max_daily')}
                                    type="number"
                                    value={data.limits.max_daily_reputation_gain ?? 100}
                                    onChange={(e) => handleLimitChange('max_daily_reputation_gain', e.target.value)}
                                    fullWidth
                                />
                            </Grid>
                            <Grid xs={12} sm={6}>
                                <CustomTextField
                                    label={t('client.reputation_decay_rate')}
                                    type="number"
                                    inputProps={{ step: 0.01, min: 0, max: 1 }}
                                    value={data.limits.decay_rate ?? 0.05}
                                    onChange={(e) => handleLimitChange('decay_rate', e.target.value)}
                                    helperText={t('client.reputation_decay_help')}
                                    fullWidth
                                />
                            </Grid>
                        </Grid>
                    </Box>
                )}
            </DialogContent>
            
            <DialogActions>
                <Button onClick={onClose} disabled={loading}>{t('common.cancel')}</Button>
                <Button onClick={handleSave} variant="contained" disabled={loading} startIcon={<SaveIcon />}>
                    {t('common.save')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ReputationConfigModal;