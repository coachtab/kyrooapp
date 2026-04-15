import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform, NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import t, { Lang, TKey } from './translations';

const STORAGE_KEY = '@kyroo_lang';

// Detect the user's preferred language from the OS / browser.
// Returns 'de' for German speakers, 'en' for everything else.
function detectLang(): Lang {
  try {
    let tag = '';
    if (Platform.OS === 'web') {
      tag = (typeof navigator !== 'undefined' && (navigator.language || (navigator as any).userLanguage)) || '';
    } else {
      // iOS / Android locale pulled from native modules
      const settings = NativeModules.SettingsManager?.settings;
      tag =
        settings?.AppleLocale ||
        settings?.AppleLanguages?.[0] ||
        NativeModules.I18nManager?.localeIdentifier ||
        '';
    }
    return tag.toLowerCase().startsWith('de') ? 'de' : 'en';
  } catch {
    return 'en';
  }
}

interface I18nCtx {
  lang:    Lang;
  setLang: (l: Lang) => void;
  tr:      (key: TKey) => string;
  trPlan:  (category: string, field: 'name' | 'desc' | 'detail', fallback?: string) => string;
}

const I18nContext = createContext<I18nCtx>({
  lang:    'en',
  setLang: () => {},
  tr:      (key) => key,
  trPlan:  (_cat, _field, fallback) => fallback ?? '',
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(v => {
      if (v === 'en' || v === 'de') {
        setLangState(v);
      } else {
        // First visit — pick from OS/browser locale and persist so the
        // user only gets auto-detection once. Manual override still wins.
        const detected = detectLang();
        setLangState(detected);
        AsyncStorage.setItem(STORAGE_KEY, detected);
      }
    });
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    AsyncStorage.setItem(STORAGE_KEY, l);
  };

  const tr = (key: TKey): string => {
    const val = (t[lang] as Record<string, unknown>)[key];
    if (Array.isArray(val)) return val.join('\n');
    return String(val ?? key);
  };

  // Look up a plan's translated name, description, or program overview
  // from the plan's category string (e.g. "FAT LOSS" → "plan_name_FAT_LOSS").
  // Falls back to `fallback` (the English text from the API) when the key
  // is not found so new plan categories degrade gracefully.
  const trPlan = (category: string, field: 'name' | 'desc' | 'detail', fallback = ''): string => {
    if (!category) return fallback;
    const slug = category.trim().replace(/ /g, '_');
    const key  = `plan_${field}_${slug}` as TKey;
    const val  = (t[lang] as Record<string, unknown>)[key];
    if (!val) return fallback;
    return String(val);
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, tr, trPlan }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useT = () => useContext(I18nContext);
