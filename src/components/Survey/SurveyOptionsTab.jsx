// filepath: ./src/components/Survey/SurveyOptionsTab.jsx
import React from 'react';
import { Box, IconButton, Button, Typography, Alert } from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import CustomTextField from '../Common/CustomTextField';

const SurveyOptionsTab = ({ formData, handleOptionsChange, addOption, removeOption, validationErrors, t }) => {
    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                {t('survey.options')}
            </Typography>
            {validationErrors.options && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {validationErrors.options}
                </Alert>
            )}

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {formData.options.map((option, index) => (
                    <Box key={option._id || index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CustomTextField
                            label={`${t('survey.option')} ${index + 1}`}
                            value={option.text}
                            onChange={(e) => handleOptionsChange(index, 'text', e.target.value)}
                            required
                            fullWidth
                        />
                        {/* (Fix 2) Campo para editar votos */}
                        <CustomTextField
                            label={t('survey.votes')}
                            type="number"
                            value={option.votesCount}
                            onChange={(e) => handleOptionsChange(index, 'votesCount', e.target.value)}
                            sx={{ width: 120 }}
                            InputProps={{ inputProps: { min: 0 } }}
                        />
                        <IconButton
                            onClick={() => removeOption(index)}
                            disabled={formData.options.length <= 2}
                            color="error"
                        >
                            <DeleteIcon/>
                        </IconButton>
                    </Box>
                ))}
            </Box>

            <Button
                startIcon={<AddIcon/>}
                onClick={addOption}
                sx={{ mt: 2 }}
                variant="outlined"
            >
                {t('survey.addOption')}
            </Button>
        </Box>
    );
};

export default SurveyOptionsTab;