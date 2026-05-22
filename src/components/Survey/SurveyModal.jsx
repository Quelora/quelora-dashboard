/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

// filepath: ./src/components/Survey/SurveyModal.jsx
import React from 'react';
import { Dialog, DialogTitle, DialogContent, IconButton } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import SurveyForm from './SurveyForm';

const SurveyModal = ({ 
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
            PaperProps={{className: 'client-dialog client-code-dialog'}}
        >
            <DialogTitle>
                {mode === 'create' ? t('survey.newSurvey') : t('survey.editSurvey')}
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
            
            {/* (Fix 3) Se quita el padding (p: 0) */}
            <DialogContent dividers sx={{ p: 0 }}>
                <SurveyForm 
                    initialData={initialData || {}}
                    mode={mode}
                    onSave={onSave}
                    onCancel={onClose}
                />
            </DialogContent>
        </Dialog>
    );
};

export default SurveyModal;