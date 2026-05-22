/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

// src/components/Client/ModulesConfigModal.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    FormControlLabel,
    Checkbox,
    Divider,
    Stack,
    Chip,
    LinearProgress,
} from '@mui/material';
import {
    Extension as ExtensionIcon,
    Save as SaveIcon,
} from '@mui/icons-material';
import { updateClientModules } from '../../api/admin';
import { getUserRole } from '../../utils/permissions';
import Swal from 'sweetalert2';

/** Enterprise modules a god user can toggle per client. */
const ENTERPRISE_MODULES = [
    { key: 'surveys',      label: 'Surveys'      },
    { key: 'gamification', label: 'Gamification' },
    { key: 'advertising',  label: 'Advertising'  },
    { key: 'network',      label: 'Network (SSE + Chat)' },
    { key: 'resilience',   label: 'Resilience (P2P)'     },
    { key: 'push',         label: 'Push Notifications'   },
    { key: 'liveMode',     label: 'Live Mode'            },
];

/** Community plugins any admin user can toggle per client. */
const COMMUNITY_PLUGINS = [
    { key: 'sentinel', label: 'Sentinel (content safety)' },
    { key: 'placer',   label: 'Placer (interaction bar placement)' },
];

/**
 * Modal for managing per-client enterprise modules and community plugins.
 *
 * - God users see and can toggle both enterprise modules and community plugins.
 * - Admin users see and can toggle only community plugins.
 *
 * @param {Object}   props
 * @param {boolean}  props.open          - Whether the dialog is visible.
 * @param {Function} props.onClose       - Called when the dialog should close.
 * @param {Object}   props.client        - The client object (must have `.cid`,
 *                                         `.enterpriseModules`, `.communityPlugins`).
 * @param {Function} props.onSaved       - Called after a successful save so the
 *                                         parent can refresh its client list.
 */
const ModulesConfigModal = ({ open, onClose, client, onSaved }) => {
    const { t } = useTranslation();
    const [saving, setSaving] = useState(false);
    const [role,   setRole]   = useState('');

    const [selectedEnterprise, setSelectedEnterprise] = useState([]);
    const [selectedCommunity,  setSelectedCommunity]  = useState([]);

    // Sync local state whenever the modal opens with a new client.
    useEffect(() => {
        if (!client) return;
        setSelectedEnterprise(Array.isArray(client.enterpriseModules) ? client.enterpriseModules : []);
        setSelectedCommunity( Array.isArray(client.communityPlugins)  ? client.communityPlugins  : []);
        setRole(getUserRole());
    }, [client, open]);

    const toggleEnterprise = (key) =>
        setSelectedEnterprise(prev =>
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        );

    const toggleCommunity = (key) =>
        setSelectedCommunity(prev =>
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        );

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = { communityPlugins: selectedCommunity };
            if (role === 'god') payload.enterpriseModules = selectedEnterprise;

            await updateClientModules(client.cid, payload);
            onSaved?.();
            onClose();
            Swal.fire({
                icon: 'success',
                title: t('common.success'),
                text: t('client.modules_saved', 'Client modules updated.'),
                timer: 1500,
                showConfirmButton: false,
                customClass: { container: 'swal-custom-zindex' },
            });
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: t('common.error'),
                text: String(error),
                customClass: { container: 'swal-custom-zindex' },
            });
        } finally {
            setSaving(false);
        }
    };

    if (!client) return null;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ExtensionIcon fontSize="small" />
                {t('client.modules_title', 'Client Modules')} — {client.cid}
            </DialogTitle>

            {saving && <LinearProgress />}

            <DialogContent dividers>

                {/* ── Enterprise modules (god only) ── */}
                {role === 'god' && (
                    <Box mb={3}>
                        <Typography variant="subtitle2" gutterBottom>
                            {t('client.enterprise_modules', 'Enterprise Modules')}
                            <Chip
                                label="god"
                                size="small"
                                color="warning"
                                sx={{ ml: 1, fontSize: '0.65rem' }}
                            />
                        </Typography>
                        <Stack spacing={0.5}>
                            {ENTERPRISE_MODULES.map(({ key, label }) => (
                                <FormControlLabel
                                    key={key}
                                    control={
                                        <Checkbox
                                            size="small"
                                            checked={selectedEnterprise.includes(key)}
                                            onChange={() => toggleEnterprise(key)}
                                        />
                                    }
                                    label={<Typography variant="body2">{label}</Typography>}
                                />
                            ))}
                        </Stack>
                        <Divider sx={{ mt: 2 }} />
                    </Box>
                )}

                {/* ── Community plugins (admin+) ── */}
                <Box>
                    <Typography variant="subtitle2" gutterBottom>
                        {t('client.community_plugins', 'Community Plugins')}
                    </Typography>
                    <Stack spacing={0.5}>
                        {COMMUNITY_PLUGINS.map(({ key, label }) => (
                            <FormControlLabel
                                key={key}
                                control={
                                    <Checkbox
                                        size="small"
                                        checked={selectedCommunity.includes(key)}
                                        onChange={() => toggleCommunity(key)}
                                    />
                                }
                                label={<Typography variant="body2">{label}</Typography>}
                            />
                        ))}
                    </Stack>
                </Box>

            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} disabled={saving}>
                    {t('common.cancel', 'Cancel')}
                </Button>
                <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleSave}
                    disabled={saving}
                >
                    {t('common.save', 'Save')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ModulesConfigModal;
