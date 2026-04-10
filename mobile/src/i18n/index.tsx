import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import t, { Lang, TKey } from './translations';

const STORAGE_KEY = '@kyroo_lang';

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
      if (v === 'en' || v === 'de') setLangState(v);
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
