/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

import React, { useState, useCallback } from 'react';
import {
    Box,
    TextField,
    List,
    ListItem,
    ListItemText,
    IconButton,
    CircularProgress,
    Typography,
    Paper,
    InputAdornment
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Search as SearchIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { getClientPosts } from '../../api/posts'; 
import useDebounce from '../../hooks/useDebounce';

const CreativePostSelector = ({ cid, value = [], onChange, t }) => {
    const { t: tCommon } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    const handleSearch = useCallback(async () => {
        if (!debouncedSearchTerm) {
            setSearchResults([]);
            return;
        }
        // If no CID selected (due to multi-selection without primary context), don't search
        if (!cid) {
             console.warn('Post search skipped: No primary CID context available.');
             return;
        }
        
        setLoading(true);
        try {
            const response = await getClientPosts(cid, {
                search: debouncedSearchTerm,
                limit: 10,
                deleted: false
            });
            
            const posts = response.data?.posts || [];
            
            const currentPostIds = new Set(value.map(p => p._id));
            setSearchResults(posts.filter(p => p && !currentPostIds.has(p._id)));
        } catch (error) {
            console.error("Error searching posts:", error);
            setSearchResults([]);
        } finally {
            setLoading(false);
        }
    }, [debouncedSearchTerm, cid, value]);

    React.useEffect(() => {
        handleSearch();
    }, [handleSearch]);

    const addPost = (post) => {
        const newPostEntry = { 
            _id: post._id, 
            entity: post.entity, 
            title: post.title || post.reference,
            reference: post.reference
        };
        onChange([...value, newPostEntry]);
        
        setSearchResults(prevResults => prevResults.filter(p => p._id !== post._id));
    };

    const removePost = (_id) => {
        onChange(value.filter(p => p._id !== _id));
        handleSearch();
    };

    return (
        <Box>
            <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary', mb: 1 }}>
                {t('campaign.postTargeting', 'Post Targeting (Optional)')}
            </Typography>
            {!cid ? (
                <Typography variant="caption" color="error" sx={{ mb: 1, display: 'block' }}>
                    {t('campaign.selectClientFirst', 'Please select at least one client in the General tab to search for posts.')}
                </Typography>
            ) : (
                <TextField
                    label={t('campaign.searchPost', 'Search for a post by title or reference')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    fullWidth
                    size="small"
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon/>
                            </InputAdornment>
                        ),
                    }}
                />
            )}
            
            {loading && <CircularProgress size={24} sx={{ mt: 1 }}/>}
            
            {!loading && searchResults.length > 0 && (
                <Paper variant="outlined" sx={{ mt: 1, maxHeight: 200, overflow: 'auto' }}>
                    <List dense>
                        {searchResults.filter(Boolean).map(post => (
                            <ListItem
                                key={post?._id}
                                secondaryAction={
                                    <IconButton edge="end" aria-label="add" onClick={() => addPost(post)}>
                                        <AddIcon/>
                                    </IconButton>
                                }
                            >
                                <ListItemText
                                    primary={post?.title || post?.reference || tCommon('clientPosts.noTitle')}
                                    secondary={post?.reference || post?.entity}
                                />
                            </ListItem>
                        ))}
                    </List>
                </Paper>
            )}

            <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                {t('campaign.postTargetingHelp', 'If no posts are selected, the creative will run on all posts that use this placement. If one or more posts are selected, it will ONLY run on those posts.')}
            </Typography>

            {value.length > 0 && (
                <Paper variant="outlined" sx={{ mt: 2, background: 'var(--content-bg)', maxHeight: 200, overflow: 'auto' }}>
                    <List dense>
                        <ListItem>
                            <ListItemText primaryTypographyProps={{ variant: 'subtitle2', fontWeight: 'bold' }}>
                                {t('campaign.addedPosts', 'Added Posts')} ({value.length})
                            </ListItemText>
                        </ListItem>
                        {value.filter(Boolean).map(post => (
                            <ListItem
                                key={post?._id}
                                secondaryAction={
                                    <IconButton edge="end" aria-label="delete" onClick={() => removePost(post._id)}>
                                        <DeleteIcon color="error" fontSize="small"/>
                                    </IconButton>
                                }
                            >
                                <ListItemText
                                    primary={post?.title || post?.reference || tCommon('clientPosts.noTitle')}
                                    secondary={post?.entity || post?._id}
                                />
                            </ListItem>
                        ))}
                    </List>
                </Paper>
            )}
        </Box>
    );
};

export default CreativePostSelector;