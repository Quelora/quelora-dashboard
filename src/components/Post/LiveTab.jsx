// src/components/Post/LiveTab.jsx
import { 
    Box, 
    Typography, 
    FormControlLabel,
    Checkbox,
    Grid
} from '@mui/material';
import CustomTextField from '../Common/CustomTextField';
import EnterpriseGate from '../Common/EnterpriseGate';
import React from 'react';

const LiveTab = ({ formData, handleChange, handleNumberChange, t, validationErrors }) => {
    return (
        <EnterpriseGate module="liveMode" compact>
        <Box className="live-tab-content" sx={{ p: 3 }}>
            <Typography variant="subtitle2" className="subsection-title" sx={{ mb: 2 }}>
                {t('liveMode.title', 'Live Mode Configuration')}
            </Typography>

            <FormControlLabel
                control={
                    <Checkbox
                        checked={formData.config.liveMode.isLiveActive}
                        onChange={handleChange}
                        name="config.liveMode.isLiveActive"
                        className="checkbox"
                    />
                }
                label={t('liveMode.isLiveActive', 'Enable Live Mode')}
                className="form-control-label"
            />

            {formData.config.liveMode.isLiveActive && (
                <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    
                    <CustomTextField
                        label={t('liveMode.startTime', 'Scheduled Start Time')}
                        name="config.liveMode.startTime"
                        type="datetime-local"
                        value={formData.config.liveMode.startTime || ''}
                        onChange={handleChange}
                        InputLabelProps={{ shrink: true }}
                        sx={{ maxWidth: 300 }}
                        error={!!validationErrors.startTime}
                        helperText={validationErrors.startTime}
                    />
                    
                    <CustomTextField
                        fullWidth
                        label={t('liveMode.maxClients', 'Maximum Concurrent Clients')}
                        name="config.liveMode.maxClients"
                        type="number"
                        value={formData.config.liveMode.maxClients}
                        onChange={handleNumberChange}
                        InputProps={{
                            inputProps: { min: 1, max: 10000 }
                        }}
                        sx={{ maxWidth: 300 }}
                        error={!!validationErrors.maxClients}
                        helperText={validationErrors.maxClients}
                    />
                </Box>
            )}
        </Box>
        </EnterpriseGate>
    );
};

export default LiveTab;