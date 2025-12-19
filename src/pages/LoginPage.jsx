// ./src/pages/LoginPage.jsx
import { useEffect } from 'react';
import { Box } from '@mui/material';
import Login from '../components/Auth/Login';
import LanguageSelector from '../components/Auth/LanguageSelector';
import ThemeSwitcher from '../components/Common/ThemeSwitcher';
import { useTranslation } from 'react-i18next';
import '../assets/css/Login.css';
import React from 'react';

const LoginPage = ({ toggleTheme, currentTheme }) => {
    const { t } = useTranslation();

    useEffect(() => {
        document.title = t('login.page_title') || 'Login';
    }, [t]);

    return (
        <Box className='login-background'>
            <div className="bg"></div>
            <div className="bg bg2"></div>
            <div className="bg bg3"></div>
            
            <Box sx={{ position: 'absolute', top: 20, right: 20, display: 'flex', alignItems: 'center', gap: 2 }}>
                <LanguageSelector />
                <ThemeSwitcher theme={currentTheme} toggleTheme={toggleTheme} />
            </Box>

            <Box className='login-center-container'>
                <Box className='login-card'>
                    <Login />
                </Box>
            </Box>
            <Box className='login-footer'>
                © {new Date().getFullYear()} Quelora - Versión 1.0
            </Box>
        </Box>
    );
};

export default LoginPage;