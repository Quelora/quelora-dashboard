// ./src/components/Profile/ProfilePage.jsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  LinearProgress,
  Stack
} from '@mui/material';
import {
  Password as PasswordIcon,
  VpnKey as VpnKeyIcon,
  CheckCircle,
  Cancel
} from '@mui/icons-material';
import { changePassword } from '../../api/auth';
import '../../assets/css/Profile.css';

const PasswordStrengthIndicator = ({ password }) => {
  const { t } = useTranslation();
  const requirements = [
    { regex: /.{8,}/, label: t('profile.password_requirement_length') },
    { regex: /[A-Z]/, label: t('profile.password_requirement_uppercase') },
    { regex: /[a-z]/, label: t('profile.password_requirement_lowercase') },
    { regex: /[0-9]/, label: t('profile.password_requirement_number') },
    { regex: /[\W_]/, label: t('profile.password_requirement_special') }
  ];

  return (
    <Stack spacing={1} className="profile-password-strength">
      {requirements.map((req, i) => (
        <Box key={i} className="profile-password-requirement">
          {req.regex.test(password) ? (
            <CheckCircle color="success" sx={{ fontSize: '1rem', mr: 1 }} />
          ) : (
            <Cancel color="error" sx={{ fontSize: '1rem', mr: 1 }} />
          )}
          <Typography variant="caption" color="text.secondary">
            {req.label}
          </Typography>
        </Box>
      ))}
    </Stack>
  );
};

const ProfilePage = () => {
  const { t } = useTranslation();
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const validatePassword = (password) => {
    if (password.length < 8) {
      return { valid: false, message: t('profile.password_length') };
    }
    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: t('profile.password_uppercase') };
    }
    if (!/[a-z]/.test(password)) {
      return { valid: false, message: t('profile.password_lowercase') };
    }
    if (!/[0-9]/.test(password)) {
      return { valid: false, message: t('profile.password_number') };
    }
    if (!/[\W_]/.test(password)) {
      return { valid: false, message: t('profile.password_special') };
    }
    return { valid: true };
  };

  const handlePasswordChange = async () => {
    const validation = validatePassword(newPassword);
    if (!validation.valid) {
      setError(validation.message);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('profile.passwords_not_match'));
      return;
    }

    try {
      setLoading(true);
      await changePassword(currentPassword, newPassword);
      setSuccess(t('profile.password_changed'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setOpenPasswordDialog(false);
    } catch (err) {
      setError(err.toString());
    } finally {
      setLoading(false);
    }
  };

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
      <Paper className="client-paper" sx={{ width: '100%'}}>
        <Grid container sx={{ padding: '16px' }}>
          <Grid item xs={12} sx={{ width: '100%' }}>
            <Paper className="profile-card">
              <Box className="profile-card-header">
                <PasswordIcon color="primary" className="profile-card-icon" />
                <Typography variant="h6" className="profile-card-title">
                  {t('profile.change_password')}
                </Typography>
              </Box>
              <Typography variant="body2" className="profile-card-description">
                {t('profile.change_password_description')}
              </Typography>
              <Button
                variant="contained"
                startIcon={<VpnKeyIcon />}
                onClick={() => setOpenPasswordDialog(true)}
                className="profile-button"
              >
                {t('profile.change_password_button')}
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Paper>
      {/* Change Password Dialog */}
      <Dialog 
        open={openPasswordDialog} 
        onClose={() => setOpenPasswordDialog(false)}
        PaperProps={{ className: "profile-dialog" }}
      >
        <DialogTitle className="profile-dialog-title">
          {t('profile.change_password')}
        </DialogTitle>
        <DialogContent className="profile-dialog-content">
          <TextField
            margin="dense"
            label={t('profile.current_password')}
            type="password"
            fullWidth
            variant="outlined"
            size="small"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label={t('profile.new_password')}
            type="password"
            fullWidth
            variant="outlined"
            size="small"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            sx={{ mb: 1 }}
          />
          {newPassword && <PasswordStrengthIndicator password={newPassword} />}
          <TextField
            margin="dense"
            label={t('profile.confirm_password')}
            type="password"
            fullWidth
            variant="outlined"
            size="small"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions className="profile-dialog-actions">
          <Button 
            onClick={() => setOpenPasswordDialog(false)}
            className="profile-button"
          >
            {t('common.cancel')}
          </Button>
          <Button 
            onClick={handlePasswordChange} 
            color="primary"
            variant="contained"
            disabled={loading}
            className="profile-button"
          >
            {t('common.save')}
          </Button>
        </DialogActions>
        {loading && <LinearProgress />}
      </Dialog>

      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseError} 
          severity="error" 
          className="profile-alert"
        >
          {error}
        </Alert>
      </Snackbar>

      {/* Success Snackbar */}
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={handleCloseSuccess}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
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

export default ProfilePage;