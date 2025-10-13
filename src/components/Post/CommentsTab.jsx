// src/components/Post/CommentsTab.jsx
import { 
  Box, 
  Typography, 
  TextField, 
  Grid, 
  Chip, 
  Divider,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import {
  ThumbUp as ThumbUpIcon,
  Comment as CommentIcon,
  Share as ShareIcon,
  Bookmark as BookmarkIcon,
  AccessTime as AccessTimeIcon,
  FormatQuote as FormatQuoteIcon 
} from '@mui/icons-material';

const CommentsTab = ({ formData, handleChange, handleNumberChange, validationErrors, t }) => {
  return (
    <Box className="comments-tab-content" sx={{ p: 3 }}>
      <Box className="interaction-section">
        <Typography variant="subtitle2" className="subsection-title" sx={{ mb: 2 }}>
          {t('postForm.interaction')}
        </Typography>
        
        <Grid container spacing={1} className="interaction-grid">
          <Grid item xs={6} className="interaction-grid-item">
            <Chip 
              icon={<ThumbUpIcon />}
              label={t('postForm.allowLikes')}
              color={formData.config.interaction.allow_likes ? 'primary' : 'default'}
              onClick={() => handleChange({
                target: {
                  name: 'config.interaction.allow_likes',
                  type: 'checkbox',
                  checked: !formData.config.interaction.allow_likes
                }
              })}
              variant={formData.config.interaction.allow_likes ? 'filled' : 'outlined'}
              className="interaction-chip"
            />
          </Grid>
          <Grid item xs={6} className="interaction-grid-item">
            <Chip 
              icon={<CommentIcon />}
              label={t('postForm.allowComments')}
              color={formData.config.interaction.allow_comments ? 'primary' : 'default'}
              onClick={() => handleChange({
                target: {
                  name: 'config.interaction.allow_comments',
                  type: 'checkbox',
                  checked: !formData.config.interaction.allow_comments
                }
              })}
              variant={formData.config.interaction.allow_comments ? 'filled' : 'outlined'}
              className="interaction-chip"
            />
          </Grid>
          {formData.config.interaction.allow_comments && (
            <Grid item xs={6} className="interaction-grid-item">
              <Chip 
                icon={<CommentIcon />}
                label={t('postForm.allowReplies')}
                color={formData.config.interaction.allow_replies ? 'primary' : 'default'}
                onClick={() => handleChange({
                  target: {
                    name: 'config.interaction.allow_replies',
                    type: 'checkbox',
                    checked: !formData.config.interaction.allow_replies
                  }
                })}
                variant={formData.config.interaction.allow_replies ? 'filled' : 'outlined'}
                className="interaction-chip"
              />
            </Grid>
          )}
          {formData.config.interaction.allow_comments && (
            <Grid item xs={6} className="interaction-grid-item">
              <Chip 
                icon={<FormatQuoteIcon />}
                label={t('postForm.allowQuotes')}
                color={formData.config.interaction.allow_quotes ? 'primary' : 'default'}
                onClick={() => handleChange({
                target: {
                  name: 'config.interaction.allow_quotes',
                  type: 'checkbox',
                  checked: !formData.config.interaction.allow_quotes
                  }
                })}
                variant={formData.config.interaction.allow_quotes ? 'filled' : 'outlined'}
                className="interaction-chip"
              />
              </Grid>
          )}
          <Grid item xs={6} className="interaction-grid-item">
            <Chip 
              icon={<ShareIcon />}
              label={t('postForm.allowShares')}
              color={formData.config.interaction.allow_shares ? 'primary' : 'default'}
              onClick={() => handleChange({
                target: {
                  name: 'config.interaction.allow_shares',
                  type: 'checkbox',
                  checked: !formData.config.interaction.allow_shares
                }
              })}
              variant={formData.config.interaction.allow_shares ? 'filled' : 'outlined'}
              className="interaction-chip"
            />
          </Grid>
          <Grid item xs={6} className="interaction-grid-item">
            <Chip 
              icon={<BookmarkIcon />}
              label={t('postForm.allowBookmarks')}
              color={formData.config.interaction.allow_bookmarks ? 'primary' : 'default'}
              onClick={() => handleChange({
                target: {
                  name: 'config.interaction.allow_bookmarks',
                  type: 'checkbox',
                  checked: !formData.config.interaction.allow_bookmarks
                }
              })}
              variant={formData.config.interaction.allow_bookmarks ? 'filled' : 'outlined'}
              className="interaction-chip"
            />
          </Grid>
        </Grid>
      </Box>

      <Divider className="section-divider" sx={{ my: 3 }} />

      <Box className="limits-section">
        <Typography variant="subtitle2" className="subsection-title" sx={{ mb: 2 }}>
          {t('postForm.limits')}
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6} style={{ width: '300px'}}>
            <TextField
              fullWidth
              label={t('postForm.commentTextLimit')}
              name="config.limits.comment_text"
              type="number"
              value={formData.config.limits.comment_text}
              onChange={handleNumberChange}
              className="text-field"
              InputProps={{
                inputProps: { min: 50, max: 1000 }
              }}
              error={validationErrors.comment_text}
              helperText={validationErrors.comment_text && t('postForm.invalidCommentTextLimit')}
            />
          </Grid>
          <Grid item xs={12} md={6} style={{ width: '300px'}}>
            <TextField
              fullWidth
              label={t('postForm.replyTextLimit')}
              name="config.limits.reply_text"
              type="number"
              value={formData.config.limits.reply_text}
              onChange={handleNumberChange}
              className="text-field"
              InputProps={{
                inputProps: { min: 50, max: 1000 }
              }}
              error={validationErrors.reply_text}
              helperText={validationErrors.reply_text && t('postForm.invalidReplyTextLimit')}
            />
          </Grid>
        </Grid>
      </Box>

      <Divider className="section-divider" sx={{ my: 3 }} />

      <Box className="editing-section">
        <Typography variant="subtitle2" className="subsection-title" sx={{ mb: 2 }}>
          {t('postForm.editing')}
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.config.editing.allow_edits}
                  onChange={handleChange}
                  name="config.editing.allow_edits"
                  className="checkbox"
                />
              }
              label={t('postForm.allowEdits')}
              className="form-control-label"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.config.editing.allow_delete}
                  onChange={handleChange}
                  name="config.editing.allow_delete"
                  className="checkbox"
                />
              }
              label={t('postForm.allowDelete')}
              className="form-control-label"
            />
          </Grid>
        </Grid>
        
        {formData.config.editing.allow_edits && (
          <TextField
            fullWidth
            label={t('postForm.editTimeLimit')}
            name="config.editing.edit_time_limit"
            type="number"
            value={formData.config.editing.edit_time_limit}
            onChange={handleNumberChange}
            className="text-field"
            sx={{ mt: 2 }}
            InputProps={{
              endAdornment: (
                <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                  <AccessTimeIcon fontSize="small" />
                  <Typography variant="caption" sx={{ ml: 0.5 }}>
                    {t('postForm.minutes')}
                  </Typography>
                </Box>
              ),
              inputProps: { min: 1, max: 1440 }
            }}
            error={validationErrors.edit_time_limit}
            helperText={validationErrors.edit_time_limit && t('postForm.invalidEditTimeLimit')}
          />
        )}
      </Box>
    </Box>
  );
};

export default CommentsTab;