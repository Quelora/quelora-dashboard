// ./src/components/Client/CorsConfig.jsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Grid,
  FormControlLabel,
  Checkbox,
  TextField,
  Button,
  IconButton,
  Box,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

const CorsConfig = ({ config, setConfig, isFormSubmitted }) => {
  const { t } = useTranslation();
  const [newOrigin, setNewOrigin] = useState('');
  const [savedOrigins, setSavedOrigins] = useState([]);
  
  const handleCorsEnabledChange = (event) => {
      const isEnabled = event.target.checked;
      setConfig((prev) => ({
        ...prev,
        config: {
          ...prev.config,
          cors: {
            ...prev.config.cors,
            enabled: isEnabled,
            allowedOrigins: isEnabled ? savedOrigins : prev.config.cors.allowedOrigins,
          },
        },
      }));
      if (!isEnabled) {
        setSavedOrigins(config.config.cors.allowedOrigins); // Guarda orígenes al desactivar
      }
    };

  const handleAddOrigin = () => {
    if (newOrigin && isValidOrigin(newOrigin)) {
      setConfig((prev) => ({
        ...prev,
        config: {
          ...prev.config,
          cors: {
            ...prev.config.cors,
            allowedOrigins: [...prev.config.cors.allowedOrigins, newOrigin],
          },
        },
      }));
      setNewOrigin('');
    }
  };

  const handleOriginChange = (index, value) => {
    setConfig((prev) => {
      const updatedOrigins = [...prev.config.cors.allowedOrigins];
      updatedOrigins[index] = value;
      return {
        ...prev,
        config: {
          ...prev.config,
          cors: {
            ...prev.config.cors,
            allowedOrigins: updatedOrigins,
          },
        },
      };
    });
  };

  const handleRemoveOrigin = (index) => {
    setConfig((prev) => {
      const updatedOrigins = prev.config.cors.allowedOrigins.filter((_, i) => i !== index);
      return {
        ...prev,
        config: {
          ...prev.config,
          cors: {
            ...prev.config.cors,
            allowedOrigins: updatedOrigins,
          },
        },
      };
    });
  };

  const isValidOrigin = (origin) => {
    return /^(https?:\/\/)?([\w-]+\.)*[\w-]+\.[a-z]{2,}(\/.*)?$/.test(origin);
  };

  return (
    <Grid container direction="column" spacing={2}>
      <Grid item>
        <FormControlLabel
          control={<Checkbox checked={config.config.cors.enabled} onChange={handleCorsEnabledChange} />}
          label={t('client.cors_enabled')}
        />
      </Grid>
      {config.config.cors.enabled && (
        <>
          <Grid item>
            {config.config.cors.allowedOrigins.map((origin, index) => (
              <Box key={index} display="flex" alignItems="center" mb={1}>
                <TextField
                  label={`${t('client.cors_uri')} ${index + 1}`}
                  fullWidth
                  variant="outlined"
                  size="small"
                  value={origin}
                  onChange={(e) => handleOriginChange(index, e.target.value)}
                  error={isFormSubmitted && !isValidOrigin(origin)}
                  helperText={
                    isFormSubmitted && !isValidOrigin(origin)
                      ? t('client.cors_invalid_origin', { origin })
                      : ''
                  }
                />
                <IconButton
                  onClick={() => handleRemoveOrigin(index)}
                  disabled={config.config.cors.allowedOrigins.length === 1}
                  sx={{ ml: 1 }}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            ))}
          </Grid>
          <Grid item>
            <TextField
              label={t('client.cors_add_origin')}
              fullWidth
              variant="outlined"
              size="small"
              value={newOrigin}
              onChange={(e) => setNewOrigin(e.target.value)}
              error={isFormSubmitted && newOrigin && !isValidOrigin(newOrigin)}
              helperText={
                isFormSubmitted && newOrigin && !isValidOrigin(newOrigin)
                  ? t('client.cors_invalid_origin', { origin: newOrigin })
                  : ''
              }
              onKeyPress={(e) => {
                if (e.key === 'Enter' && newOrigin && isValidOrigin(newOrigin)) {
                  handleAddOrigin();
                }
              }}
            />
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              onClick={handleAddOrigin}
              disabled={!newOrigin || !isValidOrigin(newOrigin)}
              sx={{ mt: 2 }}  // 2 * 8px = 16px (si usas el spacing default de Material-UI)
            >
              {t('client.cors_add_uri')}
            </Button>
          </Grid>
        </>
      )}
    </Grid>
  );
};

export default CorsConfig;