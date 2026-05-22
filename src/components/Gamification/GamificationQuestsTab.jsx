/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

import React, { useState } from 'react';
import {
    Box, Button, IconButton, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, styled, Dialog, DialogTitle, DialogContent, DialogActions,
    Switch, FormControl, InputLabel, Select, MenuItem, Chip, Typography
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon, Edit as EditIcon, Assignment as QuestIcon } from '@mui/icons-material';
import CustomTextField from '../Common/CustomTextField';

const StyledTableRow = styled(TableRow)(({ theme }) => ({
    borderBottom: '1px solid var(--border-gray)',
    '&:last-child': { borderBottom: 'none' },
    '&:nth-of-type(odd)': { backgroundColor: 'rgba(0, 0, 0, 0.02)' },
    '&:hover': { backgroundColor: theme.palette.action.hover },
    '[data-theme="dark"] &:nth-of-type(odd)': { backgroundColor: 'rgba(255, 255, 255, 0.05)' },
}));

const ACTION_TYPES = [
    'COMMENT_CREATED', 'POST_CREATED', 'REPLY_CREATED', 'MEDIA_UPLOADED',
    'LIKE_GIVEN', 'LIKE_RECEIVED', 'POST_SHARED', 'DAILY_LOGIN',
    'PROFILE_COMPLETED', 'VIDEO_WATCHED', 'SURVEY_VOTED'
];

const FREQUENCIES = ['DAILY', 'WEEKLY', 'ONETIME', 'INFINITE'];

const GamificationQuestsTab = ({ t, quests, onSave, onDelete }) => {
    const [openModal, setOpenModal] = useState(false);
    const [editingQuest, setEditingQuest] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        frequency: 'DAILY',
        active: true,
        actionType: 'COMMENT_CREATED',
        targetCount: 1,
        rewardXp: 0,
        rewardCoins: 0
    });

    const handleOpen = (quest = null) => {
        if (quest) {
            setEditingQuest(quest);
            setFormData({
                title: quest.title,
                description: quest.description || '',
                frequency: quest.frequency,
                active: quest.active,
                actionType: quest.criteria?.actionType || 'COMMENT_CREATED',
                targetCount: quest.criteria?.targetCount || 1,
                rewardXp: quest.rewards?.xp || 0,
                rewardCoins: quest.rewards?.coins || 0
            });
        } else {
            setEditingQuest(null);
            setFormData({
                title: '',
                description: '',
                frequency: 'DAILY',
                active: true,
                actionType: 'COMMENT_CREATED',
                targetCount: 1,
                rewardXp: 50,
                rewardCoins: 10
            });
        }
        setOpenModal(true);
    };

    const handleClose = () => {
        setOpenModal(false);
        setEditingQuest(null);
    };

    const handleSaveInternal = async () => {
        if (!formData.title || !formData.targetCount) return;

        const payload = {
            title: formData.title,
            description: formData.description,
            frequency: formData.frequency,
            active: formData.active,
            criteria: {
                actionType: formData.actionType,
                targetCount: parseInt(formData.targetCount)
            },
            rewards: {
                xp: parseInt(formData.rewardXp),
                coins: parseInt(formData.rewardCoins)
            }
        };

        if (editingQuest) {
            payload._id = editingQuest._id;
        }

        const success = await onSave(payload);
        if (success) handleClose();
    };

    // Helper para traducir acciones en la tabla
    const getActionLabel = (action) => t(`gamification.rules.actions.${action}`, action);

    return (
        <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
                    {t('gamification.quests.create_new', 'New Quest')}
                </Button>
            </Box>

            <TableContainer component={Paper} elevation={0}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>{t('gamification.quests.title', 'Title')}</TableCell>
                            <TableCell>{t('gamification.quests.frequency', 'Frequency')}</TableCell>
                            <TableCell>{t('gamification.quests.criteria', 'Criteria')}</TableCell>
                            <TableCell>{t('gamification.quests.rewards', 'Rewards')}</TableCell>
                            <TableCell>{t('gamification.quests.status', 'Status')}</TableCell>
                            <TableCell align="right">{t('common.actions')}</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {quests.map((quest) => (
                            <StyledTableRow key={quest._id}>
                                <TableCell>
                                    <Box>
                                        <Typography variant="body2" fontWeight="bold">{quest.title}</Typography>
                                        <Typography variant="caption" color="textSecondary">{quest.description}</Typography>
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Chip label={quest.frequency} size="small" variant="outlined" />
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2">
                                        {quest.criteria?.targetCount} x {getActionLabel(quest.criteria?.actionType)}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        {quest.rewards?.xp > 0 && <Chip label={`${quest.rewards.xp} XP`} size="small" color="secondary" variant="outlined" />}
                                        {quest.rewards?.coins > 0 && <Chip label={`${quest.rewards.coins} Coins`} size="small" color="warning" variant="outlined" />}
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Switch checked={quest.active} disabled size="small" color="success" />
                                </TableCell>
                                <TableCell align="right">
                                    <IconButton onClick={() => handleOpen(quest)} color="primary" size="small">
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton onClick={() => onDelete(quest._id)} color="error" size="small">
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </TableCell>
                            </StyledTableRow>
                        ))}
                        {quests.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                                    {t('common.no_data_available', 'No quests defined')}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={openModal} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editingQuest ? t('gamification.quests.edit_quest', 'Edit Quest') : t('gamification.quests.create_new', 'New Quest')}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <CustomTextField 
                            label={t('gamification.quests.title', 'Title')} 
                            value={formData.title} 
                            onChange={e => setFormData({...formData, title: e.target.value})}
                            fullWidth required
                        />
                        <CustomTextField 
                            label={t('gamification.quests.description', 'Description')} 
                            value={formData.description} 
                            onChange={e => setFormData({...formData, description: e.target.value})}
                            fullWidth multiline rows={2}
                        />

                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <FormControl fullWidth>
                                <InputLabel>{t('gamification.quests.frequency', 'Frequency')}</InputLabel>
                                <Select
                                    value={formData.frequency}
                                    label={t('gamification.quests.frequency', 'Frequency')}
                                    onChange={e => setFormData({...formData, frequency: e.target.value})}
                                >
                                    {FREQUENCIES.map(f => <MenuItem key={f} value={f}>{f}</MenuItem>)}
                                </Select>
                            </FormControl>
                            <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 100, justifyContent: 'center' }}>
                                <Typography variant="body2" sx={{ mr: 1 }}>{t('gamification.quests.active', 'Active')}</Typography>
                                <Switch 
                                    checked={formData.active} 
                                    onChange={e => setFormData({...formData, active: e.target.checked})} 
                                    color="success" 
                                />
                            </Box>
                        </Box>

                        <Box sx={{ p: 2, border: '1px solid var(--border-color)', borderRadius: 1 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1, color: 'primary.main' }}>
                                {t('gamification.quests.criteria', 'Criteria')}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <FormControl fullWidth>
                                    <InputLabel>{t('gamification.quests.action_type', 'Action Type')}</InputLabel>
                                    <Select
                                        value={formData.actionType}
                                        label={t('gamification.quests.action_type', 'Action Type')}
                                        onChange={e => setFormData({...formData, actionType: e.target.value})}
                                    >
                                        {ACTION_TYPES.map(a => (
                                            <MenuItem key={a} value={a}>
                                                {t(`gamification.rules.actions.${a}`, a)}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <CustomTextField 
                                    label={t('gamification.quests.target', 'Target Count')} 
                                    type="number" 
                                    value={formData.targetCount} 
                                    onChange={e => setFormData({...formData, targetCount: e.target.value})}
                                    sx={{ width: 150 }}
                                />
                            </Box>
                        </Box>

                        <Box sx={{ p: 2, border: '1px solid var(--border-color)', borderRadius: 1 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1, color: 'warning.main' }}>
                                {t('gamification.quests.rewards', 'Rewards')}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <CustomTextField 
                                    label="XP Reward" 
                                    type="number" 
                                    value={formData.rewardXp} 
                                    onChange={e => setFormData({...formData, rewardXp: e.target.value})}
                                    fullWidth
                                />
                                <CustomTextField 
                                    label="Coin Reward" 
                                    type="number" 
                                    value={formData.rewardCoins} 
                                    onChange={e => setFormData({...formData, rewardCoins: e.target.value})}
                                    fullWidth
                                />
                            </Box>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>{t('common.cancel')}</Button>
                    <Button onClick={handleSaveInternal} variant="contained" startIcon={<QuestIcon />}>
                        {t('common.save')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default GamificationQuestsTab;