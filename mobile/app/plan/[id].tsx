import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '@/api';
import { colors } from '@/theme';
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
  details?: string;
}

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

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Back */}
        <TouchableOpacity style={s.back} onPress={() => router.back()}>
          <BackArrow />
          <Text style={s.backText}>{tr('plans_accent')}</Text>
        </TouchableOpacity>

        {/* Tags */}
        <View style={s.tags}>
          <Tag>{plan.category || 'GENERAL'}</Tag>
          <Tag color={
            plan.difficulty === 'beginner' ? colors.cta :
            plan.difficulty === 'intermediate' ? '#F59E0B' : colors.accent
          }>{plan.difficulty?.toUpperCase() || 'ALL LEVELS'}</Tag>
        </View>

        <Text style={s.title}>{trPlan(plan.category, 'name', plan.name)}</Text>
        <Text style={s.desc}>{trPlan(plan.category, 'desc', plan.description)}</Text>

        {/* Stats */}
        <View style={s.statsRow}>
          <View style={s.stat}>
            <Text style={s.statNum}>{plan.duration_weeks}</Text>
            <Text style={s.statLabel}>{tr('plans_weeks')}</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.stat}>
            <Text style={s.statNum}>{plan.frequency_per_week}</Text>
            <Text style={s.statLabel}>{tr('program_per_week')}</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.stat}>
            <Text style={s.statNum}>{plan.duration_weeks * plan.frequency_per_week}</Text>
            <Text style={s.statLabel}>{tr('program_sessions')}</Text>
          </View>
        </View>

        {/* Program overview — translated text takes precedence over DB field */}
        {(trPlan(plan.category, 'detail') || plan.details) ? (
          <View style={s.detailsCard}>
            <Text style={s.sectionLabel}>{tr('plan_overview')}</Text>
            <Text style={s.detailsText}>
              {trPlan(plan.category, 'detail', plan.details ?? '')}
            </Text>
          </View>
        ) : null}

        {/* What you'll need */}
        <View style={s.detailsCard}>
          <Text style={s.sectionLabel}>{tr('plan_needs')}</Text>
          <Text style={s.detailsText}>
            {plan.category?.toLowerCase().includes('gym') || plan.category?.toLowerCase().includes('hypertrophy')
              ? tr('plan_gym')
              : tr('plan_no_gym')}
          </Text>
        </View>

        <TouchableOpacity style={s.cta} onPress={() => router.push({ pathname: '/form', params: { planId: plan.id, category: plan.category } })}>
          <Text style={s.ctaText}>{tr('plan_start')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: colors.bg },
  scroll:      { padding: 20, paddingBottom: 48 },
  back:        { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  backText:    { fontSize: 16, color: colors.text },
  tags:        { flexDirection: 'row', gap: 8, marginBottom: 14 },
  title:       { fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: 10 },
  desc:        { fontSize: 15, color: colors.muted, lineHeight: 23, marginBottom: 24 },
  statsRow:    { flexDirection: 'row', backgroundColor: colors.card, borderRadius: 18, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  stat:        { flex: 1, alignItems: 'center' },
  statNum:     { fontSize: 26, fontWeight: '800', color: colors.text },
  statLabel:   { fontSize: 11, color: colors.muted, marginTop: 4 },
  statDivider: { width: 1, backgroundColor: colors.border },
  detailsCard: { backgroundColor: colors.card, borderRadius: 16, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  sectionLabel:{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: colors.muted, marginBottom: 10 },
  detailsText: { fontSize: 14, color: colors.text, lineHeight: 22 },
  cta:         { backgroundColor: colors.cta, borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginTop: 8 },
  ctaText:     { fontSize: 17, fontWeight: '700', color: colors.bg },
});
