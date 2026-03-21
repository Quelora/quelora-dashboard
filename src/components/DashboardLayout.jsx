// src/components/layouts/DashboardLayout.jsx
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
    Tooltip
} from '@mui/material';
import {
    Menu as MenuIcon,
    Person as PersonIcon,
    Logout as LogoutIcon,
    ChevronLeft as ChevronLeftIcon,
    Business as BusinessIcon
} from '@mui/icons-material';
import Sidebar from './Sidebar';
import { UserProvider, useUser } from '../contexts/UserContext';
import React from 'react';
import { getUserRole, ROLES } from '../utils/permissions';
import GodClientSelector from './Common/GodClientSelector';
import { setActiveClient } from '../api/admin';
import embedStorage from '../utils/embedStorage';

/**
 * Inner layout component that has access to the `UserContext` provided by
 * {@link DashboardLayout}.
 *
 * Responsibilities:
 *  - Renders the top app-bar, sidebar, main scroll container, and the
 *    persistent console drawer.
 *  - Manages sidebar open/close state (persisted in `sessionStorage` so it
 *    survives page refreshes within the same tab).
 *  - Handles GOD-role client selection, writing the chosen `currentCid` via
 *    `embedStorage` so embed windows opened afterwards can resolve the CID.
 *  - Clears all auth data through `embedStorage` on logout so that both
 *    `localStorage` (embed) and `sessionStorage` (dashboard) are wiped.
 *
 * @component
 * @param {Object} props
 * @param {function} props.toggleTheme   - Toggles between light and dark theme.
 * @param {string}   props.currentTheme  - Current theme identifier (`'light'` | `'dark'`).
 * @returns {JSX.Element}
 */
const UserAwareLayout = ({ toggleTheme, currentTheme }) => {
    const { t } = useTranslation();
    const navigate  = useNavigate();
    const location  = useLocation();
    const theme     = useTheme();
    const isMobile  = useMediaQuery(theme.breakpoints.down('md'));

    const { user, loading: userLoading, refreshUser } = useUser();

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
    const [userRole,             setUserRole]             = useState('user');

    const handleDrawerToggle = useCallback(() => {
        if (isMobile) {
            setMobileOpen(prev => !prev);
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

    /**
     * Handles the GOD-role client selection event.
     * Writes the selected CID via `embedStorage` so that embed windows opened
     * from this dashboard session can resolve it from `localStorage`.
     *
     * @async
     * @param {Object} clientData     - The selected client object.
     * @param {string} clientData.cid - The selected client identifier.
     * @returns {Promise<void>}
     */
    const handleGodClientSelected = async (clientData) => {
        try {
            await setActiveClient(clientData.cid);
            embedStorage.setItem('currentCid', clientData.cid);
            await refreshUser();
            setIsGodSelectionNeeded(false);
        } catch (error) {
            console.error('Error setting active client:', error);
        }
    };

    const handleProfileMenuOpen = (event) => setAnchorEl(event.currentTarget);
    const handleMenuClose       = ()       => setAnchorEl(null);

    /**
     * Clears all authentication data from both storage backends and redirects
     * to the login page.
     *
     * Using `embedStorage.removeItem` ensures that keys stored in `localStorage`
     * during an embed login are also removed, preventing stale credentials from
     * being reused after an explicit logout.
     *
     * @returns {void}
     */
    const handleLogout = () => {
        const keys = ['token', 'clients', 'tokenExpiration', 'user', 'userKey', 'currentCid'];
        keys.forEach(key => embedStorage.removeItem(key));
        navigate('/login');
    };

    /** Tracks whether the main content area has been scrolled. */
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
                                <IconButton
                                    onClick={() => setIsGodSelectionNeeded(true)}
                                    color="inherit"
                                    sx={{ mr: 1 }}
                                >
                                    <BusinessIcon />
                                </IconButton>
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
                    flexGrow: 1,
                    height: '100vh !important',
                    overflow: 'auto !important',
                    width: { sm: `calc(100% - ${sidebarOpen ? drawerWidth : 0}px)` },
                    transition: theme.transitions.create('width', {
                        easing:    theme.transitions.easing.sharp,
                        duration:  theme.transitions.duration.leavingScreen,
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
                    {!isGodSelectionNeeded && <Outlet />}
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