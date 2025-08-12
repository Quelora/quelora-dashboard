// ./src/components/Post/PostModal.jsx
import { Dialog, DialogTitle, DialogContent, IconButton } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import PostForm from './PostForm';

const PostModal = ({ 
  open, 
  onClose, 
  initialData = {}, 
  mode = 'create',
  onSave,
  title // Nueva prop para título personalizado
}) => {
  const { t } = useTranslation();
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth={false}
      inert={open ? undefined : ''}
      scroll="body"
      PaperProps={{ className: 'client-dialog client-code-dialog' }}
    >
      <DialogTitle>
        {title || (mode === 'create' ? t('postForm.create_new') : t('postForm.edit_post'))}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        <PostForm 
          initialData={initialData}
          mode={mode}
          onSave={onSave}
          onCancel={onClose}
          isGeneralConfig={!!title}
        />
      </DialogContent>
    </Dialog>
  );
};

export default PostModal;