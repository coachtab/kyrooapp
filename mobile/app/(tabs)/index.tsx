import { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/api';
import { colors } from '@/theme';
import { useT } from '@/i18n';

interface TodayData {
  program?: { name: string; week: number; day: number };
  workout?: { name: string; exercises: { name: string; sets: number; reps: string }[] };
  habits: { id: number; name: string; completed: boolean }[];
  mood?: number;
  streak: number;
}

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

const DIFFICULTY_COLOR: Record<string, string> = {
  beginner:     '#4CAF50',  // green
  intermediate: '#F59E0B',  // amber
  advanced:     '#E94560',  // red
};

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

export default function HomeTab() {
  const router = useRouter();
  const { tr } = useT();
  const [data,    setData]    = useState<TodayData | null>(null);
  const [plans,   setPlans]   = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.tracking.today().catch(() => ({ habits: [], streak: 0 })),
      api.plans.list().catch(() => []),
    ]).then(([t, p]) => {
      setData(t as TodayData);
      setPlans(p as Plan[]);
    }).finally(() => setLoading(false));
  }, []);

  useFocusEffect(load);

  if (loading) return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.center}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    </SafeAreaView>
  );

  const hasProgram = !!data?.workout;

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {hasProgram ? (
          <>
            {/* Active program view */}
            <Text style={s.headline}>
              {tr('home_todays')}
              <Text style={s.headlineAccent}>{tr('home_workout')}</Text>
            </Text>
            {data?.program && (
              <Text style={s.sub}>
                {data.program.name} · Week {data.program.week}, Day {data.program.day}
              </Text>
            )}

            <Text style={s.workoutName}>{data?.workout?.name}</Text>

            {data?.workout?.exercises.map((ex, i) => (
              <View key={i} style={s.exRow}>
                <Text style={s.exName}>{ex.name}</Text>
                <Text style={s.exDetail}>{ex.sets} × {ex.reps}</Text>
                <Ionicons name="chevron-forward" size={14} color={colors.border} />
              </View>
            ))}

            <TouchableOpacity style={s.cta} onPress={() => router.push('/program')} activeOpacity={0.85}>
              <Text style={s.ctaText}>{tr('home_view_prog')}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* No program — Ochy IMG_7774 style */}
            <Text style={s.headline}>
              {tr('home_headline_1')}
              <Text style={s.headlineAccent}>{tr('home_headline_2')}</Text>
              {tr('home_headline_3')}
            </Text>
            <Text style={s.sub}>{tr('home_choose_plan')}</Text>

            {/* Plan rows — full border colored by difficulty */}
            <View style={s.planList}>
              {plans.map(plan => {
                const iconName = ICON_MAP[plan.icon] || 'barbell-outline';
                const diffColor = DIFFICULTY_COLOR[(plan.difficulty || '').toLowerCase()] || colors.border;
                return (
                  <TouchableOpacity
                    key={plan.id}
                    style={[s.planRow, { borderColor: diffColor }]}
                    activeOpacity={0.7}
                    onPress={() => router.push(`/plan/${plan.id}` as any)}
                  >
                    <Ionicons name={iconName} size={20} color={diffColor} style={s.planRowIcon} />
                    <Text style={s.planRowName} numberOfLines={2}>{plan.name}</Text>
                    <Ionicons name="chevron-forward" size={18} color={colors.muted} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 28, paddingTop: 48, paddingBottom: 40 },

  // Headline — Ochy bold italic style
  headline:       { fontSize: 26, fontWeight: '800', color: colors.text, lineHeight: 34, marginBottom: 10, fontStyle: 'italic' },
  headlineAccent: { color: colors.accent },
  sub:            { fontSize: 15, color: colors.muted, marginBottom: 32 },

  // Plan rows — full border colored by difficulty
  planList:    { gap: 10 },
  planRow:     {
    flexDirection:   'row',
    alignItems:      'center',
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderWidth:     1.5,
    borderRadius:    12,
    backgroundColor: '#0d0d0d',
  },
  planRowIcon: { width: 28, marginRight: 14 },
  planRowName: { flex: 1, fontSize: 16, color: colors.text, fontWeight: '500' },

  // Active workout
  workoutName: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 16 },
  exRow:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  exName:      { flex: 1, fontSize: 15, color: colors.text, fontWeight: '500' },
  exDetail:    { fontSize: 14, color: colors.muted, marginRight: 8 },
  cta:         { backgroundColor: colors.cta, borderRadius: 14, paddingVertical: 17, alignItems: 'center', marginTop: 24 },
  ctaText:     { fontSize: 17, fontWeight: '700', color: colors.ctaText },
});
