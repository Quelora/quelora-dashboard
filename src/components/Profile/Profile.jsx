// ./src/components/Profile/Profile.jsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
    Box, 
    Typography, 
    Grid,
    Alert,
    Snackbar
} from '@mui/material';
import ProfileDetails from './ProfileDetails';
import PasswordSettings from './PasswordSettings';
import TwoFactorSettings from './TwoFactorSettings'; // <--- AÑADIR
import React from 'react';

const Profile = () => {
    const { t } = useTranslation();
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleCloseError = () => {
        setError('');
    };

    const handleCloseSuccess = () => {
        setSuccess('');
    };

    return (
        <Box className="container">
            <Box className="client-header">
                <Typography variant="h4" className="title">{t('profile.title')}</Typography>
            </Box>
            
            <Grid container spacing={2} sx={{ flexDirection: 'column' }}>
                <Grid item xs={12}>
                    <ProfileDetails />
                </Grid>
                <Grid item xs={12}>
                    <PasswordSettings 
                        onError={setError} 
                        onSuccess={setSuccess}
                    />
                </Grid>
                
                {/* --- AÑADIR ESTE BLOQUE --- */}
                <Grid item xs={12}>
                    <TwoFactorSettings 
                        onError={setError} 
                        onSuccess={setSuccess}
                    />
                </Grid>
                {/* --- FIN DEL BLOQUE --- */}

            </Grid>

            <Snackbar
                open={!!error}
                autoHideDuration={6000}
                onClose={handleCloseError}
                anchorOrigin={{vertical: 'top', horizontal: 'center'}}
            >
                <Alert 
                    onClose={handleCloseError} 
                    severity="error" 
                    className="profile-alert"
                >
                    {error}
                </Alert>
            </Snackbar>

            <Snackbar
                open={!!success}
                autoHideDuration={6000}
                onClose={handleCloseSuccess}
                anchorOrigin={{vertical: 'top', horizontal: 'center'}}
            >
                <Alert 
                    onClose={handleCloseSuccess} 
                    severity="success" 
                    className="profile-alert"
                >
                    {success}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default Profile;