// ./src/pages/UserPage.jsx
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
  Avatar,
  Tooltip
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  Bookmark as BookmarkIcon,
  Comment as CommentIcon,
  People as PeopleIcon,
  Favorite as FavoriteIcon,
  ArrowDownward as ArrowDownwardIcon,
  ArrowUpward as ArrowUpwardIcon,  
  Share as ShareIcon,
  Notifications as NotificationsIcon,
  Email as EmailIcon,
  Send as SendIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getUsersByClient } from '../api/users';
import { vapid } from '../api/vapid';
import Swal from 'sweetalert2';
import '../assets/css/Users.css';

const cleanTextInput = (input) => {
  if (!input) return '';
  return input.toString()
    .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s-]/g, '')
    .substring(0, 30)
    .trim();
};

const DEBOUNCE_DELAY = 800;

const UsersPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 0,
    limit: 10,
    total: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    sort: 'created_at',
    order: 'desc'
  });
  const [clientList, setClientList] = useState([]);
  const [selectedCid, setSelectedCid] = useState('');
  const [tempSearch, setTempSearch] = useState('');
  
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
      if (Array.isArray(clients) && clients.length > 0) {
        setClientList(clients);
        setSelectedCid(clients[0].cid);
      } else {
        setError(t('users.noClientsAvailable'));
      }
    } catch (e) {
      console.error('Error loading clients:', e);
      setClientList([]);
      setError(t('users.errorLoadingClients'));
    }
  }, [t]);

  const applyFilterWithDebounce = (filterName, value) => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    
    debounceTimeout.current = setTimeout(() => {
      setFilters(prev => ({ ...prev, [filterName]: value }));
      setPagination(prev => ({ ...prev, page: 0 }));
    }, DEBOUNCE_DELAY);
  };

  const fetchUsers = useCallback(async () => {
    if (!selectedCid) return;
    
    try {
      setLoading(true);
      const response = await getUsersByClient(selectedCid, {
        page: pagination.page + 1,
        limit: pagination.limit,
        search: filters.search
      });
  
      setUsers(response.data.users || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination.totalItems || 0
      }));
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || t('users.errorFetching'));
    } finally {
      setLoading(false);
    }
  }, [selectedCid, pagination.page, pagination.limit, filters.search, t]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSendPushNotification = async (userId) => {
    const { value: message } = await Swal.fire({
      title: t('users.send_push_title'),
      input: 'text',
      inputLabel: t('users.push_message'),
      inputPlaceholder: t('users.enter_message_placeholder'),
      showCancelButton: true,
      confirmButtonText: t('common.send'),
      cancelButtonText: t('common.cancel'),
      inputValidator: (value) => {
        if (!value) {
          return t('users.message_required');
        }
      }
    });

    if (message) {
      try {
        await vapid(selectedCid, userId, t('users.new_message'), message);
        Swal.fire({
          title: t('common.success'),
          text: t('users.push_sent_success'),
          icon: 'success'
        });
      } catch (error) {
        Swal.fire({
          title: t('common.error'),
          text: t('users.push_send_error'),
          icon: 'error'
        });
      }
    }
  };

  const handleSearchChange = (e) => {
    const value = cleanTextInput(e.target.value);
    setTempSearch(value);
    applyFilterWithDebounce('search', value);
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
    fetchUsers();
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

  const handleBanUser = async (userId, isBanned) => {
    const action = isBanned ? 'unban' : 'ban';
    const result = await Swal.fire({
      title: t(`users.confirm${action.charAt(0).toUpperCase() + action.slice(1)}Title`),
      text: t(`users.confirm${action.charAt(0).toUpperCase() + action.slice(1)}Text`),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: t(`users.${action}`),
      cancelButtonText: t('users.cancel')
    });

    if (!result.isConfirmed) return;
    try {
      // Implementar lógica de ban/unban si existe en la API
      await Swal.fire({
        title: t(`users.${action}SuccessTitle`),
        text: t(`users.${action}SuccessText`),
        icon: 'success',
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false
      });
      fetchUsers();
    } catch (error) {
      Swal.fire({
        title: t(`users.${action}ErrorTitle`),
        text: error.message || t(`users.${action}ErrorText`),
        icon: 'error'
      });
    }
  };

  const handleViewComments = (userId) => {
    Swal.fire({
      title: t('users.comments'),
      text: t('users.commentsFeatureComing'),
      icon: 'info',
      confirmButtonText: t('common.ok')
    });
  };

  return (
    <Box className="users-container">
      <Box className="client-header">
        <Typography variant="h4" className="title">
          {t('users.title')}
        </Typography>
        
        <Box className="actions-section">
          <IconButton onClick={handleRefresh} className="refresh-button">
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>
      <Paper className="filters-paper client-paper" elevation={0}>
        <Box className="filters-container">
          {Array.isArray(clientList) && clientList.length > 0 ? (
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>{t('users.selectClient')}</InputLabel>
              <Select
                value={selectedCid}
                onChange={handleCidChange}
                label={t('users.selectClient')}
                className="client-select"
              >
                {clientList.map(client => (
                  <MenuItem key={client.cid} value={client.cid}>
                    {client.description || client.cid}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : null}

          <TextField
            label={t('users.search')}
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
            select
            label={t('users.sortBy')}
            variant="outlined"
            size="small"
            className="filter-field"
            value={filters.sort}
            onChange={handleSortFieldChange}
          >
            <MenuItem value="created_at">{t('users.date')}</MenuItem>
            <MenuItem value="name">{t('users.name')}</MenuItem>
          </TextField>
          
          <IconButton 
            className="more-filters-button"
            onClick={handleSortChange}
            aria-label={filters.order === 'desc' ? t('users.sortDesc') : t('users.sortAsc')}
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
          <Typography>{t('users.noClientSelected')}</Typography>
        </Paper>
      ) : loading ? (
        <Box className="loading-container">
          <CircularProgress />
        </Box>
      ) : error ? (
        <Paper className="error-paper">
          <Typography color="error">{error}</Typography>
          <Button onClick={handleRefresh}>{t('users.retry')}</Button>
        </Paper>
      ) : (
        <>
          <Paper className="client-paper" elevation={0}>
            <TableContainer component={Paper} className="users-table-container" elevation={0}>
              <Table stickyHeader aria-label="users table">
                <TableHead>
                  <TableRow>
                    <TableCell></TableCell>
                    <TableCell>{t('users.name')}</TableCell>
                    <TableCell>{t('users.givenName')}</TableCell>
                    <TableCell>{t('users.familyName')}</TableCell>
                    <TableCell>{t('users.city')}</TableCell>
                    <TableCell>{t('users.country')}</TableCell>
                    <TableCell>
                      <Tooltip title={t('users.pushNotifications')}>
                        <NotificationsIcon fontSize="small" />
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Tooltip title={t('users.bookmarks')}>
                        <BookmarkIcon fontSize="small" />
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Tooltip title={t('users.comments')}>
                        <CommentIcon fontSize="small" />
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Tooltip title={t('users.followers')}>
                        <PeopleIcon fontSize="small" />
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Tooltip title={t('users.following')}>
                        <PeopleIcon fontSize="small" />
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Tooltip title={t('users.likes')}>
                        <FavoriteIcon fontSize="small" />
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Tooltip title={t('users.shares')}>
                        <ShareIcon fontSize="small" />
                      </Tooltip>
                    </TableCell>
                    <TableCell>{t('users.date')}</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user._id} hover>
                      <TableCell>
                        <Avatar
                          className="comment-avatar"
                          src={user?.picture || undefined}
                          imgProps={{ style: { objectFit: 'cover' } }}
                        >
                          {!user?.picture && (user?.name?.charAt(0) || 'U')}
                        </Avatar>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" className="user-title">
                            {user.name || t('users.noName')}
                          </Typography>
                          {user.email && (
                            <Typography 
                              variant="body2" 
                              color="textSecondary"
                              sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}
                            >
                              <EmailIcon fontSize="small" sx={{ mr: 0.5 }} />
                              <a 
                                href={`mailto:${user.email}`} 
                                style={{ 
                                  textDecoration: 'none', 
                                  color: 'inherit',
                                  display: 'flex',
                                  alignItems: 'center'
                                }}
                              >
                                {user.email}
                              </a>
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {user.given_name || '--'}
                      </TableCell>
                      <TableCell>
                        {user.family_name || '--'}
                      </TableCell>
                      <TableCell>
                        {user.location?.city || '--'}
                      </TableCell>
                      <TableCell>
                        {user.location?.countryCode || '--'}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Chip 
                            label={user.settings?.notifications?.push 
                              ? t('users.enabled') 
                              : t('users.disabled')}
                            size="small"
                            className={`push-chip ${user.settings?.notifications?.push ? 'enabled' : 'disabled'}`}
                          />
                          <Chip 
                            label={user.pushSubscriptions?.length || 0}
                            size="small"
                            className="sub
                            scription-chip"
                          />
                          {user.pushSubscriptions?.length > 0 && (
                            <Tooltip title={t('users.send_push')}>
                              <IconButton 
                                size="small"
                                onClick={() => handleSendPushNotification(user.author)}
                              >
                                <SendIcon fontSize="small" color="primary" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={user.bookmarksCount || 0}
                          size="small"
                          className="count-chip"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={user.commentsCount || 0}
                          size="small"
                          className="count-chip"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={user.followersCount || 0}
                          size="small"
                          className="count-chip"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={user.followingCount || 0}
                          size="small"
                          className="count-chip"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={user.likesCount || 0}
                          size="small"
                          className="count-chip"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={user.sharesCount || 0}
                          size="small"
                          className="count-chip"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton 
                            size="small"
                            aria-label={t('users.viewComments')}
                            onClick={() => handleViewComments(user._id)}
                          >
                            <CommentIcon fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            aria-label={user.isBanned ? t('users.unban') : t('users.ban')}
                            onClick={() => handleBanUser(user._id, user.isBanned)}
                          >
                            {user.isBanned ? (
                              <CheckCircleIcon fontSize="small" />
                            ) : (
                              <BlockIcon fontSize="small" />
                            )}
                          </IconButton>
                        </Box>
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
    </Box>
  );
};

export default UsersPage;