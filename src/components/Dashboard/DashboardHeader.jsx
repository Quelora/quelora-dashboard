/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

// ./src/components/Dashboard/DashboardHeader.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
    Box, 
    Typography, 
    CircularProgress,
    MenuItem, 
    Select,
    FormControl,
    InputLabel,
    IconButton
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';

const DashboardHeader = ({ title, clients, currentCid, handleCidChange, handleRefresh, loading, lastUpdated }) => {
    const { t } = useTranslation();

    return (
        <Box className="client-header" sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 1,
            flexDirection: {xs: 'column', sm: 'row'},
            gap: {xs: 2, sm: 0}
        }}>
            <Typography variant="h4">
                {title}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {/* Selector de Cliente */}
                {clients.length > 0 && (
                    <FormControl sx={{minWidth: 200}} size="small">
                        <InputLabel>{t('dashboard.select_client')}</InputLabel>
                        <Select
                            value={currentCid}
                            onChange={handleCidChange}
                            label={t('dashboard.select_client')}
                        >
                            <MenuItem value="all">{t('dashboard.all_clients')}</MenuItem>
                            {clients.map(client => (
                                <MenuItem key={client.cid} value={client.cid}>
                                    {client.description || client.cid}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                )}

                {/* Botón de Refresh */}
                <IconButton onClick={handleRefresh} disabled={loading} size="small">
                    {loading ? <CircularProgress size={20}/> : <RefreshIcon/>}
                </IconButton>
            </Box>
            
            <Box sx={{width: '100%', mt: 1}}>
                <Typography className="last-updated">
                    {t('dashboard.statistics.last_updated', {time: lastUpdated?.toLocaleTimeString() || '--'})}
                </Typography>
            </Box>
        </Box>
    );
};

export default DashboardHeader;