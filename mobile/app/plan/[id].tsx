import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/api';
import { colors, categoryColor } from '@/theme';
import { useT } from '@/i18n';
import { BackArrow, Tag } from '../_components';

interface Plan {
  id: number;
  name: string;
  description: string;
  category: string;
  difficulty: string;
  duration_weeks: number;
  frequency_per_week: number;
  icon?: string;
  color?: string;
  details?: string;
}

const ICON_MAP: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  fire: 'flame-outline',
  arm:  'barbell-outline',
  bolt: 'flash-outline',
  leaf: 'leaf-outline',
  home: 'home-outline',
  swim: 'water-outline',
  flag: 'flag-outline',
  run:  'walk-outline',
  lift: 'fitness-outline',
  zap:  'flash-outline',
  flower: 'flower-outline',
  body:   'accessibility-outline',
  trophy: 'trophy-outline',
  shield: 'shield-checkmark-outline',
};

// Imported from theme — each category gets its own color.

export default function PlanDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router  = useRouter();
  const { tr, trPlan } = useT();
  const [plan,    setPlan]    = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.plans.get(Number(id))
      .then(setPlan)
      .catch(() => router.back())
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={colors.accent} size="large" />
    </View>
  );

  if (!plan) return null;

  const iconName = ICON_MAP[plan.icon || ''] || 'barbell-outline';
  const diffColor = categoryColor(plan.category);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Header — title + close button */}
        <View style={s.header}>
          <Text style={s.headerTitle} numberOfLines={1}>
            {trPlan(plan.category, 'name', plan.name)}
          </Text>
          <TouchableOpacity
            style={[s.closeBtn, { borderColor: diffColor, backgroundColor: diffColor + '18' }]}
            onPress={() => router.replace('/(tabs)')}
            hitSlop={12}
          >
            <Ionicons name="close" size={20} color={diffColor} />
          </TouchableOpacity>
        </View>

        {/* Icon + tags — inline row, same icon size as home list */}
        <View style={s.tags}>
          <Ionicons name={iconName} size={20} color={diffColor} />
          <Tag>{plan.category || 'GENERAL'}</Tag>
          <Tag color={diffColor}>{plan.difficulty?.toUpperCase() || 'ALL LEVELS'}</Tag>
        </View>

        <Text style={s.title}>{trPlan(plan.category, 'name', plan.name)}</Text>
        <Text style={s.desc}>{trPlan(plan.category, 'desc', plan.description)}</Text>

        {/* Compact commitment strip */}
        <View style={s.statsStrip}>
          <View style={s.statItem}>
            <Ionicons name="calendar-outline" size={16} color={diffColor} />
            <Text style={s.statValue}>
              <Text style={[s.statBold, { color: diffColor }]}>{plan.duration_weeks}</Text>
              <Text style={s.statUnit}> {tr('plans_weeks')}</Text>
            </Text>
          </View>
          <Text style={[s.statDot, { color: diffColor }]}>·</Text>
          <View style={s.statItem}>
            <Ionicons name="repeat-outline" size={16} color={diffColor} />
            <Text style={s.statValue}>
              <Text style={[s.statBold, { color: diffColor }]}>{plan.frequency_per_week}×</Text>
              <Text style={s.statUnit}> /wk</Text>
            </Text>
          </View>
          <Text style={[s.statDot, { color: diffColor }]}>·</Text>
          <View style={s.statItem}>
            <Ionicons name="flag-outline" size={16} color={diffColor} />
            <Text style={s.statValue}>
              <Text style={[s.statBold, { color: diffColor }]}>{plan.duration_weeks * plan.frequency_per_week}</Text>
              <Text style={s.statUnit}> {tr('program_sessions')}</Text>
            </Text>
          </View>
        </View>

        {/* Overview */}
        {(trPlan(plan.category, 'detail') || plan.details) ? (
          <View style={[s.detailsCard, { borderColor: diffColor + '60' }]}>
            <Text style={s.sectionLabel}>{tr('plan_overview')}</Text>
            <Text style={s.detailsText}>
              {trPlan(plan.category, 'detail', plan.details ?? '')}
            </Text>
          </View>
        ) : null}

        {/* What you'll need */}
        <View style={[s.detailsCard, { borderColor: diffColor + '60' }]}>
          <Text style={s.sectionLabel}>{tr('plan_needs')}</Text>
          <Text style={s.detailsText}>
            {plan.category?.toLowerCase().includes('gym') || plan.category?.toLowerCase().includes('hypertrophy')
              ? tr('plan_gym')
              : tr('plan_no_gym')}
          </Text>
        </View>

        {/* CTA — matches difficulty color */}
        <TouchableOpacity
          style={[s.cta, { backgroundColor: diffColor }]}
          onPress={() => router.push({ pathname: '/form', params: { planId: plan.id, category: plan.category, difficulty: plan.difficulty } })}
        >
          <Text style={s.ctaText}>{tr('plan_start')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: colors.bg },
  scroll:      { padding: 20, paddingBottom: 48 },
  header: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginBottom:   16,
  },
  headerTitle: {
    flex:       1,
    fontSize:   13,
    fontWeight: '800',
    color:      colors.muted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  closeBtn: {
    width:           36,
    height:          36,
    borderRadius:    18,
    borderWidth:     1.5,
    borderColor:     colors.border,
    backgroundColor: '#0d0d0d',
    alignItems:      'center',
    justifyContent:  'center',
  },

  tags:        { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  title:       { fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: 10 },
  desc:        { fontSize: 15, color: colors.muted, lineHeight: 23, marginBottom: 24 },

  statsStrip:  {
    flexDirection:    'row',
    alignItems:       'center',
    justifyContent:   'center',
    flexWrap:         'wrap',
    gap:              10,
    backgroundColor:  '#0d0d0d',
    borderRadius:     12,
    paddingVertical:  12,
    paddingHorizontal: 14,
    marginBottom:     20,
    borderWidth:      1,
    borderColor:      colors.border,
  },
  statItem:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statValue:   { fontSize: 14 },
  statBold:    { fontSize: 15, fontWeight: '800' },
  statUnit:    { fontSize: 13, color: colors.muted },
  statDot:     { fontSize: 18, fontWeight: '700' },

  detailsCard: { backgroundColor: colors.card, borderRadius: 16, padding: 18, marginBottom: 12, borderWidth: 1.5 },
  sectionLabel:{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: colors.muted, marginBottom: 12 },
  detailsText: { fontSize: 14, color: colors.text, lineHeight: 22 },

  cta:         { borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginTop: 8 },
  ctaText:     { fontSize: 17, fontWeight: '700', color: '#fff' },
});
