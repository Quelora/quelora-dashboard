/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

/**
 * @fileoverview EnterpriseBadge — visual marker for enterprise-only features.
 *
 * Renders a small star icon with a tooltip. Intended to annotate sidebar
 * items, tab labels, and section headers so community-plan users can
 * identify which features require an upgrade at a glance.
 *
 * Usage:
 *
 *   <EnterpriseBadge />               // default size
 *   <EnterpriseBadge size="small" />  // smaller variant for tight spaces
 *
 * @module components/Common/EnterpriseBadge
 */

import React from 'react';
import { Box, Tooltip } from '@mui/material';
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
            title={t('common.enterprise.badge_tooltip')}
            placement="right"
            arrow
        >
            <Box
                component="span"
                sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'default',
                    pointerEvents: 'auto',
                    ...sx,
                }}
            >
                <StarIcon
                    sx={{
                        fontSize: isSmall ? 13 : 15,
                        color: (theme) =>
                            theme.palette.mode === 'dark' ? '#ffd54f' : '#e65100',
                        opacity: 0.9,
                    }}
                />
            </Box>
        </Tooltip>
    );
};

export default EnterpriseBadge;
