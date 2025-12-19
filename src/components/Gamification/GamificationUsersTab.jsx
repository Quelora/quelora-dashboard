import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Avatar, TableCell, TableRow, styled, Chip, Autocomplete,
    TextField, Button, Card, CardContent, Dialog, DialogTitle, DialogContent,
    DialogActions, FormControl, InputLabel, Select, MenuItem, Stack, Divider,
    RadioGroup, FormControlLabel, Radio, FormHelperText
} from '@mui/material';
import { Edit as EditIcon, AccountBalanceWallet as WalletIcon, EmojiEvents as TrophyIcon, Send as SendIcon } from '@mui/icons-material';
import PaginatedTable from '../Common/PaginatedTable';
import CustomTextField from '../Common/CustomTextField';
import { getUsersByClient } from '../../api/users'; 
import { getGamificationUserProfile } from '../../api/gamification';

const StyledTableRow = styled(TableRow)(({ theme }) => ({
    borderBottom: '1px solid var(--border-gray)',
    '&:last-child': { borderBottom: 'none' },
}));

const GamificationUsersTab = ({ t, fetchLedger, adjustBalance, manualLevelAssignment, cid, levels, sendTestNotif }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    
    const [selectedProfile, setSelectedProfile] = useState(null);
    const [userStatus, setUserStatus] = useState(null);
    
    const [searchValue, setSearchValue] = useState('');
    const [profileOptions, setProfileOptions] = useState([]);
    const [pagination, setPagination] = useState({ page: 0, limit: 10, total: 0 });
    const [filters, setFilters] = useState({ sort: 'created_at', order: 'desc' });
    
    const [activeModalMode, setActiveModalMode] = useState(null); 
    const [adjustData, setAdjustData] = useState({ 
        amount: 0, 
        levelId: '', 
        description: '',
        notifType: 'CUSTOM_MESSAGE', 
        systemEventType: 'LEVEL_UP',
        notifTitle: '',
        notifMessage: ''
    });

    const LedgerHeaders = [
        { id: 'created_at', label: t('gamification.ledger.date'), numeric: false, sortable: true, minWidth: 150 },
        { id: 'user', label: t('gamification.ledger.user'), numeric: false, sortable: false, minWidth: 200 },
        { id: 'type', label: t('gamification.ledger.type'), numeric: false, sortable: true, minWidth: 120 },
        { id: 'source', label: t('gamification.ledger.source'), numeric: false, sortable: true, minWidth: 150 },
        { id: 'xp', label: t('gamification.ledger.xp'), numeric: true, sortable: false, minWidth: 80 },
        { id: 'coins', label: t('gamification.ledger.coins'), numeric: true, sortable: true, minWidth: 100 },
    ];

    const extractUsersFromResponse = (response) => {
        if (!response) return [];
        if (Array.isArray(response)) return response;
        if (response.data && Array.isArray(response.data.users)) return response.data.users;
        if (Array.isArray(response.users)) return response.users;
        if (Array.isArray(response.data)) return response.data;
        if (Array.isArray(response.docs)) return response.docs;
        return [];
    };

    useEffect(() => {
        if (!searchValue || searchValue.length < 2) {
            setProfileOptions([]);
            return;
        }
        
        if (!cid) return;

        const debounceSearch = setTimeout(async () => {
            try {
                const response = await getUsersByClient(cid, { 
                    search: searchValue,
                    page: 1,
                    limit: 20 
                });
                
                const results = extractUsersFromResponse(response);
                setProfileOptions(results);
            } catch (error) { 
                console.error("Error searching users", error); 
                setProfileOptions([]); 
            }
        }, 800);
        return () => clearTimeout(debounceSearch);
    }, [searchValue, cid]);

    const loadLedger = useCallback(async () => {
        if (!selectedProfile) {
            setData([]);
            return;
        }
        setLoading(true);
        try {
            const profileId = selectedProfile.author || selectedProfile._id;
            const response = await fetchLedger(profileId, pagination.page + 1, pagination.limit);
            setData(response.data || []);
            setPagination(prev => ({ ...prev, total: response.pagination?.total || 0 }));
        } catch (err) { console.error(err); } 
        finally { setLoading(false); }
    }, [fetchLedger, pagination.page, pagination.limit, selectedProfile]);

    useEffect(() => { loadLedger(); }, [loadLedger]);

    useEffect(() => {
        const loadStatus = async () => {
            if (selectedProfile && cid) {
                try {
                    const profileId = selectedProfile.author || selectedProfile._id;
                    const res = await getGamificationUserProfile(cid, profileId);
                    if (res && res.success) setUserStatus(res.status);
                } catch (e) { console.error("Error loading status", e); }
            } else {
                setUserStatus(null);
            }
        };
        loadStatus();
    }, [selectedProfile, cid]);

    const handleOpenModal = (mode) => {
        setActiveModalMode(mode);
        setAdjustData({ 
            amount: 0, 
            levelId: '', 
            description: '',
            notifType: 'CUSTOM_MESSAGE',
            systemEventType: 'LEVEL_UP',
            notifTitle: '',
            notifMessage: ''
        });
    };

    const handleCloseModal = () => {
        setActiveModalMode(null);
    };

    const handleSubmit = async () => {
        if (!selectedProfile) return;
        const profileId = selectedProfile.author || selectedProfile._id;
        let success = false;

        if (activeModalMode === 'balance' && adjustData.amount !== 0) {
            success = await adjustBalance(profileId, parseInt(adjustData.amount), adjustData.description);
        } else if (activeModalMode === 'level' && adjustData.levelId) {
            success = await manualLevelAssignment(profileId, adjustData.levelId, adjustData.description);
        } else if (activeModalMode === 'notification') {
            if (typeof sendTestNotif === 'function') {
                const type = adjustData.notifType === 'CUSTOM_MESSAGE' ? 'CUSTOM_MESSAGE' : adjustData.systemEventType;
                
                let metadata = {};
                if (adjustData.notifType === 'CUSTOM_MESSAGE') {
                    metadata = { 
                        title: adjustData.notifTitle, 
                        message: adjustData.notifMessage 
                    };
                } else {
                    const currentLevelName = userStatus?.level?.name || 'Level 1';
                    metadata = { 
                        levelName: currentLevelName, 
                        points: 100, 
                        days: 7,
                        badgeName: 'Test Badge'
                    };
                }

                await sendTestNotif(profileId, type, metadata);
                success = true; 
            }
        }

        if (success) {
            handleCloseModal();
            if (activeModalMode === 'balance' || activeModalMode === 'level') {
                loadLedger(); 
                const res = await getGamificationUserProfile(cid, profileId);
                if (res && res.success) setUserStatus(res.status);
            }
        }
    };

    const renderRow = (row) => {
        const userObj = row.profile_id || {};
        const userName = userObj.name || userObj.username || t('common.unknown');
        const userPic = userObj.picture || userObj.avatar;
        
        const isPositive = row.amount > 0;
        const isNegative = row.amount < 0;

        return (
            <StyledTableRow key={row._id} hover>
                <TableCell>{new Date(row.created_at).toLocaleString()}</TableCell>
                <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {userPic && <Avatar src={userPic} sx={{ width: 24, height: 24 }} />}
                        <Typography variant="body2">{userName}</Typography>
                    </Box>
                </TableCell>
                <TableCell><Chip label={row.type} size="small" variant="outlined" /></TableCell>
                <TableCell>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                        {row.source} {row.description ? `(${row.description})` : ''}
                    </Typography>
                </TableCell>
                <TableCell align="right">
                    {row.xpAmount > 0 ? (
                        <Typography fontWeight="bold" color="primary.main">
                            +{row.xpAmount} XP
                        </Typography>
                    ) : (
                        <Typography variant="body2" color="text.disabled">-</Typography>
                    )}
                </TableCell>
                <TableCell align="right">
                    <Typography 
                        fontWeight="bold" 
                        sx={{ color: isPositive ? 'success.main' : isNegative ? 'error.main' : 'text.primary' }}
                    >
                        {isPositive ? '+' : ''}{row.amount}
                    </Typography>
                </TableCell>
            </StyledTableRow>
        );
    };

    return (
        <Box sx={{ p: 2 }}>
            <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>{t('gamification.users.title')}</Typography>
                <Autocomplete
                    value={selectedProfile}
                    options={Array.isArray(profileOptions) ? profileOptions : []}
                    isOptionEqualToValue={(option, value) => option._id === value._id}
                    getOptionLabel={(option) => option.name || option.username || ''}
                    onInputChange={(event, value) => setSearchValue(value)}
                    onChange={(event, newValue) => {
                        setSelectedProfile(newValue);
                        setPagination(prev => ({ ...prev, page: 0 }));
                    }}
                    renderOption={(props, option) => (
                        <Box component="li" {...props} key={option._id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar src={option.picture || option.avatar} sx={{ width: 24, height: 24 }} />
                            <Box>
                                <Typography variant="body2">{option.name}</Typography>
                                <Typography variant="caption" color="textSecondary">
                                    {option.author ? option.author.substring(0, 10) + '...' : option._id}
                                </Typography>
                            </Box>
                        </Box>
                    )}
                    renderInput={(params) => <TextField {...params} label={t('gamification.users.search_placeholder')} variant="outlined" size="small" />}
                />
            </Box>

            {selectedProfile && (
                <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', md: 'row' }, 
                    gap: 2, 
                    mb: 3,
                    alignItems: 'flex-start' 
                }}>
                    <Box sx={{ 
                        width: { xs: '100%', md: '350px', lg: '400px' }, 
                        flexShrink: 0 
                    }}>
                        <Card variant="outlined">
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                                    <Avatar src={selectedProfile.picture || selectedProfile.avatar} sx={{ width: 64, height: 64 }} />
                                    <Box>
                                        <Typography variant="h6">{selectedProfile.name || selectedProfile.username}</Typography>
                                        <Typography variant="caption" color="textSecondary" display="block">
                                            {selectedProfile.author || selectedProfile._id}
                                        </Typography>
                                    </Box>
                                </Box>

                                <Box sx={{ display: 'flex', gap: 2, mb: 3, justifyContent: 'space-around', bgcolor: 'rgba(0,0,0,0.03)', p: 1, borderRadius: 1 }}>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="caption" color="textSecondary">Coins</Typography>
                                        <Typography variant="h6" color="primary" fontWeight="bold">
                                            {userStatus ? userStatus.walletBalance : '-'}
                                        </Typography>
                                    </Box>
                                    <Divider orientation="vertical" flexItem />
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="caption" color="textSecondary">Level (XP)</Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <TrophyIcon fontSize="small" color="warning" />
                                            <Typography variant="body1" fontWeight="bold">
                                                {userStatus?.level ? userStatus.level.name : 'None'}
                                            </Typography>
                                        </Box>
                                        <Typography variant="caption" color="textSecondary">
                                            {userStatus?.lifetimePoints} XP
                                        </Typography>
                                    </Box>
                                </Box>
                                
                                <Stack spacing={2}>
                                    <Button variant="outlined" startIcon={<EditIcon />} fullWidth onClick={() => handleOpenModal('level')}>
                                        {t('gamification.users.btn_edit_profile')}
                                    </Button>
                                    <Button variant="contained" startIcon={<WalletIcon />} fullWidth color="primary" onClick={() => handleOpenModal('balance')}>
                                        {t('gamification.users.btn_adjust_balance')}
                                    </Button>
                                    <Button variant="text" startIcon={<SendIcon />} fullWidth onClick={() => handleOpenModal('notification')} sx={{ color: 'text.secondary' }}>
                                        {t('gamification.users.testNotitication')}
                                    </Button>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Box>
                    
                    <Box sx={{ 
                        flexGrow: 1, 
                        minWidth: 0, 
                        width: '100%' 
                    }}>
                        <PaginatedTable
                            headers={LedgerHeaders}
                            data={data}
                            loading={loading}
                            pagination={pagination}
                            filters={filters}
                            handleSort={(field) => setFilters(prev => ({ sort: field, order: prev.sort === field && prev.order === 'desc' ? 'asc' : 'desc' }))}
                            fetchData={loadLedger}
                            handlePageChange={(e, p) => setPagination(prev => ({ ...prev, page: p }))}
                            handleLimitChange={(e) => setPagination(prev => ({ ...prev, limit: e.target.value }))}
                            renderRow={renderRow}
                        />
                    </Box>
                </Box>
            )}

            <Dialog open={!!activeModalMode} onClose={handleCloseModal} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {activeModalMode === 'balance' && t('gamification.users.dialog_balance_title')}
                    {activeModalMode === 'level' && t('gamification.users.dialog_level_title')}
                    {activeModalMode === 'notification' && t('gamification.users.notifications.dialog_title', 'Send Notification')}
                </DialogTitle>
                <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    
                    {activeModalMode === 'balance' && (
                        <>
                            <Typography variant="body2" color="textSecondary">{t('gamification.users.dialog_balance_help')}</Typography>
                            <CustomTextField 
                                label={t('gamification.users.amount_label')} 
                                type="number" 
                                value={adjustData.amount} 
                                onChange={(e) => setAdjustData({ ...adjustData, amount: e.target.value })} 
                                fullWidth autoFocus 
                            />
                            <CustomTextField 
                                label={t('gamification.users.reason_label')} 
                                value={adjustData.description} 
                                onChange={(e) => setAdjustData({ ...adjustData, description: e.target.value })} 
                                fullWidth 
                            />
                        </>
                    )}

                    {activeModalMode === 'level' && (
                        <>
                            <Typography variant="body2" color="textSecondary">{t('gamification.users.dialog_level_help')}</Typography>
                            <FormControl fullWidth>
                                <InputLabel>{t('gamification.users.select_level_label')}</InputLabel>
                                <Select value={adjustData.levelId} label={t('gamification.users.select_level_label')} onChange={(e) => setAdjustData({ ...adjustData, levelId: e.target.value })}>
                                    {levels.map((level) => (
                                        <MenuItem key={level._id} value={level._id}>{level.name} ({level.minPoints} XP)</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <CustomTextField 
                                label={t('gamification.users.reason_label')} 
                                value={adjustData.description} 
                                onChange={(e) => setAdjustData({ ...adjustData, description: e.target.value })} 
                                fullWidth 
                            />
                        </>
                    )}

                    {activeModalMode === 'notification' && (
                        <>
                            <FormControl component="fieldset">
                                <RadioGroup
                                    row
                                    value={adjustData.notifType}
                                    onChange={(e) => setAdjustData({ ...adjustData, notifType: e.target.value })}
                                >
                                    <FormControlLabel 
                                        value="CUSTOM_MESSAGE" 
                                        control={<Radio />} 
                                        label={t('gamification.users.notifications.type_custom', 'Custom Message')} 
                                    />
                                    <FormControlLabel 
                                        value="SYSTEM_EVENT" 
                                        control={<Radio />} 
                                        label={t('gamification.users.notifications.type_system', 'Simulate System Event')} 
                                    />
                                </RadioGroup>
                            </FormControl>

                            {adjustData.notifType === 'CUSTOM_MESSAGE' ? (
                                <>
                                    <CustomTextField 
                                        label={t('gamification.users.notifications.custom_title_label', 'Title')} 
                                        value={adjustData.notifTitle} 
                                        onChange={(e) => setAdjustData({ ...adjustData, notifTitle: e.target.value })} 
                                        fullWidth 
                                    />
                                    <CustomTextField 
                                        label={t('gamification.users.notifications.custom_body_label', 'Message Body')} 
                                        multiline 
                                        rows={3} 
                                        value={adjustData.notifMessage} 
                                        onChange={(e) => setAdjustData({ ...adjustData, notifMessage: e.target.value })} 
                                        fullWidth 
                                    />
                                </>
                            ) : (
                                <FormControl fullWidth>
                                    <InputLabel>{t('gamification.users.notifications.event_type_label', 'Event Type')}</InputLabel>
                                    <Select 
                                        value={adjustData.systemEventType} 
                                        label={t('gamification.users.notifications.event_type_label', 'Event Type')} 
                                        onChange={(e) => setAdjustData({ ...adjustData, systemEventType: e.target.value })}
                                    >
                                        <MenuItem value="LEVEL_UP">{t('gamification.users.notifications.event_levelup', 'Level Up')}</MenuItem>
                                        <MenuItem value="STREAK_BONUS">{t('gamification.users.notifications.event_streak', 'Streak Bonus')}</MenuItem>
                                        <MenuItem value="BADGE_EARNED">{t('gamification.users.notifications.event_badge', 'Badge Earned')}</MenuItem>
                                    </Select>
                                    <FormHelperText>
                                        {t('gamification.users.notifications.system_helper', { levelName: userStatus?.level?.name || 'N/A' })}
                                    </FormHelperText>
                                </FormControl>
                            )}
                        </>
                    )}

                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseModal}>{t('common.cancel')}</Button>
                    <Button variant="contained" onClick={handleSubmit}>
                        {activeModalMode === 'notification' 
                            ? t('gamification.users.notifications.send_action', 'Send') 
                            : t('gamification.users.execute_btn')
                        }
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default GamificationUsersTab;