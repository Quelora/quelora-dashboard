/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

/**
 * @fileoverview Enterprise plan hook.
 *
 * Reads the active client's `enterpriseModules` array from session storage and
 * exposes two helpers:
 *
 *  - `isEnterprise`       — true when the active client has at least one enterprise
 *                           module enabled, OR the user role is 'god'
 *  - `hasModule(module)`  — true when the module is listed in the active client's
 *                           `enterpriseModules`, or the user is god
 *
 * ## Source of truth
 *
 * Enterprise module activation is per-client, stored in `client.enterpriseModules`
 * and managed from the Client settings page via `ModulesConfigModal`.
 * The user-level `accountType` / `enterpriseModules` fields are NOT used here.
 *
 * ## God-mode bypass
 *
 * Users with role 'god' have unrestricted access to all enterprise features
 * regardless of which modules the active client has enabled.
 *
 * ## Client switching
 *
 * When a god user switches the active client, `DashboardLayout` remounts the
 * entire routed subtree (via `clientSwitchCount` key on `<Outlet>`). This hook
 * is called fresh on every remount, so it always reflects the newly active client.
 *
 * ## Module identifiers
 *
 *  'surveys'      — Surveys page
 *  'gamification' — Gamification page
 *  'advertising'  — Campaigns / Placements / Advertiser profiles
 *  'network'      — Client network config tab (TURN / Nostr / P2P)
 *  'resilience'   — Client resilience config tab
 *  'push'         — Push notifications (VAPID) config
 *  'liveMode'     — Live-mode tab inside post editor
 *
 * @module hooks/useEnterprise
 */

import { useUser } from '../contexts/UserContext';
import { loadClientsFromSession } from '../api/auth';
import embedStorage from '../utils/embedStorage';

/**
 * @typedef {Object} EnterpriseContext
 * @property {boolean}  isEnterprise              - True when the active client has enterprise
 *   modules or the user is god.
 * @property {boolean}  isGod                     - True when the user role is 'god'.
 * @property {function(string): boolean} hasModule - Returns true when the given module is
 *   enabled for the active client, or unconditionally when the user is god.
 */

/**
 * Returns enterprise plan helpers derived from the active client's configuration.
 *
 * @returns {EnterpriseContext}
 */
export const useEnterprise = () => {
    const { user } = useUser();

    const isGod = user?.role === 'god';

    const currentCid = embedStorage.getItem('currentCid');
    const clients    = loadClientsFromSession();
    const active     = clients.find((c) => c.cid === currentCid) || clients[0] || null;
    const modules    = Array.isArray(active?.enterpriseModules) ? active.enterpriseModules : [];

    const isEnterprise = isGod || modules.length > 0;

    /**
     * Checks whether a specific enterprise module is enabled for the active client.
     * God-role users always return true.
     *
     * @param {string} module - Module identifier (see list above).
     * @returns {boolean}
     */
    const hasModule = (module) => isGod || modules.includes(module);

    return { isEnterprise, isGod, hasModule };
};
