// src/utils/permissions.js
import { loadUserFromStorage } from '../api/auth';

/**
 * @typedef {Object} RoleConstants
 * Enumeration of all recognised user roles in the system.
 */
export const ROLES = {
    GOD:        'god',
    ADMIN:      'admin',
    EDITOR:     'editor',
    ANALYST:    'analyst',
    ADVERTISER: 'advertiser',
    MODERATOR:  'moderator',
    USER:       'user',
};

/**
 * Numeric authority levels assigned to each role.
 * Higher values indicate broader access.
 *
 * @type {Object<string, number>}
 */
export const ROLE_LEVELS = {
    [ROLES.GOD]:        100,
    [ROLES.ADMIN]:       50,
    [ROLES.EDITOR]:      40,
    [ROLES.MODERATOR]:   30,
    [ROLES.ADVERTISER]:  20,
    [ROLES.ANALYST]:     15,
    [ROLES.USER]:        10,
};

/**
 * Maps each protected route path to the set of roles allowed to access it.
 *
 * @type {Object<string, string[]>}
 */
const ROUTE_PERMISSIONS = {
    '/dashboard':            [ROLES.GOD, ROLES.ADMIN, ROLES.ANALYST, ROLES.USER, ROLES.EDITOR, ROLES.MODERATOR, ROLES.ADVERTISER],
    '/post-stats':           [ROLES.GOD, ROLES.ADMIN, ROLES.ANALYST, ROLES.EDITOR],
    '/profile-analytics':    [ROLES.GOD, ROLES.ADMIN, ROLES.ANALYST],
    '/moderation-analytics': [ROLES.GOD, ROLES.ADMIN, ROLES.MODERATOR],
    '/campaigns':            [ROLES.GOD, ROLES.ADMIN, ROLES.ADVERTISER],
    '/advertiser-profiles':  [ROLES.GOD, ROLES.ADMIN, ROLES.ADVERTISER],
    '/placements':           [ROLES.GOD, ROLES.ADMIN, ROLES.ADVERTISER],
    '/placement-pricing':    [ROLES.GOD, ROLES.ADMIN, ROLES.ADVERTISER],
    '/posts':                [ROLES.GOD, ROLES.ADMIN, ROLES.EDITOR, ROLES.USER],
    '/post':                 [ROLES.GOD, ROLES.ADMIN, ROLES.EDITOR, ROLES.USER],
    '/surveys':              [ROLES.GOD, ROLES.ADMIN, ROLES.EDITOR],
    '/trash':                [ROLES.GOD, ROLES.ADMIN, ROLES.MODERATOR, ROLES.EDITOR],
    '/reports':              [ROLES.GOD, ROLES.ADMIN, ROLES.MODERATOR],
    '/users':                [ROLES.GOD, ROLES.ADMIN, ROLES.MODERATOR],
    '/system-users':         [ROLES.GOD, ROLES.ADMIN],
    '/profile':              [ROLES.GOD, ROLES.ADMIN, ROLES.ANALYST, ROLES.USER, ROLES.EDITOR, ROLES.ADVERTISER, ROLES.MODERATOR],
    '/client':               [ROLES.GOD, ROLES.ADMIN],
    '/gamification':         [ROLES.GOD, ROLES.ADMIN],
};

/**
 * Maps each sidebar section key to the roles that may see it.
 *
 * @type {Object<string, string[]>}
 */
const SECTION_PERMISSIONS = {
    analytics:    [ROLES.GOD, ROLES.ADMIN, ROLES.ANALYST, ROLES.USER, ROLES.EDITOR, ROLES.MODERATOR],
    advertising:  [ROLES.GOD, ROLES.ADMIN, ROLES.ADVERTISER],
    content:      [ROLES.GOD, ROLES.ADMIN, ROLES.EDITOR, ROLES.MODERATOR, ROLES.USER],
    users:        [ROLES.GOD, ROLES.ADMIN, ROLES.MODERATOR],
    settings:     [ROLES.GOD, ROLES.ADMIN, ROLES.USER, ROLES.EDITOR, ROLES.ADVERTISER, ROLES.MODERATOR],
    gamification: [ROLES.GOD, ROLES.ADMIN],
};

/**
 * Returns a permissions helper bound to the given role.
 *
 * @param {string} userRole - The authenticated user's role string.
 * @returns {{ hasPermission: function(string): boolean, getVisibleItems: function(Array): Array }}
 */
export const getMenuPermissions = (userRole) => {
    /**
     * Returns `true` when `userRole` is allowed to see the given sidebar section.
     *
     * @param {string} section - Section key (e.g. `'analytics'`, `'content'`).
     * @returns {boolean}
     */
    const hasPermission = (section) =>
        SECTION_PERMISSIONS[section]?.includes(userRole) ?? false;

    /**
     * Filters a list of menu items down to those the current role may access.
     *
     * @param {Array<{path: string}>} sectionItems - Full list of items for a section.
     * @returns {Array<{path: string}>} Items whose route the role is permitted to visit.
     */
    const getVisibleItems = (sectionItems) =>
        sectionItems.filter(item => {
            const allowedRoles = ROUTE_PERMISSIONS[item.path];
            return allowedRoles ? allowedRoles.includes(userRole) : false;
        });

    return { hasPermission, getVisibleItems };
};

/**
 * Determines whether a given role is authorised to access a route.
 *
 * Performs prefix matching when an exact key is not found, so that nested
 * paths such as `/post/123` correctly inherit the `/post` permission set.
 *
 * @param {string} pathname  - The current `location.pathname`.
 * @param {string} userRole  - The authenticated user's role string.
 * @returns {boolean}
 */
export const isRouteAuthorized = (pathname, userRole) => {
    if (pathname === '/' || pathname === '/dashboard') return true;

    let allowedRoles = ROUTE_PERMISSIONS[pathname];

    if (!allowedRoles) {
        const key = Object.keys(ROUTE_PERMISSIONS).find(
            route => pathname.startsWith(route) && route !== '/'
        );
        if (key) allowedRoles = ROUTE_PERMISSIONS[key];
    }

    if (!allowedRoles) return false;

    return allowedRoles.includes(userRole);
};

/**
 * Reads the current user's role from the context-appropriate storage backend.
 *
 * Uses `loadUserFromStorage` (which handles AES-CBC decryption and the
 * localStorage / sessionStorage fallback chain) instead of reading
 * `sessionStorage` directly, ensuring the role is always resolved correctly
 * in both dashboard and embed contexts.
 *
 * @returns {string} The user's role string, or `'user'` as a safe fallback.
 */
export const getUserRole = () => {
    try {
        const user = loadUserFromStorage();
        return user?.role || 'user';
    } catch (e) {
        console.error('Error reading user role from storage:', e);
        return 'user';
    }
};

/**
 * Returns the default landing route for a given role.
 *
 * @param {string} role - A role string from {@link ROLES}.
 * @returns {string} The target pathname.
 */
export const getDefaultRoute = (role) => {
    switch (role) {
        case ROLES.ADVERTISER: return '/campaigns';
        case ROLES.MODERATOR:  return '/reports';
        case ROLES.EDITOR:     return '/posts';
        case ROLES.GOD:
        case ROLES.ADMIN:
        case ROLES.ANALYST:
        case ROLES.USER:
        default:               return '/dashboard';
    }
};