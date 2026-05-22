/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

import React from 'react';
import { Dialog, DialogTitle, DialogContent, IconButton } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import PlacementPricingForm from './PlacementPricingForm';

const PlacementPricingModal = ({ 
    open, 
    onClose, 
    initialData = {}, 
    mode = 'create',
    onSave
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
            PaperProps={{className: 'client-dialog'}}
        >
            <DialogTitle>
                {mode === 'create' ? t('placementPricing.new', 'New Pricing Rule') : t('placementPricing.edit', 'Edit Pricing Rule')}
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
            
            <DialogContent dividers>
                <PlacementPricingForm 
                    initialData={initialData}
                    onSave={onSave}
                    onCancel={onClose}
                    mode={mode}
                />
            </DialogContent>
        </Dialog>
    );
};

export default PlacementPricingModal;