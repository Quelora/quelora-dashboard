/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

import { Box, Paper, Typography, Stack, ButtonGroup, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Popup, Circle, useMap, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Place } from '@mui/icons-material';
import countryNameToCode from './countryCodes'; 

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: '/images/map/marker-icon-2x.png',
    iconUrl: '/images/map/marker-icon.png',
    shadowUrl: '/images/map/marker-shadow.png',
});

const STANDARD_COLOR = '#3367D6';
const GEOJSON_URL = '/data/countries.geo.json';

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
                name: `${item.city || item.region || 'N/A'}, ${item.country}`,
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
            sumProps.forEach(prop => {regionMap[regionKey][prop] = (regionMap[regionKey][prop] || 0) + (item[prop] || 0);});
            
            if (!countryMap[countryKey]) {
                countryMap[countryKey] = {
                    name: item.country, country: item.country, 
                    lat: lat, lng: lng,
                    total: 0, likes: 0, comments: 0, shares: 0, replies: 0, type: 'country'
                };
            }
            sumProps.forEach(prop => {countryMap[countryKey][prop] = (countryMap[countryKey][prop] || 0) + (item[prop] || 0);});
        });

        const filterValid = d => d.total > 0 && d.lat !== 0 && d.lng !== 0;
        
        return {
            countryData: Object.values(countryMap).filter(filterValid),
            regionData: Object.values(regionMap).filter(filterValid),
            cityData: cityData.filter(filterValid)
        };
    }, [rawGeoData]);
};

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
                    const mapKey = item.uniqueMapKey || `bubble-${item.name}-${item.lat}`;
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

const PostGeoView = ({ aggregatedGeoData, loading }) => {
    const { t } = useTranslation();
    const mapRef = useRef(null);
    
    const [currentView, setCurrentView] = useState('country');
    const [selectedCountry, setSelectedCountry] = useState(null);
    const [selectedRegion, setSelectedRegion] = useState(null);
    const [highlightedItem, setHighlightedItem] = useState(null);
    const [mapReady, setMapReady] = useState(false);
    const [initialFocusDone, setInitialFocusDone] = useState(false);
    const [worldGeoJson, setWorldGeoJson] = useState(null);

    useEffect(() => {
        fetch(GEOJSON_URL)
            .then(res => res.json())
            .then(data => setWorldGeoJson(data))
            .catch(err => console.error("Error cargando mapa:", err));
    }, []);

    const {countryData, regionData, cityData} = useGeoDataAggregator(aggregatedGeoData);
    
    const getVisibleData = (view = currentView, country = selectedCountry, region = selectedRegion) => {
        switch (view) {
            case 'country': return countryData;
            case 'region': return country ? regionData.filter(d => d.country === country) : regionData; 
            case 'city':
                if (region && country) return cityData.filter(d => d.country === country && d.region === region);
                if (country) return cityData.filter(d => d.country === country);
                return cityData;
            default: return [];
        }
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

        if (latLngs.length > 0) {
            try {
                const bounds = L.latLngBounds(latLngs);
                map.flyToBounds(bounds, {padding: [50, 50], maxZoom: 10, duration: 1});
            } catch (e) {}
        }
    }, [mapRef, selectedCountry, selectedRegion]); 
    
    const MapController = () => {
        const map = useMap();
        
        useEffect(() => {
            mapRef.current = map;
            setMapReady(true);
            
            if (!initialFocusDone) {
                const initialData = countryData; 
                if (initialData.length > 0) {
                   adjustMapBounds(initialData);
                } else {
                    map.flyTo([20, 0], 2, {duration: 0.8});
                }
                setInitialFocusDone(true);
            }
        }, [map]); 
        
        useEffect(() => {
            if (!mapReady || !initialFocusDone) return; 
            if (currentView !== 'country' || selectedCountry) {
                const dataToFocus = getVisibleData(currentView, selectedCountry, selectedRegion);
                adjustMapBounds(dataToFocus);
            }
        }, [mapReady, currentView, selectedCountry, selectedRegion, adjustMapBounds, initialFocusDone]); 

        return null;
    };
    
    const handleItemClick = (item) => {
        setHighlightedItem(item); 
        
        if (item.type === 'country') {
            setCurrentView('region');
            setSelectedCountry(item.country);
            setSelectedRegion(null); 
            if (mapRef.current) mapRef.current.flyTo([item.lat, item.lng], 5, {duration: 1});
        } else if (item.type === 'region') {
            setCurrentView('city');
            setSelectedCountry(item.country); 
            setSelectedRegion(item.region);
            if (mapRef.current) mapRef.current.flyTo([item.lat, item.lng], 8, {duration: 1});
        } else if (item.type === 'city') {
             if (mapRef.current) mapRef.current.flyTo([item.lat, item.lng], 10, {duration: 1});
        }
    };

    const handleViewChange = (newView) => {
        setHighlightedItem(null);
        let nextCountry = selectedCountry;
        let nextRegion = selectedRegion;

        if (newView === 'country') {
            nextCountry = null;
            nextRegion = null;
            if (mapRef.current) mapRef.current.flyTo([20, 0], 2, {duration: 1});
        } else if (newView === 'region') {
            nextRegion = null;
        } 
        
        setCurrentView(newView);
        setSelectedCountry(nextCountry);
        setSelectedRegion(nextRegion);
    };

    const calculateRadius = (total) => {
        if (maxTotal === 0) return 0;
        const scale = currentView === 'country' ? 500000 : (currentView === 'region' ? 200000 : 8000); 
        const baseMin = currentView === 'city' ? 500 : 50000;
        const totalRatio = Math.sqrt(total) / Math.sqrt(maxTotal);
        const proportionalRadius = baseMin + (totalRatio * (scale - baseMin)); 
        return Math.max(1000, proportionalRadius); 
    };

    if (aggregatedGeoData.length === 0) {
         return (
             <Box sx={{height: 600, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
                 <Typography variant="body1">{t('dashboard.postStats.noGeoData')}</Typography>
             </Box>
         );
    }

    return (
        <Paper elevation={0} sx={{p: 2, border: '1px solid #dadce0', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)', height: '600px', position: 'relative'}}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" marginBottom={2}>
                <Typography variant="h6" fontWeight={500}>
                    {t('dashboard.postStats.geoMapTitle')}
                </Typography>
                
                <Box sx={{display: 'flex', alignItems: 'center', mx: 2, flexGrow: 1, justifyContent: 'center'}}>
                    <Typography variant="caption" sx={{mr: 1, fontWeight: 'bold'}}>Vista: {t(`dashboard.statistics.${currentView}`)}</Typography>
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
                
                <ButtonGroup variant="contained" size="small" aria-label="Geographic View Selector">
                    <Button onClick={() => handleViewChange('country')} variant={currentView === 'country' ? 'contained' : 'outlined'} sx={{minWidth: 80}}>
                        {t('dashboard.statistics.country')}
                    </Button>
                    <Button onClick={() => handleViewChange('region')} variant={currentView === 'region' ? 'contained' : 'outlined'} sx={{minWidth: 80}}>
                        {t('dashboard.statistics.region')}
                    </Button>
                    <Button onClick={() => handleViewChange('city')} variant={currentView === 'city' ? 'contained' : 'outlined'} sx={{minWidth: 80}}>
                        {t('dashboard.statistics.city')}
                    </Button>
                </ButtonGroup>
            </Stack>
            
            <Box sx={{display: 'flex', height: 'calc(100% - 60px)'}}>
                <Box sx={{flex: '0 0 70%', minHeight: '100%', borderRadius: '4px', overflow: 'hidden', backgroundColor: '#f8f9fa'}}>
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
                
                <Box sx={{flex: '0 0 30%', ml: 2, minWidth: 200, display: 'flex', flexDirection: 'column', height: '100%'}}>
                    <Typography variant="subtitle2" gutterBottom>
                        {t(`dashboard.postStats.top_${currentView}s`)} ({currentVisibleData.length} {t('common.items')})
                    </Typography>
                    <TableContainer component={Box} sx={{ overflowY: 'auto', flexGrow: 1 }}>
                        <Table size="small" stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{width: '60%', backgroundColor: 'var(--white)'}}>{t('dashboard.postStats.geoHeader.location')}</TableCell>
                                    <TableCell align="right" sx={{width: '25%', backgroundColor: 'var(--white)'}}>{t('dashboard.postStats.geoHeader.total')}</TableCell>
                                    <TableCell align="right" sx={{width: '15%', backgroundColor: 'var(--white)'}}>{t('dashboard.postStats.geoHeader.actions')}</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {currentVisibleData.sort((a, b) => b.total - a.total).slice(0, 15).map((item, index) => (
                                    <TableRow 
                                        key={index} 
                                        hover 
                                        onClick={() => handleItemClick(item)} 
                                        selected={highlightedItem && highlightedItem.name === item.name && highlightedItem.type === item.type}
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