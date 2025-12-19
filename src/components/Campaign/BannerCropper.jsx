// filepath: ./src/components/Campaign/BannerCropper.jsx
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

const BannerCropper = ({ open, onClose, onSave, imageSrc, aspect }) => {
    const { t } = useTranslation();
    const imgRef = useRef(null);
    const [crop, setCrop] = useState();
    const [completedCrop, setCompletedCrop] = useState();
    const [scale, setScale] = useState(1);
    const [rotate, setRotate] = useState(0);

    function onImageLoad(e) {
        const { width, height } = e.currentTarget;
        setCrop(centerAspectCrop(width, height, aspect));
    }

    async function getCroppedFile() {
        const image = imgRef.current;
        const canvas = document.createElement('canvas');
        if (!image || !completedCrop) {
            throw new Error('Crop details not available');
        }

        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        
        const crop = completedCrop;

        const cropWidth = crop.width * scaleX;
        const cropHeight = crop.height * scaleY;
        const cropX = crop.x * scaleX;
        const cropY = crop.y * scaleY;

        canvas.width = cropWidth;
        canvas.height = cropHeight;

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
            cropWidth,
            cropHeight
        );

        return new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (!blob) {
                    reject(new Error('Canvas is empty'));
                    return;
                }
                const file = new File([blob], 'cropped_image.png', { type: 'image/png' });
                resolve({ file, dimensions: { width: cropWidth, height: cropHeight } });
            }, 'image/png', 0.8);
        });
    }

    const handleSaveCrop = async () => {
        if (completedCrop) {
            const { file, dimensions } = await getCroppedFile();
            onSave(file, dimensions);
            onClose();
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>{t('upload.editBannerTitle', 'Adjust Banner Aspect Ratio')}</DialogTitle>
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
                                alt="Crop me"
                                src={imageSrc}
                                crossOrigin="anonymous"
                                style={{ transform: `scale(${scale}) rotate(${rotate}deg)`, maxHeight: '60vh' }}
                                onLoad={onImageLoad}
                            />
                        </ReactCrop>
                    )}
                    <Box sx={{ width: '80%', mt: 2 }}>
                        <Typography gutterBottom>{t('profile.zoom')}</Typography>
                        <Slider
                            value={scale}
                            min={1}
                            max={3}
                            step={0.01}
                            onChange={(e, newValue) => setScale(newValue)}
                        />
                    </Box>
                    <Box sx={{ width: '80%' }}>
                        <Typography gutterBottom>{t('profile.rotate')}</Typography>
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
                <Button onClick={handleSaveCrop} variant="contained">{t('common.apply', 'Apply')}</Button>
            </DialogActions>
        </Dialog>
    );
};

export default BannerCropper;