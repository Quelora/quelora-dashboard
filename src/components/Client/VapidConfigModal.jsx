import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Swal from 'sweetalert2';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  TextField,
  Button,
  Box,
  CircularProgress,
  Typography,
  Input,
  InputAdornment,
  IconButton,
  Autocomplete,
  Avatar
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { vapid, searchAuthors, generateVapidKeys } from '../../api/vapid';

/**
 * Modal component for configuring VAPID keys and testing push notifications
 * @param {Object} props - Component props
 * @param {boolean} props.open - Whether the modal is open
 * @param {Function} props.onClose - Callback when modal closes
 * @param {Object} props.initialData - Initial VAPID configuration data
 * @param {Function} props.onSave - Callback when saving configuration
 * @param {string} props.cid - Client ID
 * @param {Function} props.showToast - Function to display toast messages
 * @param {boolean} props.loading - Whether save operation is in progress
 * @param {boolean} props.isFormSubmitted - Whether form has been submitted
 */
const VapidConfigModal = ({
  open,
  onClose,
  initialData,
  onSave,
  cid,
  showToast,
  loading,
  isFormSubmitted
}) => {
  const { t } = useTranslation();
  const [tabValue, setTabValue] = useState(0);
  const [vapidConfig, setVapidConfig] = useState({
    publicKey: '',
    privateKey: '',
    email: '',
    iconBase64: ''
  });
  const [testMessage, setTestMessage] = useState({
    author: '',
    title: t('client.vapid_test_title_default'),
    body: t('client.vapid_test_body_default')
  });
  const [testLoading, setTestLoading] = useState(false);
  const [isTestSubmitted, setIsTestSubmitted] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [authors, setAuthors] = useState([]);
  const [searchValue, setSearchValue] = useState('');
  const DEBOUNCE_DELAY = 800;

  // Field length constraints
  const maxLengths = {
    publicKey: 88,
    privateKey: 44,
    email: 100,
    iconBase64: 102400,
    author: 50,
    title: 100,
    body: 500
  };

  // Email validation regex
  const isValidEmail = (email) =>
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);

  // Check if VAPID configuration is complete
  const isVapidComplete = () =>
    vapidConfig.publicKey &&
    vapidConfig.publicKey.length >= 10 &&
    vapidConfig.privateKey &&
    vapidConfig.privateKey.length >= 10 &&
    vapidConfig.email &&
    isValidEmail(vapidConfig.email);

  // Initialize form with initial data when modal opens
  useEffect(() => {
    if (open && initialData?.vapid) {
      setVapidConfig({
        publicKey: initialData.vapid.publicKey || '',
        privateKey: initialData.vapid.privateKey || '',
        email: initialData.vapid.email || '',
        iconBase64: initialData.vapid.iconBase64 || ''
      });
    }
  }, [open, initialData]);

  // Debounced author search
  useEffect(() => {
    if (!searchValue || searchValue.length < 2) {
      setAuthors([]);
      return;
    }

    const debounceSearch = setTimeout(async () => {
      try {
        const results = await searchAuthors(searchValue);
        setAuthors(results);
      } catch (error) {
        showToast('Error searching authors');
      }
    }, DEBOUNCE_DELAY);

    return () => clearTimeout(debounceSearch);
  }, [searchValue, showToast]);

  /**
   * Generates new VAPID keys by calling server-side endpoint
   */
  const handleGenerateKeys = async () => {
    if (vapidConfig.publicKey || vapidConfig.privateKey) {
      const result = await Swal.fire({
        title: t('client.vapid_keys_regenerate_warning'),
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: t('common.generate'),
        cancelButtonText: t('client.cancel')
      });

      if (!result.isConfirmed) return;
    }

    try {
      const vapidKeys = await generateVapidKeys();
      setVapidConfig(prev => ({
        ...prev,
        publicKey: vapidKeys.publicKey,
        privateKey: vapidKeys.privateKey
      }));
      showToast(t('client.vapid_keys_generated'));
      Swal.fire({
        title: t('client.vapid_keys_success'),
        text: t('client.vapid_keys_success_message'),
        icon: 'success',
        confirmButtonText: t('common.ok')
      });
    } catch (error) {
      showToast(t('client.vapid_keys_generation_error'));
      console.error('Error generating VAPID keys:', error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setIsTestSubmitted(false);
  };

  const handleVapidChange = (field) => (event) => {
    const value = event.target.value.slice(0, maxLengths[field]);
    setVapidConfig((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTestMessageChange = (field) => (event) => {
    const value = event.target.value.slice(0, maxLengths[field]);
    setTestMessage((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  /**
   * Handles image upload and conversion to base64
   * @param {Object} event - File input change event
   */
  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      showToast(t('client.vapid_icon_invalid_format'));
      return;
    }

    if (file.size > 102400) {
      showToast(t('client.vapid_icon_too_large'));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result;
      if (base64String.length > maxLengths.iconBase64) {
        showToast(t('client.vapid_icon_too_large'));
        return;
      }
      setVapidConfig((prev) => ({
        ...prev,
        iconBase64: base64String
      }));
    };
    reader.onerror = () => {
      showToast(t('client.vapid_icon_read_error'));
    };
    reader.readAsDataURL(file);
  };

  const handleAuthorSearch = (event, value) => {
    setSearchValue(value);
  };

  /**
   * Sends a test push notification
   */
  const handleSendTestMessage = async () => {
    setIsTestSubmitted(true);
    if (!testMessage.author || !testMessage.title || !testMessage.body) {
      showToast(t('client.vapid_test_message_incomplete'));
      return;
    }

    try {
      setTestLoading(true);
      await vapid(cid, testMessage.author, testMessage.title, testMessage.body);
      showToast(t('client.vapid_test_message_sent'));
      setTestMessage({
        author: '',
        title: t('client.vapid_test_title_default'),
        body: t('client.vapid_test_body_default')
      });
      setIsTestSubmitted(false);
    } catch (err) {
      showToast(t('client.vapid_test_message_error'));
    } finally {
      setTestLoading(false);
    }
  };

  const toggleShowPrivateKey = () => {
    setShowPrivateKey((prev) => !prev);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ className: 'client-dialog vapid-config-dialog' }}
    >
      <DialogTitle>{t('client.vapid_config_title')}</DialogTitle>
      <DialogContent>
        <Tabs value={tabValue} onChange={handleTabChange} centered>
          <Tab label={t('client.vapid_config')} />
          {isVapidComplete() && <Tab label={t('client.vapid_test')} />}
        </Tabs>

        {tabValue === 0 && (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button 
                variant="outlined" 
                onClick={handleGenerateKeys}
                sx={{ mr: 1 }}
                data-testid="generate-keys-button"
              >
                {t('client.vapid_generate_keys')}
              </Button>
            </Box>

            <TextField
              label={t('client.vapid_public_key')}
              value={vapidConfig.publicKey}
              onChange={handleVapidChange('publicKey')}
              fullWidth
              margin="normal"
              required
              error={isFormSubmitted && (!vapidConfig.publicKey || vapidConfig.publicKey.length < 10)}
              helperText={
                isFormSubmitted && (!vapidConfig.publicKey || vapidConfig.publicKey.length < 10)
                  ? t('client.vapid_public_key_required')
                  : `${vapidConfig.publicKey.length}/${maxLengths.publicKey}`
              }
              inputProps={{ 'data-testid': 'public-key-field' }}
            />
            
            <TextField
              label={t('client.vapid_private_key')}
              value={vapidConfig.privateKey}
              onChange={handleVapidChange('privateKey')}
              fullWidth
              margin="normal"
              type={showPrivateKey ? 'text' : 'password'}
              required
              error={isFormSubmitted && (!vapidConfig.privateKey || vapidConfig.privateKey.length < 10)}
              helperText={
                isFormSubmitted && (!vapidConfig.privateKey || vapidConfig.privateKey.length < 10)
                  ? t('client.vapid_private_key_required')
                  : `${vapidConfig.privateKey.length}/${maxLengths.privateKey}`
              }
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton 
                      onClick={toggleShowPrivateKey} 
                      edge="end"
                      data-testid="toggle-private-key-visibility"
                    >
                      {showPrivateKey ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
              inputProps={{ 'data-testid': 'private-key-field' }}
            />
            
            <TextField
              label={t('client.vapid_email')}
              value={vapidConfig.email}
              onChange={handleVapidChange('email')}
              fullWidth
              margin="normal"
              type="email"
              required
              error={isFormSubmitted && (!vapidConfig.email || !isValidEmail(vapidConfig.email))}
              helperText={
                isFormSubmitted && (!vapidConfig.email || !isValidEmail(vapidConfig.email))
                  ? t('client.vapid_email_invalid')
                  : `${vapidConfig.email.length}/${maxLengths.email}`
              }
              inputProps={{ 'data-testid': 'email-field' }}
            />
            
            <Box sx={{ mt: 2 }}>
              <Input
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleImageChange}
                sx={{ display: 'none' }}
                id="vapid-icon-upload"
                inputProps={{ 'data-testid': 'icon-upload' }}
              />
              <label htmlFor="vapid-icon-upload">
                <Button variant="outlined" component="span">
                  {t('client.vapid_icon_base64')}
                </Button>
              </label>
              {vapidConfig.iconBase64 && (
                <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                  {`${vapidConfig.iconBase64.length}/${maxLengths.iconBase64} characters`}
                </Typography>
              )}
            </Box>
          </Box>
        )}

        {tabValue === 1 && isVapidComplete() && (
          <Box sx={{ mt: 2 }}>
            <Autocomplete
              options={authors}
              getOptionLabel={(option) => option.name || ''}
              onInputChange={handleAuthorSearch}
              renderOption={(props, option) => (
                <Box component="li" {...props} key={option._id} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar src={option.picture} sx={{ mr: 1 }} />
                  {option.name}
                </Box>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('client.vapid_test_user_id')}
                  error={isTestSubmitted && !testMessage.author}
                  helperText={
                    isTestSubmitted && !testMessage.author
                      ? t('client.vapid_test_message_incomplete')
                      : ''
                  }
                  inputProps={{ 
                    ...params.inputProps,
                    'data-testid': 'author-autocomplete' 
                  }}
                />
              )}
              onChange={(event, newValue) => {
                setTestMessage((prev) => ({
                  ...prev,
                  author: newValue?.author || ''
                }));
              }}
            />

            <TextField
              label={t('client.vapid_test_title')}
              value={testMessage.title}
              onChange={handleTestMessageChange('title')}
              fullWidth
              margin="normal"
              required
              error={isTestSubmitted && !testMessage.title}
              helperText={
                isTestSubmitted && !testMessage.title
                  ? t('client.vapid_test_message_incomplete')
                  : `${testMessage.title.length}/${maxLengths.title}`
              }
              inputProps={{ 'data-testid': 'test-title-field' }}
            />
            
            <TextField
              label={t('client.vapid_test_body')}
              value={testMessage.body}
              onChange={handleTestMessageChange('body')}
              fullWidth
              margin="normal"
              multiline
              rows={3}
              required
              error={isTestSubmitted && !testMessage.body}
              helperText={
                isTestSubmitted && !testMessage.body
                  ? t('client.vapid_test_message_incomplete')
                  : `${testMessage.body.length}/${maxLengths.body}`
              }
              inputProps={{ 'data-testid': 'test-body-field' }}
            />
            
            <Button
              variant="contained"
              onClick={handleSendTestMessage}
              disabled={testLoading}
              sx={{ mt: 2 }}
              data-testid="send-test-button"
            >
              {testLoading ? <CircularProgress size={24} /> : t('client.vapid_send_test')}
            </Button>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} data-testid="close-button">
          {t('client.close')}
        </Button>
        {tabValue === 0 && (
          <Button
            variant="contained"
            onClick={() => onSave(vapidConfig)}
            disabled={loading}
            data-testid="save-button"
          >
            {loading ? <CircularProgress size={24} /> : t('client.save')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default VapidConfigModal;