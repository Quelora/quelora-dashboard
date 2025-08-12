import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Box, 
  Button, 
  CircularProgress,
  Paper,
  Grid,
  Alert,
  Tabs,
  Tab
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Settings as SettingsIcon,
  RateReview as RateReviewIcon,
  Security as SecurityIcon,
  Mic as MicIcon
} from '@mui/icons-material';

import { upsertPost, getPost } from '../../api/posts';
import GeneralTab from './GeneralTab';
import CommentsTab from './CommentsTab';
import AdvancedTab from './AdvancedTab';
import AudioTab from './AudioTab';
import '../../assets/css/PostForm.css';

const PostForm = ({ 
  initialData = {}, 
  onSave, 
  onCancel,
  mode = 'create',
  isGeneralConfig = false
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(isGeneralConfig ? 0 : 0);
  const [formData, setFormData] = useState(() => {
    const defaultData = {
      description: '',
      title: '',
      link: '',
      config: {
        visibility: 'public',
        comment_status: 'open',
        interaction: {
          allow_comments: true,
          allow_likes: true,
          allow_shares: true,
          allow_replies: true,
          allow_bookmarks: true,
        },
        moderation: {
          enable_toxicity_filter: true,
          enable_content_moderation: false,
          moderation_prompt: '',
          banned_words: [],
        },
        tags: [],
        category: 'General',
        publish_schedule: {
          immediate: true,
          scheduled_time: new Date(Date.now() + 86400000).toISOString(),
        },
        language: {
          post_language: 'es',
          auto_translate: true,
        },
        limits: {
          post_text: 1000,
          comment_text: 200,
          reply_text: 200,
        },
        editing: {
          allow_edits: true,
          allow_delete: true,
          edit_time_limit: 5,
        },
        audio: {
          enable_mic_transcription: false,
          save_comment_audio: false,
          max_recording_seconds: 60,
          bitrate: 16000
        }
      },
    };

    const mergedData = {
      ...defaultData,
      ...initialData,
      config: {
        ...defaultData.config,
        ...(initialData.config || {}),
        interaction: {
          ...defaultData.config.interaction,
          ...(initialData.config?.interaction || {}),
        },
        moderation: {
          ...defaultData.config.moderation,
          ...(initialData.config?.moderation || {}),
          banned_words: initialData.config?.moderation?.banned_words || [],
        },
        tags: initialData.config?.tags || [],
        publish_schedule: {
          ...defaultData.config.publish_schedule,
          ...(initialData.config?.publish_schedule || {}),
        },
        language: {
          ...defaultData.config.language,
          ...(initialData.config?.language || {}),
        },
        limits: {
          ...defaultData.config.limits,
          ...(initialData.config?.limits || {}),
        },
        editing: {
          ...defaultData.config.editing,
          ...(initialData.config?.editing || {}),
        },
        audio: {
          ...defaultData.config.audio,
          ...(initialData.config?.audio || {}),
        },
      },
    };
    return mergedData;
  });

  const [validationErrors, setValidationErrors] = useState({
    description: false,
    title: false,
    link: false,
    entity: false,
    moderation_prompt: false,
    comment_text: false,
    reply_text: false,
    edit_time_limit: false,
    max_recording_seconds: false
  });

  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return url === '' || url === undefined || url === null;
    }
  };

  useEffect(() => {
    if (mode === 'edit' && initialData?.entity && !initialData?.config && !isGeneralConfig) {
      const loadPostData = async () => {
        try {
          setLoading(true);
          const response = await getPost(initialData.entity);
          setFormData(response.data);
        } catch (err) {
          setError(err.response?.data?.error || t('postForm.errorLoading'));
        } finally {
          setLoading(false);
        }
      };
      loadPostData();
    }
  }, [mode, initialData?.entity, initialData?.config, t, isGeneralConfig]);

  const validateForm = () => {
    if (isGeneralConfig) {
      const errors = {
        moderation_prompt: formData.config.moderation.enable_content_moderation && !formData.config.moderation.moderation_prompt.trim(),
        comment_text: formData.config.limits.comment_text < 50 || formData.config.limits.comment_text > 1000,
        reply_text: formData.config.limits.reply_text < 50 || formData.config.limits.reply_text > 1000,
        edit_time_limit: formData.config.editing.edit_time_limit < 1 || formData.config.editing.edit_time_limit > 1440,
        max_recording_seconds: formData.config.audio.max_recording_seconds < 1 || 
          formData.config.audio.max_recording_seconds > 300
      };
      setValidationErrors(errors);
      return !Object.values(errors).some(Boolean);
    }

    const errors = {
      description: !formData.description || formData.description.length > 1000,
      title: !formData.title || formData.title.length < 10 || formData.title.length > 150,
      link: formData.link && (formData.link.length > 300 || !isValidUrl(formData.link)),
      entity: mode === 'create' && !formData.entity
    };
    setValidationErrors(errors);
    return !Object.values(errors).some(Boolean);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('config.')) {
      const configPath = name.split('.');
      setFormData(prev => ({
        ...prev,
        config: {
          ...prev.config,
          [configPath[1]]: configPath.length > 2 ? {
            ...prev.config[configPath[1]],
            [configPath[2]]: type === 'checkbox' ? checked : value
          } : (type === 'checkbox' ? checked : value)
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }

    setValidationErrors(prev => ({
      ...prev,
      description: name === 'description' ? !value || value.length > 1000 : prev.description,
      title: name === 'title' ? !value || value.length < 10 || value.length > 150 : prev.title,
      link: name === 'link' ? value && (value.length > 300 || !isValidUrl(value)) : prev.link
    }));
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    const numValue = value === '' ? '' : Number(value);
    
    if (name.startsWith('config.')) {
      const configPath = name.split('.');
      setFormData(prev => ({
        ...prev,
        config: {
          ...prev.config,
          [configPath[1]]: configPath.length > 2 ? {
            ...prev.config[configPath[1]],
            [configPath[2]]: numValue
          } : numValue
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: numValue
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!validateForm()) {
      setError(t('postForm.validationError'));
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      if (!isGeneralConfig) {
        const postData = {
          ...formData,
          entity: formData.entity,
          cid: formData.cid || sessionStorage.getItem('currentCid'),
        };
        const response = await upsertPost(postData);
        if (onSave) {
          onSave(response);
        }
      } else {
        if (onSave) {
          onSave({
            interaction: formData.config.interaction,
            moderation: formData.config.moderation,
            limits: formData.config.limits,
            editing: formData.config.editing,
            audio: formData.config.audio,
          });
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || t('postForm.errorSaving'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setError(null);
    setValidationErrors({
      description: false,
      title: false,
      link: false,
      entity: false,
      moderation_prompt: false,
      comment_text: false,
      reply_text: false,
      edit_time_limit: false,
      max_recording_seconds: false
    });
    onCancel();
  };

  if (loading && mode === 'edit' && !formData.config && !isGeneralConfig) {
    return (
      <Box className="loading-container">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate className="post-form-container">
      {error && (
        <Alert severity="error" className="error-alert">
          {error}
        </Alert>
      )}

      <Grid container spacing={3} className="form-grid-container">
        <Grid item xs={12} className="full-width-tabs">
          <Paper elevation={0} className="settings-paper">
            <Tabs 
              value={activeTab} 
              onChange={(_, newValue) => setActiveTab(newValue)}
              className="settings-tabs"
              variant="fullWidth"
              sx={{ minHeight: 'unset', '& .MuiTab-root': { minHeight: 'unset' } }}
            >
              {!isGeneralConfig && (
                <Tab 
                  icon={<SettingsIcon />} 
                  iconPosition="start" 
                  label={t('postForm.general')} 
                  className="settings-tab"
                />
              )}
              <Tab 
                icon={<RateReviewIcon />} 
                iconPosition="start" 
                label={t('postForm.comments')} 
                className="settings-tab"
              />
              <Tab 
                icon={<SecurityIcon />} 
                iconPosition="start" 
                label={t('postForm.advanced')} 
                className="settings-tab"
              />
              <Tab 
                icon={<MicIcon />}
                iconPosition="start"
                label={t('postForm.audio')}
                className="settings-tab"
              />
            </Tabs>

            {activeTab === 0 && !isGeneralConfig && (
              <GeneralTab 
                formData={formData} 
                handleChange={handleChange}
                validationErrors={validationErrors}
                mode={mode}
                t={t}
              />
            )}
            {activeTab === (isGeneralConfig ? 0 : 1) && (
              <CommentsTab 
                formData={formData}
                handleChange={handleChange}
                handleNumberChange={handleNumberChange}
                validationErrors={validationErrors}
                t={t}
              />
            )}
            {activeTab === (isGeneralConfig ? 1 : 2) && (
              <AdvancedTab 
                formData={formData}
                handleChange={handleChange}
                validationErrors={validationErrors}
                isGeneralConfig={isGeneralConfig}
                t={t}
              />
            )}
            {activeTab === (isGeneralConfig ? 2 : 3) && (
              <AudioTab 
                formData={formData}
                handleChange={handleChange}
                handleNumberChange={handleNumberChange}
                validationErrors={validationErrors}
                t={t}
              />
            )}
          </Paper>
        </Grid>
      </Grid>

      <Box className="form-actions" sx={{ mt: 3 }}>
        <Button
          variant="outlined"
          onClick={handleCancel}
          startIcon={<CancelIcon />}
          className="cancel-button"
        >
          {t('postForm.cancel')}
        </Button>
        
        <Button
          type="submit"
          variant="contained"
          startIcon={<SaveIcon />}
          disabled={loading}
          className="submit-button"
          sx={{ ml: 2 }}
        >
          {loading ? <CircularProgress size={24} /> : t(`postForm.${isGeneralConfig ? 'save' : mode}`)}
        </Button>
      </Box>
    </Box>
  );
};

export default PostForm;