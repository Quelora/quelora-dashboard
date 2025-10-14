import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Paper, Typography, Tooltip, Stack, CircularProgress, ButtonGroup, Button } from '@mui/material';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    Legend
} from 'recharts';
import {
    NightsStay as NightsStayIcon,
    WbSunny as WbSunnyIcon,
    Brightness5 as Brightness5Icon,
    Brightness4 as Brightness4Icon
} from '@mui/icons-material';

const calculateTimeBreakdown = (statsByHour, metricKey = 'total') => {
    const breakdown = {
        earlymorning: { total: 0, hours: 0 },
        morning: { total: 0, hours: 0 },
        afternoon: { total: 0, hours: 0 },
        evening: { total: 0, hours: 0 }
    };
    const total = { total: 0 };

    if (!Array.isArray(statsByHour)) return { breakdown, total };
    
    // Función auxiliar para obtener el valor de la métrica
    const getMetricValue = (data) => {
        if (metricKey === 'total') {
            return (data.likesAdded || 0) + (data.commentsAdded || 0) + (data.repliesAdded || 0) + (data.sharesAdded || 0);
        }
        // Se mapea la métrica seleccionada a la clave del dato (ej. 'likes' -> 'likesAdded')
        const key = `${metricKey}Added`;
        return data[key] || 0;
    };


    statsByHour.forEach(data => {
        const hour = parseInt((data.dateHour || '').split(' ')[1], 10);
        let period;
        if (!Number.isFinite(hour)) {
            period = 'morning';
        } else if (hour >= 0 && hour < 6) period = 'earlymorning';
        else if (hour >= 6 && hour < 12) period = 'morning';
        else if (hour >= 12 && hour < 18) period = 'afternoon';
        else period = 'evening';

        const interactionValue = getMetricValue(data);

        breakdown[period].total += interactionValue;
        breakdown[period].hours += 1;
        total.total += interactionValue;
    });

    Object.keys(breakdown).forEach(period => {
        breakdown[period].percent = total.total ? ((breakdown[period].total / total.total) * 100).toFixed(1) : 0;
    });

    return { breakdown, total };
};

const DUMMY_DATA = [
    { hour: '2024-01-01 00', dummy: 10, likesAdded: 10, commentsAdded: 2, repliesAdded: 1, sharesAdded: 0 },
    { hour: '2024-01-01 06', dummy: 20, likesAdded: 20, commentsAdded: 5, repliesAdded: 3, sharesAdded: 1 },
    { hour: '2024-01-01 12', dummy: 15, likesAdded: 15, commentsAdded: 3, repliesAdded: 2, sharesAdded: 0 },
    { hour: '2024-01-01 18', dummy: 30, likesAdded: 30, commentsAdded: 8, repliesAdded: 5, sharesAdded: 2 },
    { hour: '2024-01-01 23', dummy: 25, likesAdded: 25, commentsAdded: 4, repliesAdded: 4, sharesAdded: 1 }
];

const PostTimeChart = ({ analyzedPostsData = {}, postTitlesMap = {}, colors = ['#1976d2', '#9c27b0', '#ff9800'], loading = false, dateRange, chartMetric, onMetricChange }) => {
    const { t } = useTranslation();

    const containerRef = useRef(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 350 });
    
    // 🆕 Lista de métricas disponibles para el selector
    const metrics = [
        { key: 'total', label: t('dashboard.postStats.metric.total') },
        { key: 'likes', label: t('dashboard.statistics.likes') },
        { key: 'comments', label: t('dashboard.statistics.comments') },
        { key: 'replies', label: t('dashboard.statistics.replies') },
        { key: 'shares', label: t('dashboard.statistics.shares') },
        // No se incluye views, ya que views no está en postStatsByHour
    ];

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        if (typeof ResizeObserver === 'undefined') {
            const rect = el.getBoundingClientRect();
            setDimensions({ width: Math.floor(rect.width) || 1000, height: Math.max(Math.floor(rect.height), 350) });
            return;
        }

        const ro = new ResizeObserver(entries => {
            for (const entry of entries) {
                const cr = entry.contentRect;
                const w = Math.floor(cr.width);
                const h = Math.floor(cr.height);
                setDimensions(prev => {
                    const newW = w || prev.width || 1000;
                    const newH = (h && h >= 120) ? h : Math.max(prev.height, 350);
                    return { width: newW, height: newH };
                });
            }
        });

        ro.observe(el);

        const rect = el.getBoundingClientRect();

        setDimensions({ width: Math.floor(rect.width) || 1000, height: Math.max(Math.floor(rect.height), 350) });

        return () => ro.disconnect();
    }, [containerRef]);

    const combinedData = useMemo(() => {
        const hourMap = {};
        let hasRealData = false;
        
        // Clave en el objeto postStatsByHour
        const metricDataKey = chartMetric === 'total' ? null : `${chartMetric}Added`;

        Object.entries(analyzedPostsData).forEach(([entityId, postData]) => {
            const hourlyStats = postData?.postStatsByHour;
            if (!postData || !Array.isArray(hourlyStats) || hourlyStats.length === 0) {
                return;
            }
            hasRealData = true;
            const seriesName = postTitlesMap[entityId] || entityId;

            hourlyStats.forEach(stat => {
                const dateHour = stat.dateHour;
                if (!hourMap[dateHour]) {
                    const [datePart, hourPart] = dateHour.split(' ');
                    const date = new Date(datePart);
                    const dayLabel = date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
                    hourMap[dateHour] = { 
                        key: dateHour, 
                        label: `${dayLabel} ${hourPart}h`,
                        date: datePart,
                        hour: hourPart
                    };
                }
                
                let value;
                if (chartMetric === 'total') {
                    value = (stat.likesAdded || 0) + (stat.commentsAdded || 0) + (stat.repliesAdded || 0) + (stat.sharesAdded || 0);
                } else {
                    value = stat[metricDataKey] || 0;
                }
                
                hourMap[dateHour][entityId] = Number((hourMap[dateHour][entityId] || 0) + value);
                hourMap[dateHour][`${entityId}_title`] = seriesName;
            });
        });

        let data = Object.values(hourMap).sort((a, b) => a.key.localeCompare(b.key));

        if (!hasRealData && Object.keys(analyzedPostsData).length > 0) {
            const dummyEntityId = 'dummy-test-id';
            const dummyMap = {};
            
            // Función para obtener el valor de la métrica del DUMMY_DATA
            const getDummyMetricValue = (stat) => {
                if (chartMetric === 'total') {
                    return (stat.likesAdded || 0) + (stat.commentsAdded || 0) + (stat.repliesAdded || 0) + (stat.sharesAdded || 0);
                }
                const key = `${chartMetric}Added`;
                return stat[key] || 0;
            };

            DUMMY_DATA.forEach(stat => {
                const dateKey = stat.hour;
                const [datePart, hourPart] = dateKey.split(' ');
                const date = new Date(datePart);
                const dayLabel = date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
                dummyMap[dateKey] = {
                    key: dateKey,
                    label: `${dayLabel} ${hourPart}h`,
                    date: datePart,
                    hour: hourPart,
                    [dummyEntityId]: Number(getDummyMetricValue(stat)),
                    [`${dummyEntityId}_title`]: t('dashboard.postStats.simulationData')
                };
            });
            data = Object.values(dummyMap);
        } else if (data.length === 1) {
            const singlePoint = { ...data[0] };
            singlePoint.key = singlePoint.key + ' ';
            singlePoint.label = singlePoint.label + ' ';
            data = [...data, singlePoint];
        }

        return data;
    }, [analyzedPostsData, postTitlesMap, colors, t, chartMetric]); // 🆕 Dependencia de chartMetric

    // 🆕 Se pasa chartMetric a calculateTimeBreakdown
    const allHourlyStats = useMemo(() => Object.values(analyzedPostsData).flatMap(data => data.postStatsByHour || []), [analyzedPostsData]);
    const { breakdown } = useMemo(() => calculateTimeBreakdown(allHourlyStats, chartMetric), [allHourlyStats, chartMetric]);

    const timeIcons = {
        earlymorning: <NightsStayIcon fontSize="small" />,
        morning: <WbSunnyIcon fontSize="small" />,
        afternoon: <Brightness5Icon fontSize="small" />,
        evening: <Brightness4Icon fontSize="small" />
    };

    const selectedCount = Object.keys(analyzedPostsData).length;
    const hasData = combinedData.length > 0;

    const entitiesToRender = useMemo(() => Object.keys(analyzedPostsData).filter(id => id !== 'dummy-test-id'), [analyzedPostsData]);
    const isShowingDummy = !entitiesToRender.length && combinedData.length > 0 && selectedCount > 0;

    const yAxisDomain = useMemo(() => {
        if (combinedData.length === 0) return [0, 100];
        
        const allValues = combinedData.flatMap(item => 
            Object.values(item).filter(val => typeof val === 'number' && !isNaN(val))
        );
        
        const maxValue = Math.max(...allValues);
        // ... (lógica de dominio existente)
        if (maxValue > 100) {
            return [0, Math.ceil(maxValue / 50) * 50 + 50];
        } else if (maxValue > 20) {
            return [0, Math.ceil(maxValue / 10) * 10 + 10];
        } else if (maxValue > 0) {
            return [0, Math.ceil(maxValue / 5) * 5 + 5];
        } else {
            return [0, 5]; // Min domain if max value is 0 or less
        }
    }, [combinedData]);

    let content;

    if (loading && selectedCount > 0) {
        content = <CircularProgress />;
    } else if (selectedCount === 0 && !isShowingDummy) {
        content = <Typography variant="body1">{t('dashboard.postStats.selectPostPrompt')}</Typography>;
    } else if (!hasData && !isShowingDummy) {
        content = <Typography variant="body1">{t('dashboard.postStats.noHourlyData')}</Typography>;
    } else {
        const currentEntitiesToRender = isShowingDummy ? ['dummy-test-id'] : entitiesToRender;

        const chartWidth = dimensions.width || 1000;
        const chartHeight = Math.max(dimensions.height || 350, 200);

        content = (
            <Box
                ref={containerRef}
                sx={{
                    flex: 1,
                    width: '100%',
                    minHeight: 300,
                    display: 'flex'
                }}
            >
                <div style={{ width: '100%' }}>
                    <LineChart
                        width={chartWidth}
                        height={chartHeight}
                        data={combinedData}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                            dataKey="label"
                            tick={{ fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                            interval="preserveStartEnd"
                            angle={-45}
                            textAnchor="end"
                            height={80}
                        />
                        <YAxis 
                            tick={{ fontSize: 11 }} 
                            axisLine={false} 
                            tickLine={false}
                            domain={yAxisDomain}
                            tickCount={6}
                            tickFormatter={(value) => {
                                if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
                                if (value >= 100) return `${value}`;
                                return value;
                            }}
                        />
                        <RechartsTooltip
                            contentStyle={{ fontSize: '12px', padding: '8px', borderRadius: '4px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
                            formatter={(value, name) => {
                                const formattedValue = Number(value).toLocaleString();
                                return [formattedValue, name];
                            }}
                            labelFormatter={(label) => {
                                return `Fecha: ${label}`;
                            }}
                        />
                        <Legend />
                        {currentEntitiesToRender.map((entityId, index) => (
                            <Line
                                key={entityId}
                                type="monotone"
                                dataKey={entityId}
                                stroke={colors[index % colors.length]}
                                strokeWidth={2}
                                name={isShowingDummy ? t('dashboard.postStats.simulationData') : postTitlesMap[entityId]}
                                dot={isShowingDummy || combinedData.length <= 2}
                                activeDot={isShowingDummy || combinedData.length <= 2}
                                connectNulls={true}
                            />
                        ))}
                    </LineChart>
                </div>
            </Box>
        );
    }

    return (
        <Paper elevation={0} sx={{
            p: 2,
            display: 'flex', flexDirection: 'column', height: '100%',
            border: '1px solid #dadce0', borderRadius: '8px',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
        }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="subtitle1" fontWeight={500}>
                    {t('dashboard.postStats.evolutionChartTitle')}
                </Typography>
                
                {/* 🆕 Selector de métrica */}
                <ButtonGroup variant="outlined" size="small" aria-label="Metric Selector">
                    {metrics.map((metric) => (
                        <Button
                            key={metric.key}
                            onClick={() => onMetricChange(metric.key)}
                            variant={chartMetric === metric.key ? 'contained' : 'outlined'}
                        >
                            {metric.label}
                        </Button>
                    ))}
                </ButtonGroup>
            </Stack>
            
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
                {content}
            </Box>

            {(hasData || isShowingDummy) && (
                <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                        {t('dashboard.statistics.time_breakdown')} ({t(`dashboard.postStats.metric.${chartMetric}`)})
                    </Typography>
                    <Stack direction="row" spacing={2} justifyContent="space-between">
                        {Object.entries(breakdown).map(([period, data]) => (
                            <Tooltip
                                key={period}
                                title={
                                    <>
                                        <Typography variant="caption" display="block">
                                            {t(`dashboard.statistics.${period}`)}
                                        </Typography>
                                        <Typography variant="caption" display="block">
                                            {t(`dashboard.postStats.metric.${chartMetric}`)}: {data.total.toLocaleString()} ({data.percent}%)
                                        </Typography>
                                    </>
                                }
                                arrow
                            >
                                <Box sx={{ textAlign: 'center' }}>
                                    {timeIcons[period]}
                                    <Typography variant="caption" display="block" color="text.secondary">
                                        {data.percent}%
                                    </Typography>
                                </Box>
                            </Tooltip>
                        ))}
                    </Stack>
                </Box>
            )}
        </Paper>
    );
};

export default PostTimeChart;