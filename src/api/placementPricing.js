// filepath: ./src/api/placementPricing.js
import api from './axiosConfig';

const API_URL = '/client/placement-pricing';

// Función wrapper para usar con usePaginatedList
export const getPlacementPricing = async (cid, params = {}) => {
    try {
        // Si viene cid (del usePaginatedList), lo agregamos a los params
        const finalParams = cid ? { ...params, cid } : params;
        const response = await api.get(API_URL, { params: finalParams });
        return response.data;
    } catch (error) {
        throw error.response?.data?.error || 'Error fetching placement pricing';
    }
};

// Función normal para uso directo
export const getPlacementPricingDirect = async (params = {}) => {
    try {
        const response = await api.get(API_URL, { params });
        return response.data;
    } catch (error) {
        throw error.response?.data?.error || 'Error fetching placement pricing';
    }
};

export const upsertPlacementPricing = async (pricingData) => {
    try {
        const response = await api.post(API_URL, pricingData);
        return response.data;
    } catch (error) {
        throw error.response?.data?.error || 'Error saving placement pricing';
    }
};

export const deletePlacementPricing = async (id) => {
    try {
        const response = await api.delete(`${API_URL}/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data?.error || 'Error deleting placement pricing';
    }
};