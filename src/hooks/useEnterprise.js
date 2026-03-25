/**
 * @fileoverview Enterprise plan hook.
 *
 * Reads the authenticated user's account type and enabled enterprise modules
 * from UserContext and exposes two helpers:
 *
 *  - `isEnterprise`       — true when accountType === 'enterprise'
 *  - `hasModule(module)`  — true when the module is in the user's
 *                           enterpriseModules list
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

/**
 * @typedef {Object} EnterpriseContext
 * @property {boolean}  isEnterprise          - True when the account plan is 'enterprise'.
 * @property {function(string): boolean} hasModule - Returns true when the given module
 *   is explicitly enabled for this account.
 */

/**
 * Returns enterprise plan helpers derived from the current user session.
 *
 * @returns {EnterpriseContext}
 */
export const useEnterprise = () => {
    const { user } = useUser();

    const isEnterprise = user?.accountType === 'enterprise';
    const modules      = Array.isArray(user?.enterpriseModules) ? user.enterpriseModules : [];

    /**
     * Checks whether a specific enterprise module is enabled for the current user.
     *
     * @param {string} module - Module identifier (see list above).
     * @returns {boolean}
     */
    const hasModule = (module) => isEnterprise && modules.includes(module);

    return { isEnterprise, hasModule };
};
