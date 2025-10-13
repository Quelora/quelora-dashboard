import { Box, Paper, Typography, Stack, IconButton, ButtonGroup, Button } from '@mui/material';
import { useState, useMemo, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ZoomInMap, Place, Fullscreen, FullscreenExit } from '@mui/icons-material';
// No necesitamos countryNameToData, ya que eliminamos los colores y factores personalizados.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});
// Colores estándar (similares a Google Analytics)
const STANDARD_COLOR = '#4285F4'; // Azul de Google
const GeoDistributionChart = ({ processedGeoData, colors, t, isMaximized, toggleMaximize }) => {
    const mapRef = useRef(null);
    const [zoom, setZoom] = useState(2); // Zoom inicial más bajo
    // CAMBIO CLAVE: currentView ahora se controla con botones, no con el zoom
    const [currentView, setCurrentView] = useState('country');
    const [highlightedItem, setHighlightedItem] = useState(null);
    const [mapReady, setMapReady] = useState(false);
    const [initialFocusDone, setInitialFocusDone] = useState(false);
// Valores Máximos y Mínimos para escalado proporcional
const maxTotal = useMemo(() => {
return processedGeoData.reduce((max, item) => Math.max(max, item.total), 0);
}, [processedGeoData]);
// Función auxiliar para escalar el radio proporcionalmente
const getRadiusScale = () => {
let baseRadius;
if (currentView === 'country') baseRadius = 500000;
else if (currentView === 'region') baseRadius = 200000;
else baseRadius = 80000;
return baseRadius;
};
// Calcula los datos agregados por PAÍS
    const countryData = useMemo(() => {
        const countryMap = {};
        processedGeoData.forEach(item => {
            const key = item.country || 'Unknown';
            
            if (!countryMap[key]) {
                countryMap[key] = {
                    name: key, country: key, lat: parseFloat(item.lat), lng: parseFloat(item.lng),
                    total: 0, likes: 0, comments: 0, shares: 0, replies: 0, type: 'country',
                    color: STANDARD_COLOR // Usa color estándar
                };
            }
            countryMap[key].total += item.total;
            countryMap[key].likes += item.likes;
            countryMap[key].comments += item.comments;
            countryMap[key].shares += item.shares;
            countryMap[key].replies += item.replies;
        });
        return Object.values(countryMap).filter(d => d.lat !== 0 && d.lng !== 0);
    }, [processedGeoData]);
    // Calcula los datos agregados por REGIÓN
    const regionData = useMemo(() => {
        const regionMap = {};
        processedGeoData.forEach(item => {
            const regionKey = item.region ? `${item.country}-${item.region}` : item.country;
            const name = item.region || item.country;
            
            if (!regionMap[regionKey]) {
                regionMap[regionKey] = {
                    name: name, country: item.country, region: item.region, lat: parseFloat(item.lat), lng: parseFloat(item.lng),
                    total: 0, likes: 0, comments: 0, shares: 0, replies: 0, cities: [], type: 'region',
color: STANDARD_COLOR // Usa color estándar
                };
            }
            regionMap[regionKey].total += item.total;
            regionMap[regionKey].likes += item.likes;
            regionMap[regionKey].comments += item.comments;
            regionMap[regionKey].shares += item.shares;
            regionMap[regionKey].replies += item.replies;
            regionMap[regionKey].cities.push(item);
        });
        return Object.values(regionMap).filter(d => d.lat !== 0 && d.lng !== 0);
    }, [processedGeoData]);
// Prepara los datos de CIUDAD (processedGeoData ya está a nivel ciudad)
const cityData = useMemo(() => {
return processedGeoData.map(city => ({
...city,
type: 'city',
color: STANDARD_COLOR // Usa color estándar
})).filter(d => d.lat !== 0 && d.lng !== 0);
}, [processedGeoData]);
// Efecto de foco inicial (simplificado)
    useEffect(() => {
        if (processedGeoData.length > 0 && !initialFocusDone && mapReady) {
            const timer = setTimeout(() => {
                const initialData = countryData.length > 0 ? countryData : processedGeoData;
if (initialData.length > 0) {
const topItem = [...initialData].sort((a, b) => b.total - a.total)[0];
focusOnItem(topItem, true); // Foco inicial sin cambiar la vista
setInitialFocusDone(true);
}
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [processedGeoData, mapReady, initialFocusDone, countryData]);
// Nueva función para cambiar la vista con el botón
const handleViewChange = (newView) => {
setCurrentView(newView);
setHighlightedItem(null);
const map = mapRef.current;
if (!map) return;
// Ajusta el mapa a una vista adecuada para el nivel
let targetCenter = [0, 0];
let targetZoom = 2;
if (newView === 'region') {
targetZoom = 4;
// Intenta centrar en la región más activa
const topRegion = [...regionData].sort((a, b) => b.total - a.total)[0];
if (topRegion) targetCenter = [topRegion.lat, topRegion.lng];
} else if (newView === 'city') {
targetZoom = 6;
// Intenta centrar en la ciudad más activa
const topCity = [...cityData].sort((a, b) => b.total - a.total)[0];
if (topCity) targetCenter = [topCity.lat, topCity.lng];
} else { // country
map.fitWorld();
}
map.flyTo(targetCenter, targetZoom, { duration: 1, easeLinearity: 0.25 });
};
// Función de foco para click en mapa o lista (simplificada, solo resalta)
    const focusOnItem = (item, isInitial = false) => {
        setHighlightedItem(item);
if (!isInitial && mapRef.current) {
const map = mapRef.current;
const targetZoom = item.type === 'country' ? 3 : (item.type === 'region' ? 5 : 9);
map.flyTo([item.lat, item.lng], targetZoom, { duration: 0.5, easeLinearity: 0.25 });
}
    };
    const MapController = () => {
        const map = useMap();
        useEffect(() => {
            mapRef.current = map;
            setMapReady(true);
// Ya no dependemos de 'zoomend' para cambiar currentView, pero la usamos para el zoom state
            const updateZoomState = () => setZoom(map.getZoom());
            map.on('zoomend', updateZoomState);
            updateZoomState();
            return () => map.off('zoomend', updateZoomState);
        }, [map]);
        return null;
    };
// CAMBIO CLAVE: Radio Proporcional al valor (no usa sizeFactor)
    const calculateRadius = (total) => {
if (maxTotal === 0) return 0;
// Escala: base + una porción de la escala máxima (raíz cuadrada para mejor distribución)
const scale = getRadiusScale();
const baseMin = currentView === 'city' ? 10000 : 50000; // Radio mínimo para visibilidad
// El radio es proporcional a la raíz cuadrada del total para evitar que los valores muy grandes dominen
const totalRatio = Math.sqrt(total) / Math.sqrt(maxTotal); 
// Ajusta el radio basado en la escala y la proporción, asegurando un mínimo.
const proportionalRadius = baseMin + (totalRatio * (scale - baseMin)); 
// Se usa el zoom para compensar ligeramente la percepción visual (más cerca, el radio debe ser más pequeño)
const zoomCompensation = Math.pow(1.1, zoom - 2); 
        return Math.max(1000, proportionalRadius / zoomCompensation); 
    };
    const getHighlightStyle = (item) => (highlightedItem === item ?
        { fillOpacity: 0.9, weight: 3, color: '#ff0000' } :
        { fillOpacity: 0.7, weight: 1, color: STANDARD_COLOR }
    );
    const getVisibleData = () => {
        switch (currentView) {
            case 'country':
                return countryData;
            case 'region':
                return regionData;
            case 'city':
                return cityData;
            default:
                return [];
        }
    };
    const currentVisibleData = getVisibleData();
    return (
        <Box sx={{ height: '100%', width: '100%', backgroundColor: 'var(--white)' }}>
            <Paper elevation={0} sx={{
                p: 2,
                display: 'flex', flexDirection: 'column', height: '100%',
                border: '1px solid #dadce0', borderRadius: '8px',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                backgroundColor: 'var(--white)', position: 'relative'
            }}>
                
<Stack direction="row" justifyContent="space-between" alignItems="center" marginBottom={2}>
  <Typography variant="subtitle1" fontWeight={500}>
                            {t('dashboard.statistics.geo_distribution')}
                        
  </Typography>
  {/* CAMBIO CLAVE: Botones de control de vista */}
  <ButtonGroup variant="contained" size="small" aria-label="Geographic View Selector">
    <Button 
      onClick={() => handleViewChange('country')} 
    variant={currentView === 'country' ? 'contained' : 'outlined'}
    sx={{ minWidth: 80 }}
    >
    {t('dashboard.statistics.country')}
    </Button>
    <Button 
      onClick={() => handleViewChange('region')} 
    variant={currentView === 'region' ? 'contained' : 'outlined'}
    sx={{ minWidth: 80 }}
    >
    {t('dashboard.statistics.region')}
    </Button>
    <Button 
      onClick={() => handleViewChange('city')} 
    variant={currentView === 'city' ? 'contained' : 'outlined'}
    sx={{ minWidth: 80 }}
    >
    {t('dashboard.statistics.city')}
    </Button>
  </ButtonGroup>
  <IconButton
                          onClick={toggleMaximize}
                          sx={{
                              position: 'absolute', top: 8, right: 8, zIndex: 1001,
                              backgroundColor: 'rgba(255, 255, 255, 0.7)',
                              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 1)' }
                          }}
                          aria-label={isMaximized ? 'minimize chart' : 'maximize chart'}
                      >
                          {isMaximized ? 
  <FullscreenExit />
  : 
  <Fullscreen />
  }
                      </IconButton>
                  
</Stack>
                <Box sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'row', 
                    overflow: 'hidden',
                    minHeight: 300,
                }}>
{/* Contenedor del Mapa (70% - o 100% si está maximizado) */}
                    <Box sx={{ 
flex: isMaximized ? 1 : '0 0 70%', 
minHeight: 300, 
borderRadius: '4px', 
overflow: 'hidden' 
}}>
                        {processedGeoData.length === 0 ? (
                            
<Typography>No hay datos geográficos disponibles</Typography>
                        ) : (
                            <MapContainer center={[0, 0]} zoom={2} minZoom={2} maxZoom={14} style={{ height: '100%', width: '100%' }} whenCreated={(map) => { mapRef.current = map; setMapReady(true); map.fitWorld(); }} worldCopyJump={true}>
                                
<TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' noWrap={false} />
                                
<MapController />
                                
{/* Renderiza los datos visibles actualmente */}
{currentVisibleData.map((item, index) => {
const style = getHighlightStyle(item);
const name = item.type === 'city' ? `${item.city}, ${item.region}` : item.name;
const popupContent = `${name} - Total: ${item.total}`;
return (
<Circle 
key={`${item.type}-${index}`} 
center={[parseFloat(item.lat), parseFloat(item.lng)]} 
// Calcula radio solo basado en el total
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
                        )}
                    </Box>
{/* Contenedor de la Lista (30%) */}
                    <Box sx={{
                        mt: 0,
                        ml: 2, 
                        width: isMaximized ? 320 : '30%', 
                        flexShrink: 0,
                        height: '100%',
                        overflowY: 'auto'
                    }}>
                        
<Typography variant="subtitle2" gutterBottom>
                              {t(`dashboard.statistics.top_${currentView}s`)}
                          
</Typography>
                        
<Stack direction="column" spacing={1}>
  {currentVisibleData.sort((a, b) => b.total - a.total).slice(0, 10).map((item, index) => (
                                  <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, borderRadius: 1, bgcolor: highlightedItem === item ? 'action.selected' : 'background.paper', '&:hover': { bgcolor: 'action.hover', cursor: 'pointer' } }} onClick={() => focusOnItem(item)}>
                                      <Box sx={{ display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
                                          <Place fontSize="small" sx={{ mr: 1, color: STANDARD_COLOR, flexShrink: 0 }} />
                                          
  <Typography noWrap variant="caption">{item.type === 'city' ? `${item.city}, ${item.region}` : item.name}</Typography>
                                      </Box>
                                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                          <Typography variant="caption" fontWeight="bold" sx={{ mr: 1 }}>{item.total}</Typography>
                                          
  <IconButton size="small" onClick={(e) =>
    { e.stopPropagation(); focusOnItem(item); }}>
    <ZoomInMap fontSize="small" />
  </IconButton>
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