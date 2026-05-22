/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import {
    Box, Typography, Button, Link, Alert,
    InputAdornment, IconButton, CircularProgress,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import CustomTextField from '../../Common/CustomTextField';

const Step0Register = ({ formData, errors, apiError, loading, onChange, onSubmit }) => {
    const { t } = useTranslation();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') onSubmit();
    };

    return (
        <Box>
            <Typography variant="h5" fontWeight={700} gutterBottom>
                {t('setup.register.title')}
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
                {t('setup.register.subtitle')}
            </Typography>

            {apiError && (
                <Alert severity="error" sx={{ mb: 2 }}>{apiError}</Alert>
            )}

            <Box sx={{ display: 'flex', gap: 2 }}>
                <CustomTextField
                    label={t('setup.register.first_name')}
                    fullWidth
                    required
                    value={formData.firstName}
                    onChange={(e) => onChange({ firstName: e.target.value })}
                    error={!!errors.firstName}
                    helperText={errors.firstName}
                    onKeyDown={handleKeyDown}
                    autoFocus
                />
                <CustomTextField
                    label={t('setup.register.last_name')}
                    fullWidth
                    value={formData.lastName}
                    onChange={(e) => onChange({ lastName: e.target.value })}
                    onKeyDown={handleKeyDown}
                />
            </Box>

            <CustomTextField
                label={t('setup.register.email')}
                fullWidth
                required
                type="email"
                value={formData.email}
                onChange={(e) => onChange({ email: e.target.value })}
                error={!!errors.email}
                helperText={errors.email}
                sx={{ mt: 2 }}
                onKeyDown={handleKeyDown}
            />

            <CustomTextField
                label={t('setup.register.password')}
                fullWidth
                required
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => onChange({ password: e.target.value })}
                error={!!errors.password}
                helperText={errors.password}
                sx={{ mt: 2 }}
                onKeyDown={handleKeyDown}
                InputProps={{
                    endAdornment: (
                        <InputAdornment position="end">
                            <IconButton onClick={() => setShowPassword((p) => !p)} edge="end" size="small">
                                {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                            </IconButton>
                        </InputAdornment>
                    ),
                }}
            />

            <CustomTextField
                label={t('setup.register.confirm_password')}
                fullWidth
                required
                type={showConfirm ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => onChange({ confirmPassword: e.target.value })}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword}
                sx={{ mt: 2 }}
                onKeyDown={handleKeyDown}
                InputProps={{
                    endAdornment: (
                        <InputAdornment position="end">
                            <IconButton onClick={() => setShowConfirm((p) => !p)} edge="end" size="small">
                                {showConfirm ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                            </IconButton>
                        </InputAdornment>
                    ),
                }}
            />

            <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={onSubmit}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
                sx={{ mt: 3 }}
            >
                {loading ? t('common.loading') : t('setup.register.submit')}
            </Button>

            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
                {t('setup.register.login_link')}{' '}
                <Link component={RouterLink} to="/login" underline="hover">
                    {t('setup.register.login_link_cta')}
                </Link>
            </Typography>
        </Box>
    );
};

export default Step0Register;
