// filepath: ./src/components/Advertiser/BackgroundCropper.jsx
import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Slider,
    Typography
} from '@mui/material';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

function centerAspectCrop(mediaWidth, mediaHeight, aspect) {
    return centerCrop(
        makeAspectCrop(
            {
                unit: '%',
                width: 90,
            },
            aspect,
            mediaWidth,
            mediaHeight,
        ),
        mediaWidth,
        mediaHeight,
    );
}

const BackgroundCropper = ({ open, onClose, onSave, imageSrc }) => {
    const { t } = useTranslation();
    const imgRef = useRef(null);
    const [crop, setCrop] = useState();
    const [completedCrop, setCompletedCrop] = useState();
    const [scale, setScale] = useState(1);
    const [rotate, setRotate] = useState(0);
    const aspect = 500/140;

    function onImageLoad(e) {
        const { width, height } = e.currentTarget;
        setCrop(centerAspectCrop(width, height, aspect));
    }

    async function getCroppedImg() {
        const image = imgRef.current;
        const canvas = document.createElement('canvas');
        if (!image || !completedCrop) {
            throw new Error('Crop canvas not available');
        }

        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
       
        const crop = completedCrop;

        const cropWidth = crop.width * scaleX;
        const cropHeight = crop.height * scaleY;
        const cropX = crop.x * scaleX;
        const cropY = crop.y * scaleY;

        const targetWidth = 500;
        const targetHeight = 140;
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('No 2d context');
        }

        ctx.drawImage(
            image,
            cropX,
            cropY,
            cropWidth,
            cropHeight,
            0,
            0,
            targetWidth,
            targetHeight
        );

        return new Promise((resolve) => {
            resolve(canvas.toDataURL('image/jpeg', 0.9));
        });
    }

    const handleSaveCrop = async () => {
        if (completedCrop) {
            const base64Image = await getCroppedImg();
            onSave(base64Image);
            onClose();
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>{t('advertiser.edit_background_title', 'Edit Background Image')}</DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 2 }}>
                    {imageSrc && (
                        <ReactCrop
                            crop={crop}
                            onChange={(_, percentCrop) => setCrop(percentCrop)}
                            onComplete={(c) => setCompletedCrop(c)}
                            aspect={aspect}
                            keepSelection
                        >
                            <img
                                ref={imgRef}
                                alt="Crop background"
                                src={imageSrc}
                                style={{ 
                                    transform: `scale(${scale}) rotate(${rotate}deg)`,
                                    maxHeight: 400,
                                    width: 'auto'
                                }}
                                onLoad={onImageLoad}
                            />
                        </ReactCrop>
                    )}
                    <Box sx={{ width: '80%' }}>
                        <Typography gutterBottom>{t('common.zoom', 'Zoom')}</Typography>
                        <Slider
                            value={scale}
                            min={1}
                            max={3}
                            step={0.01}
                            onChange={(e, newValue) => setScale(newValue)}
                        />
                    </Box>
                    <Box sx={{ width: '80%' }}>
                        <Typography gutterBottom>{t('common.rotate', 'Rotate')}</Typography>
                        <Slider
                            value={rotate}
                            min={-180}
                            max={180}
                            step={1}
                            onChange={(e, newValue) => setRotate(newValue)}
                        />
                    </Box>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>{t('common.cancel', 'Cancel')}</Button>
                <Button onClick={handleSaveCrop} variant="contained">{t('common.save', 'Save')}</Button>
            </DialogActions>
        </Dialog>
    );
};

export default BackgroundCropper;