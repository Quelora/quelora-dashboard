// src/components/Post/AdvancedTab.jsx
import { 
  Box, 
  Typography, 
  TextField, 
  Grid, 
  FormControlLabel,
  Checkbox,
  Divider
} from '@mui/material';

const AdvancedTab = ({ formData, handleChange, validationErrors, isGeneralConfig, t }) => {
  return (
    <Box className="advanced-tab-content" sx={{ p: 3 }}>
      <Box className="moderation-section">
        <Typography variant="subtitle2" className="subsection-title" sx={{ mb: 2 }}>
          {t('postForm.moderation')}
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.config.moderation.enable_toxicity_filter}
                  onChange={handleChange}
                  name="config.moderation.enable_toxicity_filter"
                  className="checkbox"
                />
              }
              label={t('postForm.enableToxicityFilter')}
              className="form-control-label"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.config.moderation.enable_content_moderation}
                  onChange={(e) => {
                    handleChange(e);
                    if (!e.target.checked) {
                      handleChange({
                        target: {
                          name: 'config.moderation.moderation_prompt',
                          value: ''
                        }
                      });
                    }
                  }}
                  name="config.moderation.enable_content_moderation"
                  className="checkbox"
                />
              }
              label={t('postForm.enableContentModeration')}
              className="form-control-label"
            />
          </Grid>
        </Grid>
        
        {formData.config.moderation.enable_content_moderation && (
          <TextField
            fullWidth
            label={t('postForm.moderationPrompt')}
            helperText={t('postForm.moderationPromptHelper')}
            name="config.moderation.moderation_prompt"
            value={formData.config.moderation.moderation_prompt}
            onChange={handleChange}
            className="text-field"
            multiline
            rows={3}
            sx={{ mt: 2 }}
            error={validationErrors.moderation_prompt}
            helperText={validationErrors.moderation_prompt && t('postForm.moderationPromptRequired')}
          />
        )}
        
        <TextField
          fullWidth
          label={t('postForm.bannedWords')}
          helperText={t('postForm.bannedWordsHelper')}
          value={(formData.config.moderation.banned_words || []).join(', ')}
          onChange={(e) => {
            const banned_words = e.target.value.split(',').map(word => word.trim());
            handleChange({
              target: {
                name: 'config.moderation.banned_words',
                value: banned_words
              }
            });
          }}
          className="text-field"
          multiline
          rows={2}
          sx={{ mt: 2 }}
        />
      </Box>

      {!isGeneralConfig && (
        <>
          <Divider className="section-divider" sx={{ my: 3 }} />

          <Box className="publishing-section">
            <Typography variant="subtitle2" className="subsection-title" sx={{ mb: 2 }}>
              {t('postForm.publishing')}
            </Typography>
            
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.config.publish_schedule.immediate}
                  onChange={handleChange}
                  name="config.publish_schedule.immediate"
                  className="checkbox"
                />
              }
              label={t('postForm.publishImmediately')}
              className="form-control-label"
            />
            
            {!formData.config.publish_schedule.immediate && (
              <TextField
                fullWidth
                type="datetime-local"
                name="config.publish_schedule.scheduled_time"
                value={formData.config.publish_schedule.scheduled_time}
                onChange={handleChange}
                className="text-field"
                InputLabelProps={{ shrink: true }}
                sx={{ mt: 2 }}
              />
            )}
          </Box>
        </>
      )}
    </Box>
  );
};

export default AdvancedTab;