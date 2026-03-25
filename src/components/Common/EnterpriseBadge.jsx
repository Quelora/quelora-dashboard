/**
 * @fileoverview EnterpriseBadge — visual marker for enterprise-only features.
 *
 * Renders a small "ENTERPRISE" chip with a star icon. Intended to annotate
 * sidebar items, tab labels, and section headers so community-plan users can
 * identify which features require an upgrade at a glance.
 *
 * Usage:
 *
 *   <EnterpriseBadge />               // default compact chip
 *   <EnterpriseBadge size="small" />  // smaller variant for tight spaces
 *
 * @module components/Common/EnterpriseBadge
 */

import React from 'react';
import { Chip, Tooltip } from '@mui/material';
import { StarOutlined as StarIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

/**
 * @param {Object}            props
 * @param {'default'|'small'} [props.size='default'] - Size variant.
 * @param {Object}            [props.sx]              - Additional MUI sx overrides.
 */
const EnterpriseBadge = ({ size = 'default', sx = {} }) => {
    const { t } = useTranslation();

    const isSmall = size === 'small';

    return (
        <Tooltip
            title={t(
                'enterprise.badge_tooltip',
                'This feature requires an Enterprise plan.'
            )}
            placement="right"
            arrow
        >
            <Chip
                icon={
                    <StarIcon
                        sx={{ fontSize: isSmall ? 10 : 12, '&&': { color: 'inherit' } }}
                    />
                }
                label={t('enterprise.badge_label', 'Enterprise')}
                size="small"
                sx={{
                    height: isSmall ? 16 : 18,
                    fontSize: isSmall ? '0.55rem' : '0.6rem',
                    fontWeight: 700,
                    letterSpacing: '0.03em',
                    textTransform: 'uppercase',
                    backgroundColor: (theme) =>
                        theme.palette.mode === 'dark'
                            ? 'rgba(255, 193, 7, 0.18)'
                            : 'rgba(255, 160, 0, 0.14)',
                    color: (theme) =>
                        theme.palette.mode === 'dark' ? '#ffd54f' : '#e65100',
                    border: (theme) =>
                        `1px solid ${
                            theme.palette.mode === 'dark'
                                ? 'rgba(255, 193, 7, 0.35)'
                                : 'rgba(255, 160, 0, 0.4)'
                        }`,
                    '& .MuiChip-icon': {
                        ml: 0.5,
                    },
                    cursor: 'default',
                    pointerEvents: 'auto',
                    ...sx,
                }}
            />
        </Tooltip>
    );
};

export default EnterpriseBadge;
