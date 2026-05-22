/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

/**
 * @fileoverview GamificationShopTab component.
 * Admin interface for managing shop items in the gamification system.
 *
 * Changes from previous version:
 *  - PROFILE_FRAME items now expose two independent upload controls:
 *      1. Main asset  → POST /upload/asset  (full-resolution, supports APNG/GIF via direct upload)
 *      2. Thumbnail   → POST /upload/thumb  (pre-processed 46×46 image, also direct upload)
 *    Animated images are detected via binary signature and bypass the cropper on both fields.
 *    Static images on the main asset field still go through the AvatarFrameCropper.
 *    Thumbnail uploads always bypass the cropper (user is expected to provide a final file).
 *  - New "Import Pack" button opens a dialog to upload a `.gpack` archive and shows
 *    a structured result summary (inserted / updated / failed).
 */

import React, { useState, useRef } from 'react';
import {
    Box, Button, IconButton, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, styled, Dialog, DialogTitle, DialogContent, DialogActions,
    Switch, FormControl, InputLabel, Select, MenuItem, Chip, Typography,
    Avatar, LinearProgress, Alert, AlertTitle, Divider, CircularProgress,
    Tooltip
} from '@mui/material';
import {
    Delete as DeleteIcon, Add as AddIcon, Edit as EditIcon, Store as StoreIcon,
    Upload as UploadIcon, FileUpload as PackIcon, Image as ThumbIcon,
    CheckCircle as SuccessIcon, Error as ErrorIcon
} from '@mui/icons-material';
import CustomTextField from '../Common/CustomTextField';
import AvatarFrameCropper from './AvatarFrameCropper';
import { uploadGamificationMedia, uploadGamificationThumb, importGamificationPack } from '../../api/gamification';

// ─── Styles ───────────────────────────────────────────────────────────────────

const StyledTableRow = styled(TableRow)(({ theme }) => ({
    borderBottom: '1px solid var(--border-gray)',
    '&:last-child': { borderBottom: 'none' },
    '&:nth-of-type(odd)': { backgroundColor: 'rgba(0, 0, 0, 0.02)' },
    '&:hover': { backgroundColor: theme.palette.action.hover },
    '[data-theme="dark"] &:nth-of-type(odd)': { backgroundColor: 'rgba(255, 255, 255, 0.05)' },
}));

// ─── Constants ────────────────────────────────────────────────────────────────

const ITEM_TYPES   = ['PERMANENT', 'CONSUMABLE'];
const EFFECT_TYPES = [
    'CHAR_LIMIT_INCREASE', 'UNLOCK_MEDIA_GIF', 'PROFILE_FRAME',
    'NICKNAME_COLOR', 'STREAK_FREEZE', 'POST_BOOST', 'GHOST_MODE',
];
const CATEGORIES = ['UTILITY', 'COSMETIC', 'SOCIAL'];

/** @type {Object} Default form state for a new item. */
const DEFAULT_FORM = {
    name: '', description: '', priceCoins: 100,
    type: 'PERMANENT', effectType: 'CHAR_LIMIT_INCREASE',
    category: 'UTILITY', active: true,
    metadataValue: '',
    metadataShape: 'CIRCULAR',
    metadataThumbnailUrl: '',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Resolves a relative asset URL to an absolute preview URL using the API base.
 *
 * @param {string} url - Relative or absolute asset URL.
 * @returns {string} Full URL safe to use in an <img> src.
 */
const makePreviewUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('blob:')) return url;
    const base = process.env.REACT_APP_API_URL || '';
    return `${base}${url}`;
};

/**
 * Reads the first bytes of an image file and detects whether it contains
 * animation data (APNG `acTL` chunk or WebP `ANIM` chunk).
 *
 * @param {File} file - The image file to inspect.
 * @returns {Promise<boolean>} Resolves to `true` if animation is detected.
 */
const detectAnimatedImage = (file) =>
    new Promise((resolve) => {
        if (file.type === 'image/gif') { resolve(true); return; }
        if (file.type !== 'image/png' && file.type !== 'image/webp') { resolve(false); return; }

        const reader = new FileReader();
        reader.onload = (e) => {
            const arr = new Uint8Array(e.target.result);
            let animated = false;

            if (file.type === 'image/png') {
                for (let i = 0; i < arr.length - 4; i++) {
                    if (arr[i] === 0x49 && arr[i+1] === 0x44 && arr[i+2] === 0x41 && arr[i+3] === 0x54) break;
                    if (arr[i] === 0x61 && arr[i+1] === 0x63 && arr[i+2] === 0x54 && arr[i+3] === 0x4C) {
                        animated = true; break;
                    }
                }
            } else {
                for (let i = 0; i < arr.length - 4; i++) {
                    if (arr[i] === 0x41 && arr[i+1] === 0x4E && arr[i+2] === 0x49 && arr[i+3] === 0x4D) {
                        animated = true; break;
                    }
                }
            }
            resolve(animated);
        };
        reader.readAsArrayBuffer(file.slice(0, 100 * 1024));
    });

// ─── Sub-components ───────────────────────────────────────────────────────────

/**
 * A labelled upload button with an inline image preview.
 * Animated images bypass the cropper and upload directly.
 * Static images on `withCropper=true` fields open the AvatarFrameCropper first.
 *
 * @param {Object}   props
 * @param {string}   props.label          - Button label text.
 * @param {string}   props.previewUrl     - Current preview URL (may be relative).
 * @param {string}   props.shape          - Avatar variant: 'CIRCULAR' | 'SQUARED'.
 * @param {boolean}  props.uploading      - Disables the control while true.
 * @param {boolean}  props.withCropper    - If true, static images go through cropper.
 * @param {Function} props.onUpload       - Called with the resolved URL after upload.
 * @param {Function} props.onCropRequest  - Called with `{ file, src }` when cropper is needed.
 * @param {string}   props.cid            - Client identifier for the upload endpoint.
 * @param {Function} props.uploadFn       - API function `(cid, file) => Promise<{ mediaUrl }>`.
 * @param {string}   [props.t]            - Fallback: use direct label strings for simplicity.
 */
const UploadField = ({
    label, previewUrl, shape, uploading,
    withCropper, onUpload, onCropRequest, cid, uploadFn,
}) => {
    const inputRef = useRef(null);
    const [localUploading, setLocalUploading] = useState(false);
    const isActive = uploading || localUploading;

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = '';

        const animated = await detectAnimatedImage(file);

        if (!animated && withCropper) {
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                onCropRequest({ file, src: reader.result });
            });
            reader.readAsDataURL(file);
            return;
        }

        setLocalUploading(true);
        try {
            const response = await uploadFn(cid, file);
            onUpload(response.mediaUrl);
        } catch (err) {
            console.error('[UploadField] Upload failed:', err);
        } finally {
            setLocalUploading(false);
        }
    };

    const variant = shape === 'SQUARED' ? 'rounded' : 'circular';

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, flex: 1 }}>
            <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {label}
            </Typography>

            <Box sx={{
                width: 72, height: 72,
                bgcolor: 'action.hover',
                borderRadius: variant === 'rounded' ? 2 : '50%',
                overflow: 'hidden',
                border: '2px dashed',
                borderColor: previewUrl ? 'primary.main' : 'divider',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                {previewUrl ? (
                    <img
                        src={makePreviewUrl(previewUrl)}
                        alt={label}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                ) : (
                    <ThumbIcon sx={{ color: 'text.disabled', fontSize: 28 }} />
                )}
            </Box>

            {isActive ? (
                <Box sx={{ width: '100%', textAlign: 'center' }}>
                    <LinearProgress sx={{ mb: 0.5 }} />
                    <Typography variant="caption">Uploading…</Typography>
                </Box>
            ) : (
                <Button
                    variant="outlined"
                    size="small"
                    startIcon={<UploadIcon />}
                    onClick={() => inputRef.current?.click()}
                    disabled={isActive}
                >
                    {label}
                    <input ref={inputRef} type="file" hidden accept="image/*" onChange={handleFileChange} />
                </Button>
            )}
        </Box>
    );
};

// ─── Import Pack Dialog ───────────────────────────────────────────────────────

/**
 * Dialog for importing a `.gpack` archive (tar.gz with manifest.json + assets/).
 *
 * @param {Object}   props
 * @param {boolean}  props.open      - Controls dialog visibility.
 * @param {Function} props.onClose   - Callback to close the dialog.
 * @param {string}   props.cid       - Client identifier.
 * @param {Function} props.t         - i18n translation function.
 * @param {Function} props.onSuccess - Called after a successful import to refresh the list.
 */
const ImportPackDialog = ({ open, onClose, cid, t, onSuccess }) => {
    const inputRef = useRef(null);
    const [file,      setFile]      = useState(null);
    const [loading,   setLoading]   = useState(false);
    const [result,    setResult]    = useState(null);
    const [error,     setError]     = useState(null);

    const handleFileSelect = (e) => {
        const selected = e.target.files?.[0];
        if (selected) { setFile(selected); setResult(null); setError(null); }
        e.target.value = '';
    };

    const handleImport = async () => {
        if (!file) return;
        setLoading(true);
        setResult(null);
        setError(null);
        try {
            const res = await importGamificationPack(cid, file);
            if (res.success) {
                setResult(res);
                onSuccess();
            } else {
                setError(res.message || 'Import failed');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFile(null);
        setResult(null);
        setError(null);
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PackIcon color="primary" />
                {t('gamification.shop.import_pack_title', 'Import .gpack')}
            </DialogTitle>

            <DialogContent>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                    {t('gamification.shop.import_pack_hint',
                        'Upload a .gpack file (tar.gz). It must contain a manifest.json at root level and an assets/ directory with thumbnails in assets/thumbs/.'
                    )}
                </Typography>

                <Paper
                    variant="outlined"
                    sx={{
                        p: 3, mb: 2,
                        border: '2px dashed',
                        borderColor: file ? 'primary.main' : 'divider',
                        borderRadius: 2,
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'border-color 0.2s',
                        '&:hover': { borderColor: 'primary.light' },
                    }}
                    onClick={() => inputRef.current?.click()}
                >
                    <PackIcon sx={{ fontSize: 40, color: file ? 'primary.main' : 'text.disabled', mb: 1 }} />
                    <Typography variant="body2" fontWeight={file ? 'bold' : 'normal'}>
                        {file
                            ? file.name
                            : t('gamification.shop.import_pack_drop', 'Click to select a .gpack file')
                        }
                    </Typography>
                    {file && (
                        <Typography variant="caption" color="textSecondary">
                            {(file.size / 1024).toFixed(1)} KB
                        </Typography>
                    )}
                    <input ref={inputRef} type="file" hidden accept=".gpack,.tar.gz,.gz" onChange={handleFileSelect} />
                </Paper>

                {loading && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <CircularProgress size={20} />
                        <Typography variant="body2">{t('gamification.shop.import_processing', 'Extracting and saving…')}</Typography>
                    </Box>
                )}

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        <AlertTitle>Error</AlertTitle>
                        {error}
                    </Alert>
                )}

                {result && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <Alert severity={result.summary.failed === 0 ? 'success' : 'warning'} icon={<SuccessIcon />}>
                            <AlertTitle>{t('gamification.shop.import_done', 'Import complete')}</AlertTitle>
                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 0.5 }}>
                                <Chip label={`${result.summary.inserted} inserted`} size="small" color="success" variant="outlined" />
                                <Chip label={`${result.summary.updated} updated`}  size="small" color="info"    variant="outlined" />
                                {result.summary.failed > 0 && (
                                    <Chip label={`${result.summary.failed} failed`} size="small" color="error" variant="outlined" />
                                )}
                            </Box>
                        </Alert>

                        {result.errors?.length > 0 && (
                            <Paper variant="outlined" sx={{ p: 1.5, maxHeight: 160, overflow: 'auto' }}>
                                <Typography variant="caption" fontWeight="bold" color="error.main">
                                    {t('gamification.shop.import_errors', 'Errors')}
                                </Typography>
                                {result.errors.map((e, idx) => (
                                    <Box key={idx} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', mt: 0.5 }}>
                                        <ErrorIcon fontSize="small" color="error" sx={{ mt: 0.2, flexShrink: 0 }} />
                                        <Typography variant="caption">
                                            <strong>{e.name}:</strong> {e.error}
                                        </Typography>
                                    </Box>
                                ))}
                            </Paper>
                        )}
                    </Box>
                )}
            </DialogContent>

            <DialogActions>
                <Button onClick={handleClose}>{t('common.close', 'Close')}</Button>
                <Button
                    variant="contained"
                    startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <PackIcon />}
                    onClick={handleImport}
                    disabled={!file || loading || !!result}
                >
                    {t('gamification.shop.import_btn', 'Import')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────

/**
 * Shop tab for the Gamification admin page.
 * Allows creating, editing, and deleting shop items, uploading their assets and
 * thumbnails independently, and bulk-importing items via a `.gpack` archive.
 *
 * @param {Object}    props
 * @param {Function}  props.t          - i18n translation function.
 * @param {Array}     props.shopItems  - Current list of shop items from the hook.
 * @param {Function}  props.onSave     - Async function to create/update an item.
 * @param {Function}  props.onDelete   - Async function to delete an item by ID.
 * @param {string}    props.cid        - Client identifier.
 * @returns {React.ReactElement}
 */
const GamificationShopTab = ({ t, shopItems, onSave, onDelete, cid }) => {
    const [openModal,    setOpenModal]    = useState(false);
    const [openImport,   setOpenImport]   = useState(false);
    const [editingItem,  setEditingItem]  = useState(null);
    const [cropperOpen,  setCropperOpen]  = useState(false);
    const [cropperSrc,   setCropperSrc]   = useState(null);
    const [uploadingMain, setUploadingMain] = useState(false);

    const [formData, setFormData] = useState(DEFAULT_FORM);

    // ── Helpers ────────────────────────────────────────────────────────────

    const patchForm = (patch) => setFormData((prev) => ({ ...prev, ...patch }));

    // ── Modal lifecycle ────────────────────────────────────────────────────

    const handleOpen = (item = null) => {
        if (item) {
            setEditingItem(item);
            setFormData({
                name:                item.name,
                description:         item.description       || '',
                priceCoins:          item.priceCoins,
                type:                item.type,
                effectType:          item.effectType,
                category:            item.category,
                active:              item.active,
                metadataValue:       item.metadata?.value   || item.metadata?.assetUrl || '',
                metadataShape:       item.metadata?.shape   || 'CIRCULAR',
                metadataThumbnailUrl: item.metadata?.thumbnailUrl || '',
            });
        } else {
            setEditingItem(null);
            setFormData(DEFAULT_FORM);
        }
        setOpenModal(true);
    };

    const handleClose = () => {
        setOpenModal(false);
        setEditingItem(null);
        setCropperSrc(null);
    };

    // ── Save ───────────────────────────────────────────────────────────────

    const handleSaveInternal = async () => {
        if (!formData.name || formData.priceCoins < 0) return;

        const metadata = {};
        if (formData.effectType === 'PROFILE_FRAME') {
            metadata.assetUrl      = formData.metadataValue;
            metadata.thumbnailUrl  = formData.metadataThumbnailUrl;
            metadata.shape         = formData.metadataShape;
        } else {
            const numVal = Number(formData.metadataValue);
            metadata.value = (!isNaN(numVal) && formData.metadataValue !== '')
                ? numVal
                : formData.metadataValue;
        }

        const payload = {
            name:        formData.name,
            description: formData.description,
            priceCoins:  parseInt(formData.priceCoins),
            type:        formData.type,
            effectType:  formData.effectType,
            category:    formData.category,
            active:      formData.active,
            metadata,
            _id:         editingItem ? editingItem._id : undefined,
        };

        const success = await onSave(payload);
        if (success) handleClose();
    };

    // ── Main asset upload / cropper ────────────────────────────────────────

    /**
     * Called by UploadField when a static image needs cropping (main asset only).
     *
     * @param {{ file: File, src: string }} param0
     */
    const handleCropRequest = ({ src }) => {
        setCropperSrc(src);
        setCropperOpen(true);
    };

    /**
     * Called by AvatarFrameCropper after the user confirms the crop.
     *
     * @param {File} croppedFile
     */
    const onCropperSave = async (croppedFile) => {
        setCropperOpen(false);
        setCropperSrc(null);
        setUploadingMain(true);
        try {
            const response = await uploadGamificationMedia(cid, croppedFile);
            patchForm({ metadataValue: response.mediaUrl });
        } catch (err) {
            console.error('[ShopTab] Crop upload failed:', err);
        } finally {
            setUploadingMain(false);
        }
    };

    // ── Render ─────────────────────────────────────────────────────────────

    return (
        <Box sx={{ p: 2 }}>

            {/* ── Toolbar ─────────────────────────────────────────────────── */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mb: 2 }}>
                <Tooltip title={t('gamification.shop.import_pack_title', 'Import .gpack')}>
                    <Button
                        variant="outlined"
                        startIcon={<PackIcon />}
                        onClick={() => setOpenImport(true)}
                    >
                        {t('gamification.shop.import_btn', 'Import Pack')}
                    </Button>
                </Tooltip>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
                    {t('gamification.shop.create_new', 'New Item')}
                </Button>
            </Box>

            {/* ── Table ───────────────────────────────────────────────────── */}
            <TableContainer component={Paper} elevation={0}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Item</TableCell>
                            <TableCell>{t('gamification.shop.price',  'Price')}</TableCell>
                            <TableCell>{t('gamification.shop.type',   'Type')}</TableCell>
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
                                            <Tooltip
                                                title={
                                                    item.metadata?.thumbnailUrl
                                                        ? <img src={makePreviewUrl(item.metadata.thumbnailUrl)} alt="thumb" style={{ width: 46, height: 46 }} />
                                                        : 'No thumbnail'
                                                }
                                            >
                                                <Avatar
                                                    src={makePreviewUrl(item.metadata.assetUrl)}
                                                    variant={item.metadata?.shape === 'SQUARED' ? 'rounded' : 'circular'}
                                                    sx={{ width: 40, height: 40 }}
                                                />
                                            </Tooltip>
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
                                    <Chip
                                        label={item.priceCoins}
                                        icon={<span role="img" aria-label="coin">🪙</span>}
                                        size="small" variant="outlined"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={item.type} size="small"
                                        color={item.type === 'PERMANENT' ? 'primary' : 'default'}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2">{item.effectType}</Typography>
                                    <Typography variant="caption" color="textSecondary">
                                        {item.effectType === 'PROFILE_FRAME'
                                            ? item.metadata?.shape || 'CIRCULAR'
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

            {/* ── Create / Edit Dialog ─────────────────────────────────────── */}
            <Dialog open={openModal} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editingItem
                        ? t('gamification.shop.edit_item',  'Edit Item')
                        : t('gamification.shop.create_new', 'New Item')}
                </DialogTitle>

                <DialogContent>
                    <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>

                        <CustomTextField
                            label={t('gamification.shop.name', 'Name')}
                            value={formData.name}
                            onChange={(e) => patchForm({ name: e.target.value })}
                            fullWidth required
                        />
                        <CustomTextField
                            label={t('gamification.shop.description', 'Description')}
                            value={formData.description}
                            onChange={(e) => patchForm({ description: e.target.value })}
                            fullWidth multiline rows={2}
                        />

                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <CustomTextField
                                label={t('gamification.shop.price', 'Price')}
                                type="number"
                                value={formData.priceCoins}
                                onChange={(e) => patchForm({ priceCoins: e.target.value })}
                                fullWidth required
                            />
                            <FormControl fullWidth>
                                <InputLabel>{t('gamification.shop.category', 'Category')}</InputLabel>
                                <Select
                                    value={formData.category}
                                    label={t('gamification.shop.category', 'Category')}
                                    onChange={(e) => patchForm({ category: e.target.value })}
                                >
                                    {CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <FormControl fullWidth>
                                <InputLabel>{t('gamification.shop.type', 'Type')}</InputLabel>
                                <Select
                                    value={formData.type}
                                    label={t('gamification.shop.type', 'Type')}
                                    onChange={(e) => patchForm({ type: e.target.value })}
                                >
                                    {ITEM_TYPES.map((it) => <MenuItem key={it} value={it}>{it}</MenuItem>)}
                                </Select>
                            </FormControl>
                            <FormControl fullWidth>
                                <InputLabel>{t('gamification.shop.effect', 'Effect')}</InputLabel>
                                <Select
                                    value={formData.effectType}
                                    label={t('gamification.shop.effect', 'Effect')}
                                    onChange={(e) => patchForm({ effectType: e.target.value })}
                                >
                                    {EFFECT_TYPES.map((ef) => <MenuItem key={ef} value={ef}>{ef}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Box>

                        {/* ── Effect Configuration ─────────────────────────── */}
                        <Box sx={{ p: 2, border: '1px dashed var(--border-color)', borderRadius: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                {t('gamification.shop.metadata_config', 'Effect Configuration')}
                            </Typography>

                            {formData.effectType === 'PROFILE_FRAME' ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

                                    {/* ── Dual upload row ──────────────────── */}
                                    <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center', pt: 1 }}>
                                        <UploadField
                                            label={t('gamification.shop.upload_frame_asset', 'Full Asset')}
                                            previewUrl={formData.metadataValue}
                                            shape={formData.metadataShape}
                                            uploading={uploadingMain}
                                            withCropper={true}
                                            onUpload={(url) => patchForm({ metadataValue: url })}
                                            onCropRequest={handleCropRequest}
                                            cid={cid}
                                            uploadFn={uploadGamificationMedia}
                                        />

                                        <Divider orientation="vertical" flexItem />

                                        <UploadField
                                            label={t('gamification.shop.upload_frame_thumb', 'Thumbnail (46×46)')}
                                            previewUrl={formData.metadataThumbnailUrl}
                                            shape={formData.metadataShape}
                                            uploading={false}
                                            withCropper={false}
                                            onUpload={(url) => patchForm({ metadataThumbnailUrl: url })}
                                            onCropRequest={() => {}}
                                            cid={cid}
                                            uploadFn={uploadGamificationThumb}
                                        />
                                    </Box>

                                    <Typography variant="caption" color="textSecondary" sx={{ textAlign: 'center' }}>
                                        {t('gamification.shop.thumb_hint',
                                            'For animated frames (APNG/GIF), prepare the thumbnail with resize-thumbs.py before uploading.'
                                        )}
                                    </Typography>

                                    <FormControl fullWidth>
                                        <InputLabel>{t('gamification.shop.frame_shape', 'Frame Shape')}</InputLabel>
                                        <Select
                                            value={formData.metadataShape}
                                            label={t('gamification.shop.frame_shape', 'Frame Shape')}
                                            onChange={(e) => patchForm({ metadataShape: e.target.value })}
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
                                    onChange={(e) => patchForm({ metadataValue: e.target.value })}
                                    fullWidth
                                    helperText={
                                        formData.effectType === 'CHAR_LIMIT_INCREASE'
                                            ? t('gamification.shop.hint_char_limit', 'Enter number of extra chars (e.g., 50)')
                                            : formData.effectType === 'NICKNAME_COLOR'
                                                ? t('gamification.shop.hint_color', 'Enter hex color (e.g., #FFD700)')
                                                : t('gamification.shop.hint_value', 'Enter value')
                                    }
                                />
                            )}
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography sx={{ mr: 2 }}>{t('gamification.shop.active', 'Active')}</Typography>
                            <Switch
                                checked={formData.active}
                                onChange={(e) => patchForm({ active: e.target.checked })}
                                color="success"
                            />
                        </Box>
                    </Box>
                </DialogContent>

                <DialogActions>
                    <Button onClick={handleClose}>{t('common.cancel')}</Button>
                    <Button
                        onClick={handleSaveInternal}
                        variant="contained"
                        disabled={uploadingMain}
                    >
                        {t('common.save')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ── Crop dialog (main asset only) ────────────────────────────── */}
            <AvatarFrameCropper
                open={cropperOpen}
                onClose={() => { setCropperOpen(false); setCropperSrc(null); }}
                onSave={onCropperSave}
                imageSrc={cropperSrc}
            />

            {/* ── Import pack dialog ───────────────────────────────────────── */}
            <ImportPackDialog
                open={openImport}
                onClose={() => setOpenImport(false)}
                cid={cid}
                t={t}
                onSuccess={() => {}}
            />
        </Box>
    );
};

export default GamificationShopTab;