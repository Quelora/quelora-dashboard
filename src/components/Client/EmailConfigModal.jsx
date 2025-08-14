import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Swal from 'sweetalert2';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  CircularProgress,
  InputAdornment,
  IconButton,
  Stack
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { email } from '../../api/email';

const EmailConfigModal = ({
  open,
  onClose,
  initialData,
  onSave,
  cid,
  showToast,
  loading,
  setLoading,
  isFormSubmitted,
  keepOpenOnSave = false,
  setOpenEmailConfigModal
}) => {
  const { t } = useTranslation();
  const [emailConfig, setEmailConfig] = useState({
    smtp_host: '',
    smtp_port: '',
    smtp_user: '',
    smtp_pass: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const maxLengths = {
    smtp_host: 100,
    smtp_port: 5,
    smtp_user: 100,
    smtp_pass: 100
  };

  const isValidPort = (port) => {
    const portNum = parseInt(port);
    return !isNaN(portNum) && portNum >= 1 && portNum <= 65535;
  };

  const validateEmailConfig = () => {
    const newErrors = {};
    if (!emailConfig.smtp_host || emailConfig.smtp_host.length < 3) {
      newErrors.smtp_host = t('client.smtp_host_required');
    }
    if (!emailConfig.smtp_port || !isValidPort(emailConfig.smtp_port)) {
      newErrors.smtp_port = t('client.smtp_port_invalid');
    }
    if (!emailConfig.smtp_user || emailConfig.smtp_user.length < 3) {
      newErrors.smtp_user = t('client.smtp_user_required');
    }
    if (!emailConfig.smtp_pass || emailConfig.smtp_pass.length < 6) {
      newErrors.smtp_pass = t('client.smtp_pass_required');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    if (open && initialData?.email) {
      setEmailConfig({
        smtp_host: initialData.email.smtp_host || '',
        smtp_port: initialData.email.smtp_port || '',
        smtp_user: initialData.email.smtp_user || '',
        smtp_pass: initialData.email.smtp_pass || ''
      });
      setErrors({});
    }
  }, [open, initialData]);

  const handleEmailConfigChange = (field) => (event) => {
    const value = event.target.value.slice(0, maxLengths[field]);
    setEmailConfig((prev) => ({
      ...prev,
      [field]: value
    }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const toggleShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handleSave = async () => {
    if (!validateEmailConfig()) {
      showToast(t('client.email_config_incomplete'));
      return;
    }

    try {
      setLoading(true);
      const saveResult = await onSave(emailConfig);
      if (saveResult) {
        // Update local state with the saved email configuration
        setEmailConfig({ ...emailConfig });
        showToast(t('client.email_config_saved'));
        if (!keepOpenOnSave) {
          onClose();
        }
      }
    } catch (err) {
      showToast(t('client.email_config_save_error'));
    } finally {
      setLoading(false);
    }
  };

  const handleTestEmail = async () => {
    if (!validateEmailConfig()) {
      showToast(t('client.email_config_incomplete'));
      return;
    }

    try {
      setLoading(true);
      const saveResult = await onSave(emailConfig); // Save the configuration
      if (saveResult) {
        // Update local state with the saved email configuration
        setEmailConfig({ ...emailConfig });
        showToast(t('client.config_saved_before_test'));

        // Hide the EmailConfigModal before showing Swal
        setOpenEmailConfigModal(false);

        const { value: formValues, isDismissed } = await Swal.fire({
          title: t('client.test_email_title'),
          html: `
            <div style="width: 100%; margin-bottom: 1rem;">
              <input 
                id="swal-input-email" 
                class="swal2-input" 
                placeholder="${t('client.email_recipient')}" 
                value="${emailConfig.smtp_user}"
                style="width: 100%; margin:0px;"
              >
            </div>
            <div style="width: 100%;">
              <textarea 
                id="swal-input-body" 
                class="swal2-textarea" 
                placeholder="${t('client.email_body')}"
                style="width: 100%; min-height: 120px; margin:0px; resize: vertical;"
              >${t('client.test_message')}</textarea>
            </div>
          `,
          focusConfirm: false,
          showCancelButton: true,
          confirmButtonText: t('common.send'),
          cancelButtonText: t('common.cancel'),
          width: '600px',
          allowOutsideClick: () => !Swal.isLoading(),
          preConfirm: () => {
            const recipientEmail = document.getElementById('swal-input-email').value;
            const body = document.getElementById('swal-input-body').value;
            if (!recipientEmail) {
              Swal.showValidationMessage(t('client.email_recipient_required'));
              return false;
            }
            return { recipientEmail, body };
          },
          didClose: () => {
            // Restore the EmailConfigModal after Swal closes
            setOpenEmailConfigModal(true);
          }
        });

        if (formValues) {
          Swal.fire({
            title: t('client.sending_email'),
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading(),
            showConfirmButton: false
          });

          try {
            await email(cid, formValues.recipientEmail, 'Test Email', formValues.body);
            await Swal.fire({
              icon: 'success',
              title: t('common.success'),
              text: t('client.test_email_sent_successfully'),
              confirmButtonText: t('common.ok')
            });
          } catch (err) {
            await Swal.fire({
              icon: 'error',
              title: t('common.error'),
              text: t('client.test_email_error'),
              confirmButtonText: t('common.ok')
            });
          }
        }
      }
    } catch (err) {
      showToast(t('client.test_email_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ className: 'client-dialog email-config-dialog' }}
    >
      <DialogTitle>{t('client.email_config_title')}</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <TextField
            label={t('client.smtp_host')}
            placeholder={t('client.smtp_host')}
            value={emailConfig.smtp_host}
            onChange={handleEmailConfigChange('smtp_host')}
            fullWidth
            margin="normal"
            required
            error={!!errors.smtp_host || (isFormSubmitted && (!emailConfig.smtp_host || emailConfig.smtp_host.length < 3))}
            helperText={
              errors.smtp_host ||
              (isFormSubmitted && (!emailConfig.smtp_host || emailConfig.smtp_host.length < 3))
                ? t('client.smtp_host_required')
                : `${emailConfig.smtp_host.length}/${maxLengths.smtp_host}`
            }
            inputProps={{ 'data-testid': 'smtp-host-field' }}
          />
          <TextField
            label={t('client.smtp_port')}
            placeholder={t('client.smtp_port')}
            value={emailConfig.smtp_port}
            onChange={handleEmailConfigChange('smtp_port')}
            fullWidth
            margin="normal"
            type="number"
            required
            error={!!errors.smtp_port || (isFormSubmitted && (!emailConfig.smtp_port || !isValidPort(emailConfig.smtp_port)))}
            helperText={
              errors.smtp_port ||
              (isFormSubmitted && (!emailConfig.smtp_port || !isValidPort(emailConfig.smtp_port)))
                ? t('client.smtp_port_invalid')
                : `${emailConfig.smtp_port.length}/${maxLengths.smtp_port}`
            }
            inputProps={{ 'data-testid': 'smtp-port-field' }}
          />
          <TextField
            label={t('client.smtp_user')}
            placeholder={t('client.smtp_user')}
            value={emailConfig.smtp_user}
            onChange={handleEmailConfigChange('smtp_user')}
            fullWidth
            margin="normal"
            required
            error={!!errors.smtp_user || (isFormSubmitted && (!emailConfig.smtp_user || emailConfig.smtp_user.length < 3))}
            helperText={
              errors.smtp_user ||
              (isFormSubmitted && (!emailConfig.smtp_user || emailConfig.smtp_user.length < 3))
                ? t('client.smtp_user_required')
                : `${emailConfig.smtp_user.length}/${maxLengths.smtp_user}`
            }
            inputProps={{ 'data-testid': 'smtp-user-field' }}
          />
          <TextField
            label={t('client.smtp_pass')}
            placeholder={t('client.smtp_pass')}
            value={emailConfig.smtp_pass}
            onChange={handleEmailConfigChange('smtp_pass')}
            fullWidth
            margin="normal"
            type={showPassword ? 'text' : 'password'}
            required
            error={!!errors.smtp_pass || (isFormSubmitted && (!emailConfig.smtp_pass || emailConfig.smtp_pass.length < 6))}
            helperText={
              errors.smtp_pass ||
              (isFormSubmitted && (!emailConfig.smtp_pass || emailConfig.smtp_pass.length < 6))
                ? t('client.smtp_pass_required')
                : `${emailConfig.smtp_pass.length}/${maxLengths.smtp_pass}`
            }
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={toggleShowPassword}
                    edge="end"
                    data-testid="toggle-password-visibility"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
            inputProps={{ 'data-testid': 'smtp-pass-field' }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Stack direction="row" spacing={2} justifyContent="space-between" width="100%">
          <Button 
            variant="outlined" 
            onClick={handleTestEmail}
            disabled={loading}
            data-testid="test-email-button"
          >
            {loading ? <CircularProgress size={24} /> : t('client.test_email')}
          </Button>
          <Stack direction="row" spacing={2}>
            <Button onClick={onClose} data-testid="close-button">
              {t('client.close')}
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={loading}
              data-testid="save-button"
            >
              {loading ? <CircularProgress size={24} /> : t('client.save')}
            </Button>
          </Stack>
        </Stack>
      </DialogActions>
    </Dialog>
  );
};

export default EmailConfigModal;