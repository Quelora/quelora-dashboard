/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

import { useState, useEffect } from 'react';

const newCreative = () => ({
    _id: `new_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: '',
    weight: 10,
    creativeType: 'media',
    advertiserProfileId: '',
    title: '',
    nativeText: '',
    media: {
        url: '',
        type: 'image',
        dimensions: { width: null, height: null }
    },
    htmlContent: '',
    destinationUrl: '',
    placementId: '',
    deviceTargeting: 'all',
    posts: [],
    status: 'active',
    contextualKeywords: '',
    postKeywords: '',
    postTargetingMode: 'all',
    maxBidCPM: 0.50,
    maxBidCPC: 0.10
});

const safeJoin = (val) => {
    if (Array.isArray(val)) {
        return val.join(', ');
    }
    if (typeof val === 'string') {
        return val;
    }
    return '';
};

const getInitialState = (initialData, mode) => {
    const defaultState = {
        name: '',
        status: 'draft',
        budgetStatus: 'active',
        budgetTotal: 500,
        budgetSpent: 0,
        startDate: new Date().toISOString().split('T')[0],
        endDate: null,
        geoTargeting: { countries: [], regions: [], cities: [] },
        frequencyCap: { impressions: 0, perHours: 24 },
        cids: [],
        creatives: [newCreative()]
    };

    if (initialData && mode === 'edit') {
        const creatives = initialData.creatives?.length
            ? initialData.creatives.map(c => {
                const processedCreative = {
                    ...newCreative(),
                    ...c,
                    placementId: c.placementId?._id || c.placementId || '',
                    advertiserProfileId: c.advertiserProfileId?._id || c.advertiserProfileId || '',
                    posts: c.posts || [],
                    media: c.media || { url: '', type: 'image', dimensions: {} },
                    contextualKeywords: safeJoin(c.contextualKeywords),
                    postKeywords: safeJoin(c.postKeywords),
                    postTargetingMode: c.postTargetingMode || 'all',
                    maxBidCPM: c.maxBidCPM || 0.50,
                    maxBidCPC: c.maxBidCPC || 0.10
                };
                return processedCreative;
            })
            : [newCreative()];

        return {
            ...defaultState,
            ...initialData,
            cids: Array.isArray(initialData.cids) ? initialData.cids : (initialData.cid ? [initialData.cid] : []),
            budgetTotal: initialData.budgetTotal || 500,
            budgetSpent: initialData.budgetSpent || 0,
            startDate: initialData.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : null,
            endDate: initialData.endDate ? new Date(initialData.endDate).toISOString().split('T')[0] : null,
            frequencyCap: initialData.frequencyCap || { impressions: 0, perHours: 24 },
            geoTargeting: initialData.geoTargeting || { countries: [], regions: [], cities: [] },
            creatives: creatives
        };
    }
    
    if (initialData?.cid) {
        defaultState.cids = [initialData.cid];
    }
    
    return defaultState;
};

const useCampaignForm = (initialData, mode) => {
    const [formData, setFormData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});

    useEffect(() => {
        if (initialData) {
            const initialState = getInitialState(initialData, mode);
            setFormData(initialState);
        }
        setValidationErrors({});
    }, [initialData, mode]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const newValue = type === 'checkbox' ? checked : value;

        setFormData(prev => {
            const updates = { [name]: newValue };

            if (name === 'budgetTotal') {
                const newTotal = Number(newValue);
                const currentSpent = Number(prev.budgetSpent || 0);
                
                if (prev.budgetStatus === 'exhausted' && newTotal > currentSpent) {
                    updates.budgetStatus = 'active';
                }
                else if (prev.budgetStatus === 'active' && newTotal <= currentSpent) {
                    updates.budgetStatus = 'exhausted';
                }
            }

            return { ...prev, ...updates };
        });
    };

    const handleNestedChange = (path, value) => {
        setFormData(prev => {
            const keys = path.split('.');
            const newState = { ...prev };
            let current = newState;
            for (let i = 0; i < keys.length - 1; i++) {
                current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = value;
            return newState;
        });
    };

    const handleDateChange = (name, value) => {
        setFormData(prev => ({
            ...prev,
            [name]: value ? new Date(value).toISOString().split('T')[0] : null
        }));
    };

    const handleCreativeChange = (index, e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const updatedCreatives = [...prev.creatives];
            updatedCreatives[index] = {
                ...updatedCreatives[index],
                [name]: value
            };
            return { ...prev, creatives: updatedCreatives };
        });
    };

    const handleCreativeUpdate = (index, newValues) => {
        setFormData(prev => {
            const updatedCreatives = [...prev.creatives];
            updatedCreatives[index] = { ...updatedCreatives[index], ...newValues };
            return { ...prev, creatives: updatedCreatives };
        });
    };

    const handleCreativeMediaChange = (index, mediaUrl, mediaType, dimensions) => {
        setFormData(prev => {
            const updatedCreatives = [...prev.creatives];
            updatedCreatives[index] = {
                ...updatedCreatives[index],
                media: { url: mediaUrl, type: mediaType, dimensions: dimensions || {} }
            };
            return { ...prev, creatives: updatedCreatives };
        });
    };

    const handleCreativePostsChange = (index, posts) => {
        setFormData(prev => {
            const updatedCreatives = [...prev.creatives];
            updatedCreatives[index] = { ...updatedCreatives[index], posts: posts };
            return { ...prev, creatives: updatedCreatives };
        });
    };

    const addCreative = () => {
        setFormData(prev => ({
            ...prev,
            creatives: [...prev.creatives, newCreative()]
        }));
    };

    const removeCreative = (index) => {
        setFormData(prev => {
            if (prev.creatives.length <= 1) return prev;
            const updatedCreatives = prev.creatives.filter((_, i) => i !== index);
            return { ...prev, creatives: updatedCreatives };
        });
    };

    const validateForm = (placements = []) => {
        const errors = { creatives: [] };
        if (!formData.name.trim()) {
            errors.name = 'campaign.validation.name';
        }
        if (!formData.startDate) {
            errors.startDate = 'campaign.validation.startDate';
        }
        if (!formData.cids || formData.cids.length === 0) {
            errors.cids = 'campaign.validation.cidsRequired';
        }
        
        if (formData.budgetTotal === undefined || formData.budgetTotal === null || Number(formData.budgetTotal) <= 0) {
            errors.budgetTotal = 'campaign.validation.budgetRequired';
        }

        const creativeErrors = [];
        const urlRegex = /^(https|http):\/\/[^\s$.?#].[^\s]*$/;

        formData.creatives.forEach((creative, index) => {
            const cError = {};
            const placement = placements.find(p => p._id === creative.placementId);
            const renderType = placement?.renderType || 'display';

            if (!creative.name.trim()) cError.name = 'campaign.validation.name';

            if (!creative.destinationUrl.trim()) {
                cError.destinationUrl = 'campaign.validation.destinationUrl';
            } else if (!urlRegex.test(creative.destinationUrl.trim())) {
                cError.destinationUrl = 'campaign.validation.destinationUrlInvalid';
            }

            if (!creative.placementId) cError.placementId = 'campaign.validation.placementId';
            
            if (creative.maxBidCPM < 0) cError.maxBidCPM = 'campaign.validation.invalidBid';
            if (creative.maxBidCPC < 0) cError.maxBidCPC = 'campaign.validation.invalidBid';

            if (renderType === 'display' && creative.creativeType === 'media' && !creative.media.url) {
                cError.media = 'campaign.validation.mediaRequired';
            }
            if (renderType === 'display' && creative.creativeType === 'html') {
                if (!creative.htmlContent) cError.htmlContent = 'campaign.validation.htmlContentRequired';
            }
            if (renderType === 'native') {
                if (!creative.nativeText) cError.nativeText = 'campaign.validation.nativeTextRequired';
                if (!creative.advertiserProfileId) cError.advertiserProfileId = 'campaign.validation.advertiserProfileRequired';
            }

            creativeErrors[index] = cError;
        });

        const hasCreativeErrors = creativeErrors.some(cError => Object.keys(cError).length > 0);
        if (hasCreativeErrors) {
            errors.creatives = creativeErrors;
        }

        setValidationErrors(errors);
        const topLevelErrors = Object.keys(errors).filter(k => k !== 'creatives').length > 0;
        return !topLevelErrors && errors.creatives.length === 0;
    };

    return {
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
    };
};

export default useCampaignForm;