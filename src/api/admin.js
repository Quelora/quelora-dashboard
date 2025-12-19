// filepath: ./src/api/admin.js
import api from './axiosConfig';

export const searchClients = async (searchTerm) => {
    try {
        const response = await api.get('/admin/search', {
            params: { q: searchTerm }
        });
        return response.data; 
    } catch (error) {
        console.error('Error searching clients:', error);
        throw error;
    }
};


export const setActiveClient = async (cid) => {
    try {
        const response = await api.post('/admin/set', { cid });
        return response.data;
    } catch (error) {
        console.error('Error setting active client:', error);
        throw error;
    }
};