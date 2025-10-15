import { Box, Paper, Typography, Stack, IconButton, ButtonGroup, Button } from '@mui/material';
import { useState, useMemo, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ZoomInMap, Place } from '@mui/icons-material';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const STANDARD_COLOR = '#4285F4';

const GeoDistributionChart = ({ processedGeoData, colors, t, currentAction, onActionChange }) => {
    const mapRef = useRef(null);
    
    const [currentView, setCurrentView] = useState('country');
    const [selectedCountry, setSelectedCountry] = useState(null);
    const [selectedRegion, setSelectedRegion] = useState(null);

    const [highlightedItem, setHighlightedItem] = useState(null);
    const [mapReady, setMapReady] = useState(false);
    const [initialFocusDone, setInitialFocusDone] = useState(false); // Necesario para el enfoque inicial
    const [shouldRefocus, setShouldRefocus] = useState(false); // Necesario para forzar ajuste en cambio de vista
    
    const actions = useMemo(() => ([
        { key: 'comment', label: t('dashboard.statistics.comments') },
        { key: 'like', label: t('dashboard.statistics.likes') },
        { key: 'share', label: t('dashboard.statistics.shares') },
        { key: 'reply', label: t('dashboard.statistics.replies') },
    ]), [t]);

    const calculateAggregatedData = (data, type) => {
        const map = {};
        data.forEach(item => {
            const visualTotal = item.total || 0; 
            
            let key;
            if (type === 'country') {
                key = item.country || 'Unknown'; 
            } else if (type === 'region') {
                key = `${item.country}-${item.region || 'Unknown'}`; 
            } else {
                key = `${item.country}-${item.region || 'Unknown'}-${item.city || 'Unknown'}`; 
            }
            
            if (!map[key]) {
                map[key] = {
                    name: type === 'country' ? item.country : item.region || item.country,
                    country: item.country, region: item.region, city: item.city,
                    lat: parseFloat(item.lat || item.latitude), 
                    lng: parseFloat(item.lng || item.longitude),
                    total: 0, type: type,
                    color: STANDARD_COLOR
                };
            }
            map[key].total += visualTotal;
        });
        
        return Object.values(map).filter(d => d.lat !== 0 && d.lng !== 0 && d.total > 0);
    };
    
    const countryData = useMemo(() => calculateAggregatedData(processedGeoData, 'country'), [processedGeoData]);
    
    const regionData = useMemo(() => calculateAggregatedData(processedGeoData, 'region'), [processedGeoData]);
    
    const cityData = useMemo(() => processedGeoData.map((city) => ({ 
        ...city, 
        type: 'city', 
        name: `${city.city || city.region || 'N/A'}, ${city.country}`,
        lat: parseFloat(city.lat || city.latitude), 
        lng: parseFloat(city.lng || city.longitude),
        uniqueMapKey: `city-${city.country}-${city.region || ''}-${city.city || ''}-${city.lat}-${city.lng}` 
    })).filter(d => d.lat !== 0 && d.lng !== 0), [processedGeoData]);
    
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
            
            // Solo hacemos el enfoque inicial una vez.
            if (!initialFocusDone && countryData.length > 0) {
                 map.fitWorld({ padding: [20, 20] });
                 setInitialFocusDone(true);
            }
            
        }, [map, countryData, initialFocusDone]); 
        
        // Este efecto se encarga de reajustar los límites solo cuando la vista geográfica cambia (country, region, city)
        useEffect(() => {
            if (!mapReady || !shouldRefocus) return;

            const timeout = setTimeout(() => {
                adjustMapBounds(getVisibleData(currentView, selectedCountry, selectedRegion));
                setShouldRefocus(false); 
            }, 50); 
            
            return () => clearTimeout(timeout);
        }, [mapReady, shouldRefocus, currentView, selectedCountry, selectedRegion, currentAction]); 

        return null;
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
            setShouldRefocus(true); // Forzar reajuste de límites
        } else if (item.type === 'region') {
            setCurrentView('city');
            setSelectedCountry(item.country); 
            setSelectedRegion(item.region);
            setShouldRefocus(true); // Forzar reajuste de límites
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
            // Al volver a la vista de país global, ajustamos el mapa al mundo
            if (mapRef.current) mapRef.current.flyTo([0, 0], 2, { duration: 0.8 });
        } else if (newView === 'region') {
            nextRegion = null;
        } else if (newView === 'city') {
        }
        
        setCurrentView(newView);
        setSelectedCountry(nextCountry);
        setSelectedRegion(nextRegion);
        // Solo forzamos el reajuste si no volvemos a la vista de país, ya que esa vista ya está manejada arriba
        if (newView !== 'country') {
             setShouldRefocus(true);
        }
    };

    const getRadiusScale = () => {
        let baseRadius;
        if (currentView === 'country') baseRadius = 500000;
        else if (currentView === 'region') baseRadius = 200000;
        else baseRadius = 8000; 
        return baseRadius;
    };
    const calculateRadius = (total) => {
        if (maxTotal === 0) return 0;
        const scale = getRadiusScale();
        const baseMin = currentView === 'city' ? 500 : 50000; 
        const totalRatio = Math.sqrt(total) / Math.sqrt(maxTotal); 
        const proportionalRadius = baseMin + (totalRatio * (scale - baseMin)); 
        return Math.max(1000, proportionalRadius); 
    };

    const getHighlightStyle = (item) => (highlightedItem && highlightedItem.name === item.name && highlightedItem.type === item.type ?
        { fillOpacity: 0.9, weight: 3, color: '#ff0000' } :
        { fillOpacity: 0.7, weight: 1, color: STANDARD_COLOR }
    );
    
    return (
        <Box sx={{ height: '100%', width: '100%', backgroundColor: 'var(--white)' }}>
            <Paper elevation={0} sx={{
                p: 2,
                display: 'flex', flexDirection: 'column', height: '100%',
                border: '1px solid #dadce0', borderRadius: '8px',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                backgroundColor: 'var(--white)', position: 'relative'
            }}>
                
                <Stack direction="row" justifyContent="space-between" alignItems="center" marginBottom={2} sx={{ flexWrap: 'wrap', gap: 1 }}>
                    <Typography variant="subtitle1" fontWeight={500} sx={{ mr: 2 }}>
                        {t('dashboard.statistics.geo_distribution')}
                    </Typography>
                    
                    <ButtonGroup variant="outlined" size="small" aria-label="Action Selector" sx={{ mr: 2 }}>
                        {actions.map((action) => (
                            <Button
                                key={action.key}
                                onClick={() => onActionChange(action.key)}
                                variant={currentAction === action.key ? 'contained' : 'outlined'}
                            >
                                {action.label}
                            </Button>
                        ))}
                    </ButtonGroup>

                    <Box sx={{ display: 'flex', alignItems: 'center', mx: 2, flexGrow: 1, justifyContent: 'center' }}>
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
                    
                    <ButtonGroup size="small" aria-label="Geographic View Selector">
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
                </Stack>
                
                {processedGeoData.length === 0 ? (
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
                        <Typography variant="body1">{t('dashboard.postStats.noGeoData')}</Typography>
                    </Box>
                ) : (
                    <Box sx={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'row', 
                        overflow: 'hidden',
                        minHeight: 300,
                    }}>
                        <Box sx={{ 
                            flex: '0 0 70%', 
                            minHeight: 300, 
                            borderRadius: '4px', 
                            overflow: 'hidden' 
                        }}>
                            <MapContainer center={[0, 0]} zoom={2} minZoom={2} maxZoom={14} style={{ height: '100%', width: '100%' }} worldCopyJump={true}>
                                <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' noWrap={false} />
                                <MapController />
                                
                                {currentVisibleData.map((item) => {
                                    const style = getHighlightStyle(item);
                                    const name = item.type === 'city' ? `${item.city || item.region}, ${item.country}` : item.name;
                                    const popupContent = `${name} - Total: ${item.total}`;
                                    
                                    const mapKey = item.uniqueMapKey || `${item.type}-${item.country}-${item.region || ''}-${item.city || ''}`;

                                    return (
                                        <Circle 
                                            key={mapKey} 
                                            center={[parseFloat(item.lat), parseFloat(item.lng)]} 
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
                        
                        <Box sx={{
                            mt: 0,
                            ml: 2, 
                            width: '30%', 
                            flexShrink: 0,
                            height: '100%',
                            overflowY: 'auto'
                        }}>
                            
                            <Typography variant="subtitle2" gutterBottom>
                                {t(`dashboard.statistics.top_${currentView}s`)} ({currentVisibleData.length} {t('common.items')})
                            </Typography>
                            
                            <Stack direction="column" spacing={1}>
                                {currentVisibleData.sort((a, b) => b.total - a.total).slice(0, 10).map((item) => (
                                    <Box 
                                        key={`${item.type}-${item.country}-${item.region || ''}-${item.city || ''}`} 
                                        sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, borderRadius: 1, bgcolor: highlightedItem && highlightedItem.name === item.name && highlightedItem.type === item.type ? 'action.selected' : 'background.paper', '&:hover': { bgcolor: 'action.hover', cursor: 'pointer' } }} 
                                        onClick={() => handleItemClick(item)}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
                                            <Place fontSize="small" sx={{ mr: 1, color: STANDARD_COLOR, flexShrink: 0 }} />
                                            
                                            <Typography noWrap variant="caption">{item.type === 'city' ? `${item.city || item.region}, ${item.country}` : item.name}</Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Typography variant="caption" fontWeight="bold" sx={{ mr: 1 }}>{item.total.toLocaleString()}</Typography>
                                            
                                            <IconButton size="small" 
                                                onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    handleItemClick(item); 
                                                }}
                                                disabled={item.type === 'city'}
                                            >
                                                <ZoomInMap fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    </Box>
                                ))}
                            </Stack>
                        </Box>
                    </Box>
                )}
            </Paper>
        </Box>
    );
};

export default GeoDistributionChart;