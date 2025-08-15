import React, { useState, useEffect, useRef, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Drawer, IconButton, Toolbar, Typography, Box, Button, ButtonGroup, 
  FormControl, InputLabel, Select, MenuItem, TextField, InputAdornment, Tooltip, Divider
} from '@mui/material';
import {
  Close as CloseIcon,
  Pause as PauseIcon,
  PlayArrow as PlayIcon,
  Delete as ClearIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Memory as MemoryIcon,
  Speed as SpeedIcon,
  Timer as TimerIcon,
  Dns as DnsIcon,
  Storage,
  Assessment
} from '@mui/icons-material';
import { getLogs } from '../../api/logs';
import { Sparklines, SparklinesLine } from 'react-sparklines';
import '../../assets/css/Console.css';

// --- Funciones auxiliares ---
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

// --- Sparkline mini componente ---
const Spark = ({ data, color }) => (
  <Sparklines data={data} width={50} height={16}>
    <SparklinesLine color={color} style={{ strokeWidth: 2, fill: "none" }} />
  </Sparklines>
);

// --- ServerStatusBar  & sparklines ---

const ServerStatusBar = memo(function ServerStatusBar({ status, history }) {
    const { t } = useTranslation();
    
    if (!status?.app || !status?.database) return null;

    const { app, database, cache } = status;
    const appMemoryUsed = app.system.totalMemory - app.system.freeMemory;
    const appMemoryPercentage = ((appMemoryUsed / app.system.totalMemory) * 100).toFixed(1);
    const appCpuLoad = app.system.loadAvg[0].toFixed(2);
    const processMemory = formatBytes(app.process.memoryUsage.rss);
    const dbMemory = `${database.memory.resident} MB`;
    const dbStorage = formatBytes(database.storage.data + database.storage.indexes);

    // Redis (cache) data
    const redisMemory = cache?.redis?.used_memory_human || '0B';
    const redisKeys = cache?.db0?.keys || 0;
    const redisOps = cache?.redis?.instantaneous_ops_per_sec || 0;
    const redisUptime = cache?.redis?.uptime_in_seconds ? formatUptime(cache.redis.uptime_in_seconds) : '0m';
    const redisClients = cache?.redis?.connected_clients || 0;

    const SparkInline = ({ data, color }) => (
      <Sparklines data={data} width={100} height={20} margin={2}>
        <SparklinesLine color={color} style={{ strokeWidth: 2, fill: "none" }} />
      </Sparklines>
    );

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', p: '4px 16px', backgroundColor: 'rgba(0,0,0,0.25)', borderBlock: '1px solid rgba(255,255,255,0.1)', fontFamily: '"Ubuntu Mono", monospace', fontSize: '0.8rem', color: '#ddd' }}>
            
            {/* APP */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, flexWrap: 'wrap' }}>
                <Typography variant="caption" sx={{ color: '#ffffff', fontWeight: 'bold' }}>{t('app.title')}</Typography>

                <Tooltip title={t('app.cpuTooltip', { 
                    load1: app.system.loadAvg[0].toFixed(2),
                    load5: app.system.loadAvg[1].toFixed(2),
                    load15: app.system.loadAvg[2].toFixed(2),
                    cores: app.system.cpus 
                })}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SpeedIcon sx={{ fontSize: '1rem', color: '#f1fa8c' }} />
                        <Typography variant="caption" sx={{ width:'100px' }}>{t('app.cpu', { load: appCpuLoad })}</Typography>
                        <SparkInline data={history.appCpu} color="#f1fa8c" />
                    </Box>
                </Tooltip>

                <Tooltip title={t('app.memoryTooltip', {
                    used: formatBytes(appMemoryUsed),
                    total: formatBytes(app.system.totalMemory)
                })}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MemoryIcon sx={{ fontSize: '1rem', color: '#8be9fd' }} />
                        <Typography variant="caption" sx={{ width:'130px' }}>{t('app.ram', { percent: appMemoryPercentage })}</Typography>
                        <SparkInline data={history.appMem} color="#8be9fd" />
                    </Box>
                </Tooltip>

                <Tooltip title={t('app.processMemoryTooltip')}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MemoryIcon sx={{ fontSize: '1rem', color: '#8be9fd', opacity: 0.6 }} />
                        <Typography variant="caption" sx={{ width:'80px' }}>{t('app.processMemory', { memory: processMemory })}</Typography>
                    </Box>
                </Tooltip>

                <Tooltip title={t('app.nodeVersion', { version: app.process.version })}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TimerIcon sx={{ fontSize: '1rem', color: '#6a9955' }} />
                        <Typography variant="caption">{t('app.uptime', { uptime: formatUptime(app.process.uptime) })}</Typography>
                    </Box>
                </Tooltip>
            </Box>

            <Divider orientation="vertical" flexItem sx={{ mx: 2, borderColor: 'rgba(255,255,255,0.2)' }} />

            {/* DB */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flex: 1, flexWrap: 'wrap' }}>
                <Typography variant="caption" sx={{ color: '#ffffff', fontWeight: 'bold' }}>{t('db.title')}</Typography>

                <Tooltip title={t('db.connectionsTooltip', {
                    active: database.connections.active,
                    available: database.connections.available
                })}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <DnsIcon sx={{ fontSize: '1rem', color: '#bd93f9' }} />
                        <Typography variant="caption">{t('db.connections', { current: database.connections.current })}</Typography>
                    </Box>
                </Tooltip>

                <Tooltip title={t('db.memoryTooltip', { version: database.version })}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MemoryIcon sx={{ fontSize: '1rem', color: '#ff6b6b' }} />
                        <Typography variant="caption" sx={{ width:'130px' }}>{t('db.memory', { memory: dbMemory })}</Typography>
                        <SparkInline data={history.dbMem} color="#ff6b6b" />
                    </Box>
                </Tooltip>

                <Tooltip title={t('db.storageTooltip', {
                    data: formatBytes(database.storage.data),
                    indexes: formatBytes(database.storage.indexes)
                })}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Storage sx={{ fontSize: '1rem', color: '#ffb86c' }} />
                        <Typography variant="caption">{t('db.storage', { storage: dbStorage })}</Typography>
                    </Box>
                </Tooltip>

                <Tooltip title={t('db.queriesTooltip')}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Assessment sx={{ fontSize: '1rem', color: '#50fa7b' }} />
                        <Typography variant="caption">{t('db.queries', { queries: database.operations.query.toLocaleString('es-AR') })}</Typography>
                    </Box>
                </Tooltip>
            </Box>

            <Divider orientation="vertical" flexItem sx={{ mx: 2, borderColor: 'rgba(255,255,255,0.2)' }} />

            {/* CACHE (REDIS) */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flex: 1, flexWrap: 'wrap' }}>
                <Typography variant="caption" sx={{ color: '#ffffff', fontWeight: 'bold' }}>{t('cache.title')}</Typography>

                <Tooltip title={t('cache.memoryTooltip')}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MemoryIcon sx={{ fontSize: '1rem', color: '#ff79c6' }} />
                        <Typography variant="caption">{redisMemory}</Typography>
                    </Box>
                </Tooltip>

                <Tooltip title={t('cache.keysTooltip')}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Storage sx={{ fontSize: '1rem', color: '#ffb86c' }} />
                        <Typography variant="caption">{redisKeys} {t('cache.keys')}</Typography>
                    </Box>
                </Tooltip>

                <Tooltip title={t('cache.opsTooltip')}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SpeedIcon sx={{ fontSize: '1rem', color: '#50fa7b' }} />
                        <Typography variant="caption">{redisOps} {t('cache.ops')}</Typography>
                    </Box>
                </Tooltip>

                <Tooltip title={t('cache.clientsTooltip')}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <DnsIcon sx={{ fontSize: '1rem', color: '#bd93f9' }} />
                        <Typography variant="caption">{redisClients} {t('cache.clients')}</Typography>
                    </Box>
                </Tooltip>

                <Tooltip title={t('cache.uptimeTooltip')}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TimerIcon sx={{ fontSize: '1rem', color: '#6a9955' }} />
                        <Typography variant="caption">{redisUptime}</Typography>
                    </Box>
                </Tooltip>
            </Box>
        </Box>
    );
});


// --- Componente LogRow ---
const ConsoleLogRow = memo(function ConsoleLogRow({ log, formatTime, getLogColor }) {
  return (
    <div className={`console-log ${log.animated ? 'fade-in' : ''}`}>
      <span className="console-time">[{formatTime(log.time)}]</span>
      <span className="console-level" style={{ color: getLogColor(log.level) }}>
        [{String(log.level || '').toUpperCase()}]
      </span>
      <span className="console-message">{log.message}</span>
    </div>
  );
});

// --- Componente principal ConsoleDrawer ---
const ConsoleDrawer = ({ open, onClose }) => {
  const { t } = useTranslation();
  const [logs, setLogs] = useState([]);
  const [paused, setPaused] = useState(false);
  const [filterLevel, setFilterLevel] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [logQueue, setLogQueue] = useState([]);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [serverStatus, setServerStatus] = useState(null);
  const [history, setHistory] = useState({ appCpu: [], appMem: [], dbMem: [] });

  const processingRef = useRef(false);
  const seqRef = useRef(0);
  const logsContainerRef = useRef(null);

  const [lastTimestamp, setLastTimestamp] = useState(() => {
    const stored = localStorage.getItem('lastLogTimestamp');
    return stored || new Date(Date.now() - 10 * 60 * 1000).toISOString();
  });

  useEffect(() => {
    if (lastTimestamp) localStorage.setItem('lastLogTimestamp', lastTimestamp);
  }, [lastTimestamp, open]);

  const formatTime = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3, timeZoneName: 'short' });
    } catch {
      return '--/--/---- --:--:--.--- ---';
    }
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

  const makeClientLog = (log, animated) => ({ ...log, _cid: `${new Date(log.time).getTime()}-${seqRef.current++}`, animated: !!animated });

  useEffect(() => {
    if (logQueue.length === 0 || processingRef.current || paused) return;
    const processBatch = () => {
      processingRef.current = true;
      const batchToProcess = [...logQueue];
      setLogQueue([]);
      if (batchToProcess.length > 0) setLastTimestamp(batchToProcess[0].time);
      const chronoBatch = [...batchToProcess].reverse();
      const batchInterval = 2000;
      const step = chronoBatch.length > 0 ? batchInterval / (chronoBatch.length + 1) : 0;
      let currentDelay = 0;
      chronoBatch.forEach((log) => {
        setTimeout(() => {
          const newLog = makeClientLog(log, !isFirstLoad);
          setLogs((prev) => [newLog, ...prev]);
        }, currentDelay);
        currentDelay += step;
      });
      setTimeout(() => { processingRef.current = false; }, currentDelay + 100);
    };
    processBatch();
  }, [logQueue, paused, isFirstLoad]);

  const fetchLogs = async () => {
    if (paused || !open || processingRef.current) return;
    try {
      const params = { from: lastTimestamp };
      if (filterLevel !== 'all') params.level = filterLevel;
      const response = await getLogs(params);
      const newLogs = response.logs;

      if (response.app && response.database) {
        setServerStatus({ app: response.app, database: response.database, cache: response.cache });

        const appMemUsed = ((response.app.system.totalMemory - response.app.system.freeMemory) / response.app.system.totalMemory) * 100;
        const appCpu = response.app.system.loadAvg[0];
        const dbMem = response.database.memory.resident;

        setHistory(prev => ({
          appCpu: [...prev.appCpu, appCpu].slice(-10),
          appMem: [...prev.appMem, appMemUsed].slice(-10),
          dbMem: [...prev.dbMem, dbMem].slice(-10)
        }));
      }

      if (Array.isArray(newLogs) && newLogs.length > 0) {
        if (isFirstLoad) {
          const mappedLogs = newLogs.map(l => makeClientLog(l, false));
          setLogs(prev => [...mappedLogs, ...prev]);
          setLastTimestamp(newLogs[0].time);
          setIsFirstLoad(false);
        } else {
          setLogQueue(prev => [...newLogs, ...prev]);
        }
      }
    } catch (error) {
      console.error('Error in fetchLogs component logic:', error);
    }
  };

  useEffect(() => {
    let intervalId;
    if (open) {
      fetchLogs();
      intervalId = setInterval(fetchLogs, 3000);
    }
    return () => { intervalId && clearInterval(intervalId); };
  }, [open, filterLevel, paused, lastTimestamp]);

  useEffect(() => {
    if (open) {
      setLogs([]);
      setLogQueue([]);
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      setLastTimestamp(tenMinutesAgo);
      setIsFirstLoad(true);
      setServerStatus(null);
      setHistory({ appCpu: [], appMem: [], dbMem: [] });
    }
  }, [filterLevel, open]);

  useEffect(() => {
    if (logsContainerRef.current && !paused) {
      logsContainerRef.current.scrollTop = 0;
    }
  }, [logs, paused]);

  const handleClear = () => {
    setLogs([]);
    setLogQueue([]);
    const nowIso = new Date().toISOString();
    setLastTimestamp(nowIso);
    localStorage.setItem('lastLogTimestamp', nowIso);
    setIsFirstLoad(false);
    setHistory({ appCpu: [], appMem: [], dbMem: [] });
  };

  const handleTogglePause = () => setPaused(p => !p);
  const handleFilterChange = (event) => setFilterLevel(event.target.value);

  const visibleLogs = searchText.trim() ? logs.filter(l => String(l.message || '').toLowerCase().includes(searchText.toLowerCase())) : logs;

  return (
    <div className="console-drawer" style={{ display: open ? 'block' : 'none' }}>
      <Drawer open={open} onClose={onClose} variant="persistent" classes={{ paper: 'console-paper' }}>
        <ServerStatusBar status={serverStatus} history={history} />
        <Toolbar className="console-toolbar">
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: '#ffffff' }}></Typography>
          <FormControl size="small" sx={{ minWidth: 120, mr: 2 }}>
            <InputLabel sx={{ color: '#ffffff', top: '-6px', '&.Mui-focused': { color: '#ffffff' }, '&.MuiInputLabel-shrink': { transform: 'translate(14px, -9px) scale(0.75)' } }}>
              <FilterIcon fontSize="small" sx={{ mr: 1, color: '#ffffff' }} /> {t('console.filter')}
            </InputLabel>
            <Select value={filterLevel} onChange={handleFilterChange} sx={{ color: '#ffffff', '.MuiSvgIcon-root': { color: '#ffffff' }, '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.4)' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#ffffff' }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#ffffff' }, backgroundColor: 'rgba(255, 255, 255, 0.08)' }}>
              <MenuItem value="all">{t('console.allLevels')}</MenuItem>
              <MenuItem value="error">Error</MenuItem>
              <MenuItem value="warn">Warning</MenuItem>
              <MenuItem value="info">Info</MenuItem>
              <MenuItem value="debug">Debug</MenuItem>
            </Select>
          </FormControl>
          <TextField value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder={t('console.search', 'Buscar...')} size="small" variant="outlined" sx={{ mr: 2, width: 260, '& .MuiOutlinedInput-root': { color: '#fff', backgroundColor: 'rgba(255,255,255,0.08)', '& fieldset': { borderColor: 'rgba(255,255,255,0.4)' }, '&:hover fieldset': { borderColor: '#fff' }, '&.Mui-focused fieldset': { borderColor: '#fff' } }, '& .MuiInputBase-input': { fontFamily: '"Ubuntu Mono","Courier New",monospace' } }} InputProps={{ startAdornment: ( <InputAdornment position="start"> <SearchIcon sx={{ color: '#fff' }} /> </InputAdornment> ) }} />
          <ButtonGroup variant="contained" size="small">
            <Button onClick={handleTogglePause} startIcon={paused ? <PlayIcon /> : <PauseIcon />} sx={{ backgroundColor: '#510b36', '&:hover': { backgroundColor: '#6b1650' } }}>{paused ? t('console.resume') : t('console.pause')}</Button>
            <Button onClick={handleClear} startIcon={<ClearIcon />} sx={{ backgroundColor: '#510b36', '&:hover': { backgroundColor: '#6b1650' } }}>{t('console.clear')}</Button>
          </ButtonGroup>
          <IconButton edge="end" onClick={onClose} sx={{ ml: 2, color: '#ffffff' }}><CloseIcon /></IconButton>
        </Toolbar>
        <Box ref={logsContainerRef} className="console-content">
          {visibleLogs.length === 0 ? (
            <Typography variant="caption" sx={{ color: '#888', p: 2 }}>{t('console.noLogs', 'No hay logs disponibles')}</Typography>
          ) : (
            visibleLogs.map((log) => <ConsoleLogRow key={log._cid} log={log} formatTime={formatTime} getLogColor={getLogColor} />)
          )}
        </Box>
      </Drawer>
    </div>
  );
};

export default ConsoleDrawer;
