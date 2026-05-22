/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

// filepath: ./src/components/Survey/SurveyPostsTab.jsx
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

const SurveyPostsTab = ({ formData, handlePostsChange, t }) => {
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
        setLoading(true);
        try {
            const cid = formData.cid || sessionStorage.getItem('currentCid');
            const response = await getClientPosts(cid, {
                search: debouncedSearchTerm,
                limit: 10,
                deleted: false
            });
            
            const posts = response.data?.posts || [];
            
            const currentPostIds = new Set(formData.posts.map(p => p._id));
            setSearchResults(posts.filter(p => p && !currentPostIds.has(p._id)));
        } catch (error) {
            console.error("Error searching posts:", error);
            setSearchResults([]);
        } finally {
            setLoading(false);
        }
    }, [debouncedSearchTerm, formData.cid, formData.posts]);

    React.useEffect(() => {
        handleSearch();
    }, [handleSearch]);

    const addPost = (post) => {
        const newPostEntry = { 
            _id: post._id, 
            entity: post.entity, 
            title: post.title || post.reference 
        };
        handlePostsChange([...formData.posts, newPostEntry]);
        
        // (Fix 4) Actualizar resultados de búsqueda sin limpiar el término
        setSearchResults(prevResults => prevResults.filter(p => p._id !== post._id));
    };

    const removePost = (_id) => {
        handlePostsChange(formData.posts.filter(p => p._id !== _id));
        // Opcional: Si queremos que reaparezca en la búsqueda, forzamos un refetch
        handleSearch();
    };

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                {t('survey.associatedPosts')}
            </Typography>
            <TextField
                label={t('survey.searchPostByTitle')}
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
                                    primary={post?.title || tCommon('clientPosts.noTitle')}
                                    secondary={post?.reference}
                                />
                            </ListItem>
                        ))}
                    </List>
                </Paper>
            )}

            <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
                {t('survey.addedPosts')} ({formData.posts.length})
            </Typography>
            <Paper variant="outlined" sx={{ mt: 1, maxHeight: 200, overflow: 'auto' }}>
                <List dense>
                    {formData.posts.length === 0 ? (
                        <ListItem>
                            <ListItemText primary={t('survey.noPostsAdded')}/>
                        </ListItem>
                    ) : (
                        formData.posts.filter(Boolean).map(post => (
                            <ListItem
                                key={post?._id}
                                secondaryAction={
                                    <IconButton edge="end" aria-label="delete" onClick={() => removePost(post._id)}>
                                        <DeleteIcon color="error"/>
                                    </IconButton>
                                }
                            >
                                <ListItemText
                                    primary={post?.title || t('clientPosts.noTitle')}
                                    secondary={post?._id}
                                />
                            </ListItem>
                        ))
                    )}
                </List>
            </Paper>
        </Box>
    );
};

export default SurveyPostsTab;