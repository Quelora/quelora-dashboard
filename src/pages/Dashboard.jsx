import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
    Box, 
    MenuItem, 
    Typography,
    useMediaQuery,
    useTheme,
    Select,
    FormControl,
    InputLabel
} from '@mui/material';
import StatsCharts from '../components/Dashboard/StatsCharts';
import { fetchStats, fetchGeoStats } from '../api/stats';
import '../assets/css/Dashboard.css';
import '../assets/css/Chart.css';

const Dashboard = () => {
    const { t } = useTranslation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    
    const [mobileOpen, setMobileOpen] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = sessionStorage.getItem('sidebarOpen');
            return saved !== null ? JSON.parse(saved) : !isMobile;
        }
        return !isMobile;
    });

    const [stats, setStats] = useState(null);
    const [geoData, setGeoData] = useState({ data: [] });
    const [selectedCid, setSelectedCid] = useState('all');
    const [clientList, setClientList] = useState([]);
    // Vuelve a inicializar con nulls para que StatsCharts pueda detectar la carga inicial
    const [dateRange, setDateRange] = useState({ dateFrom: null, dateTo: null });
    const [geoAction, setGeoAction] = useState('comment'); 

    useEffect(() => {
        try {
            const clients = JSON.parse(sessionStorage.getItem('clients') || '[]');
            setClientList(clients);
        } catch (e) {
            console.error('Error parsing clients:', e);
            setClientList([]);
        }
    }, []);

    const loadStats = async (cid, dateFrom, dateTo) => {
        try {
            const data = await fetchStats(cid, dateFrom, dateTo);
            setStats(data);
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    const loadGeoStats = async (cid, dateFrom, dateTo, action) => {
        try {
            const response = await fetchGeoStats(cid, dateFrom, dateTo, action);
            setGeoData({ data: response.data });
        } catch (error) {
            console.error('Error loading geo stats:', error);
        }
    };

    // Dependencias de useEffect dependen de dateRange.dateFrom/dateTo
    useEffect(() => {
        const cid = selectedCid === 'all' ? null : selectedCid;
        
        const executeLoadStats = () => {
            // Solo carga si hay un rango de fechas definido (después del click emulado)
            if (dateRange.dateFrom) {
                loadStats(cid, dateRange.dateFrom, dateRange.dateTo);
            }
        };

        // Si dateRange.dateFrom es null, no se ejecuta aquí, sino que espera el auto-click
        if (dateRange.dateFrom) {
            executeLoadStats();
        }

        // El intervalo solo se activa si las fechas están definidas
        let intervalId;
        if (dateRange.dateFrom) {
            intervalId = setInterval(executeLoadStats, 10000);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [selectedCid, dateRange.dateFrom, dateRange.dateTo]);
    
    // Lo mismo para geoStats
    useEffect(() => {
        const cid = selectedCid === 'all' ? null : selectedCid;

        const executeLoadGeoStats = (currentAction) => {
            // Solo carga si hay un rango de fechas definido
            if (dateRange.dateFrom) {
                loadGeoStats(cid, dateRange.dateFrom, dateRange.dateTo, currentAction);
            }
        };

        if (dateRange.dateFrom) {
            executeLoadGeoStats(geoAction);
        }

        let geoIntervalId;
        if (dateRange.dateFrom) {
            geoIntervalId = setInterval(() => {
                executeLoadGeoStats(geoAction);
            }, 60000);
        }

        return () => {
            if (geoIntervalId) clearInterval(geoIntervalId);
        };
    }, [selectedCid, dateRange.dateFrom, dateRange.dateTo, geoAction]);


    useEffect(() => {
        if (isMobile) {
            setMobileOpen(false);
        }
        sessionStorage.setItem('sidebarOpen', JSON.stringify(mobileOpen));
    }, [isMobile, mobileOpen]);

    useEffect(() => {
        document.title = t('dashboard.page_title');
    }, [t]);

    const handleDateRangeChange = (dateFrom, dateTo) => {
        setDateRange({ dateFrom, dateTo });
    };
    
    const handleGeoActionChange = (newAction) => {
        setGeoAction(newAction); 
    };

    const drawerWidth = 240;

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 1,
                    width: mobileOpen && !isMobile ? `calc(100% - ${drawerWidth}px)` : '100%',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                <Box className="client-header" sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    mb: 1,
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: { xs: 2, sm: 0 }
                }}>
                    <Typography variant="h4">
                        {t('dashboard.welcome')}
                    </Typography>
                    {clientList.length > 0 && (
                        <FormControl sx={{ minWidth: 200 }} size="small">
                            <InputLabel>{t('dashboard.select_client')}</InputLabel>
                            <Select
                                value={selectedCid}
                                onChange={(e) => setSelectedCid(e.target.value)}
                                label={t('dashboard.select_client')}
                            >
                                <MenuItem value="all">{t('dashboard.all_clients')}</MenuItem>
                                {clientList.map(client => (
                                    <MenuItem key={client.cid} value={client.cid}>
                                        {client.description || client.cid}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}
                </Box>
                
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
                        onDateRangeChange={handleDateRangeChange}
                        currentGeoAction={geoAction} 
                        onGeoActionChange={handleGeoActionChange}
                        propDateFrom={dateRange.dateFrom}
                        propDateTo={dateRange.dateTo}
                    />
                </Box>
            </Box>
        </Box>
    );
};

export default Dashboard;