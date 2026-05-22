/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

import React, { useState, useEffect } from 'react';
import {
    Grid,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    OutlinedInput,
    Box,
    Chip,
    Checkbox,
    ListItemText,
    FormHelperText
} from '@mui/material';
import CustomTextField from '../Common/CustomTextField';
import { loadClientsFromSession } from '../../api/auth';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
    PaperProps: {
        style: {
            maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
            width: 250,
        },
    },
};

const CampaignGeneralTab = ({ formData, handleChange, handleDateChange, validationErrors, t }) => {
    const [availableClients, setAvailableClients] = useState([]);

    useEffect(() => {
        const clients = loadClientsFromSession();
        setAvailableClients(clients || []);
    }, []);

    const handleCidsChange = (event) => {
        const { target: { value } } = event;
        // On autofill we get a stringified value
        const newCids = typeof value === 'string' ? value.split(',') : value;
        
        // Simulate event for useCampaignForm hook
        handleChange({
            target: {
                name: 'cids',
                value: newCids
            }
        });
    };

    return (
        <Grid container spacing={3} direction="column">
            <Grid item xs={12}>
                <FormControl fullWidth required error={!!validationErrors.cids}>
                    <InputLabel id="cids-multiple-checkbox-label">{t('campaign.clients', 'Clients (CIDs)')}</InputLabel>
                    <Select
                        labelId="cids-multiple-checkbox-label"
                        id="cids-multiple-checkbox"
                        multiple
                        value={formData.cids || []}
                        onChange={handleCidsChange}
                        input={<OutlinedInput label={t('campaign.clients', 'Clients (CIDs)')} />}
                        renderValue={(selected) => (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>{selected.map((value) => <Chip key={value} label={value} size="small" />)}</Box>
                        )}
                        MenuProps={MenuProps}
                    >
                        {availableClients.map((client) => (
                            <MenuItem key={client.cid} value={client.cid}>
                                <Checkbox checked={(formData.cids || []).indexOf(client.cid) > -1} />
                                <ListItemText primary={client.name || client.cid} secondary={client.cid} />
                            </MenuItem>
                        ))}
                    </Select>
                    {validationErrors.cids && (
                        <FormHelperText>{t(validationErrors.cids)}</FormHelperText>
                    )}
                </FormControl>
            </Grid>
            <Grid item xs={12}>
                <CustomTextField
                    label={t('campaign.name', 'Campaign Name')}
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    error={!!validationErrors.name}
                    helperText={validationErrors.name ? t(validationErrors.name) : ''}
                    fullWidth
                    required
                />
            </Grid>
            <Grid item xs={12}>
                <FormControl fullWidth size="small">
                    <InputLabel>{t('campaign.status', 'Status')}</InputLabel>
                    <Select
                        label={t('campaign.status', 'Status')}
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                    >
                        <MenuItem value="draft">{t('campaign.statusDraft', 'Draft')}</MenuItem>
                        <MenuItem value="active">{t('campaign.statusActive', 'Active')}</MenuItem>
                        <MenuItem value="paused">{t('campaign.statusPaused', 'Paused')}</MenuItem>
                    </Select>
                </FormControl>
            </Grid>
            <Grid item xs={12}>
                <TextField
                    label={t('campaign.startDate', 'Start Date')}
                    type="date"
                    value={formData.startDate || ''}
                    onChange={(e) => handleDateChange('startDate', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                    size="small"
                    required
                    error={!!validationErrors.startDate}
                    helperText={validationErrors.startDate ? t(validationErrors.startDate) : ''}
                />
            </Grid>
            <Grid item xs={12}>
                <TextField
                    label={t('campaign.endDate', 'End Date (Optional)')}
                    type="date"
                    value={formData.endDate || ''}
                    onChange={(e) => handleDateChange('endDate', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                    size="small"
                />
            </Grid>
        </Grid>
    );
};

export default CampaignGeneralTab;