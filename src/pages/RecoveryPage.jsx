/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

import { useEffect } from 'react';
import {
    Box, AppBar, Toolbar, Typography, Paper, Select, MenuItem,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import Recovery from '../components/Auth/Recovery';
import ThemeSwitcher from '../components/Common/ThemeSwitcher';
import '../assets/css/SetupWizard.css';

const SUPPORTED_LANGUAGES = [
    { code: 'en', label: 'EN' }, { code: 'es', label: 'ES' },
    { code: 'pt', label: 'PT' }, { code: 'fr', label: 'FR' },
    { code: 'de', label: 'DE' }, { code: 'it', label: 'IT' },
    { code: 'ru', label: 'RU' }, { code: 'zh', label: 'ZH' },
    { code: 'ja', label: 'JA' }, { code: 'ar', label: 'AR' },
    { code: 'hi', label: 'HI' }, { code: 'he', label: 'HE' },
];

const RTL_LANGS = new Set(['ar', 'he']);

/**
 * Full-page wrapper for the password recovery flow.
 * Uses the same layout as SetupWizard (solid AppBar, Paper card, footer).
 */
const RecoveryPage = ({ toggleTheme, currentTheme }) => {
    const { t, i18n } = useTranslation();

    useEffect(() => {
        document.title = t('login.recovery_page_title');
    }, [t]);

    const changeLanguage = (code) => {
        i18n.changeLanguage(code);
        document.documentElement.setAttribute('dir', RTL_LANGS.has(code) ? 'rtl' : 'ltr');
    };

    return (
        <Box className="setup-wizard-root">
            <div className="bg"></div>
            <div className="bg bg2"></div>
            <div className="bg bg3"></div>

            <AppBar
                position="sticky"
                color="default"
                elevation={0}
                sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper', borderRadius: 0 }}
            >
                <Toolbar sx={{ justifyContent: 'space-between', minHeight: 56, px: { xs: 2, sm: 4 } }}>
                    <Typography variant="h6" fontWeight={800} color="primary" sx={{ letterSpacing: -0.5 }}>
                        Quelora
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Select
                            value={i18n.language?.slice(0, 2) || 'en'}
                            onChange={(e) => changeLanguage(e.target.value)}
                            size="small"
                            variant="outlined"
                            sx={{ minWidth: 72, fontSize: '0.8rem' }}
                        >
                            {SUPPORTED_LANGUAGES.map(({ code, label }) => (
                                <MenuItem key={code} value={code} sx={{ fontSize: '0.8rem' }}>
                                    {label}
                                </MenuItem>
                            ))}
                        </Select>
                        {toggleTheme && (
                            <ThemeSwitcher theme={currentTheme} toggleTheme={toggleTheme} />
                        )}
                    </Box>
                </Toolbar>
            </AppBar>

            <Box
                sx={{
                    flex: 1,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    py: { xs: 3, sm: 5 },
                    px: 2,
                }}
            >
                <Paper
                    elevation={2}
                    sx={{
                        width: '100%',
                        maxWidth: 480,
                        p: { xs: 3, sm: 4 },
                    }}
                >
                    <Recovery />
                </Paper>
            </Box>

            <Box className="setup-wizard-footer" component="footer">
                © {new Date().getFullYear()} Quelora - Versión 1.0
            </Box>
        </Box>
    );
};

export default RecoveryPage;
