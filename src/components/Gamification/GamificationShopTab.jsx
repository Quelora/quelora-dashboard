import React, { useState } from 'react';
import {
    Box, Button, IconButton, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, styled, Dialog, DialogTitle, DialogContent, DialogActions,
    Switch, FormControl, InputLabel, Select, MenuItem, Chip, Typography,
    Avatar, LinearProgress
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon, Edit as EditIcon, Store as StoreIcon, Upload as UploadIcon } from '@mui/icons-material';
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

const ITEM_TYPES = ['PERMANENT', 'CONSUMABLE'];
const EFFECT_TYPES = [
    'CHAR_LIMIT_INCREASE',
    'UNLOCK_MEDIA_GIF',
    'PROFILE_FRAME',
    'NICKNAME_COLOR',
    'STREAK_FREEZE',
    'POST_BOOST',
    'GHOST_MODE'
];

const CATEGORIES = ['UTILITY', 'COSMETIC', 'SOCIAL'];

const GamificationShopTab = ({ t, shopItems, onSave, onDelete, cid }) => {
    const [openModal, setOpenModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({
        name: '', description: '', priceCoins: 100,
        type: 'PERMANENT', effectType: 'CHAR_LIMIT_INCREASE',
        category: 'UTILITY', active: true,
        metadataValue: '', 
        metadataShape: 'CIRCULAR' 
    });

    const [cropperOpen, setCropperOpen] = useState(false);
    const [selectedFileSrc, setSelectedFileSrc] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    const apiBaseUrl = process.env.REACT_APP_API_URL || '';
    const getPreviewUrl = (url) => (!url ? '' : (url.startsWith('http') || url.startsWith('blob:') ? url : `${apiBaseUrl}${url}`));

    const detectAnimatedImage = (file) => {
        return new Promise((resolve) => {
            if (file.type === 'image/gif') {
                resolve(true);
                return;
            }

            if (file.type !== 'image/png' && file.type !== 'image/webp') {
                resolve(false);
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const arr = new Uint8Array(e.target.result);
                let isAnimated = false;

                if (file.type === 'image/png') {
                    const acTL = [0x61, 0x63, 0x54, 0x4C];
                    for (let i = 0; i < arr.length - 8; i++) {
                        if (arr[i] === 0x49 && arr[i+1] === 0x44 && arr[i+2] === 0x41 && arr[i+3] === 0x54) {
                            break;
                        }
                        if (arr[i] === acTL[0] && arr[i+1] === acTL[1] && arr[i+2] === acTL[2] && arr[i+3] === acTL[3]) {
                            isAnimated = true;
                            break;
                        }
                    }
                } else if (file.type === 'image/webp') {
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
            reader.readAsArrayBuffer(file.slice(0, 100 * 1024));
        });
    };

    const handleOpen = (item = null) => {
        if (item) {
            setEditingItem(item);
            setFormData({
                name: item.name,
                description: item.description || '',
                priceCoins: item.priceCoins,
                type: item.type,
                effectType: item.effectType,
                category: item.category,
                active: item.active,
                metadataValue: item.metadata?.value || item.metadata?.assetUrl || '',
                metadataShape: item.metadata?.shape || 'CIRCULAR'
            });
        } else {
            setEditingItem(null);
            setFormData({
                name: '', description: '', priceCoins: 100,
                type: 'PERMANENT', effectType: 'CHAR_LIMIT_INCREASE',
                category: 'UTILITY', active: true,
                metadataValue: '',
                metadataShape: 'CIRCULAR'
            });
        }
        setOpenModal(true);
    };

    const handleClose = () => {
        setOpenModal(false);
        setEditingItem(null);
        setSelectedFileSrc(null);
    };

    const handleSaveInternal = async () => {
        if (!formData.name || formData.priceCoins < 0) return;

        const metadata = {};
        
        if (formData.effectType === 'PROFILE_FRAME') {
            metadata.assetUrl = formData.metadataValue;
            metadata.shape = formData.metadataShape;
        } else {
            const numVal = Number(formData.metadataValue);
            metadata.value = !isNaN(numVal) && formData.metadataValue !== '' ? numVal : formData.metadataValue;
        }

        const payload = {
            ...formData,
            priceCoins: parseInt(formData.priceCoins),
            metadata,
            _id: editingItem ? editingItem._id : undefined
        };
        
        delete payload.metadataValue;
        delete payload.metadataShape;

        const success = await onSave(payload);
        if (success) handleClose();
    };

    const onFileSelect = async (event) => {
        if (event.target.files && event.target.files.length > 0) {
            const file = event.target.files[0];

            const isAnimated = await detectAnimatedImage(file);

            if (isAnimated) {
                setIsUploading(true);
                try {
                    const response = await uploadGamificationMedia(cid, file);
                    setFormData(prev => ({ ...prev, metadataValue: response.mediaUrl }));
                } catch (error) {
                    console.error("Direct upload failed", error);
                } finally {
                    setIsUploading(false);
                    event.target.value = '';
                }
            } else {
                const reader = new FileReader();
                reader.addEventListener('load', () => setSelectedFileSrc(reader.result));
                reader.readAsDataURL(file);
                setCropperOpen(true);
            }
        }
    };

    const onCropperSave = async (file) => {
        setIsUploading(true);
        try {
            const response = await uploadGamificationMedia(cid, file);
            setFormData(prev => ({ ...prev, metadataValue: response.mediaUrl }));
        } catch (error) {
            console.error("Upload failed", error);
        } finally {
            setIsUploading(false);
            setCropperOpen(false);
            setSelectedFileSrc(null);
        }
    };

    return (
        <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
                    {t('gamification.shop.create_new', 'New Item')}
                </Button>
            </Box>

            <TableContainer component={Paper} elevation={0}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Item</TableCell>
                            <TableCell>{t('gamification.shop.price', 'Price')}</TableCell>
                            <TableCell>{t('gamification.shop.type', 'Type')}</TableCell>
                            <TableCell>{t('gamification.shop.effect', 'Effect')}</TableCell>
                            <TableCell>{t('gamification.shop.active', 'Active')}</TableCell>
                            <TableCell align="right">{t('common.actions')}</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {shopItems.map((item) => (
                            <StyledTableRow key={item._id}>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        {item.effectType === 'PROFILE_FRAME' && item.metadata?.assetUrl ? (
                                            <Avatar 
                                                src={getPreviewUrl(item.metadata.assetUrl)} 
                                                variant={item.metadata?.shape === 'SQUARED' ? 'rounded' : 'circular'}
                                                sx={{ width: 40, height: 40 }} 
                                            />
                                        ) : (
                                            <Avatar sx={{ bgcolor: 'primary.light' }}><StoreIcon /></Avatar>
                                        )}
                                        <Box>
                                            <Typography variant="body2" fontWeight="bold">{item.name}</Typography>
                                            <Typography variant="caption" color="textSecondary">{item.description}</Typography>
                                        </Box>
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Chip label={item.priceCoins} icon={<span role="img" aria-label="coin">🪙</span>} size="small" variant="outlined" />
                                </TableCell>
                                <TableCell>
                                    <Chip label={item.type} size="small" color={item.type === 'PERMANENT' ? 'primary' : 'default'} />
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2">{item.effectType}</Typography>
                                    <Typography variant="caption" color="textSecondary">
                                        {item.effectType === 'PROFILE_FRAME' 
                                            ? `${item.metadata?.shape || 'CIRCULAR'}`
                                            : `Val: ${item.metadata?.value || '-'}`}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Switch checked={item.active} disabled size="small" color="success" />
                                </TableCell>
                                <TableCell align="right">
                                    <IconButton onClick={() => handleOpen(item)} color="primary" size="small">
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton onClick={() => onDelete(item._id)} color="error" size="small">
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </TableCell>
                            </StyledTableRow>
                        ))}
                        {shopItems.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                                    {t('common.no_data_available', 'No items in shop')}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={openModal} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editingItem ? t('gamification.shop.edit_item', 'Edit Item') : t('gamification.shop.create_new', 'New Item')}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <CustomTextField 
                            label={t('gamification.shop.name', 'Name')} 
                            value={formData.name} 
                            onChange={e => setFormData({...formData, name: e.target.value})}
                            fullWidth required
                        />
                        <CustomTextField 
                            label={t('gamification.shop.description', 'Description')} 
                            value={formData.description} 
                            onChange={e => setFormData({...formData, description: e.target.value})}
                            fullWidth multiline rows={2}
                        />

                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <CustomTextField 
                                label={t('gamification.shop.price', 'Price')} 
                                type="number"
                                value={formData.priceCoins} 
                                onChange={e => setFormData({...formData, priceCoins: e.target.value})}
                                fullWidth required
                            />
                            <FormControl fullWidth>
                                <InputLabel>{t('gamification.shop.category', 'Category')}</InputLabel>
                                <Select
                                    value={formData.category}
                                    label={t('gamification.shop.category', 'Category')}
                                    onChange={e => setFormData({...formData, category: e.target.value})}
                                >
                                    {CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <FormControl fullWidth>
                                <InputLabel>{t('gamification.shop.type', 'Type')}</InputLabel>
                                <Select
                                    value={formData.type}
                                    label={t('gamification.shop.type', 'Type')}
                                    onChange={e => setFormData({...formData, type: e.target.value})}
                                >
                                    {ITEM_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                                </Select>
                            </FormControl>
                             <FormControl fullWidth>
                                <InputLabel>{t('gamification.shop.effect', 'Effect')}</InputLabel>
                                <Select
                                    value={formData.effectType}
                                    label={t('gamification.shop.effect', 'Effect')}
                                    onChange={e => setFormData({...formData, effectType: e.target.value})}
                                >
                                    {EFFECT_TYPES.map(e => <MenuItem key={e} value={e}>{e}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Box>
                        
                        <Box sx={{ p: 2, border: '1px dashed var(--border-color)', borderRadius: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                {t('gamification.shop.metadata_config', 'Effect Configuration')}
                            </Typography>

                            {formData.effectType === 'PROFILE_FRAME' ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
                                            {formData.metadataValue ? (
                                                <Avatar 
                                                    src={getPreviewUrl(formData.metadataValue)} 
                                                    variant={formData.metadataShape === 'SQUARED' ? 'rounded' : 'circular'}
                                                    sx={{ width: 80, height: 80 }} 
                                                />
                                            ) : (
                                                <Box sx={{ width: 80, height: 80, bgcolor: '#eee', borderRadius: '50%' }} />
                                            )}
                                        </Box>
                                        
                                        {isUploading ? (
                                            <Box sx={{ width: '100%' }}>
                                                <LinearProgress />
                                                <Typography variant="caption">{t('common.uploading', 'Uploading...')}</Typography>
                                            </Box>
                                        ) : (
                                            <Button variant="outlined" component="label" startIcon={<UploadIcon />}>
                                                {t('gamification.shop.upload_frame_hint', 'Upload Frame (PNG/GIF)')}
                                                <input type="file" hidden accept="image/*" onChange={onFileSelect} />
                                            </Button>
                                        )}
                                    </Box>

                                    <FormControl fullWidth>
                                        <InputLabel>{t('gamification.shop.frame_shape', 'Frame Shape')}</InputLabel>
                                        <Select
                                            value={formData.metadataShape}
                                            label={t('gamification.shop.frame_shape', 'Frame Shape')}
                                            onChange={e => setFormData({...formData, metadataShape: e.target.value})}
                                        >
                                            <MenuItem value="CIRCULAR">{t('gamification.shop.shape_circular', 'Circular (Default)')}</MenuItem>
                                            <MenuItem value="SQUARED">{t('gamification.shop.shape_squared', 'Squared')}</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Box>
                            ) : (
                                <CustomTextField 
                                    label={t('gamification.shop.metadata_value', 'Value (e.g. 50 chars, #FF0000)')}
                                    value={formData.metadataValue} 
                                    onChange={e => setFormData({...formData, metadataValue: e.target.value})}
                                    fullWidth
                                    helperText={
                                        formData.effectType === 'CHAR_LIMIT_INCREASE' ? t('gamification.shop.hint_char_limit', 'Enter number of chars (e.g., 50)') :
                                        formData.effectType === 'NICKNAME_COLOR' ? t('gamification.shop.hint_color', 'Enter Hex Color (e.g., #FFD700)') :
                                        t('gamification.shop.hint_value', 'Enter value')
                                    }
                                />
                            )}
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography sx={{ mr: 2 }}>{t('gamification.shop.active', 'Active')}</Typography>
                            <Switch 
                                checked={formData.active} 
                                onChange={e => setFormData({...formData, active: e.target.checked})} 
                                color="success"
                            />
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

export default GamificationShopTab;