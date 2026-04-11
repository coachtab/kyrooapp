import { useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/api';
import { colors } from '@/theme';

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
}

const ICON_MAP: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  fire: 'flame',
  arm:  'barbell',
  bolt: 'flash',
  leaf: 'leaf',
  home: 'home',
  swim: 'water',
  flag: 'flag',
  run:  'walk',
  lift: 'fitness',
  zap:  'flash',
};

export default function HomeTab() {
  const router = useRouter();
  const { user } = useAuth();
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

  const firstName = user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'Athlete';
  const initials = (user?.name || user?.email || 'K')
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const hasProgram = !!data?.workout;

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Header — Welcome + name + avatar */}
        <View style={s.header}>
          <View>
            <Text style={s.welcomeLabel}>Welcome</Text>
            <Text style={s.userName}>{firstName}</Text>
          </View>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
        </View>

        {hasProgram ? (
          <>
            {/* Active program view */}
            <Text style={s.headline}>
              Today's{'\n'}
              <Text style={s.headlineAccent}>workout</Text>
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
              <Text style={s.ctaText}>View Program</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* No program — show plan picker */}
            <Text style={s.headline}>
              Let's build your{'\n'}
              <Text style={s.headlineAccent}>first plan</Text>
            </Text>
            <Text style={s.sub}>
              Pick a program below. Answer a few questions.{'\n'}Your AI coach handles the rest.
            </Text>

            {/* Plan cards */}
            <View style={s.planList}>
              {plans.map(plan => {
                const iconName = ICON_MAP[plan.icon] || 'barbell';
                const c = plan.color || colors.accent;
                return (
                  <TouchableOpacity
                    key={plan.id}
                    style={s.planCard}
                    activeOpacity={0.8}
                    onPress={() => router.push(`/plan/${plan.id}` as any)}
                  >
                    {/* Left accent bar */}
                    <View style={[s.planBar, { backgroundColor: c }]} />

                    <View style={s.planBody}>
                      <View style={s.planTop}>
                        <View style={[s.planIcon, { backgroundColor: c + '20' }]}>
                          <Ionicons name={iconName} size={18} color={c} />
                        </View>
                        <View style={s.planText}>
                          <Text style={s.planName} numberOfLines={1}>{plan.name}</Text>
                          <Text style={s.planDesc} numberOfLines={1}>{plan.description}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={colors.muted} />
                      </View>
                      <Text style={[s.planTag, { color: c }]}>
                        {plan.tag} · {plan.category}
                      </Text>
                    </View>
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
  safe:   { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },

  // Header
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
  welcomeLabel: { fontSize: 14, color: colors.muted },
  userName:     { fontSize: 24, fontWeight: '800', color: colors.text, marginTop: 2 },
  avatar:       { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  avatarText:   { fontSize: 14, fontWeight: '700', color: colors.muted },

  // Headline
  headline:       { fontSize: 28, fontWeight: '800', color: colors.text, lineHeight: 36, marginBottom: 8 },
  headlineAccent: { color: colors.accent },
  sub:            { fontSize: 14, color: colors.muted, lineHeight: 21, marginBottom: 24 },

  // Active workout
  workoutName: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 16 },
  exRow:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  exName:      { flex: 1, fontSize: 15, color: colors.text, fontWeight: '500' },
  exDetail:    { fontSize: 14, color: colors.muted, marginRight: 8 },
  cta:         { backgroundColor: colors.cta, borderRadius: 14, paddingVertical: 17, alignItems: 'center', marginTop: 24 },
  ctaText:     { fontSize: 17, fontWeight: '700', color: colors.ctaText },

  // Plan list
  planList: { gap: 10 },
  planCard: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  planBar:  { width: 4 },
  planBody: { flex: 1, padding: 14 },
  planTop:  { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  planIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  planText: { flex: 1 },
  planName: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 2 },
  planDesc: { fontSize: 12, color: colors.muted },
  planTag:  { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
});
