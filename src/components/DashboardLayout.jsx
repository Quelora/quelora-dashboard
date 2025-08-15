// ./src/components/DashboardLayout.jsx
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import LanguageMenu from './Dashboard/LanguageMenu';
import ConsoleToolbarButton from './Console/ConsoleToolbarButton';
import ConsoleDrawer from './Console/ConsoleDrawer';

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
  useTheme
} from '@mui/material';
import {
  Menu as MenuIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  ChevronLeft as ChevronLeftIcon
} from '@mui/icons-material';
import Sidebar from './Sidebar';

const DashboardLayout = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [open, setOpen] = useState(() => {
    const saved = sessionStorage.getItem('consoleDrawerOpen');
    return saved === 'true';
  });

  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  // Estado persistente para desktop
  const [desktopOpen, setDesktopOpen] = useState(() => {
    const saved = sessionStorage.getItem('sidebarOpen');
    return saved !== null ? saved === 'true' : true;
  });

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
    // Solo cerrar automáticamente en móvil al cambiar de ruta
    if (isMobile) {
      setMobileOpen(false);
    }
  }, [location, isMobile]);

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('clients');
    sessionStorage.removeItem('tokenExpiration');
    navigate('/login');
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const drawerWidth = 240;
  const sidebarOpen = isMobile ? mobileOpen : desktopOpen;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
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
            <ConsoleToolbarButton open={open} setOpen={setOpen} />
            <LanguageMenu />
            <IconButton
              onClick={handleProfileMenuOpen}
              size="small"
            >
              <Avatar alt="User Profile" src="/images/avatar.jpg" />
            </IconButton>
          </div>
        </Toolbar>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleMenuClose}>
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
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${sidebarOpen ? drawerWidth : 0}px)` },
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          height: '100vh',
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Toolbar />
        <Outlet />
        <ConsoleDrawer open={open} onClose={() => setOpen(false)} />
      </Box>
    </Box>
  );
};

export default DashboardLayout;