import { 
  Box, 
  TextField, 
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Grid
} from '@mui/material';
import {
  Public as PublicIcon,
  Lock as LockIcon,
  Translate as TranslateIcon,
  Comment as CommentIcon
} from '@mui/icons-material';

const GeneralTab = ({ formData, handleChange, validationErrors, mode, t }) => {
  return (
    <Box className="general-tab-content" sx={{ p: 3 }}>
      {mode === 'create' && (
        <TextField
          fullWidth
          label={t('postForm.entityId')}
          name="entity"
          value={formData.entity || ''}
          onChange={handleChange}
          className="text-field"
          required
          error={validationErrors.entity}
          helperText={validationErrors.entity && t('postForm.requiredField')}
          sx={{ mb: 3 }}
        />
      )}

      <TextField
        fullWidth
        label={t('postForm.title')}
        name="title"
        value={formData.title || ''}
        onChange={handleChange}
        className="text-field"
        required
        error={validationErrors.title}
        helperText={
          validationErrors.title
            ? !formData.title
              ? t('postForm.requiredField')
              : formData.title.length < 10
                ? t('postForm.titleMinLength')
                : t('postForm.titleMaxLength')
            : `${formData.title?.length || 0}/150`
        }
        inputProps={{
          maxLength: 150
        }}
        sx={{ mb: 3 }}
      /> 

      <TextField
        fullWidth
        label={t('postForm.description')}
        name="description"
        value={formData.description}
        onChange={handleChange}
        className="text-field"
        required
        multiline
        rows={2}
        error={validationErrors.description}
        helperText={
          validationErrors.description
            ? formData.description.length === 0
              ? t('postForm.requiredField')
              : t('postForm.descriptionMaxLength')
            : `${formData.description.length}/${formData.config.limits.post_text}`
        }
        inputProps={{
          maxLength: formData.config.limits.post_text
        }}
        sx={{ mb: 3 }}
      />
      
      <TextField
        fullWidth
        label={t('postForm.link')}
        name="link"
        value={formData.link || ''}
        onChange={handleChange}
        className="text-field"
        error={validationErrors.link}
        helperText={
          validationErrors.link
            ? formData.link.length > 300
              ? t('postForm.linkMaxLength')
              : t('postForm.invalidLink')
            : `${formData.link?.length || 0}/300`
        }
        inputProps={{
          maxLength: 300
        }}
        sx={{ mb: 3 }}
      />
      
      <Box sx={{ display: 'flex' }}>
        <TextField
          style={{ width: '50%', margin:'10px' }}
          label={t('postForm.category')}
          name="config.category"
          value={formData.config.category}
          onChange={handleChange}
          className="text-field"
        />
        <FormControl style={{ width: '50%', margin:'10px' }} className="form-control">
          <InputLabel>{t('postForm.postLanguage')}</InputLabel>
          <Select
            name="config.language.post_language"
            value={formData.config.language.post_language}
            onChange={handleChange}
            label={t('postForm.postLanguage')}
            startAdornment={<TranslateIcon color="action" className="select-icon" />}
          >
            <MenuItem value="es" className="menu-item">Español</MenuItem>
            <MenuItem value="en" className="menu-item">English</MenuItem>
            <MenuItem value="fr" className="menu-item">Français</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <TextField
        fullWidth
        label={t('postForm.tags')}
        helperText={t('postForm.tagsHelper')}
        value={(formData.config.tags || []).join(', ')}
        onChange={(e) => {
          const tags = e.target.value.split(',').map(tag => tag.trim());
          handleChange({
            target: {
              name: 'config.tags',
              value: tags
            }
          });
        }}
        className="text-field"
        sx={{ mt: 2, mb: 2 }}
      />

      <Box sx={{ display: 'flex' }}>
        <FormControl style={{ width: '50%', margin:'10px' }} className="form-control">
          <InputLabel>{t('postForm.visibility')}</InputLabel>
          <Select
            name="config.visibility"
            value={formData.config.visibility}
            onChange={handleChange}
            label={t('postForm.visibility')}
            startAdornment={
              formData.config.visibility === 'public' ? 
                <PublicIcon color="action" className="select-icon" /> : 
                <LockIcon color="action" className="select-icon" />
            }
          >
            <MenuItem value="public" className="menu-item">
              <Box className="menu-item-content">
                {t('postForm.public')}
              </Box>
            </MenuItem>
            <MenuItem value="private" className="menu-item">
              <Box className="menu-item-content">
                {t('postForm.private')}
              </Box>
            </MenuItem>
          </Select>
        </FormControl>
        <FormControl style={{ width: '50%', margin:'10px' }} className="form-control">
          <InputLabel>{t('postForm.commentStatus')}</InputLabel>
          <Select
            name="config.comment_status"
            value={formData.config.comment_status || 'open'}
            onChange={handleChange}
            label={t('postForm.commentStatus')}
            startAdornment={<CommentIcon color="action" className="select-icon" />}
          >
            <MenuItem value="open" className="menu-item">
              <Box className="menu-item-content">
                {t('postForm.commentsOpen')}
              </Box>
            </MenuItem>
            <MenuItem value="closed" className="menu-item">
              <Box className="menu-item-content">
                {t('postForm.commentsClosed')}
              </Box>
            </MenuItem>
          </Select>
        </FormControl>
      </Box>

      <FormControlLabel
        control={
          <Checkbox
            checked={formData.config.language.auto_translate}
            onChange={handleChange}
            name="config.language.auto_translate"
            className="checkbox"
          />
        }
        label={t('postForm.autoTranslate')}
        className="form-control-label"
        sx={{ mt: 2 }}
      />
    </Box>
  );
};

export default GeneralTab;