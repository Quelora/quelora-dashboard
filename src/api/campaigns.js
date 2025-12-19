// filepath: ./src/api/campaigns.js
import api from './axiosConfig';

const API_URL = '/client/campaigns';

export const getCampaigns = async (cid, params = {}) => {
    try {
        const response = await api.get(API_URL, {
            params: { cid, ...params }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching campaigns:', error);
        throw error.response?.data?.error || 'Error fetching campaigns';
    }
};

export const getCampaign = async (campaignId) => {
    try {
        const response = await api.get(`${API_URL}/${campaignId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching campaign:', error);
        throw error.response?.data?.error || 'Error fetching campaign details';
    }
};

export const upsertCampaign = async (campaignData) => {
    try {
        const response = await api.post(API_URL, campaignData);
        return response.data;
    } catch (error) {
        console.error('Error upserting campaign:', error);
        throw error.response?.data?.error || 'Error saving campaign';
    }
};

export const deleteCampaign = async (campaignId, cid) => {
    try {
        const response = await api.delete(`${API_URL}/${campaignId}`, {
            params: { cid }
        });
        return response.data;
    } catch (error) {
        console.error('Error deleting campaign:', error);
        throw error.response?.data?.error || 'Error deleting campaign';
    }
};