import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';

import en from './translations/en.json';
import hi from './translations/hi.json';
import es from './translations/es.json';
import ar from './translations/ar.json';
import fr from './translations/fr.json';
import mr from './translations/mr.json';
import te from './translations/te.json';
import kn from './translations/kn.json';
import ta from './translations/ta.json';
import bn from './translations/bn.json';
import gu from './translations/gu.json';
import pa from './translations/pa.json';
import ml from './translations/ml.json';
import zh from './translations/zh.json';
import ja from './translations/ja.json';
import pt from './translations/pt.json';

const STORAGE_KEY = '@app_language';

const resources = {
    en: { translation: en },
    hi: { translation: hi },
    es: { translation: es },
    ar: { translation: ar },
    fr: { translation: fr },
    mr: { translation: mr },
    te: { translation: te },
    kn: { translation: kn },
    ta: { translation: ta },
    bn: { translation: bn },
    gu: { translation: gu },
    pa: { translation: pa },
    ml: { translation: ml },
    zh: { translation: zh },
    ja: { translation: ja },
    pt: { translation: pt },
};

const languageDetector: any = {
    type: 'languageDetector',
    async: true,
    detect: async (callback: (lang: string) => void) => {
        const savedLanguage = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedLanguage) {
            return callback(savedLanguage);
        }
        callback('en');
    },
    init: () => { },
    cacheUserLanguage: async (language: string) => {
        await AsyncStorage.setItem(STORAGE_KEY, language);
    },
};

i18n
    .use(languageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en',
        compatibilityJSON: 'v4',
        interpolation: {
            escapeValue: false,
        },
        react: {
            useSuspense: false,
        },
    });

// Handle RTL for Arabic and force LTR for all other languages
export const changeLanguage = async (lng: string) => {
    await i18n.changeLanguage(lng);
    await AsyncStorage.setItem(STORAGE_KEY, lng);

    const isRTL = lng === 'ar';

    // Always explicitly set RTL state
    I18nManager.allowRTL(isRTL);
    I18nManager.forceRTL(isRTL);

    // If the RTL direction actually changed, we must reload the app
    // because React Native caches the layout direction at render time
    if (I18nManager.isRTL !== isRTL) {
        // Use a short delay to let state persist, then reload the JS bundle
        setTimeout(() => {
            const { NativeModules } = require('react-native');
            if (NativeModules.DevSettings) {
                NativeModules.DevSettings.reload();
            }
        }, 300);
    }
};

export default i18n;
