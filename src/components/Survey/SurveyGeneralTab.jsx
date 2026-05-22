/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

import React, { useState, useEffect } from 'react';
import { 
    Box, 
    FormControlLabel, 
    Switch, 
    FormControl, 
    InputLabel, 
    Select, 
    MenuItem, 
    OutlinedInput, 
    Chip, 
    Checkbox, 
    ListItemText, 
    FormHelperText 
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
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

const SurveyGeneralTab = ({ formData, handleChange, handleDateChange, validationErrors, t }) => {
    const [availableClients, setAvailableClients] = useState([]);

    useEffect(() => {
        const clients = loadClientsFromSession();
        setAvailableClients(clients || []);
    }, []);

    const handleCidsChange = (event) => {
        const { target: { value } } = event;
        // On autofill we get a stringified value
        const newCids = typeof value === 'string' ? value.split(',') : value;
        
        // Simulate event for handleChange
        handleChange({
            target: {
                name: 'cids',
                value: newCids
            }
        });
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                
                {/* CID Selector (Multi-select) */}
                <FormControl fullWidth required error={!!validationErrors.cids}>
                    <InputLabel id="cids-multiple-checkbox-label">{t('campaign.clients', 'Clients')}</InputLabel>
                    <Select
                        labelId="cids-multiple-checkbox-label"
                        id="cids-multiple-checkbox"
                        multiple
                        value={formData.cids || []}
                        onChange={handleCidsChange}
                        input={<OutlinedInput label={t('campaign.clients', 'Clients')} />}
                        renderValue={(selected) => (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {selected.map((value) => <Chip key={value} label={value} size="small" />)}
                            </Box>
                        )}
                        MenuProps={MenuProps}
                    >
                        {availableClients.map((client) => (
                            <MenuItem key={client.cid} value={client.cid}>
                                <Checkbox checked={(formData.cids || []).indexOf(client.cid) > -1} />
                                <ListItemText primary={client.description || client.cid} secondary={client.cid} />
                            </MenuItem>
                        ))}
                    </Select>
                    {validationErrors.cids && (
                        <FormHelperText>{t(validationErrors.cids)}</FormHelperText>
                    )}
                </FormControl>

                <CustomTextField
                    label={t('survey.question')}
                    name="question"
                    value={formData.question}
                    onChange={handleChange}
                    multiline
                    rows={3}
                    required
                    error={!!validationErrors.question}
                    helperText={validationErrors.question}
                />
                <DatePicker
                    label={t('survey.startTime')}
                    value={new Date(formData.startTime)}
                    onChange={(date) => handleDateChange('startTime', date)}
                    slotProps={{
                        textField: {
                            fullWidth: true,
                            error: !!validationErrors.startTime,
                            helperText: validationErrors.startTime
                        }
                    }}
                />
                <DatePicker
                    label={t('survey.endTime')}
                    value={new Date(formData.endTime)}
                    onChange={(date) => handleDateChange('endTime', date)}
                    slotProps={{
                        textField: {
                            fullWidth: true,
                            required: true,
                            error: !!validationErrors.endTime,
                            helperText: validationErrors.endTime
                        }
                    }}
                />
                <FormControlLabel
                    control={
                        <Switch
                            checked={formData.isActive}
                            onChange={handleChange}
                            name="isActive"
                        />
                    }
                    label={t('survey.isActive')}
                />
                <FormControlLabel
                    control={
                        <Switch
                            checked={formData.requiresAuth}
                            onChange={handleChange}
                            name="requiresAuth"
                        />
                    }
                    label={t('survey.requiresAuth')}
                />
                <FormControlLabel
                    control={
                        <Switch
                            checked={formData.showResultsAfterVote}
                            onChange={handleChange}
                            name="showResultsAfterVote"
                        />
                    }
                    label={t('survey.showResultsAfterVote')}
                />
                
                <Box sx={{ mt: 1 }}>
                    <CustomTextField
                        label={t('survey.priority')}
                        name="priority"
                        type="number"
                        value={formData.priority}
                        onChange={handleChange}
                        fullWidth
                        size="small"
                        InputProps={{ inputProps: { min: 0 } }}
                        helperText={t('survey.priorityHelper')}
                    />
                </Box>
            </Box>
        </LocalizationProvider>
    );
};

export default SurveyGeneralTab;