/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

// ./src/pages/Dashboard.jsx
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
    Box, 
    MenuItem, 
    Typography,
    useMediaQuery,
    useTheme,
    Select,
    FormControl,
    InputLabel,
    CircularProgress
} from '@mui/material';
import StatsCharts from '../components/Dashboard/StatsCharts';
import useDashboardStats from '../hooks/useDashboardStats';
import { loadClientsFromSession } from '../api/auth'; 

const Dashboard = () => {
    const { t } = useTranslation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    
    const [clientList, setClientList] = useState([]);

    const {
        stats,
        geoData,
        selectedCid,
        dateRange,
        geoAction,
        lastUpdated,
        isRealTimeActive, 
        onRealTimeToggle,
        handleCidChange,
        onDateRangeChange,
        onGeoActionChange
    } = useDashboardStats();

    useEffect(() => {
        const clients = loadClientsFromSession(); 
        setClientList(clients);
    }, []);

    useEffect(() => {
        document.title = t('dashboard.page_title');
    }, [t]);

    const isLoadingInitial = !stats && dateRange.dateFrom;

    return (
        <Box sx={{display: 'flex', minHeight: '100vh', flexDirection: 'column'}}>
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 1,
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                <Box className="client-header" sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    mb: 1,
                    flexDirection: {xs: 'column', sm: 'row'},
                    gap: {xs: 2, sm: 0}
                }}>
                    <Typography variant="h4">
                        {t('dashboard.welcome')}
                    </Typography>
                    {clientList.length > 0 && (
                        <FormControl sx={{minWidth: 200}} size="small">
                            <InputLabel>{t('dashboard.select_client')}</InputLabel>
                            <Select
                                value={selectedCid}
                                onChange={(e) => handleCidChange(e.target.value)}
                                label={t('dashboard.select_client')}
                            >
                                <MenuItem value="all">{t('dashboard.all_clients')}</MenuItem>
                                {clientList.map(client => (
                                    <MenuItem key={client.cid} value={client.cid}>{client.description || client.cid}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}
                </Box>
                
                {isLoadingInitial ? (
                    <Box sx={{display: 'flex', justifyContent: 'center', p: 4}}>
                        <CircularProgress/>
                    </Box>
                ) : (
                    <Box sx={{ 
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        minHeight: 0,
                        gap: 2
                    }}>
                        <StatsCharts 
                            stats={stats} 
                            geoData={geoData} 
                            onDateRangeChange={onDateRangeChange}
                            currentGeoAction={geoAction} 
                            onGeoActionChange={onGeoActionChange}
                            propDateFrom={dateRange.dateFrom}
                            propDateTo={dateRange.dateTo}
                            lastUpdated={lastUpdated}
                            isRealTimeActive={isRealTimeActive} 
                            onRealTimeToggle={onRealTimeToggle}
                        />
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default Dashboard;