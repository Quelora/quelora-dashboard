/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import {
    Box,
    Button,
    Grid,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormHelperText,
    Chip,
    Tabs,
    Tab,
    IconButton,
    LinearProgress,
    Stepper,
    Step,
    StepLabel,
    Popover,
    Tooltip,
    FormControlLabel,
    RadioGroup,
    Radio,
    Card,
    CardContent,
    Divider,
    ToggleButton,
    ToggleButtonGroup,
    InputAdornment
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Image as ImageIcon,
    Code as CodeIcon,
    NavigateNext as NavigateNextIcon,
    NavigateBefore as NavigateBeforeIcon,
    SentimentSatisfiedAlt as SentimentSatisfiedAltIcon,
    Visibility as VisibilityIcon,
    Mouse as MouseIcon
} from '@mui/icons-material';
import Swal from 'sweetalert2';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import EmojiPicker from 'emoji-picker-react';
import CustomTextField from '../Common/CustomTextField';
import FileUpload from '../Common/FileUpload';
import { getPlacements } from '../../api/placements';
import { getAdvertiserProfiles } from '../../api/advertiserProfiles';
import { uploadMedia } from '../../api/media';
import CreativePostSelector from './CreativePostSelector';
import BannerCropper from './BannerCropper';

const steps = [
    'campaign.targeting',
    'campaign.content',
    'campaign.postTargeting'
];

const quillModules = {
    toolbar: [
        ['bold', 'italic', 'link']
    ],
};

const quillFormats = [
    'bold', 'italic', 'link'
];

const CampaignCreativesTab = forwardRef(({
    formData,
    handleCreativeChange,
    handleCreativeUpdate,
    handleCreativeMediaChange,
    handleCreativePostsChange,
    addCreative,
    removeCreative,
    validationErrors,
    t
}, ref) => {
    const [placements, setPlacements] = useState([]);
    const [advertiserProfiles, setAdvertiserProfiles] = useState([]);
    const [loadingDropdowns, setLoadingDropdowns] = useState(false);
    const [uploadErrors, setUploadErrors] = useState({});
    const [activeCreativeTab, setActiveCreativeTab] = useState(0);
    const [activeStep, setActiveStep] = useState(0);
    const [cropperOpen, setCropperOpen] = useState(false);
    const [cropperData, setCropperData] = useState({ imageSrc: null, aspect: 1, creativeIndex: null });
    const [isUploading, setIsUploading] = useState(false);

    const [emojiPickerAnchor, setEmojiPickerAnchor] = useState(null);
    const quillRef = useRef(null);

    const apiBaseUrl = process.env.REACT_APP_API_URL || '';
    
    // Use the first selected CID as the context for fetching assets
    const primaryCid = formData.cids && formData.cids.length > 0 ? formData.cids[0] : null;

    useImperativeHandle(ref, () => ({
        setActiveTabs(creativeIndex, verticalIndex) {
            setActiveCreativeTab(creativeIndex);
            setActiveStep(verticalIndex);
        }
    }));

    const handleCreativeTabChange = (event, newValue) => {
        if (newValue === formData.creatives.length) {
            addCreative();
            setActiveCreativeTab(newValue);
        } else {
            setActiveCreativeTab(newValue);
        }
        setActiveStep(0);
    };

    const handleNext = () => {
        if (validateStep(activeStep)) {
            setActiveStep((prevActiveStep) => prevActiveStep + 1);
        }
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    const validateStep = (step) => {
        const creative = formData.creatives[activeCreativeTab];
        if (!creative) return false;

        const placement = placements.find(p => p._id === creative.placementId);
        const renderType = placement?.renderType || 'display';
        const urlRegex = /^(https|http):\/\/[^\s$.?#].[^\s]*$/;

        if (step === 0) {
            const isUrlValid = creative.destinationUrl.trim() && urlRegex.test(creative.destinationUrl.trim());
            return creative.placementId &&
                   creative.name.trim() &&
                   creative.weight >= 1 &&
                   creative.maxBidCPM >= 0 &&
                   creative.maxBidCPC >= 0 &&
                   isUrlValid;
        }

        if (step === 1) {
            if (renderType === 'native') {
                return creative.nativeText && creative.advertiserProfileId;
            } else if (renderType === 'display') {
                if (creative.creativeType === 'media') {
                    return creative.media.url;
                }
                if (creative.creativeType === 'html') {
                    return creative.htmlContent;
                }
            }
        }

        if (step === 2) {
            if (creative.postTargetingMode === 'specific' && creative.posts.length === 0) return false;
            if (creative.postTargetingMode === 'keywords' && !creative.postKeywords.trim()) return false;
            return true;
        }

        return true;
    };

    const handleDeleteCreative = async (index) => {
        const result = await Swal.fire({
            title: t('campaign.confirmDeleteCreativeTitle', 'Delete Creative?'),
            text: t('campaign.confirmDeleteCreativeText', 'This creative will be permanently removed from the campaign.'),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: t('common.delete', 'Delete'),
            cancelButtonText: t('common.cancel', 'Cancel')
        });

        if (result.isConfirmed) {
            removeCreative(index);
            setActiveCreativeTab(Math.max(0, index - 1));
        }
    };

    useEffect(() => {
        const fetchDropdownData = async () => {
            if (primaryCid) {
                setLoadingDropdowns(true);
                try {
                    const [placementsRes, profilesRes] = await Promise.all([
                        getPlacements({ limit: 1000 }),
                        getAdvertiserProfiles(primaryCid)
                    ]);
                    setPlacements(placementsRes.data.placements || []);
                    setAdvertiserProfiles(profilesRes.data || []);
                } catch (error) {
                    console.error("Error fetching data:", error);
                }
                setLoadingDropdowns(false);
            }
        };
        fetchDropdownData();
    }, [primaryCid]);

    const handleUploadError = (index, errorMsg) => {
        setUploadErrors(prev => ({ ...prev, [index]: errorMsg }));
    };

    const vErrors = validationErrors?.creatives || [];

    const getPreviewUrl = (url) => {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        return `${apiBaseUrl}${url}`;
    };

    const getValidationState = (creative, placement) => {
        const mediaDims = creative.media?.dimensions;

        if (creative.creativeType !== 'media' || !mediaDims?.width || !placement?.width) {
            return null;
        }

        if (mediaDims.width < placement.width || mediaDims.height < placement.height) {
            return {
                severity: 'error',
                text: `Error: Media is too small (${mediaDims.width}x${mediaDims.height}). Minimum required: ${placement.width}x${placement.height}px.`
            };
        }

        const placementRatio = placement.width / placement.height;
        const mediaRatio = mediaDims.width / mediaDims.height;

        if (Math.abs(placementRatio - mediaRatio) > 0.1) {
            return {
                severity: 'warning',
                text: `Warning: Aspect ratio mismatch. Media (${mediaDims.width}x${mediaDims.height}) will be cropped or distorted to fit ${placement.width}x${placement.height}.`
            };
        }

        return {
            severity: 'success',
            text: `Success: Media (${mediaDims.width}x${mediaDims.height}) will be scaled to ${placement.width}x${placement.height}px.`
        };
    };

    const handleOpenCropper = (index, creative, placement) => {
        let aspect = 16 / 9;
        if (placement?.width && placement?.height) {
            aspect = placement.width / placement.height;
        }

        setCropperData({
            imageSrc: getPreviewUrl(creative.media.url),
            aspect: aspect,
            creativeIndex: index
        });
        setCropperOpen(true);
    };

    const handleCropperSave = async (file, dimensions) => {
        setCropperOpen(false);
        setIsUploading(true);
        const index = cropperData.creativeIndex;

        try {
            const response = await uploadMedia(file, () => {});
            handleCreativeMediaChange(index, response.data.mediaUrl, response.data.mediaType, dimensions);
            handleUploadError(index, null);
        } catch (err) {
            handleUploadError(index, err.message || 'Crop upload failed');
        } finally {
            setIsUploading(false);
        }
    };

    const handleEmojiClick = (emojiData, creativeIndex) => {
        const editor = quillRef.current?.getEditor();
        if (!editor) return;

        const range = editor.getSelection(true);
        const insertionIndex = range ? range.index : 0;

        editor.insertText(insertionIndex, emojiData.emoji);
        editor.setSelection(insertionIndex + emojiData.emoji.length);

        const newContent = editor.root.innerHTML;
        handleCreativeChange(creativeIndex, { target: { name: 'nativeText', value: newContent } });

        setEmojiPickerAnchor(null);
    };

    const creative = formData.creatives[activeCreativeTab];
    // const placement = placements.find(p => p._id === creative?.placementId); // Unused but available if needed

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {isUploading && <LinearProgress sx={{ width: '100%', mb: 2 }} />}
            <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 2 }}>
                {t('campaign.creativesHelp', 'Add one or more creatives to this campaign. They will be rotated randomly.')}
            </Typography>

            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs
                    value={activeCreativeTab}
                    onChange={handleCreativeTabChange}
                    variant="scrollable"
                    scrollButtons="auto"
                >
                    {formData.creatives.map((creative, index) => {
                        const creativeErrors = vErrors[index] || {};
                        const hasError = Object.keys(creativeErrors).length > 0;
                        return (
                            <Tab
                                key={creative._id}
                                label={creative.name || `${t('campaign.newCreativeName', 'New Creative')} ${index + 1}`}
                                icon={hasError ? <Chip component="span" label={t('common.errors', 'Errors')} color="error" size="small" sx={{ ml: 1, height: '18px' }} /> : null}
                                iconPosition="end"
                                sx={{
                                    textTransform: 'none',
                                    padding: '12px 16px',
                                    minWidth: 'auto',
                                    maxWidth: 200,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    mr: 2,
                                    '& .MuiChip-root': {
                                        transform: 'scale(0.8)'
                                    }
                                }}
                            />
                        );
                    })}
                    <Tab
                        icon={<AddIcon />}
                        aria-label="Add Creative"
                        title={t('campaign.addCreative', 'Add Creative')}
                        sx={{ padding: '12px 16px', minWidth: '40px' }}
                    />
                </Tabs>
            </Box>

            {formData.creatives.map((creative, index) => {
                const creativeErrors = vErrors[index] || {};
                const placement = placements.find(p => p._id === creative.placementId);
                const validationState = getValidationState(creative, placement);

                const showCropButton = creative.creativeType === 'media' &&
                                       creative.media.url &&
                                       creative.media.type === 'image';

                const renderType = placement?.renderType || 'display';

                const showCreativeTypeToggle = renderType === 'display';
                const showMediaFields = renderType === 'display' && creative.creativeType === 'media';
                const showHtmlFields = renderType === 'display' && creative.creativeType === 'html';
                const showNativeFields = renderType === 'native';

                const placementKey = placement?.key;
                const showWysiwyg = renderType === 'native' && ['comment-in-feed-desktop', 'comment-sponsored-top'].includes(placementKey);

                return (
                    <Box
                        key={creative._id}
                        hidden={activeCreativeTab !== index}
                        sx={{
                            padding: 2,
                            background: 'var(--surface-color)',
                            borderRadius: '0 0 8px 8px'
                        }}
                    >
                        {activeCreativeTab === index && (
                            <>
                                <Card variant="outlined" sx={{ mb: 3, background: 'var(--surface-color-lighter)' }}>
                                    <CardContent sx={{ pb: '16px !important', display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <VisibilityIcon color="action" />
                                            <Box>
                                                <Typography variant="caption" color="textSecondary" display="block">{t('campaign.impressions', 'Impressions')}</Typography>
                                                <Typography variant="h6">{creative.impressionsCount || 0}</Typography>
                                            </Box>
                                        </Box>
                                        <Divider orientation="vertical" flexItem />
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <MouseIcon color="action" />
                                            <Box>
                                                <Typography variant="caption" color="textSecondary" display="block">{t('campaign.clicks', 'Clicks')}</Typography>
                                                <Typography variant="h6">{creative.clicksCount || 0}</Typography>
                                            </Box>
                                        </Box>
                                    </CardContent>
                                </Card>

                                <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
                                    {steps.map((labelKey) => (
                                        <Step key={labelKey}>
                                            <StepLabel>{t(labelKey)}</StepLabel>
                                        </Step>
                                    ))}
                                </Stepper>

                                <Box sx={{ mt: 2, p: 2, minHeight: 300, border: '1px solid var(--border-gray)', borderRadius: '8px', background: 'var(--content-bg)' }}>

                                    {activeStep === 0 && (
                                        <Grid container spacing={3} direction="column">
                                            <Grid item>
                                                <CustomTextField
                                                    label={t('campaign.creativeName', 'Name (Internal)')}
                                                    name="name"
                                                    value={creative.name}
                                                    onChange={(e) => handleCreativeChange(index, e)}
                                                    fullWidth
                                                    error={!!creativeErrors.name}
                                                    helperText={creativeErrors.name ? t(creativeErrors.name) : t('campaign.creativeNameHelp', 'e.g., "Banner 300x250 V1"')}
                                                    required
                                                />
                                            </Grid>
                                            <Grid item>
                                                <Grid container spacing={2}>
                                                     <Grid item xs={4}>
                                                        <CustomTextField
                                                            label={t('campaign.weight', 'Weight')}
                                                            name="weight"
                                                            type="number"
                                                            value={creative.weight}
                                                            onChange={(e) => handleCreativeChange(index, e)}
                                                            fullWidth
                                                            required
                                                            InputProps={{ inputProps: { min: 1 } }}
                                                            helperText={t('campaign.weightHelp', 'Higher number = more impressions.')}
                                                        />
                                                    </Grid>
                                                    <Grid item xs={4}>
                                                        <CustomTextField
                                                            label={t('campaign.maxBidCPM', 'Max Bid CPM ($)')}
                                                            name="maxBidCPM"
                                                            type="number"
                                                            value={creative.maxBidCPM}
                                                            onChange={(e) => handleCreativeChange(index, e)}
                                                            fullWidth
                                                            required
                                                            InputProps={{ 
                                                                inputProps: { min: 0, step: 0.01 },
                                                                startAdornment: <InputAdornment position="start">$</InputAdornment>
                                                            }}
                                                            error={!!creativeErrors.maxBidCPM}
                                                            helperText={creativeErrors.maxBidCPM ? t(creativeErrors.maxBidCPM) : ''}
                                                        />
                                                    </Grid>
                                                    <Grid item xs={4}>
                                                        <CustomTextField
                                                            label={t('campaign.maxBidCPC', 'Max Bid CPC ($)')}
                                                            name="maxBidCPC"
                                                            type="number"
                                                            value={creative.maxBidCPC}
                                                            onChange={(e) => handleCreativeChange(index, e)}
                                                            fullWidth
                                                            required
                                                            InputProps={{ 
                                                                inputProps: { min: 0, step: 0.01 },
                                                                startAdornment: <InputAdornment position="start">$</InputAdornment>
                                                            }}
                                                            error={!!creativeErrors.maxBidCPC}
                                                            helperText={creativeErrors.maxBidCPC ? t(creativeErrors.maxBidCPC) : ''}
                                                        />
                                                    </Grid>
                                                </Grid>
                                            </Grid>
                                            <Grid item>
                                                <CustomTextField
                                                    label={t('campaign.creativeDestinationUrl', 'Destination URL')}
                                                    name="destinationUrl"
                                                    value={creative.destinationUrl}
                                                    onChange={(e) => handleCreativeChange(index, e)}
                                                    fullWidth
                                                    error={!!creativeErrors.destinationUrl}
                                                    helperText={creativeErrors.destinationUrl ? t(creativeErrors.destinationUrl) : ''}
                                                    required
                                                />
                                            </Grid>
                                            <Grid item>
                                                <FormControl fullWidth error={!!creativeErrors.placementId} size="small">
                                                    <InputLabel>{t('campaign.placement', 'Placement')}</InputLabel>
                                                    <Select
                                                        label={t('campaign.placement', 'Placement')}
                                                        name="placementId"
                                                        value={creative.placementId}
                                                        onChange={(e) => {
                                                            const newPlacementId = e.target.value;
                                                            const selectedPlacement = placements.find(p => p._id === newPlacementId);
                                                            let newCreativeType = 'media';
                                                            if (selectedPlacement?.renderType === 'native') {
                                                                newCreativeType = 'native';
                                                            }

                                                            handleCreativeUpdate(index, {
                                                                placementId: newPlacementId,
                                                                creativeType: newCreativeType
                                                            });
                                                        }}
                                                        disabled={loadingDropdowns}
                                                        required
                                                    >
                                                        {placements.map((p) => (
                                                            <MenuItem key={p._id} value={p._id}>
                                                                {p.name} ({p.renderType}) - {p.device} (Floor: ${p.floorPriceCPM} CPM / ${p.floorPriceCPC} CPC)
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                    {creativeErrors.placementId && (
                                                        <FormHelperText>{t(creativeErrors.placementId)}</FormHelperText>
                                                    )}
                                                </FormControl>
                                            </Grid>
                                            <Grid item>
                                                <FormControl fullWidth size="small">
                                                    <InputLabel>{t('campaign.deviceTargeting', 'Device Targeting')}</InputLabel>
                                                    <Select
                                                        label={t('campaign.deviceTargeting', 'Device Targeting')}
                                                        name="deviceTargeting"
                                                        value={creative.deviceTargeting}
                                                        onChange={(e) => handleCreativeChange(index, e)}
                                                    >
                                                        <MenuItem value="all">{t('campaign.allDevices', 'All Devices')}</MenuItem>
                                                        <MenuItem value="desktop">{t('campaign.desktopOnly', 'Desktop Only')}</MenuItem>
                                                        <MenuItem value="mobile">{t('campaign.mobileOnly', 'Mobile Only')}</MenuItem>
                                                    </Select>
                                                </FormControl>
                                            </Grid>
                                        </Grid>
                                    )}

                                    {activeStep === 1 && (
                                        <Grid container spacing={3} direction="column">
                                            {showCreativeTypeToggle && (
                                                <Grid item>
                                                    <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary', mb: 1 }}>
                                                        {t('campaign.creativeType', 'Creative Type')}
                                                    </Typography>
                                                    <ToggleButtonGroup
                                                        value={creative.creativeType}
                                                        exclusive
                                                        onChange={(e, newType) => newType && handleCreativeChange(index, { target: { name: 'creativeType', value: newType }})}
                                                        size="small"
                                                    >
                                                        <ToggleButton value="media" aria-label="media">
                                                            <ImageIcon sx={{ mr: 1 }} fontSize="small" />
                                                            {t('campaign.media', 'Media')}
                                                        </ToggleButton>
                                                        <ToggleButton value="html" aria-label="html">
                                                            <CodeIcon sx={{ mr: 1 }} fontSize="small" />
                                                            {t('campaign.html', 'HTML')}
                                                        </ToggleButton>
                                                    </ToggleButtonGroup>
                                                </Grid>
                                            )}

                                            {showMediaFields && (
                                                <Grid item>
                                                    <FileUpload
                                                        label={t('campaign.mediaContent', 'Media Content')}
                                                        value={creative.media.url}
                                                        mediaType={creative.media.type}
                                                        onChange={(mediaUrl, mediaType, dimensions) => handleCreativeMediaChange(index, mediaUrl, mediaType, dimensions)}
                                                        onError={(errorMsg) => handleUploadError(index, errorMsg)}
                                                        helperText={uploadErrors[index] || (creativeErrors.media ? t(creativeErrors.media) : validationState)}
                                                        showCropButton={showCropButton}
                                                        onCropClick={() => handleOpenCropper(index, creative, placement)}
                                                    />
                                                </Grid>
                                            )}

                                            {showHtmlFields && (
                                                <>
                                                    <Grid item>
                                                        <CustomTextField
                                                            label={t('campaign.htmlTitle', 'Title (Optional)')}
                                                            name="title"
                                                            value={creative.title || ''}
                                                            onChange={(e) => handleCreativeChange(index, e)}
                                                            fullWidth
                                                            error={!!creativeErrors.title}
                                                            helperText={creativeErrors.title ? t(creativeErrors.title) : ''}
                                                        />
                                                    </Grid>
                                                    <Grid item>
                                                        <CustomTextField
                                                            label={t('campaign.htmlContent', 'HTML Content')}
                                                            name="htmlContent"
                                                            value={creative.htmlContent || ''}
                                                            onChange={(e) => handleCreativeChange(index, e)}
                                                            fullWidth
                                                            multiline
                                                            rows={10}
                                                            error={!!creativeErrors.htmlContent}
                                                            helperText={creativeErrors.htmlContent ? t(creativeErrors.htmlContent) : t('campaign.htmlContentHelp', 'Paste your ad code...')}
                                                            required
                                                        />
                                                    </Grid>
                                                </>
                                            )}

                                            {showNativeFields && (
                                                <>
                                                    <Grid item>
                                                        <FormControl fullWidth error={!!creativeErrors.advertiserProfileId} size="small">
                                                            <InputLabel>{t('advertiser.selectProfile', 'Advertiser Profile')}</InputLabel>
                                                            <Select
                                                                label={t('advertiser.selectProfile', 'Advertiser Profile')}
                                                                name="advertiserProfileId"
                                                                value={creative.advertiserProfileId || ''}
                                                                onChange={(e) => handleCreativeChange(index, e)}
                                                                disabled={loadingDropdowns}
                                                                required
                                                            >
                                                                {advertiserProfiles.map((p) => (
                                                                    <MenuItem key={p._id} value={p._id}>
                                                                        {p.name}
                                                                    </MenuItem>
                                                                ))}
                                                            </Select>
                                                            {creativeErrors.advertiserProfileId ? (
                                                                <FormHelperText>{t(creativeErrors.advertiserProfileId)}</FormHelperText>
                                                            ) : (
                                                                <FormHelperText>{t('advertiser.selectProfileHelp', 'Select profile for native ads.')}</FormHelperText>
                                                            )}
                                                        </FormControl>
                                                    </Grid>

                                                    <Grid item>
                                                        <CustomTextField
                                                            label={t('campaign.contextualKeywords', 'Contextual Keywords (Comments)')}
                                                            name="contextualKeywords"
                                                            value={creative.contextualKeywords || ''}
                                                            onChange={(e) => handleCreativeChange(index, e)}
                                                            fullWidth
                                                            helperText={t('campaign.contextualKeywordsHelp', 'Optional: Ad shows below comments containing these terms (comma separated).')}
                                                        />
                                                    </Grid>

                                                    <Grid item>
                                                        <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary', mb: 1 }}>
                                                            {t('campaign.nativeText', 'Comment Text')}
                                                        </Typography>
                                                        {showWysiwyg ? (
                                                            <Box sx={{
                                                                position: 'relative',
                                                                '& .ql-toolbar': {
                                                                    borderRadius: '4px 4px 0 0',
                                                                    borderColor: 'rgba(0, 0, 0, 0.23)'
                                                                },
                                                                '& .ql-container': {
                                                                    borderRadius: '0 0 4px 4px',
                                                                    borderColor: 'rgba(0, 0, 0, 0.23)'
                                                                },
                                                                '& .ql-editor': {
                                                                    minHeight: '6em',
                                                                    background: 'var(--input-bg)',
                                                                    fontSize: '12px'
                                                                }
                                                            }}>
                                                                <ReactQuill
                                                                    ref={quillRef}
                                                                    theme="snow"
                                                                    value={creative.nativeText || ''}
                                                                    onChange={(content) => handleCreativeChange(index, { target: { name: 'nativeText', value: content } })}
                                                                    modules={quillModules}
                                                                    formats={quillFormats}
                                                                />
                                                                <Tooltip title={t('common.addEmoji', 'Add Emoji')}>
                                                                    <IconButton
                                                                        onClick={(e) => setEmojiPickerAnchor(e.currentTarget)}
                                                                        sx={{
                                                                            position: 'absolute',
                                                                            top: '7px',
                                                                            right: '8px',
                                                                            zIndex: 10,
                                                                            width: '28px',
                                                                            height: '28px',
                                                                            padding: 0
                                                                        }}
                                                                    >
                                                                        <SentimentSatisfiedAltIcon sx={{ fontSize: '18px' }} />
                                                                    </IconButton>
                                                                </Tooltip>
                                                                <Popover
                                                                    open={Boolean(emojiPickerAnchor)}
                                                                    anchorEl={emojiPickerAnchor}
                                                                    onClose={() => setEmojiPickerAnchor(null)}
                                                                    anchorOrigin={{
                                                                        vertical: 'bottom',
                                                                        horizontal: 'right',
                                                                    }}
                                                                    transformOrigin={{
                                                                        vertical: 'top',
                                                                        horizontal: 'right',
                                                                    }}
                                                                >
                                                                    <EmojiPicker onEmojiClick={(emojiData) => handleEmojiClick(emojiData, index)} />
                                                                </Popover>
                                                            </Box>
                                                        ) : (
                                                            <CustomTextField
                                                                label={t('campaign.nativeText', 'Comment Text')}
                                                                name="nativeText"
                                                                value={creative.nativeText || ''}
                                                                onChange={(e) => handleCreativeChange(index, e)}
                                                                fullWidth
                                                                multiline
                                                                rows={3}
                                                                error={!!creativeErrors.nativeText}
                                                                helperText={creativeErrors.nativeText ? t(creativeErrors.nativeText) : ''}
                                                                required
                                                            />
                                                        )}
                                                        {creativeErrors.nativeText && (
                                                            <FormHelperText error>{t(creativeErrors.nativeText)}</FormHelperText>
                                                        )}
                                                    </Grid>
                                                </>
                                            )}
                                        </Grid>
                                    )}

                                    {activeStep === 2 && (
                                        <Box>
                                            <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary', mb: 1 }}>
                                                {t('campaign.postTargetingMode', 'Target Posts By:')}
                                            </Typography>
                                            <FormControl component="fieldset" sx={{ mb: 3 }}>
                                                <RadioGroup
                                                    row
                                                    name="postTargetingMode"
                                                    value={creative.postTargetingMode}
                                                    onChange={(e) => handleCreativeChange(index, e)}
                                                >
                                                    <FormControlLabel value="all" control={<Radio size="small" />} label={t('campaign.allPosts', 'All Posts (Default)')} />
                                                    <FormControlLabel value="specific" control={<Radio size="small" />} label={t('campaign.specificPosts', 'Specific Posts')} />
                                                    <FormControlLabel value="keywords" control={<Radio size="small" />} label={t('campaign.keywords', 'Post Keywords')} />
                                                </RadioGroup>
                                            </FormControl>

                                            {creative.postTargetingMode === 'specific' && (
                                                <CreativePostSelector
                                                    cid={primaryCid}
                                                    value={creative.posts || []}
                                                    onChange={(posts) => handleCreativePostsChange(index, posts)}
                                                    t={t}
                                                />
                                            )}

                                            {creative.postTargetingMode === 'keywords' && (
                                                <CustomTextField
                                                    label={t('campaign.postKeywords', 'Keywords in Post Title/Content')}
                                                    name="postKeywords"
                                                    value={creative.postKeywords || ''}
                                                    onChange={(e) => handleCreativeChange(index, e)}
                                                    fullWidth
                                                    error={creativeErrors.postKeywords}
                                                    helperText={creativeErrors.postKeywords ? t(creativeErrors.postKeywords) : t('campaign.postKeywordsHelp', 'Posts must contain one or more of these terms (comma separated).')}
                                                    required
                                                />
                                            )}
                                        </Box>
                                    )}
                                </Box>

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 2, mt: 2, borderTop: '1px solid var(--border-gray)' }}>
                                    <Button
                                        variant="outlined"
                                        disabled={activeStep === 0}
                                        onClick={handleBack}
                                        startIcon={<NavigateBeforeIcon />}
                                    >
                                        {t('common.back', 'Back')}
                                    </Button>

                                    {formData.creatives.length > 1 && (
                                        <Button
                                            variant="outlined"
                                            color="error"
                                            size="small"
                                            startIcon={<DeleteIcon />}
                                            onClick={() => handleDeleteCreative(index)}
                                        >
                                            {t('campaign.removeCreative', 'Remove Creative')}
                                        </Button>
                                    )}

                                    {activeStep < steps.length - 1 && (
                                        <Button
                                            variant="contained"
                                            onClick={handleNext}
                                            endIcon={<NavigateNextIcon />}
                                            disabled={!validateStep(activeStep)}
                                        >
                                            {t('common.next', 'Next')}
                                        </Button>
                                    )}
                                </Box>
                            </>
                        )}
                    </Box>
                );
            })}

            <BannerCropper
                open={cropperOpen}
                onClose={() => setCropperOpen(false)}
                onSave={handleCropperSave}
                imageSrc={cropperData.imageSrc}
                aspect={cropperData.aspect}
            />
        </Box>
    );
});

export default CampaignCreativesTab;