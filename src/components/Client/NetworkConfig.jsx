// ./src/components/Client/NetworkConfig.jsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Typography,
    Box,
    Button,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    MenuItem,
    Tabs,
    Tab,
    Alert,
    InputAdornment,
    Stack
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import CustomTextField from '../Common/CustomTextField';

function TabPanel({ children, value, index }) {
    return (
        <div role="tabpanel" hidden={value !== index}>
            {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
        </div>
    );
}

const NetworkConfig = ({ config, setConfig }) => {
    const { t } = useTranslation();
    const [internalTab, setInternalTab] = useState(0);
    const [newRelay, setNewRelay] = useState('');
    const [newTracker, setNewTracker] = useState('');
    const [newRtcServer, setNewRtcServer] = useState('');

    const turnConfig = config.turn || {};
    const nostrConfig = config.nostr || { relays: [] };
    const p2pConfig = config.p2p || { trackerUrls: [], rtcServers: [] };

    const handleTurnChange = (field, value) => {
        setConfig(prev => ({ ...prev, turn: { ...prev.turn, [field]: value } }));
    };

    const handleNostrChange = (field, value) => {
        setConfig(prev => ({ ...prev, nostr: { ...prev.nostr, [field]: value } }));
    };

    const handleAddListItem = (domain, field, newValue, setter) => {
        if (newValue && newValue.trim() !== '') {
            const currentList = config[domain]?.[field] || [];
            if (!currentList.includes(newValue.trim())) {
                setConfig(prev => ({
                    ...prev,
                    [domain]: { ...prev[domain], [field]: [...currentList, newValue.trim()] }
                }));
            }
            setter('');
        }
    };

    const handleRemoveListItem = (domain, field, index) => {
        const currentList = [...(config[domain]?.[field] || [])];
        currentList.splice(index, 1);
        setConfig(prev => ({
            ...prev,
            [domain]: { ...prev[domain], [field]: currentList }
        }));
    };

    return (
        <Box sx={{ width: '100%' }}>
            <Tabs 
                value={internalTab} 
                onChange={(e, v) => setInternalTab(v)} 
                variant="fullWidth"
                indicatorColor="primary"
                textColor="primary"
            >
                <Tab label={t('client.turn_config_title')} />
                <Tab label={t('client.nostr_config_title')} />
                <Tab label={t('client.p2p_config_title')} />
            </Tabs>

            {/* TAB 0: TURN / WebRTC */}
            <TabPanel value={internalTab} index={0}>
                <Stack className="network-config-stack" spacing={1}>
                    <Alert severity="info" sx={{ mb: 2 }}>{t('client.turn_instructions_help') || 'Configuración de servidor TURN/STUN dedicado.'}</Alert>
                    
                    <CustomTextField
                        className="network-field-vertical"
                        label={t('client.turn_server')}
                        value={turnConfig.server || ''}
                        onChange={(e) => handleTurnChange('server', e.target.value)}
                        placeholder="turn.quelora.org"
                    />
                    <CustomTextField
                        className="network-field-vertical"
                        label={t('client.turn_port')}
                        type="number"
                        value={turnConfig.port || ''}
                        onChange={(e) => handleTurnChange('port', e.target.value)}
                        placeholder="3478"
                    />
                    <CustomTextField
                        select
                        className="network-field-vertical"
                        label={t('client.turn_protocol')}
                        value={turnConfig.protocol || 'udp'}
                        onChange={(e) => handleTurnChange('protocol', e.target.value)}
                    >
                        <MenuItem value="udp">UDP</MenuItem>
                        <MenuItem value="tcp">TCP</MenuItem>
                        <MenuItem value="tls">TLS</MenuItem>
                    </CustomTextField>
                    <CustomTextField
                        className="network-field-vertical"
                        label={t('client.turn_static_auth_secret')}
                        value={turnConfig.staticAuthSecret || ''}
                        onChange={(e) => handleTurnChange('staticAuthSecret', e.target.value)}
                        type="password"
                    />
                </Stack>
            </TabPanel>

            {/* TAB 1: Nostr */}
            <TabPanel value={internalTab} index={1}>
                <Stack className="network-config-stack" spacing={1}>
                    <CustomTextField
                        className="network-field-vertical"
                        label={t('client.nostr_url')}
                        value={nostrConfig.url || ''}
                        onChange={(e) => handleNostrChange('url', e.target.value)}
                    />
                    <CustomTextField
                        className="network-field-vertical"
                        label={t('client.nostr_auth_secret')}
                        value={nostrConfig.authSecret || ''}
                        onChange={(e) => handleNostrChange('authSecret', e.target.value)}
                        type="password"
                    />
                    <Typography variant="subtitle2" sx={{ mt: 2 }}>{t('client.nostr_relays')}</Typography>
                    <CustomTextField
                        className="network-field-vertical"
                        placeholder="wss://relay.example.com"
                        value={newRelay}
                        onChange={(e) => setNewRelay(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddListItem('nostr', 'relays', newRelay, setNewRelay)}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton color="primary" onClick={() => handleAddListItem('nostr', 'relays', newRelay, setNewRelay)}>
                                        <AddCircleIcon />
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                    />
                    <List dense className="network-list-scrollable">
                        {(nostrConfig.relays || []).map((relay, i) => (
                            <ListItem key={i} divider>
                                <ListItemText primary={relay} />
                                <ListItemSecondaryAction>
                                    <IconButton onClick={() => handleRemoveListItem('nostr', 'relays', i)}><DeleteIcon /></IconButton>
                                </ListItemSecondaryAction>
                            </ListItem>
                        ))}
                    </List>
                </Stack>
            </TabPanel>

            {/* TAB 2: P2P */}
            <TabPanel value={internalTab} index={2}>
                <Stack className="network-config-stack" spacing={2}>
                    <Box>
                        <Typography variant="subtitle2">{t('client.p2p_tracker_urls')}</Typography>
                        <CustomTextField
                            className="network-field-vertical"
                            placeholder="wss://tracker.example.com"
                            value={newTracker}
                            onChange={(e) => setNewTracker(e.target.value)}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton color="primary" onClick={() => handleAddListItem('p2p', 'trackerUrls', newTracker, setNewTracker)}>
                                            <AddCircleIcon />
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                        />
                        <List dense className="network-list-scrollable">
                            {(p2pConfig.trackerUrls || []).map((t, i) => (
                                <ListItem key={i} divider>
                                    <ListItemText primary={t} />
                                    <ListItemSecondaryAction>
                                        <IconButton onClick={() => handleRemoveListItem('p2p', 'trackerUrls', i)}><DeleteIcon /></IconButton>
                                    </ListItemSecondaryAction>
                                </ListItem>
                            ))}
                        </List>
                    </Box>

                    <Box>
                        <Typography variant="subtitle2">{t('client.p2p_rtc_servers')}</Typography>
                        <CustomTextField
                            className="network-field-vertical"
                            placeholder="stun:stun.l.google.com:19302"
                            value={newRtcServer}
                            onChange={(e) => setNewRtcServer(e.target.value)}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton color="primary" onClick={() => handleAddListItem('p2p', 'rtcServers', newRtcServer, setNewRtcServer)}>
                                            <AddCircleIcon />
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                        />
                        <List dense className="network-list-scrollable">
                            {(p2pConfig.rtcServers || []).map((s, i) => (
                                <ListItem key={i} divider>
                                    <ListItemText primary={s} />
                                    <ListItemSecondaryAction>
                                        <IconButton onClick={() => handleRemoveListItem('p2p', 'rtcServers', i)}><DeleteIcon /></IconButton>
                                    </ListItemSecondaryAction>
                                </ListItem>
                            ))}
                        </List>
                    </Box>
                </Stack>
            </TabPanel>
        </Box>
    );
};

export default NetworkConfig;