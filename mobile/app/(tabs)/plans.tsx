import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
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

// Color per category — gives each card an immediate visual identity
const CATEGORY_COLOR: Record<string, string> = {
  HYPERTROPHY:    '#E94560',  // red
  'FAT LOSS':     '#A8E10C',  // lime
  TRANSFORMATION: '#F59E0B',  // amber
  'FIRST STEPS':  '#60A5FA',  // blue
  'NO GYM':       '#A78BFA',  // purple
  'HIGH INTENSITY':'#F97316', // orange
  FUNCTIONAL:     '#34D399',  // teal
  POOL:           '#38BDF8',  // sky
};

const DIFFICULTY_COLOR: Record<string, string> = {
  beginner:     '#A8E10C',  // lime
  intermediate: '#F59E0B',  // amber
  advanced:     '#E94560',  // red
};

function categoryColor(cat: string): string {
  if (!cat) return colors.accent;
  const key = Object.keys(CATEGORY_COLOR).find(k =>
    cat.toUpperCase().includes(k.toUpperCase())
  );
  return key ? CATEGORY_COLOR[key] : colors.accent;
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

// Each chip can match against category or difficulty
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
    <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={colors.accent} size="large" />
    </View>
  );

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>
          {tr('plans_title')} <Text style={s.titleAccent}>{tr('plans_accent')}</Text>
        </Text>
        <Text style={s.sub}>{tr('plans_sub')}</Text>
      </View>

      {/* Filter chips — flex-wrap row, no horizontal scroll needed for 5 items */}
      <View style={s.chipsRow}>
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
      </View>

      {/* Plan list */}
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyText}>{tr('plans_empty')}</Text>
          </View>
        ) : (
          filtered.map(plan => {
            const cc   = categoryColor(plan.category);
            const dc   = DIFFICULTY_COLOR[plan.difficulty] ?? colors.muted;
            return (
              <TouchableOpacity
                key={plan.id}
                style={s.card}
                onPress={() => router.push(`/plan/${plan.id}` as any)}
                activeOpacity={0.85}
              >
                {/* Left accent bar — rounded left corners match card */}
                <View style={[s.accentBar, { backgroundColor: cc }]} />

                <View style={s.cardBody}>
                  {/* Category + difficulty */}
                  <View style={s.cardMeta}>
                    <Text style={[s.categoryLabel, { color: cc }]}>
                      {plan.category?.toUpperCase() || 'GENERAL'}
                    </Text>
                    <View style={s.diffRow}>
                      <View style={[s.diffDot, { backgroundColor: dc }]} />
                      <Text style={[s.diffText, { color: dc }]}>
                        {plan.difficulty?.toUpperCase() || 'ALL LEVELS'}
                      </Text>
                    </View>
                  </View>

                  {/* Name + chevron */}
                  <View style={s.nameRow}>
                    <Text style={s.planName} numberOfLines={2}>
                      {trPlan(plan.category, 'name', plan.name)}
                    </Text>
                    <Text style={[s.chevron, { color: cc }]}>›</Text>
                  </View>

                  {/* Description */}
                  <Text style={s.planDesc} numberOfLines={2}>
                    {trPlan(plan.category, 'desc', plan.description)}
                  </Text>

                  {/* Stats strip */}
                  <View style={s.statsStrip}>
                    <View style={s.statCell}>
                      <Text style={[s.statNum, { color: cc }]}>{plan.duration_weeks}</Text>
                      <Text style={s.statLabel}>{tr('plans_weeks')}</Text>
                    </View>
                    <View style={s.statSep} />
                    <View style={s.statCell}>
                      <Text style={[s.statNum, { color: cc }]}>{plan.frequency_per_week}</Text>
                      <Text style={s.statLabel}>{tr('plans_per_week')}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: colors.bg },

  // Header
  header:       { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  title:        { fontSize: 26, fontWeight: '800', color: colors.text },
  titleAccent:  { color: colors.accent },
  sub:          { fontSize: 13, color: colors.muted, marginTop: 3 },

  // Filter chips — wrap row so all 5 fit without scrolling
  chipsRow:     { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 6, paddingBottom: 14 },
  chip:         { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: colors.card2 },
  chipActive:   { backgroundColor: colors.cta },
  chipText:     { fontSize: 12, fontWeight: '600', color: colors.muted },
  chipTextActive:{ fontSize: 12, fontWeight: '800', color: colors.bg },

  // List
  scroll:       { paddingHorizontal: 16, paddingBottom: 40 },
  empty:        { alignItems: 'center', paddingTop: 60 },
  emptyText:    { color: colors.muted, fontSize: 16 },

  // Card
  card:         { flexDirection: 'row', backgroundColor: colors.card, borderRadius: 16,
                  marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  accentBar:    { width: 4, borderTopLeftRadius: 15, borderBottomLeftRadius: 15 },
  cardBody:     { flex: 1, padding: 16 },

  // Meta row
  cardMeta:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  categoryLabel:{ fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  diffRow:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  diffDot:      { width: 6, height: 6, borderRadius: 3 },
  diffText:     { fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },

  // Name
  nameRow:      { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 6 },
  planName:     { flex: 1, fontSize: 17, fontWeight: '800', color: colors.text, lineHeight: 23 },
  chevron:      { fontSize: 24, lineHeight: 26, fontWeight: '300' },

  // Description
  planDesc:     { fontSize: 13, color: colors.muted, lineHeight: 19, marginBottom: 14 },

  // Stats strip
  statsStrip:   { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12, gap: 20 },
  statCell:     { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  statNum:      { fontSize: 15, fontWeight: '800' },
  statLabel:    { fontSize: 11, color: colors.muted },
  statSep:      { width: 1, backgroundColor: colors.border },
});
