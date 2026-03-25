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
 * @param {string}          props.module    - Enterprise module identifier.
 * @param {React.ReactNode} props.children  - Content to gate.
 * @param {boolean}         [props.fullPage=false] - When true the gate fills
 *   the entire viewport height (useful for page-level gates).
 */
const EnterpriseGate = ({ module, children, fullPage = false }) => {
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
                minHeight: fullPage ? 'calc(100vh - 120px)' : 'inherit',
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
                        px: 5,
                        py: 4,
                        maxWidth: 380,
                        textAlign: 'center',
                        borderRadius: 3,
                        border: (theme) =>
                            `1px solid ${theme.palette.primary.main}40`,
                    }}
                >
                    <Box
                        sx={{
                            width: 56,
                            height: 56,
                            borderRadius: '50%',
                            backgroundColor: (theme) => `${theme.palette.primary.main}18`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mx: 'auto',
                            mb: 2,
                        }}
                    >
                        <LockIcon
                            sx={{ fontSize: 28, color: 'primary.main' }}
                        />
                    </Box>

                    <Typography
                        variant="h6"
                        fontWeight={700}
                        sx={{ mb: 1 }}
                    >
                        {t('enterprise.gate_title', 'Enterprise Feature')}
                    </Typography>

                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 3 }}
                    >
                        {t(
                            'enterprise.gate_body',
                            'This module is not included in your current plan. Upgrade to Enterprise to unlock it.'
                        )}
                    </Typography>

                    <Button
                        variant="contained"
                        size="large"
                        href={UPGRADE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ borderRadius: 2, px: 4 }}
                    >
                        {t('enterprise.upgrade_cta', 'Upgrade to Enterprise')}
                    </Button>
                </Paper>
            </Box>
        </Box>
    );
};

export default EnterpriseGate;
