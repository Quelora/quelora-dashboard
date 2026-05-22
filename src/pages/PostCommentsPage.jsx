/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

// ./src/pages/PostCommentsPage.jsx
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
    Divider,
    styled
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
import React from 'react';

const DEBOUNCE_DELAY = 800;

const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
};

const highlightText = (text, searchTerm) => {
    if (!searchTerm) return text;
    
    const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
    return parts.map((part, i) => 
        part.toLowerCase() === searchTerm.toLowerCase() 
            ? <mark key={i} style={{backgroundColor: '#ffdb4c', color: '#1A1A1A'}}>{part}</mark> 
            : part
    );
};

const truncateText = (text, maxLength = 150) => {
    if (!text) return '';
    return text.length > maxLength 
        ? `${text.substring(0, maxLength)}...` 
        : text;
};

const StyledReplyPaper = styled(Paper)(({ theme, isreply }) => ({
    padding: theme.spacing(1),
    border: '1px solid var(--border-gray)',
    marginBottom: theme.spacing(1),
    borderRadius: isreply === 'true' ? '8px 8px 8px 0' : '8px',
    backgroundColor: isreply === 'true' ? 'rgba(0, 0, 0, 0.03)' : 'var(--surface-color)',
    boxShadow: 'none',
    
    '[data-theme="dark"] &': {
        backgroundColor: isreply === 'true' ? 'rgba(255, 255, 255, 0.05)' : 'var(--surface-color)',
    },
}));


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
                ...(searchTerm && {search: searchTerm})
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
            setPagination(prev => ({...prev, page: 0}));
        }, DEBOUNCE_DELAY);
    };

    const handlePageChange = (event, newPage) => {
        setPagination(prev => ({...prev, page: newPage}));
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
            html: t('comments.banConfirmText', {user: userName}),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: t('comments.banUser'),
            cancelButtonText: t('comments.cancel')
        });

        if (result.isConfirmed) {
            Swal.fire({
                title: t('comments.bannedTitle'),
                html: t('comments.bannedText', {user: userName}),
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
                return <VisibilityIcon fontSize="small"/>;
            case 'private':
                return <VisibilityIcon fontSize="small"/>;
            case 'restricted':
                return <VisibilityIcon fontSize="small"/>;
            default:
                return <VisibilityIcon fontSize="small"/>;
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
        <Box className="post-comments-container" sx={{width: '100%', gap: 2, display: 'flex', flexDirection: 'column'}}>
            <Paper elevation={0} sx={{p: 0, background: 'var(--content-bg)'}}>
                <Box sx={{
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    p: 2, 
                    background: 'var(--card-bg)', 
                    borderRadius: '12px'
                }}>
                    <Box sx={{display: 'flex', alignItems: 'center', flexGrow: 1}}>
                        <Tooltip title={t('comments.back')}>
                            <IconButton onClick={handleBackClick} size="small" sx={{mr: 1}}>
                                <ArrowBackIcon fontSize="small"/>
                            </IconButton>
                        </Tooltip>
                        <Typography variant="h5" sx={{fontWeight: 500}}>
                            {truncateText(postConfig.description) || t('comments.title')}
                        </Typography>
                    </Box>

                    <Box sx={{display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0}}>
                        <Tooltip title={t('comments.refresh')}>
                            <IconButton onClick={handleRefresh} size="small">
                                <RefreshIcon fontSize="small"/>
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>
            </Paper>

            <Paper elevation={0} sx={{
                background: 'var(--content-bg)', 
                p: 0, 
                mb: 2
            }}>
                <Box sx={{
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: 1, 
                    p: 2,
                    background: 'var(--surface-color)', 
                    borderRadius: '12px',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                }}>
                    {/* INPUT SEARCH ÚNICO (Ocupa el espacio restante) */}
                    <TextField
                        fullWidth
                        variant="outlined"
                        size="small"
                        placeholder={t('comments.searchPlaceholder')}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        InputProps={{
                            startAdornment: <SearchIcon color="action" fontSize="small"/>,
                        }}
                        sx={{flexGrow: 1, minWidth: '150px'}}
                    />
                    
                    {/* SELECT DE ELEMENTOS POR PÁGINA (REMOVEMOS ESTE BLOQUE) 
                        Este control se gestionará mediante TablePagination en el pie.
                    
                    <FormControl size="small" sx={{minWidth: 120, flexShrink: 0}}>
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
                    */}
                </Box>
            </Paper>

            {loading ? (
                <Box className="loading-container">
                    <CircularProgress size={24}/>
                </Box>
            ) : error ? (
                <Paper className="error-paper" elevation={0} sx={{p: 3, textAlign: 'center'}}>
                    <Typography variant="body2" color="error">{error}</Typography>
                    <Button size="small" onClick={fetchComments}>{t('comments.retry')}</Button>
                </Paper>
            ) : (
                <>
                <Paper elevation={0} sx={{width: '100%', gap: 2, display: 'flex', flexDirection: 'column', p: 0}}>
                    
                    <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 1, p: 2, background: 'var(--card-bg)', borderRadius: '12px'}}>
                        <Chip 
                            label={`${t('comments.totalComments')}: ${pagination.totalItems}`} 
                            size="small" 
                        />
                        <Chip 
                            icon={<FilterAltIcon fontSize="small"/>}
                            label={`${t('comments.commentsAllowed')}: ${postConfig.allowComments ? t('comments.yes') : t('comments.no')}`} 
                            size="small" 
                        />
                        <Chip 
                            icon={<FilterAltIcon fontSize="small"/>}
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
                                    icon={<GavelIcon fontSize="small"/>}
                                    label={
                                        <Box display="flex" alignItems="center">
                                            {t('comments.moderationActive')}
                                            <ArrowDropDownIcon fontSize="small"/>
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
                                    <Box sx={{width: 320, maxWidth: '100%', p: 2}}>
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
                                    icon={<BlockIcon fontSize="small"/>}
                                    label={
                                        <Box display="flex" alignItems="center">
                                            {t('comments.bannedWords')}
                                            <ArrowDropDownIcon fontSize="small"/>
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
                                    <Box sx={{width: 320, maxWidth: '100%'}}>
                                        <List dense>
                                            <ListItem>
                                                <ListItemText
                                                    primary={t('comments.bannedWords')}
                                                    secondary={t('comments.bannedWordsCount', {count: postConfig.banned_words.length})}
                                                />
                                            </ListItem>
                                            <Divider/>
                                            <Box sx={{maxHeight: 200, overflow: 'auto'}}>
                                                {postConfig.banned_words.map((word, index) => (
                                                    <ListItem key={index} dense>
                                                        <ListItemText
                                                            primary={`${index + 1}. ${word}`}
                                                            sx={{ml: 2}}
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

                    <Box sx={{width: '100%', gap: 1, display: 'flex', flexDirection: 'column', p: 2, background: 'var(--card-bg)', borderRadius: '12px'}}>
                        {comments.length === 0 ? (
                            <Paper elevation={0} sx={{p: 2, textAlign: 'center', background: 'none'}}>
                                <Typography variant="body2">{t('comments.noComments')}</Typography>
                            </Paper>
                        ) : (
                            comments.map((comment) => (
                                <StyledReplyPaper key={comment._id} elevation={0} isreply={'false'} sx={{borderBottom: '1px solid var(--border-gray)'}}>
                                    <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                                        <Box sx={{display: 'flex', alignItems: 'center', flexGrow: 1}}>
                                            <Avatar
                                                sx={{width: 32, height: 32, mr: 1.5, flexShrink: 0}}
                                                src={comment.profile?.picture || undefined}
                                                imgProps={{style: {objectFit: 'cover'}}}
                                            >
                                                {!comment.profile?.picture && (comment.profile?.name?.charAt(0) || 'U')}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="subtitle2" sx={{fontWeight: 600}}>
                                                    {comment.profile?.name || t('comments.unknownAuthor')}
                                                </Typography>
                                                <Typography variant="caption" color="textSecondary">
                                                    {formatDate(comment.timestamp)}
                                                    {comment.isEdited && ` • ${t('comments.edited')}`}
                                                    {comment.language && comment.language !== 'un' && (
                                                        ` • ${t(`comments.language.${comment.language}`, {defaultValue: comment.language.toUpperCase()})}`
                                                    )}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Box sx={{display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0}}>
                                            <Box sx={{display: 'flex', alignItems: 'center'}}>
                                                <Tooltip title={t('comments.like')}>
                                                    <IconButton size="small" aria-label={t('comments.like')}>
                                                        <ThumbUpIcon fontSize="small" sx={{color: '#3a86ff'}}/>
                                                    </IconButton>
                                                </Tooltip>
                                                <Typography variant="caption" sx={{fontWeight: 600, minWidth: 15}}>
                                                    {comment.likes}
                                                </Typography>
                                            </Box>
                                            <Box sx={{display: 'flex', alignItems: 'center', ml: 1, gap: 0.5}}>
                                                <Tooltip title={t('comments.banUser')}>
                                                    <IconButton 
                                                        size="small"
                                                        onClick={() => handleBanUser(comment.author, comment.profile?.name)}
                                                    >
                                                        <BlockIcon fontSize="small" color="error"/>
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title={t('comments.delete')}>
                                                    <IconButton 
                                                        size="small" 
                                                        onClick={() => handleDeleteComment(comment._id)}
                                                    >
                                                        <DeleteIcon fontSize="small" color="error"/>
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </Box>
                                    </Box>

                                    <Typography sx={{mt: 1, ml: 4.7}}>
                                        {highlightText(comment.text, searchTerm)}
                                    </Typography>

                                    {comment.replies && comment.replies.length > 0 && (
                                        <>
                                            <Button
                                                size="small"
                                                startIcon={expandedReplies[comment._id] ? <ExpandLessIcon/> : <ExpandMoreIcon/>}
                                                onClick={() => toggleReplies(comment._id)}
                                                sx={{mt: 1, ml: 4.7, textTransform: 'none'}}
                                            >
                                                {expandedReplies[comment._id] ? t('comments.hideReplies') : `${comment.replies.length} ${t('comments.replies')}`}
                                            </Button>
                                            <Collapse in={expandedReplies[comment._id]}>
                                                <Box sx={{borderLeft: '2px solid #ddd', ml: 5, pl: 2, mt: 1}}>
                                                    {comment.replies.map((reply) => (
                                                        <StyledReplyPaper key={reply._id} elevation={0} isreply={'true'} sx={{p: 1.5}}>
                                                            <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                                                                <Box sx={{display: 'flex', alignItems: 'center', flexGrow: 1}}>
                                                                    <Avatar 
                                                                        sx={{width: 24, height: 24, mr: 1, flexShrink: 0}}
                                                                        src={reply.profile?.picture || undefined}
                                                                    >
                                                                        {!reply.profile?.picture && (reply.profile?.name?.charAt(0) || 'U')}
                                                                    </Avatar>
                                                                    <Box>
                                                                        <Typography variant="subtitle2" sx={{fontWeight: 600}}>
                                                                            {reply.profile?.name || t('comments.unknownAuthor')}
                                                                        </Typography>
                                                                        <Typography variant="caption" color="textSecondary">
                                                                            {formatDate(reply.timestamp)}
                                                                            {reply.language && reply.language !== 'un' && (
                                                                                ` • ${t(`comments.language.${reply.language}`, {defaultValue: reply.language.toUpperCase()})}`
                                                                            )}
                                                                        </Typography>
                                                                    </Box>
                                                                </Box>
                                                                <Box sx={{display: 'flex', alignItems: 'center', gap: 0.5}}>
                                                                    <Tooltip title={t('comments.like')}>
                                                                        <IconButton size="small" aria-label={t('comments.like')}>
                                                                            <ThumbUpIcon fontSize="small" sx={{color: '#3a86ff'}}/>
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                    <Typography variant="caption" sx={{fontWeight: 600, minWidth: 10}}>
                                                                        {reply.likes}
                                                                    </Typography>
                                                                    <Tooltip title={t('comments.banUser')}>
                                                                        <IconButton size="small" onClick={() => handleBanUser(reply.author, reply.profile?.name)}>
                                                                            <BlockIcon fontSize="small" color="error"/>
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                    <Tooltip title={t('comments.delete')}>
                                                                        <IconButton size="small" onClick={() => handleDeleteComment(reply._id)}>
                                                                            <DeleteIcon fontSize="small" color="error"/>
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                </Box>
                                                            </Box>
                                                            <Typography sx={{mt: 0.5, ml: 4}}>
                                                                {highlightText(reply.text, searchTerm)}
                                                            </Typography>
                                                        </StyledReplyPaper>
                                                    ))}
                                                </Box>
                                            </Collapse>
                                        </>
                                    )}
                                </StyledReplyPaper>
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
                    labelDisplayedRows={({from, to, count}) => 
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