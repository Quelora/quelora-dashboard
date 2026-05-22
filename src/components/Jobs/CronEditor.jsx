/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

// src/components/Jobs/CronEditor.jsx
import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Box,
    ToggleButtonGroup,
    ToggleButton,
    TextField,
    Typography,
    Stack,
    Chip,
} from '@mui/material';
import {
    Timer as SecondsIcon,
    Schedule as MinutesIcon,
    AccessTime as HoursIcon,
    Today as DailyIcon,
    Code as CustomIcon,
} from '@mui/icons-material';

// ---------------------------------------------------------------------------
// Parse / build helpers
// ---------------------------------------------------------------------------

const parseCron = (expr) => {
    if (!expr) return { type: 'custom', customValue: '' };
    const parts = expr.trim().split(/\s+/);

    // 6-field: seconds-based  */N * * * * *
    if (parts.length === 6) {
        const m = parts[0].match(/^\*\/(\d+)$/);
        if (m && parts.slice(1).every(p => p === '*')) {
            return { type: 'seconds', n: parseInt(m[1]) };
        }
    }

    if (parts.length === 5) {
        // */N * * * *  → every N minutes
        const mMin = parts[0].match(/^\*\/(\d+)$/);
        if (mMin && parts[1] === '*' && parts[2] === '*' && parts[3] === '*' && parts[4] === '*') {
            return { type: 'minutes', n: parseInt(mMin[1]) };
        }

        // 0 */N * * *  → every N hours
        if (parts[0] === '0') {
            const mHr = parts[1].match(/^\*\/(\d+)$/);
            if (mHr && parts[2] === '*' && parts[3] === '*' && parts[4] === '*') {
                return { type: 'hours', n: parseInt(mHr[1]) };
            }
        }

        // MM HH * * *  → daily at specific time
        const minute = parseInt(parts[0]);
        const hour   = parseInt(parts[1]);
        if (
            !isNaN(minute) && minute >= 0 && minute <= 59 &&
            !isNaN(hour)   && hour   >= 0 && hour   <= 23 &&
            parts[2] === '*' && parts[3] === '*' && parts[4] === '*'
        ) {
            return { type: 'daily', hour, minute };
        }
    }

    return { type: 'custom', customValue: expr };
};

const buildCron = (state) => {
    switch (state.type) {
        case 'seconds': return `*/${Math.max(1, state.n || 1)} * * * * *`;
        case 'minutes': return `*/${Math.max(1, state.n || 1)} * * * *`;
        case 'hours':   return `0 */${Math.max(1, state.n || 1)} * * *`;
        case 'daily': {
            const h = Math.max(0, Math.min(23, state.hour   || 0));
            const m = Math.max(0, Math.min(59, state.minute || 0));
            return `${m} ${h} * * *`;
        }
        default: return state.customValue || '';
    }
};

const describeCron = (state, t) => {
    switch (state.type) {
        case 'seconds': return t('jobs.cron_editor.desc_seconds', { n: state.n || 1 });
        case 'minutes': return t('jobs.cron_editor.desc_minutes', { n: state.n || 1 });
        case 'hours':   return t('jobs.cron_editor.desc_hours',   { n: state.n || 1 });
        case 'daily': {
            const h = String(state.hour   || 0).padStart(2, '0');
            const m = String(state.minute || 0).padStart(2, '0');
            return t('jobs.cron_editor.desc_daily', { time: `${h}:${m}` });
        }
        default: return state.customValue || '—';
    }
};

// ---------------------------------------------------------------------------
// CronEditor
// ---------------------------------------------------------------------------

const CronEditor = ({ value, onChange, defaultCron }) => {
    const { t } = useTranslation();
    const [state, setState] = useState(() => parseCron(value));

    const emit = useCallback((next) => {
        setState(next);
        onChange(buildCron(next));
    }, [onChange]);

    const handleTypeChange = (_, newType) => {
        if (!newType) return;
        switch (newType) {
            case 'seconds': emit({ type: 'seconds', n: 30 });      break;
            case 'minutes': emit({ type: 'minutes', n: 5 });       break;
            case 'hours':   emit({ type: 'hours',   n: 1 });       break;
            case 'daily':   emit({ type: 'daily', hour: 2, minute: 0 }); break;
            default:        emit({ type: 'custom', customValue: value || defaultCron || '' }); break;
        }
    };

    const patch = (fields) => emit({ ...state, ...fields });

    const cronExpr = buildCron(state);
    const humanDesc = describeCron(state, t);

    return (
        <Box>
            {/* Type selector */}
            <ToggleButtonGroup
                value={state.type}
                exclusive
                onChange={handleTypeChange}
                size="small"
                sx={{ flexWrap: 'wrap', mb: 2, gap: 0.5 }}
            >
                <ToggleButton value="seconds" sx={{ textTransform: 'none', gap: 0.5 }}>
                    <SecondsIcon fontSize="small" />
                    {t('jobs.cron_editor.type_seconds', 'Seconds')}
                </ToggleButton>
                <ToggleButton value="minutes" sx={{ textTransform: 'none', gap: 0.5 }}>
                    <MinutesIcon fontSize="small" />
                    {t('jobs.cron_editor.type_minutes', 'Minutes')}
                </ToggleButton>
                <ToggleButton value="hours" sx={{ textTransform: 'none', gap: 0.5 }}>
                    <HoursIcon fontSize="small" />
                    {t('jobs.cron_editor.type_hours', 'Hours')}
                </ToggleButton>
                <ToggleButton value="daily" sx={{ textTransform: 'none', gap: 0.5 }}>
                    <DailyIcon fontSize="small" />
                    {t('jobs.cron_editor.type_daily', 'Daily')}
                </ToggleButton>
                <ToggleButton value="custom" sx={{ textTransform: 'none', gap: 0.5 }}>
                    <CustomIcon fontSize="small" />
                    {t('jobs.cron_editor.type_custom', 'Custom')}
                </ToggleButton>
            </ToggleButtonGroup>

            {/* Per-type inputs */}
            {state.type === 'seconds' && (
                <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body2">{t('jobs.cron_editor.every', 'Every')}</Typography>
                    <TextField
                        type="number"
                        size="small"
                        value={state.n || 1}
                        onChange={(e) => patch({ n: Math.max(1, Math.min(59, parseInt(e.target.value) || 1)) })}
                        inputProps={{ min: 1, max: 59, style: { width: 60 } }}
                    />
                    <Typography variant="body2">{t('jobs.cron_editor.seconds', 'second(s)')}</Typography>
                </Stack>
            )}

            {state.type === 'minutes' && (
                <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body2">{t('jobs.cron_editor.every', 'Every')}</Typography>
                    <TextField
                        type="number"
                        size="small"
                        value={state.n || 1}
                        onChange={(e) => patch({ n: Math.max(1, Math.min(59, parseInt(e.target.value) || 1)) })}
                        inputProps={{ min: 1, max: 59, style: { width: 60 } }}
                    />
                    <Typography variant="body2">{t('jobs.cron_editor.minutes', 'minute(s)')}</Typography>
                </Stack>
            )}

            {state.type === 'hours' && (
                <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body2">{t('jobs.cron_editor.every', 'Every')}</Typography>
                    <TextField
                        type="number"
                        size="small"
                        value={state.n || 1}
                        onChange={(e) => patch({ n: Math.max(1, Math.min(23, parseInt(e.target.value) || 1)) })}
                        inputProps={{ min: 1, max: 23, style: { width: 60 } }}
                    />
                    <Typography variant="body2">{t('jobs.cron_editor.hours', 'hour(s)')}</Typography>
                </Stack>
            )}

            {state.type === 'daily' && (
                <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body2">{t('jobs.cron_editor.daily_at', 'Daily at')}</Typography>
                    <TextField
                        type="number"
                        size="small"
                        label={t('jobs.cron_editor.hour', 'Hour')}
                        value={state.hour ?? 0}
                        onChange={(e) => patch({ hour: Math.max(0, Math.min(23, parseInt(e.target.value) || 0)) })}
                        inputProps={{ min: 0, max: 23, style: { width: 60 } }}
                    />
                    <Typography variant="body2">:</Typography>
                    <TextField
                        type="number"
                        size="small"
                        label={t('jobs.cron_editor.minute', 'Minute')}
                        value={state.minute ?? 0}
                        onChange={(e) => patch({ minute: Math.max(0, Math.min(59, parseInt(e.target.value) || 0)) })}
                        inputProps={{ min: 0, max: 59, style: { width: 60 } }}
                    />
                </Stack>
            )}

            {state.type === 'custom' && (
                <TextField
                    fullWidth
                    size="small"
                    label={t('jobs.cron_editor.expression', 'Cron expression')}
                    value={state.customValue || ''}
                    onChange={(e) => patch({ customValue: e.target.value })}
                    inputProps={{ style: { fontFamily: 'monospace' } }}
                    helperText={defaultCron ? `default: ${defaultCron}` : undefined}
                />
            )}

            {/* Preview */}
            {state.type !== 'custom' && (
                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography variant="caption" color="text.secondary">
                        {t('jobs.cron_editor.preview', 'Expression')}:
                    </Typography>
                    <Chip
                        label={cronExpr}
                        size="small"
                        variant="outlined"
                        sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
                    />
                    <Typography variant="caption" color="text.secondary">
                        — {humanDesc}
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

export default CronEditor;
