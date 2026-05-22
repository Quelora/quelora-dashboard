/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Box, Slider, Typography
} from '@mui/material';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

// Helpers
function centerAspectCrop(mediaWidth, mediaHeight, aspect) {
    return centerCrop(
        makeAspectCrop(
            {
                unit: 'px', 
                width: 120,
            },
            aspect,
            mediaWidth,
            mediaHeight,
        ),
        mediaWidth,
        mediaHeight,
    );
}

const TO_RADIANS = Math.PI / 180;

const AvatarFrameCropper = ({ open, onClose, onSave, imageSrc }) => {
    const { t } = useTranslation();
    const imgRef = useRef(null);
    
    // Estados
    const [crop, setCrop] = useState();
    const [completedCrop, setCompletedCrop] = useState();
    const [rotate, setRotate] = useState(0);
    
    // Constantes
    const ASPECT_RATIO = 1;
    const OUTPUT_SIZE = 120;

    function onImageLoad(e) {
        const { width, height } = e.currentTarget;
        setCrop(centerAspectCrop(width, height, ASPECT_RATIO));
    }

    // Lógica de Canvas para recorte estático
    async function getCroppedBlob() {
        const image = imgRef.current;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!image || !completedCrop || !ctx) {
            return null;
        }

        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;

        canvas.width = OUTPUT_SIZE;
        canvas.height = OUTPUT_SIZE;

        ctx.imageSmoothingQuality = 'high';

        const cropX = completedCrop.x * scaleX;
        const cropY = completedCrop.y * scaleY;
        const cropWidth = completedCrop.width * scaleX;
        const cropHeight = completedCrop.height * scaleY;

        const centerX = image.naturalWidth / 2;
        const centerY = image.naturalHeight / 2;

        ctx.save();
        ctx.translate(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2);
        ctx.rotate(rotate * TO_RADIANS);
        const scale = OUTPUT_SIZE / cropWidth; 
        ctx.scale(scale, scale);
        ctx.translate(-centerX, -centerY);
        ctx.drawImage(
            image,
            0,
            0,
            image.naturalWidth,
            image.naturalHeight,
            0,
            0,
            image.naturalWidth,
            image.naturalHeight,
        );
        ctx.restore();

        // Canvas simple para exportación limpia
        const canvasSimple = document.createElement('canvas');
        canvasSimple.width = OUTPUT_SIZE;
        canvasSimple.height = OUTPUT_SIZE;
        const ctxSimple = canvasSimple.getContext('2d');
        
        ctxSimple.scale(1, 1);
        ctxSimple.imageSmoothingQuality = 'high';
        ctxSimple.save();

        const cropCenterX = cropX + cropWidth / 2;
        const cropCenterY = cropY + cropHeight / 2;

        ctxSimple.translate(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2);
        ctxSimple.rotate(rotate * TO_RADIANS);

        const scaleFactor = OUTPUT_SIZE / cropWidth;
        ctxSimple.scale(scaleFactor, scaleFactor);
        ctxSimple.translate(-cropCenterX, -cropCenterY);

        ctxSimple.drawImage(
            image,
            0,
            0,
            image.naturalWidth,
            image.naturalHeight
        );
        ctxSimple.restore();

        return new Promise((resolve) => {
            canvasSimple.toBlob((blob) => {
                if (blob) {
                    const file = new File([blob], "avatar_frame.png", { type: "image/png" });
                    resolve(file);
                } else {
                    resolve(null);
                }
            }, 'image/png', 1);
        });
    }

    const handleSaveCrop = async () => {
        if (completedCrop) {
            const file = await getCroppedBlob();
            if (file) {
                onSave(file);
                onClose();
            }
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>{t('gamification.levels.adjust_frame', 'Adjust Avatar Frame (Min 120px)')}</DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 2 }}>
                    {imageSrc && (
                        <ReactCrop
                            crop={crop}
                            onChange={(pixelCrop, percentCrop) => setCrop(pixelCrop)}
                            onComplete={(c) => setCompletedCrop(c)}
                            aspect={ASPECT_RATIO}
                            circularCrop={true}
                            keepSelection
                            minWidth={120} 
                            minHeight={120}
                            ruleOfThirds
                        >
                            <img
                                ref={imgRef}
                                alt="Crop frame"
                                src={imageSrc}
                                style={{ 
                                    transform: `rotate(${rotate}deg)`, 
                                    maxHeight: '400px',
                                    maxWidth: '100%' 
                                }}
                                onLoad={onImageLoad}
                            />
                        </ReactCrop>
                    )}

                    <Box sx={{ width: '80%' }}>
                        <Typography gutterBottom>{t('common.rotate')}</Typography>
                        <Slider 
                            value={rotate} 
                            min={-180} 
                            max={180} 
                            step={1} 
                            onChange={(e, v) => setRotate(v)} 
                            valueLabelDisplay="auto"
                        />
                    </Box>
                    
                    <Typography variant="caption" color="textSecondary">
                        * Drag corners to zoom/crop. Minimum size locked to 120x120px.
                    </Typography>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>{t('common.cancel')}</Button>
                <Button onClick={handleSaveCrop} variant="contained">{t('common.apply')}</Button>
            </DialogActions>
        </Dialog>
    );
};

export default AvatarFrameCropper;