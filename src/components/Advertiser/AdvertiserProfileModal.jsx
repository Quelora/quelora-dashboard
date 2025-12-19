// filepath: ./src/components/Advertiser/AdvertiserProfileModal.jsx
import React from 'react';
import { Dialog, DialogTitle, DialogContent, IconButton } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import AdvertiserProfileForm from './AdvertiserProfileForm';

const AdvertiserProfileModal = ({ 
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
            maxWidth="sm"
            fullWidth
            inert={open ? undefined : ''}
            scroll="body"
            PaperProps={{className: 'client-dialog'}}
        >
            <DialogTitle>
                {mode === 'create' ? t('advertiser.new', 'New Profile') : t('advertiser.edit', 'Edit Profile')}
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
                <AdvertiserProfileForm 
                    initialData={initialData}
                    onSave={onSave}
                    onCancel={onClose}
                    mode={mode}
                />
            </DialogContent>
        </Dialog>
    );
};

export default AdvertiserProfileModal;