/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Box, Typography, Button, Alert, TextField, Link, CircularProgress,
} from '@mui/material';

const Step1Verify = ({ email, apiError, loading, onSubmit, onResend, onBack }) => {
    const { t } = useTranslation();
    const [digits, setDigits] = useState(Array(6).fill(''));
    const [cooldown, setCooldown] = useState(0);
    const inputRefs = useRef([]);

    useEffect(() => {
        inputRefs.current[0]?.focus();
    }, []);

    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [cooldown]);

    const handleChange = (index, value) => {
        const char = value.replace(/\D/g, '').slice(-1);
        const newDigits = [...digits];
        newDigits[index] = char;
        setDigits(newDigits);

        if (char && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-submit when all 6 digits entered
        if (newDigits.every((d) => d !== '') && char) {
            onSubmit(newDigits.join(''));
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !digits[index] && index > 0) {
            const newDigits = [...digits];
            newDigits[index - 1] = '';
            setDigits(newDigits);
            inputRefs.current[index - 1]?.focus();
        }
        if (e.key === 'ArrowLeft' && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
        if (e.key === 'ArrowRight' && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (!pasted) return;
        const newDigits = Array(6).fill('');
        pasted.split('').forEach((ch, i) => { newDigits[i] = ch; });
        setDigits(newDigits);
        const nextEmpty = pasted.length < 6 ? pasted.length : 5;
        inputRefs.current[nextEmpty]?.focus();
        if (pasted.length === 6) onSubmit(pasted);
    };

    const handleResend = () => {
        onResend();
        setCooldown(60);
    };

    const code = digits.join('');

    return (
        <Box>
            <Typography variant="h5" fontWeight={700} gutterBottom>
                {t('setup.verify.title')}
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
                {t('setup.verify.subtitle', { email })}
            </Typography>

            {apiError && (
                <Alert severity="error" sx={{ mb: 2 }}>{apiError}</Alert>
            )}

            <Box
                sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', my: 3 }}
                onPaste={handlePaste}
            >
                {digits.map((digit, i) => (
                    <TextField
                        key={i}
                        inputRef={(el) => { inputRefs.current[i] = el; }}
                        value={digit}
                        onChange={(e) => handleChange(i, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(i, e)}
                        inputProps={{
                            maxLength: 1,
                            style: {
                                textAlign: 'center',
                                fontSize: '1.5rem',
                                fontWeight: 600,
                                padding: '12px 0',
                                width: 40,
                            },
                        }}
                        sx={{ width: 56 }}
                    />
                ))}
            </Box>

            <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={() => onSubmit(code)}
                disabled={loading || code.length < 6}
                startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
            >
                {loading ? t('common.loading') : t('setup.verify.submit')}
            </Button>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2.5 }}>
                <Link
                    component="button"
                    variant="body2"
                    onClick={onBack}
                    underline="hover"
                    color="text.secondary"
                >
                    {t('setup.verify.wrong_email')}
                </Link>
                <Button
                    variant="text"
                    size="small"
                    onClick={handleResend}
                    disabled={cooldown > 0}
                >
                    {cooldown > 0
                        ? t('setup.verify.resend_in', { seconds: cooldown })
                        : t('setup.verify.resend')}
                </Button>
            </Box>
        </Box>
    );
};

export default Step1Verify;
