/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

// ./src/components/Dashboard/GeoDistributionChart.jsx
import { Box, Paper, Typography, Stack, ButtonGroup, Button as MuiButton, TableContainer, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Popup, Circle, useMap, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Place } from '@mui/icons-material';
import countryNameToCode from './countryCodes';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: '/images/map/marker-icon-2x.png',
    iconUrl: '/images/map/marker-icon.png',
    shadowUrl: '/images/map/marker-shadow.png',
});

const STANDARD_COLOR = '#3367D6';
const GEOJSON_URL = '/data/countries.geo.json';

const MapContent = React.memo(({ 
    currentView, 
    worldGeoJson, 
    currentVisibleData, 
    countryDataMap, 
    maxTotal, 
    handleItemClick, 
    calculateRadius 
}) => {
    
    const customCanvasRenderer = useMemo(() => {
        return L.canvas({ padding: 0.5, tolerance: 5 });
    }, []);

    const geoJsonStyle = useCallback((feature) => {
        const countryName = feature.properties.name || feature.id;
        const manualMap = { 
            'United States of America': 'United States', 
            'USA': 'United States',
            'Russian Federation': 'Russia',
            'England': 'United Kingdom'
        };
        const lookupName = (manualMap[countryName] || countryName).toLowerCase();
        
        const countryStat = countryDataMap[lookupName];

        if (countryStat) {
            const intensity = 0.2 + (0.6 * (countryStat.total / maxTotal));
            return {
                fillColor: STANDARD_COLOR,
                fillOpacity: intensity,
                weight: 0.5,
                opacity: 1,
                color: '#fff',
                dashArray: ''
            };
        }
        return {
            fillColor: '#F5F5F5',
            fillOpacity: 0.5,
            weight: 0.5,
            color: '#ddd',
        };
    }, [countryDataMap, maxTotal]);

    const onEachCountry = useCallback((feature, layer) => {
        const countryName = feature.properties.name || feature.id;
        const manualMap = { 
            'United States of America': 'United States', 
            'USA': 'United States',
            'Russian Federation': 'Russia',
            'England': 'United Kingdom'
        };
        const lookupName = (manualMap[countryName] || countryName).toLowerCase();
        const countryStat = countryDataMap[lookupName];

        if (countryStat) {
            const countryCode = countryNameToCode[countryStat.country];
            const flagUrl = countryCode ? `https://flagcdn.com/w40/${countryCode.toLowerCase()}.png` : null;
            
            const tooltipContent = `
                <div style="text-align: center; min-width: 100px;">
                    ${flagUrl ? `<img src="${flagUrl}" style="width: 25px; border: 1px solid #ccc; margin-bottom: 4px;"/><br/>` : ''}
                    <strong>${countryStat.country}</strong><br/>
                    <span style="color: #666;">Total: ${countryStat.total.toLocaleString()}</span>
                </div>
            `;

            layer.bindTooltip(tooltipContent, {
                sticky: true,
                direction: 'top',
                opacity: 1,
                permanent: false
            });

            layer.on({
                mouseover: (e) => {
                    const l = e.target;
                    l.setStyle({ weight: 2, color: '#666', fillOpacity: 0.9 });
                    l.bringToFront();
                },
                mouseout: (e) => {
                    const l = e.target;
                    const intensity = 0.2 + (0.6 * (countryStat.total / maxTotal));
                    l.setStyle({ weight: 0.5, color: '#fff', fillOpacity: intensity });
                },
                click: (e) => {
                    L.DomEvent.stopPropagation(e);
                    handleItemClick(countryStat);
                }
            });
        }
    }, [countryDataMap, maxTotal, handleItemClick]);

    const geoJsonKey = useMemo(() => {
        return `world-geo-${Object.keys(countryDataMap).length}`;
    }, [countryDataMap]);

    return (
        <>
            {currentView === 'country' && worldGeoJson ? (
                <GeoJSON 
                    key={geoJsonKey} 
                    data={worldGeoJson} 
                    style={geoJsonStyle} 
                    onEachFeature={onEachCountry}
                    renderer={customCanvasRenderer}
                />
            ) : (
                currentVisibleData.map((item) => {
                    const mapKey = item.uniqueMapKey || `bubble-${item.name}`;
                    return (
                        <Circle 
                            key={mapKey}
                            center={[item.lat, item.lng]} 
                            radius={calculateRadius(item.total)} 
                            pathOptions={{ color: STANDARD_COLOR, fillColor: STANDARD_COLOR, fillOpacity: 0.6 }}
                            eventHandlers={{ click: () => handleItemClick(item) }}
                            renderer={customCanvasRenderer}
                        >
                            <Popup>
                                <strong>{item.name}</strong><br/>Total: {item.total}
                            </Popup>
                        </Circle>
                    );
                })
            )}
        </>
    );
});

const GeoDistributionChart = ({ processedGeoData, t, currentAction, onActionChange }) => {
    const mapRef = useRef(null);
    
    const [currentView, setCurrentView] = useState('country');
    const [selectedCountry, setSelectedCountry] = useState(null);
    const [selectedRegion, setSelectedRegion] = useState(null);
    const [worldGeoJson, setWorldGeoJson] = useState(null);
    const [mapReady, setMapReady] = useState(false);
    const [initialFocusDone, setInitialFocusDone] = useState(false);

    useEffect(() => {
        fetch(GEOJSON_URL)
            .then(res => res.json())
            .then(data => setWorldGeoJson(data))
            .catch(err => console.error("Error cargando mapa:", err));
    }, []);

    const actions = useMemo(() => ([
        {key: 'comment', label: t('dashboard.statistics.comments')},
        {key: 'like', label: t('dashboard.statistics.likes')},
        {key: 'share', label: t('dashboard.statistics.shares')},
        {key: 'reply', label: t('dashboard.statistics.replies')},
    ]), [t]);

    const calculateAggregatedData = (data, type) => {
        const map = {};
        data.forEach(item => {
            const visualTotal = item.total || 0;
            const cName = item.country ? item.country.trim() : 'Unknown';
            
            let key;
            if (type === 'country') key = cName;
            else if (type === 'region') key = `${cName}-${item.region || 'Unknown'}`;
            else key = `${cName}-${item.region}-${item.city}`;
            
            const lat = parseFloat(item.lat || item.latitude);
            const lng = parseFloat(item.lng || item.longitude);

            if (!map[key]) {
                map[key] = {
                    ...item,
                    name: type === 'country' ? cName : item.region || cName,
                    country: cName,
                    lat: lat || 0,
                    lng: lng || 0,
                    total: 0,
                    type: type
                };
            }
            map[key].total += visualTotal;
        });
        return Object.values(map).filter(d => d.total > 0 && d.lat !== 0);
    };

    const countryData = useMemo(() => calculateAggregatedData(processedGeoData, 'country'), [processedGeoData]);
    const regionData = useMemo(() => calculateAggregatedData(processedGeoData, 'region'), [processedGeoData]);
    const cityData = useMemo(() => processedGeoData.filter(d => d.lat && d.lng && d.total > 0).map(d => ({
        ...d,
        type: 'city',
        name: `${d.city}, ${d.country}`,
        uniqueMapKey: `city-${d.country}-${d.city}-${d.lat}`
    })), [processedGeoData]);

    const getVisibleData = () => {
        if (currentView === 'country') return countryData;
        if (currentView === 'region') return selectedCountry ? regionData.filter(d => d.country === selectedCountry) : regionData;
        if (currentView === 'city') return selectedCountry ? cityData.filter(d => d.country === selectedCountry) : cityData;
        return [];
    };
    const currentVisibleData = getVisibleData();

    const maxTotal = useMemo(() => {
        return currentVisibleData.reduce((max, item) => Math.max(max, item.total), 0);
    }, [currentVisibleData]);

    const countryDataMap = useMemo(() => {
        const map = {};
        countryData.forEach(d => {
            map[d.country.toLowerCase()] = d;
        });
        return map;
    }, [countryData]);

    const adjustMapBounds = useCallback((data) => {
        if (!mapRef.current || data.length === 0) return;
        const map = mapRef.current;
        const latLngs = data.map(d => [d.lat, d.lng]);
        try {
            const bounds = L.latLngBounds(latLngs);
            map.flyToBounds(bounds, {padding: [50, 50], maxZoom: 10, duration: 1});
        } catch(e) {}
    }, []);

    const MapController = () => {
        const map = useMap();
        useEffect(() => {
            mapRef.current = map;
            setMapReady(true);
            if (!initialFocusDone && countryData.length > 0) {
                adjustMapBounds(countryData);
                setInitialFocusDone(true);
            }
        }, [map]);
        
        useEffect(() => {
             if (mapReady && selectedCountry && currentView !== 'country') {
                 adjustMapBounds(currentVisibleData);
             }
        }, [currentView, selectedCountry, currentVisibleData, mapReady, adjustMapBounds]);

        return null;
    };

    const handleItemClick = useCallback((item) => {
        if (item.type === 'country') {
            setCurrentView('region');
            setSelectedCountry(item.country);
            setSelectedRegion(null);
            if (mapRef.current) mapRef.current.flyTo([item.lat, item.lng], 5, {duration: 1});
        } else if (item.type === 'region') {
            setCurrentView('city');
            setSelectedRegion(item.region);
            if (mapRef.current) mapRef.current.flyTo([item.lat, item.lng], 8, {duration: 1});
        }
    }, []);

    const handleViewChange = (newView) => {
        setCurrentView(newView);
        if (newView === 'country') {
            setSelectedCountry(null);
            setSelectedRegion(null);
            if (mapRef.current) mapRef.current.flyTo([20, 0], 2, {duration: 1});
        }
    };

    const calculateRadius = (total) => {
        if (maxTotal === 0) return 0;
        const scale = currentView === 'region' ? 200000 : 10000;
        return Math.max(2000, (Math.sqrt(total) / Math.sqrt(maxTotal)) * scale);
    };

    return (
        <Box sx={{height: '100%', width: '100%', backgroundColor: 'var(--white)'}}>
            <Paper elevation={0} sx={{
                p: 2,
                display: 'flex', flexDirection: 'column', height: '100%',
                border: '1px solid #dadce0', borderRadius: '8px',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                backgroundColor: 'var(--white)', position: 'relative'
            }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" marginBottom={2} sx={{flexWrap: 'wrap', gap: 1}}>
                    <Typography variant="subtitle1" fontWeight={500} sx={{mr: 2}}>
                        {t('dashboard.statistics.geo_distribution')}
                    </Typography>
                    
                    <ButtonGroup variant="outlined" size="small" aria-label="Action Selector" sx={{mr: 2}}>
                        {actions.map((action) => (
                            <MuiButton
                                key={action.key}
                                onClick={() => onActionChange(action.key)}
                                variant={currentAction === action.key ? 'contained' : 'outlined'}
                            >
                                {action.label}
                            </MuiButton>
                        ))}
                    </ButtonGroup>

                    <Box sx={{display: 'flex', alignItems: 'center', mx: 2, flexGrow: 1, justifyContent: 'center'}}>
                        {selectedCountry && (
                            <Typography variant="caption" sx={{mr: 1, p: 0.5, bgcolor: '#f0f0f0', borderRadius: 1}}>
                                {t('dashboard.statistics.country')}: <strong>{selectedCountry}</strong>
                            </Typography>
                        )}
                        {selectedRegion && (
                            <Typography variant="caption" sx={{mr: 1, p: 0.5, bgcolor: '#e0e0e0', borderRadius: 1}}>
                                {t('dashboard.statistics.region')}: <strong>{selectedRegion}</strong>
                            </Typography>
                        )}
                    </Box>
                    
                    <ButtonGroup size="small">
                        <MuiButton onClick={() => handleViewChange('country')} variant={currentView === 'country' ? 'contained' : 'outlined'} sx={{minWidth: 80}}>
                            {t('dashboard.statistics.country')}
                        </MuiButton>
                        <MuiButton onClick={() => handleViewChange('region')} variant={currentView === 'region' ? 'contained' : 'outlined'} sx={{minWidth: 80}}>
                            {t('dashboard.statistics.region')}
                        </MuiButton>
                        <MuiButton onClick={() => handleViewChange('city')} variant={currentView === 'city' ? 'contained' : 'outlined'} sx={{minWidth: 80}}>
                            {t('dashboard.statistics.city')}
                        </MuiButton>
                    </ButtonGroup>
                </Stack>
                
                {(currentVisibleData.length === 0 && processedGeoData.length > 0) ? (
                    <Box sx={{flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                        <Typography variant="body1">{t('dashboard.postStats.noGeoData')}</Typography>
                    </Box>
                ) : (
                    // CONTENEDOR PRINCIPAL FIJO: 400px
                    <Box sx={{ 
                        flex: 1, 
                        display: 'flex', 
                        flexDirection: 'row', 
                        height: 400, // ALTURA FIJA ESTRICTA
                        minHeight: 400,
                        maxHeight: 400,
                        overflow: 'hidden'
                    }}>
                        <Box sx={{ 
                            flex: '0 0 70%', 
                            height: '100%',
                            borderRadius: '4px', 
                            overflow: 'hidden', 
                            backgroundColor: '#f8f9fa' 
                        }}>
                            <MapContainer 
                                center={[20, 0]} 
                                zoom={2} 
                                minZoom={2} 
                                maxZoom={14} 
                                style={{height: '100%', width: '100%'}} 
                                worldCopyJump={true}
                            >
                                <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" attribution='&copy; OSM' noWrap={false}/>
                                <MapController/>
                                
                                <MapContent 
                                    currentView={currentView}
                                    worldGeoJson={worldGeoJson}
                                    currentVisibleData={currentVisibleData}
                                    countryDataMap={countryDataMap}
                                    maxTotal={maxTotal}
                                    handleItemClick={handleItemClick}
                                    calculateRadius={calculateRadius}
                                />
                            </MapContainer>
                        </Box>

                        {/* CONTENEDOR DERECHO: Posición relativa para anclar el absoluto */}
                        <Box sx={{
                            flex: '0 0 30%', 
                            ml: 2, 
                            minWidth: 200, 
                            position: 'relative', // CLAVE: Contexto para el absoluto
                            height: '100%'
                        }}>
                            {/* CONTENEDOR ABSOLUTO: Se ajusta al 100% del padre sin empujarlo */}
                            <Box sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                display: 'flex',
                                flexDirection: 'column'
                            }}>
                                <Typography variant="subtitle2" gutterBottom sx={{flexShrink: 0}}>
                                    {t(`dashboard.postStats.top_${currentView}s`)} ({currentVisibleData.length} {t('common.items')})
                                </Typography>
                                
                                <TableContainer component={Box} sx={{ 
                                    flexGrow: 1, 
                                    overflowY: 'auto', // Scroll solo aquí
                                    minHeight: 0       // Permite que flexbox encoja este elemento
                                }}>
                                    <Table size="small" stickyHeader>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{width: '60%', backgroundColor: 'var(--white)'}}>{t('dashboard.postStats.geoHeader.location')}</TableCell>
                                                <TableCell align="right" sx={{width: '25%', backgroundColor: 'var(--white)'}}>{t('dashboard.postStats.geoHeader.total')}</TableCell>
                                                <TableCell align="right" sx={{width: '15%', backgroundColor: 'var(--white)'}}>{t('dashboard.postStats.geoHeader.actions')}</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {currentVisibleData.sort((a, b) => b.total - a.total).map((item, index) => (
                                                <TableRow 
                                                    key={index} 
                                                    hover 
                                                    onClick={() => handleItemClick(item)} 
                                                    sx={{cursor: 'pointer'}}
                                                >
                                                    <TableCell sx={{overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                                                        <Stack direction="row" spacing={1} alignItems="center">
                                                            <Place fontSize="small" sx={{color: STANDARD_COLOR, minWidth: '16px'}}/>
                                                            <Typography variant="caption" noWrap>{item.name}</Typography>
                                                        </Stack>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Typography variant="caption" fontWeight="bold">{item.total.toLocaleString()}</Typography>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <MuiButton size="small" 
                                                            onClick={(e) => { 
                                                                e.stopPropagation(); 
                                                                handleItemClick(item); 
                                                            }}
                                                            disabled={item.type === 'city'} 
                                                        >
                                                            {item.type === 'city' ? t('common.view') : t('common.drilldown')}
                                                        </MuiButton>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Box>
                        </Box>
                    </Box>
                )}
            </Paper>
        </Box>
    );
};

export default GeoDistributionChart;