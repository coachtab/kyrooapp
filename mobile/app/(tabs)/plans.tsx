import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/api';
import { colors } from '@/theme';
import { useT } from '@/i18n';

interface Plan {
  id: number;
  name: string;
  description: string;
  category: string;
  difficulty: string;
  duration_weeks: number;
  frequency_per_week: number;
}

const FILTERS = ['All', 'Hypertrophy', 'Fat Loss', 'Beginner', 'No Gym'] as const;
type FilterKey = typeof FILTERS[number];
const FILTER_I18N: Record<FilterKey, string> = {
  'All':         'plans_filter_all',
  'Hypertrophy': 'plans_filter_hypertrophy',
  'Fat Loss':    'plans_filter_fat_loss',
  'Beginner':    'plans_filter_beginner',
  'No Gym':      'plans_filter_no_gym',
};

type FilterDef = { field: 'category' | 'difficulty'; value: string };
const FILTER_MAP: Record<string, FilterDef> = {
  'Hypertrophy': { field: 'category',   value: 'hypertrophy' },
  'Fat Loss':    { field: 'category',   value: 'fat loss' },
  'Beginner':    { field: 'difficulty', value: 'beginner' },
  'No Gym':      { field: 'category',   value: 'no gym' },
};

export default function PlansTab() {
  const router = useRouter();
  const { tr, trPlan } = useT();
  const [plans,   setPlans]   = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState<string>('All');

  useEffect(() => {
    api.plans.list()
      .then(setPlans)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'All'
    ? plans
    : (() => {
        const def = FILTER_MAP[filter];
        if (!def) return plans;
        return plans.filter(p =>
          (p[def.field] ?? '').toLowerCase().includes(def.value)
        );
      })();

  if (loading) return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.center}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      {/* Header — Ochy centered bold */}
      <View style={s.header}>
        <Text style={s.title}>
          Choose your <Text style={s.accent}>plan</Text>
        </Text>
        <Text style={s.sub}>{tr('plans_sub')}</Text>
      </View>

      {/* Filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipsScroll}>
        {FILTERS.map(cat => {
          const active = filter === cat;
          return (
            <TouchableOpacity
              key={cat}
              style={[s.chip, active && s.chipActive]}
              onPress={() => setFilter(cat)}
              activeOpacity={0.75}
            >
              <Text style={[s.chipText, active && s.chipTextActive]}>
                {tr(FILTER_I18N[cat as FilterKey])}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Plan list — Ochy clean rows */}
      <ScrollView contentContainerStyle={s.list} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <View style={s.emptyBlock}>
            <Text style={s.emptyText}>{tr('plans_empty')}</Text>
          </View>
        ) : (
          filtered.map(plan => (
            <TouchableOpacity
              key={plan.id}
              style={s.planRow}
              onPress={() => router.push(`/plan/${plan.id}` as any)}
              activeOpacity={0.7}
            >
              <View style={s.planLeft}>
                <Text style={s.planName} numberOfLines={1}>
                  {trPlan(plan.category, 'name', plan.name)}
                </Text>
                <Text style={s.planMeta}>
                  {plan.category?.toUpperCase() || 'GENERAL'}
                  {'  ·  '}
                  {plan.duration_weeks} weeks · {plan.frequency_per_week}×/week
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Header
  header: { paddingHorizontal: 28, paddingTop: 40, paddingBottom: 16 },
  title:  { fontSize: 28, fontWeight: '800', color: colors.text, textAlign: 'center' },
  accent: { color: colors.accent },
  sub:    { fontSize: 14, color: colors.muted, textAlign: 'center', marginTop: 6 },

  // Chips
  chipsScroll:  { paddingHorizontal: 24, gap: 8, paddingBottom: 16 },
  chip:         { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.border },
  chipActive:   { backgroundColor: colors.cta, borderColor: colors.cta },
  chipText:     { fontSize: 13, fontWeight: '600', color: colors.muted },
  chipTextActive:{ color: colors.ctaText, fontWeight: '700' },

  // List
  list:       { paddingHorizontal: 28, paddingBottom: 40 },
  emptyBlock: { alignItems: 'center', paddingTop: 60 },
  emptyText:  { color: colors.muted, fontSize: 15 },

  // Plan row — Ochy list item
  planRow:  { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: colors.border },
  planLeft: { flex: 1 },
  planName: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 4 },
  planMeta: { fontSize: 12, color: colors.muted, letterSpacing: 0.3 },
});
