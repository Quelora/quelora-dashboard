// src/components/Post/AudioTab.jsx
import { 
  Box, 
  Typography, 
  TextField, 
  FormControlLabel,
  Checkbox
} from '@mui/material';

const AudioTab = ({ formData, handleChange, handleNumberChange, validationErrors, t }) => {
  return (
    <Box className="audio-tab-content" sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={formData.config.audio.enable_mic_transcription}
              onChange={handleChange}
              name="config.audio.enable_mic_transcription"
              className="checkbox"
            />
          }
          label={t('postForm.enableMicTranscription')}
          className="form-control-label"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={formData.config.audio.save_comment_audio}
              onChange={handleChange}
              name="config.audio.save_comment_audio"
              className="checkbox"
            />
          }
          label={t('postForm.saveCommentAudio')}
          className="form-control-label"
        />
      </Box>
      <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
        <TextField
          sx={{ flex: 1, maxWidth: 400 }}
          label={t('postForm.maxRecordingSeconds')}
          name="config.audio.max_recording_seconds"
          type="number"
          value={formData.config.audio.max_recording_seconds}
          onChange={handleNumberChange}
          className="text-field"
          InputProps={{
            inputProps: { min: 1, max: 400 },
            endAdornment: (
              <Typography variant="caption" sx={{ ml: 1 }}>
                {t('postForm.seconds')}
              </Typography>
            )
          }}
          error={validationErrors.max_recording_seconds}
          helperText={validationErrors.max_recording_seconds && t('postForm.invalidRecordingSeconds')}
        />
        <TextField
          sx={{ flex: 1, maxWidth: 400 }}
          label={t('postForm.bitrate')}
          name="config.audio.bitrate"
          type="number"
          value={formData.config.audio.bitrate}
          onChange={handleNumberChange}
          className="text-field"
          InputProps={{
            inputProps: { min: 16000, max: 64000, step: 1000 },
            endAdornment: (
              <Typography variant="caption" sx={{ ml: 1 }}>
                {t('postForm.bitrateunit')}
              </Typography>
            )
          }}
          error={validationErrors.bitrate}
          helperText={validationErrors.bitrate && t('postForm.invalidRecordingSeconds')}
        />
      </Box>
    </Box>
  );
};

export default AudioTab;