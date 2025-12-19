// src/components/Post/PostForm.jsx
import { useState } from 'react';
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
    Mic as MicIcon,
    LiveTv as LiveTvIcon
} from '@mui/icons-material';

import { upsertPost } from '../../api/posts';
import usePostForm from '../../hooks/usePostForm';
import GeneralTab from './GeneralTab';
import CommentsTab from './CommentsTab';
import AdvancedTab from './AdvancedTab';
import AudioTab from './AudioTab';
import LiveTab from './LiveTab';
import React from 'react';

const PostForm = ({ 
    initialData = {}, 
    onSave, 
    onCancel,
    mode = 'create',
    isGeneralConfig = false,
    isEmbedMode = false,
    successMessage
}) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState(isGeneralConfig ? 0 : 0);
    
    const { 
        formData,
        loading,
        error,
        validationErrors,
        handleChange,
        handleNumberChange,
        validateForm,
        setLoading,
        setError
    } = usePostForm(initialData, mode, isGeneralConfig, isEmbedMode);


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
        onCancel();
    };

    if (loading && mode === 'edit' && !formData.config && !isGeneralConfig) {
        return (
            <Box className="loading-container">
                <CircularProgress/>
            </Box>
        );
    }

    const visibleTabs = [
        ...(!isGeneralConfig
            ? [{
                icon: <SettingsIcon/>, 
                label: t('postForm.general'),
                component: GeneralTab,
                props: { validationErrors, mode, t }
            }]
            : []
        ),
        {
            icon: <RateReviewIcon/>, 
            label: t('postForm.comments'),
            component: CommentsTab,
            props: { handleNumberChange, validationErrors, t }
        },
        ...(!isGeneralConfig
            ? [{
                icon: <LiveTvIcon/>, 
                label: t('liveMode.tabTitle', 'Live'),
                component: LiveTab,
                props: { handleNumberChange, t, validationErrors }
            }]
            : []
        ),
        {
            icon: <SecurityIcon/>, 
            label: t('postForm.advanced'),
            component: AdvancedTab,
            props: { handleNumberChange, validationErrors, isGeneralConfig, t }
        },
        {
            icon: <MicIcon/>, 
            label: t('postForm.audio'),
            component: AudioTab,
            props: { handleNumberChange, validationErrors, t }
        }
    ];

    return (
        <Box component="form" onSubmit={handleSubmit} noValidate className="post-form-container">
            {error && (
                <Alert severity="error" className="error-alert">
                    {error}
                </Alert>
            )}
            {successMessage && (
                <Alert severity="success" className="error-alert">
                    {successMessage}
                </Alert>
            )}

            <Grid container spacing={3} className="form-grid-container">
                <Grid item xs={12} className="full-width-tabs">
                    <Paper elevation={0} className="settings-paper">
                        <Tabs 
                            value={activeTab} 
                            onChange={(_, newValue) => setActiveTab(newValue)}
                            className="settings-tabs"
                            variant="scrollable"
                            scrollButtons="auto"
                            sx={{minHeight: 'unset', '& .MuiTab-root': {minHeight: 'unset'}}}
                        >
                            {visibleTabs.map((tab, index) => (
                                <Tab 
                                    key={index}
                                    icon={tab.icon} 
                                    iconPosition="start" 
                                    label={tab.label} 
                                    className="settings-tab"
                                />
                            ))}
                        </Tabs>

                        {visibleTabs.map((tab, index) => (
                            <div 
                                key={index} 
                                role="tabpanel" 
                                hidden={activeTab !== index}
                                id={`simple-tabpanel-${index}`}
                                aria-labelledby={`simple-tab-${index}`}
                            >
                                {activeTab === index && (
                                    <tab.component 
                                        formData={formData} 
                                        handleChange={handleChange} 
                                        {...tab.props} 
                                    />
                                )}
                            </div>
                        ))}
                    </Paper>
                </Grid>
            </Grid>

            <Box className="form-actions" sx={{mt: 3}}>
                <Button
                    variant="outlined"
                    onClick={handleCancel}
                    startIcon={<CancelIcon/>}
                    className="cancel-button"
                >
                    {t('postForm.cancel')}
                </Button>
                
                <Button
                    type="submit"
                    variant="contained"
                    startIcon={<SaveIcon/>}
                    disabled={loading}
                    className="submit-button"
                    sx={{ml: 2}}
                >
                    {loading ? <CircularProgress size={24}/> : t(`postForm.${isGeneralConfig ? 'save' : mode}`)}
                </Button>
            </Box>
        </Box>
    );
};

export default PostForm;