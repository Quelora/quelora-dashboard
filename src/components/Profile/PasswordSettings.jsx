// ./src/components/Profile/PasswordSettings.jsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
    Box, 
    Typography, 
    Button, 
    Paper, 
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    LinearProgress,
    Stack
} from '@mui/material';
import {
    Password as PasswordIcon,
    VpnKey as VpnKeyIcon,
    CheckCircle,
    Cancel
} from '@mui/icons-material';
import { changePassword } from '../../api/profile';
import CustomTextField from '../Common/CustomTextField';

const PasswordStrengthIndicator = ({ password }) => {
    const { t } = useTranslation();
    const tests = [
        { regex: /.{8,}/, label: t('profile.password_requirement_length') },
        { regex: /[A-Z]/, label: t('profile.password_requirement_uppercase') },
        { regex: /[a-z]/, label: t('profile.password_lowercase') },
        { regex: /[0-9]/, label: t('profile.password_number') },
        { regex: /[\W_]/, label: t('profile.password_requirement_special') }
    ];
    
    const requirements = tests.map(test => ({
        label: test.label,
        valid: test.regex.test(password)
    }));

    return (
        <Stack spacing={1} className="profile-password-strength">
            {requirements.map((req, i) => (
                <Box key={i} className="profile-password-requirement" sx={{display: 'flex', alignItems: 'center'}}>
                    {req.valid ? (
                        <CheckCircle color="success" sx={{fontSize: '1rem', mr: 1}}/>
                    ) : (
                        <Cancel color="error" sx={{fontSize: '1rem', mr: 1}}/>
                    )}
                    <Typography variant="caption" color="text.secondary">
                        {req.label}
                    </Typography>
                </Box>
            ))}
        </Stack>
    );
};

const PasswordSettings = ({ onError, onSuccess }) => {
    const { t } = useTranslation();
    const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const validatePassword = (password) => {
        if (password.length < 8) return { valid: false, message: t('profile.password_length') };
        if (!/[A-Z]/.test(password)) return { valid: false, message: t('profile.password_uppercase') };
        if (!/[a-z]/.test(password)) return { valid: false, message: t('profile.password_lowercase') };
        if (!/[0-9]/.test(password)) return { valid: false, message: t('profile.password_number') };
        if (!/[\W_]/.test(password)) return { valid: false, message: t('profile.password_special') };
        return { valid: true };
    };

    const resetForm = () => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setLoading(false);
    };

    const handlePasswordChange = async () => {
        const validation = validatePassword(newPassword);
        if (!validation.valid) {
            onError(validation.message);
            return;
        }

        if (newPassword !== confirmPassword) {
            onError(t('profile.passwords_not_match'));
            return;
        }

        try {
            setLoading(true);
            await changePassword(currentPassword, newPassword);
            onSuccess(t('profile.password_changed'));
            resetForm();
            setOpenPasswordDialog(false);
        } catch (err) {
            onError(err.toString());
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Paper sx={{
                p: 3, 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 2,
                borderRadius: '12px'
            }}>
                <Box sx={{display: 'flex', alignItems: 'center'}}>
                    <PasswordIcon color="primary" sx={{mr: 1}}/>
                    <Typography variant="h6">
                        {t('profile.change_password')}
                    </Typography>
                </Box>
                <Typography variant="body2" color="textSecondary">
                    {t('profile.change_password_description')}
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<VpnKeyIcon/>}
                    onClick={() => setOpenPasswordDialog(true)}
                    sx={{ 
                        borderRadius: '8px',
                        padding: 'var(--spacing-sm) var(--spacing-lg)',
                        textTransform: 'none',
                        maxWidth: '200px'
                    }}
                >
                    {t('profile.change_password_button')}
                </Button>
            </Paper>

            <Dialog 
                open={openPasswordDialog} 
                onClose={() => setOpenPasswordDialog(false)}
                PaperProps={{className: "profile-dialog"}}
            >
                <DialogTitle className="profile-dialog-title">
                    {t('profile.change_password')}
                </DialogTitle>
                <DialogContent className="profile-dialog-content">
                    <CustomTextField
                        margin="dense"
                        label={t('profile.current_password')}
                        type="password"
                        fullWidth
                        variant="outlined"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        sx={{mb: 2}}
                    />
                    <CustomTextField
                        margin="dense"
                        label={t('profile.new_password')}
                        type="password"
                        fullWidth
                        variant="outlined"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        sx={{mb: 1}}
                    />
                    {newPassword && <PasswordStrengthIndicator password={newPassword}/>}
                    <CustomTextField
                        margin="dense"
                        label={t('profile.confirm_password')}
                        type="password"
                        fullWidth
                        variant="outlined"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        sx={{mt: 2}}
                    />
                </DialogContent>
                <DialogActions className="profile-dialog-actions">
                    <Button 
                        onClick={() => setOpenPasswordDialog(false)}
                        sx={{
                            border: '1px solid var(--border-gray)',
                            color: 'var(--text-primary)',
                            borderRadius: '8px',
                            textTransform: 'none',
                            '&:hover': {
                                backgroundColor: 'rgba(10, 132, 255, 0.1)',
                            }
                        }}
                    >
                        {t('common.cancel')}
                    </Button>
                    <Button 
                        onClick={handlePasswordChange} 
                        color="primary"
                        variant="contained"
                        disabled={loading}
                        sx={{
                            borderRadius: '8px',
                            textTransform: 'none',
                        }}
                    >
                        {t('common.save')}
                    </Button>
                </DialogActions>
                {loading && <LinearProgress/>}
            </Dialog>
        </>
    );
};

export default PasswordSettings;