/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

// filepath: src/components/Sidebar.jsx
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import {
    Box,
    Drawer,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Divider,
    Toolbar,
    useTheme,
    IconButton,
    styled,
    Collapse
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    ExitToApp as LogoutIcon,
    ChevronLeft as ChevronLeftIcon,
    Person as ProfileIcon,
    Group as GroupIcon,
    AccountTree as ClientsIcon,
    Article as PostsIcon,
    Delete,
    Analytics as PostStatsIcon,
    Flag as ReportIcon,
    Assessment as AssessmentIcon,
    AdminPanelSettings as ModerationIcon,
    Poll as PollIcon,
    Campaign as CampaignIcon,
    ViewQuilt as PlacementsIcon,
    RecentActors as AdvertiserIcon,
    MonetizationOn as PricingIcon,
    GroupAdd as SystemUsersIcon,
    ExpandLess,
    ExpandMore,
    Settings as SettingsIcon,
    People as PeopleIcon,
    ContentCopy as ContentIcon,
    EmojiEvents,
    Schedule as JobsIcon,
} from '@mui/icons-material';
import React, { useState, useEffect } from 'react';
import { getMenuPermissions, getUserRole } from '../utils/permissions';
import { useEnterprise } from '../hooks/useEnterprise';
import EnterpriseBadge from './Common/EnterpriseBadge';

const drawerWidth = 240;

const StyledListItem = styled(ListItem)(({ theme }) => ({
    borderRadius: 12,
    margin: '4px 8px',
    padding: '8px 12px',
    '&.Mui-selected': {
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.primary.main,
        '& .MuiListItemIcon-root': {
            color: theme.palette.primary.main,
        },
    },
    '&:hover': {
        backgroundColor: theme.palette.action.hover,
    },
    transition: theme.transitions.create(['background-color', 'color'], {
        duration: theme.transitions.duration.shortest,
    }),
}));

const Sidebar = ({ handleLogout, open, handleDrawerToggle, isMobile }) => {
    const { t } = useTranslation();
    const location = useLocation();
    const theme = useTheme();
    const { hasModule } = useEnterprise();
    
    const [analyticsOpen, setAnalyticsOpen] = useState(false);
    const [advertisingOpen, setAdvertisingOpen] = useState(false);
    const [contentOpen, setContentOpen] = useState(false);
    const [usersOpen, setUsersOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [gamificationOpen, setGamificationOpen] = useState(false); // NEW
    const [jobsOpen, setJobsOpen] = useState(false);
    const [userRole, setUserRole] = useState('user');
    const [permissions, setPermissions] = useState(null);

    useEffect(() => {
        const role = getUserRole();
        setUserRole(role);
        setPermissions(getMenuPermissions(role));
    }, []);

    const handleAnalyticsClick = () => setAnalyticsOpen(!analyticsOpen);
    const handleAdvertisingClick = () => setAdvertisingOpen(!advertisingOpen);
    const handleContentClick = () => setContentOpen(!contentOpen);
    const handleUsersClick = () => setUsersOpen(!usersOpen);
    const handleSettingsClick = () => setSettingsOpen(!settingsOpen);
    const handleGamificationClick = () => setGamificationOpen(!gamificationOpen); // NEW
    const handleJobsClick = () => setJobsOpen(!jobsOpen);

    const analyticsItems = [
        { text: t('sidebar.general_analytics'), icon: <DashboardIcon/>, path: '/dashboard' },
        { text: t('sidebar.post_analytics'), icon: <PostStatsIcon/>, path: '/post-stats' },
        { text: t('sidebar.profile_analytics'), icon: <AssessmentIcon/>, path: '/profile-analytics' },
        { text: t('sidebar.moderation_analytics'), icon: <ModerationIcon/>, path: '/moderation-analytics' },
    ];

    const advertisingItems = [
        { text: t('sidebar.campaigns', 'Campaigns'), icon: <CampaignIcon/>, path: '/campaigns' },
        { text: t('sidebar.advertiserProfiles', 'Advertiser Profiles'), icon: <AdvertiserIcon/>, path: '/advertiser-profiles' },
        { text: t('sidebar.placements', 'Placements'), icon: <PlacementsIcon/>, path: '/placements' },
        { text: t('sidebar.placementPricing', 'Pricing by Client'), icon: <PricingIcon/>, path: '/placement-pricing' },
    ];

    const contentItems = [
        { text: t('sidebar.posts'), icon: <PostsIcon/>, path: '/posts' },
        { text: t('sidebar.surveys'), icon: <PollIcon/>, path: '/surveys', enterpriseModule: 'surveys' },
        { text: t('sidebar.trash'), icon: <Delete/>, path: '/trash' },
        { text: t('sidebar.reports'), icon: <ReportIcon/>, path: '/reports' },
    ];

    const profilesItems = [
        { text: t('sidebar.profiles'), icon: <GroupIcon/>, path: '/users' },
    ];

    const settingsItems = [
        { text: t('sidebar.clients'), icon: <ClientsIcon/>, path: '/client' },
        { text: t('sidebar.system_users', 'System Staff'), icon: <SystemUsersIcon/>, path: '/system-users' },
    ];

    // NEW
    const gamificationItems = [
        { text: t('gamification.title', 'Gamification'), icon: <EmojiEvents/>, path: '/gamification' },
    ];

    const jobsItems = [
        { text: t('jobs.sidebar', 'Jobs'), icon: <JobsIcon/>, path: '/jobs' },
    ];

    const isItemActive = (path) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    // enterpriseModule: if provided, shows the Enterprise badge next to the
    // section header when the user does NOT have that module.
    const renderMenuSection = (title, items, isOpen, onToggle, icon, sectionKey, enterpriseModule) => {
        if (!permissions?.hasPermission(sectionKey)) return null;

        const visibleItems = permissions.getVisibleItems(items);
        if (visibleItems.length === 0) return null;

        const sectionLocked = enterpriseModule && !hasModule(enterpriseModule);

        return (
            <>
                <StyledListItem onClick={onToggle} sx={{ cursor: 'pointer' }}>
                    <ListItemIcon sx={{ minWidth: '40px', color: 'inherit' }}>{icon}</ListItemIcon>
                    <ListItemText primary={title} />
                    {sectionLocked && (
                        <Box sx={{ mr: 0.5 }}>
                            <EnterpriseBadge size="small" />
                        </Box>
                    )}
                    {isOpen ? <ExpandLess /> : <ExpandMore />}
                </StyledListItem>
                <Collapse in={isOpen && open} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                        {visibleItems.map((item) => {
                            const itemLocked = item.enterpriseModule && !hasModule(item.enterpriseModule);
                            return (
                                <StyledListItem
                                    key={item.text}
                                    component={Link}
                                    to={item.path}
                                    selected={isItemActive(item.path)}
                                    sx={{ pl: 4 }}
                                >
                                    <ListItemIcon sx={{ minWidth: '40px', color: 'inherit' }}>
                                        {item.icon}
                                    </ListItemIcon>
                                    <ListItemText primary={item.text} />
                                    {itemLocked && (
                                        <Box sx={{ ml: 0.5 }}>
                                            <EnterpriseBadge size="small" />
                                        </Box>
                                    )}
                                </StyledListItem>
                            );
                        })}
                    </List>
                </Collapse>
            </>
        );
    };

    if (!permissions) return null;

    return (
        <Drawer
            variant={isMobile ? 'temporary' : 'persistent'}
            open={open}
            onClose={handleDrawerToggle}
            ModalProps={{ keepMounted: true, BackdropProps: { transitionDuration: 250 } }}
            sx={{
                width: open ? drawerWidth : 0,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: open ? drawerWidth : 0,
                    boxSizing: 'border-box',
                    backgroundColor: theme.palette.background.default,
                    borderRight: 'none',
                    transition: theme.transitions.create('width', {
                        easing: theme.transitions.easing.sharp,
                        duration: open
                            ? theme.transitions.duration.enteringScreen
                            : theme.transitions.duration.leavingScreen,
                    }),
                    overflowX: 'hidden',
                    ...(!open && { visibility: 'hidden' }),
                },
            }}
        >
            <Toolbar sx={{ minHeight: '64px !important', display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2 }}>
                <IconButton
                    onClick={handleDrawerToggle}
                    sx={{ color: theme.palette.text.primary, '&:hover': { backgroundColor: theme.palette.action.hover } }}
                >
                    <ChevronLeftIcon/>
                </IconButton>
                <img src="/images/quelora.blue.sm.png" alt="Quelora Logo" width="170" />
            </Toolbar>

            <Divider sx={{ borderColor: theme.palette.divider }}/>

            <List sx={{ padding: '8px' }}>
                {renderMenuSection(t('sidebar.analytics'), analyticsItems, analyticsOpen, handleAnalyticsClick, <DashboardIcon />, 'analytics')}
                {renderMenuSection(t('sidebar.advertising'), advertisingItems, advertisingOpen, handleAdvertisingClick, <CampaignIcon />, 'advertising', 'advertising')}
                {renderMenuSection(t('sidebar.content'), contentItems, contentOpen, handleContentClick, <ContentIcon />, 'content')}
                {renderMenuSection(t('gamification.title', 'Gamification'), gamificationItems, gamificationOpen, handleGamificationClick, <EmojiEvents />, 'gamification', 'gamification')}
                
                {renderMenuSection(t('jobs.sidebar', 'Jobs'), jobsItems, jobsOpen, handleJobsClick, <JobsIcon />, 'jobs')}
                {renderMenuSection(t('sidebar.profiles'), profilesItems, usersOpen, handleUsersClick, <PeopleIcon />, 'users')}
                {renderMenuSection(t('sidebar.settings'), settingsItems, settingsOpen, handleSettingsClick, <SettingsIcon />, 'settings')}
                
                <StyledListItem
                    component={Link}
                    to="/profile"
                    selected={isItemActive('/profile')}
                >
                    <ListItemIcon sx={{ minWidth: '40px', color: 'inherit' }}>
                        <ProfileIcon/>
                    </ListItemIcon>
                    <ListItemText primary={t('sidebar.my_account')} />
                </StyledListItem>
            </List>

            <Divider sx={{ borderColor: theme.palette.divider }}/>

            <List sx={{ padding: '8px' }}>
                <StyledListItem onClick={handleLogout}>
                    <ListItemIcon sx={{ minWidth: '40px', color: 'inherit' }}>
                        <LogoutIcon/>
                    </ListItemIcon>
                    <ListItemText primary={t('sidebar.logout')} />
                </StyledListItem>
            </List>
        </Drawer>
    );
};

export default Sidebar;