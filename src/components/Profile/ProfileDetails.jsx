// ./src/components/Profile/ProfileDetails.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
    Box, 
    Typography, 
    Button, 
    Paper, 
    Grid,
    Alert,
    Snackbar,
    Avatar,
    IconButton,
    CircularProgress
} from '@mui/material';
import {
    Person as PersonIcon,
    Edit as EditIcon
} from '@mui/icons-material';
import CustomTextField from '../Common/CustomTextField';
import { useUser } from '../../contexts/UserContext';
import ImageCropper from './ImageCropper';

const ProfileDetails = () => {
    const { t } = useTranslation();
    const userContext = useUser();
    
    const [formData, setFormData] = useState({
        given_name: '',
        family_name: '',
        email: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [imageSrc, setImageSrc] = useState(null);
    const [cropperOpen, setCropperOpen] = useState(false);

    const { user, loading, updateProfile } = userContext || {};

    useEffect(() => {
        if (user) {
            setFormData({
                given_name: user.given_name || '',
                family_name: user.family_name || '',
                email: user.email || ''
            });
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        setSuccess('');
        try {
            await updateProfile(formData);
            setSuccess(t('profile.profile_updated_success'));
        } catch (err) {
            setError(err.toString());
        } finally {
            setIsSubmitting(false);
        }
    };

    const onFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                setImageSrc(reader.result?.toString() || '');
                setCropperOpen(true);
            });
            reader.readAsDataURL(file);
            e.target.value = null;
        }
    };

    const handleAvatarSave = async (base64Image) => {
        setIsSubmitting(true);
        setError('');
        setSuccess('');
        try {
            await updateProfile({ picture: base64Image });
            setSuccess(t('profile.avatar_updated_success'));
        } catch (err) {
            setError(err.toString());
        } finally {
            setIsSubmitting(false);
            setCropperOpen(false);
            setImageSrc(null);
        }
    };

    const handleCloseSnackbar = () => {
        setError('');
        setSuccess('');
    };

    if (!userContext || loading) {
        return (
            <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <>
            <Paper sx={{ p: 3, borderRadius: '12px' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <PersonIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">{t('profile.profile_details')}</Typography>
                </Box>

                <Box component="form" onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
                            <Box sx={{ position: 'relative' }}>
                                <Avatar
                                    src={user?.picture || '/images/avatar.jpg'}
                                    alt={user?.given_name || ''}
                                    sx={{ width: 120, height: 120 }}
                                />
                                <IconButton
                                    component="label"
                                    sx={{
                                        position: 'absolute',
                                        bottom: 8,
                                        right: 8,
                                        backgroundColor: 'background.paper',
                                        '&:hover': { backgroundColor: 'background.default' },
                                        border: '1px solid',
                                        borderColor: 'divider'
                                    }}
                                >
                                    <EditIcon fontSize="small" />
                                    <input type="file" accept="image/*" hidden onChange={onFileChange} />
                                </IconButton>
                            </Box>
                        </Grid>

                        <Grid item xs={12} md={8}>
                            <Grid container spacing={2} sx={{ flexDirection: 'column' }}>
                                <Grid item xs={12}>
                                    <CustomTextField
                                        fullWidth
                                        label={t('profile.given_name')}
                                        name="given_name"
                                        value={formData.given_name}
                                        onChange={handleChange}
                                        disabled={isSubmitting}
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <CustomTextField
                                        fullWidth
                                        label={t('profile.family_name')}
                                        name="family_name"
                                        value={formData.family_name}
                                        onChange={handleChange}
                                        disabled={isSubmitting}
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <CustomTextField
                                        fullWidth
                                        label={t('profile.email')}
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        disabled={isSubmitting}
                                    />
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>

                    <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={isSubmitting}
                            startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
                        >
                            {t('common.save')}
                        </Button>
                    </Grid>
                </Box>
            </Paper>

            <ImageCropper
                open={cropperOpen}
                onClose={() => {
                    setCropperOpen(false);
                    setImageSrc(null);
                }}
                onSave={handleAvatarSave}
                imageSrc={imageSrc}
            />

            <Snackbar
                open={!!error}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseSnackbar} severity="error">
                    {error}
                </Alert>
            </Snackbar>

            <Snackbar
                open={!!success}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseSnackbar} severity="success">
                    {success}
                </Alert>
            </Snackbar>
        </>
    );
};

export default ProfileDetails;
