// ./src/components/Sidebar.jsx
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Divider,
  Toolbar,
  useTheme,
  IconButton,
  styled
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
  Analytics as PostStatsIcon
} from '@mui/icons-material';

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

  const menuItems = [
    { text: t('sidebar.general_analytics'), icon: <DashboardIcon />, path: '/dashboard' },
    { text: t('sidebar.post_analytics'), icon: <PostStatsIcon />, path: '/post-stats' }, 
    { text: t('sidebar.my_account'), icon: <ProfileIcon />, path: '/profile' },
    { text: t('sidebar.clients'), icon: <ClientsIcon />, path: '/client' },
    { text: t('sidebar.posts'), icon: <PostsIcon />, path: '/posts' },
    { text: t('sidebar.trash'), icon: <Delete />, path: '/trash' },
    { text: t('sidebar.users'), icon: <GroupIcon />, path: '/users' },
  ];

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'persistent'}
      open={open}
      onClose={handleDrawerToggle}
      ModalProps={{
        keepMounted: true,
        BackdropProps: {
          transitionDuration: 250
        }
      }}
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
          ...(!open && {
            visibility: 'hidden',
          }),
        },
      }}
    >
    <Toolbar sx={{ minHeight: '64px !important', display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2 }}>
      <IconButton 
        onClick={handleDrawerToggle} 
        sx={{ 
          color: theme.palette.text.primary,
          '&:hover': {
            backgroundColor: theme.palette.action.hover,
          }
        }}
      >
        <ChevronLeftIcon />
      </IconButton>
      <img 
        src="/images/quelora.blue.sm.png" 
        alt="Quelora Logo" 
        width="170"
      />
    </Toolbar>
      <Divider sx={{ borderColor: theme.palette.divider }} />
      <List sx={{ padding: '8px' }}>
        {menuItems.map((item) => (
          <StyledListItem 
            key={item.text} 
            component={Link} 
            to={item.path}
            selected={location.pathname.startsWith(item.path)}
          >
            <ListItemIcon sx={{ 
              minWidth: '40px',
              color: 'inherit'
            }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.text} />
          </StyledListItem>
        ))}
      </List>
      <Divider sx={{ borderColor: theme.palette.divider }} />
      <List sx={{ padding: '8px' }}>
        <StyledListItem onClick={handleLogout}>
          <ListItemIcon sx={{ 
            minWidth: '40px',
            color: 'inherit'
          }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary={t('sidebar.logout')} />
        </StyledListItem>
      </List>
    </Drawer>
  );
};

export default Sidebar;