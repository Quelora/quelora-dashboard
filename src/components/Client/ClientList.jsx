// src/components/Client/ClientList.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Button,
    Container,
    Grid,
    Typography,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import ClientCard from './ClientCard';

/**
 * Renders the paginated grid of registered client cards.
 *
 * Replaces the previous icon-only table with a card layout designed for
 * non-technical users.  Each card is handled by `ClientCard`, which owns
 * the visual representation and inline contextual help.
 *
 * This component is intentionally thin: it only handles the grid scaffold,
 * the empty-state message, and the "Add new client" button.
 *
 * @param {Object}   props
 * @param {Array}    props.clients                 - Decrypted client objects to display.
 * @param {Function} props.handleShowCode          - Opens the CodeModal for a client.
 * @param {Function} props.handleEditClient        - Opens the edit dialog for a client.
 * @param {Function} props.setOpenConfigDialog     - Controls add/edit dialog visibility.
 * @param {Function} props.resetConfig             - Resets the form to its default state.
 * @param {Function} props.showToast               - Displays a transient toast notification.
 * @param {Function} props.handleGeneralConfig     - Opens the post/comment config modal.
 * @param {Function} props.handleVapidConfig       - Opens the VAPID config modal.
 * @param {Function} props.handleEmailConfig       - Opens the email config modal.
 * @param {Function} props.handleDeleteClient      - Initiates the client deletion flow.
 * @param {Function} props.handleReputationConfig  - Opens the reputation config modal.
 * @param {Function} props.handleResilienceConfig  - Opens the resilience config modal.
 * @param {Function} props.handleNetworkConfig     - Opens the network config modal.
 * @returns {JSX.Element}
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
    handleResilienceConfig,
    handleNetworkConfig,
}) => {
    const { t } = useTranslation();

    return (
        <Container maxWidth="lg" disableGutters>

            {/* ── Empty state ────────────────────────────────────────────── */}
            {clients.length === 0 && (
                <Box
                    sx={{
                        display:        'flex',
                        flexDirection:  'column',
                        alignItems:     'center',
                        justifyContent: 'center',
                        py:             10,
                        gap:            2,
                    }}
                >
                    <Typography variant="h6" color="text.secondary">
                        {t('client.no_clients_yet')}
                    </Typography>
                    <Typography variant="body2" color="text.disabled" sx={{ maxWidth: 360, textAlign: 'center' }}>
                        {t('client.no_clients_yet_help')}
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => {
                            resetConfig();
                            setOpenConfigDialog(true);
                        }}
                        sx={{ mt: 1 }}
                    >
                        {t('client.add_new_cid')}
                    </Button>
                </Box>
            )}

            {/* ── Card grid ──────────────────────────────────────────────── */}
            {clients.length > 0 && (
                <>
                    <Grid container spacing={3}>
                        {clients.map((client) => (
                            <Grid
                                key={client.cid}
                                item
                                xs={12}
                                sm={6}
                                lg={4}
                            >
                                <ClientCard
                                    client={client}
                                    handleShowCode={handleShowCode}
                                    handleEditClient={handleEditClient}
                                    handleGeneralConfig={handleGeneralConfig}
                                    handleVapidConfig={handleVapidConfig}
                                    handleEmailConfig={handleEmailConfig}
                                    handleDeleteClient={handleDeleteClient}
                                    handleReputationConfig={handleReputationConfig}
                                    handleResilienceConfig={handleResilienceConfig}
                                    handleNetworkConfig={handleNetworkConfig}
                                    showToast={showToast}
                                />
                            </Grid>
                        ))}
                    </Grid>

                    {/* ── Add new client button ─────────────────────────── */}
                    <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-start' }}>
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
                </>
            )}
        </Container>
    );
};

export default ClientList;