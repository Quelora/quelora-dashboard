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
    VerifiedUser as ReputationIcon,
    Security as ResilienceIcon
} from '@mui/icons-material';
import { compileIntegrationSnippet } from './CodeModal';

const StyledListItem = styled(ListItem)(({ theme }) => ({
    borderBottom: '1px solid var(--border-gray)',
    '&:last-child': { borderBottom: 'none' },
    '&:nth-of-type(odd)': { backgroundColor: 'rgba(0, 0, 0, 0.02)' },
    '&:hover': { backgroundColor: theme.palette.action.hover },
}));

/**
 * Renders the paginated list of registered clients together with per-row
 * action buttons for code export, editing, and modular configuration.
 *
 * @param {Object}   props
 * @param {Array}    props.clients                - Decrypted client objects to display.
 * @param {Function} props.handleShowCode         - Opens the CodeModal for a client.
 * @param {Function} props.handleEditClient       - Opens the edit dialog for a client.
 * @param {Function} props.setOpenConfigDialog    - Controls the add/edit dialog visibility.
 * @param {Function} props.resetConfig            - Resets the form to its default state.
 * @param {Function} props.showToast              - Displays a transient toast notification.
 * @param {Function} props.handleGeneralConfig    - Opens the post/comment config modal.
 * @param {Function} props.handleVapidConfig      - Opens the VAPID config modal.
 * @param {Function} props.handleEmailConfig      - Opens the email config modal.
 * @param {Function} props.handleDeleteClient     - Initiates the client deletion flow.
 * @param {Function} props.handleReputationConfig - Opens the reputation config modal.
 */
const ClientList = ({
    clients,
    handleShowCode,
    handleEditClient,
    setOpenConfigDialog,
    resetConfig,
    showToast,
    handleGeneralConfig,
    handleVapidConfig,
    handleEmailConfig,
    handleDeleteClient,
    handleReputationConfig,
    handleResilienceConfig
}) => {
    const { t } = useTranslation();

    /**
     * Compiles the integration snippet for the given client and triggers a browser
     * download as a `.js` file. Uses the same compiler as CodeModal to guarantee
     * that the downloaded file is always identical to what the modal displays.
     *
     * @param {Object} client - The decrypted client object to download.
     */
    const handleDownloadCode = (client) => {
        const code = compileIntegrationSnippet(client);
        const blob = new Blob([code], { type: 'text/javascript' });
        const url  = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href     = url;
        link.download = `quelora-config-${client.cid}.js`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        if (showToast) showToast(t('client.download_success'), 'success');
    };

    return (
        <Container maxWidth="lg">
            <Paper elevation={0} sx={{ width: '100%', p: 0 }}>
                <Box sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <VpnKeyIcon />
                        <Typography variant="h6" sx={{ ml: 1 }}>{t('client.manage_cids')}</Typography>
                    </Box>
                    <Typography variant="body2">{t('client.manage_cids_description')}</Typography>
                </Box>
                <List dense sx={{ width: '100%', p: 0 }}>
                    {clients.map((client) => (
                        <StyledListItem key={client.cid} disableGutters sx={{ pr: 2 }}>
                            <ListItemText
                                primary={<Typography variant="body2">{client.cid}</Typography>}
                                secondary={client.description || t('client.no_description')}
                                secondaryTypographyProps={{ variant: 'caption' }}
                                sx={{ pl: 2 }}
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
                                <Tooltip title={t('client.tooltip.reputation_config')}>
                                    <IconButton onClick={() => handleReputationConfig(client)}>
                                        <ReputationIcon />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title={t('client.tooltip.resilience_config')}>
                                    <IconButton onClick={() => handleResilienceConfig(client)}>
                                        <ResilienceIcon />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title={t('client.tooltip.delete_client')}>
                                    <IconButton onClick={() => handleDeleteClient(client)}>
                                        <DeleteIcon />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        </StyledListItem>
                    ))}
                </List>
                <Box sx={{ p: 2 }}>
                    <Button
                        variant="outlined"
                        startIcon={<AddIcon />}
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