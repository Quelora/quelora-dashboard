// src/context/UserContext.js
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { getProfile, updateProfile } from '../api/profile';
import { useTranslation } from 'react-i18next';

const UserContext = createContext(null);

export const useUser = () => useContext(UserContext);

/**
 * Reads the current user object from sessionStorage.
 *
 * @returns {Object|null} The parsed user object, or null if absent or unreadable.
 */
const loadUserFromSession = () => {
    try {
        const storedUser = sessionStorage.getItem('user');
        if (storedUser) return JSON.parse(storedUser);
    } catch (e) {
        console.error('Failed to parse user from session storage', e);
    }
    return null;
};

/**
 * Builds a map of { cid -> resilience } from the clients currently stored in
 * sessionStorage so that fields managed by other endpoints (resilience,
 * and any future plain-text additions) are never silently dropped when
 * getProfile overwrites the clients array.
 *
 * @returns {Map<string, Object|null>} Map keyed by cid.
 */
const buildResilienceMap = () => {
    const map = new Map();
    try {
        const raw = sessionStorage.getItem('clients');
        if (!raw) return map;
        const clients = JSON.parse(raw);
        if (Array.isArray(clients)) {
            clients.forEach(c => {
                if (c.cid) map.set(c.cid, c.resilience ?? null);
            });
        }
    } catch {
        // Session unreadable — return empty map, nothing to preserve.
    }
    return map;
};

/**
 * Writes the clients array to sessionStorage, preserving any plain-text fields
 * (currently: resilience) that are not returned by the getProfile endpoint but
 * were previously stored by the login or resilience-save flows.
 *
 * @param {Array<Object>} incomingClients - Client objects as returned by getProfile.
 */
const persistClientsToSession = (incomingClients) => {
    if (!Array.isArray(incomingClients)) return;

    const resilienceMap = buildResilienceMap();

    const merged = incomingClients.map(client => ({
        ...client,
        resilience: resilienceMap.get(client.cid) ?? client.resilience ?? null,
    }));

    sessionStorage.setItem('clients', JSON.stringify(merged));
};

/**
 * Provides authenticated user state and related actions to the component tree.
 * Fetches the user profile on mount when no session user is found.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children
 */
export const UserProvider = ({ children }) => {
    const [user,    setUser]    = useState(loadUserFromSession);
    const [loading, setLoading] = useState(true);
    const { i18n } = useTranslation();

    /**
     * Fetches the current user profile from the API and syncs it to state
     * and sessionStorage.  Clients are written via persistClientsToSession
     * to avoid clobbering resilience data stored by other flows.
     *
     * @async
     * @returns {Promise<void>}
     */
    const fetchUser = useCallback(async () => {
        try {
            setLoading(true);
            const userData = await getProfile();
            setUser(userData);
            sessionStorage.setItem('user', JSON.stringify(userData));

            if (userData?.clients) {
                persistClientsToSession(userData.clients);
            }

            if (userData.locale && i18n.language !== userData.locale) {
                i18n.changeLanguage(userData.locale);
            }
        } catch (error) {
            console.error('Failed to fetch user profile', error);
            setUser(loadUserFromSession());
        } finally {
            setLoading(false);
        }
    }, [i18n]);

    useEffect(() => {
        if (!user) {
            fetchUser();
        } else {
            if (user.locale && i18n.language !== user.locale) {
                i18n.changeLanguage(user.locale);
            }
            setLoading(false);
        }
    }, [user, fetchUser, i18n]);

    /**
     * Updates the user profile via the API and syncs the result to state
     * and sessionStorage.
     *
     * @async
     * @param {Object} profileData - The profile fields to update.
     * @returns {Promise<Object>} The updated user object.
     * @throws {Error} If the update request fails.
     */
    const handleUpdateProfile = useCallback(async (profileData) => {
        try {
            const updatedUser = await updateProfile(profileData);
            setUser(updatedUser);
            sessionStorage.setItem('user', JSON.stringify(updatedUser));

            if (updatedUser.locale && i18n.language !== updatedUser.locale) {
                i18n.changeLanguage(updatedUser.locale);
            }
            return updatedUser;
        } catch (error) {
            console.error('Failed to update profile', error);
            throw error;
        }
    }, [i18n]);

    const value = {
        user,
        loading,
        fetchUser,
        refreshUser:   fetchUser,
        updateProfile: handleUpdateProfile,
    };

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
};