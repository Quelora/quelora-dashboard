// ./src/components/Dashboard/LanguageMenu.jsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  Typography,
  useTheme
} from '@mui/material';
import {
  Translate as TranslateIcon,
  Check as CheckIcon
} from '@mui/icons-material';

const languages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' }
];

const LanguageMenu = () => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    handleMenuClose();
  };

  return (
    <>
      <IconButton
        onClick={handleMenuOpen}
        color="inherit"
        aria-label={t('language.change')}
        sx={{
          color: theme.palette.mode === 'dark' ? 'inherit' : 'text.primary'
        }}
      >
        <TranslateIcon />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            minWidth: '180px'
          }
        }}
      >
        {languages.map((language) => (
          <MenuItem 
            key={language.code}
            onClick={() => changeLanguage(language.code)}
            selected={i18n.language === language.code}
          >
            {i18n.language === language.code && (
              <ListItemIcon>
                <CheckIcon fontSize="small" />
              </ListItemIcon>
            )}
            <Typography variant="inherit" sx={{ ml: i18n.language === language.code ? 0 : '32px' }}>
              {language.name}
            </Typography>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default LanguageMenu;