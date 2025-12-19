import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Swal from 'sweetalert2';
import {
    getGamificationConfig, updateGamificationConfig,
    getGamificationRules, updateGamificationRule,
    getGamificationLevels, upsertGamificationLevel, deleteGamificationLevel,
    getGamificationQuests, createGamificationQuest, updateGamificationQuest, deleteGamificationQuest,
    getGamificationShopItems, createGamificationShopItem, updateGamificationShopItem, deleteGamificationShopItem,
    getUserLedger, getEconomyStats, adjustUserBalance, assignUserLevel, sendTestNotification
} from '../api/gamification';

export const useGamification = (selectedCid) => {
    const { t } = useTranslation();
    
    const [config, setConfig] = useState({ enabled: false, currency: { name: '', symbol: '' } });
    const [rules, setRules] = useState([]);
    const [levels, setLevels] = useState([]);
    const [quests, setQuests] = useState([]);
    const [shopItems, setShopItems] = useState([]); // Nuevo estado
    const [economy, setEconomy] = useState(null);
    const [loading, setLoading] = useState(false);
    
    const fetchConfig = useCallback(async () => {
        if (!selectedCid) return;
        setLoading(true);
        try {
            const [confData, ecoData] = await Promise.all([
                getGamificationConfig(selectedCid),
                getEconomyStats(selectedCid)
            ]);
            if (confData) setConfig(confData);
            if (ecoData && ecoData.success) setEconomy(ecoData.stats);
        } catch (error) {
            console.error(error);
            Swal.fire(t('common.error'), t('common.errorLoadingData'), 'error');
        } finally {
            setLoading(false);
        }
    }, [selectedCid, t]);

    const fetchEconomy = useCallback(async (fromDate, toDate) => {
        if (!selectedCid) return;
        try {
            const ecoData = await getEconomyStats(selectedCid, fromDate, toDate);
            if (ecoData && ecoData.success) setEconomy(ecoData.stats);
        } catch (error) { console.error(error); }
    }, [selectedCid]);

    const fetchRules = useCallback(async () => {
        if (!selectedCid) return;
        setLoading(true);
        try {
            const data = await getGamificationRules(selectedCid);
            setRules(data);
        } catch (error) { console.error(error); } 
        finally { setLoading(false); }
    }, [selectedCid]);

    const fetchLevels = useCallback(async () => {
        if (!selectedCid) return;
        setLoading(true);
        try {
            const data = await getGamificationLevels(selectedCid);
            setLevels(data);
        } catch (error) { console.error(error); } 
        finally { setLoading(false); }
    }, [selectedCid]);

    const fetchQuests = useCallback(async () => {
        if (!selectedCid) return;
        setLoading(true);
        try {
            const data = await getGamificationQuests(selectedCid);
            setQuests(data);
        } catch (error) { console.error(error); } 
        finally { setLoading(false); }
    }, [selectedCid]);

    const fetchShopItems = useCallback(async () => {
        if (!selectedCid) return;
        setLoading(true);
        try {
            const data = await getGamificationShopItems(selectedCid);
            setShopItems(data);
        } catch (error) { console.error(error); } 
        finally { setLoading(false); }
    }, [selectedCid]);

    const saveConfig = async (newConfig) => {
        try {
            setLoading(true);
            const saved = await updateGamificationConfig(selectedCid, newConfig);
            setConfig(saved.config);
            Swal.fire(t('common.success'), t('gamification.config.save_success'), 'success');
        } catch (error) { Swal.fire(t('common.error'), error.message, 'error'); } 
        finally { setLoading(false); }
    };
    const saveRule = async (ruleData) => {
        try {
            await updateGamificationRule(selectedCid, ruleData);
            await fetchRules();
        } catch (error) {
            console.error(error);
            Swal.fire(t('common.error'), t('common.errorSaving'), 'error');
        }
    };
    const saveLevel = async (levelData) => {
        try {
            setLoading(true);
            await upsertGamificationLevel(selectedCid, levelData);
            await fetchLevels();
            return true;
        } catch (error) {
            Swal.fire(t('common.error'), error.message, 'error');
            return false;
        } finally { setLoading(false); }
    };
    const removeLevel = async (levelId) => {
        const result = await Swal.fire({
            title: t('common.are_you_sure'), text: t('gamification.levels.delete_confirm'), icon: 'warning',
            showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#3085d6', confirmButtonText: t('common.delete')
        });
        if (result.isConfirmed) {
            try {
                await deleteGamificationLevel(selectedCid, levelId);
                await fetchLevels();
                Swal.fire(t('common.deleted'), '', 'success');
            } catch (error) { Swal.fire(t('common.error'), error.message, 'error'); }
        }
    };
    const saveQuest = async (questData) => {
        try {
            setLoading(true);
            if (questData._id) await updateGamificationQuest(selectedCid, questData._id, questData);
            else await createGamificationQuest(selectedCid, questData);
            await fetchQuests();
            return true;
        } catch (error) { Swal.fire(t('common.error'), error.message, 'error'); return false; } 
        finally { setLoading(false); }
    };
    const removeQuest = async (questId) => {
        const result = await Swal.fire({
            title: t('common.are_you_sure'), text: t('gamification.quests.delete_confirm'), icon: 'warning',
            showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#3085d6', confirmButtonText: t('common.delete')
        });
        if (result.isConfirmed) {
            try {
                await deleteGamificationQuest(selectedCid, questId);
                await fetchQuests();
                Swal.fire(t('common.deleted'), '', 'success');
            } catch (error) { Swal.fire(t('common.error'), error.message, 'error'); }
        }
    };

    // --- NUEVO: Shop Actions ---
    const saveShopItem = async (itemData) => {
        try {
            setLoading(true);
            if (itemData._id) {
                await updateGamificationShopItem(selectedCid, itemData._id, itemData);
            } else {
                await createGamificationShopItem(selectedCid, itemData);
            }
            await fetchShopItems();
            return true;
        } catch (error) {
            Swal.fire(t('common.error'), error.message, 'error');
            return false;
        } finally { setLoading(false); }
    };

    const removeShopItem = async (itemId) => {
        const result = await Swal.fire({
            title: t('common.are_you_sure'),
            text: t('gamification.shop.delete_confirm', 'Delete this item?'),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: t('common.delete')
        });

        if (result.isConfirmed) {
            try {
                await deleteGamificationShopItem(selectedCid, itemId);
                await fetchShopItems();
                Swal.fire(t('common.deleted'), '', 'success');
            } catch (error) {
                Swal.fire(t('common.error'), error.message, 'error');
            }
        }
    };

    const fetchLedger = async (profileId, page, limit) => {
        if (!selectedCid) return { data: [], pagination: { total: 0 } };
        return await getUserLedger(selectedCid, profileId, page, limit);
    };
    const adjustBalance = async (profileId, amount, description) => {
        try {
            await adjustUserBalance(selectedCid, { profileId, amount, type: 'ADJUSTMENT', description });
            return true;
        } catch (error) { Swal.fire(t('common.error'), error.message, 'error'); return false; }
    };
    const manualLevelAssignment = async (profileId, levelId, reason) => {
        try {
            await assignUserLevel(selectedCid, { profileId, levelId, reason });
            return true;
        } catch (error) { Swal.fire(t('common.error'), error.message, 'error'); return false; }
    };
    const sendTestNotif = async (profileId, type, metadata) => { 
        try {
            await sendTestNotification(selectedCid, { profileId, type, metadata });
            Swal.fire(t('common.success'), t('gamification.users.dispatchedToQueues'), 'success');
            return true;
        } catch (error) { Swal.fire(t('common.error'), error.message, 'error'); return false; }
    };

    return {
        config, economy, rules, levels, quests, shopItems, 
        loading,
        fetchConfig, fetchEconomy, fetchRules, fetchLevels, fetchQuests, fetchShopItems,
        fetchLedger, saveConfig, saveRule, saveLevel, removeLevel, saveQuest, removeQuest,
        saveShopItem, removeShopItem, 
        adjustBalance, manualLevelAssignment, sendTestNotif
    };
};