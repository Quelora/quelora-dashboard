/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

/**
 * @fileoverview Dashboard layout shell.
 *
 * Renders the top app-bar, sidebar, main scroll container, and the
 * persistent console drawer. Wraps everything in {@link UserProvider}
 * so that child routes have access to the authenticated user context.
 *
 * @module components/DashboardLayout
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import LanguageMenu from './Dashboard/LanguageMenu';
import ConsoleToolbarButton from './Console/ConsoleToolbarButton';
import ConsoleDrawer from './Console/ConsoleDrawer';
import ThemeSwitcher from './Common/ThemeSwitcher';
import {
    Box,
    CssBaseline,
    Toolbar,
    IconButton,
    Avatar,
    Menu,
    MenuItem,
    ListItemIcon,
    Divider,
    Typography,
    useMediaQuery,
    useTheme,
    CircularProgress,
    Tooltip,
} from '@mui/material';
import {
    Menu as MenuIcon,
    Person as PersonIcon,
    Logout as LogoutIcon,
    ChevronLeft as ChevronLeftIcon,
    Business as BusinessIcon,
} from '@mui/icons-material';
import Sidebar from './Sidebar';
import { UserProvider, useUser } from '../contexts/UserContext';
import React from 'react';
import { getUserRole, ROLES } from '../utils/permissions';
import GodClientSelector from './Common/GodClientSelector';
import { setActiveClient } from '../api/admin';
import { fetchSessionClients, clearAuthData, loadClientsFromSession } from '../api/auth';
import embedStorage from '../utils/embedStorage';

/**
 * Inner layout component that has access to the `UserContext` provided by
 * {@link DashboardLayout}.
 *
 * ### God-mode CID-switch flow
 *
 * Sequence on `handleGodClientSelected`:
 *
 *  1. `POST /admin/set` — Redis `active_cid:<userId>` updated.
 *  2. `fetchSessionClients()` — `GET /user/clients` — reads the new Redis key,
 *     loads the Client document, and atomically replaces `clients` + `currentCid`
 *     in storage with the fresh encrypted payload.
 *  3. `bumpClientSwitch()` — increments `clientSwitchCount` in `UserContext`.
 *  4. The `<Outlet />` wrapper receives the new `key={clientSwitchCount}`, which
 *     forces React to **unmount and remount** the entire routed subtree.
 *  5. Every page component re-mounts, its `useEffect(fn, [])` hooks re-fire,
 *     and `loadClientsFromSession()` is called against the already-updated
 *     storage — so `selectedCid` and `clientList` in every page immediately
 *     reflect the new active client without any changes to the pages themselves.
 *
 * @component
 * @param {Object}   props
 * @param {function} props.toggleTheme  - Toggles between light and dark theme.
 * @param {string}   props.currentTheme - Current theme identifier (`'light'` | `'dark'`).
 * @returns {JSX.Element}
 */
const UserAwareLayout = ({ toggleTheme, currentTheme }) => {
    const { t }       = useTranslation();
    const navigate    = useNavigate();
    const location    = useLocation();
    const theme       = useTheme();
    const isMobile    = useMediaQuery(theme.breakpoints.down('md'));

    const {
        user,
        loading: userLoading,
        clientSwitchCount,
        bumpClientSwitch,
    } = useUser();

    const [open, setOpen] = useState(() => {
        const saved = sessionStorage.getItem('consoleDrawerOpen');
        return saved === 'true';
    });

    const [mobileOpen,  setMobileOpen]  = useState(false);
    const [anchorEl,    setAnchorEl]    = useState(null);
    const [scrolled,    setScrolled]    = useState(false);

    const [desktopOpen, setDesktopOpen] = useState(() => {
        const saved = sessionStorage.getItem('sidebarOpen');
        return saved !== null ? saved === 'true' : true;
    });

    const [isGodSelectionNeeded, setIsGodSelectionNeeded] = useState(false);
    const [isClientSwitching,    setIsClientSwitching]    = useState(false);
    const [userRole,             setUserRole]             = useState('user');
    const [activeClientLabel,    setActiveClientLabel]    = useState('');

    const handleDrawerToggle = useCallback(() => {
        if (isMobile) {
            setMobileOpen((prev) => !prev);
        } else {
            const newState = !desktopOpen;
            setDesktopOpen(newState);
            sessionStorage.setItem('sidebarOpen', newState.toString());
        }
    }, [isMobile, desktopOpen]);

    useEffect(() => {
        if (isMobile) setMobileOpen(false);
    }, [location, isMobile]);

    useEffect(() => {
        const role       = getUserRole();
        const currentCid = embedStorage.getItem('currentCid');

        setUserRole(role);

        if (role === ROLES.GOD && !currentCid) {
            setIsGodSelectionNeeded(true);
        } else {
            setIsGodSelectionNeeded(false);
        }
    }, []);

    useEffect(() => {
        const currentCid = embedStorage.getItem('currentCid');
        if (!currentCid) return;
        const clients = loadClientsFromSession();
        const active  = clients.find((c) => c.cid === currentCid);
        setActiveClientLabel(active?.description || currentCid);
    }, [clientSwitchCount]);

    /**
     * Handles the God-mode client-selection event.
     *
     * Calls `bumpClientSwitch()` **after** `fetchSessionClients()` resolves so
     * that storage is already up-to-date when the remounted page components
     * read it. The `<Outlet />` `key` change triggers the remount automatically.
     *
     * @async
     * @param {Object} clientData     - The selected client object.
     * @param {string} clientData.cid - The selected client identifier.
     * @returns {Promise<void>}
     */
    const handleGodClientSelected = useCallback(async (clientData) => {
        try {
            setIsClientSwitching(true);

            await setActiveClient(clientData.cid);

            await fetchSessionClients();

            embedStorage.setItem('currentCid', clientData.cid);

            bumpClientSwitch();

            setIsGodSelectionNeeded(false);
        } catch (error) {
            console.error('Error setting active client:', error);
        } finally {
            setIsClientSwitching(false);
        }
    }, [bumpClientSwitch]);

    const handleProfileMenuOpen = (event) => setAnchorEl(event.currentTarget);
    const handleMenuClose       = ()       => setAnchorEl(null);

    const handleLogout = () => {
        clearAuthData();
        navigate('/login');
    };

    const handleMainScroll = (event) => {
        setScrolled(event.target.scrollTop > 10);
    };

    const drawerWidth        = 240;
    const sidebarOpen        = isMobile ? mobileOpen : desktopOpen;
    const consoleDrawerWidth = sidebarOpen && !isMobile ? `calc(100% - ${drawerWidth}px)` : '100%';
    const consoleDrawerLeft  = sidebarOpen && !isMobile ? `${drawerWidth}px` : '0px';
    const userPicture        = user?.picture || '/images/avatar.jpg';

    return (
        <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
            <CssBaseline />

            <GodClientSelector
                open={isGodSelectionNeeded}
                onClientSelected={handleGodClientSelected}
                onClose={embedStorage.getItem('currentCid') ? () => setIsGodSelectionNeeded(false) : undefined}
            />

            <header className={`app-bar ${scrolled ? 'scrolled' : ''}`}>
                <Toolbar className="toolbar">
                    <div className="left-section">
                        <IconButton
                            color="inherit"
                            edge="start"
                            onClick={handleDrawerToggle}
                            sx={{
                                mr: 2,
                                transform: sidebarOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                                transition: theme.transitions.create('transform', {
                                    duration: theme.transitions.duration.shortest,
                                }),
                            }}
                        >
                            {sidebarOpen ? <ChevronLeftIcon /> : <MenuIcon />}
                        </IconButton>
                        <Typography variant="h6">
                            {t('dashboard.title')}
                        </Typography>
                    </div>

                    <div className="right-controls">
                        {userRole === ROLES.GOD && (
                            <Tooltip title="Change client">
                                <span>
                                    <IconButton
                                        onClick={() => setIsGodSelectionNeeded(true)}
                                        color="inherit"
                                        sx={{ mr: 1, borderRadius: 2, px: 1, gap: 0.75 }}
                                        disabled={isClientSwitching}
                                    >
                                        {isClientSwitching
                                            ? <CircularProgress size={20} color="inherit" />
                                            : <BusinessIcon />
                                        }
                                        {!isClientSwitching && activeClientLabel && (
                                            <Typography variant="body2" sx={{ fontWeight: 500, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {activeClientLabel}
                                            </Typography>
                                        )}
                                    </IconButton>
                                </span>
                            </Tooltip>
                        )}

                        <ThemeSwitcher theme={currentTheme} toggleTheme={toggleTheme} />
                        <LanguageMenu />
                        <ConsoleToolbarButton open={open} setOpen={setOpen} />
                        <IconButton onClick={handleProfileMenuOpen} size="small">
                            {userLoading ? (
                                <CircularProgress size={24} color="inherit" />
                            ) : (
                                <Avatar alt={user?.given_name || 'User Profile'} src={userPicture} />
                            )}
                        </IconButton>
                    </div>
                </Toolbar>

                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                >
                    <MenuItem onClick={() => { navigate('/profile'); handleMenuClose(); }}>
                        <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
                        {t('profile.my_account')}
                    </MenuItem>
                    <Divider />
                    <MenuItem onClick={handleLogout} className='logout'>
                        <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
                        {t('profile.logout')}
                    </MenuItem>
                </Menu>
            </header>

            <Sidebar
                handleLogout={handleLogout}
                open={sidebarOpen}
                handleDrawerToggle={handleDrawerToggle}
                isMobile={isMobile}
            />

            <Box
                component="main"
                onScroll={handleMainScroll}
                sx={{
                    flexGrow:  1,
                    height:    '100vh !important',
                    overflow:  'auto !important',
                    width:     { sm: `calc(100% - ${sidebarOpen ? drawerWidth : 0}px)` },
                    transition: theme.transitions.create('width', {
                        easing:   theme.transitions.easing.sharp,
                        duration: theme.transitions.duration.leavingScreen,
                    }),
                    display:       'flex',
                    flexDirection: 'column',
                }}
            >
                <Toolbar />

                <Box sx={{
                    width:    '100%',
                    maxWidth: '1280px !important',
                    mx:       'auto !important',
                    flexGrow: 1,
                    pt: 3, pb: 3,
                    pl: { xs: 1, sm: 3 },
                    pr: { xs: 1, sm: 3 },
                }}>
                    {/*
                     * key={clientSwitchCount} is the core of the CID-switch mechanism.
                     *
                     * When a God user selects a new client, bumpClientSwitch() increments
                     * clientSwitchCount. React treats a key change as a signal to unmount
                     * the old subtree and mount a fresh one. Every page component remounts,
                     * its useEffect hooks re-fire, and loadClientsFromSession() reads from
                     * the already-updated storage — no changes needed in any page component.
                     */}
                    {!isGodSelectionNeeded && !isClientSwitching && (
                        <Box key={clientSwitchCount} sx={{ height: '100%' }}>
                            <Outlet />
                        </Box>
                    )}
                </Box>
            </Box>

            <ConsoleDrawer
                open={open}
                onClose={() => setOpen(false)}
                anchor="bottom"
                variant="persistent"
                sx={{
                    zIndex: 1300,
                    '& .MuiDrawer-paper': {
                        width:           consoleDrawerWidth,
                        left:            consoleDrawerLeft,
                        right:           0,
                        bottom:          0,
                        top:             'auto',
                        height:          '30vh',
                        position:        'fixed',
                        boxSizing:       'content-box',
                        backgroundColor: '#121212 !important',
                    },
                }}
            />
        </Box>
    );
};

/**
 * Root dashboard layout that wraps the application shell with the
 * `UserProvider` context.
 *
 * @component
 * @param {Object}   props
 * @param {function} props.toggleTheme  - Toggles between light and dark theme.
 * @param {string}   props.currentTheme - Current theme identifier.
 * @returns {JSX.Element}
 */
const DashboardLayout = ({ toggleTheme, currentTheme }) => (
    <UserProvider>
        <UserAwareLayout toggleTheme={toggleTheme} currentTheme={currentTheme} />
    </UserProvider>
);

export default DashboardLayout;