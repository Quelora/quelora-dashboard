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

const EntityConfig = ({ config, setConfig, isFormSubmitted }) => {
  const { t } = useTranslation();
  const MAX_SELECTOR_LENGTH = 100;
  const MAX_ATTRIBUTE_LENGTH = 100;
  const MAX_RELATIVE_TO_LENGTH = 100;

  // Valores por defecto
  const defaultEntityConfig = {
    selector: 'article',
    entityIdAttribute: 'href',
    interactionPlacement: {
      position: 'after',
      relativeTo: '.article-actions'
    }
  };

  // Priorizar valores existentes
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

  return (
    <Grid container direction="column" spacing={2}>
      <Grid item>
        <TextField
          label={t('client.entity_selector')}
          fullWidth
          variant="outlined"
          size="small"
          value={currentConfig.selector}
          onChange={(e) => handleEntityConfigChange('selector', e.target.value)}
          error={isFormSubmitted && (!currentConfig.selector || !isValidSelector(currentConfig.selector))}
          helperText={
            isFormSubmitted && 
            (!currentConfig.selector 
              ? t('client.entity_selector_required')
              : !isValidSelector(currentConfig.selector)
              ? t('client.entity_selector_invalid')
              : t('client.entity_selector_help'))
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
        <TextField
          label={t('client.entity_id_attribute')}
          fullWidth
          variant="outlined"
          size="small"
          value={currentConfig.entityIdAttribute}
          onChange={(e) => handleEntityConfigChange('entityIdAttribute', e.target.value)}
          error={isFormSubmitted && !currentConfig.entityIdAttribute}
          helperText={
            isFormSubmitted && !currentConfig.entityIdAttribute
              ? t('client.entity_id_attribute_required')
              : t('client.entity_id_attribute_help')
          }
          inputProps={{ maxLength: MAX_ATTRIBUTE_LENGTH }}
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
      <Grid item>
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
      <Grid item>
        <TextField
          label={t('client.interaction_relative_to')}
          fullWidth
          variant="outlined"
          size="small"
          value={currentConfig.interactionPlacement.relativeTo}
          onChange={(e) => handleEntityConfigChange('relativeTo', e.target.value)}
          error={isFormSubmitted && !currentConfig.interactionPlacement.relativeTo}
          helperText={
            isFormSubmitted && !currentConfig.interactionPlacement.relativeTo
              ? t('client.interaction_relative_to_required')
              : t('client.interaction_relative_to_help')
          }
          inputProps={{ maxLength: MAX_RELATIVE_TO_LENGTH }}
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