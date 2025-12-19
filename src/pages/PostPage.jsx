// ./src/pages/PostPage.jsx
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, CircularProgress, Paper, Typography } from '@mui/material';
import PostForm from '../components/Post/PostForm';
import { loadClientsFromSession } from '../api/auth';
import React from 'react';

const getClientConfig = (clienteId) => {
    if (!clienteId) return {};

    const clients = loadClientsFromSession();
    const client = clients.find(c => c.cid === clienteId);
    
    return client?.postConfig || {};
};

const PostPage = ({ isEmbedMode = false }) => {
    const { t } = useTranslation();
    const { entity: entityFromDashboard, entityId: entityFromEmbed } = useParams();
    const entity = entityFromEmbed || entityFromDashboard;
    const navigate = useNavigate();
    const [initialData, setInitialData] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const successTimer = useRef(null);

    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const category = searchParams.get('category');
        const description = searchParams.get('description');
        const cliente_id = searchParams.get('cliente_id');

        const postConfigDefaults = getClientConfig(cliente_id);

        const data = {
            entity: entity,
            cid: cliente_id,
            description: description || '',
            config: {
                ...postConfigDefaults,
                category: category || postConfigDefaults.category || 'General'
            }
        };

        setInitialData(data);
    }, [entity, isEmbedMode]);

    useEffect(() => {
        return () => {
            if (successTimer.current) {
                clearTimeout(successTimer.current);
            }
        };
    }, []);

    const handleSave = (post) => {
        if (isEmbedMode) {
            setSuccessMessage(t('client.general_config_saved'));
            
            if (successTimer.current) {
                clearTimeout(successTimer.current);
            }

            successTimer.current = setTimeout(() => {
                setSuccessMessage(null);
            }, 5000);
        } else {
            navigate(`/posts`);
        }
    };

    const handleCancel = () => {
        if (isEmbedMode) {
            window.alert('Edición cancelada. Cierre la ventana.');
        } else {
            navigate(-1);
        }
    };

    if (!initialData) {
        return (
            <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress/>
            </Box>
        );
    }

    return (
        <Box sx={{p: 3}}>
            <Paper elevation={0} sx={{p: 3}}>
                {!isEmbedMode && (
                    <Typography variant="h4" gutterBottom>
                        {entity ? t('postForm.editPost') : t('postForm.newPost')}
                    </Typography>
                )}

                <PostForm
                    initialData={initialData}
                    mode={entity ? 'edit' : 'create'}
                    isEmbedMode={isEmbedMode}
                    onSave={handleSave}
                    onCancel={handleCancel}
                    successMessage={successMessage}
                />
            </Paper>
        </Box>
    );
};

export default PostPage;