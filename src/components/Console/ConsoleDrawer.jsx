// ./src/components/Console/ConsoleDrawer.jsx
import React, { useState, useEffect, useRef, memo, useReducer, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Drawer, IconButton, Toolbar, Typography, Box, Button, ButtonGroup, FormControl, InputLabel, Select, MenuItem, TextField, InputAdornment, Tooltip, Divider, CircularProgress } from '@mui/material';
import { Close as CloseIcon, Pause as PauseIcon, PlayArrow as PlayIcon, FilterList as FilterIcon, Search as SearchIcon, Memory as MemoryIcon, Speed as SpeedIcon, Timer as TimerIcon, Dns as DnsIcon, Storage, Assessment, Delete as ClearIcon } from '@mui/icons-material';
import { getLogs } from '../../api/logs';
import { Sparklines, SparklinesLine } from 'react-sparklines';

const POLL_INTERVAL_LOGS = 2000;

const ACTIONS = {
    SET_STATUS: 'SET_STATUS',
    ADD_LOGS: 'ADD_LOGS',
    SET_PAUSED: 'SET_PAUSED',
    CLEAR_LOGS: 'CLEAR_LOGS',
    SET_FILTERS: 'SET_FILTERS',
};

const consoleReducer = (state, action) => {
    switch (action.type) {
        case ACTIONS.SET_STATUS:
            return { ...state, status: action.payload.status, history: action.payload.history, isFirstLoad: action.payload.isFirstLoad };
        case ACTIONS.ADD_LOGS:
            const { newLogs, isFirstLoad } = action.payload;
            const newLogsWithId = newLogs.map(log => ({ ...log, _cid: `${new Date(log.time).getTime()}-${Math.random()}`, animated: !isFirstLoad }));
            if (isFirstLoad) {
                return { ...state, logs: newLogsWithId, lastTimestamp: newLogs[0]?.time || state.lastTimestamp, isFirstLoad: false, logQueue: [] };
            }
            return { ...state, logQueue: [...state.logQueue, ...newLogsWithId], lastTimestamp: newLogs[0]?.time || state.lastTimestamp, };
        case ACTIONS.SET_PAUSED:
            return { ...state, paused: action.payload };
        case ACTIONS.CLEAR_LOGS:
            return { ...state, logs: [], logQueue: [], lastTimestamp: new Date().toISOString(), history: { appCpu: [], appMem: [], dbMem: [] }, isFirstLoad: false };
        case ACTIONS.SET_FILTERS:
            return { ...state, filters: action.payload, logs: [], logQueue: [], isFirstLoad: true, };
        default:
            return state;
    }
};

const getInitialState = (t) => {
    const storedTimestamp = localStorage.getItem('lastLogTimestamp');
    return {
        logs: [],
        logQueue: [],
        paused: false,
        filters: { level: 'all', searchText: '' },
        status: null,
        history: { appCpu: [], appMem: [], dbMem: [] },
        isFirstLoad: true,
        lastTimestamp: storedTimestamp || new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    };
};

const formatBytes = (bytes, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

const formatUptime = (seconds) => {
    if (!seconds) return '0m';
    const d = Math.floor(seconds / (3600*24));
    const h = Math.floor(seconds % (3600*24) / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    let str = '';
    if (d > 0) str += `${d}d `;
    if (h > 0) str += `${h}h `;
    if (m > 0 || (d === 0 && h === 0)) str += `${m}m`;
    return str.trim();
};

const getLogColor = (level) => {
    switch (String(level).toLowerCase()) {
        case 'error': return '#ff6b6b';
        case 'warn': return '#f1fa8c';
        case 'info': return '#8be9fd';
        case 'debug': return '#bd93f9';
        default: return '#ffffff';
    }
};

const ServerStatusBar = memo(function ServerStatusBar({ status, history }) {
    const { t } = useTranslation();
    if (!status?.app || !status?.database) {
        return (
            <Box sx={{display: 'flex', alignItems: 'center', p: '4px 16px', backgroundColor: 'rgba(0,0,0)', borderBlock: '1px solid rgba(255,255,255,0.1)', fontFamily: '"Ubuntu Mono", monospace', fontSize: '0.8rem', color: '#ddd'}}>
                <CircularProgress size={16} sx={{color: '#fff', mr: 1}}/><Typography variant="caption" sx={{color: '#ffffff'}}>{t('common.loading')}</Typography>
            </Box>
        );
    }

    const { app, database, cache } = status;
    const appMemoryUsed = app.system.totalMemory - app.system.freeMemory;
    const appMemoryPercentage = ((appMemoryUsed / app.system.totalMemory) * 100).toFixed(1);
    const appCpuLoad = app.system.loadAvg?.[0]?.toFixed(2) || '0.00';
    const processMemory = formatBytes(app.process.memoryUsage.rss);
    const dbMemory = `${database.memory.resident} MB`;
    const dbStorage = formatBytes((database.storage?.data || 0) + (database.storage?.indexes || 0));
    // FIX: Uso defensivo para queries y version
    const dbQueries = (database.operations?.query || 0).toLocaleString('es-AR');
    const dbVersion = database.version || 'Unknown';
    const dbConnectionsActive = database.connections?.active || 0;
    const dbConnectionsAvailable = database.connections?.available || 0;
    const dbConnectionsCurrent = database.connections?.current || 0;
    
    const redisMemory = cache?.redis?.used_memory_human || '0B';
    const redisKeys = cache?.db0?.keys || 0;
    const redisOps = cache?.redis?.instantaneous_ops_per_sec || 0;
    const redisUptime = cache?.redis?.uptime_in_seconds ? formatUptime(cache.redis.uptime_in_seconds) : '0m';
    const redisClients = cache?.redis?.connected_clients || 0;

    const SparkInline = ({ data, color }) => (
        <Sparklines data={data} width={100} height={20} margin={2}>
            <SparklinesLine color={color} style={{strokeWidth: 2, fill: "none"}}/>
        </Sparklines>
    );

    return (
        <Box sx={{display: 'flex', alignItems: 'center', p: '4px 16px', backgroundColor: 'rgba(0,0,0)', borderBlock: '1px solid rgba(255,255,255,0.1)', fontFamily: '"Ubuntu Mono", monospace', fontSize: '0.8rem', color: '#ddd'}}>
            <Box sx={{display: 'flex', alignItems: 'center', gap: 1, flex: 1, flexWrap: 'wrap'}}>
                <Typography variant="caption" sx={{color: '#ffffff', fontWeight: 'bold'}}>{t('app.title')}</Typography><Tooltip title={t('app.cpuTooltip', { load1: app.system.loadAvg?.[0]?.toFixed(2) || '0.00', load5: app.system.loadAvg?.[1]?.toFixed(2) || '0.00', load15: app.system.loadAvg?.[2]?.toFixed(2) || '0.00', cores: app.system.cpus })}><Box sx={{display: 'flex', alignItems: 'center', gap: 1}}><SpeedIcon sx={{fontSize: '1rem', color: '#f1fa8c'}}/><Typography variant="caption" sx={{width:'100px'}}>{t('app.cpu', {load: appCpuLoad})}</Typography><SparkInline data={history.appCpu} color="#f1fa8c"/></Box></Tooltip><Tooltip title={t('app.memoryTooltip', { used: formatBytes(appMemoryUsed), total: formatBytes(app.system.totalMemory) })}><Box sx={{display: 'flex', alignItems: 'center', gap: 1}}><MemoryIcon sx={{fontSize: '1rem', color: '#8be9fd'}}/><Typography variant="caption" sx={{width:'130px'}}>{t('app.ram', {percent: appMemoryPercentage})}</Typography><SparkInline data={history.appMem} color="#8be9fd"/></Box></Tooltip><Tooltip title={t('app.processMemoryTooltip')}><Box sx={{display: 'flex', alignItems: 'center', gap: 1}}><MemoryIcon sx={{fontSize: '1rem', color: '#8be9fd', opacity: 0.6}}/><Typography variant="caption" sx={{width:'80px'}}>{t('app.processMemory', {memory: processMemory})}</Typography></Box></Tooltip><Tooltip title={t('app.nodeVersion', {version: app.process.version})}><Box sx={{display: 'flex', alignItems: 'center', gap: 1}}><TimerIcon sx={{fontSize: '1rem', color: '#6a9955'}}/><Typography variant="caption">{t('app.uptime', {uptime: formatUptime(app.process.uptime)})}</Typography></Box></Tooltip>
            </Box>
            <Divider orientation="vertical" flexItem sx={{mx: 2, borderColor: 'rgba(255,255,255,0.2)'}}/>
            <Box sx={{display: 'flex', alignItems: 'center', gap: 3, flex: 1, flexWrap: 'wrap'}}>
                <Typography variant="caption" sx={{color: '#ffffff', fontWeight: 'bold'}}>{t('db.title')}</Typography><Tooltip title={t('db.connectionsTooltip', { active: dbConnectionsActive, available: dbConnectionsAvailable })}><Box sx={{display: 'flex', alignItems: 'center', gap: 1}}><DnsIcon sx={{fontSize: '1rem', color: '#bd93f9'}}/><Typography variant="caption">{t('db.connections', {current: dbConnectionsCurrent})}</Typography></Box></Tooltip><Tooltip title={t('db.memoryTooltip', {version: dbVersion})}><Box sx={{display: 'flex', alignItems: 'center', gap: 1}}><MemoryIcon sx={{fontSize: '1rem', color: '#ff6b6b'}}/><Typography variant="caption" sx={{width:'130px'}}>{t('db.memory', {memory: dbMemory})}</Typography><SparkInline data={history.dbMem} color="#ff6b6b"/></Box></Tooltip><Tooltip title={t('db.storageTooltip', { data: formatBytes(database.storage?.data || 0), indexes: formatBytes(database.storage?.indexes || 0) })}><Box sx={{display: 'flex', alignItems: 'center', gap: 1}}><Storage sx={{fontSize: '1rem', color: '#ffb86c'}}/><Typography variant="caption">{t('db.storage', {storage: dbStorage})}</Typography></Box></Tooltip><Tooltip title={t('db.queriesTooltip')}><Box sx={{display: 'flex', alignItems: 'center', gap: 1}}><Assessment sx={{fontSize: '1rem', color: '#50fa7b'}}/><Typography variant="caption">{t('db.queries', {queries: dbQueries})}</Typography></Box></Tooltip>
            </Box>
            <Divider orientation="vertical" flexItem sx={{mx: 2, borderColor: 'rgba(255,255,255,0.2)'}}/>
            <Box sx={{display: 'flex', alignItems: 'center', gap: 3, flex: 1, flexWrap: 'wrap'}}>
                <Typography variant="caption" sx={{color: '#ffffff', fontWeight: 'bold'}}>{t('cache.title')}</Typography><Tooltip title={t('cache.memoryTooltip')}><Box sx={{display: 'flex', alignItems: 'center', gap: 1}}><MemoryIcon sx={{fontSize: '1rem', color: '#ff79c6'}}/><Typography variant="caption">{redisMemory}</Typography></Box></Tooltip><Tooltip title={t('cache.keysTooltip')}><Box sx={{display: 'flex', alignItems: 'center', gap: 1}}><Storage sx={{fontSize: '1rem', color: '#ffb86c'}}/><Typography variant="caption">{redisKeys} {t('cache.keys')}</Typography></Box></Tooltip><Tooltip title={t('cache.opsTooltip')}><Box sx={{display: 'flex', alignItems: 'center', gap: 1}}><SpeedIcon sx={{fontSize: '1rem', color: '#50fa7b'}}/><Typography variant="caption">{redisOps} {t('cache.ops')}</Typography></Box></Tooltip><Tooltip title={t('cache.clientsTooltip')}><Box sx={{display: 'flex', alignItems: 'center', gap: 1}}><DnsIcon sx={{fontSize: '1rem', color: '#bd93f9'}}/><Typography variant="caption">{redisClients} {t('cache.clients')}</Typography></Box></Tooltip><Tooltip title={t('cache.uptimeTooltip')}><Box sx={{display: 'flex', alignItems: 'center', gap: 1}}><TimerIcon sx={{fontSize: '1rem', color: '#6a9955'}}/><Typography variant="caption">{redisUptime}</Typography></Box></Tooltip>
            </Box>
        </Box>
    );
});

const ConsoleLogRow = memo(function ConsoleLogRow({ log, formatTime, getLogColor }) {
    return (
        <div className={`console-log ${log.animated ? 'fade-in' : ''}`} style={{color: '#ffffff', fontFamily: '"Ubuntu Mono", monospace', fontSize: '0.875rem', padding: '2px 16px', lineHeight: '1.4'}}>
            <span className="console-time" style={{color: '#8be9fd'}}>[{formatTime(log.time)}]</span><span className="console-level" style={{color: getLogColor(log.level), fontWeight: 'bold'}}> [{String(log.level || '').toUpperCase()}] </span><span className="console-message" style={{color: '#ffffff'}}>{log.message}</span>
        </div>
    );
});

const ConsoleDrawer = ({ open, onClose, anchor, variant, PaperProps }) => {
    const { t } = useTranslation();
    const [state, dispatch] = useReducer(consoleReducer, getInitialState(t));
    const { logs, logQueue, paused, filters, status, history, isFirstLoad, lastTimestamp } = state;
    const logsContainerRef = useRef(null);

    useEffect(() => {
        if (lastTimestamp) localStorage.setItem('lastLogTimestamp', lastTimestamp);
    }, [lastTimestamp]);

    const formatTime = useCallback((timestamp) => {
        try {
            const date = new Date(timestamp);
            return date.toLocaleString('en-US', {year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3, timeZoneName: 'short'});
        } catch {
            return '--/--/---- --:--:--.--- ---';
        }
    }, []);

    useEffect(() => {
        if (logQueue.length === 0 || paused) return;
        const processBatch = () => {
            const batchToProcess = [...logQueue];
            dispatch({type: ACTIONS.ADD_LOGS, payload: {newLogs: [], isFirstLoad: false}});
            const chronoBatch = [...batchToProcess].reverse();
            const newLogs = chronoBatch.map(log => ({...log, animated: !isFirstLoad}));
            dispatch(prev => ({ ...prev, logs: [...newLogs, ...prev.logs].slice(0, 500) }));
        };
        const timer = setTimeout(processBatch, 200);
        return () => clearTimeout(timer);
    }, [logQueue, paused, isFirstLoad]);

    const fetchLogs = useCallback(async () => {
        if (paused || !open) return;
        try {
            const params = {from: lastTimestamp};
            if (filters.level !== 'all') params.level = filters.level;
            const response = await getLogs(params);
            const {logs: newLogs, database, app, cache} = response;
            if (app && database) {
                if (!app.system.loadAvg) {
                    app.system.loadAvg = [0, 0, 0];
                }
                const appMemUsed = ((app.system.totalMemory - app.system.freeMemory) / app.system.totalMemory) * 100;
                const appCpu = app.system.loadAvg[0];
                const dbMem = database.memory.resident;
                const newHistory = {
                    appCpu: [...history.appCpu, appCpu].slice(-10),
                    appMem: [...history.appMem, appMemUsed].slice(-10),
                    dbMem: [...history.dbMem, dbMem].slice(-10)
                };
                dispatch({ type: ACTIONS.SET_STATUS, payload: {status: {app, database, cache}, history: newHistory, isFirstLoad: isFirstLoad} });
            }
            if (Array.isArray(newLogs) && newLogs.length > 0) {
                dispatch({ type: ACTIONS.ADD_LOGS, payload: {newLogs: newLogs, isFirstLoad: isFirstLoad} });
            }
        } catch (error) {
            console.error('Error in fetchLogs component logic:', error);
        }
    }, [paused, open, lastTimestamp, filters.level, isFirstLoad, history]);

    const savedCallback = useRef();
    useEffect(() => {
        savedCallback.current = fetchLogs;
    }, [fetchLogs]);

    useEffect(() => {
        if (!open || paused) return;
        function tick() {
            if (savedCallback.current) {
                savedCallback.current();
            }
        }
        const intervalId = setInterval(tick, POLL_INTERVAL_LOGS);
        return () => clearInterval(intervalId);
    }, [open, paused]);

    useEffect(() => {
        if (logsContainerRef.current && !paused && logs.length > 0) {
            setTimeout(() => {
                logsContainerRef.current.scrollTop = 0;
            }, 100);
        }
    }, [logs, paused]);

    const handleClear = () => {
        dispatch({type: ACTIONS.CLEAR_LOGS});
    };

    const handleTogglePause = () => {
        dispatch({type: ACTIONS.SET_PAUSED, payload: !paused});
    };

    const visibleLogs = filters.searchText.trim() ? logs.filter(l => String(l.message || '').toLowerCase().includes(filters.searchText.toLowerCase())) : logs;

    return (
        <div className="console-drawer" style={{display: open ? 'block' : 'none', height: '600px !important'}}>
            <Drawer 
                open={open} 
                onClose={onClose} 
                variant={variant} 
                anchor={anchor} 
                PaperProps={{
                    ...PaperProps,
                    sx: {
                        ...PaperProps?.sx,
                        height: '600px !important',
                        maxHeight: '600px !important',
                        minHeight: '600px !important',
                        borderRadius: '0 !important'
                    }
                }}
            >
                <ServerStatusBar status={status} history={history}/>
                <Box sx={{position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', height: 'calc(600px - 40px) !important'}}>
                    <Box sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        zIndex: 10,
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        p: 1,
                        gap: 1,
                        border: '1px solid rgba(255,255,255,0.2)'
                    }}>
                        <FormControl size="small" sx={{minWidth: 100}}>
                            <Select
                                value={filters.level}
                                onChange={(e) => dispatch({type: ACTIONS.SET_FILTERS, payload: {...filters, level: e.target.value}})}
                                sx={{
                                    color: '#ffffff',
                                    fontSize: '0.75rem',
                                    height: '32px',
                                    '.MuiSvgIcon-root': {color: '#ffffff', fontSize: '1rem'},
                                    '.MuiOutlinedInput-notchedOutline': {borderColor: 'rgba(255,255,255,0.4)'},
                                    '&:hover .MuiOutlinedInput-notchedOutline': {borderColor: '#ffffff'},
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {borderColor: '#ffffff'},
                                    backgroundColor: 'rgba(255, 255, 255, 0.08)'
                                }}
                            >
                                <MenuItem value="all">{t('console.allLevels')}</MenuItem>
                                <MenuItem value="error">Error</MenuItem>
                                <MenuItem value="warn">Warning</MenuItem>
                                <MenuItem value="info">Info</MenuItem>
                                <MenuItem value="debug">Debug</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField
                            value={filters.searchText}
                            onChange={(e) => dispatch({type: ACTIONS.SET_FILTERS, payload: {...filters, searchText: e.target.value}})}
                            placeholder={t('console.search', 'Buscar...')}
                            size="small"
                            variant="outlined"
                            sx={{
                                width: 180,
                                '& .MuiOutlinedInput-root': {
                                    color: '#fff',
                                    fontSize: '0.75rem',
                                    height: '32px',
                                    backgroundColor: 'rgba(255,255,255,0.08)',
                                    '& fieldset': {borderColor: 'rgba(255,255,255,0.4)'},
                                    '&:hover fieldset': {borderColor: '#fff'},
                                    '&.Mui-focused fieldset': {borderColor: '#fff'}
                                },
                                '& .MuiInputBase-input': {
                                    fontFamily: '"Ubuntu Mono","Courier New",monospace',
                                    padding: '8px 12px'
                                }
                            }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon sx={{color: '#fff', fontSize: '1rem'}}/>
                                    </InputAdornment>
                                )
                            }}
                        />
                        <ButtonGroup variant="contained" size="small">
                            <Button 
                                onClick={handleTogglePause} 
                                startIcon={paused ? <PlayIcon sx={{fontSize: '1rem'}}/> : <PauseIcon sx={{fontSize: '1rem'}}/>}
                                sx={{
                                    backgroundColor: '#510b36',
                                    fontSize: '0.75rem',
                                    height: '32px',
                                    '&:hover': {backgroundColor: '#6b1650'}
                                }}
                            >
                                {paused ? t('console.resume') : t('console.pause')}
                            </Button>
                            <Button 
                                onClick={handleClear} 
                                startIcon={<ClearIcon sx={{fontSize: '1rem'}}/>}
                                sx={{
                                    backgroundColor: '#510b36',
                                    fontSize: '0.75rem',
                                    height: '32px',
                                    '&:hover': {backgroundColor: '#6b1650'}
                                }}
                            >
                                {t('console.clear')}
                            </Button>
                        </ButtonGroup>
                    </Box>
                    <Box 
                        ref={logsContainerRef} 
                        className="console-content"
                        sx={{
                            flex: 1,
                            backgroundColor: '#000000',
                            overflow: 'auto',
                            pt: 6,
                            height: 'calc(100% - 40px) !important'
                        }}
                    >
                        {visibleLogs.length === 0 ? (
                            <Typography variant="caption" sx={{color: '#888', p: 2}}>{t('console.noLogs', 'No hay logs disponibles')}</Typography>
                        ) : (
                            visibleLogs.map((log) => (
                                <ConsoleLogRow key={log._cid} log={log} formatTime={formatTime} getLogColor={getLogColor}/>
                            ))
                        )}
                    </Box>
                </Box>
            </Drawer>
        </div>
    );
};

export default ConsoleDrawer;