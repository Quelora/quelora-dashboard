// filepath: src/utils/permissions.js
export const ROLES = {
    GOD: 'god',
    ADMIN: 'admin',
    EDITOR: 'editor',
    ANALYST: 'analyst',
    ADVERTISER: 'advertiser',
    MODERATOR: 'moderator',
    USER: 'user'
};

export const ROLE_LEVELS = {
    [ROLES.GOD]: 100,
    [ROLES.ADMIN]: 50,
    [ROLES.EDITOR]: 40,
    [ROLES.MODERATOR]: 30,
    [ROLES.ADVERTISER]: 20,
    [ROLES.ANALYST]: 15,
    [ROLES.USER]: 10
};

const ROUTE_PERMISSIONS = {
    '/dashboard': [ROLES.GOD, ROLES.ADMIN, ROLES.ANALYST, ROLES.USER, ROLES.EDITOR, ROLES.MODERATOR, ROLES.ADVERTISER],
    '/post-stats': [ROLES.GOD, ROLES.ADMIN, ROLES.ANALYST, ROLES.EDITOR],
    '/profile-analytics': [ROLES.GOD, ROLES.ADMIN, ROLES.ANALYST],
    '/moderation-analytics': [ROLES.GOD, ROLES.ADMIN, ROLES.MODERATOR],
    '/campaigns': [ROLES.GOD, ROLES.ADMIN, ROLES.ADVERTISER],
    '/advertiser-profiles': [ROLES.GOD, ROLES.ADMIN, ROLES.ADVERTISER],
    '/placements': [ROLES.GOD, ROLES.ADMIN, ROLES.ADVERTISER],
    '/placement-pricing': [ROLES.GOD, ROLES.ADMIN, ROLES.ADVERTISER],
    '/posts': [ROLES.GOD, ROLES.ADMIN, ROLES.EDITOR, ROLES.USER],
    '/post': [ROLES.GOD, ROLES.ADMIN, ROLES.EDITOR, ROLES.USER],
    '/surveys': [ROLES.GOD, ROLES.ADMIN, ROLES.EDITOR],
    '/trash': [ROLES.GOD, ROLES.ADMIN, ROLES.MODERATOR, ROLES.EDITOR],
    '/reports': [ROLES.GOD, ROLES.ADMIN, ROLES.MODERATOR],
    '/users': [ROLES.GOD, ROLES.ADMIN, ROLES.MODERATOR],
    '/system-users': [ROLES.GOD, ROLES.ADMIN],
    '/profile': [ROLES.GOD, ROLES.ADMIN, ROLES.ANALYST, ROLES.USER, ROLES.EDITOR, ROLES.ADVERTISER, ROLES.MODERATOR],
    '/client': [ROLES.GOD, ROLES.ADMIN],
    '/gamification': [ROLES.GOD, ROLES.ADMIN] 
};

const SECTION_PERMISSIONS = {
    analytics: [ROLES.GOD, ROLES.ADMIN, ROLES.ANALYST, ROLES.USER, ROLES.EDITOR, ROLES.MODERATOR],
    advertising: [ROLES.GOD, ROLES.ADMIN, ROLES.ADVERTISER],
    content: [ROLES.GOD, ROLES.ADMIN, ROLES.EDITOR, ROLES.MODERATOR, ROLES.USER],
    users: [ROLES.GOD, ROLES.ADMIN, ROLES.MODERATOR],
    settings: [ROLES.GOD, ROLES.ADMIN, ROLES.USER, ROLES.EDITOR, ROLES.ADVERTISER, ROLES.MODERATOR],
    gamification: [ROLES.GOD, ROLES.ADMIN] 
};

export const getMenuPermissions = (userRole) => {
    const hasPermission = (section) => {
        return SECTION_PERMISSIONS[section]?.includes(userRole) || false;
    };

    const getVisibleItems = (sectionItems) => {
        return sectionItems.filter(item => {
            const allowedRoles = ROUTE_PERMISSIONS[item.path];
            if (!allowedRoles) return false;
            return allowedRoles.includes(userRole);
        });
    };

    return {
        hasPermission,
        getVisibleItems
    };
};

export const isRouteAuthorized = (pathname, userRole) => {
    if (pathname === '/' || pathname === '/dashboard') return true;

    let allowedRoles = ROUTE_PERMISSIONS[pathname];

    if (!allowedRoles) {
        const key = Object.keys(ROUTE_PERMISSIONS).find(route => pathname.startsWith(route) && route !== '/');
        if (key) allowedRoles = ROUTE_PERMISSIONS[key];
    }

    if (!allowedRoles) {
        return false;
    }

    return allowedRoles.includes(userRole);
};

export const getUserRole = () => {
    try {
        const userString = sessionStorage.getItem('user');
        if (userString) {
            const user = JSON.parse(userString);
            return user?.role || 'user';
        }
        return 'user';
    } catch (e) {
        console.error("Error reading user role from sessionStorage", e);
        return 'user';
    }
};

export const getDefaultRoute = (role) => {
    switch (role) {
        case ROLES.ADVERTISER:
            return '/campaigns';
        case ROLES.MODERATOR:
            return '/reports';
        case ROLES.EDITOR:
            return '/posts';
        case ROLES.GOD:
        case ROLES.ADMIN:
        case ROLES.ANALYST:
        case ROLES.USER:
        default:
            return '/dashboard';
    }
};