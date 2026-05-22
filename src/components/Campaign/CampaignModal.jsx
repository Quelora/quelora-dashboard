/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

// filepath: ./src/components/Campaign/CampaignModal.jsx
import React from 'react';
import { 
    Dialog, 
    DialogTitle, 
    DialogContent, 
    IconButton,
    Box,
    CircularProgress,
    Typography
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import CampaignForm from './CampaignForm';

const CampaignModal = ({ 
    open, 
    onClose, 
    initialData = {}, 
    mode = 'create',
    onSave,
    isLoading
}) => {
    const { t } = useTranslation();
    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            maxWidth="md"
            fullWidth
            inert={open ? undefined : ''}
            scroll="body"
            PaperProps={{className: 'client-dialog client-code-dialog'}}
        >
            <DialogTitle>
                {mode === 'create' ? t('campaign.newCampaign', 'New Campaign') : t('campaign.editCampaign', 'Edit Campaign')}
                <IconButton
                    aria-label="close"
                    onClick={onClose}
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        color: (theme) => theme.palette.grey[500],
                    }}
                >
                    <CloseIcon fontSize="small"/>
                </IconButton>
            </DialogTitle>
            
            <DialogContent dividers sx={{ p: 0 }}>
                {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                        <CircularProgress />
                    </Box>
                ) : !initialData ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                        <Typography color="error">
                            {t('campaign.errorLoading', 'Could not load campaign data.')}
                        </Typography>
                    </Box>
                ) : (
                    <CampaignForm 
                        initialData={initialData || {}}
                        mode={mode}
                        onSave={onSave}
                        onCancel={onClose}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
};

export default CampaignModal;