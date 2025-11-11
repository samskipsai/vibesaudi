import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
// Trans component is available from react-i18next for complex translations with HTML

import enTranslations from '../locales/en/translation.json';
import arSATranslations from '../locales/ar-SA/translation.json';

i18n
	.use(LanguageDetector)
	.use(initReactI18next)
	.init({
		resources: {
			en: {
				translation: enTranslations,
			},
			'ar-SA': {
				translation: arSATranslations,
			},
		},
		fallbackLng: 'en',
		defaultNS: 'translation',
		interpolation: {
			escapeValue: false, // React already escapes values
		},
		detection: {
			order: ['localStorage', 'navigator', 'htmlTag'],
			caches: ['localStorage'],
			lookupLocalStorage: 'i18nextLng',
		},
	});

export default i18n;

