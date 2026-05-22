/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

// ./src/components/Post/AudioTab.jsx
import { 
    Box, 
    Typography, 
    TextField, 
    FormControlLabel,
    Checkbox,
    Grid
} from '@mui/material';
import CustomTextField from '../Common/CustomTextField';
import React from 'react';

const AudioTab = ({ formData, handleChange, handleNumberChange, validationErrors, t }) => {
    return (
        <Box className="audio-tab-content" sx={{p: 3}}>
            <Box sx={{display: 'flex', flexDirection: 'column', gap: 1}}>
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
            <Box sx={{display: 'flex', gap: 2, mt: 3}}>
                <Grid container spacing={2}>
                    <Grid xs={12} md={6}>
                        <CustomTextField
                            fullWidth
                            label={t('postForm.maxRecordingSeconds')}
                            name="config.audio.max_recording_seconds"
                            type="number"
                            value={formData.config.audio.max_recording_seconds}
                            onChange={handleNumberChange}
                            InputProps={{
                                inputProps: {min: 1, max: 400},
                                endAdornment: (
                                    <Typography variant="caption" sx={{ml: 1}}>
                                        {t('postForm.seconds')}
                                    </Typography>
                                )
                            }}
                            error={!!validationErrors.max_recording_seconds}
                            helperText={validationErrors.max_recording_seconds && t('postForm.invalidRecordingSeconds')}
                        />
                    </Grid>
                    <Grid xs={12} md={6}>
                        <CustomTextField
                            fullWidth
                            label={t('postForm.bitrate')}
                            name="config.audio.bitrate"
                            type="number"
                            value={formData.config.audio.bitrate}
                            onChange={handleNumberChange}
                            InputProps={{
                                inputProps: {min: 16000, max: 64000, step: 1000},
                                endAdornment: (
                                    <Typography variant="caption" sx={{ml: 1}}>
                                        {t('postForm.bitrateunit')}
                                    </Typography>
                                )
                            }}
                            error={!!validationErrors.bitrate}
                            helperText={validationErrors.bitrate && t('postForm.invalidRecordingSeconds')}
                        />
                    </Grid>
                </Grid>
            </Box>
        </Box>
    );
};

export default AudioTab;