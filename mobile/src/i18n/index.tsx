import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform, NativeModules, View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import t, { Lang, TKey } from './translations';

const STORAGE_KEY          = '@kyroo_lang';
const STORAGE_EXPLICIT_KEY = '@kyroo_lang_explicit';

// Returns 'de' or 'en' if the user's locale clearly maps to a supported
// language, or null if it's something else (fr, es, pl, …) — in which
// case we'll ask the user to pick.
function detectSupportedLang(): Lang | null {
  try {
    const tags: string[] = [];
    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined') {
        if (Array.isArray(navigator.languages)) tags.push(...navigator.languages);
        if (navigator.language)                 tags.push(navigator.language);
        const ul = (navigator as any).userLanguage;
        if (ul) tags.push(ul);
      }
    } else {
      const settings = NativeModules.SettingsManager?.settings;
      if (settings?.AppleLocale)         tags.push(settings.AppleLocale);
      if (settings?.AppleLanguages?.[0]) tags.push(settings.AppleLanguages[0]);
      if (NativeModules.I18nManager?.localeIdentifier) {
        tags.push(NativeModules.I18nManager.localeIdentifier);
      }
    }
    for (const raw of tags) {
      const tag = raw.toLowerCase();
      if (tag.startsWith('de')) return 'de';
      if (tag.startsWith('en')) return 'en';
    }
    return null;
  } catch {
    return null;
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
  const [askPick, setAskPick] = useState(false);

  useEffect(() => {
    (async () => {
      const [stored, explicit] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(STORAGE_EXPLICIT_KEY),
      ]);
      // User already chose manually — lock it.
      if (explicit === '1' && (stored === 'en' || stored === 'de')) {
        setLangState(stored);
        return;
      }
      // No explicit choice yet — try to detect from the browser / OS.
      const detected = detectSupportedLang();
      if (detected) {
        setLangState(detected);
        AsyncStorage.setItem(STORAGE_KEY, detected);
      } else {
        // Locale isn't one we support — show the first-run picker so
        // the user can pick for themselves instead of silently defaulting.
        setAskPick(true);
      }
    })();
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    AsyncStorage.setItem(STORAGE_KEY, l);
    AsyncStorage.setItem(STORAGE_EXPLICIT_KEY, '1');
  };

  const pickLang = (l: Lang) => {
    setLang(l);
    setAskPick(false);
  };

  const tr = (key: TKey): string => {
    const val = (t[lang] as Record<string, unknown>)[key];
    if (Array.isArray(val)) return val.join('\n');
    return String(val ?? key);
  };

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
      <Modal visible={askPick} transparent animationType="fade" statusBarTranslucent>
        <View style={ls.backdrop}>
          <View style={ls.card}>
            <Text style={ls.brand}>KYROO</Text>
            <Text style={ls.title}>Choose your language</Text>
            <Text style={ls.subtitle}>Wähle deine Sprache</Text>

            <TouchableOpacity style={ls.btn} activeOpacity={0.85} onPress={() => pickLang('en')}>
              <Text style={ls.flag}>🇬🇧</Text>
              <Text style={ls.btnText}>English</Text>
            </TouchableOpacity>
            <TouchableOpacity style={ls.btn} activeOpacity={0.85} onPress={() => pickLang('de')}>
              <Text style={ls.flag}>🇩🇪</Text>
              <Text style={ls.btnText}>Deutsch</Text>
            </TouchableOpacity>

            <Text style={ls.hint}>You can change this later in Profile → Language</Text>
          </View>
        </View>
      </Modal>
    </I18nContext.Provider>
  );
}

export const useT = () => useContext(I18nContext);

const ACCENT = '#E94560';
const ls = StyleSheet.create({
  backdrop: {
    flex:            1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems:      'center',
    justifyContent:  'center',
    padding:         24,
  },
  card: {
    width:           '100%' as any,
    maxWidth:        380,
    backgroundColor: '#0d0d0d',
    borderRadius:    20,
    borderWidth:     1.5,
    borderColor:     '#2A2A2E',
    padding:         28,
    alignItems:      'center',
  },
  brand: {
    fontSize:      14,
    fontWeight:    '800',
    letterSpacing: 4,
    color:         '#F5F5F5',
    marginBottom:  18,
  },
  title: {
    fontSize:   20,
    fontWeight: '800',
    color:      '#F5F5F5',
    textAlign:  'center',
  },
  subtitle: {
    fontSize:     14,
    color:        '#6B7280',
    textAlign:    'center',
    marginTop:    4,
    marginBottom: 24,
  },
  btn: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             12,
    width:           '100%' as any,
    paddingVertical: 14,
    borderRadius:    12,
    borderWidth:     1.5,
    borderColor:     ACCENT,
    backgroundColor: 'rgba(233, 69, 96, 0.08)',
    marginBottom:    10,
  },
  flag:    { fontSize: 22 },
  btnText: { fontSize: 16, fontWeight: '800', color: '#F5F5F5', letterSpacing: 0.3 },
  hint:    { fontSize: 11, color: '#6B7280', textAlign: 'center', marginTop: 12 },
});
