/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Button,
    CircularProgress,
    Paper,
    Alert,
    Tabs,
    Tab
} from '@mui/material';
import {
    Save as SaveIcon,
    Cancel as CancelIcon,
    Settings as SettingsIcon,
    Image as ImageSearchIcon,
    Public as PublicIcon,
    AttachMoney as BudgetIcon,
    ShutterSpeed as DeliveryIcon
} from '@mui/icons-material';
import { upsertCampaign } from '../../api/campaigns';
import useCampaignForm from '../../hooks/useCampaignForm';
import CampaignGeneralTab from './CampaignGeneralTab';
import CampaignCreativesTab from './CampaignCreativesTab';
import CampaignBudgetTab from './CampaignBudgetTab';
import CampaignDeliveryTab from './CampaignDeliveryTab';
import GeoTargetingTab from '../Common/GeoTargetingTab';
import { getPlacements } from '../../api/placements';

const creativeFieldToVerticalTab = {
    placementId: 0,
    deviceTargeting: 0,
    name: 0,
    weight: 0,
    destinationUrl: 0,
    posts: 2,
    creativeType: 1,
    media: 1,
    htmlContent: 1,
    advertiserProfileId: 1,
    nativeText: 1
};

const safeSplit = (val) => {
    if (!val) return [];
    if (typeof val === 'string') {
        const trimmed = val.trim();
        if (!trimmed) return [];
        return trimmed.split(',').map(k => k.trim()).filter(k => k.length > 0);
    }
    if (Array.isArray(val)) return val;
    return [];
};

const CampaignForm = ({
    initialData = {},
    onSave,
    onCancel,
    mode = 'create',
}) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState(0);
    const [placements, setPlacements] = useState([]);

    const {
        formData,
        setFormData,
        loading,
        error,
        validationErrors,
        handleChange,
        handleNestedChange,
        handleDateChange,
        handleCreativeChange,
        handleCreativeUpdate,
        handleCreativeMediaChange,
        handleCreativePostsChange,
        addCreative,
        removeCreative,
        validateForm,
        setLoading,
        setError
    } = useCampaignForm(initialData, mode);

    const creativesTabRef = useRef(null);

    useEffect(() => {
        getPlacements({ limit: 1000 })
            .then(res => setPlacements(res.data.placements || []))
            .catch(err => console.error("Error fetching placements:", err));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm(placements)) {
            setError(t('postForm.validationError'));

            // Logic to switch to the creative tab if there is an error there
            if (validationErrors.creatives?.length > 0) {
                const firstErrorCreativeIndex = validationErrors.creatives.findIndex(c => c && Object.keys(c).length > 0);

                if (firstErrorCreativeIndex > -1) {
                    // Find index of CampaignCreativesTab. Based on tabs array below:
                    // 0: General, 1: Budget, 2: Delivery, 3: Creatives, 4: Geo
                    setActiveTab(3);
                    const firstErrorField = Object.keys(validationErrors.creatives[firstErrorCreativeIndex])[0];
                    const verticalTabIndex = creativeFieldToVerticalTab[firstErrorField] || 0;
                    if (creativesTabRef.current) {
                        creativesTabRef.current.setActiveTabs(firstErrorCreativeIndex, verticalTabIndex);
                    }
                }
            }
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const campaignData = {
                ...formData,
                creatives: formData.creatives.map((c) => {
                    const placementId = c.placementId && typeof c.placementId === 'object' ? c.placementId._id : c.placementId;
                    const advertiserProfileId = c.advertiserProfileId && typeof c.advertiserProfileId === 'object' ? c.advertiserProfileId._id : c.advertiserProfileId;
                    
                    const contextualKeywordsArray = safeSplit(c.contextualKeywords);
                    const postKeywordsArray = safeSplit(c.postKeywords);
                    
                    const cleanCreative = {
                        name: c.name,
                        weight: Number(c.weight),
                        creativeType: c.creativeType,
                        placementId: placementId,
                        deviceTargeting: c.deviceTargeting,
                        destinationUrl: c.destinationUrl,
                        status: c.status,
                        postTargetingMode: c.postTargetingMode || 'all',
                        posts: (c.posts || []).map(p => p._id || p),
                        contextualKeywords: contextualKeywordsArray,
                        postKeywords: postKeywordsArray,
                        maxBidCPM: Number(c.maxBidCPM),
                        maxBidCPC: Number(c.maxBidCPC),
                        ...(c.creativeType === 'media' && { media: c.media }),
                        ...(c.creativeType === 'html' && { 
                            htmlContent: c.htmlContent,
                            title: c.title
                        }),
                        ...(c.placementId && {
                            nativeText: c.nativeText,
                            advertiserProfileId: advertiserProfileId
                        })
                    };

                    if (c._id && !c._id.startsWith('new_') && !c._id.startsWith('temp_')) {
                        cleanCreative._id = c._id;
                    }

                    return cleanCreative;
                })
            };

            const response = await upsertCampaign(campaignData);
            if (onSave) {
                onSave(response.data);
            }
        } catch (err) {
            console.error("Campaign submission error:", err);
            setError(err.message || t('campaign.errorSaving', 'Error saving campaign.'));
        } finally {
            setLoading(false);
        }
    };

    if (!formData) {
        return <CircularProgress />;
    }

    const tabs = [
        {
            icon: <SettingsIcon/>,
            label: t('postForm.general'),
            component: CampaignGeneralTab,
            props: { formData, handleChange, handleDateChange, validationErrors, t }
        },
        {
            icon: <BudgetIcon/>,
            label: t('campaign.budget', 'Budget'),
            component: CampaignBudgetTab,
            props: { formData, handleChange, validationErrors, t }
        },
        {
            icon: <DeliveryIcon/>,
            label: t('campaign.delivery', 'Delivery'),
            component: CampaignDeliveryTab,
            props: { formData, handleNestedChange, t }
        },
        {
            icon: <ImageSearchIcon/>,
            label: t('campaign.creatives', 'Creatives'),
            component: CampaignCreativesTab,
            props: {
                ref: creativesTabRef,
                formData: formData,
                placements: placements,
                handleCreativeChange,
                handleCreativeUpdate,
                handleCreativeMediaChange,
                handleCreativePostsChange,
                addCreative,
                removeCreative,
                validationErrors,
                t
            }
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
                        id={`campaign-tabpanel-${index}`}
                        aria-labelledby={`campaign-tab-${index}`}
                    >
                        {activeTab === index && (
                            <Box sx={{ p: 3 }}>
                                <tab.component {...tab.props} />
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
                </Button>
                <Button
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

export default CampaignForm;