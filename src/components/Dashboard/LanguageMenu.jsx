import{useState}from'react';
import{useTranslation}from'react-i18next';
import{IconButton,Menu,MenuItem,ListItemIcon,Typography,useTheme}from'@mui/material';
import{Translate as TranslateIcon,Check as CheckIcon}from'@mui/icons-material';
import{useUser}from'../../contexts/UserContext';
import React from 'react';

const rtlLangs = new Set(['ar','he']);
const languages = [
{code:'ar',name:'العربية'},
{code:'de',name:'Deutsch'},
{code:'en',name:'English'},
{code:'es',name:'Español'},
{code:'fr',name:'Français'},
{code:'it',name:'Italiano'},
{code:'ja',name:'日本語'},
{code:'ru',name:'Русский'},
{code:'zh',name:'中文'},
{code:'pt',name:'Português'},
{code:'hi',name:'हिन्दी'},
{code:'he',name:'עברית'}
];

const LanguageMenu = () => {
    const{t,i18n}=useTranslation();
    const theme = useTheme();
    const[anchorEl,setAnchorEl]=useState(null);
    const userContext = useUser();

    const changeLanguage = async (lng) => {
        i18n.changeLanguage(lng);
        const newDirection = rtlLangs.has(lng)?'rtl':'ltr';
        document.documentElement.setAttribute('dir',newDirection);

        try {
            if (userContext && userContext.updateProfile) {
                await userContext.updateProfile({locale:lng});
            }
        } catch (error) {
            console.error("Failed to save language preference:",error);
        }
        handleMenuClose();
    };

    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const menuDirection = rtlLangs.has(i18n.language)?'rtl':'ltr';

    return (
        <>
            <IconButton
                onClick={handleMenuOpen}
                color="inherit"
                aria-label={t('common.change')}
                sx={{
                    color: theme.palette.mode === 'dark' ? 'inherit' : 'text.primary'
                }}
            >
                <TranslateIcon/>
            </IconButton>

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                    sx: {
                        minWidth: '180px',
                        direction: menuDirection
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
                            <ListItemIcon
                                sx={{
                                    minWidth: 0,
                                    ...(rtlLangs.has(language.code) && {
                                        mr: 0,
                                        ml: 1
                                    })
                                }}
                            >
                                <CheckIcon fontSize="small"/>
                            </ListItemIcon>
                        )}<Typography
                            variant="inherit"
                            sx={{
                                ml: i18n.language === language.code ? (rtlLangs.has(language.code) ? 0 : 0) : (rtlLangs.has(language.code) ? 0 : '32px'),
                                mr: i18n.language === language.code ? (rtlLangs.has(language.code) ? '32px' : 0) : (rtlLangs.has(language.code) ? '32px' : 0)
                            }}
                        >
                            {language.name}
                        </Typography>
                    </MenuItem>
                ))}
            </Menu>
        </>
    );
};

export default LanguageMenu;