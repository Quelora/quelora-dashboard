// ./src/components/Client/EntityConfig.jsx
import { useTranslation } from 'react-i18next';
import {
    Grid,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Typography
} from '@mui/material';
import CustomTextField from '../Common/CustomTextField';
import React from 'react';

const EntityConfig = ({ config, setConfig, isFormSubmitted }) => {
    const { t } = useTranslation();
    const MAX_SELECTOR_LENGTH = 100;
    const MAX_ATTRIBUTE_LENGTH = 100;
    const MAX_RELATIVE_TO_LENGTH = 100;

    const defaultEntityConfig = {
        selector: 'article',
        entityIdAttribute: 'href',
        interactionPlacement: {
            position: 'after',
            relativeTo: '.article-actions'
        }
    };

    const currentConfig = config.config.entityConfig || defaultEntityConfig;

    const handleEntityConfigChange = (field, value) => {
        const maxLength = field === 'selector' ? MAX_SELECTOR_LENGTH :
                          field === 'entityIdAttribute' ? MAX_ATTRIBUTE_LENGTH :
                          field === 'relativeTo' ? MAX_RELATIVE_TO_LENGTH : 100;
        
        if (value.length <= maxLength) {
            if (field === 'position' || field === 'relativeTo') {
                setConfig(prev => ({
                    ...prev,
                    config: {
                        ...prev.config,
                        entityConfig: {
                            ...currentConfig,
                            interactionPlacement: {
                                ...currentConfig.interactionPlacement,
                                [field]: value
                            }
                        }
                    }
                }));
            } else {
                setConfig(prev => ({
                    ...prev,
                    config: {
                        ...prev.config,
                        entityConfig: {
                            ...currentConfig,
                            [field]: value
                        }
                    }
                }));
            }
        }
    };

    const isValidSelector = (selector) => {
        return /^[a-zA-Z0-9\-_.#[\]:*()=~^$]+$/.test(selector);
    };

    const isSelectorInvalid = !currentConfig.selector || !isValidSelector(currentConfig.selector);
    const isAttributeInvalid = !currentConfig.entityIdAttribute;
    const isRelativeToInvalid = !currentConfig.interactionPlacement.relativeTo;

    return (
        <Grid container direction="column" spacing={2}>
            <Grid>
                <CustomTextField
                    label={t('client.entity_selector')}
                    fullWidth
                    variant="outlined"
                    value={currentConfig.selector}
                    onChange={(e) => handleEntityConfigChange('selector', e.target.value)}
                    // CORRECCIÓN: error debe ser booleano
                    error={isFormSubmitted && isSelectorInvalid}
                    helperText={
                        isFormSubmitted && isSelectorInvalid
                            ? (!currentConfig.selector 
                                ? t('client.entity_selector_required')
                                : t('client.entity_selector_invalid'))
                            : t('client.entity_selector_help')
                    }
                    inputProps={{maxLength: MAX_SELECTOR_LENGTH}}
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
            <Grid>
                <CustomTextField
                    label={t('client.entity_id_attribute')}
                    fullWidth
                    variant="outlined"
                    value={currentConfig.entityIdAttribute}
                    onChange={(e) => handleEntityConfigChange('entityIdAttribute', e.target.value)}
                    // CORRECCIÓN: error debe ser booleano
                    error={isFormSubmitted && isAttributeInvalid}
                    helperText={
                        isFormSubmitted && isAttributeInvalid
                            ? t('client.entity_id_attribute_required')
                            : t('client.entity_id_attribute_help')
                    }
                    inputProps={{maxLength: MAX_ATTRIBUTE_LENGTH}}
                />
                <Typography
                    variant="caption"
                    color={currentConfig.entityIdAttribute?.length > MAX_ATTRIBUTE_LENGTH ? 'error' : 'textSecondary'}
                    align="right"
                    display="block"
                >
                    {currentConfig.entityIdAttribute?.length || 0}/{MAX_ATTRIBUTE_LENGTH}
                </Typography>
            </Grid>
            <Grid>
                <FormControl fullWidth>
                    <InputLabel>{t('client.interaction_position')}</InputLabel>
                    <Select
                        value={currentConfig.interactionPlacement.position}
                        onChange={(e) => handleEntityConfigChange('position', e.target.value)}
                        size="small"
                    >
                        <MenuItem value="before">{t('client.position_before')}</MenuItem>
                        <MenuItem value="after">{t('client.position_after')}</MenuItem>
                        <MenuItem value="inside">{t('client.position_inside')}</MenuItem>
                    </Select>
                </FormControl>
            </Grid>
            <Grid>
                <CustomTextField
                    label={t('client.interaction_relative_to')}
                    fullWidth
                    variant="outlined"
                    value={currentConfig.interactionPlacement.relativeTo}
                    onChange={(e) => handleEntityConfigChange('relativeTo', e.target.value)}
                    // CORRECCIÓN: error debe ser booleano
                    error={isFormSubmitted && isRelativeToInvalid}
                    helperText={
                        isFormSubmitted && isRelativeToInvalid
                            ? t('client.interaction_relative_to_required')
                            : t('client.interaction_relative_to_help')
                    }
                    inputProps={{maxLength: MAX_RELATIVE_TO_LENGTH}}
                />
                <Typography
                    variant="caption"
                    color={currentConfig.interactionPlacement.relativeTo?.length > MAX_RELATIVE_TO_LENGTH ? 'error' : 'textSecondary'}
                    align="right"
                    display="block"
                >
                    {currentConfig.interactionPlacement.relativeTo?.length || 0}/{MAX_RELATIVE_TO_LENGTH}
                </Typography>
            </Grid>
        </Grid>
    );
};

export default EntityConfig;