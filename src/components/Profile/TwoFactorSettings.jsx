// ./src/components/Profile/TwoFactorSettings.jsx
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
    Alert,
    CircularProgress,
    IconButton,
    InputAdornment
} from '@mui/material';
import {
    Security as SecurityIcon,
    Lock as LockIcon,
    Visibility,
    VisibilityOff
} from '@mui/icons-material';
import { useUser } from '../../contexts/UserContext';
import { setupTwoFactor, verifyTwoFactorSetup, disableTwoFactor } from '../../api/profile';
import { QRCodeSVG } from 'qrcode.react';
import CustomTextField from '../Common/CustomTextField';

const TwoFactorSettings = ({ onError, onSuccess }) => {
    const { t } = useTranslation();
    const { user, loading: userLoading } = useUser();
    
    const [setupModalOpen, setSetupModalOpen] = useState(false);
    const [disableModalOpen, setDisableModalOpen] = useState(false);
    
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [secretKey, setSecretKey] = useState('');
    const [totpToken, setTotpToken] = useState('');
    
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    
    const [loading, setLoading] = useState(false);
    const [modalError, setModalError] = useState('');

    const resetSetupForm = () => {
        setQrCodeUrl('');
        setSecretKey('');
        setTotpToken('');
        setModalError('');
    };

    const resetDisableForm = () => {
        setPassword('');
        setShowPassword(false);
        setModalError('');
    };

    const handleEnableClick = async () => {
        setLoading(true);
        onError('');
        onSuccess('');
        try {
            const data = await setupTwoFactor();
            setQrCodeUrl(data.otpauth_url);
            setSecretKey(data.base32);
            setSetupModalOpen(true);
        } catch (err) {
            onError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifySetup = async () => {
        setLoading(true);
        setModalError('');
        try {
            await verifyTwoFactorSetup(totpToken);
            onSuccess(t('profile.2fa_enabled_success'));
            setSetupModalOpen(false);
            resetSetupForm();
            // Recargamos para que el UserContext obtenga el nuevo estado
            window.location.reload(); 
        } catch (err) {
            setModalError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDisableClick = async () => {
        setLoading(true);
        setModalError('');
        try {
            await disableTwoFactor(password);
            onSuccess(t('profile.2fa_disabled_success'));
            setDisableModalOpen(false);
            resetDisableForm();
            // Recargamos para que el UserContext obtenga el nuevo estado
            window.location.reload();
        } catch (err) {
            setModalError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    if (userLoading) {
        return (
            <Paper sx={{ p: 3, borderRadius: '12px', textAlign: 'center' }}>
                <CircularProgress />
            </Paper>
        );
    }
    
    const isEnabled = user?.twoFactorEnabled;

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
                    <SecurityIcon color="primary" sx={{mr: 1}}/>
                    <Typography variant="h6">
                        {t('profile.2fa_title')}
                    </Typography>
                </Box>
                <Typography variant="body2" color="textSecondary">
                    {isEnabled ? t('profile.2fa_description_enabled') : t('profile.2fa_description_disabled')}
                </Typography>
                
                {isEnabled ? (
                    <Button
                        variant="contained"
                        color="error"
                        startIcon={<LockIcon/>}
                        onClick={() => setDisableModalOpen(true)}
                        disabled={loading}
                        sx={{ maxWidth: '200px' }}
                    >
                        {t('profile.2fa_disable_button')}
                    </Button>
                ) : (
                    <Button
                        variant="contained"
                        startIcon={<SecurityIcon/>}
                        onClick={handleEnableClick}
                        disabled={loading}
                        sx={{ maxWidth: '200px' }}
                    >
                        {t('profile.2fa_enable_button')}
                    </Button>
                )}
            </Paper>

            {/* --- Modal de Configuración (Activar) --- */}
            <Dialog 
                open={setupModalOpen} 
                onClose={() => setSetupModalOpen(false)}
                PaperProps={{className: "profile-dialog"}}
            >
                <DialogTitle className="profile-dialog-title">
                    {t('profile.2fa_setup_title')}
                </DialogTitle>
                <DialogContent className="profile-dialog-content" sx={{textAlign: 'center'}}>
                    {modalError && <Alert severity="error" sx={{mb: 2}}>{modalError}</Alert>}
                    
                    <Typography variant="body2" sx={{mb: 2}}>
                        {t('profile.2fa_setup_scan')}
                    </Typography>

                    {qrCodeUrl ? (
                        <Box sx={{p: 2, background: 'white', display: 'inline-block', borderRadius: '8px', mb: 2}}>
                            <QRCodeSVG value={qrCodeUrl} size={200} />
                        </Box>
                    ) : <CircularProgress />}
                    
                    <Typography variant="body2" sx={{mb: 2}}>
                        {t('profile.2fa_setup_manual')}
                    </Typography>
                    
                    <Paper variant="outlined" sx={{p: 1, mb: 2, userSelect: 'all'}}>
                        <Typography variant="body1" sx={{fontFamily: 'monospace'}}>
                            {secretKey}
                        </Typography>
                    </Paper>

                    <CustomTextField
                        margin="dense"
                        label={t('profile.2fa_setup_code')}
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={totpToken}
                        onChange={(e) => setTotpToken(e.target.value)}
                        inputProps={{ maxLength: 6, inputMode: 'numeric', pattern: '[0-9]*' }}
                        sx={{mb: 1}}
                    />
                </DialogContent>
                <DialogActions className="profile-dialog-actions">
                    <Button onClick={() => setSetupModalOpen(false)}>
                        {t('common.cancel')}
                    </Button>
                    <Button 
                        onClick={handleVerifySetup} 
                        color="primary"
                        variant="contained"
                        disabled={loading || totpToken.length < 6}
                    >
                        {t('common.verify_and_activate')}
                    </Button>
                </DialogActions>
                {loading && <LinearProgress/>}
            </Dialog>

            {/* --- Modal de Desactivación --- */}
            <Dialog 
                open={disableModalOpen} 
                onClose={() => setDisableModalOpen(false)}
                PaperProps={{className: "profile-dialog"}}
            >
                <DialogTitle className="profile-dialog-title">
                    {t('profile.2fa_disable_title')}
                </DialogTitle>
                <DialogContent className="profile-dialog-content">
                    {modalError && <Alert severity="error" sx={{mb: 2}}>{modalError}</Alert>}
                    <Typography variant="body2" sx={{mb: 2}}>
                        {t('profile.2fa_disable_prompt')}
                    </Typography>
                    <CustomTextField
                        margin="dense"
                        label={t('profile.current_password')}
                        type={showPassword ? 'text' : 'password'}
                        fullWidth
                        variant="outlined"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        sx={{mb: 2}}
                        InputProps={{
                            endAdornment: (
                            <InputAdornment position="end">
                                <IconButton
                                    aria-label="toggle password visibility"
                                    onClick={() => setShowPassword(!showPassword)}
                                    onMouseDown={(e) => e.preventDefault()}
                                    edge="end"
                                >
                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                            </InputAdornment>
                            )
                        }}
                    />
                </DialogContent>
                <DialogActions className="profile-dialog-actions">
                    <Button onClick={() => setDisableModalOpen(false)}>
                        {t('common.cancel')}
                    </Button>
                    <Button 
                        onClick={handleDisableClick} 
                        color="error"
                        variant="contained"
                        disabled={loading || password.length < 8}
                    >
                        {t('profile.2fa_disable_confirm')}
                    </Button>
                </DialogActions>
                {loading && <LinearProgress/>}
            </Dialog>
        </>
    );
};

export default TwoFactorSettings;