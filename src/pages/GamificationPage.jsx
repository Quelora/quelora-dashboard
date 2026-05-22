/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Box, Typography, Paper, Tabs, Tab, FormControl, InputLabel, Select, MenuItem, Alert
} from '@mui/material';
import {
    Tune as ConfigIcon, Gavel as RulesIcon, EmojiEvents as LevelsIcon, 
    People as UsersIcon, Assignment as QuestIcon, Store as StoreIcon
} from '@mui/icons-material';
import { loadClientsFromSession } from '../api/auth';
import { useGamification } from '../hooks/useGamification';

import GamificationConfigTab from '../components/Gamification/GamificationConfigTab';
import GamificationRulesTab from '../components/Gamification/GamificationRulesTab';
import GamificationLevelsTab from '../components/Gamification/GamificationLevelsTab';
import GamificationUsersTab from '../components/Gamification/GamificationUsersTab';
import GamificationQuestsTab from '../components/Gamification/GamificationQuestsTab';

import GamificationShopTab from '../components/Gamification/GamificationShopTab'; 
import EnterpriseGate from '../components/Common/EnterpriseGate';

const GamificationPage = () => {
    const { t } = useTranslation();
    const [tab, setTab] = useState(0);
    const [selectedCid, setSelectedCid] = useState('');
    const [clientList, setClientList] = useState([]);
 
    const {
        config, economy, rules, levels, quests, shopItems,
        loading,
        fetchConfig, fetchEconomy, fetchRules, fetchLevels, fetchQuests, fetchShopItems,
        fetchLedger, saveConfig, saveRule, saveLevel, removeLevel,
        saveQuest, removeQuest,
        saveShopItem, removeShopItem,
        adjustBalance, manualLevelAssignment, sendTestNotif
    } = useGamification(selectedCid);

    useEffect(() => {
        const clients = loadClientsFromSession();
        setClientList(clients || []);
        if (clients && clients.length > 0 && !selectedCid) {
            setSelectedCid(clients[0].cid);
        }
    }, []);

    useEffect(() => {
        if (!selectedCid) return;
        if (tab === 0) fetchConfig();
        if (tab === 1) fetchRules();
        if (tab === 2 || tab === 5) fetchLevels(); 
        if (tab === 3) fetchQuests();
        if (tab === 4) fetchShopItems();
    }, [tab, selectedCid, fetchConfig, fetchRules, fetchLevels, fetchQuests, fetchShopItems]); 

    const handleTabChange = (event, newValue) => {
        setTab(newValue);
    };

    return (
        <EnterpriseGate module="gamification" fullPage>
        <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ p: 2, background: 'var(--card-bg)', borderRadius: '12px', mb: 1 }}>
                <Typography variant="h4" className="title">
                    {t('gamification.title', 'Gamification & Economy')}
                </Typography>
            </Box>

            <Paper elevation={0} sx={{ background: 'var(--content-bg)', p: 0 }}>
                <Box sx={{ 
                    display: 'flex', flexWrap: 'wrap', gap: 2, p: 2, 
                    background: 'var(--surface-color)', borderRadius: '12px', alignItems: 'center' 
                }}>
                    <FormControl size="small" sx={{ minWidth: 250 }}>
                        <InputLabel>{t('clientPosts.selectClient', 'Select Client')}</InputLabel>
                        <Select
                            value={selectedCid}
                            label={t('clientPosts.selectClient', 'Select Client')}
                            onChange={(e) => setSelectedCid(e.target.value)}
                        >
                            {clientList.map((client) => (
                                <MenuItem key={client.cid} value={client.cid}>
                                    {client.description || client.cid} ({client.cid})
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>
            </Paper>

            {!selectedCid ? (
                <Alert severity="info" sx={{ mt: 2 }}>
                    {t('gamification.select_client_hint', 'Please select a client to configure Gamification.')}
                </Alert>
            ) : (
                <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                    <Tabs 
                        value={tab} onChange={handleTabChange} variant="fullWidth" 
                        indicatorColor="primary" textColor="primary"
                        sx={{ borderBottom: 1, borderColor: 'divider' }}
                    >
                        <Tab icon={<ConfigIcon />} label={t('gamification.config.tab_title', 'Dashboard')} />
                        <Tab icon={<RulesIcon />} label={t('gamification.rules.tab_title', 'Rules')} />
                        <Tab icon={<LevelsIcon />} label={t('gamification.levels.tab_title', 'Levels')} />
                        <Tab icon={<QuestIcon />} label={t('gamification.quests.tab_title', 'Quests')} />
                        <Tab icon={<StoreIcon />} label={t('gamification.shop.tab_title', 'Shop')} /> 
                        <Tab icon={<UsersIcon />} label={t('gamification.users.tab_title', 'Users')} />
                    </Tabs>

                    <Box sx={{ p: 0 }}>
                        {tab === 0 && (
                            <GamificationConfigTab 
                                t={t} config={config} economy={economy} onSave={saveConfig} 
                                loading={loading} cid={selectedCid} fetchEconomy={fetchEconomy}
                            />
                        )}
                        {tab === 1 && (
                            <GamificationRulesTab t={t} rules={rules} onUpdateRule={saveRule} cid={selectedCid} />
                        )}
                        {tab === 2 && (
                            <GamificationLevelsTab t={t} levels={levels} onSave={saveLevel} onDelete={removeLevel} cid={selectedCid} />
                        )}
                        {tab === 3 && (
                            <GamificationQuestsTab t={t} quests={quests} onSave={saveQuest} onDelete={removeQuest} />
                        )}
                        {tab === 4 && (
                            <GamificationShopTab 
                                t={t} shopItems={shopItems} onSave={saveShopItem} onDelete={removeShopItem} cid={selectedCid} 
                            />
                        )}
                        {tab === 5 && (
                            <GamificationUsersTab 
                                t={t} fetchLedger={fetchLedger} adjustBalance={adjustBalance} 
                                manualLevelAssignment={manualLevelAssignment} levels={levels} cid={selectedCid} sendTestNotif={sendTestNotif}
                            />
                        )}
                    </Box>
                </Paper>
            )}
        </Box>
        </EnterpriseGate>
    );
};

export default GamificationPage;