import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Paper, Typography, Stack, ButtonGroup, Button, IconButton, CircularProgress } from '@mui/material';
import { MapContainer, TileLayer, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Fullscreen, FullscreenExit, Place } from '@mui/icons-material';
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
        const sumProps = ['total', 'likes', 'comments', 'shares', 'replies']; 

        rawGeoData.forEach(item => {
            const countryKey = item.country || 'Unknown';
            const lat = parseFloat(item.latitude || item.lat) || 0; 
            const lng = parseFloat(item.longitude || item.lng) || 0; 
            
            if (lat === 0 && lng === 0) return;

            const regionKey = item.region ? `${countryKey}-${item.region}` : countryKey;
            
            cityData.push({
                ...item,
                name: `${item.city || item.region || item.country}, ${item.country}`,
                type: 'city',
                lat, lng,
            });

            if (!regionMap[regionKey]) {
                regionMap[regionKey] = {
                    name: item.region || item.country, country: item.country, region: item.region, 
                    lat: lat, lng: lng, 
                    total: 0, likes: 0, comments: 0, shares: 0, replies: 0, type: 'region'
                };
            }
            sumProps.forEach(prop => { regionMap[regionKey][prop] = (regionMap[regionKey][prop] || 0) + (item[prop] || 0); });
            
            if (!countryMap[countryKey]) {
                countryMap[countryKey] = {
                    name: item.country, country: item.country, 
                    lat: lat, lng: lng,
                    total: 0, likes: 0, comments: 0, shares: 0, replies: 0, type: 'country'
                };
            }
            sumProps.forEach(prop => { countryMap[countryKey][prop] = (countryMap[countryKey][prop] || 0) + (item[prop] || 0); });
        });

        const filterValid = d => d.total > 0 && d.lat !== 0 && d.lng !== 0;
        
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
    
    const [currentView, setCurrentView] = useState('country');
    const [selectedCountry, setSelectedCountry] = useState(null);
    const [selectedRegion, setSelectedRegion] = useState(null);
    
    const [highlightedItem, setHighlightedItem] = useState(null);
    const [mapReady, setMapReady] = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);
    const [initialFocusDone, setInitialFocusDone] = useState(false);

    const { countryData, regionData, cityData } = useGeoDataAggregator(aggregatedGeoData);
    
    const getVisibleData = (view = currentView, country = selectedCountry, region = selectedRegion) => {
        switch (view) {
            case 'country': 
                return countryData;
            case 'region': 
                return country 
                    ? regionData.filter(d => d.country === country) 
                    : regionData; 
            case 'city':
                if (region && country) {
                    return cityData.filter(d => d.country === country && d.region === region);
                }
                if (country) {
                    return cityData.filter(d => d.country === country);
                }
                return cityData;
            default: 
                return [];
        }
    };
    const currentVisibleData = getVisibleData(); 
    
    const maxTotal = useMemo(() => {
        return currentVisibleData.reduce((max, item) => Math.max(max, item.total), 0);
    }, [currentVisibleData]);


    const adjustMapBounds = (data) => {
        if (!mapRef.current || data.length === 0) return;
        
        const map = mapRef.current;
        const latLngs = data.map(d => [d.lat, d.lng]);

        if (latLngs.length > 0) {
            try {
                const bounds = L.latLngBounds(latLngs);
                map.flyToBounds(bounds, { padding: [50, 50], maxZoom: 10, duration: 0.8 });
            } catch (e) {
                if (latLngs.length === 1) {
                    const targetZoom = data[0].type === 'city' ? 10 : (data[0].type === 'region' ? 7 : 3);
                    map.flyTo(latLngs[0], targetZoom, { duration: 0.8 });
                }
            }
        } else if (!selectedCountry && !selectedRegion) {
             map.flyTo([0, 0], 2, { duration: 0.8 });
        }
    };
    
    const MapController = () => {
        const map = useMap();
        
        useEffect(() => {
            mapRef.current = map;
            setMapReady(true);
            
            if (!initialFocusDone && countryData.length > 0) {
                 map.fitWorld({ padding: [20, 20] });
                 setInitialFocusDone(true);
            }
            
        }, [map, countryData, initialFocusDone]); 
        
        useEffect(() => {
            if (mapReady && initialFocusDone) {
                const timeout = setTimeout(() => {
                    const dataToAdjust = getVisibleData(currentView, selectedCountry, selectedRegion);
                    adjustMapBounds(dataToAdjust);
                }, 50); 
                return () => clearTimeout(timeout);
            }
        }, [mapReady, initialFocusDone, selectedCountry, selectedRegion, currentView]); 

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
            const map = mapRef.current;
            const targetZoom = item.type === 'country' ? 3 : (item.type === 'region' ? 7 : 10);
            map.flyTo([item.lat, item.lng], targetZoom, { duration: 0.5, easeLinearity: 0.25 });
        }
    };
    
    const handleItemClick = (item) => {
        setHighlightedItem(item); 
        
        if (item.type === 'country') {
            setCurrentView('region');
            setSelectedCountry(item.country);
            setSelectedRegion(null); 
        } else if (item.type === 'region') {
            setCurrentView('city');
            setSelectedCountry(item.country); 
            setSelectedRegion(item.region);
        } else if (item.type === 'city') {
            focusOnItem(item);
        }
    };

    const handleViewChange = (newView) => {
        setHighlightedItem(null);
        
        let nextCountry = selectedCountry;
        let nextRegion = selectedRegion;

        if (newView === 'country') {
            nextCountry = null;
            nextRegion = null;
            if (mapRef.current) mapRef.current.flyTo([0, 0], 2, { duration: 0.8 });
        } else if (newView === 'region') {
            nextRegion = null;
        } else if (newView === 'city') {
        }
        
        setCurrentView(newView);
        setSelectedCountry(nextCountry);
        setSelectedRegion(nextRegion);
    };

    const calculateRadius = (total) => {
        if (maxTotal === 0) return 0;
        // AJUSTE: Reducción del radio base para 'city' (80000 -> 8000 metros)
        const scale = currentView === 'country' ? 500000 : (currentView === 'region' ? 200000 : 8000); 
        // AJUSTE: Reducción del radio mínimo para 'city' (10000 -> 500 metros)
        const baseMin = currentView === 'city' ? 500 : 50000;
        const totalRatio = Math.sqrt(total) / Math.sqrt(maxTotal);
        const proportionalRadius = baseMin + (totalRatio * (scale - baseMin)); 
        return Math.max(1000, proportionalRadius); 
    };

    const getHighlightStyle = (item) => (highlightedItem && highlightedItem.name === item.name && highlightedItem.type === item.type ?
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
                
                <Box sx={{ display: 'flex', alignItems: 'center', mx: 2, flexGrow: 1, justifyContent: 'center' }}>
                    <Typography variant="caption" sx={{ mr: 1, fontWeight: 'bold' }}>Vista: {t(`dashboard.statistics.${currentView}`)}</Typography>
                    {selectedCountry && (
                        <Typography variant="caption" sx={{ mr: 1, p: 0.5, bgcolor: '#f0f0f0', borderRadius: 1 }}>
                            {t('dashboard.statistics.country')}: <strong>{selectedCountry}</strong>
                        </Typography>
                    )}
                    {selectedRegion && (
                        <Typography variant="caption" sx={{ mr: 1, p: 0.5, bgcolor: '#e0e0e0', borderRadius: 1 }}>
                            {t('dashboard.statistics.region')}: <strong>{selectedRegion}</strong>
                        </Typography>
                    )}
                </Box>
                
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
                <Box sx={{ flex: '0 0 70%', minHeight: '100%', borderRadius: '4px', overflow: 'hidden' }}>
                    <MapContainer center={[0, 0]} zoom={2} minZoom={2} maxZoom={14} style={{ height: '100%', width: '100%' }} worldCopyJump={true}>
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" attribution='&copy; <a href="https://www.openstreetmap.com/copyright">OpenStreetMap</a> contributors' noWrap={false} />
                        <MapController />
                        
                        {currentVisibleData.map((item, index) => {
                            const style = getHighlightStyle(item);
                            
                            let name;
                            if (item.type === 'city') {
                                name = `${item.city || item.region || 'N/A'}, ${item.country}`;
                            } else if (item.type === 'region') {
                                name = `${item.region || 'N/A'}, ${item.country}`;
                            } else {
                                name = item.name;
                            }
                            const popupContent = `${name} - Total: ${item.total.toLocaleString()}`;

                            return (
                                <Circle 
                                    key={`${item.type}-${item.country}-${item.region || ''}-${item.city || ''}`} 
                                    center={[item.lat, item.lng]} 
                                    radius={calculateRadius(item.total)} 
                                    fillOpacity={style.fillOpacity} 
                                    color={style.color} 
                                    fillColor={STANDARD_COLOR} 
                                    stroke 
                                    weight={style.weight} 
                                    eventHandlers={{ 
                                        click: () => handleItemClick(item) 
                                    }}
                                >
                                    <Popup>{popupContent}</Popup>
                                </Circle>
                            );
                        })}
                    </MapContainer>
                </Box>
                
                <Box sx={{ flex: '0 0 30%', ml: 2, overflowY: 'auto', maxHeight: '100%', minWidth: 200 }}>
                    <Typography variant="subtitle2" gutterBottom>
                        {t(`dashboard.postStats.top_${currentView}s`)} ({currentVisibleData.length} {t('common.items')})
                    </Typography>
                    <TableContainer component={Box}>
                        <Table size="small" stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ width: '60%' }}>{t('dashboard.postStats.geoHeader.location')}</TableCell>
                                    <TableCell align="right" sx={{ width: '25%' }}>{t('dashboard.postStats.geoHeader.total')}</TableCell>
                                    <TableCell align="right" sx={{ width: '15%' }}>{t('dashboard.postStats.geoHeader.actions')}</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {currentVisibleData.sort((a, b) => b.total - a.total).slice(0, 15).map((item, index) => (
                                    <TableRow 
                                        key={index} 
                                        hover 
                                        onClick={() => handleItemClick(item)} 
                                        selected={highlightedItem && highlightedItem.name === item.name && highlightedItem.type === item.type}
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
                                            <Button size="small" 
                                                onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    handleItemClick(item); 
                                                }}
                                                disabled={item.type === 'city'} 
                                            >
                                                {item.type === 'city' ? t('common.view') : t('common.drilldown')} 
                                            </Button>
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