import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography, Paper, Grid } from '@mui/material';
import {
    People as UsersIcon,
    Article as PostsIcon,
    Comment as CommentsIcon,
    ThumbUp as LikesIcon,
    Share as SharesIcon,
} from '@mui/icons-material';
import StatsCard from './StatsCard';
import DateRangeSelector from '../Common/DateRangeSelector';
import ActivityOverTimeChart from './ActivityOverTimeChart';
import HourlyActivityChart from './HourlyActivityChart';
import GeoDistributionChart from './GeoDistributionChart';
import '../../assets/css/Chart.css';
import cities from 'cities.json';
import countryNameToCode from './countryCodes';

const StatsCharts = ({ stats, geoData, onDateRangeChange, onGeoActionChange }) => {
    const { t } = useTranslation();
    const [lastUpdated, setLastUpdated] = useState(new Date());
    const [chartData, setChartData] = useState([]);
    const [dateRange, setDateRange] = useState({ dateFrom: null, dateTo: null });
    const [timeBreakdown, setTimeBreakdown] = useState({});
    const [processedGeoData, setProcessedGeoData] = useState([]);
    const [isGeoChartMaximized, setIsGeoChartMaximized] = useState(false);
    const [geoAction, setGeoAction] = useState('comment'); // 'comment' por defecto

    const toggleGeoChartMaximize = () => {
        setIsGeoChartMaximized(prevState => !prevState);
        setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
        }, 150);
    };

    const handleGeoActionChange = (newAction) => {
        setGeoAction(newAction);
        if (onGeoActionChange) {
            onGeoActionChange(dateRange.dateFrom, dateRange.dateTo, newAction);
        }
    };

    const normalizeString = (str) => {
        if (!str) return '';
        return str
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim()
            .replace(/^(provincia de |province of )/i, '')
            .replace(/\s+/g, ' ');
    };

    // Process geographic data
    useEffect(() => {
        if (geoData?.data) {
            const cityMap = {};
            geoData.data.forEach(item => {
                const key = `${item.city}, ${item.region}, ${item.country}`;
                if (!cityMap[key]) {
                    cityMap[key] = {
                        name: key, city: item.city, region: item.region, country: item.country,
                        countryCode: item.countryCode, regionCode: item.regionCode, latitude: item.latitude,
                        longitude: item.longitude, like: 0, comment: 0, share: 0, reply: 0, hit: 0, total: 0
                    };
                }
                // Mapear el total de la acción a la clave de acción y al total general (aunque el total general no se usa actualmente)
                // Se usa 'item.action' tal cual viene del backend (ej: 'like', 'comment', 'hit')
                cityMap[key][item.action] += item.total;
                cityMap[key].total += item.total; 
            });

            // Filtrar y recalcular el 'total' basado en la geoAction seleccionada para la visualización
            const processed = Object.values(cityMap).map(item => {
                const countryCode = item.countryCode || countryNameToCode[item.country] || item.country;
                const hasCoordinates = item.latitude && item.longitude;
                
                // El total para la visualización en el mapa debe ser el total de la acción seleccionada
                const visualTotal = item[geoAction] || 0; 

                if (hasCoordinates) return { 
                    ...item, 
                    total: visualTotal, 
                    lat: item.latitude, 
                    lng: item.longitude, 
                    exactMatch: true 
                };
                
                let matches = cities.filter(city =>
                    normalizeString(city.name) === normalizeString(item.city) &&
                    normalizeString(city.country) === normalizeString(countryCode)
                );
                
                if (matches.length === 0) {
                    matches = cities.filter(city =>
                        normalizeString(city.name) === normalizeString(item.city) &&
                        normalizeString(city.country) === normalizeString(countryCode)
                    );
                }
                
                const cityInfo = matches[0] || null;
                return { 
                    ...item, 
                    total: visualTotal, // Usar el total filtrado
                    lat: cityInfo ? cityInfo.lat : 0, 
                    lng: cityInfo ? cityInfo.lng : 0, 
                    exactMatch: !!cityInfo 
                };
            }).filter(item => item.lat !== 0 && item.lng !== 0 && item.total > 0); 
            
            const top10 = processed.sort((a, b) => b.total - a.total);
            setProcessedGeoData(top10);
        }
    }, [geoData, geoAction]); // Depende de geoAction para re-procesar los datos
    
    // Process hourly stats (código sin cambios)
    useEffect(() => {
        if (stats?.statsByHour) {
            const daysDiff = dateRange.dateFrom && dateRange.dateTo ?
                (dateRange.dateTo - dateRange.dateFrom) / (1000 * 60 * 60 * 24) : 0;
            let formattedData = [];
            if (daysDiff <= 1) {
                const hourMap = {};
                for (let i = 0; i < 24; i++) {
                    const hour = i.toString().padStart(2, '0') + ':00';
                    hourMap[hour] = {
                        hour, likes: 0, shares: 0, comments: 0, replies: 0,
                        fullDate: dateRange.dateFrom ?
                            new Date(dateRange.dateFrom.getTime() + i * 60 * 60 * 1000).toISOString() : ''
                    };
                }
                stats.statsByHour.forEach(hour => {
                    const hourStr = hour.dateHour.split(' ')[1].substring(0, 5) + ':00';
                    hourMap[hourStr] = {
                        hour: hourStr, likes: hour.likesAdded, shares: hour.sharesAdded,
                        comments: hour.commentsAdded, replies: hour.repliesAdded, fullDate: hour.dateHour
                    };
                });
                formattedData = Object.values(hourMap);
            } else if (daysDiff <= 2) {
                formattedData = stats.statsByHour.map(hour => {
                    const [date, time] = hour.dateHour.split(' ');
                    const day = date.split('-')[2];
                    const hourStr = `${day} ${time.substring(0, 5)}:00`;
                    return {
                        hour: hourStr, likes: hour.likesAdded, shares: hour.sharesAdded,
                        comments: hour.commentsAdded, replies: hour.repliesAdded, fullDate: hour.dateHour
                    };
                });
            } else {
                const dayMap = {};
                stats.statsByHour.forEach(hour => {
                    const date = hour.dateHour.split(' ')[0];
                    if (!dayMap[date]) {
                        dayMap[date] = { hour: date, likes: 0, shares: 0, comments: 0, replies: 0 };
                    }
                    dayMap[date].likes += hour.likesAdded;
                    dayMap[date].shares += hour.sharesAdded;
                    dayMap[date].comments += hour.commentsAdded;
                    dayMap[date].replies += hour.repliesAdded;
                });
                formattedData = Object.values(dayMap);
            }
            const breakdown = {
                earlymorning: { likes: 0, shares: 0, comments: 0, replies: 0, hours: 0 },
                morning: { likes: 0, shares: 0, comments: 0, replies: 0, hours: 0 },
                afternoon: { likes: 0, shares: 0, comments: 0, replies: 0, hours: 0 },
                evening: { likes: 0, shares: 0, comments: 0, replies: 0, hours: 0 }
            };
            formattedData.forEach(data => {
                const hour = parseInt(data.hour.split(':')[0]);
                let period;
                if (hour >= 0 && hour < 6) period = 'earlymorning';
                else if (hour >= 6 && hour < 12) period = 'morning';
                else if (hour >= 12 && hour < 18) period = 'afternoon';
                else period = 'evening';
                breakdown[period].likes += data.likes;
                breakdown[period].shares += data.shares;
                breakdown[period].comments += data.comments;
                breakdown[period].replies += data.replies;
                breakdown[period].hours += 1;
            });
            const total = {
                likes: formattedData.reduce((sum, data) => sum + data.likes, 0),
                shares: formattedData.reduce((sum, data) => sum + data.shares, 0),
                comments: formattedData.reduce((sum, data) => sum + data.comments, 0),
                replies: formattedData.reduce((sum, data) => sum + data.replies, 0)
            };
            Object.keys(breakdown).forEach(period => {
                breakdown[period].likes = total.likes ? ((breakdown[period].likes / total.likes) * 100).toFixed(1) : 0;
                breakdown[period].shares = total.shares ? ((breakdown[period].shares / total.shares) * 100).toFixed(1) : 0;
                breakdown[period].comments = total.comments ? ((breakdown[period].comments / total.comments) * 100).toFixed(1) : 0;
                breakdown[period].replies = total.replies ? ((breakdown[period].replies / total.replies) * 100).toFixed(1) : 0;
            });
            setTimeBreakdown(breakdown);
            setChartData(formattedData);
            setLastUpdated(new Date());
        }
    }, [stats, dateRange]);

    const handleDateRangeChange = (dateFrom, dateTo) => {
        setDateRange({ dateFrom, dateTo });
        if (onDateRangeChange) onDateRangeChange(dateFrom, dateTo);
        // Cuando cambia el rango de fechas, también se debe disparar la recarga de geoData
        if (onGeoActionChange) onGeoActionChange(dateFrom, dateTo, geoAction); 
    };

    const colors = { likes: '#3a86ff', shares: '#8338ec', comments: '#06d6a0', replies: '#ffbe0b', default: '#8884d8' };
    
    return (
        <Paper className="client-paper" sx={{ width: '100%', position: 'relative' }}>
            <Grid container sx={{ padding: '16px' }}>
                <Grid item xs={12} sx={{ width: '100%', gap: 2, display: 'flex', flexDirection: 'column' }}>
                    
                    <DateRangeSelector onDateRangeChange={handleDateRangeChange} />
                    
                    <Typography className="last-updated">
                        {t('dashboard.statistics.last_updated').replace('{time}', lastUpdated.toLocaleTimeString())}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, '& > *': { flex: '1 1 0px', minWidth: { xs: 'calc(50% - 8px)', sm: 'calc(33% - 8px)', md: 'calc(20% - 8px)' } } }}>
                        <StatsCard title="dashboard.statistics.total_users" value={stats?.totalUsers || 0} icon={<UsersIcon fontSize="small" />} sx={{ p: 1 }} />
                        <StatsCard title="dashboard.statistics.total_posts" value={stats?.totalPosts || 0} icon={<PostsIcon fontSize="small" />} sx={{ p: 1 }} />
                        <StatsCard title="dashboard.statistics.total_comments" value={stats?.totalComments || 0} icon={<CommentsIcon fontSize="small" />} sx={{ p: 1 }} />
                        <StatsCard title="dashboard.statistics.total_likes" value={stats?.totalLikes || 0} icon={<LikesIcon fontSize="small" />} sx={{ p: 1 }} />
                        <StatsCard title="dashboard.statistics.total_shares" value={stats?.totalShares || 0} icon={<SharesIcon fontSize="small" />} sx={{ p: 1 }} />
                    </Box>

                    <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
                        <Box sx={{ display: isGeoChartMaximized ? 'none' : 'flex', flex: 1, minWidth: 300 }}>
                            <ActivityOverTimeChart chartData={chartData} timeBreakdown={timeBreakdown} dateRange={dateRange} colors={colors} t={t} />
                        </Box>
                        <Box sx={{ display: isGeoChartMaximized ? 'none' : 'flex', flex: 1, minWidth: 300 }}>
                            <HourlyActivityChart chartData={chartData} timeBreakdown={timeBreakdown} dateRange={dateRange} colors={colors} t={t} />
                        </Box>
                    </Box>

                    <Box sx={{ width: '100%', display: isGeoChartMaximized ? 'none' : 'block' }}>
                        <GeoDistributionChart
                            processedGeoData={processedGeoData}
                            colors={colors}
                            t={t}
                            isMaximized={isGeoChartMaximized}
                            toggleMaximize={toggleGeoChartMaximize}
                            currentAction={geoAction} // Pasar el estado
                            onActionChange={handleGeoActionChange} // Pasar el handler
                        />
                    </Box>
                </Grid>
            </Grid>

            {isGeoChartMaximized && (
                <Box sx={{
                    position: 'absolute',
                    top: 0, left: 0,
                    width: '100%',
                    height: '720px',
                    zIndex: 1200,
                }}>
                    <GeoDistributionChart
                        processedGeoData={processedGeoData}
                        colors={colors}
                        t={t}
                        isMaximized={true}
                        toggleMaximize={toggleGeoChartMaximize}
                        currentAction={geoAction} // Pasar el estado
                        onActionChange={handleGeoActionChange} // Pasar el handler
                    />
                </Box>
            )}
        </Paper>
    );
};
export default StatsCharts;