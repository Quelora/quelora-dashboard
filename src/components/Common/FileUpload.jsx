/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

// filepath: ./src/components/Common/FileUpload.jsx
import React, { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Button,
    LinearProgress,
    Typography,
    IconButton,
    Paper,
    Tooltip
} from '@mui/material';
import {
    UploadFile as UploadFileIcon,
    Clear as ClearIcon,
    Crop as CropIcon
} from '@mui/icons-material';
import { uploadMedia } from '../../api/media';

const FileUpload = ({
    label,
    value,
    mediaType,
    onChange,
    onError,
    helperText,
    showCropButton,
    onCropClick
}) => {
    const { t } = useTranslation();
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef(null);

    const apiBaseUrl = process.env.REACT_APP_API_URL || '';

    const handleUpload = useCallback(async (file, dimensions) => {
        setUploading(true);
        setProgress(0);
        onError(null);

        try {
            const response = await uploadMedia(file, (progressEvent) => {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                setProgress(percentCompleted);
            });

            onChange(response.data.mediaUrl, response.data.mediaType, dimensions);
        } catch (error) {
            onError(error.message || t('upload.error', 'File upload failed.'));
        } finally {
            setUploading(false);
        }
    }, [onChange, onError, t]);

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const objectUrl = URL.createObjectURL(file);
        
        if (file.type.startsWith('image/')) {
            const img = new Image();
            img.onload = () => {
                const dimensions = { width: img.naturalWidth, height: img.naturalHeight };
                handleUpload(file, dimensions);
                URL.revokeObjectURL(objectUrl);
            };
            img.onerror = () => {
                onError('Could not read image dimensions.');
                URL.revokeObjectURL(objectUrl);
            };
            img.src = objectUrl;
        } else if (file.type.startsWith('video/')) {
            const video = document.createElement('video');
            video.onloadedmetadata = () => {
                const dimensions = { width: video.videoWidth, height: video.videoHeight };

                handleUpload(file, dimensions);
                URL.revokeObjectURL(objectUrl);
            };
            video.onerror = () => {
                onError('Could not read video dimensions.');
                URL.revokeObjectURL(objectUrl);
            };
            video.src = objectUrl;
        } else {
            handleUpload(file, { width: null, height: null });
        }
    };

    const handleClear = () => {
        onChange('', null, { width: null, height: null });
        if (fileInputRef.current) {
            fileInputRef.current.value = null;
        }
    };

    const getPreviewUrl = () => {
        if (!value) return '';
        if (value.startsWith('http')) return value;
        return `${apiBaseUrl}${value}`;
    };
    
    const previewUrl = getPreviewUrl();

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>{label}</Typography>
            {value ? (
                <Paper
                    variant="outlined"
                    sx={{
                        p: 1,
                        background: 'var(--content-bg)',
                        position: 'relative'
                    }}
                >
                    <Box sx={{ display: 'flex', gap: 0.5, position: 'absolute', top: 8, right: 8, zIndex: 10 }}>
                        {showCropButton && mediaType === 'image' && (
                            <Tooltip title={t('upload.cropImage', 'Adjust Image')}>
                                <IconButton 
                                    onClick={onCropClick}
                                    size="small"
                                    sx={{
                                        backgroundColor: 'rgba(0, 0, 0, 0.4)',
                                        color: 'white',
                                        '&:hover': {
                                            backgroundColor: 'rgba(0, 0, 0, 0.7)'
                                        }
                                    }}
                                >
                                    <CropIcon fontSize="small"/>
                                </IconButton>
                            </Tooltip>
                        )}
                        <Tooltip title={t('common.clear', 'Clear')}>
                            <IconButton 
                                onClick={handleClear} 
                                size="small"
                                sx={{
                                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                                    color: 'white',
                                    '&:hover': {
                                        backgroundColor: 'rgba(0, 0, 0, 0.7)'
                                    }
                                }}
                            >
                                <ClearIcon fontSize="small"/>
                            </IconButton>
                        </Tooltip>
                    </Box>

                    {mediaType === 'video' ? (
                        <Box sx={{ width: '100%', maxHeight: 250, background: '#000', display: 'flex', alignItems: 'center' }}>
                            <video
                                key={previewUrl}
                                src={previewUrl}
                                controls
                                style={{ width: '100%', height: 'auto', maxHeight: '250px', display: 'block' }}
                            >
                                Your browser does not support the video tag.
                            </video>
                        </Box>
                    ) : (
                        <Box sx={{ width: '100%', height: 250, display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'var(--surface-color)' }}>
                            <img
                                key={previewUrl}
                                src={previewUrl}
                                alt="Preview"
                                style={{ width: 'auto', height: 'auto', maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                            />
                        </Box>
                    )}
                </Paper>
            ) : (
                <Button
                    variant="outlined"
                    component="label"
                    startIcon={<UploadFileIcon/>}
                    disabled={uploading}
                    fullWidth
                    sx={{
                        background: 'var(--surface-color)',
                        borderColor: 'var(--border-gray)',
                        '&:hover': {
                            borderColor: 'var(--border-gray-dark)'
                        }
                    }}
                >
                    {t('upload.selectFile', 'Select file')}
                    <input
                        type="file"
                        hidden
                        onChange={handleFileChange}
                        ref={fileInputRef}
                        accept="image/*,video/*"
                    />
                </Button>
            )}
            {uploading && <LinearProgress variant="determinate" value={progress} />}
            {helperText && (
                <Typography 
                    variant="caption" 
                    color={helperText.severity === 'error' ? 'error' : (helperText.severity === 'warning' ? 'warning.main' : 'success.main')}
                    sx={{ mt: 1, display: 'block' }}
                >
                    {helperText.text}
                </Typography>
            )}
        </Box>
    );
};

export default FileUpload;