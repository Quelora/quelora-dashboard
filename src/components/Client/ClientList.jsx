// src/components/Client/ClientList.jsx
import { useTranslation } from 'react-i18next';
import { 
  Grid, 
  Paper, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  IconButton, 
  Tooltip,
  Box,
  Button,
  Container
} from '@mui/material';
import { 
  VpnKey as VpnKeyIcon, 
  Code as CodeIcon, 
  Download as DownloadIcon, 
  Edit as EditIcon, 
  Add as AddIcon,
  RateReview as RateReviewIcon,
  Notifications as NotificationsIcon,
  Delete as DeleteIcon,
  Email as EmailIcon // Nuevo import
} from '@mui/icons-material';

const ClientList = ({ clients, handleShowCode, handleEditClient, setOpenConfigDialog, resetConfig, showToast, handleGeneralConfig, handleVapidConfig, handleEmailConfig, handleDeleteClient }) => {
  const { t } = useTranslation();

  const handleDownloadCode = (client) => {
    const configObj = {
      cid: client.cid,
      login: {
        baseUrl: client.config.login.baseUrl,
        providers: client.config.login.providers,
        providerDetails: Object.keys(client.config.login.providerDetails).reduce((acc, provider) => {
          if (client.config.login.providers.includes(provider)) {
            acc[provider] = {
              clientId: client.config.login.providerDetails[provider].clientId,
              ...(provider === 'Quelora' ? { enabled: client.config.login.providerDetails[provider].enabled } : {})
            };
          }
          return acc;
        }, {}),
      },
      geolocation: client.config.geolocation,
      audio: client.postConfig.audio ? {
        enable_mic_transcription: client.postConfig.audio.enable_mic_transcription,
        save_comment_audio: client.postConfig.audio.save_comment_audio,
        max_recording_seconds: client.postConfig.audio.max_recording_seconds,
        bitrate: client.postConfig.audio.bitrate
      } : {},
      vapid: {
        publicKey: client.vapid.publicKey,
        iconBase64: client.vapid.iconBase64,
      },
      email: { // Nueva configuración
        smtp_host: client.email.smtp_host,
        smtp_port: client.email.smtp_port,
        smtp_user: client.email.smtp_user
      }
    };

    const code = `<script> window.QUELORA_CONFIG = ${JSON.stringify(configObj, null, 2)}; </script>`;
    const blob = new Blob([code], { type: 'text/javascript' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const match = code.match(/cid: "([^"]+)"/);
    link.download = `quelora-config-${match ? match[1] : 'unknown'}.js`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(t('client.download_success'));
  };

  return (
    <Container maxWidth="lg">
      <Paper className="client-paper" sx={{ width: '100%' }}>
        <Box className="client-cid-header">
          <VpnKeyIcon />
          <Typography variant="h6">{t('client.manage_cids')}</Typography>
        </Box>
        <Typography variant="body2">{t('client.manage_cids_description')}</Typography>
        <List dense sx={{ width: '100%' }}>
          {clients.map((client) => (
            <ListItem 
              key={client.cid}
              className="client-list-item"
              sx={{ width: '100%' }}
            >
              <ListItemText
                primary={<Typography variant="body2">{client.cid}</Typography>}
                secondary={client.description || t('client.no_description')}
                secondaryTypographyProps={{ variant: 'caption' }}
              />
              <Box>
                <Tooltip title={t('client.tooltip.show_code')}>
                  <IconButton onClick={() => handleShowCode(client)}>
                    <CodeIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title={t('client.tooltip.download_code')}>
                  <IconButton onClick={() => handleDownloadCode(client)}>
                    <DownloadIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title={t('client.tooltip.edit_client')}>
                  <IconButton onClick={() => handleEditClient(client)}>
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title={t('client.tooltip.general_comment_config')}>
                  <IconButton onClick={() => handleGeneralConfig(client)}>
                    <RateReviewIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title={t('client.tooltip.vapid_config')}>
                  <IconButton onClick={() => handleVapidConfig(client)}>
                    <NotificationsIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title={t('client.tooltip.email_config')}>
                  <IconButton onClick={() => handleEmailConfig(client)}>
                    <EmailIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title={t('client.tooltip.delete_client')}>
                  <IconButton onClick={() => handleDeleteClient(client)}>
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </ListItem>
          ))}
        </List>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => {
            resetConfig();
            setOpenConfigDialog(true);
          }}
          className="client-add-button"
        >
          {t('client.add_new_cid')}
        </Button>
      </Paper>
    </Container>
  );
};

export default ClientList;