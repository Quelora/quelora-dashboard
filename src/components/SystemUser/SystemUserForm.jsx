/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

// filepath: ./src/components/SystemUser/SystemUserForm.jsx
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Grid,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    OutlinedInput,
    Chip,
    Box,
    Stack,
    Typography,
    FormHelperText,
    Switch,
    DialogActions,
    Alert,
    LinearProgress,
    InputAdornment,
    IconButton,
    Tooltip
} from '@mui/material';
import {
    Add as AddIcon,
    Save as SaveIcon,
    Refresh as RefreshIcon,
    Business as BusinessIcon,
    CheckCircle,
    Cancel,
    Visibility,
    VisibilityOff,
    Casino as CasinoIcon,
    ContentCopy as ContentCopyIcon,
    Info as InfoIcon,
    Translate as TranslateIcon
} from '@mui/icons-material';
import CustomTextField from '../Common/CustomTextField';
import useSystemUserForm from '../../hooks/useSystemUserForm';
import { ROLES as IMPORTED_ROLES, ROLE_LEVELS as IMPORTED_LEVELS } from '../../utils/permissions';

// --- IMPORTACIÓN DINÁMICA DE IDIOMAS ---
import { SUPPORTED_LOCALES } from '../../i18n'; 

// --- CONSTANTES DE SEGURIDAD (FALLBACKS) ---
const SAFE_ROLES = IMPORTED_ROLES || {
    GOD: 'god',
    ADMIN: 'admin',
    EDITOR: 'editor',
    ANALYST: 'analyst',
    ADVERTISER: 'advertiser',
    MODERATOR: 'moderator',
    USER: 'user'
};

const SAFE_LEVELS = IMPORTED_LEVELS || {
    'god': 100,
    'admin': 50,
    'editor': 40,
    'moderator': 30,
    'advertiser': 20,
    'analyst': 15,
    'user': 10
};

// --- COMPONENTE INDICADOR DE FUERZA ---
const PasswordStrengthIndicator = ({ password }) => {
    const { t } = useTranslation();
    const tests = [
        { regex: /.{8,}/, label: t('profile.password_requirement_length') || '8+ Characters' },
        { regex: /[A-Z]/, label: t('profile.password_requirement_uppercase') || 'Uppercase' },
        { regex: /[a-z]/, label: t('profile.password_lowercase') || 'Lowercase' },
        { regex: /[0-9]/, label: t('profile.password_number') || 'Number' },
        { regex: /[\W_]/, label: t('profile.password_requirement_special') || 'Special Character' }
    ];
    
    const requirements = tests.map(test => ({
        label: test.label,
        valid: test.regex.test(password)
    }));

    return (
        <Stack spacing={0.5} sx={{ mt: 1, pl: 1 }}>
            {requirements.map((req, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center' }}>
                    {req.valid ? (
                        <CheckCircle color="success" sx={{ fontSize: '0.9rem', mr: 1 }} />
                    ) : (
                        <Cancel color="error" sx={{ fontSize: '0.9rem', mr: 1 }} />
                    )}
                    <Typography variant="caption" color={req.valid ? "text.primary" : "text.secondary"}>
                        {req.label}
                    </Typography>
                </Box>
            ))}
        </Stack>
    );
};

// --- COMPONENTE PRINCIPAL ---
const SystemUserForm = ({ onSuccess, onCancel, availableClients, currentUserRole, editMode = false, initialData = null, userId = null }) => {
    const { t } = useTranslation();

    const [showPassword, setShowPassword] = useState(false);
    const [copied, setCopied] = useState(false);

    const {
        formData,
        loading,
        generalError,
        handleChange,
        handleSubmit
    } = useSystemUserForm(onSuccess, currentUserRole, { editMode, initialData, userId });

    const generateRandomPassword = () => {
        const length = 12;
        const lower = "abcdefghijklmnopqrstuvwxyz";
        const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const numbers = "0123456789";
        const special = "!@#$%^&*()_+";
        const allChars = lower + upper + numbers + special;
        
        let password = [
            lower[Math.floor(Math.random() * lower.length)],
            upper[Math.floor(Math.random() * upper.length)],
            numbers[Math.floor(Math.random() * numbers.length)],
            special[Math.floor(Math.random() * special.length)]
        ];

        for (let i = 4; i < length; i++) {
            password.push(allChars[Math.floor(Math.random() * allChars.length)]);
        }

        password = password.sort(() => 0.5 - Math.random()).join('');
        handleChange({ target: { name: 'password', value: password } });
        setShowPassword(true);
    };

    const handleCopyPassword = () => {
        if (formData.password) {
            navigator.clipboard.writeText(formData.password);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const allowedRoles = useMemo(() => {
        const myLevel = SAFE_LEVELS[currentUserRole] || 0;
        const roles = Object.values(SAFE_ROLES).filter(role => {
            const roleLevel = SAFE_LEVELS[role] || 0;
            return roleLevel <= myLevel && role !== SAFE_ROLES.GOD;
        });
        if (currentUserRole === SAFE_ROLES.GOD) {
            if (!roles.includes(SAFE_ROLES.GOD)) roles.push(SAFE_ROLES.GOD);
        }
        return roles;
    }, [currentUserRole]);

    return (
        <>
            {generalError && <Alert severity="error" sx={{ mb: 2 }}>{generalError}</Alert>}

            <Grid
                container
                spacing={2}
                sx={{
                    mt: 0.5,
                    display: 'flex',
                    flexDirection: 'column !important',
                    width: '100%'
                }}
            >
                {!editMode && (
                    <Grid item xs={12}>
                        <CustomTextField
                            label={t('profile.username') || 'Username'}
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            fullWidth
                            required
                        />
                    </Grid>
                )}

                <Grid item xs={12}>
                    <CustomTextField
                        label={t('profile.email') || 'Email'}
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        fullWidth
                        required
                    />
                </Grid>

                <Grid item xs={12}>
                    <CustomTextField
                        label={t('profile.given_name') || 'First Name'}
                        name="given_name"
                        value={formData.given_name}
                        onChange={handleChange}
                        fullWidth
                        required
                    />
                </Grid>

                <Grid item xs={12}>
                    <CustomTextField
                        label={t('profile.family_name') || 'Last Name'}
                        name="family_name"
                        value={formData.family_name}
                        onChange={handleChange}
                        fullWidth
                    />
                </Grid>

                <Grid item xs={12}>
                    <FormControl fullWidth margin="dense" size="small">
                        <InputLabel>{t('postForm.language', 'Language')}</InputLabel>
                        <Select
                            name="locale"
                            value={formData.locale}
                            onChange={handleChange}
                            label={t('postForm.language', 'Language') }
                            startAdornment={
                                <InputAdornment position="start" sx={{ ml: 1 }}>
                                    <TranslateIcon fontSize="small" color="action" />
                                </InputAdornment>
                            }
                        >
                            {SUPPORTED_LOCALES.map((lang) => (
                                <MenuItem key={lang.code} value={lang.code}>
                                    <Typography variant="body2" sx={{ mr: 1 }}>
                                        {lang.native}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        ({lang.label})
                                    </Typography>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>

                <Grid item xs={12}>
                    <FormControl fullWidth margin="dense" size="small">
                        <InputLabel>{t('common.role') || 'Role'}</InputLabel>
                        <Select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            label={t('common.role') || 'Role'}
                            input={<OutlinedInput label={t('common.role') || 'Role'} />}
                        >
                            {allowedRoles.map(role => (
                                <MenuItem key={role} value={role}>
                                    {role.toUpperCase()}
                                </MenuItem>
                            ))}
                        </Select>

                        <Box 
                            sx={{ 
                                mt: 1, 
                                p: 1.5, 
                                borderRadius: 1, 
                                backgroundColor: 'rgba(33, 150, 243, 0.08)', 
                                border: '1px solid rgba(33, 150, 243, 0.3)',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 1
                            }}
                        >
                            <InfoIcon color="primary" sx={{ fontSize: 20, mt: 0.2 }} />
                            <Box>
                                <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
                                    {formData.role.toUpperCase()} — {t('users.permissions_title')}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.3 }}>
                                    {t(`role_descriptions.${formData.role}`)}
                                </Typography>
                            </Box>
                        </Box>
                    </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                    <FormControl fullWidth margin="dense" size="small">
                        <InputLabel>{t('sidebar.clients') || 'Assigned Clients'}</InputLabel>
                        <Select
                            name="clientIds"
                            multiple
                            value={formData.clientIds}
                            onChange={handleChange}
                            input={<OutlinedInput label={t('sidebar.clients') || 'Assigned Clients'} />}
                            renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {selected.map((value) => {
                                        const safeClients = Array.isArray(availableClients) ? availableClients : [];
                                        const client = safeClients.find(c => c.cid === value);
                                        return (
                                            <Chip 
                                                key={value} 
                                                label={client ? (client.description || client.cid) : value} 
                                                size="small"
                                            />
                                        );
                                    })}
                                </Box>
                            )}
                        >
                            {Array.isArray(availableClients) && availableClients.length > 0 ? availableClients.map((client) => (
                                <MenuItem key={client.cid} value={client.cid}>
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <BusinessIcon fontSize="small" color="action"/>
                                        <Typography variant="body2">{client.description || client.cid}</Typography>
                                    </Stack>
                                </MenuItem>
                            )) : (
                                <MenuItem disabled>
                                    <Typography variant="caption">No clients available</Typography>
                                </MenuItem>
                            )}
                        </Select>
                    </FormControl>
                </Grid>

                {!editMode && (
                    <>
                        <Grid item xs={12}>
                            <CustomTextField
                                label={t('common.password') || 'Password'}
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                value={formData.password}
                                onChange={handleChange}
                                fullWidth
                                required
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <Tooltip title={t('users.generate_random')}>
                                                <IconButton onClick={generateRandomPassword} edge="end" sx={{ mr: 0.5 }}>
                                                    <CasinoIcon color="primary" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title={copied ? t('common.copied') : t('common.copy_to_clipboard')}>
                                                <IconButton
                                                    onClick={handleCopyPassword}
                                                    edge="end"
                                                    sx={{ mr: 0.5 }}
                                                    disabled={!formData.password}
                                                >
                                                    <ContentCopyIcon color={copied ? "success" : "action"} fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }}
                            />
                            {formData.password && <PasswordStrengthIndicator password={formData.password} />}
                            <FormHelperText sx={{ mt: 1 }}>
                                {t('profile.password_help_temp') || 'This is a temporary password. The user will be forced to change it upon login.'}
                            </FormHelperText>
                        </Grid>

                        <Grid item xs={12}>
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    p: 1.5,
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '8px',
                                    mt: 1
                                }}
                            >
                                <Box>
                                    <Typography variant="body2" fontWeight="500">
                                        {t('profile.send_welcome_email') || 'Send welcome email'}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                        {t('profile.email_security_note') || 'Does NOT include password.'}
                                    </Typography>
                                </Box>
                                <Switch
                                    name="notifyUser"
                                    checked={formData.notifyUser}
                                    onChange={handleChange}
                                    color="primary"
                                />
                            </Box>
                        </Grid>
                    </>
                )}
            </Grid>

            <DialogActions className="profile-dialog-actions" sx={{ px: 0, mt: 3 }}>
                <Button onClick={onCancel} disabled={loading}>
                    {t('common.cancel') || 'Cancel'}
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={loading}
                    startIcon={loading ? <RefreshIcon sx={{ animation: 'spin 2s linear infinite' }} /> : editMode ? <SaveIcon /> : <AddIcon />}
                >
                    {editMode ? (t('common.save') || 'Save') : (t('common.create') || 'Create')}
                </Button>
            </DialogActions>
            {loading && <LinearProgress sx={{ mt: 1, borderRadius: 1 }} />}
            
            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </>
    );
};

export default SystemUserForm;