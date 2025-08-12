import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Box, 
  Typography, 
  CircularProgress,
  Paper,
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  TablePagination,
  TextField,
  MenuItem,
  Button,
  IconButton,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Restore as RestoreIcon,
} from '@mui/icons-material';
import { getClientPosts, restorePostFromTrash } from '../api/posts';
import Swal from 'sweetalert2';
import '../assets/css/ClientPosts.css';

const cleanTextInput = (input) => {
  if (!input) return '';
  return input.toString()
    .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s-]/g, '')
    .substring(0, 30)
    .trim();
};

const DEBOUNCE_DELAY = 800;

const TrashPage = () => {
  const { t } = useTranslation();
  
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 0,
    limit: 10,
    total: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    sort: 'deleted_at',
    order: 'desc',
    deleted: true // Siempre filtrar por posts eliminados
  });
  const [clientList, setClientList] = useState([]);
  const [selectedCid, setSelectedCid] = useState('');
  const [tempSearch, setTempSearch] = useState('');
  const [tempCategory, setTempCategory] = useState('');
  
  const debounceTimeout = useRef(null);

  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, []);

  useEffect(() => {
    try {
      const clients = JSON.parse(sessionStorage.getItem('clients') || '[]');
      setClientList(clients);
      if (clients.length > 0) {
        setSelectedCid(clients[0].cid);
      }
    } catch (e) {
      console.error('Error loading clients:', e);
      setClientList([]);
    }
  }, []);

  const applyFilterWithDebounce = (filterName, value, callback) => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    
    debounceTimeout.current = setTimeout(() => {
      callback(filterName, value);
      setPagination(prev => ({ ...prev, page: 0 }));
    }, DEBOUNCE_DELAY);
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  const fetchPosts = useCallback(async () => {
    if (!selectedCid) return;
    
    try {
      setLoading(true);
      const response = await getClientPosts(selectedCid, {
        page: pagination.page + 1,
        limit: pagination.limit,
        ...filters,
        deleted: true // Siempre filtrar por posts eliminados
      });
      
      setPosts(response.data.posts);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination.totalItems
      }));
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || t('trash.errorFetching'));
    } finally {
      setLoading(false);
    }
  }, [selectedCid, pagination.page, pagination.limit, filters, t]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setTempSearch(value);
    applyFilterWithDebounce('search', value, handleFilterChange);
  };

  const handleCategoryChange = (e) => {
    const value = cleanTextInput(e.target.value);
    setTempCategory(value);
    applyFilterWithDebounce('category', value, handleFilterChange);
  };

  const handleSortChange = () => {
    const newOrder = filters.order === 'desc' ? 'asc' : 'desc';
    setFilters(prev => ({
      ...prev,
      order: newOrder
    }));
  };

  const handleSortFieldChange = (e) => {
    setFilters(prev => ({
      ...prev,
      sort: e.target.value
    }));
  };

  const handleCidChange = (event) => {
    setSelectedCid(event.target.value);
    setPagination(prev => ({ ...prev, page: 0 }));
  };

  const handleRefresh = () => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    fetchPosts();
  };

  const handlePageChange = (event, newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleLimitChange = (event) => {
    setPagination(prev => ({
      ...prev, 
      limit: parseInt(event.target.value),
      page: 0
    }));
  };

  const handleRestore = async (cid, entityId, description) => {
    const result = await Swal.fire({
        title: t('trash.confirmRestoreTitle'),
        text: t('trash.confirmRestoreText', { description: description || t('trash.noDescription') }),
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: t('trash.restore'),
        cancelButtonText: t('trash.cancel')
    });

    if (!result.isConfirmed) return;

    try {
        setLoading(true); // Activar carga durante la operación
        
        const response = await restorePostFromTrash(cid, entityId);

        if (response.data.success) {
          // Mostrar notificación de éxito
          await Swal.fire({
              title: t('trash.restoreSuccessTitle'),
              text: t('trash.restoreSuccessText'),
              icon: 'success',
              timer: 2000,
              timerProgressBar: true,
              showConfirmButton: false
          });

          // Actualizar la lista sin recargar toda la página
          fetchPosts();
        } else {
          throw new Error(response.error || t('trash.restoreErrorText'));
        }
    } catch (error) {
        console.error('Error restoring post:', error);
        Swal.fire({
        title: t('trash.restoreErrorTitle'),
        text: error.message || t('trash.restoreErrorText'),
        icon: 'error'
        });
    } finally {
        setLoading(false);
    }
    };

  return (
     <Box className="post-comments-container" sx={{ width: '100%', gap: 2, display: 'flex', flexDirection: 'column' }}>
      <Paper className="client-paper" elevation={0}>
        <Box className="comments-header">
          <Typography variant="h4" className="title">
            {t('trash.title')}
          </Typography>
          
          <Box className="actions-section">
            <IconButton onClick={handleRefresh} className="refresh-button">
              <RefreshIcon />
            </IconButton>
          </Box>
        </Box>
      </Paper>
      <Paper className="filters-paper client-paper" elevation={0}>
        <Box className="filters-container">
          {clientList.length > 0 && (
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>{t('clientPosts.selectClient')}</InputLabel>
              <Select
                value={selectedCid}
                onChange={handleCidChange}
                label={t('clientPosts.selectClient')}
                className="client-select"
              >
                {clientList.map(client => (
                  <MenuItem key={client.cid} value={client.cid}>
                    {client.description || client.cid}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <TextField
            label={t('clientPosts.search')}
            variant="outlined"
            size="small"
            className="search-field"
            InputProps={{
              startAdornment: <SearchIcon color="action" />
            }}
            value={tempSearch}
            onChange={handleSearchChange}
          />
          
          <TextField
            label={t('clientPosts.category')}
            variant="outlined"
            size="small"
            className="filter-field"
            value={tempCategory}
            onChange={handleCategoryChange}
            inputProps={{ maxLength: 30 }}
          />
          
          <TextField
            select
            label={t('clientPosts.sortBy')}
            variant="outlined"
            size="small"
            className="filter-field"
            value={filters.sort}
            onChange={handleSortFieldChange}
          >
            <MenuItem value="deleted_at">{t('trash.deletedDate')}</MenuItem>
            <MenuItem value="title">{t('clientPosts.title')}</MenuItem>
          </TextField>
          
          <IconButton 
            className="more-filters-button"
            onClick={handleSortChange}
            aria-label={filters.order === 'desc' ? t('clientPosts.sortDesc') : t('clientPosts.sortAsc')}
          >
            <FilterListIcon />
            {filters.order === 'desc' ? (
              <ArrowDownwardIcon fontSize="small" />
            ) : (
              <ArrowUpwardIcon fontSize="small" />
            )}
          </IconButton>
        </Box>
      </Paper>

      {!selectedCid ? (
        <Paper className="no-client-paper client-paper">
          <Typography>{t('clientPosts.noClientSelected')}</Typography>
        </Paper>
      ) : loading ? (
        <Box className="loading-container client-paper">
          <CircularProgress />
        </Box>
      ) : error ? (
        <Paper className="error-paper client-paper">
          <Typography color="error">{error}</Typography>
          <Button onClick={handleRefresh}>{t('trash.retry')}</Button>
        </Paper>
      ) : (
        <>
        <Paper className="client-paper" elevation={0} sx={{ width: '100%', gap: 2, display: 'flex', flexDirection: 'column' }}>
          <TableContainer component={Paper} className="posts-table-container" elevation={0}>
            <Table stickyHeader aria-label="trash items table">
              <TableHead>
                <TableRow>
                  <TableCell>{t('trash.description')}</TableCell>
                  <TableCell>{t('trash.category')}</TableCell>
                  <TableCell>{t('trash.deletedDate')}</TableCell>
                  <TableCell>{t('trash.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {posts.map((post) => (
                  <TableRow key={post._id} hover>
                    <TableCell>
                      <Typography variant="body2" className="post-title">
                        {post.description || t('trash.noDescription')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {cleanTextInput(post.config?.category) || 'General'}
                    </TableCell>
                    <TableCell>
                      {new Date(post.deleted_at || post.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <IconButton 
                        onClick={() => handleRestore(post.cid, post.entity, post.description)} 
                        aria-label={t('trash.restore')}
                      >
                        <RestoreIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={pagination.total}
            rowsPerPage={pagination.limit}
            page={pagination.page}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleLimitChange}
            className="pagination"
          />
        </Paper>
        </>
      )}
    </Box>
  );
};

export default TrashPage;