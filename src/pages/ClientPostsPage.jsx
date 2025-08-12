// ./src/pages/ClientPostsPage.jsx
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
  Chip,
  FormControl,
  InputLabel,
  Select,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  ThumbUp as ThumbUpIcon,
  Share as ShareIcon,
  Comment as CommentIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getClientPosts, movePostToTrash } from '../api/posts';
import usePostModal from '../hooks/usePostModal';
import Swal from 'sweetalert2';
import '../assets/css/ClientPosts.css';
import PostModal from '../components/Post/PostModal';

const cleanTextInput = (input) => {
  if (!input) return '';
  return input.toString()
    .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s-]/g, '')
    .substring(0, 30)
    .trim();
};

const DEBOUNCE_DELAY = 800;

const ClientPostsPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const {
    isOpen: postModalOpen,
    currentPost,
    openModal: openPostModal,
    closeModal: closePostModal,
    mode: postModalMode
  } = usePostModal();
  
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
    sort: 'created_at',
    order: 'desc'
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
        ...filters
      });
      
      setPosts(response.data.posts);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination.totalItems
      }));
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || t('clientPosts.errorFetching'));
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

  const handleNewPostClick = () => {
    openPostModal({
      cid: selectedCid,
      entity: '',
      description: '',
      config: {
        tags: [],
        category: tempCategory || 'General',
        moderation: {
          banned_words: []
        }
      }
    });
  };

  const handleEditPost = (post) => {
    openPostModal(post);
  };

  const handleMoveToTrash = async (entityId) => {
    const result = await Swal.fire({
      title: t('clientPosts.confirmMoveToTrashTitle'),
      text: t('clientPosts.confirmMoveToTrashText'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: t('clientPosts.moveToTrash'),
      cancelButtonText: t('clientPosts.cancel')
    });

    if (!result.isConfirmed) return;
    try {
      const response = await movePostToTrash(selectedCid, entityId);
      if (response.data.success) {
        // Mostrar notificación de éxito
        Swal.fire({
          title: t('clientPosts.movedToTrashSuccessTitle'),
          text: t('clientPosts.movedToTrashSuccessText'),
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
      console.error('Error moving to trash:', error);
      Swal.fire({
        title: t('clientPosts.moveToTrashErrorTitle'),
        text: error.message || t('clientPosts.moveToTrashErrorText'),
        icon: 'error'
      });
    }
  };

  const handlePostSave = () => {
    fetchPosts();
    closePostModal();
  };

  return (
    <Box className="client-posts-container">
      <Box className="client-header">
        <Typography variant="h4" className="title">
          {t('clientPosts.title')}
        </Typography>
        
        <Box className="actions-section">
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            className="add-button"
            onClick={handleNewPostClick}
          >
            {t('clientPosts.newPost')}
          </Button>
          
          <IconButton onClick={handleRefresh} className="refresh-button">
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>
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
            <MenuItem value="created_at">{t('clientPosts.date')}</MenuItem>
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
        <Paper className="no-client-paper">
          <Typography>{t('clientPosts.noClientSelected')}</Typography>
        </Paper>
      ) : loading ? (
        <Box className="loading-container">
          <CircularProgress />
        </Box>
      ) : error ? (
        <Paper className="error-paper">
          <Typography color="error">{error}</Typography>
          <Button onClick={handleRefresh}>{t('clientPosts.retry')}</Button>
        </Paper>
      ) : (
        <>
          <Paper className="client-paper" elevation={0}>
            <TableContainer component={Paper} className="posts-table-container" elevation={0}>
              <Table stickyHeader aria-label="client posts table">
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>{t('clientPosts.title')}</TableCell>
                    <TableCell>{t('clientPosts.category')}</TableCell>
                    <TableCell>{t('clientPosts.date')}</TableCell>
                    <TableCell>{t('clientPosts.visibility')}</TableCell>
                    <TableCell align="center">
                      <ThumbUpIcon fontSize="small" />
                    </TableCell>
                    <TableCell align="center">
                      <ShareIcon fontSize="small" />
                    </TableCell>
                    <TableCell align="center">
                      <CommentIcon fontSize="small" />
                    </TableCell>
                    <TableCell>{t('clientPosts.actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {posts.map((post) => (
                    <TableRow key={post._id} hover>
                      <TableCell>
                        <Tooltip title={post.reference || '--'} placement="top" arrow>
                          <Typography variant="body2" className="post-title">
                            {post.reference ? `...${post.reference.slice(-5)}` : '--'}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" className="post-title">
                          {post.description || t('clientPosts.noTitle')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {cleanTextInput(post.config?.category) || 'General'}
                      </TableCell>
                      <TableCell>
                        {new Date(post.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={post.config?.visibility === 'public' 
                            ? t('clientPosts.public') 
                            : t('clientPosts.private')}
                          size="small"
                          className={`visibility-chip ${post.config?.visibility}`}
                        />
                      </TableCell>
                      <TableCell align="center">
                        {post.likesCount || 0}
                      </TableCell>
                      <TableCell align="center">
                        {post.sharesCount || 0}
                      </TableCell>
                      <TableCell align="center">
                        {post.commentsCount || 0}
                      </TableCell>
                      <TableCell>
                        <IconButton 
                          size="small" 
                          aria-label={t('clientPosts.view')}
                          onClick={() => navigate(`/post/${post._id}/comments`)} >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          aria-label={t('clientPosts.edit')}
                          onClick={() => handleEditPost(post)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          aria-label={t('clientPosts.moveToTrash')}
                          onClick={() => handleMoveToTrash(post.entity)}
                        >
                          <DeleteIcon fontSize="small" />
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
              labelRowsPerPage={t('common.itemsPerPage')}
              labelDisplayedRows={({ from, to, count }) => 
                `${from}-${to} ${t('common.of')} ${count}`
              }
            />
          </Paper>
        </>
      )}
      <PostModal
        open={postModalOpen}
        onClose={closePostModal}
        initialData={currentPost}
        mode={postModalMode}
        onSave={handlePostSave}
      />
    </Box>
  );
};

export default ClientPostsPage;