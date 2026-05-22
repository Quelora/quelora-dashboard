/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

// filepath: ./src/components/Survey/SurveyForm.jsx
import React, { useState } from 'react';
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
    ListAlt as ListAltIcon,
    Article as ArticleIcon,
    Public as PublicIcon
} from '@mui/icons-material';
import { upsertSurvey } from '../../api/surveys';
import useSurveyForm from '../../hooks/useSurveyForm';
import SurveyGeneralTab from './SurveyGeneralTab';
import SurveyOptionsTab from './SurveyOptionsTab';
import SurveyPostsTab from './SurveyPostsTab';
import GeoTargetingTab from '../Common/GeoTargetingTab';

const SurveyForm = ({
    initialData = {},
    onSave,
    onCancel,
    mode = 'create',
}) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState(0);
    
    const {
        formData,
        setFormData,
        loading,
        error,
        validationErrors,
        handleChange,
        handleDateChange,
        handleOptionsChange,
        addOption,
        removeOption,
        handlePostsChange,
        validateForm,
        setLoading,
        setError
    } = useSurveyForm(initialData, mode);

    const handleSubmit = async (e) => {
        e.preventDefault();
    
        if (!validateForm()) {
            setError(t('postForm.validationError'));
            return;
        }

        setLoading(true);
        setError(null);
        
        try {
            const surveyData = {
                ...formData,
                cid: formData.cid || sessionStorage.getItem('currentCid'),
                posts: formData.posts.map(p => p._id),
                options: formData.options,
            };
            
            const response = await upsertSurvey(surveyData);
            if (onSave) {
                onSave(response.data);
            }
        } catch (err) {
            setError(err.message || t('survey.errorSaving'));
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        {
            icon: <SettingsIcon/>,
            label: t('postForm.general'),
            component: SurveyGeneralTab,
            props: { handleDateChange, validationErrors, t }
        },
        {
            icon: <ListAltIcon/>,
            label: t('survey.options'),
            component: SurveyOptionsTab,
            props: { handleOptionsChange, addOption, removeOption, validationErrors, t }
        },
        {
            icon: <ArticleIcon/>,
            label: t('survey.posts'),
            component: SurveyPostsTab,
            props: { handlePostsChange, t }
        },
        {
            icon: <PublicIcon/>,
            label: t('survey.geoTargeting'),
            component: GeoTargetingTab,
            props: {
                t,
                value: formData.geoTargeting,
                onChange: (newGeoTargeting) => {
                    setFormData(prev => ({
                        ...prev,
                        geoTargeting: newGeoTargeting
                    }));
                }
            }
        }
    ];

    return (
        <Box component="form" onSubmit={handleSubmit} noValidate className="post-form-container">
            {error && (
                <Alert severity="error" className="error-alert" sx={{ mb: 2, m: 3 }}>
                    {error}
                </Alert>
            )}

            <Paper elevation={0} className="settings-paper" sx={{ borderRadius: 0 }}>
                <Tabs
                    value={activeTab}
                    onChange={(_, newValue) => setActiveTab(newValue)}
                    className="settings-tabs"
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{ minHeight: 'unset', '& .MuiTab-root': { minHeight: 'unset' } }}
                >
                    {tabs.map((tab, index) => (
                        <Tab
                            key={index}
                            icon={tab.icon}
                            iconPosition="start"
                            label={tab.label}
                            className="settings-tab"
                        />
                    ))}
                </Tabs>

                {tabs.map((tab, index) => (
                    <div
                        key={index}
                        role="tabpanel"
                        hidden={activeTab !== index}
                        id={`survey-tabpanel-${index}`}
                        aria-labelledby={`survey-tab-${index}`}
                    >
                        {activeTab === index && (
                            <Box sx={{ p: 3 }}>
                                <tab.component
                                    formData={formData}
                                    handleChange={handleChange}
                                    {...tab.props}
                                />
                            </Box>
                        )}
                    </div>
                ))}
            </Paper>

            <Box className="form-actions" sx={{ mt: 3, textAlign: 'right', p: 3 }}>
                <Button
                    variant="outlined"
                    onClick={onCancel}
                    startIcon={<CancelIcon/>}
                    className="cancel-button"
                >
                    {t('postForm.cancel')}
                </Button><Button
                    type="submit"
                    variant="contained"
                    startIcon={<SaveIcon/>}
                    disabled={loading}
                    className="submit-button"
                    sx={{ ml: 2 }}
                >
                    {loading ? <CircularProgress size={24}/> : t(`postForm.${mode}`)}
                </Button>
            </Box>
        </Box>
    );
};

export default SurveyForm;