// filepath: ./src/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

export const SUPPORTED_LOCALES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'es', label: 'Spanish', native: 'Español' },
  { code: 'pt', label: 'Portuguese', native: 'Português' },
  { code: 'fr', label: 'French', native: 'Français' },
  { code: 'de', label: 'German', native: 'Deutsch' },
  { code: 'it', label: 'Italian', native: 'Italiano' },
  { code: 'ru', label: 'Russian', native: 'Русский' },
  { code: 'zh', label: 'Chinese', native: '中文' },
  { code: 'ja', label: 'Japanese', native: '日本語' },
  { code: 'ar', label: 'Arabic', native: 'العربية' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'he', label: 'Hebrew', native: 'עברית' }
];

const requireModule = require.context('./assets/locales', true, /\.json$/);

const resources = {};

requireModule.keys().forEach((fileName) => {
  const parts = fileName.split('/');
  if (parts.length === 3) {
    const langCode = parts[1];
    const fileBaseName = parts[2].replace('.json', '');
    const content = requireModule(fileName);
    if (!resources[langCode]) {
      resources[langCode] = { translation: {} };
    }
    resources[langCode].translation[fileBaseName] = content;
  }
});

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    },
    debug: process.env.NODE_ENV === 'development'
  });

export default i18n;