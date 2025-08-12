// ./src/components/Auth/LanguageSelector.jsx
import { useTranslation } from 'react-i18next';
import { Button, Box } from '@mui/material';

const LanguageSelector = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <Box sx={{ textAlign: 'right', p: 2 }}>
      <Button
        onClick={() => changeLanguage('en')}
        variant={i18n.language === 'en' ? 'contained' : 'outlined'}
        size="small"
        sx={{ mr: 1 }}
      >
        EN
      </Button>
      <Button
        onClick={() => changeLanguage('es')}
        variant={i18n.language === 'es' ? 'contained' : 'outlined'}
        size="small"
      >
        ES
      </Button>
    </Box>
  );
};

export default LanguageSelector;