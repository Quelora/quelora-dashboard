import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { getProfile, updateProfile } from '../api/profile';
import { useTranslation } from 'react-i18next';

const UserContext = createContext(null);

export const useUser = () => useContext(UserContext);

const loadUserFromSession = () => {
    try {
        const storedUser = sessionStorage.getItem('user');
        if (storedUser) {
            return JSON.parse(storedUser);
        }
    } catch (e) {
        console.error("Failed to parse user from session storage", e);
    }
    return null;
};

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(loadUserFromSession);
    const [loading, setLoading] = useState(true);
    const { i18n } = useTranslation();

    const fetchUser = useCallback(async () => {
        try {
            setLoading(true);
            const userData = await getProfile();
            setUser(userData);
            sessionStorage.setItem('user', JSON.stringify(userData));
            if (userData?.clients) {
                sessionStorage.setItem('clients', JSON.stringify(userData.clients));
            }
            
            if (userData.locale && i18n.language !== userData.locale) {
                i18n.changeLanguage(userData.locale);
            }
        } catch (error) {
            console.error("Failed to fetch user profile", error);
            // Si falla, intentamos recuperar de sesión o dejamos el error
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
            console.error("Failed to update profile", error);
            throw error;
        }
    }, [i18n]);

    const value = {
        user,
        loading,
        fetchUser,
        refreshUser: fetchUser, // Alias para consistencia semántica con el Dashboard
        updateProfile: handleUpdateProfile,
    };

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
};