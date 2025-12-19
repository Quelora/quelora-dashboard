// filepath: ./src/components/Advertiser/AdvertiserProfileForm.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Button,
    CircularProgress,
    Grid,
    Alert,
    Avatar,
    FormControlLabel,
    Switch,
    FormGroup,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    OutlinedInput,
    Chip,
    Checkbox,
    ListItemText,
    FormHelperText
} from '@mui/material';
import {
    Save as SaveIcon,
    Cancel as CancelIcon,
    Upload as UploadIcon,
    Link as LinkIcon
} from '@mui/icons-material';
import { upsertAdvertiserProfile } from '../../api/advertiserProfiles';
import { loadClientsFromSession } from '../../api/auth';
import CustomTextField from '../Common/CustomTextField';
import ImageCropper from '../Profile/ImageCropper';
import BackgroundCropper from './BackgroundCropper';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
    PaperProps: {
        style: {
            maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
            width: 250,
        },
    },
};

const AdvertiserProfileForm = ({
    initialData = {},
    onSave,
    onCancel,
    mode = 'create',
}) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        name: '',
        cids: [],
        email: '',
        avatarUrl: '',
        backgroundUrl: '',
        profileLink: '',
        twitterProfile: '',
        instagramProfile: '',
        facebookProfile: '',
        softDeleteVisibility: 'visible',
        ...initialData
    });
    const [availableClients, setAvailableClients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [avatarCropperOpen, setAvatarCropperOpen] = useState(false);
    const [backgroundCropperOpen, setBackgroundCropperOpen] = useState(false);
    const [imageSrc, setImageSrc] = useState(null);
    const fileInputRef = useRef(null);
    const backgroundInputRef = useRef(null);

    const apiBaseUrl = process.env.REACT_APP_API_URL || '';

    useEffect(() => {
        const clients = loadClientsFromSession();
        setAvailableClients(clients || []);
    }, []);

    useEffect(() => {
        // Fix: Handle null initialData explicitly to avoid "Cannot read properties of null (reading 'cids')"
        const safeData = initialData || {};
        
        setFormData({
            name: '',
            cids: [],
            email: '',
            avatarUrl: '',
            backgroundUrl: '',
            profileLink: '',
            twitterProfile: '',
            instagramProfile: '',
            facebookProfile: '',
            softDeleteVisibility: 'visible',
            ...safeData,
            cids: safeData.cids || []
        });
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleCidsChange = (event) => {
        const { target: { value } } = event;
        setFormData(prev => ({
            ...prev,
            cids: typeof value === 'string' ? value.split(',') : value,
        }));
    };

    const handleVisibilityChange = (e) => {
        const isVisible = e.target.checked;
        setFormData(prev => ({
            ...prev,
            softDeleteVisibility: isVisible ? 'visible' : 'archived'
        }));
    };

    const handleFileChange = (e, imageType = 'avatar') => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setImageSrc(reader.result);
                if (imageType === 'avatar') {
                    setAvatarCropperOpen(true);
                } else {
                    setBackgroundCropperOpen(true);
                }
            };
            reader.readAsDataURL(file);
        }
        e.target.value = null;
    };

    const handleAvatarCropSave = (base64Image) => {
        setFormData(prev => ({ ...prev, avatarUrl: base64Image }));
    };

    const handleBackgroundCropSave = (base64Image) => {
        setFormData(prev => ({ ...prev, backgroundUrl: base64Image }));
    };

    const getPreviewUrl = (url) => {
        if (!url) return '';
        if (url.startsWith('data:image/')) return url;
        if (url.startsWith('http')) return url;
        return `${apiBaseUrl}${url}`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name) {
            setError(t('advertiser.formError', 'Name is required.'));
            return;
        }
        if (!formData.cids || formData.cids.length === 0) {
            setError(t('advertiser.cidError', 'Please select at least one client.'));
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await upsertAdvertiserProfile(formData);
            if (onSave) {
                onSave(response.data);
            }
        } catch (err) {
            setError(err.message || t('advertiser.errorSaving', 'Error saving profile.'));
        } finally {
            setLoading(false);
        }
    };

    const isVisible = formData.softDeleteVisibility === 'visible';

    return (
        <Box component="form" onSubmit={handleSubmit} noValidate>
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
            )}
            <Grid container spacing={3} direction="column">
                <Grid item sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ position: 'relative', width: '100%', maxWidth: 500 }}>
                        <Box
                            sx={{
                                width: '100%',
                                height: 140,
                                backgroundColor: 'grey.200',
                                backgroundImage: formData.backgroundUrl ? `url(${getPreviewUrl(formData.backgroundUrl)})` : 'none',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                borderRadius: 1,
                                border: '1px dashed grey.400',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer'
                            }}
                            onClick={() => backgroundInputRef.current?.click()}
                        >
                            {!formData.backgroundUrl && (
                                <UploadIcon fontSize="large" color="action" />
                            )}
                        </Box>
                        <Avatar
                            src={getPreviewUrl(formData.avatarUrl)}
                            sx={{
                                width: 80,
                                height: 80,
                                position: 'absolute',
                                bottom: -20,
                                left: 20,
                                border: '3px solid white'
                            }}
                        />
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, mt: 3 }}>
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<UploadIcon />}
                            onClick={() => fileInputRef.current?.click()}
                        >{t('upload.uploadAvatar', 'Upload Avatar')}</Button>
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<UploadIcon />}
                            onClick={() => backgroundInputRef.current?.click()}
                        >{t('upload.uploadBackground', 'Upload Background')}</Button>
                    </Box>
                    <input
                        type="file"
                        hidden
                        ref={fileInputRef}
                        onChange={(e) => handleFileChange(e, 'avatar')}
                        accept="image/png, image/jpeg, image/webp"
                    />
                    <input
                        type="file"
                        hidden
                        ref={backgroundInputRef}
                        onChange={(e) => handleFileChange(e, 'background')}
                        accept="image/png, image/jpeg, image/webp"
                    />
                </Grid>
                <Grid item>
                    <FormControl fullWidth required error={!formData.cids || formData.cids.length === 0}>
                        <InputLabel id="cids-label">{t('campaign.clients', 'Clients (CIDs)')}</InputLabel>
                        <Select
                            labelId="cids-label"
                            id="cids-select"
                            multiple
                            value={formData.cids}
                            onChange={handleCidsChange}
                            input={<OutlinedInput label={t('campaign.clients', 'Clients (CIDs)')} />}
                            renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>{selected.map((value) => <Chip key={value} label={value} size="small" />)}</Box>
                            )}
                            MenuProps={MenuProps}
                        >
                            {availableClients.map((client) => (
                                <MenuItem key={client.cid} value={client.cid}>
                                    <Checkbox checked={formData.cids.indexOf(client.cid) > -1} />
                                    <ListItemText primary={client.name || client.cid} secondary={client.cid} />
                                </MenuItem>
                            ))}
                        </Select>
                        {(!formData.cids || formData.cids.length === 0) && (
                            <FormHelperText>{t('advertiser.cidRequired', 'At least one client is required')}</FormHelperText>
                        )}
                    </FormControl>
                </Grid>
                <Grid item>
                    <CustomTextField
                        label={t('advertiser.name', 'Advertiser Name')}
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        fullWidth
                        required
                    />
                </Grid>
                <Grid item>
                    <CustomTextField
                        label={t('advertiser.email', 'Email')}
                        name="email"
                        type="email"
                        value={formData.email || ''}
                        onChange={handleChange}
                        fullWidth
                        helperText={t('advertiser.emailHelp', 'Contact email for this profile')}
                    />
                </Grid>
                <Grid item>
                    <CustomTextField
                        label={t('advertiser.profileLink', 'Profile Link URL')}
                        name="profileLink"
                        value={formData.profileLink || ''}
                        onChange={handleChange}
                        fullWidth
                        helperText={t('advertiser.profileLinkHelp', 'Main profile website URL')}
                        InputProps={{
                            startAdornment: <LinkIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                    />
                </Grid>
                <Grid item container spacing={2}>
                    <Grid item xs={12} sm={4}>
                        <CustomTextField
                            label="Twitter"
                            name="twitterProfile"
                            value={formData.twitterProfile || ''}
                            onChange={handleChange}
                            fullWidth
                            placeholder="@username"
                        />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <CustomTextField
                            label="Instagram"
                            name="instagramProfile"
                            value={formData.instagramProfile || ''}
                            onChange={handleChange}
                            fullWidth
                            placeholder="@username"
                        />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <CustomTextField
                            label="Facebook"
                            name="facebookProfile"
                            value={formData.facebookProfile || ''}
                            onChange={handleChange}
                            fullWidth
                            placeholder="username"
                        />
                    </Grid>
                </Grid>
                {mode === 'edit' && (
                    <Grid item>
                        <FormGroup>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={isVisible}
                                        onChange={handleVisibilityChange}
                                        name="visibility"
                                        color="primary"
                                    />
                                }
                                label={isVisible ?
                                    t('advertiser.visible', 'Profile is visible') :
                                    t('advertiser.archived', 'Profile is archived')
                                }
                            />
                        </FormGroup>
                    </Grid>
                )}
            </Grid>
            <Box sx={{ mt: 3, textAlign: 'right', display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Button
                    variant="outlined"
                    onClick={onCancel}
                    startIcon={<CancelIcon />}
                >{t('common.cancel', 'Cancel')}</Button>
                <Button
                    type="submit"
                    variant="contained"
                    startIcon={<SaveIcon />}
                    disabled={loading}
                >{loading ? <CircularProgress size={24} /> : t(`common.${mode === 'create' ? 'create' : 'save'}`)}</Button>
            </Box>
            <ImageCropper
                open={avatarCropperOpen}
                onClose={() => setAvatarCropperOpen(false)}
                onSave={handleAvatarCropSave}
                imageSrc={imageSrc}
            />
            <BackgroundCropper
                open={backgroundCropperOpen}
                onClose={() => setBackgroundCropperOpen(false)}
                onSave={handleBackgroundCropSave}
                imageSrc={imageSrc}
            />
        </Box>
    );
};

export default AdvertiserProfileForm;