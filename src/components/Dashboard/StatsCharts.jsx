// /src/components/Dashboard/StatsCharts.jsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, 
  Typography, 
  Paper, 
  Grid 
} from '@mui/material';
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

const StatsCharts = ({ stats, geoData, onDateRangeChange }) => {
  const { t } = useTranslation();
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [chartData, setChartData] = useState([]);
  const [dateRange, setDateRange] = useState({ dateFrom: null, dateTo: null });
  const [timeBreakdown, setTimeBreakdown] = useState({});
  const [processedGeoData, setProcessedGeoData] = useState([]);

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
            name: key,
            city: item.city,
            region: item.region,
            country: item.country,
            countryCode: item.countryCode,
            regionCode: item.regionCode,
            latitude: item.latitude,
            longitude: item.longitude,
            likes: 0,
            comments: 0,
            shares: 0,
            replies: 0,
            total: 0
          };
        }
        cityMap[key][item.action] += item.total;
        cityMap[key].total += item.total;
      });

      const processed = Object.values(cityMap).map(item => {
        // Usar los datos disponibles directamente del item si existen
        const countryCode = item.countryCode || countryNameToCode[item.country] || item.country;
        const hasCoordinates = item.latitude && item.longitude;

        // Si ya tenemos coordenadas, usarlas directamente
        if (hasCoordinates) {
          return {
            ...item,
            lat: item.latitude,
            lng: item.longitude,
            exactMatch: true
          };
        }

        // Si no hay coordenadas, buscar en cities.json
        let matches = cities.filter(city => {
          const cityMatches = normalizeString(city.name) === normalizeString(item.city);
          const countryMatches = normalizeString(city.country) === normalizeString(countryCode);
          return cityMatches && countryMatches;
        });

        // Si no hay resultados, relajar el filtro (solo ciudad + país)
        if (matches.length === 0) {
          matches = cities.filter(city => 
            normalizeString(city.name) === normalizeString(item.city) &&
            normalizeString(city.country) === normalizeString(countryCode)
          );
        }

        const cityInfo = matches[0] || null;

        return {
          ...item,
          lat: cityInfo ? cityInfo.lat : 0,
          lng: cityInfo ? cityInfo.lng : 0,
          exactMatch: !!cityInfo
        };
      }).filter(item => item.lat !== 0 && item.lng !== 0);

      const top10 = processed.sort((a, b) => b.total - a.total).slice(0, 10);
      setProcessedGeoData(top10);
    }
  }, [geoData]);

  // Resto del código permanece igual...
  // Process hourly stats
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
            hour,
            likes: 0,
            shares: 0,
            comments: 0,
            replies: 0,
            fullDate: dateRange.dateFrom ? 
              new Date(dateRange.dateFrom.getTime() + i * 60 * 60 * 1000).toISOString() : ''
          };
        }
        
        stats.statsByHour.forEach(hour => {
          const hourStr = hour.dateHour.split(' ')[1].substring(0, 5) + ':00';
          hourMap[hourStr] = {
            hour: hourStr,
            likes: hour.likesAdded,
            shares: hour.sharesAdded,
            comments: hour.commentsAdded,
            replies: hour.repliesAdded,
            fullDate: hour.dateHour
          };
        });
        
        formattedData = Object.values(hourMap);
      } else if (daysDiff <= 2) {
        formattedData = stats.statsByHour.map(hour => {
          const [date, time] = hour.dateHour.split(' ');
          const day = date.split('-')[2];
          const hourStr = `${day} ${time.substring(0, 5)}:00`;
          return {
            hour: hourStr,
            likes: hour.likesAdded,
            shares: hour.sharesAdded,
            comments: hour.commentsAdded,
            replies: hour.repliesAdded,
            fullDate: hour.dateHour
          };
        });
      } else {
        const dayMap = {};
        stats.statsByHour.forEach(hour => {
          const date = hour.dateHour.split(' ')[0];
          if (!dayMap[date]) {
            dayMap[date] = {
              hour: date,
              likes: 0,
              shares: 0,
              comments: 0,
              replies: 0
            };
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
    if (onDateRangeChange) {
      onDateRangeChange(dateFrom, dateTo);
    }
  };

  const colors = {
    likes: '#3a86ff',
    shares: '#8338ec',
    comments: '#06d6a0',
    replies: '#ffbe0b',
    default: '#8884d8'
  };

  return (
      <Paper className="client-paper" sx={{ width: '100%'}}>
        <Grid container sx={{ padding: '16px' }}>
          <Grid item xs={12} sx={{ width: '100%', gap: 2, display: 'flex', flexDirection: 'column' }}>
            <DateRangeSelector onDateRangeChange={handleDateRangeChange} />
            <Typography className="last-updated">
              {t('dashboard.statistics.last_updated').replace('{time}', lastUpdated.toLocaleTimeString())}
            </Typography>
            <Box sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1,
              '& > *': {
                flex: '1 1 0px',
                minWidth: { xs: 'calc(50% - 8px)', sm: 'calc(33% - 8px)', md: 'calc(20% - 8px)' }
              }
            }}>
              <StatsCard 
                title="dashboard.statistics.total_users" 
                value={stats?.totalUsers || 0} 
                icon={<UsersIcon fontSize="small" />}
                sx={{ p: 1 }}
              />
              <StatsCard 
                title="dashboard.statistics.total_posts" 
                value={stats?.totalPosts || 0} 
                icon={<PostsIcon fontSize="small" />}
                sx={{ p: 1 }}
              />
              <StatsCard 
                title="dashboard.statistics.total_comments" 
                value={stats?.totalComments || 0} 
                icon={<CommentsIcon fontSize="small" />}
                sx={{ p: 1 }}
              />
              <StatsCard 
                title="dashboard.statistics.total_likes" 
                value={stats?.totalLikes || 0} 
                icon={<LikesIcon fontSize="small" />}
                sx={{ p: 1 }}
              />
              <StatsCard 
                title="dashboard.statistics.total_shares" 
                value={stats?.totalShares || 0} 
                icon={<SharesIcon fontSize="small" />}
                sx={{ p: 1 }}
              />
            </Box>

            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 3,
                justifyContent: 'space-between'
              }}
            >
              <ActivityOverTimeChart
                chartData={chartData}
                timeBreakdown={timeBreakdown}
                dateRange={dateRange}
                colors={colors}
                t={t}
              />
              <HourlyActivityChart
                chartData={chartData}
                timeBreakdown={timeBreakdown}
                dateRange={dateRange}
                colors={colors}
                t={t}
              />
              <GeoDistributionChart
                processedGeoData={processedGeoData}
                colors={colors}
                t={t}
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>
  );
};

export default StatsCharts;