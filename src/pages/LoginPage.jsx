import { useEffect } from 'react';
import { Box } from '@mui/material';
import Login from '../components/Auth/Login';
import LanguageSelector from '../components/Auth/LanguageSelector';
import { useTranslation } from 'react-i18next';
import '../assets/css/Login.css';

const LoginPage = () => {
  const { t } = useTranslation();

  useEffect(() => {
    document.title = t('login.page_title') || 'Login';
  }, [t]);

  return (
    <Box className='login-background'>
      <LanguageSelector />
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