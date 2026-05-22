/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

// ./src/components/Client/VapidConfigModal.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
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
    Typography,
    Input,
    InputAdornment,
    IconButton,
    Autocomplete,
    Avatar,
    Tabs,
    Tab,
    Grid
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { vapid, searchAuthors, generateVapidKeys } from '../../api/vapid';
import CustomTextField from '../Common/CustomTextField';
import EnterpriseGate from '../Common/EnterpriseGate';
import { useEnterprise } from '../../hooks/useEnterprise';
import React from 'react';

/**
 * Modal component for configuring VAPID keys and testing push notifications.
 *
 * @component
 * @param {Object} props - The component props.
 * @param {boolean} props.open - Indicates if the modal is currently visible.
 * @param {Function} props.onClose - Callback to close the modal.
 * @param {Object} props.initialData - Initial configuration data containing VAPID settings.
 * @param {Function} props.onSave - Callback triggered to save the VAPID configuration.
 * @param {string} props.cid - The Client ID.
 * @param {Function} props.showToast - Function to display toast notifications.
 * @param {boolean} props.loading - Indicates if a save operation is in progress.
 * @param {boolean} props.isFormSubmitted - Indicates if the form has been submitted for validation purposes.
 * @returns {JSX.Element} The rendered modal component.
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
    const { hasModule } = useEnterprise();
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

    const maxLengths = {
        publicKey: 88,
        privateKey: 44,
        email: 100,
        iconBase64: 102400,
        author: 50,
        title: 100,
        body: 500
    };

    /**
     * Validates if the provided string is a valid email format.
     *
     * @param {string} email - The email address to validate.
     * @returns {boolean} True if the email is valid, false otherwise.
     */
    const isValidEmail = (email) =>
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);

    /**
     * Checks whether the basic VAPID configuration fields are correctly filled.
     *
     * @returns {boolean} True if the configuration is complete, false otherwise.
     */
    const isVapidComplete = () =>
        vapidConfig.publicKey &&
        vapidConfig.publicKey.length >= 10 &&
        vapidConfig.privateKey &&
        vapidConfig.privateKey.length >= 10 &&
        vapidConfig.email &&
        isValidEmail(vapidConfig.email);

    const vapidInitialStr = JSON.stringify(initialData?.vapid || {});

    useEffect(() => {
        if (open) {
            const parsedVapid = JSON.parse(vapidInitialStr);
            setVapidConfig({
                publicKey: parsedVapid.publicKey || '',
                privateKey: parsedVapid.privateKey || '',
                email: parsedVapid.email || '',
                iconBase64: parsedVapid.iconBase64 || ''
            });
        }
    }, [open, vapidInitialStr]);

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
                showToast('Error searching authors', 'error');
            }
        }, DEBOUNCE_DELAY);

        return () => clearTimeout(debounceSearch);
    }, [searchValue, showToast]);

    /**
     * Requests new VAPID keys from the backend and updates the local state.
     *
     * @async
     * @returns {Promise<void>}
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
            showToast(t('client.vapid_keys_generated'), 'success');
            Swal.fire({
                title: t('client.vapid_keys_success'),
                text: t('client.vapid_keys_success_message'),
                icon: 'success',
                confirmButtonText: t('common.ok')
            });
        } catch (error) {
            showToast(t('client.vapid_keys_generation_error'), 'error');
            console.error('Error generating VAPID keys:', error);
        }
    };

    /**
     * Handles the tab change event between Configuration and Testing modes.
     *
     * @param {React.SyntheticEvent} event - The triggered event.
     * @param {number} newValue - The index of the selected tab.
     */
    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
        setIsTestSubmitted(false);
    };

    /**
     * Curried function to handle text changes for VAPID configuration fields.
     *
     * @param {string} field - The key of the field being updated.
     * @returns {Function} Event handler function.
     */
    const handleVapidChange = (field) => (event) => {
        const value = event.target.value.slice(0, maxLengths[field]);
        setVapidConfig((prev) => ({
            ...prev,
            [field]: value
        }));
    };

    /**
     * Curried function to handle text changes for Test Message fields.
     *
     * @param {string} field - The key of the field being updated.
     * @returns {Function} Event handler function.
     */
    const handleTestMessageChange = (field) => (event) => {
        const value = event.target.value.slice(0, maxLengths[field]);
        setTestMessage((prev) => ({
            ...prev,
            [field]: value
        }));
    };

    /**
     * Processes image uploads and converts them to base64 format.
     *
     * @param {React.ChangeEvent<HTMLInputElement>} event - The file input event.
     */
    const handleImageChange = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
            showToast(t('client.vapid_icon_invalid_format'), 'warning');
            return;
        }

        if (file.size > 102400) {
            showToast(t('client.vapid_icon_too_large'), 'warning');
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const base64String = reader.result;
            if (base64String.length > maxLengths.iconBase64) {
                showToast(t('client.vapid_icon_too_large'), 'warning');
                return;
            }
            setVapidConfig((prev) => ({
                ...prev,
                iconBase64: base64String
            }));
        };
        reader.onerror = () => {
            showToast(t('client.vapid_icon_read_error'), 'error');
        };
        reader.readAsDataURL(file);
    };

    /**
     * Updates the autocomplete search query value.
     *
     * @param {React.SyntheticEvent} event - The input event.
     * @param {string} value - The updated search string.
     */
    const handleAuthorSearch = (event, value) => {
        setSearchValue(value);
    };

    /**
     * Triggers the dispatch of a test push notification to a designated author.
     *
     * @async
     * @returns {Promise<void>}
     */
    const handleSendTestMessage = async () => {
        setIsTestSubmitted(true);
        const isMessageIncomplete = !testMessage.author || !testMessage.title || !testMessage.body;

        if (isMessageIncomplete) {
            showToast(t('client.vapid_test_message_incomplete'), 'warning');
            return;
        }

        try {
            setTestLoading(true);
            await vapid(cid, testMessage.author, testMessage.title, testMessage.body);
            showToast(t('client.vapid_test_message_sent'), 'success');
            setTestMessage({
                author: '',
                title: t('client.vapid_test_title_default'),
                body: t('client.vapid_test_body_default')
            });
            setIsTestSubmitted(false);
        } catch (err) {
            showToast(t('client.vapid_test_message_error'), 'error');
        } finally {
            setTestLoading(false);
        }
    };

    /**
     * Toggles the visibility state of the private key text field.
     */
    const toggleShowPrivateKey = () => {
        setShowPrivateKey((prev) => !prev);
    };

    const isPublicKeyInvalid = !vapidConfig.publicKey || vapidConfig.publicKey.length < 10;
    const isPrivateKeyInvalid = !vapidConfig.privateKey || vapidConfig.privateKey.length < 10;
    const isEmailInvalid = !vapidConfig.email || !isValidEmail(vapidConfig.email);
    const isTestTitleInvalid = !testMessage.title;
    const isTestBodyInvalid = !testMessage.body;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{className: 'client-dialog vapid-config-dialog'}}
        >
            <DialogTitle>{t('client.vapid_config_title')}</DialogTitle>
            <DialogContent>
                <EnterpriseGate module="push">
                <Tabs value={tabValue} onChange={handleTabChange} centered>
                    <Tab label={t('client.vapid_config')}/>
                    {isVapidComplete() && <Tab label={t('client.vapid_test')}/>}
                </Tabs>

                {tabValue === 0 && (
                    <Box sx={{mt: 2}}>
                        <Box sx={{display: 'flex', justifyContent: 'flex-end', mb: 2}}>
                            <Button 
                                variant="outlined" 
                                onClick={handleGenerateKeys}
                                sx={{mr: 1}}
                                data-testid="generate-keys-button"
                            >
                                {t('client.vapid_generate_keys')}
                            </Button>
                        </Box>

                        <CustomTextField
                            label={t('client.vapid_public_key')}
                            value={vapidConfig.publicKey}
                            onChange={handleVapidChange('publicKey')}
                            fullWidth
                            margin="normal"
                            required
                            error={isFormSubmitted && isPublicKeyInvalid}
                            helperText={
                                isFormSubmitted && isPublicKeyInvalid
                                    ? t('client.vapid_public_key_required')
                                    : `${vapidConfig.publicKey.length}/${maxLengths.publicKey}`
                            }
                            inputProps={{'data-testid': 'public-key-field'}}
                        />
                        
                        <CustomTextField
                            label={t('client.vapid_private_key')}
                            value={vapidConfig.privateKey}
                            onChange={handleVapidChange('privateKey')}
                            fullWidth
                            margin="normal"
                            type={showPrivateKey ? 'text' : 'password'}
                            required
                            error={isFormSubmitted && isPrivateKeyInvalid}
                            helperText={
                                isFormSubmitted && isPrivateKeyInvalid
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
                                            {showPrivateKey ? <VisibilityOff/> : <Visibility/>}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                            inputProps={{'data-testid': 'private-key-field'}}
                        />
                        
                        <CustomTextField
                            label={t('client.vapid_email')}
                            value={vapidConfig.email}
                            onChange={handleVapidChange('email')}
                            fullWidth
                            margin="normal"
                            type="email"
                            required
                            error={isFormSubmitted && isEmailInvalid}
                            helperText={
                                isFormSubmitted && isEmailInvalid
                                    ? t('client.vapid_email_invalid')
                                    : `${vapidConfig.email.length}/${maxLengths.email}`
                            }
                            inputProps={{'data-testid': 'email-field'}}
                        />
                        
                        <Box sx={{mt: 2}}>
                            <Input
                                type="file"
                                accept="image/png,image/jpeg,image/jpg"
                                onChange={handleImageChange}
                                sx={{display: 'none'}}
                                id="vapid-icon-upload"
                                inputProps={{'data-testid': 'icon-upload'}}
                            />
                            <label htmlFor="vapid-icon-upload">
                                <Button variant="outlined" component="span">
                                    {t('client.vapid_icon_base64')}
                                </Button>
                            </label>
                            {vapidConfig.iconBase64 && (
                                <Typography variant="caption" sx={{mt: 1, display: 'block'}}>
                                    {`${vapidConfig.iconBase64.length}/${maxLengths.iconBase64} characters`}
                                </Typography>
                            )}
                        </Box>
                    </Box>
                )}

                {tabValue === 1 && isVapidComplete() && (
                    <Box sx={{mt: 2}}>
                        <Autocomplete
                            options={authors}
                            getOptionLabel={(option) => option.name || ''}
                            onInputChange={handleAuthorSearch}
                            renderOption={(props, option) => (
                                <Box component="li" {...props} key={option._id} sx={{display: 'flex', alignItems: 'center'}}>
                                    <Avatar src={option.picture} sx={{mr: 1}}/>
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

                        <CustomTextField
                            label={t('client.vapid_test_title')}
                            value={testMessage.title}
                            onChange={handleTestMessageChange('title')}
                            fullWidth
                            margin="normal"
                            required
                            error={isTestSubmitted && isTestTitleInvalid}
                            helperText={
                                isTestSubmitted && isTestTitleInvalid
                                    ? t('client.vapid_test_message_incomplete')
                                    : `${testMessage.title.length}/${maxLengths.title}`
                            }
                            inputProps={{'data-testid': 'test-title-field'}}
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
                            error={isTestSubmitted && isTestBodyInvalid}
                            helperText={
                                isTestSubmitted && isTestBodyInvalid
                                    ? t('client.vapid_test_message_incomplete')
                                    : `${testMessage.body.length}/${maxLengths.body}`
                            }
                            inputProps={{'data-testid': 'test-body-field'}}
                        />
                        
                        <Button
                            variant="contained"
                            onClick={handleSendTestMessage}
                            disabled={testLoading}
                            sx={{mt: 2}}
                            data-testid="send-test-button"
                        >
                            {testLoading ? <CircularProgress size={24}/> : t('client.vapid_send_test')}
                        </Button>
                    </Box>
                )}
                </EnterpriseGate>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} data-testid="close-button">
                    {t('client.close')}
                </Button>
                {tabValue === 0 && hasModule('push') && (
                    <Button
                        variant="contained"
                        onClick={() => onSave(vapidConfig)}
                        disabled={loading}
                        data-testid="save-button"
                    >
                        {loading ? <CircularProgress size={24}/> : t('client.save')}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default VapidConfigModal;