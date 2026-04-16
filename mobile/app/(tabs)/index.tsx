import { useState, useCallback, useRef, useMemo, useDeferredValue } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { api, clearApiCache } from '@/api';
import { colors, CATEGORY_GRADIENT, categoryColor } from '@/theme';
import { useT } from '@/i18n';
import { AvatarButton } from '../_avatar';

interface Plan {
  id: number;
  name: string;
  description: string;
  tag: string;
  category: string;
  icon: string;
  color: string;
  difficulty?: string;
}

const ICON_MAP: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  fire:   'flame',
  arm:    'barbell',
  bolt:   'flash',
  leaf:   'leaf',
  home:   'home',
  swim:   'water',
  flag:   'flag',
  run:    'walk',
  lift:   'fitness',
  zap:    'flash',
  flower: 'flower',
  body:   'accessibility',
  trophy: 'trophy',
  shield: 'shield-checkmark',
};

const DIFFICULTY_LABEL: Record<string, { en: string; de: string }> = {
  beginner:     { en: 'Beginner',     de: 'Anfänger'        },
  intermediate: { en: 'Intermediate', de: 'Mittel'          },
  advanced:     { en: 'Advanced',     de: 'Fortgeschritten' },
};

const DEFAULT_GRADIENT: [string, string] = ['#6B7280', '#4B5563'];

export default function HomeTab() {
  const router = useRouter();
  const { trPlan, lang } = useT();
  const [plans,      setPlans]      = useState<Plan[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search,     setSearch]     = useState('');
  const [focused,    setFocused]    = useState(false);
  const inputRef = useRef<TextInput>(null);

  const fetchData = useCallback(async () => {
    const p = await api.plans.list().catch(() => []);
    const sorted = (p as Plan[]).slice().sort((a, b) => a.name.localeCompare(b.name));
    setPlans(sorted);
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    clearApiCache();
    try { await fetchData(); } finally { setRefreshing(false); }
  }, [fetchData]);

  useFocusEffect(load);

  // All hooks MUST be above any conditional return — React requires
  // the same hook count on every render.
  const deferredSearch = useDeferredValue(search);
  const filtered = useMemo(() => {
    const q = deferredSearch.toLowerCase().trim();
    if (!q) return plans;
    return plans.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q)
    );
  }, [plans, deferredSearch]);

  if (loading) return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.center}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} colors={[colors.accent]} />}
      >

        {/* Title + avatar */}
        <View style={s.titleRow}>
          <Text style={s.title}>
            {lang === 'de' ? 'Entdecken' : 'Discover'}
          </Text>
          <AvatarButton />
        </View>

        {/* Apple-style search bar — no border, filled, rounded pill */}
        <View style={s.searchRow}>
          <TouchableOpacity
            style={s.searchBar}
            activeOpacity={1}
            onPress={() => inputRef.current?.focus()}
          >
            <Ionicons name="search" size={17} color="#98989F" />
            <TextInput
              ref={inputRef}
              style={s.searchInput}
              placeholder={lang === 'de'
                ? 'Pläne, Kategorien und mehr'
                : 'Plans, categories and more'}
              placeholderTextColor="#98989F"
              value={search}
              onChangeText={setSearch}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')} hitSlop={12}>
                <Ionicons name="close-circle" size={17} color="#98989F" />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
          {(focused || search.length > 0) && (
            <TouchableOpacity
              onPress={() => { setSearch(''); inputRef.current?.blur(); }}
              hitSlop={10}
            >
              <Text style={s.cancelBtn}>
                {lang === 'de' ? 'Abbrechen' : 'Cancel'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Section header */}
        <View style={s.browseRow}>
          <Text style={s.browseTitle}>
            {lang === 'de' ? 'Alle Pläne' : 'Browse'}
          </Text>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </View>

        {/* Card grid — 2-column wrap, locked to 50% width each */}
        <View style={s.grid}>
          {filtered.map(plan => {
            const gradient = CATEGORY_GRADIENT[plan.category] || DEFAULT_GRADIENT;
            const iconName = ICON_MAP[plan.icon] || 'barbell';
            const displayName = trPlan(plan.category, 'name', plan.name);
            const diff = DIFFICULTY_LABEL[(plan.difficulty || '').toLowerCase()];
            const diffLabel = diff ? (lang === 'de' ? diff.de : diff.en) : '';
            return (
              <TouchableOpacity
                key={plan.id}
                style={s.cardWrap}
                activeOpacity={0.9}
                onPress={() => router.push(`/plan/${plan.id}` as any)}
              >
                <LinearGradient
                  colors={gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={s.card}
                >
                  <View style={s.cardTop}>
                    {diffLabel ? (
                      <View style={s.diffPill}>
                        <Text style={s.diffText}>{diffLabel}</Text>
                      </View>
                    ) : <View />}
                    <Ionicons name={iconName} size={32} color="rgba(255,255,255,0.9)" />
                  </View>
                  <Text style={s.cardName} numberOfLines={2}>{displayName}</Text>
                </LinearGradient>
              </TouchableOpacity>
            );
          })}
        </View>

        {filtered.length === 0 && (
          <View style={s.emptyWrap}>
            <Ionicons name="search-outline" size={40} color={colors.muted} style={{ opacity: 0.5 }} />
            <Text style={s.emptyTitle}>
              {lang === 'de' ? 'Nichts gefunden' : 'No results'}
            </Text>
            <Text style={s.emptySub}>
              {lang === 'de'
                ? 'Versuche einen anderen Suchbegriff'
                : 'Try a different search term'}
            </Text>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16, overflow: 'hidden' },

  // Title — large, bold, like Apple's "Search"
  titleRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginBottom:   14,
    paddingLeft:    4,
  },
  title: {
    fontSize:   34,
    fontWeight: '800',
    color:      colors.text,
  },

  // Search — Apple-style filled pill, no border
  searchRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           12,
    marginBottom:  24,
  },
  searchBar: {
    flex:              1,
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   '#1C1C1E',
    borderRadius:      12,
    paddingHorizontal: 12,
    height:            40,
    gap:               8,
  },
  searchInput: {
    flex:            1,
    fontSize:        16,
    color:           colors.text,
    padding:         0,
    borderWidth:     0,
    backgroundColor: 'transparent',
    outlineStyle:    'none',
  } as any,
  cancelBtn: {
    fontSize:   16,
    fontWeight: '500',
    color:      colors.accent,
  },

  // Browse header
  browseRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           4,
    marginBottom:  14,
    paddingLeft:   4,
  },
  browseTitle: {
    fontSize:   20,
    fontWeight: '800',
    color:      colors.text,
  },

  // Grid — 2-column wrap, each card locked to ~48% width
  grid: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           10,
  },
  cardWrap: {
    width:    '48.5%' as any,
    overflow: 'hidden',
  },
  card: {
    borderRadius:    18,
    padding:         14,
    minHeight:       140,
    justifyContent:  'space-between',
    overflow:        'hidden',
  },
  cardTop: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
  },
  diffPill: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 8,
    paddingVertical:   3,
    borderRadius:      8,
  },
  diffText: {
    fontSize:   10,
    fontWeight: '700',
    color:      'rgba(255,255,255,0.9)',
    letterSpacing: 0.5,
  },
  cardName: {
    fontSize:   16,
    fontWeight: '800',
    color:      '#fff',
    lineHeight: 21,
    marginTop:  6,
  },

  // Empty state
  emptyWrap:  { alignItems: 'center', gap: 8, marginTop: 48 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  emptySub:   { fontSize: 14, color: colors.muted },
});
