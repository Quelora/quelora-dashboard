// ./src/components/Client/ClientHeader.jsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import TextField from '@mui/material/TextField';
import CodeIcon from '@mui/icons-material/Code';
import ArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import CopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';

const ClientHeader = ({ anchorEl, setAnchorEl }) => {
  const { t } = useTranslation();
  const [tabValue, setTabValue] = useState(0);
  const cloneUrl = 'https://github.com/quelora.git/repo.git';
  const sshUrl = 'git@github.com/quelora.git';

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleCopyUrl = (url) => {
    navigator.clipboard.writeText(url);
    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.textContent = t('client.copy_success');
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 2000);
  };

  return (
    <Box className="client-header">
      <Typography variant="h4" className="title">{t('client.title')}</Typography>
      <Button
        variant="contained"
        startIcon={<CodeIcon />}
        endIcon={<ArrowDownIcon />}
        onClick={handleMenuOpen}
        className="client-code-button"
      >
        {t('client.code_button')}
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ className: 'client-menu' }}
      >
        <Box className="client-menu-content">
          <Typography variant="subtitle1">{t('client.clone_title')}</Typography>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            className="client-tabs"
          >
            <Tab label="HTTPS" />
            <Tab label="SSH" />
          </Tabs>
          {tabValue === 0 && (
            <Box className="client-url-container">
              <TextField
                value={cloneUrl}
                fullWidth
                size="small"
                InputProps={{ readOnly: true }}
                className="client-url-input"
              />
              <Button onClick={() => handleCopyUrl(cloneUrl)} className="client-copy-button">
                <CopyIcon />
              </Button>
            </Box>
          )}
          {tabValue === 1 && (
            <Box className="client-url-container">
              <TextField
                value={sshUrl}
                fullWidth
                size="small"
                InputProps={{ readOnly: true }}
                className="client-url-input"
              />
              <Button onClick={() => handleCopyUrl(sshUrl)} className="client-copy-button">
                <CopyIcon />
              </Button>
            </Box>
          )}
          <Button 
            fullWidth
            startIcon={<DownloadIcon />}
            className="client-download-zip"
          >
            {t('client.download_zip')}
          </Button>
        </Box>
      </Menu>
    </Box>
  );
};

export default ClientHeader;