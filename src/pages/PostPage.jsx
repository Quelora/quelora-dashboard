// ./src/pages/PostPage.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, CircularProgress, Paper, Typography } from '@mui/material';
import PostForm from '../components/Post/PostForm';
import { generateKeyFromString, decryptJSON } from '../utils/crypto';

const PostPage = () => {
  const { t } = useTranslation();
  const { entity } = useParams();
  const navigate = useNavigate();
  const [initialData, setInitialData] = useState({
    entity,
    description: '',
    config: {}
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const category = searchParams.get('category');
    const description = searchParams.get('description');
    const cliente_id = searchParams.get('cliente_id');

    // Cargar postConfig desde sessionStorage si existe cliente_id
    let postConfig = {};
    if (cliente_id) {
      const clientsDataRaw = sessionStorage.getItem('clients');
      if (clientsDataRaw) {
        const clientsData = JSON.parse(clientsDataRaw);
        const client = clientsData.find(c => c.cid === cliente_id);
        if (client && client.postConfig) {
          try {
            const key = generateKeyFromString(client.cid);
            postConfig = decryptJSON(client.postConfig, key);
          } catch (error) {
            console.error(`Error decrypting postConfig for client ${client.cid}:`, error);
          }
        }
      }
    }

    setInitialData(prev => ({
      ...prev,
      cid: cliente_id,
      description: description || prev.description,
      config: {
        ...prev.config,
        ...postConfig, // Aplicar postConfig como valores predeterminados
        category: category || 'General'
      }
    }));
    
    setLoading(false);
  }, [entity]);

  const handleSave = (post) => {
    navigate(`/client/posts?cid=${post.cid}`);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={0} sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          {entity ? t('postForm.editPost') : t('postForm.newPost')}
        </Typography>

        <PostForm
          initialData={initialData}
          mode={entity ? 'edit' : 'create'}
          onSave={handleSave}
          onCancel={() => navigate(-1)}
        />
      </Paper>
    </Box>
  );
};

export default PostPage;