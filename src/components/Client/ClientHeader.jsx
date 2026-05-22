/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

// ./src/components/Client/ClientHeader.jsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import IconButton from '@mui/material/IconButton';
import CodeIcon from '@mui/icons-material/Code';
import ArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import CopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import CustomTextField from '../Common/CustomTextField'; 

const ClientHeader = ({ anchorEl, setAnchorEl, showToast }) => { 
    const { t } = useTranslation();
    const [tabValue, setTabValue] = useState(0);
    const cloneUrl = 'https://github.com/quelora.git/repo.git';
    const sshUrl = 'git@github.com/quelora.git';

    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const handleCopyUrl = (url) => {
        navigator.clipboard.writeText(url);
        if (showToast) {
            showToast(t('client.copy_success'), 'success'); 
        }
    };

    return (
        <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3}}>
            <Typography variant="h4" className="title">{t('client.title')}</Typography>
            <Button
                variant="contained"
                startIcon={<CodeIcon/>}
                endIcon={<ArrowDownIcon/>}
                onClick={handleMenuOpen}
                sx={{
                    borderRadius: '8px',
                    textTransform: 'none'
                }}
            >
                {t('client.code_button')}
            </Button>
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                anchorOrigin={{vertical: 'bottom', horizontal: 'right'}}
                transformOrigin={{vertical: 'top', horizontal: 'right'}}
                // El padding de contenido se maneja en theme-overrides.css
                PaperProps={{className: 'client-menu'}} 
            >
                <Box className="client-menu-content" sx={{width: 300, p: 2}}>
                    <Typography variant="subtitle1" sx={{mb: 1}}>{t('client.clone_title')}</Typography>
                    <Tabs 
                        value={tabValue} 
                        onChange={handleTabChange}
                        className="client-tabs"
                    >
                        <Tab label="HTTPS"/>
                        <Tab label="SSH"/>
                    </Tabs>
                    {tabValue === 0 && (
                        <Box sx={{display: 'flex', alignItems: 'center', mt: 1}}>
                            <CustomTextField 
                                value={cloneUrl}
                                fullWidth
                                InputProps={{readOnly: true}}
                                size="small"
                                sx={{mr: 1}}
                            />
                            <Button onClick={() => handleCopyUrl(cloneUrl)} sx={{minWidth: 40}}>
                                <CopyIcon/>
                            </Button>
                        </Box>
                    )}
                    {tabValue === 1 && (
                        <Box sx={{display: 'flex', alignItems: 'center', mt: 1}}>
                            <CustomTextField 
                                value={sshUrl}
                                fullWidth
                                InputProps={{readOnly: true}}
                                size="small"
                                sx={{mr: 1}}
                            />
                            <Button onClick={() => handleCopyUrl(sshUrl)} sx={{minWidth: 40}}>
                                <CopyIcon/>
                            </Button>
                        </Box>
                    )}
                    <Button 
                        fullWidth
                        startIcon={<DownloadIcon/>}
                        sx={{mt: 2}}
                    >
                        {t('client.download_zip')}
                    </Button>
                </Box>
            </Menu>
        </Box>
    );
};

export default ClientHeader;