import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from './assets/locales/en.json';
import esTranslations from './assets/locales/es.json';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: enTranslations },
    es: { translation: esTranslations }
  },
  lng: 'es', // Idioma por defecto
  fallbackLng: 'en',
  interpolation: { escapeValue: false }
});

export default i18n;