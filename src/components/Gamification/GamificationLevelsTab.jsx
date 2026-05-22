/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

import React, { useState } from 'react';
import {
    Box, Button, IconButton, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, styled, Dialog, DialogTitle, DialogContent, DialogActions,
    Typography, Avatar, LinearProgress
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon, Edit as EditIcon, Upload as UploadIcon } from '@mui/icons-material';
import CustomTextField from '../Common/CustomTextField';
import AvatarFrameCropper from './AvatarFrameCropper';
import { uploadGamificationMedia } from '../../api/gamification';

const StyledTableRow = styled(TableRow)(({ theme }) => ({
    borderBottom: '1px solid var(--border-gray)',
    '&:last-child': { borderBottom: 'none' },
    '&:nth-of-type(odd)': { backgroundColor: 'rgba(0, 0, 0, 0.02)' },
    '&:hover': { backgroundColor: theme.palette.action.hover },
    '[data-theme="dark"] &:nth-of-type(odd)': { backgroundColor: 'rgba(255, 255, 255, 0.05)' },
}));

const GamificationLevelsTab = ({ t, levels, onSave, onDelete, searchTerm, cid }) => {
    const [openModal, setOpenModal] = useState(false);
    const [editingLevel, setEditingLevel] = useState(null);
    const [formData, setFormData] = useState({ name: '', minPoints: 0, order: 0, avatarFrameUrl: '' });
    
    // Cropper State
    const [cropperOpen, setCropperOpen] = useState(false);
    const [selectedFileSrc, setSelectedFileSrc] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    const apiBaseUrl = process.env.REACT_APP_API_URL || '';

    const getPreviewUrl = (url) => {
        if (!url) return '';
        if (url.startsWith('http') || url.startsWith('blob:')) return url;
        return `${apiBaseUrl}${url}`;
    };

    // Helper para detectar animación real (GIF, WebP animado o APNG)
    const detectAnimatedImage = (file) => {
        return new Promise((resolve) => {
            // 1. Detección fácil por MIME type
            if (file.type === 'image/gif') {
                resolve(true);
                return;
            }

            // 2. Si no es PNG ni WebP, asumimos estático (JPG, etc)
            if (file.type !== 'image/png' && file.type !== 'image/webp') {
                resolve(false);
                return;
            }

            // 3. Inspección binaria para APNG (Animated PNG) o WebP animado
            const reader = new FileReader();
            reader.onload = (e) => {
                const arr = new Uint8Array(e.target.result);
                let isAnimated = false;

                if (file.type === 'image/png') {
                    // APNG contiene el chunk 'acTL'. 
                    // Buscamos la secuencia de bytes ASCII para 'acTL' (0x61, 0x63, 0x54, 0x4C)
                    // antes del chunk 'IDAT'.
                    const acTL = [0x61, 0x63, 0x54, 0x4C];
                    for (let i = 0; i < arr.length - 8; i++) {
                        // Optimización: Si encontramos IDAT antes que acTL, ya no es animado.
                        // IDAT = 0x49 0x44 0x41 0x54
                        if (arr[i] === 0x49 && arr[i+1] === 0x44 && arr[i+2] === 0x41 && arr[i+3] === 0x54) {
                            break;
                        }
                        if (arr[i] === acTL[0] && arr[i+1] === acTL[1] && arr[i+2] === acTL[2] && arr[i+3] === acTL[3]) {
                            isAnimated = true;
                            break;
                        }
                    }
                } else if (file.type === 'image/webp') {
                    // Para WebP, buscamos el chunk 'ANIM'
                    // 'ANIM' = 0x41 0x4E 0x49, 0x4D
                    const ANIM = [0x41, 0x4E, 0x49, 0x4D];
                    for (let i = 0; i < arr.length - 8; i++) {
                        if (arr[i] === ANIM[0] && arr[i+1] === ANIM[1] && arr[i+2] === ANIM[2] && arr[i+3] === ANIM[3]) {
                            isAnimated = true;
                            break;
                        }
                    }
                }

                resolve(isAnimated);
            };
            // Leemos solo los primeros 100KB, usualmente las cabeceras están al inicio.
            // Si el archivo es muy pequeño, slice maneja el límite automáticamente.
            reader.readAsArrayBuffer(file.slice(0, 100 * 1024));
        });
    };

    const handleOpen = (level = null) => {
        if (level) {
            setEditingLevel(level);
            setFormData({ 
                name: level.name, 
                minPoints: level.minPoints, 
                order: level.order,
                avatarFrameUrl: level.avatarFrameUrl || '' 
            });
        } else {
            setEditingLevel(null);
            setFormData({ name: '', minPoints: 0, order: levels.length + 1, avatarFrameUrl: '' });
        }
        setOpenModal(true);
    };

    const handleClose = () => {
        setOpenModal(false);
        setEditingLevel(null);
        setSelectedFileSrc(null);
    };

    const handleSaveInternal = async () => {
        if (!formData.name) return;
        const payload = {
            ...formData,
            _id: editingLevel ? editingLevel._id : undefined
        };
        const success = await onSave(payload);
        if (success) handleClose();
    };

    const onFileSelect = async (event) => {
        if (event.target.files && event.target.files.length > 0) {
            const file = event.target.files[0];
            
            // Verificamos si es animado inspeccionando el archivo
            const isAnimated = await detectAnimatedImage(file);

            if (isAnimated) {
                // FLUJO DIRECTO: Subir sin recortar porque es Animación
                setIsUploading(true);
                try {
                    const response = await uploadGamificationMedia(cid, file);
                    setFormData(prev => ({ ...prev, avatarFrameUrl: response.mediaUrl }));
                } catch (error) {
                    console.error("Direct upload failed", error);
                } finally {
                    setIsUploading(false);
                    // Resetear input
                    event.target.value = ''; 
                }
            } else {
                // FLUJO ESTÁTICO: Abrir Cropper
                const reader = new FileReader();
                reader.addEventListener('load', () => setSelectedFileSrc(reader.result));
                reader.readAsDataURL(file);
                setCropperOpen(true);
            }
        }
    };

    const onCropperSave = async (fileBlob) => {
        setIsUploading(true);
        try {
            const response = await uploadGamificationMedia(cid, fileBlob);
            setFormData(prev => ({ ...prev, avatarFrameUrl: response.mediaUrl }));
        } catch (error) {
            console.error("Cropped upload failed", error);
        } finally {
            setIsUploading(false);
            setCropperOpen(false);
            setSelectedFileSrc(null);
        }
    };

    const sortedLevels = [...levels]
        .filter(l => !searchTerm || l.name.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => a.minPoints - b.minPoints);

    return (
        <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
                    {t('gamification.levels.create_new', 'New Level')}
                </Button>
            </Box>

            <TableContainer component={Paper} elevation={0}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>{t('gamification.levels.order')}</TableCell>
                            <TableCell>{t('gamification.levels.level_name')}</TableCell>
                            <TableCell>{t('gamification.levels.min_points')}</TableCell>
                            <TableCell>Frame</TableCell> 
                            <TableCell align="right">{t('common.actions')}</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {sortedLevels.map((level, index) => (
                            <StyledTableRow key={level._id || index}>
                                <TableCell>{level.order}</TableCell>
                                <TableCell>{level.name}</TableCell>
                                <TableCell>{level.minPoints}</TableCell>
                                <TableCell>
                                    {level.avatarFrameUrl && (
                                        <Avatar 
                                            src={getPreviewUrl(level.avatarFrameUrl)} 
                                            sx={{ width: 40, height: 40, background: 'transparent', border: '1px dashed #ccc' }} 
                                        />
                                    )}
                                </TableCell>
                                <TableCell align="right">
                                    <IconButton onClick={() => handleOpen(level)} color="primary" size="small">
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton onClick={() => onDelete(level._id)} color="error" size="small">
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </TableCell>
                            </StyledTableRow>
                        ))}
                        {sortedLevels.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                                    {t('common.no_data_available', 'No levels defined')}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={openModal} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editingLevel ? t('gamification.levels.edit_level') : t('gamification.levels.create_new')}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <CustomTextField 
                            label={t('gamification.levels.level_name')} 
                            value={formData.name} 
                            onChange={e => setFormData({...formData, name: e.target.value})}
                            fullWidth required
                        />
                        <CustomTextField 
                            label={t('gamification.levels.min_points')} 
                            type="number" 
                            value={formData.minPoints} 
                            onChange={e => setFormData({...formData, minPoints: parseInt(e.target.value) || 0})} 
                            fullWidth required
                        />
                        <CustomTextField 
                            label={t('gamification.levels.order')} 
                            type="number" 
                            value={formData.order} 
                            onChange={e => setFormData({...formData, order: parseInt(e.target.value) || 0})} 
                            fullWidth
                        />

                        <Box sx={{ border: '1px dashed var(--border-color)', p: 2, borderRadius: 2, textAlign: 'center' }}>
                            <Typography variant="body2" gutterBottom>
                                {t('gamification.levels.avatar_frame', 'Avatar Frame (120x120 PNG/GIF)')}
                            </Typography>
                            
                            <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
                                {formData.avatarFrameUrl ? (
                                    <>
                                        <Avatar 
                                            src={getPreviewUrl(formData.avatarFrameUrl)} 
                                            sx={{ width: 80, height: 80, bgcolor: 'transparent', border: '1px solid #eee' }} 
                                        />
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => setFormData({ ...formData, avatarFrameUrl: '' })}
                                            sx={{
                                                position: 'absolute',
                                                top: -10,
                                                right: -10,
                                                bgcolor: 'background.paper',
                                                border: '1px solid #ddd',
                                                '&:hover': { bgcolor: '#ffebee' }
                                            }}
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </>
                                ) : (
                                    <Box sx={{ width: 80, height: 80, bgcolor: 'var(--surface-color-lighter)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto' }}>
                                        <Typography variant="caption" color="textSecondary">No Frame</Typography>
                                    </Box>
                                )}
                            </Box>

                            {isUploading ? (
                                <Box sx={{ width: '100%' }}>
                                    <LinearProgress />
                                    <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                                        {t('common.uploading', 'Uploading Animation...')}
                                    </Typography>
                                </Box>
                            ) : (
                                <Button
                                    variant="outlined"
                                    component="label"
                                    startIcon={<UploadIcon />}
                                    size="small"
                                >
                                    {t('common.upload', 'Upload Frame')}
                                    <input type="file" hidden accept="image/*" onChange={onFileSelect} />
                                </Button>
                            )}
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>{t('common.cancel')}</Button>
                    <Button onClick={handleSaveInternal} variant="contained" disabled={isUploading}>
                        {t('common.save')}
                    </Button>
                </DialogActions>
            </Dialog>

            <AvatarFrameCropper
                open={cropperOpen}
                onClose={() => setCropperOpen(false)}
                onSave={onCropperSave}
                imageSrc={selectedFileSrc}
            />
        </Box>
    );
};

export default GamificationLevelsTab;