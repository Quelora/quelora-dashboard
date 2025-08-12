// ./src/components/Client/CodeModal.jsx
import { useTranslation } from 'react-i18next';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
} from '@mui/material';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';

const CodeModal = ({ open, currentClientCode, setOpen, showToast }) => {
  const { t } = useTranslation();

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentClientCode);
    showToast(t('client.copy_success'));
  };

  const handleDownloadCode = () => {
    const blob = new Blob([currentClientCode], { type: 'text/javascript' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const match = currentClientCode.match(/cid: "([^"]+)"/);
    link.download = `quelora-config-${match ? match[1] : 'unknown'}.js`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(t('client.download_success'));
  };

  return (
    <Dialog
      open={open}
      onClose={() => setOpen(false)}
      maxWidth={false}
      PaperProps={{ className: 'client-dialog client-code-dialog' }}
    >
      <DialogTitle className="client-dialog-title">
        {t('client.code_modal_title')}
      </DialogTitle>
      <DialogContent>
        <SyntaxHighlighter language="javascript" className="client-code-block">
          {currentClientCode}
        </SyntaxHighlighter>
        <Box className="client-code-actions">
          <Button
            variant="outlined"
            startIcon={<CopyIcon />}
            onClick={handleCopyCode}
            className="client-copy-button"
          >
            {t('client.copy')}
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadCode}
            className="client-download-button"
          >
            {t('client.download')}
          </Button>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={() => setOpen(false)}
          className="client-close-button"
        >
          {t('client.close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CodeModal;