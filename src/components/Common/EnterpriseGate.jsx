/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

/**
 * @fileoverview EnterpriseGate — locks enterprise-only features for community accounts.
 *
 * Wraps any content that requires an enterprise plan. When the current user
 * does NOT have the requested module enabled the children are rendered in a
 * visually-degraded state (blurred, non-interactive) and an overlay prompts
 * the user to upgrade their plan.
 *
 * Usage:
 *
 *   <EnterpriseGate module="surveys">
 *     <SurveysPage />
 *   </EnterpriseGate>
 *
 * @module components/Common/EnterpriseGate
 */

import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { LockOutlined as LockIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useEnterprise } from '../../hooks/useEnterprise';

/** URL of the external upgrade / pricing page. */
const UPGRADE_URL = 'https://quelora.org/pricing';

/**
 * @param {Object}          props
 * @param {string}          props.module             - Enterprise module identifier.
 * @param {React.ReactNode} props.children           - Content to gate.
 * @param {boolean}         [props.fullPage=false]   - Gate fills viewport height (page-level).
 * @param {boolean}         [props.compact=false]    - Reduced card for small containers (tabs, panels).
 */
const EnterpriseGate = ({ module, children, fullPage = false, compact = false }) => {
    const { hasModule } = useEnterprise();
    const { t } = useTranslation();

    // User has access — render children transparently.
    if (hasModule(module)) {
        return <>{children}</>;
    }

    return (
        <Box
            sx={{
                position: 'relative',
                minHeight: fullPage ? 'calc(100vh - 120px)' : compact ? 140 : 'inherit',
            }}
        >
            {/* Degraded background content */}
            <Box
                aria-hidden="true"
                sx={{
                    pointerEvents: 'none',
                    userSelect: 'none',
                    filter: 'blur(3px)',
                    opacity: 0.45,
                }}
            >
                {children}
            </Box>

            {/* Overlay */}
            <Box
                sx={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10,
                    backgroundColor: (theme) =>
                        theme.palette.mode === 'dark'
                            ? 'rgba(0, 0, 0, 0.55)'
                            : 'rgba(255, 255, 255, 0.55)',
                    backdropFilter: 'blur(2px)',
                    borderRadius: 'inherit',
                }}
            >
                <Paper
                    elevation={6}
                    sx={{
                        px: compact ? 3 : 5,
                        py: compact ? 2.5 : 4,
                        maxWidth: compact ? 300 : 380,
                        textAlign: 'center',
                        borderRadius: 3,
                        border: (theme) =>
                            `1px solid ${theme.palette.primary.main}40`,
                    }}
                >
                    <Box
                        sx={{
                            width: compact ? 36 : 56,
                            height: compact ? 36 : 56,
                            borderRadius: '50%',
                            backgroundColor: (theme) => `${theme.palette.primary.main}18`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mx: 'auto',
                            mb: compact ? 1 : 2,
                        }}
                    >
                        <LockIcon
                            sx={{ fontSize: compact ? 18 : 28, color: 'primary.main' }}
                        />
                    </Box>

                    <Typography
                        variant={compact ? 'subtitle2' : 'h6'}
                        fontWeight={700}
                        sx={{ mb: compact ? 0.5 : 1 }}
                    >
                        {t('common.enterprise.gate_title')}
                    </Typography>

                    {!compact && (
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 3 }}
                        >
                            {t('common.enterprise.gate_body')}
                        </Typography>
                    )}

                    <Button
                        variant="contained"
                        size={compact ? 'small' : 'large'}
                        href={UPGRADE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ borderRadius: 2, px: compact ? 2 : 4, mt: compact ? 1.5 : 0 }}
                    >
                        {t('common.enterprise.upgrade_cta')}
                    </Button>
                </Paper>
            </Box>
        </Box>
    );
};

export default EnterpriseGate;
