import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '../assets/locales/en.json';
import es from '../assets/locales/es.json';

const resources = {
  en: { translation: en },
  es: { translation: es }
};

const deviceLocale = Intl.DateTimeFormat().resolvedOptions().locale || 'en';
const initialLanguage = deviceLocale.split('-')[0];

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // React already escapes values
    },
    compatibilityJSON: 'v3' // Required for React Native
  });

export default i18n;
