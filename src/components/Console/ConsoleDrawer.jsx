import React, { useState, useEffect, useRef, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Drawer,
  IconButton,
  Toolbar,
  Typography,
  Box,
  Button,
  ButtonGroup,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  Close as CloseIcon,
  Pause as PauseIcon,
  PlayArrow as PlayIcon,
  Delete as ClearIcon,
  FilterList as FilterIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { getLogs } from '../../api/logs';
import '../../assets/css/Console.css';

const ConsoleLogRow = memo(function ConsoleLogRow({ log, formatTime, getLogColor }) {
  return (
    <div className={`console-log ${log.animated ? 'fade-in' : ''}`}>
      <span className="console-time">[{formatTime(log.time)}]</span>
      <span
        className="console-level"
        style={{ color: getLogColor(log.level) }}
      >
        [{String(log.level || '').toUpperCase()}]
      </span>
      <span className="console-message">{log.message}</span>
    </div>
  );
});

const ConsoleDrawer = ({ open, onClose }) => {
  const { t } = useTranslation();

  const [logs, setLogs] = useState([]);
  const [paused, setPaused] = useState(false);
  const [filterLevel, setFilterLevel] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [logQueue, setLogQueue] = useState([]);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  const processingRef = useRef(false);
  const seqRef = useRef(0);
  const logsContainerRef = useRef(null);

  const [lastTimestamp, setLastTimestamp] = useState(() => {
    const stored = localStorage.getItem('lastLogTimestamp');
    return stored || new Date(Date.now() - 10 * 60 * 1000).toISOString();
  });

  useEffect(() => {
    if (lastTimestamp) {
      localStorage.setItem('lastLogTimestamp', lastTimestamp);
    }
  }, [lastTimestamp, open]);

  const formatTime = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('en-US', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit', 
        fractionalSecondDigits: 3, 
        timeZoneName: 'short' 
      });
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

  const makeClientLog = (log, animated) => ({
    ...log,
    _cid: `${new Date(log.time).getTime()}-${seqRef.current++}`,
    animated: !!animated,
  });

  // Process the log queue
  useEffect(() => {
    if (logQueue.length === 0 || processingRef.current || paused) return;

    const processBatch = () => {
      processingRef.current = true;
      
      const batchToProcess = [...logQueue];
      setLogQueue([]);
      
      if (batchToProcess.length > 0) {
        setLastTimestamp(batchToProcess[0].time);
      }

      // Sort batch oldest to newest for staggered addition
      const chronoBatch = [...batchToProcess].reverse();
      
      const batchInterval = 2000; // ms to spread batch over
      const step = batchToProcess.length > 0 ? batchInterval / (batchToProcess.length + 1) : 0;
      let currentDelay = 0;

      chronoBatch.forEach((log) => {
        setTimeout(() => {
          const newLog = makeClientLog(log, !isFirstLoad);
          setLogs((prev) => [newLog, ...prev]);
        }, currentDelay);
        currentDelay += step;
      });

      // Set processing false after all additions
      setTimeout(() => {
        processingRef.current = false;
      }, currentDelay + 100);
    };

    processBatch();
  }, [logQueue, paused, isFirstLoad]);

  const fetchLogs = async () => {
    if (paused || !open || processingRef.current) return;

    try {
      const params = { from: lastTimestamp };
      if (filterLevel !== 'all') params.level = filterLevel;

      const newLogs = await getLogs(params);

      if (Array.isArray(newLogs) && newLogs.length > 0) {
        // Order by time (most recent first)
        const orderedLogs = [...newLogs].sort((a, b) => new Date(b.time) - new Date(a.time));
        
        if (isFirstLoad) {
          // First load: add all without animation
          const mappedLogs = orderedLogs.map(l => makeClientLog(l, false));
          setLogs(prev => [...mappedLogs, ...prev]);
          setLastTimestamp(orderedLogs[0].time);
          setIsFirstLoad(false);
        } else {
          // Subsequent: add to queue for processing
          setLogQueue(prev => [...orderedLogs, ...prev]);
        }
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  // Polling interval
  useEffect(() => {
    let intervalId;
    if (open) {
      fetchLogs();
      intervalId = setInterval(fetchLogs, 3000);
    }
    return () => {
      intervalId && clearInterval(intervalId);
    };
  }, [open, filterLevel, paused, lastTimestamp]);

  // Reset on filter change
  useEffect(() => {
    if (open) {
      setLogs([]);
      setLogQueue([]);
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      setLastTimestamp(tenMinutesAgo);
      setIsFirstLoad(true);
    }
  }, [filterLevel, open]);

  // Autoscroll
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
  };

  const handleTogglePause = () => setPaused(p => !p);
  const handleFilterChange = (event) => setFilterLevel(event.target.value);

  const visibleLogs = searchText.trim()
    ? logs.filter(l => String(l.message || '').toLowerCase().includes(searchText.toLowerCase()))
    : logs;

  return (
    <div className="console-drawer" style={{ display: open ? 'block' : 'none' }}>
      <Drawer
        open={open}
        onClose={onClose}
        variant="persistent"
        classes={{ paper: 'console-paper' }}
      >
        <Toolbar className="console-toolbar">
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: '#ffffff' }}>
            {t('console.title')}
          </Typography>

          <FormControl size="small" sx={{ minWidth: 120, mr: 2 }}>
            <InputLabel
              sx={{
                color: '#ffffff',
                top: '-6px',
                '&.Mui-focused': { color: '#ffffff' },
                '&.MuiInputLabel-shrink': { transform: 'translate(14px, -9px) scale(0.75)' }
              }}
            >
              <FilterIcon fontSize="small" sx={{ mr: 1, color: '#ffffff' }} />
              {t('console.filter')}
            </InputLabel>
            <Select
              value={filterLevel}
              onChange={handleFilterChange}
              sx={{
                color: '#ffffff',
                '.MuiSvgIcon-root': { color: '#ffffff' },
                '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.4)' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#ffffff' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#ffffff' },
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
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
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder={t('console.search', 'Buscar...')}
            size="small"
            variant="outlined"
            sx={{
              mr: 2,
              width: 260,
              '& .MuiOutlinedInput-root': {
                color: '#fff',
                backgroundColor: 'rgba(255,255,255,0.08)',
                '& fieldset': { borderColor: 'rgba(255,255,255,0.4)' },
                '&:hover fieldset': { borderColor: '#fff' },
                '&.Mui-focused fieldset': { borderColor: '#fff' },
              },
              '& .MuiInputBase-input': { fontFamily: '"Ubuntu Mono","Courier New",monospace' }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#fff' }} />
                </InputAdornment>
              ),
            }}
          />

          <ButtonGroup variant="contained" size="small">
            <Button
              onClick={handleTogglePause}
              startIcon={paused ? <PlayIcon /> : <PauseIcon />}
              sx={{ backgroundColor: '#510b36', '&:hover': { backgroundColor: '#6b1650' } }}
            >
              {paused ? t('console.resume') : t('console.pause')}
            </Button>
            <Button
              onClick={handleClear}
              startIcon={<ClearIcon />}
              sx={{ backgroundColor: '#510b36', '&:hover': { backgroundColor: '#6b1650' } }}
            >
              {t('console.clear')}
            </Button>
          </ButtonGroup>

          <IconButton
            edge="end"
            onClick={onClose}
            sx={{ ml: 2, color: '#ffffff' }}
          >
            <CloseIcon />
          </IconButton>
        </Toolbar>

        <Box 
          ref={logsContainerRef}
          className="console-content"
        >
          {visibleLogs.length === 0 ? (
            <Typography variant="body2" sx={{ color: '#aaaa7f', textAlign: 'center', p: 2 }}>
              {searchText
                ? t('console.noMatches', 'Sin coincidencias para la búsqueda')
                : t('console.noLogs')}
            </Typography>
          ) : (
            visibleLogs.map((log) => (
              <ConsoleLogRow
                key={log._cid}
                log={log}
                formatTime={formatTime}
                getLogColor={getLogColor}
              />
            ))
          )}
        </Box>
      </Drawer>
    </div>
  );
};

export default ConsoleDrawer;