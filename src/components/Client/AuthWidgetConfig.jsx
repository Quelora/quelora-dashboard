/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

// ./src/components/Client/AuthWidgetConfig.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    Grid,
    FormControlLabel,
    Checkbox,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Typography
} from '@mui/material';
import CustomTextField from '../Common/CustomTextField';

/**
 * Configuration component for the Authentication Widget.
 * Allows setting the enabled state, CSS selector, and DOM position.
 *
 * @param {Object} props
 * @param {Object} props.config - The current configuration state object.
 * @param {Function} props.setConfig - State setter for the configuration.
 * @param {boolean} props.isFormSubmitted - Flag indicating if the save attempt has been triggered.
 * @returns {JSX.Element}
 */
const AuthWidgetConfig = ({ config, setConfig, isFormSubmitted }) => {
    const { t } = useTranslation();
    const MAX_SELECTOR_LENGTH = 100;

    const defaultAuthWidgetConfig = {
        enabled: false,
        selector: '',
        position: 'inside'
    };

    const currentConfig = config.config.authWidget || defaultAuthWidgetConfig;

    /**
     * Handles changes for the Auth Widget configuration fields.
     * * @param {string} field - The key of the field being updated (enabled, selector, position).
     * @param {string|boolean} value - The new value for the field.
     */
    const handleAuthWidgetChange = (field, value) => {
        if (field === 'selector' && value.length > MAX_SELECTOR_LENGTH) {
            return;
        }

        setConfig(prev => ({
            ...prev,
            config: {
                ...prev.config,
                authWidget: {
                    ...currentConfig,
                    [field]: value
                }
            }
        }));
    };

    const isSelectorInvalid = currentConfig.enabled && (!currentConfig.selector || currentConfig.selector.trim() === '');

    return (
        <Grid container direction="column" spacing={2}>
            <Grid item>
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={currentConfig.enabled || false}
                            onChange={(e) => handleAuthWidgetChange('enabled', e.target.checked)}
                        />
                    }
                    label={t('client.auth_widget_enabled') || 'Enable Auth Widget'}
                />
            </Grid>

            {currentConfig.enabled && (
                <>
                    <Grid item>
                        <CustomTextField
                            label={t('client.auth_widget_selector') || 'Widget DOM Selector'}
                            fullWidth
                            variant="outlined"
                            value={currentConfig.selector || ''}
                            onChange={(e) => handleAuthWidgetChange('selector', e.target.value)}
                            error={isFormSubmitted && isSelectorInvalid}
                            helperText={
                                isFormSubmitted && isSelectorInvalid
                                    ? (t('client.auth_widget_selector_required') || 'Selector is required when enabled.')
                                    : (t('client.auth_widget_selector_help') || 'e.g. #my-nav-actions')
                            }
                            inputProps={{ maxLength: MAX_SELECTOR_LENGTH }}
                        />
                        <Typography
                            variant="caption"
                            color={currentConfig.selector?.length > MAX_SELECTOR_LENGTH ? 'error' : 'textSecondary'}
                            align="right"
                            display="block"
                        >
                            {currentConfig.selector?.length || 0}/{MAX_SELECTOR_LENGTH}
                        </Typography>
                    </Grid>
                    <Grid item>
                        <FormControl fullWidth>
                            <InputLabel>{t('client.auth_widget_position') || 'Widget Position'}</InputLabel>
                            <Select
                                value={currentConfig.position || 'inside'}
                                onChange={(e) => handleAuthWidgetChange('position', e.target.value)}
                                size="small"
                            >
                                <MenuItem value="before">{t('client.position_before') || 'Before'}</MenuItem>
                                <MenuItem value="after">{t('client.position_after') || 'After'}</MenuItem>
                                <MenuItem value="inside">{t('client.position_inside') || 'Inside'}</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                </>
            )}
        </Grid>
    );
};

export default AuthWidgetConfig;