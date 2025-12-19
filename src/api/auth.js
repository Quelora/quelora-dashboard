import api from './axiosConfig';
import { getEncryptedClient, getDecryptedClient } from '../utils/crypto';

export const login = async (username, password) => {
    try {
        const response = await api.post('/auth/generate-token', {username, password});
        
        if (response.data.requires2FA) {
            return {
                requires2FA: true,
                tempToken: response.data.tempToken
            };
        }
        
        return {
            requires2FA: false,
            token: response.data.token,
            clients: response.data.clients || [],
            user: response.data.user || [],
            expiresIn: response.data.expiresIn || '2h',
            role: response.data.role
        };

    } catch (error) {
        if (error.response?.status === 429) {
            throw new Error("LOCKED_ACCOUNT");
        }
        if (error.response?.status === 401) {
            throw new Error("Invalid credentials");
        }
        throw new Error("Connection error");
    }
};

export const verifyTwoFactor = async (totpToken, tempToken) => {
    try {
        const response = await api.post('/auth/verify-2fa', 
            { totpToken },
            {
                headers: {
                    'Authorization': `Bearer ${tempToken}`
                }
            }
        );
        
        return {
            requires2FA: false,
            token: response.data.token,
            clients: response.data.clients || [],
            user: response.data.user || [],
            expiresIn: response.data.expiresIn || '2h',
            role: response.data.role
        };

    } catch (error) {
        if (error.response?.status === 400) {
            throw new Error("Código 2FA inválido");
        }
        if (error.response?.status === 401) {
            throw new Error("Código 2FA expirado. Por favor intente iniciar sesión de nuevo.");
        }
        throw new Error("Connection error");
    }
};

export const renewToken = async (expiredToken) => {
    try {
        const response = await api.post('/auth/renew-token', {expiredToken});
        sessionStorage.setItem('token', response.data.token);
        sessionStorage.setItem('tokenExpiration', Date.now() + 7200000);
        return response.data;
    } catch (error) {
        console.error('Token renewal failed:', error);
        throw error;
    }
};

export const checkTokenExpiration = async () => {
    const expiration = sessionStorage.getItem('tokenExpiration');
    if (!expiration) return;

    const timeLeft = parseInt(expiration) - Date.now();
    const token = sessionStorage.getItem('token');

    if (timeLeft < 600000 && timeLeft > 0) {
        try {
            await renewToken(token);
        } catch (error) {
            console.error('Failed to renew token:', error);
        }
    } else if (timeLeft <= 0) {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('tokenExpiration');
        sessionStorage.removeItem('clients');
        sessionStorage.removeItem('user');
        window.location.href = '/login';
    }
};

export const loadClientsFromSession = () => {
    try {
        const clientsDataRaw = sessionStorage.getItem('clients');
        if (!clientsDataRaw) {
            return [];
        }

        const clientsData = JSON.parse(clientsDataRaw);

        if (!Array.isArray(clientsData)) {
            return [];
        }

        const decryptedClients = clientsData
            .map((client) => {
                if (!client.cid || !client.description) {
                    console.warn('Invalid client data structure in session, skipping:', client);
                    return null;
                }
                try {
                    return getDecryptedClient(client);
                } catch (error) {
                    console.error(`Failed to decrypt configuration for client ${client.cid}.`, error);
                    return null;
                }
            })
            .filter((client) => client !== null);

        return decryptedClients;
    } catch (e) {
        console.error('Error processing clients from session:', e);
        return [];
    }
};

export const saveClientConfig = async (clientData, currentClients) => {
    const isNewClient = !clientData.cid;

    let dataToSend;
    if (isNewClient) {
        dataToSend = clientData;
    } else {
        dataToSend = getEncryptedClient(clientData);
    }

    const response = await api.post('/client/upsert', {
        cid: dataToSend.cid,
        description: dataToSend.description,
        apiUrl: dataToSend.apiUrl,
        siteUrl: dataToSend.siteUrl,
        config: dataToSend.config,
        vapid: dataToSend.vapid,
        postConfig: dataToSend.postConfig,
        email: dataToSend.email
    });

    const newClientRaw = response.data.client;
    const newClientDecrypted = getDecryptedClient(newClientRaw);
    
    let updatedClientList;
    if (isNewClient) {
        updatedClientList = [...currentClients, newClientDecrypted];
    } else {
        updatedClientList = currentClients.map(c => 
            c.cid === newClientDecrypted.cid ? newClientDecrypted : c
        );
    }
    
    const encryptedClients = updatedClientList.map(getEncryptedClient);
    sessionStorage.setItem('clients', JSON.stringify(encryptedClients));

    return { newClient: newClientDecrypted, updatedClientList };
};

export const deleteClient = async (cid) => {
    try {
        const response = await api.delete(`/client/delete/${cid}`);
        
        let currentClients = loadClientsFromSession();
        const updatedClients = currentClients.filter(c => c.cid !== cid);

        const encryptedClients = updatedClients.map(getEncryptedClient);
        sessionStorage.setItem('clients', JSON.stringify(encryptedClients));

        return response.data;
    } catch (error) {
        throw error.response?.data?.message || "Error deleting client";
    }
};