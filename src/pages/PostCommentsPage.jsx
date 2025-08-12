import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Box, 
  Typography, 
  CircularProgress,
  Paper,
  TextField,
  IconButton,
  Button,
  Chip,
  Avatar,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Collapse,
  Tooltip,
  Menu,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  ArrowBack as ArrowBackIcon,
  Delete as DeleteIcon,
  ThumbUp as ThumbUpIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Block as BlockIcon,
  Visibility as VisibilityIcon,
  FilterAlt as FilterAltIcon,
  Gavel as GavelIcon,
  ArrowDropDown as ArrowDropDownIcon
} from '@mui/icons-material';

import { getPostComments } from '../api/posts';
import Swal from 'sweetalert2';
import '../assets/css/PostComments.css';

const DEBOUNCE_DELAY = 800;

const formatDate = (timestamp) => {
  return new Date(timestamp).toLocaleString();
};

const highlightText = (text, searchTerm) => {
  if (!searchTerm) return text;
  
  const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
  return parts.map((part, i) => 
    part.toLowerCase() === searchTerm.toLowerCase() 
      ? <mark key={i} className="search-highlight">{part}</mark> 
      : part
  );
};

const truncateText = (text, maxLength = 150) => {
  if (!text) return '';
  return text.length > maxLength 
    ? `${text.substring(0, maxLength)}...` 
    : text;
};

const PostCommentsPage = () => {
  const { t } = useTranslation();
  const { postId } = useParams();
  const navigate = useNavigate();
  
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    page: 0,
    limit: 10,
    totalItems: 0
  });
  const [postConfig, setPostConfig] = useState({
    allowComments: true,
    toxicityFilter: true,
    visibility: 'public',
    banned_words: [],
    enable_content_moderation: true,
    moderation_prompt: '',
    description: ''
  });
  const [expandedReplies, setExpandedReplies] = useState({});
  const [promptAnchorEl, setPromptAnchorEl] = useState(null);
  const [wordsAnchorEl, setWordsAnchorEl] = useState(null);

  const debounceTimeout = useRef(null);

  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, []);

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getPostComments(postId, {
        page: pagination.page + 1,
        limit: pagination.limit,
        ...(searchTerm && { search: searchTerm })
      });
      
      setComments(response.data.comments);
      setPostConfig(response.data.postConfig);
      setPagination(prev => ({
        ...prev,
        totalItems: response.data.pagination.totalItems
      }));
      setError(null);

      const initialExpanded = {};
      response.data.comments.forEach(comment => {
        if (comment.replies?.length > 0) {
          if (searchTerm) {
            const hasMatchInReplies = comment.replies.some(reply => 
              reply.text.toLowerCase().includes(searchTerm.toLowerCase())
            );
            initialExpanded[comment._id] = hasMatchInReplies;
          } else {
            initialExpanded[comment._id] = false;
          }
        }
      });
      setExpandedReplies(initialExpanded);
    } catch (err) {
      setError(err.response?.data?.error || t('comments.errorFetching'));
    } finally {
      setLoading(false);
    }
  }, [postId, pagination.page, pagination.limit, searchTerm, t]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSearchChange = (value) => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    
    debounceTimeout.current = setTimeout(() => {
      setSearchTerm(value);
      setPagination(prev => ({ ...prev, page: 0 }));
    }, DEBOUNCE_DELAY);
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

  const handleBackClick = () => {
    navigate('/posts');
  };

  const handleRefresh = () => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    fetchComments();
  };

  const toggleReplies = (commentId) => {
    setExpandedReplies(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  const handleDeleteComment = async (commentId) => {
    const result = await Swal.fire({
      title: t('comments.deleteConfirmTitle'),
      text: t('comments.deleteConfirmText'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: t('comments.delete'),
      cancelButtonText: t('comments.cancel')
    });

    if (result.isConfirmed) {
      // await deleteComment(postId, commentId);
      Swal.fire({
        title: t('comments.deletedTitle'),
        text: t('comments.deletedText'),
        icon: 'success',
        timer: 1500
      });
      fetchComments();
    }
  };

  const handleBanUser = async (userId, userName) => {
    const result = await Swal.fire({
      title: t('comments.banConfirmTitle'),
      html: t('comments.banConfirmText', { user: userName }),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: t('comments.banUser'),
      cancelButtonText: t('comments.cancel')
    });

    if (result.isConfirmed) {
      // await banUser(userId);
      Swal.fire({
        title: t('comments.bannedTitle'),
        html: t('comments.bannedText', { user: userName }),
        icon: 'success',
        timer: 1500
      });
      fetchComments();
    }
  };

  const handleOpenPromptMenu = (event) => {
    setPromptAnchorEl(event.currentTarget);
  };

  const handleClosePromptMenu = () => {
    setPromptAnchorEl(null);
  };

  const handleOpenWordsMenu = (event) => {
    setWordsAnchorEl(event.currentTarget);
  };

  const handleCloseWordsMenu = () => {
    setWordsAnchorEl(null);
  };

  const renderVisibilityIcon = () => {
    switch (postConfig.visibility) {
      case 'public':
        return <VisibilityIcon fontSize="small" />;
      case 'private':
        return <VisibilityIcon fontSize="small" />;
      case 'restricted':
        return <VisibilityIcon fontSize="small" />;
      default:
        return <VisibilityIcon fontSize="small" />;
    }
  };

  const renderVisibilityLabel = () => {
    switch (postConfig.visibility) {
      case 'public':
        return t('comments.visibility.public');
      case 'private':
        return t('comments.visibility.private');
      case 'restricted':
        return t('comments.visibility.restricted');
      default:
        return postConfig.visibility;
    }
  };

  return (
    <Box className="post-comments-container" sx={{ width: '100%', gap: 2, display: 'flex', flexDirection: 'column' }}>
      <Paper className="client-paper" elevation={0}>
        <Box className="comments-header">
          <Tooltip title={t('comments.back')}>
            <IconButton onClick={handleBackClick} className="back-button" size="small">
              <ArrowBackIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Typography variant="subtitle1" className="title">
            {truncateText(postConfig.description) || `Post #${postId}`}
          </Typography>
          <Tooltip title={t('comments.refresh')}>
            <IconButton onClick={handleRefresh} className="refresh-button" size="small">
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>

      <Paper className="search-paper client-paper" elevation={0}>
        <Box className="filters-container">
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            placeholder={t('comments.searchPlaceholder')}
            onChange={(e) => handleSearchChange(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon color="action" fontSize="small" />,
            }}
          />
          
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>{t('comments.itemsPerPage')}</InputLabel>
            <Select
              value={pagination.limit}
              onChange={handleLimitChange}
              label={t('comments.itemsPerPage')}
            >
              <MenuItem value={5}>5</MenuItem>
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={25}>25</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {loading ? (
        <Box className="loading-container">
          <CircularProgress size={24} />
        </Box>
      ) : error ? (
        <Paper className="error-paper" elevation={0}>
          <Typography variant="body2" color="error">{error}</Typography>
          <Button size="small" onClick={fetchComments}>{t('comments.retry')}</Button>
        </Paper>
      ) : (
        <>
        <Paper className="client-paper" elevation={0} sx={{ width: '100%', gap: 2, display: 'flex', flexDirection: 'column' }}>
          <Box className="comments-stats">
            <Chip 
              label={`${t('comments.totalComments')}: ${pagination.totalItems}`} 
              size="small" 
            />
            <Chip 
              icon={<FilterAltIcon fontSize="small" />}
              label={`${t('comments.commentsAllowed')}: ${postConfig.allowComments ? t('comments.yes') : t('comments.no')}`} 
              size="small" 
            />
            <Chip 
              icon={<FilterAltIcon fontSize="small" />}
              label={`${t('comments.toxicityFilter')}: ${postConfig.toxicityFilter ? t('comments.active') : t('comments.inactive')}`} 
              size="small" 
            />
            <Chip 
              icon={renderVisibilityIcon()}
              label={`${t('comments.visibility.label')}: ${renderVisibilityLabel()}`} 
              size="small" 
            />
            {postConfig.enable_content_moderation && (
              <>
                <Chip 
                  icon={<GavelIcon fontSize="small" />}
                  label={
                    <Box display="flex" alignItems="center">
                      {t('comments.moderationActive')}
                      <ArrowDropDownIcon fontSize="small" />
                    </Box>
                  }
                  size="small"
                  onClick={handleOpenPromptMenu}
                  clickable
                />
                <Menu
                  anchorEl={promptAnchorEl}
                  open={Boolean(promptAnchorEl)}
                  onClose={handleClosePromptMenu}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                  }}
                >
                  <Box sx={{ width: 320, maxWidth: '100%', p: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      {t('comments.moderationPromptTitle')}
                    </Typography>
                    <Typography variant="body2">
                      {postConfig.moderation_prompt || t('comments.noModerationPrompt')}
                    </Typography>
                  </Box>
                </Menu>
              </>
            )}
            {postConfig.banned_words && postConfig.banned_words.length > 0 && (
              <>
                <Chip 
                  icon={<BlockIcon fontSize="small" />}
                  label={
                    <Box display="flex" alignItems="center">
                      {t('comments.bannedWords')}
                      <ArrowDropDownIcon fontSize="small" />
                    </Box>
                  }
                  size="small"
                  onClick={handleOpenWordsMenu}
                  clickable
                />
                <Menu
                  anchorEl={wordsAnchorEl}
                  open={Boolean(wordsAnchorEl)}
                  onClose={handleCloseWordsMenu}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                  }}
                >
                  <Box sx={{ width: 320, maxWidth: '100%' }}>
                    <List dense>
                      <ListItem>
                        <ListItemText
                          primary={t('comments.bannedWords')}
                          secondary={t('comments.bannedWordsCount', { count: postConfig.banned_words.length })}
                        />
                      </ListItem>
                      <Divider />
                      <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                        {postConfig.banned_words.map((word, index) => (
                          <ListItem key={index} dense>
                            <ListItemText
                              primary={`${index + 1}. ${word}`}
                              sx={{ ml: 2 }}
                            />
                          </ListItem>
                        ))}
                      </Box>
                    </List>
                  </Box>
                </Menu>
              </>
            )}
          </Box>

          <Box className="comments-list" sx={{ width: '100%', gap: 2, display: 'flex', flexDirection: 'column' }}>
            {comments.length === 0 ? (
              <Paper className="no-comments-paper" elevation={0}>
                <Typography variant="body2">{t('comments.noComments')}</Typography>
              </Paper>
            ) : (
              comments.map((comment) => (
                <Paper key={comment._id} className="comment-item" elevation={0}>
                  <Box className="comment-header" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box className="comment-author" sx={{ flexGrow: 1 }}>
                      <Avatar
                          className="comment-avatar"
                          src={comment.profile?.picture || undefined}
                          imgProps={{ style: { objectFit: 'cover' } }}
                        >
                          {!comment.profile?.picture && (comment.profile?.name?.charAt(0) || 'U')}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" className="author-name">
                          {comment.profile?.name || t('comments.unknownAuthor')}
                        </Typography>
                        <Typography variant="caption" className="comment-date">
                          {formatDate(comment.timestamp)}
                          {comment.isEdited && ` • ${t('comments.edited')}`}
                          {comment.language && comment.language !== 'un' && (
                            ` • ${t(`comments.language.${comment.language}`, { defaultValue: comment.language.toUpperCase() })}`
                          )}
                        </Typography>
                      </Box>
                    </Box>
                    <Box className="comment-actions-container" sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box className="comment-actions">
                        <Tooltip title={t('comments.like')}>
                          <IconButton size="small" aria-label={t('comments.like')}>
                            <ThumbUpIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Typography variant="caption" className="like-count">
                          {comment.likes}
                        </Typography>
                      </Box>
                      <Box className="comment-admin-actions">
                        <Tooltip title={t('comments.banUser')}>
                          <IconButton 
                            size="small"
                            onClick={() => handleBanUser(comment.author, comment.profile?.name)}
                          >
                            <BlockIcon fontSize="small" color="error" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t('comments.delete')}>
                          <IconButton 
                            size="small" 
                            onClick={() => handleDeleteComment(comment._id)}
                          >
                            <DeleteIcon fontSize="small" color="error" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </Box>

                  <Typography className="comment-text">
                    {highlightText(comment.text, searchTerm)}
                  </Typography>

                  {comment.replies && comment.replies.length > 0 && (
                    <>
                      <Button
                        size="small"
                        startIcon={expandedReplies[comment._id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        onClick={() => toggleReplies(comment._id)}
                        className="show-replies-btn"
                      >
                        {expandedReplies[comment._id] ? t('comments.hideReplies') : `${comment.replies.length} ${t('comments.replies')}`}
                      </Button>
                      <Collapse in={expandedReplies[comment._id]}>
                        <Box className="comment-replies">
                          {comment.replies.map((reply) => (
                            <Paper key={reply._id} className="reply-item" elevation={0}>
                              <Box className="reply-header" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box className="reply-author" sx={{ flexGrow: 1 }}>
                                  <Avatar className="reply-avatar">
                                    {reply.profile?.name?.charAt(0) || 'U'}
                                  </Avatar>
                                  <Box>
                                    <Typography variant="subtitle2" className="author-name">
                                      {reply.profile?.name || t('comments.unknownAuthor')}
                                    </Typography>
                                    <Typography variant="caption" className="reply-date">
                                      {formatDate(reply.timestamp)}
                                      {reply.language && reply.language !== 'un' && (
                                        ` • ${t(`comments.language.${reply.language}`, { defaultValue: reply.language.toUpperCase() })}`
                                      )}
                                    </Typography>
                                  </Box>
                                </Box>
                                <Box className="comment-actions-container" sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Box className="comment-actions">
                                    <Tooltip title={t('comments.like')}>
                                      <IconButton size="small" aria-label={t('comments.like')}>
                                        <ThumbUpIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                    <Typography variant="caption" className="like-count">
                                      {reply.likes}
                                    </Typography>
                                  </Box>
                                  <Box className="comment-admin-actions">
                                    <Tooltip title={t('comments.banUser')}>
                                      <IconButton 
                                        size="small"
                                        onClick={() => handleBanUser(reply.author, reply.profile?.name)}
                                      >
                                        <BlockIcon fontSize="small" color="error" />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title={t('comments.delete')}>
                                      <IconButton 
                                        size="small" 
                                        onClick={() => handleDeleteComment(reply._id)}
                                      >
                                        <DeleteIcon fontSize="small" color="error" />
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
                                </Box>
                              </Box>
                              <Typography className="reply-text">
                                {highlightText(reply.text, searchTerm)}
                              </Typography>
                            </Paper>
                          ))}
                        </Box>
                      </Collapse>
                    </>
                  )}
                </Paper>
              ))
            )}
          </Box>
        </Paper>
        <TablePagination
          component="div"
          count={pagination.totalItems}
          rowsPerPage={pagination.limit}
          page={pagination.page}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleLimitChange}
          rowsPerPageOptions={[5, 10, 25]}
          labelRowsPerPage={t('common.itemsPerPage')}
          labelDisplayedRows={({ from, to, count }) => 
            `${from}-${to} ${t('common.of')} ${count}`
          }
          className="pagination"
        />
        </>
      )}
    </Box>
  );
};

export default PostCommentsPage;