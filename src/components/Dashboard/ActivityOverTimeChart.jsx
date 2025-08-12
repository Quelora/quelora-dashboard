// ./components/Dashboard/ActivityOverTimeChart.jsx
import { Box, Paper, Typography, Stack, Tooltip } from '@mui/material';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { 
  NightsStay as NightIcon,
  WbSunny as MorningIcon,
  Brightness5 as AfternoonIcon,
  Brightness4 as EveningIcon
} from '@mui/icons-material';

const ActivityOverTimeChart = ({ chartData, timeBreakdown, dateRange, colors, t }) => {
  const timeIcons = {
    earlymorning: <NightIcon fontSize="small" />,
    morning: <MorningIcon fontSize="small" />,
    afternoon: <AfternoonIcon fontSize="small" />,
    evening: <EveningIcon fontSize="small" />
  };

  const getXAxisFormat = () => {
    if (!dateRange.dateFrom || !dateRange.dateTo) return 'hour';
    const daysDiff = (dateRange.dateTo - dateRange.dateFrom) / (1000 * 60 * 60 * 24);
    
    if (daysDiff <= 1) return 'hour';
    if (daysDiff <= 2) return 'hourWithDay';
    return 'day';
  };

  const xAxisFormat = getXAxisFormat();

  return (
    <Box
      sx={{
        flex: '1 1 calc(33.333% - 24px)',
        minWidth: 300,
        backgroundColor: 'var(--white)'
      }}
    >
      <Paper elevation={0} sx={{
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        border: '1px solid #dadce0',
        backgroundColor: 'var(--white)',
        borderRadius: '8px',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
      }}>
        <Typography variant="subtitle1" fontWeight={500} gutterBottom>
          {t('dashboard.statistics.likes_shares')}
        </Typography>
        <Box sx={{
          flex: 1,
          minHeight: 300,
          width: '100%',
          position: 'relative'
        }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => {
                  if (xAxisFormat === 'hour') return value;
                  if (xAxisFormat === 'hourWithDay') return value;
                  if (xAxisFormat === 'day') return value.split('-').slice(1).join('-');
                  return value;
                }}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <RechartsTooltip
                contentStyle={{
                  fontSize: '12px',
                  padding: '8px',
                  borderRadius: '4px',
                  border: 'none',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                }}
                formatter={(value, name, props) => {
                  const dateStr = props.payload.fullDate || props.payload.hour;
                  return [`${value}`, `${name} on ${dateStr}`];
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="likes"
                stroke={colors.likes}
                fill={colors.likes}
                fillOpacity={0.1}
                strokeWidth={2}
                name="Likes"
              />
              <Area
                type="monotone"
                dataKey="shares"
                stroke={colors.shares}
                fill={colors.shares}
                fillOpacity={0.1}
                strokeWidth={2}
                name="Shares"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            {t('dashboard.statistics.time_breakdown')}
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="space-between">
            {Object.entries(timeBreakdown).map(([period, data]) => (
              <Tooltip
                key={period}
                title={
                  <>
                    <Typography variant="caption" display="block">
                      {t(`dashboard.statistics.${period}`)}
                    </Typography>
                    <Typography variant="caption" display="block">
                      {t('dashboard.statistics.likes')}: {data.likes}%
                    </Typography>
                    <Typography variant="caption" display="block">
                      {t('dashboard.statistics.shares')}: {data.shares}%
                    </Typography>
                  </>
                }
                arrow
              >
                <Box sx={{ textAlign: 'center' }}>
                  {timeIcons[period]}
                  <Typography variant="caption" display="block" color="text.secondary">
                    {data.likes}%
                  </Typography>
                </Box>
              </Tooltip>
            ))}
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
};

export default ActivityOverTimeChart;