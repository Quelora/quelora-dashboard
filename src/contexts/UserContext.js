/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

/**
 * @fileoverview User context provider.
 *
 * Provides the authenticated user state, a profile-refresh action, a
 * profile-update action, and a client-switch signal to the component tree.
 *
 * ## Client-switch signal (`clientSwitchCount` / `bumpClientSwitch`)
 *
 * When a God-mode user picks a new active client in `DashboardLayout`, the
 * following sequence runs:
 *
 *  1. `POST /admin/set` — Redis `active_cid:<userId>` updated.
 *  2. `fetchSessionClients()` — storage `clients` + `currentCid` replaced.
 *  3. `bumpClientSwitch()` — increments `clientSwitchCount` in this context.
 *
 * `DashboardLayout` passes `clientSwitchCount` as the `key` prop of the
 * `<Outlet />` wrapper.  A React `key` change forces the entire routed
 * subtree to **unmount and remount**.  Every page component re-mounts fresh,
 * its `useEffect(fn, [])` hooks re-fire, and `loadClientsFromSession()` is
 * called against the already-updated storage — so `selectedCid` and
 * `clientList` in every page always reflect the new active client without
 * any changes to the page components themselves.
 *
 * ## Storage contract
 *
 * All reads and writes go through {@link module:utils/embedStorage} instead
 * of accessing `sessionStorage` or `localStorage` directly.
 *
 * @module contexts/UserContext
 */

import React, {
    createContext,
    useState,
    useEffect,
    useContext,
    useCallback,
    useRef,
} from 'react';
import { getProfile, updateProfile } from '../api/profile';
import { loadUserFromStorage } from '../api/auth';
import { useTranslation } from 'react-i18next';
import embedStorage from '../utils/embedStorage';

const UserContext = createContext(null);

export const useUser = () => useContext(UserContext);

// ---------------------------------------------------------------------------
// Session helpers
// ---------------------------------------------------------------------------

/**
 * Builds a map of `{ cid → resilience }` from the clients currently in
 * storage so that resilience data managed by a separate endpoint is never
 * silently dropped when `getProfile` overwrites the clients array.
 *
 * @returns {Map<string, Object|null>} Map keyed by CID.
 */
const buildResilienceMap = () => {
    const map = new Map();
    try {
        const raw = embedStorage.getItem('clients');
        if (!raw) return map;
        const clients = JSON.parse(raw);
        if (Array.isArray(clients)) {
            clients.forEach((c) => {
                if (c.cid) map.set(c.cid, c.resilience ?? null);
            });
        }
    } catch {
        // Storage unreadable — return empty map.
    }
    return map;
};

/**
 * Persists the clients array to the context-appropriate storage backend,
 * preserving any plain-text fields (currently `resilience`) that are not
 * returned by the `getProfile` endpoint.
 *
 * @param {Array<Object>} incomingClients - Client objects as returned by
 *   `getProfile`.
 * @returns {void}
 */
const persistClientsToStorage = (incomingClients) => {
    if (!Array.isArray(incomingClients)) return;

    const resilienceMap = buildResilienceMap();

    const merged = incomingClients.map((client) => ({
        ...client,
        resilience: resilienceMap.get(client.cid) ?? client.resilience ?? null,
    }));

    embedStorage.setItem('clients', JSON.stringify(merged));
};

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

/**
 * Provides authenticated user state and related actions to the component tree.
 *
 * @param {Object}          props
 * @param {React.ReactNode} props.children
 */
export const UserProvider = ({ children }) => {
    const [user,              setUser]              = useState(() => loadUserFromStorage());
    const [loading,           setLoading]           = useState(true);
    const [clientSwitchCount, setClientSwitchCount] = useState(0);
    const { i18n } = useTranslation();
    const i18nRef = useRef(i18n);
    useEffect(() => {
        i18nRef.current = i18n;
    });

    /**
     * Increments the client-switch counter.
     *
     * `DashboardLayout` uses this counter as the `key` prop of the `<Outlet />`
     * wrapper.  Incrementing it forces React to unmount and remount the entire
     * routed subtree, causing every page component to re-initialize from the
     * already-updated storage without requiring any changes to the pages
     * themselves.
     *
     * Must be called **after** `fetchSessionClients()` has resolved so that
     * storage is already up-to-date when the remounted components read it.
     *
     * @returns {void}
     */
    const bumpClientSwitch = useCallback(() => {
        setClientSwitchCount((prev) => prev + 1);
    }, []);

    /**
     * Fetches the current user profile from the API and syncs it to state
     * and storage.
     *
     * @async
     * @returns {Promise<void>}
     */
    const fetchUser = useCallback(async () => {
        try {
            setLoading(true);
            const userData = await getProfile();
            setUser(userData);

            embedStorage.setItem('user', JSON.stringify(userData));

            if (userData?.clients) {
                persistClientsToStorage(userData.clients);
            }

            if (userData.locale && i18nRef.current.language !== userData.locale) {
                i18nRef.current.changeLanguage(userData.locale);
            }
        } catch (error) {
            console.error('Failed to fetch user profile', error);
            setUser(loadUserFromStorage());
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!user) {
            fetchUser();
        } else {
            if (user.locale && i18n.language !== user.locale) {
                i18n.changeLanguage(user.locale);
            }
            setLoading(false);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    /**
     * Updates the user profile via the API and syncs the result to state
     * and storage.
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

            embedStorage.setItem('user', JSON.stringify(updatedUser));

            if (updatedUser.locale && i18nRef.current.language !== updatedUser.locale) {
                i18nRef.current.changeLanguage(updatedUser.locale);
            }
            return updatedUser;
        } catch (error) {
            console.error('Failed to update profile', error);
            throw error;
        }
    }, []);

    const value = {
        user,
        loading,
        fetchUser,
        refreshUser:      fetchUser,
        updateProfile:    handleUpdateProfile,
        clientSwitchCount,
        bumpClientSwitch,
    };

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
};