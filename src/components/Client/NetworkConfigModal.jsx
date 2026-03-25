// src/components/Client/NetworkConfigModal.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Tabs,
    Tab,
    Typography,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    MenuItem,
    Alert,
    InputAdornment,
    Stack,
    LinearProgress,
    Chip,
} from '@mui/material';
import {
    Delete as DeleteIcon,
    AddCircle as AddCircleIcon,
    Save as SaveIcon,
    Router as RouterIcon,
    Hub as HubIcon,
    DeviceHub as P2PIcon,
} from '@mui/icons-material';
import CustomTextField from '../Common/CustomTextField';
import EnterpriseGate from '../Common/EnterpriseGate';
import { useEnterprise } from '../../hooks/useEnterprise';

/**
 * Renders a single tab panel, hiding content when not active.
 *
 * @param {Object}          props
 * @param {React.ReactNode} props.children
 * @param {number}          props.value   - Currently active tab index.
 * @param {number}          props.index   - This panel's index.
 * @returns {JSX.Element}
 */
function TabPanel({ children, value, index }) {
    return (
        <div role="tabpanel" hidden={value !== index} style={{ minHeight: 380 }}>
            {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
        </div>
    );
}

/**
 * Standalone modal for editing the Network configuration (TURN, Nostr, P2P)
 * of a client.  Extracted from the ConfigDialog tab so it follows the same
 * modal-per-concern pattern as VapidConfigModal, EmailConfigModal, and
 * ResilienceConfigModal.
 *
 * The component is purely controlled: it reads its initial values from the
 * `config` prop on every open event and delegates persistence to the `onSave`
 * callback.  Local state is discarded on close without saving.
 *
 * @param {Object}   props
 * @param {boolean}  props.open        - Controls dialog visibility.
 * @param {Function} props.onClose     - Callback invoked when the dialog is dismissed.
 * @param {Object}   props.config      - Current client config slice from useClient state.
 * @param {Function} props.setConfig   - State setter to update the parent config slice.
 * @param {Object}   props.client      - The decrypted client object being edited.
 * @param {Function} props.onSave      - Async callback: ({ turn, nostr, p2p }) => Promise<void>.
 * @param {boolean}  props.loading     - True while a save operation is in flight.
 * @param {Function} props.showToast   - Transient notification callback.
 * @returns {JSX.Element}
 */
const NetworkConfigModal = ({ open, onClose, config, setConfig, client, onSave, loading, showToast }) => {
    const { t } = useTranslation();
    const { hasModule } = useEnterprise();
    const [activeTab,    setActiveTab]    = useState(0);
    const [newRelay,     setNewRelay]     = useState('');
    const [newTracker,   setNewTracker]   = useState('');
    const [newRtcServer, setNewRtcServer] = useState('');

    /** Reset local entry fields each time the modal opens. */
    useEffect(() => {
        if (open) {
            setActiveTab(0);
            setNewRelay('');
            setNewTracker('');
            setNewRtcServer('');
        }
    }, [open]);

    // ── Derived config slices ─────────────────────────────────────────────────

    const turnConfig  = config?.turn  || {};
    const nostrConfig = config?.nostr || { relays: [] };
    const p2pConfig   = config?.p2p   || { trackerUrls: [], rtcServers: [] };

    // ── Field change helpers ──────────────────────────────────────────────────

    /**
     * Updates a single field within a top-level config domain.
     *
     * @param {'turn'|'nostr'|'p2p'} domain
     * @param {string}               field
     * @param {*}                    value
     */
    const handleFieldChange = (domain, field, value) => {
        setConfig(prev => ({
            ...prev,
            [domain]: { ...prev[domain], [field]: value },
        }));
    };

    // ── List management helpers ───────────────────────────────────────────────

    /**
     * Appends a trimmed, non-duplicate value to a list field within a domain.
     *
     * @param {'nostr'|'p2p'} domain
     * @param {string}        field
     * @param {string}        newValue
     * @param {Function}      clearInput - Clears the corresponding input state.
     */
    const handleAddListItem = (domain, field, newValue, clearInput) => {
        const trimmed     = newValue?.trim();
        const currentList = config[domain]?.[field] || [];
        if (!trimmed || currentList.includes(trimmed)) return;
        setConfig(prev => ({
            ...prev,
            [domain]: { ...prev[domain], [field]: [...currentList, trimmed] },
        }));
        clearInput('');
    };

    /**
     * Removes the item at the given index from a list field within a domain.
     *
     * @param {'nostr'|'p2p'} domain
     * @param {string}        field
     * @param {number}        index
     */
    const handleRemoveListItem = (domain, field, index) => {
        const updated = [...(config[domain]?.[field] || [])];
        updated.splice(index, 1);
        setConfig(prev => ({
            ...prev,
            [domain]: { ...prev[domain], [field]: updated },
        }));
    };

    // ── Save ──────────────────────────────────────────────────────────────────

    /**
     * Invokes the parent onSave callback with the current network config slices.
     *
     * @async
     * @returns {Promise<void>}
     */
    const handleSave = async () => {
        if (!onSave) return;
        await onSave({
            turn:  config.turn  || {},
            nostr: config.nostr || {},
            p2p:   config.p2p   || {},
        });
    };

    // ── Reusable list renderer ────────────────────────────────────────────────

    /**
     * Renders an add-input + scrollable list for a list-type config field.
     *
     * @param {'nostr'|'p2p'} domain
     * @param {string}        field
     * @param {string}        placeholder
     * @param {string}        newValue
     * @param {Function}      setNewValue
     * @returns {JSX.Element}
     */
    const renderListField = (domain, field, placeholder, newValue, setNewValue) => {
        const items = config[domain]?.[field] || [];
        return (
            <Box>
                <CustomTextField
                    fullWidth
                    placeholder={placeholder}
                    value={newValue}
                    onChange={e => setNewValue(e.target.value)}
                    onKeyPress={e => {
                        if (e.key === 'Enter') {
                            handleAddListItem(domain, field, newValue, setNewValue);
                        }
                    }}
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton
                                    color="primary"
                                    onClick={() => handleAddListItem(domain, field, newValue, setNewValue)}
                                    disabled={!newValue?.trim()}
                                >
                                    <AddCircleIcon />
                                </IconButton>
                            </InputAdornment>
                        ),
                    }}
                />
                {items.length === 0 ? (
                    <Typography variant="caption" color="text.secondary" sx={{ pl: 1 }}>
                        {t('common.no_data_available')}
                    </Typography>
                ) : (
                    <List dense sx={{ maxHeight: 180, overflowY: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1, mt: 1 }}>
                        {items.map((item, i) => (
                            <ListItem key={i} divider>
                                <ListItemText
                                    primary={
                                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem', wordBreak: 'break-all' }}>
                                            {item}
                                        </Typography>
                                    }
                                />
                                <ListItemSecondaryAction>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleRemoveListItem(domain, field, i)}
                                    >
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </ListItemSecondaryAction>
                            </ListItem>
                        ))}
                    </List>
                )}
            </Box>
        );
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            disableEscapeKeyDown={loading}
        >
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <RouterIcon color="primary" />
                {t('client.network_config_title')} — {client?.description || client?.cid}
            </DialogTitle>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
                <Tabs
                    value={activeTab}
                    onChange={(_, v) => setActiveTab(v)}
                    variant="fullWidth"
                    indicatorColor="primary"
                    textColor="primary"
                >
                    <Tab
                        icon={<RouterIcon fontSize="small" />}
                        iconPosition="start"
                        label={t('client.turn_config_title')}
                    />
                    <Tab
                        icon={<HubIcon fontSize="small" />}
                        iconPosition="start"
                        label={t('client.nostr_config_title')}
                    />
                    <Tab
                        icon={<P2PIcon fontSize="small" />}
                        iconPosition="start"
                        label={t('client.p2p_config_title')}
                    />
                </Tabs>
            </Box>

            <DialogContent sx={{ px: 4 }}>
                <EnterpriseGate module="network">

                {/* ── TAB 0: TURN / WebRTC ─────────────────────────────── */}
                <TabPanel value={activeTab} index={0}>
                    <Alert severity="info" sx={{ mb: 3 }}>
                        {t('client.turn_instructions_help')}
                    </Alert>
                    <Stack spacing={2}>
                        <CustomTextField
                            label={t('client.turn_server')}
                            value={turnConfig.server || ''}
                            onChange={e => handleFieldChange('turn', 'server', e.target.value)}
                            placeholder="turn.quelora.org"
                            fullWidth
                        />
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <CustomTextField
                                label={t('client.turn_port')}
                                type="number"
                                value={turnConfig.port || ''}
                                onChange={e => handleFieldChange('turn', 'port', e.target.value)}
                                placeholder="3478"
                                inputProps={{ min: 1, max: 65535 }}
                                sx={{ flex: 1 }}
                            />
                            <CustomTextField
                                select
                                label={t('client.turn_protocol')}
                                value={turnConfig.protocol || 'udp'}
                                onChange={e => handleFieldChange('turn', 'protocol', e.target.value)}
                                sx={{ flex: 1 }}
                            >
                                <MenuItem value="udp">UDP</MenuItem>
                                <MenuItem value="tcp">TCP</MenuItem>
                                <MenuItem value="tls">TLS</MenuItem>
                            </CustomTextField>
                        </Box>
                        <CustomTextField
                            label={t('client.turn_static_auth_secret')}
                            value={turnConfig.staticAuthSecret || ''}
                            onChange={e => handleFieldChange('turn', 'staticAuthSecret', e.target.value)}
                            type="password"
                            fullWidth
                            helperText={t('client.turn_static_auth_secret_help')}
                        />
                    </Stack>
                </TabPanel>

                {/* ── TAB 1: Nostr ─────────────────────────────────────── */}
                <TabPanel value={activeTab} index={1}>
                    <Stack spacing={2}>
                        <CustomTextField
                            label={t('client.nostr_url')}
                            value={nostrConfig.url || ''}
                            onChange={e => handleFieldChange('nostr', 'url', e.target.value)}
                            fullWidth
                            placeholder="wss://nostr.quelora.org"
                        />
                        <CustomTextField
                            label={t('client.nostr_auth_secret')}
                            value={nostrConfig.authSecret || ''}
                            onChange={e => handleFieldChange('nostr', 'authSecret', e.target.value)}
                            type="password"
                            fullWidth
                        />
                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Typography variant="subtitle2">
                                    {t('client.nostr_relays')}
                                </Typography>
                                <Chip
                                    size="small"
                                    label={(nostrConfig.relays || []).length}
                                    color="primary"
                                    variant="outlined"
                                />
                            </Box>
                            {renderListField('nostr', 'relays', 'wss://relay.example.com', newRelay, setNewRelay)}
                        </Box>
                    </Stack>
                </TabPanel>

                {/* ── TAB 2: P2P ───────────────────────────────────────── */}
                <TabPanel value={activeTab} index={2}>
                    <Stack spacing={3}>
                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Typography variant="subtitle2">
                                    {t('client.p2p_tracker_urls')}
                                </Typography>
                                <Chip
                                    size="small"
                                    label={(p2pConfig.trackerUrls || []).length}
                                    color="primary"
                                    variant="outlined"
                                />
                            </Box>
                            {renderListField('p2p', 'trackerUrls', 'wss://tracker.example.com', newTracker, setNewTracker)}
                        </Box>

                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Typography variant="subtitle2">
                                    {t('client.p2p_rtc_servers')}
                                </Typography>
                                <Chip
                                    size="small"
                                    label={(p2pConfig.rtcServers || []).length}
                                    color="primary"
                                    variant="outlined"
                                />
                            </Box>
                            {renderListField('p2p', 'rtcServers', 'stun:stun.l.google.com:19302', newRtcServer, setNewRtcServer)}
                        </Box>
                    </Stack>
                </TabPanel>
                </EnterpriseGate>
            </DialogContent>

            {loading && <LinearProgress />}

            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose} disabled={loading}>
                    {t('common.cancel')}
                </Button>
                {hasModule('network') && (
                    <Button
                        onClick={handleSave}
                        variant="contained"
                        disabled={loading}
                        startIcon={<SaveIcon />}
                    >
                        {t('common.save')}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default NetworkConfigModal;