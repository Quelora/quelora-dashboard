/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

// src/components/Client/ConnectionStringModal.jsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Box, Button, Typography, Paper, Tooltip, IconButton, Alert,
} from '@mui/material';
import { Visibility, VisibilityOff, ContentCopy } from '@mui/icons-material';

/**
 * Small modal that surfaces the connection string (`apiUrl:cid:jwtSecret`)
 * for an existing client — useful when the operator needs to reconfigure
 * the WordPress plugin or any other integration point.
 *
 * @param {Object}   props
 * @param {boolean}  props.open      - Controls visibility.
 * @param {Function} props.setOpen   - Visibility setter.
 * @param {Object}   props.client    - Decrypted client object.
 * @param {Function} props.showToast - Transient notification callback.
 */
const ConnectionStringModal = ({ open, setOpen, client, showToast }) => {
    const { t } = useTranslation();
    const [showStr, setShowStr] = useState(false);
    const [copied,  setCopied]  = useState(false);

    const apiUrl    = client?.apiUrl || '';
    const cid       = client?.cid   || '';
    const jwtSecret = client?.config?.login?.jwtSecret || '';

    const connectionStr = jwtSecret ? `${apiUrl}:${cid}:${jwtSecret}` : null;
    const maskedStr     = connectionStr
        ? `${apiUrl}:${cid}:${'•'.repeat(Math.min(jwtSecret.length, 20))}`
        : null;

    const handleCopy = () => {
        if (!connectionStr) return;
        navigator.clipboard.writeText(connectionStr);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
        if (showToast) showToast(t('client.copy_success'), 'success');
    };

    const handleClose = () => {
        setShowStr(false);
        setCopied(false);
        setOpen(false);
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{ className: 'client-dialog' }}
        >
            <DialogTitle className="client-dialog-title">
                {t('client.connection_string_label')}
            </DialogTitle>

            <DialogContent>
                <Typography variant="body2" color="text.secondary" mb={2}>
                    {t('client.connection_string_hint')}
                </Typography>

                {connectionStr ? (
                    <Paper
                        variant="outlined"
                        sx={{
                            display:      'flex',
                            alignItems:   'center',
                            px: 2, py: 1, gap: 1,
                            bgcolor:      'action.hover',
                            borderRadius: 1,
                        }}
                    >
                        <Typography
                            sx={{
                                flex:       1,
                                fontFamily: 'monospace',
                                fontSize:   '0.8rem',
                                wordBreak:  'break-all',
                            }}
                        >
                            {showStr ? connectionStr : maskedStr}
                        </Typography>
                        <Tooltip title={showStr ? t('common.hide', 'Hide') : t('common.show', 'Show')}>
                            <IconButton size="small" onClick={() => setShowStr(p => !p)}>
                                {showStr ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                            </IconButton>
                        </Tooltip>
                        <Tooltip title={copied ? t('client.copy_success') : t('client.copy')}>
                            <IconButton size="small" onClick={handleCopy} color={copied ? 'success' : 'default'}>
                                <ContentCopy fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Paper>
                ) : (
                    <Alert severity="warning">
                        <Typography variant="body2">
                            {t('client.connection_string_jwt_missing')}
                        </Typography>
                    </Alert>
                )}

                <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="text.disabled">
                        {t('client.connection_string_format', 'Format: apiUrl : clientId : jwtSecret')}
                    </Typography>
                </Box>
            </DialogContent>

            <DialogActions>
                <Button onClick={handleClose} className="client-close-button">
                    {t('client.close')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ConnectionStringModal;
