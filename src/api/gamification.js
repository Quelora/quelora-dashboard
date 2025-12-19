import api from './axiosConfig';

const getHeaders = (cid) => cid ? { headers: { 'X-Client-Id': cid } } : {};

export const getGamificationConfig = async (cid) => {
    if (!cid) return null;
    const response = await api.get('/gamification/config', getHeaders(cid));
    return response.data;
};

export const updateGamificationConfig = async (cid, data) => {
    if (!cid) throw new Error("Client ID is required");
    const response = await api.put('/gamification/config', data, getHeaders(cid));
    return response.data;
};

export const getGamificationRules = async (cid) => {
    if (!cid) return [];
    const response = await api.get('/gamification/rules', getHeaders(cid));
    return response.data;
};

export const updateGamificationRule = async (cid, ruleData) => {
    if (!cid) throw new Error("Client ID is required");
    const response = await api.put('/gamification/rules', ruleData, getHeaders(cid));
    return response.data;
};

export const getGamificationLevels = async (cid) => {
    if (!cid) return [];
    const response = await api.get('/gamification/levels', getHeaders(cid));
    return response.data;
};

export const upsertGamificationLevel = async (cid, levelData) => {
    if (!cid) throw new Error("Client ID is required");
    const response = await api.post('/gamification/levels', levelData, getHeaders(cid));
    return response.data;
};

export const deleteGamificationLevel = async (cid, levelId) => {
    if (!cid) throw new Error("Client ID is required");
    const response = await api.delete(`/gamification/levels/${levelId}`, getHeaders(cid));
    return response.data;
};

export const getGamificationQuests = async (cid) => {
    if (!cid) return [];
    const response = await api.get('/gamification/quests', getHeaders(cid));
    return response.data;
};

export const createGamificationQuest = async (cid, questData) => {
    if (!cid) throw new Error("Client ID is required");
    const response = await api.post('/gamification/quests', questData, getHeaders(cid));
    return response.data;
};

export const updateGamificationQuest = async (cid, questId, questData) => {
    if (!cid) throw new Error("Client ID is required");
    const response = await api.put(`/gamification/quests/${questId}`, questData, getHeaders(cid));
    return response.data;
};

export const deleteGamificationQuest = async (cid, questId) => {
    if (!cid) throw new Error("Client ID is required");
    const response = await api.delete(`/gamification/quests/${questId}`, getHeaders(cid));
    return response.data;
};

export const getGamificationShopItems = async (cid) => {
    if (!cid) return [];
    const response = await api.get('/gamification/shop/items', getHeaders(cid));
    return response.data;
};

export const createGamificationShopItem = async (cid, itemData) => {
    if (!cid) throw new Error("Client ID is required");
    const response = await api.post('/gamification/shop/items', itemData, getHeaders(cid));
    return response.data;
};

export const updateGamificationShopItem = async (cid, itemId, itemData) => {
    if (!cid) throw new Error("Client ID is required");
    const response = await api.put(`/gamification/shop/items/${itemId}`, itemData, getHeaders(cid));
    return response.data;
};

export const deleteGamificationShopItem = async (cid, itemId) => {
    if (!cid) throw new Error("Client ID is required");
    const response = await api.delete(`/gamification/shop/items/${itemId}`, getHeaders(cid));
    return response.data;
};

export const getUserLedger = async (cid, author, page = 1, limit = 20) => {
    if (!cid) throw new Error("Client ID is required");
    if (!author) throw new Error("Author is required");
    
    const params = { page, limit };
    const response = await api.get(`/gamification/ledger/${author}`, { 
        params,
        ...getHeaders(cid) 
    });
    return response.data;
};

export const getEconomyStats = async (cid, from = null, to = null) => {
    if (!cid) return null;
    const params = {};
    if (from) params.from = from.toISOString();
    if (to) params.to = to.toISOString();

    const response = await api.get('/gamification/economy', { 
        params,
        ...getHeaders(cid) 
    });
    return response.data;
};

export const adjustUserBalance = async (cid, data) => {
    if (!cid) throw new Error("Client ID is required");
    const response = await api.post('/gamification/adjustment', data, getHeaders(cid));
    return response.data;
};

export const assignUserLevel = async (cid, data) => {
    if (!cid) throw new Error("Client ID is required");
    const response = await api.post('/gamification/level/assign', data, getHeaders(cid));
    return response.data;
};

export const getGamificationUserProfile = async (cid, author) => {
    if (!cid || !author) return null;
    try {
        const response = await api.get(`/gamification/status/${author}`, getHeaders(cid));
        return response.data; 
    } catch (error) {
        console.error("Error fetching gamification profile", error);
        return null;
    }
};

export const uploadGamificationMedia = async (cid, file) => {
    if (!cid) throw new Error("Client ID is required for upload");
    const formData = new FormData();
    formData.append('media', file);
    const response = await api.post('/gamification/upload/asset', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
            'X-Client-Id': cid 
        }
    });
    return response.data;
};

export const sendTestNotification = async (cid, data) => {
    if (!cid) throw new Error("Client ID is required");
    const response = await api.post('/gamification/test/notify', data, getHeaders(cid));
    return response.data;
};