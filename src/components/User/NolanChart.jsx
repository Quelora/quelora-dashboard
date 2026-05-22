/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

// filepath: ./src/components/User/NolanChart.jsx
import React from 'react';
import { Box, Typography, Avatar, Tooltip } from '@mui/material';
import { useTranslation } from 'react-i18next';

const NolanChart = ({ data, user }) => {
    const { t } = useTranslation();

    const { x, y, label } = data || {};
    if (!data || x === undefined || y === undefined) return null;

    const size = 380;
    const padding = 60;
    const center = size / 2;
    const range = 10;
    const scale = (size - padding * 2) / (range * 2);

    const pointX = center + x * scale;
    const pointY = center - y * scale;

    const getQuadrantColor = (econ, pers) => {
        if (econ >= 0 && pers >= 0) return { bg: '#e3f2fd', border: '#1976d2' }; // Libertarian
        if (econ >= 0 && pers < 0) return { bg: '#fff3e0', border: '#f57c00' }; // Right Authoritarian
        if (econ < 0 && pers >= 0) return { bg: '#e8f5e9', border: '#388e3c' }; // Left Libertarian
        return { bg: '#ffebee', border: '#d32f2f' }; // Authoritarian
    };

    const quadrant = getQuadrantColor(x, y);

    const getQuadrantLabel = (econ, pers) => {
        if (econ >= 0 && pers >= 0) return t('users.nolan.libertarian');
        if (econ >= 0 && pers < 0) return t('users.nolan.rightAuthoritarian');
        if (econ < 0 && pers >= 0) return t('users.nolan.leftLibertarian');
        if (econ < 0 && pers < 0) return t('users.nolan.authoritarian');
        return t('users.nolan.centrist');
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', gap: 3, width: '100%', maxWidth: 700, mx: 'auto' }}>
            <Box sx={{ width: size, height: size, flexShrink: 0 }}>
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    {/* Background quadrants */}
                    <rect x={0} y={0} width={center} height={center} fill="#e8f5e9" />
                    <rect x={center} y={0} width={center} height={center} fill="#e3f2fd" />
                    <rect x={0} y={center} width={center} height={center} fill="#ffebee" />
                    <rect x={center} y={center} width={center} height={center} fill="#fff3e0" />

                    {/* Grid lines */}
                    {[-10, -5, 0, 5, 10].map(val => {
                        const pos = center + val * scale;
                        return (
                            <g key={val}>
                                <line x1={padding} y1={pos} x2={size - padding} y2={pos} stroke="#ccc" strokeWidth="1" strokeDasharray={val === 0 ? "none" : "4,4"} />
                                <line x1={pos} y1={padding} x2={pos} y2={size - padding} stroke="#ccc" strokeWidth="1" strokeDasharray={val === 0 ? "none" : "4,4"} />
                            </g>
                        );
                    })}

                    {/* Axes */}
                    <line x1={padding} y1={center} x2={size - padding} y2={center} stroke="#333" strokeWidth="2" />
                    <line x1={center} y1={padding} x2={center} y2={size - padding} stroke="#333" strokeWidth="2" />

                    {/* Axis arrows */}
                    <polygon points={`${size - padding},${center} ${size - padding - 10},${center - 5} ${size - padding - 10},${center + 5}`} fill="#333" />
                    <polygon points={`${center},${padding} ${center - 5},${padding + 10} ${center + 5},${padding + 10}`} fill="#333" />
                    <polygon points={`${padding},${center} ${padding + 10},${center - 5} ${padding + 10},${center + 5}`} fill="#333" />
                    <polygon points={`${center},${size - padding} ${center - 5},${size - padding - 10} ${center + 5},${size - padding - 10}`} fill="#333" />

                    {/* Labels */}
                    <text x={size - padding + 15} y={center + 4} fill="#333" fontSize="14" textAnchor="start" fontWeight="bold">
                        {t('users.nolan.economicAxis')}
                    </text>
                    <text x={center} y={padding - 10} fill="#333" fontSize="14" textAnchor="middle" fontWeight="bold">
                        {t('users.nolan.personalAxis')}
                    </text>

                    {/* Quadrant labels */}
                    <text x={center / 2} y={center / 2} fill="#388e3c" fontSize="16" textAnchor="middle" dominantBaseline="middle" fontWeight="bold">
                        {t('users.nolan.leftLibertarian')}
                    </text>
                    <text x={size - center / 2} y={center / 2} fill="#1976d2" fontSize="16" textAnchor="middle" dominantBaseline="middle" fontWeight="bold">
                        {t('users.nolan.libertarian')}
                    </text>
                    <text x={center / 2} y={size - center / 2} fill="#d32f2f" fontSize="16" textAnchor="middle" dominantBaseline="middle" fontWeight="bold">
                        {t('users.nolan.authoritarian')}
                    </text>
                    <text x={size - center / 2} y={size - center / 2} fill="#f57c00" fontSize="16" textAnchor="middle" dominantBaseline="middle" fontWeight="bold">
                        {t('users.nolan.rightAuthoritarian')}
                    </text>

                    {/* Ticks and values */}
                    {[-10, -5, 0, 5, 10].map(val => {
                        const pos = center + val * scale;
                        return (
                            <g key={`tick-${val}`}>
                                <text x={pos} y={center + 20} fill="#666" fontSize="12" textAnchor="middle">{val}</text>
                                <text x={center - 25} y={pos + 4} fill="#666" fontSize="12" textAnchor="end">{val}</text>
                            </g>
                        );
                    })}

                    {/* User point with avatar */}
                    <Tooltip
                        title={
                            <Box>
                                <Typography variant="body2" fontWeight="bold">{label}</Typography>
                                <Typography variant="caption">{t('users.nolan.economic')}: {x.toFixed(1)}</Typography>
                                <br />
                                <Typography variant="caption">{t('users.nolan.personal')}: {y.toFixed(1)}</Typography>
                                <br />
                                <Typography variant="caption" fontWeight="bold" sx={{_RENDERED: quadrant.border }}>
                                    {getQuadrantLabel(x, y)}
                                </Typography>
                            </Box>
                        }
                        arrow
                        placement="top"
                    >
                        <g>
                            <circle cx={pointX} cy={pointY} r="28" fill="white" stroke={quadrant.border} strokeWidth="3" />
                            <foreignObject x={pointX - 24} y={pointY - 24} width="48" height="48">
                                <Avatar
                                    src={user?.picture}
                                    sx={{ width: 48, height: 48, fontSize: '1.2rem' }}
                                >
                                    {user?.name?.charAt(0) || 'U'}
                                </Avatar>
                            </foreignObject>
                            <circle cx={pointX} cy={pointY} r="32" fill="transparent" stroke={quadrant.border} strokeWidth="2" strokeDasharray="4,4" />
                        </g>
                    </Tooltip>
                </svg>
            </Box>

            <Box sx={{ flex: 1, minWidth: 200, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="body2" gutterBottom fontWeight="medium">
                    {t('users.nolan.scores')}:
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box>
                        <Typography variant="caption" color="text.secondary" display="block">
                            {t('users.nolan.economic')}:
                        </Typography>
                        <Typography variant="h6" fontWeight="bold" color={x >= 0 ? 'primary' : 'error'}>
                            {x >= 0 ? '+' : ''}{x.toFixed(1)}
                        </Typography>
                    </Box>
                    <Box>
                        <Typography variant="caption" color="text.secondary" display="block">
                            {t('users.nolan.personal')}:
                        </Typography>
                        <Typography variant="h6" fontWeight="bold" color={y >= 0 ? 'success' : 'warning'}>
                            {y >= 0 ? '+' : ''}{y.toFixed(1)}
                        </Typography>
                    </Box>
                </Box>
                <Typography variant="body1" sx={{ mt: 2, fontWeight: 'bold', color: quadrant.border }}>
                    {getQuadrantLabel(x, y)}
                </Typography>
            </Box>
        </Box>
    );
};

export default NolanChart;