import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Paper, Typography, Stack, ButtonGroup, Button, IconButton, CircularProgress } from '@mui/material';
import { MapContainer, TileLayer, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ZoomInMap, Fullscreen, FullscreenExit, Place } from '@mui/icons-material';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from '@mui/material';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const STANDARD_COLOR = '#4285F4';

const useGeoDataAggregator = (rawGeoData) => {
    return useMemo(() => {
        const countryMap = {};
        const regionMap = {};
        const cityData = [];
        
        rawGeoData.forEach(item => {
            const countryKey = item.country || 'Unknown';
            const regionKey = item.region ? `${item.country}-${item.region}` : countryKey;
            
            const lat = parseFloat(item.latitude) || 0;
            const lng = parseFloat(item.longitude) || 0;
            
            if (lat !== 0 && lng !== 0) {
                 cityData.push({
                    ...item,
                    name: `${item.city || item.region}, ${item.country}`,
                    type: 'city',
                    lat, lng,
                });
            }

            if (!regionMap[regionKey]) {
                regionMap[regionKey] = {
                    name: item.region || item.country, country: item.country, region: item.region, 
                    lat: lat, lng: lng,
                    total: 0, type: 'region'
                };
            }
            regionMap[regionKey].total += item.total;
            
            if (!countryMap[countryKey]) {
                countryMap[countryKey] = {
                    name: item.country, country: item.country, 
                    lat: lat, lng: lng,
                    total: 0, type: 'country'
                };
            }
            countryMap[countryKey].total += item.total;
        });

        const filterValid = d => d.total > 0;
        
        return {
            countryData: Object.values(countryMap).filter(filterValid),
            regionData: Object.values(regionMap).filter(filterValid),
            cityData: cityData.filter(filterValid)
        };
    }, [rawGeoData]);
};


const PostGeoView = ({ aggregatedGeoData, loading }) => {
    const { t } = useTranslation();
    const mapRef = useRef(null);
    const [zoom, setZoom] = useState(2);
    const [currentView, setCurrentView] = useState('country');
    const [highlightedItem, setHighlightedItem] = useState(null);
    const [mapReady, setMapReady] = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);
    const [initialFocusDone, setInitialFocusDone] = useState(false);

    const { countryData, regionData, cityData } = useGeoDataAggregator(aggregatedGeoData);
    
    const maxTotal = useMemo(() => {
        const data = currentView === 'country' ? countryData : (currentView === 'region' ? regionData : cityData);
        return data.reduce((max, item) => Math.max(max, item.total), 0);
    }, [currentView, countryData, regionData, cityData]);

    const getVisibleData = () => {
        switch (currentView) {
            case 'country': return countryData;
            case 'region': return regionData;
            case 'city': return cityData;
            default: return [];
        }
    };
    const currentVisibleData = getVisibleData();

    const MapController = () => {
        const map = useMap();
        useEffect(() => {
            mapRef.current = map;
            setMapReady(true);
            
            if (!initialFocusDone && countryData.length > 0) {
                 map.fitWorld();
                 setInitialFocusDone(true);
            }
            
            const updateZoomState = () => setZoom(map.getZoom());
            map.on('zoomend', updateZoomState);
            updateZoomState();
            return () => map.off('zoomend', updateZoomState);
        }, [map]);
        return null;
    };

    const toggleMaximize = () => {
        setIsMaximized(prev => !prev);
        setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
            if (mapRef.current) mapRef.current.invalidateSize();
        }, 150);
    };

    const focusOnItem = (item) => {
        setHighlightedItem(item);
        if (mapRef.current) {
            const targetZoom = item.type === 'country' ? 3 : (item.type === 'region' ? 5 : 9);
            mapRef.current.flyTo([item.lat, item.lng], targetZoom, { duration: 0.5, easeLinearity: 0.25 });
        }
    };
    
    const handleViewChange = (newView) => {
        setCurrentView(newView);
        setHighlightedItem(null);
        if (mapRef.current) {
            const data = newView === 'country' ? countryData : (newView === 'region' ? regionData : cityData);
            if (data.length > 0) {
                const topItem = [...data].sort((a, b) => b.total - a.total)[0];
                focusOnItem(topItem);
            } else {
                mapRef.current.flyTo([0, 0], 2, { duration: 1 });
            }
        }
    };

    const calculateRadius = (total) => {
        if (maxTotal === 0) return 0;
        const scale = currentView === 'country' ? 500000 : (currentView === 'region' ? 200000 : 80000);
        const baseMin = currentView === 'city' ? 10000 : 50000;
        const totalRatio = Math.sqrt(total) / Math.sqrt(maxTotal);
        const proportionalRadius = baseMin + (totalRatio * (scale - baseMin)); 
        const zoomCompensation = Math.pow(1.1, zoom - 2); 
        return Math.max(1000, proportionalRadius / zoomCompensation); 
    };

    const getHighlightStyle = (item) => (highlightedItem === item ?
        { fillOpacity: 0.9, weight: 3, color: '#ff0000' } :
        { fillOpacity: 0.7, weight: 1, color: STANDARD_COLOR }
    );
    
    if (loading) {
        return (
            <Box sx={{ height: 600, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <CircularProgress />
            </Box>
        );
    }
    
    if (aggregatedGeoData.length === 0) {
         return (
            <Box sx={{ height: 600, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <Typography variant="body1">{t('dashboard.postStats.noGeoData')}</Typography>
            </Box>
        );
    }

    return (
        <Paper elevation={0} sx={{ p: 2, border: '1px solid #dadce0', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)', height: isMaximized ? '720px' : '600px', position: 'relative' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" marginBottom={2}>
                <Typography variant="h6" fontWeight={500}>
                    {t('dashboard.postStats.geoMapTitle')}
                </Typography>
                
                <ButtonGroup variant="contained" size="small" aria-label="Geographic View Selector">
                    <Button onClick={() => handleViewChange('country')} variant={currentView === 'country' ? 'contained' : 'outlined'} sx={{ minWidth: 80 }}>
                        {t('dashboard.statistics.country')}
                    </Button>
                    <Button onClick={() => handleViewChange('region')} variant={currentView === 'region' ? 'contained' : 'outlined'} sx={{ minWidth: 80 }}>
                        {t('dashboard.statistics.region')}
                    </Button>
                    <Button onClick={() => handleViewChange('city')} variant={currentView === 'city' ? 'contained' : 'outlined'} sx={{ minWidth: 80 }}>
                        {t('dashboard.statistics.city')}
                    </Button>
                </ButtonGroup>
                
                <IconButton
                    onClick={toggleMaximize}
                    sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1001, backgroundColor: 'rgba(255, 255, 255, 0.7)', '&:hover': { backgroundColor: 'rgba(255, 255, 255, 1)' } }}
                    aria-label={isMaximized ? 'minimize map' : 'maximize map'}
                >
                    {isMaximized ? <FullscreenExit /> : <Fullscreen />}
                </IconButton>
            </Stack>
            
            <Box sx={{ display: 'flex', height: isMaximized ? 'calc(100% - 60px)' : 'calc(100% - 60px)' }}>
                {/* Map Container (70%) */}
                <Box sx={{ flex: '0 0 70%', minHeight: '100%', borderRadius: '4px', overflow: 'hidden' }}>
                    <MapContainer center={[0, 0]} zoom={2} minZoom={2} maxZoom={14} style={{ height: '100%', width: '100%' }} worldCopyJump={true}>
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' noWrap={false} />
                        <MapController />
                        
                        {currentVisibleData.map((item, index) => {
                            const style = getHighlightStyle(item);
                            const name = item.type === 'city' ? `${item.city || item.region}, ${item.country}` : item.name;
                            const popupContent = `${name} - Total: ${item.total.toLocaleString()}`;
                            return (
                                <Circle 
                                    key={`${item.type}-${index}`} 
                                    center={[parseFloat(item.lat), parseFloat(item.lng)]} 
                                    radius={calculateRadius(item.total)} 
                                    fillOpacity={style.fillOpacity} 
                                    color={style.color} 
                                    fillColor={STANDARD_COLOR} 
                                    stroke 
                                    weight={style.weight} 
                                    eventHandlers={{ click: () => focusOnItem(item) }}
                                >
                                    <Popup>{popupContent}</Popup>
                                </Circle>
                            );
                        })}
                    </MapContainer>
                </Box>
                
                {/* Geo Data List (30% with scroll fix) */}
                <Box sx={{ flex: '0 0 30%', ml: 2, overflowY: 'auto', maxHeight: '100%', minWidth: 200 }}>
                    <Typography variant="subtitle2" gutterBottom>
                        {t(`dashboard.postStats.top_${currentView}s`)}
                    </Typography>
                    <TableContainer component={Box}>
                        <Table size="small" stickyHeader sx={{ tableLayout: 'fixed' }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ width: '50%' }}>{t('dashboard.postStats.geoHeader.location')}</TableCell>
                                    <TableCell align="right" sx={{ width: '25%' }}>{t('dashboard.postStats.geoHeader.total')}</TableCell>
                                    <TableCell align="right" sx={{ width: '25%' }}>{t('dashboard.postStats.geoHeader.actions')}</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {currentVisibleData.sort((a, b) => b.total - a.total).slice(0, 15).map((item, index) => (
                                    <TableRow 
                                        key={index} 
                                        hover 
                                        onClick={() => focusOnItem(item)}
                                        selected={highlightedItem === item}
                                        sx={{ cursor: 'pointer' }}
                                    >
                                        <TableCell sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                <Place fontSize="small" sx={{ color: STANDARD_COLOR, minWidth: '16px' }} />
                                                <Typography variant="caption" noWrap>{item.name}</Typography>
                                            </Stack>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography variant="caption" fontWeight="bold">{item.total.toLocaleString()}</Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography variant="caption">({item.type.toUpperCase()})</Typography>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            </Box>
        </Paper>
    );
};

export default PostGeoView;