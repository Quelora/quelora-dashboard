// src/components/Client/ClientList.jsx
import { useTranslation } from 'react-i18next';
import { 
    Paper, 
    Typography, 
    List, 
    ListItem, 
    ListItemText, 
    IconButton, 
    Tooltip,
    Box,
    Button,
    Container,
    styled 
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
    Email as EmailIcon,
    VerifiedUser as ReputationIcon // <--- NEW ICON
} from '@mui/icons-material';

const StyledListItem = styled(ListItem)(({ theme }) => ({
    borderBottom: '1px solid var(--border-gray)',
    '&:last-child': {
        borderBottom: 'none',
    },
    '&:nth-of-type(odd)': {
        backgroundColor: 'rgba(0, 0, 0, 0.02)',
    },
    '&:hover': {
        backgroundColor: theme.palette.action.hover,
    },
}));

// Added handleReputationConfig to props
const ClientList = ({ clients, handleShowCode, handleEditClient, setOpenConfigDialog, resetConfig, showToast, handleGeneralConfig, handleVapidConfig, handleEmailConfig, handleDeleteClient, handleReputationConfig }) => {
    const { t } = useTranslation();

    const handleDownloadCode = (client) => {
        const configObj = {
            cid: client.cid,
            apiUrl: client.apiUrl,
            siteUrl: client.siteUrl, 
            login: {
                baseUrl: client.config.login?.baseUrl,
                providers: client.config.login?.providers,
                providerDetails: Object.keys(client.config.login?.providerDetails || {}).reduce((acc, provider) => {
                    if (client.config.login.providers?.includes(provider)) {
                        acc[provider] = {
                            clientId: client.config.login.providerDetails[provider].clientId,
                            ...(provider === 'Quelora' ? {enabled: client.config.login.providerDetails[provider].enabled} : {})
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
                publicKey: client.vapid?.publicKey,
                iconBase64: client.vapid?.iconBase64,
            },
            email: { 
                smtp_host: client.email?.smtp_host,
                smtp_port: client.email?.smtp_port,
                smtp_user: client.email?.smtp_user
            }
        };

        const code = `<script> window.QUELORA_CONFIG = ${JSON.stringify(configObj, null, 2)}; </script>`;
        const blob = new Blob([code], {type: 'text/javascript'});
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const match = code.match(/cid: "([^"]+)"/);
        link.download = `quelora-config-${match ? match[1] : 'unknown'}.js`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        if (showToast) {
            showToast(t('client.download_success'), 'success'); 
        }
    };

    return (
        <Container maxWidth="lg">
            <Paper elevation={0} sx={{width: '100%', p: 0}}>
                <Box sx={{p: 2}}>
                    <Box sx={{display: 'flex', alignItems: 'center', mb: 1}}>
                        <VpnKeyIcon/>
                        <Typography variant="h6" sx={{ml: 1}}>{t('client.manage_cids')}</Typography>
                    </Box>
                    <Typography variant="body2">{t('client.manage_cids_description')}</Typography>
                </Box>
                <List dense sx={{width: '100%', p: 0}}>
                    {clients.map((client) => (
                        <StyledListItem 
                            key={client.cid}
                            disableGutters
                            sx={{pr: 2}}
                        >
                            <ListItemText
                                primary={<Typography variant="body2">{client.cid}</Typography>}
                                secondary={client.description || t('client.no_description')}
                                secondaryTypographyProps={{variant: 'caption'}}
                                sx={{pl: 2}}
                            />
                            <Box>
                                <Tooltip title={t('client.tooltip.show_code')}>
                                    <IconButton onClick={() => handleShowCode(client)}>
                                        <CodeIcon/>
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title={t('client.tooltip.download_code')}>
                                    <IconButton onClick={() => handleDownloadCode(client)}>
                                        <DownloadIcon/>
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title={t('client.tooltip.edit_client')}>
                                    <IconButton onClick={() => handleEditClient(client)}>
                                        <EditIcon/>
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title={t('client.tooltip.general_comment_config')}>
                                    <IconButton onClick={() => handleGeneralConfig(client)}>
                                        <RateReviewIcon/>
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title={t('client.tooltip.vapid_config')}>
                                    <IconButton onClick={() => handleVapidConfig(client)}>
                                        <NotificationsIcon/>
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title={t('client.tooltip.email_config')}>
                                    <IconButton onClick={() => handleEmailConfig(client)}>
                                        <EmailIcon/>
                                    </IconButton>
                                </Tooltip>
                                
                                {/* --- NEW BUTTON START --- */}
                                <Tooltip title={t('client.tooltip.reputation_config')}>
                                    <IconButton onClick={() => handleReputationConfig(client)}>
                                        <ReputationIcon/>
                                    </IconButton>
                                </Tooltip>
                                {/* --- NEW BUTTON END --- */}

                                <Tooltip title={t('client.tooltip.delete_client')}>
                                    <IconButton onClick={() => handleDeleteClient(client)}>
                                        <DeleteIcon/>
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        </StyledListItem>
                    ))}
                </List>
                <Box sx={{p: 2}}>
                    <Button
                        variant="outlined"
                        startIcon={<AddIcon/>}
                        onClick={() => {
                            resetConfig();
                            setOpenConfigDialog(true);
                        }}
                    >
                        {t('client.add_new_cid')}
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
};

export default ClientList;