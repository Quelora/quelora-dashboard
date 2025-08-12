import { Box, Paper, Typography, Stack, IconButton } from '@mui/material';
import { useState, useMemo, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ZoomInMap, Place, Fullscreen, FullscreenExit } from '@mui/icons-material';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const GeoDistributionChart = ({ processedGeoData, colors, t, isMaximized, toggleMaximize }) => {
    const mapRef = useRef(null);
    const [zoom, setZoom] = useState(3);
    const [currentView, setCurrentView] = useState('region');
    const [highlightedItem, setHighlightedItem] = useState(null);
    const [mapReady, setMapReady] = useState(false);
    const [initialFocusDone, setInitialFocusDone] = useState(false);

    useEffect(() => {
        if (processedGeoData.length > 0 && !initialFocusDone && mapReady) {
            const timer = setTimeout(() => {
                const sortedCities = [...processedGeoData].sort((a, b) => b.total - a.total);
                if (sortedCities.length > 0) {
                    const topCity = { ...sortedCities[0], isRegion: false };
                    focusOnItem(topCity);
                    setInitialFocusDone(true);
                }
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [processedGeoData, mapReady, initialFocusDone]);

    const regionData = useMemo(() => {
        const regionMap = {};
        processedGeoData.forEach(item => {
            const regionKey = item.region || item.country;
            if (!regionMap[regionKey]) {
                regionMap[regionKey] = {
                    region: regionKey, lat: parseFloat(item.lat), lng: parseFloat(item.lng),
                    total: 0, cities: [], likes: 0, comments: 0, shares: 0, replies: 0, isRegion: true
                };
            }
            regionMap[regionKey].total += item.total;
            regionMap[regionKey].likes += item.likes;
            regionMap[regionKey].comments += item.comments;
            regionMap[regionKey].shares += item.shares;
            regionMap[regionKey].replies += item.replies;
            regionMap[regionKey].cities.push(item);

            if (regionMap[regionKey].cities.length > 1) {
                const totalActivity = regionMap[regionKey].cities.reduce((sum, city) => sum + city.total, 0);
                let latSum = 0;
                let lngSum = 0;
                regionMap[regionKey].cities.forEach(city => {
                    const weight = city.total / totalActivity;
                    latSum += parseFloat(city.lat) * weight;
                    lngSum += parseFloat(city.lng) * weight;
                });
                regionMap[regionKey].lat = latSum;
                regionMap[regionKey].lng = lngSum;
            }
        });
        return Object.values(regionMap);
    }, [processedGeoData]);

    const focusOnItem = (item) => {
        if (!mapReady || !mapRef.current) return;
        const map = mapRef.current;
        const targetZoom = item.isRegion ? 6 : 10;
        map.flyTo([item.lat, item.lng], targetZoom, { duration: 1, easeLinearity: 0.25 });
        setHighlightedItem(item);
        setCurrentView(item.isRegion ? 'region' : 'city');
        setZoom(targetZoom);
    };

    const MapController = () => {
        const map = useMap();
        useEffect(() => {
            mapRef.current = map;
            setMapReady(true);
            const updateView = () => {
                setZoom(map.getZoom());
                setCurrentView(map.getZoom() >= 8 ? 'city' : 'region');
            };
            map.on('zoomend', updateView);
            updateView();
            return () => map.off('zoomend', updateView);
        }, [map]);
        return null;
    };

    const calculateRadius = (total, isRegion = false) => {
        const baseSize = Math.sqrt(total) * (isRegion ? 50000 : 30000);
        const zoomFactor = Math.pow(1.3, zoom);
        return Math.min(isRegion ? 200000 : 150000, Math.max(isRegion ? 50000 : 30000, baseSize)) / zoomFactor;
    };

    const getHighlightStyle = (item) => (highlightedItem === item ?
        { fillOpacity: 0.9, weight: 3, color: '#ff0000' } :
        { fillOpacity: 0.7, weight: 1, color: colors.default }
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
                <IconButton
                    onClick={toggleMaximize}
                    sx={{
                        position: 'absolute', top: 8, right: 8, zIndex: 1001,
                        backgroundColor: 'rgba(255, 255, 255, 0.7)',
                        '&:hover': { backgroundColor: 'rgba(255, 255, 255, 1)' }
                    }}
                    aria-label={isMaximized ? 'minimize chart' : 'maximize chart'}
                >
                    {isMaximized ? <FullscreenExit /> : <Fullscreen />}
                </IconButton>
                <Typography variant="subtitle1" fontWeight={500} gutterBottom>
                    {t('dashboard.statistics.geo_distribution')}
                </Typography>

                <Box sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: isMaximized ? 'row' : 'column',
                    overflow: 'hidden',
                }}>
                    <Box sx={{ flex: 1, minHeight: 300, borderRadius: '4px', overflow: 'hidden' }}>
                        {processedGeoData.length === 0 ? (
                            <Typography>No hay datos geográficos disponibles</Typography>
                        ) : (
                            <MapContainer center={[0, 0]} zoom={3} minZoom={2} maxZoom={14} style={{ height: '100%', width: '100%' }} whenCreated={(map) => { mapRef.current = map; setMapReady(true); map.fitWorld(); }} worldCopyJump={true}>
                                <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' noWrap={false} />
                                <MapController />
                                {regionData.map((region, index) => {
                                    if (zoom >= 8 && currentView === 'city') return null;
                                    const style = getHighlightStyle(region);
                                    return <Circle key={`region-${index}`} center={[region.lat, region.lng]} radius={calculateRadius(region.total, true)} fillOpacity={style.fillOpacity} color={style.color} fillColor={colors.default} stroke weight={style.weight} eventHandlers={{ click: () => focusOnItem(region) }}><Popup>{region.region} - Total: {region.total}</Popup></Circle>;
                                })}
                                {processedGeoData.map((city, index) => {
                                    if (zoom < 8 && currentView === 'region') return null;
                                    const style = getHighlightStyle(city);
                                    return <Circle key={`city-${index}`} center={[parseFloat(city.lat), parseFloat(city.lng)]} radius={calculateRadius(city.total)} fillOpacity={style.fillOpacity} color={style.color} fillColor={colors.default} stroke weight={style.weight} eventHandlers={{ click: () => focusOnItem({ ...city, isRegion: false }) }}><Popup>{city.city}, {city.region} - Total: {city.total}</Popup></Circle>;
                                })}
                            </MapContainer>
                        )}
                    </Box>

                    <Box sx={{
                        mt: isMaximized ? 0 : 2,
                        ml: isMaximized ? 2 : 0,
                        width: isMaximized ? 320 : 'auto',
                        flexShrink: 0,
                        height: isMaximized ? '100%' : 'auto',
                        overflowY: 'auto'
                    }}>
                        <Typography variant="subtitle2" gutterBottom>
                            {currentView === 'region' ? t('dashboard.statistics.top_regions') : t('dashboard.statistics.top_cities')}
                        </Typography>
                        <Stack direction="column" spacing={1}>
                            {(currentView === 'region' ? regionData : processedGeoData).sort((a, b) => b.total - a.total).slice(0, 10).map((item, index) => (
                                <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, borderRadius: 1, bgcolor: highlightedItem === item ? 'action.selected' : 'background.paper', '&:hover': { bgcolor: 'action.hover', cursor: 'pointer' } }} onClick={() => focusOnItem(currentView === 'region' ? item : { ...item, isRegion: false })}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
                                        <Place fontSize="small" sx={{ mr: 1, color: 'text.secondary', flexShrink: 0 }} />
                                        <Typography noWrap variant="caption">{currentView === 'region' ? item.region : `${item.city}, ${item.region}`}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Typography variant="caption" fontWeight="bold" sx={{ mr: 1 }}>{item.total}</Typography>
                                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); focusOnItem(currentView === 'region' ? item : { ...item, isRegion: false }); }}><ZoomInMap fontSize="small" /></IconButton>
                                    </Box>
                                </Box>
                            ))}
                        </Stack>
                    </Box>
                </Box>
            </Paper>
        </Box>
    );
};

export default GeoDistributionChart;