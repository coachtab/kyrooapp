import { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
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

export default function HomeTab() {
  const router = useRouter();
  const { user } = useAuth();
  const { tr } = useT();
  const [data,    setData]    = useState<TodayData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api.tracking.today()
      .then(setData)
      .catch(() => setData({ habits: [], streak: 0 }))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(load);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return tr('home_morning');
    if (h < 18) return tr('home_afternoon');
    return tr('home_evening');
  };

  if (loading) return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    </SafeAreaView>
  );

  const doneHabits  = data?.habits.filter(h => h.completed).length ?? 0;
  const totalHabits = data?.habits.length ?? 0;

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.greeting}>{greeting()},</Text>
            <Text style={s.name}>{user?.name || user?.email?.split('@')[0] || 'Athlete'} 👋</Text>
          </View>
          <View style={s.streakBadge}>
            <Text style={s.streakNum}>{data?.streak ?? 0}</Text>
            <Text style={s.streakLabel}>{tr('home_streak')}</Text>
          </View>
        </View>

        {/* Today's Workout */}
        {data?.workout ? (
          <View style={s.card}>
            <View style={s.cardRow}>
              <Text style={s.cardLabel}>{tr('home_today_label')}</Text>
              {data.program && (
                <Text style={s.cardMeta}>Week {data.program.week} · Day {data.program.day}</Text>
              )}
            </View>
            <Text style={s.cardTitle}>{data.workout.name}</Text>
            <View style={s.exercises}>
              {data.workout.exercises.slice(0, 5).map((ex, i) => (
                <View key={i} style={s.exRow}>
                  <View style={s.exNum}><Text style={s.exNumText}>{i + 1}</Text></View>
                  <Text style={s.exName}>{ex.name}</Text>
                  <Text style={s.exDetail}>{ex.sets} × {ex.reps}</Text>
                </View>
              ))}
              {data.workout.exercises.length > 5 && (
                <Text style={s.more}>+{data.workout.exercises.length - 5} more exercises</Text>
              )}
            </View>
            <TouchableOpacity style={s.cta} onPress={() => router.push('/program')}>
              <Ionicons name="play" size={16} color={colors.ctaText} style={{ marginRight: 6 }} />
              <Text style={s.ctaText}>{tr('home_view_prog')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={[s.card, s.emptyCard]} onPress={() => router.push('/(tabs)/plans')}>
            <Ionicons name="barbell-outline" size={40} color={colors.muted} style={{ marginBottom: 12 }} />
            <Text style={s.emptyTitle}>{tr('home_no_prog')}</Text>
            <Text style={s.emptySub}>{tr('home_no_prog_sub')}</Text>
            <View style={s.emptyBtn}>
              <Text style={s.emptyBtnText}>Browse plans →</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Daily summary strip */}
        <View style={s.summaryRow}>
          <View style={s.summaryCard}>
            <Ionicons name="checkmark-circle-outline" size={20} color={colors.accent} />
            <Text style={s.summaryNum}>{doneHabits}/{totalHabits}</Text>
            <Text style={s.summaryLabel}>Habits</Text>
          </View>
          <View style={s.summaryCard}>
            <Ionicons name="flame-outline" size={20} color={colors.accent} />
            <Text style={s.summaryNum}>{data?.streak ?? 0}</Text>
            <Text style={s.summaryLabel}>Day streak</Text>
          </View>
          <TouchableOpacity style={[s.summaryCard, s.summaryAction]} onPress={() => router.push('/(tabs)/tracking')}>
            <Ionicons name="stats-chart-outline" size={20} color={colors.accent} />
            <Text style={s.summaryLabel}>Track today</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: colors.bg },
  scroll:       { padding: 20, paddingBottom: 40 },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  greeting:     { fontSize: 14, color: colors.muted },
  name:         { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 2 },
  streakBadge:  { backgroundColor: colors.accent + '20', borderRadius: 12, padding: 10, alignItems: 'center', minWidth: 64 },
  streakNum:    { fontSize: 22, fontWeight: '800', color: colors.accent },
  streakLabel:  { fontSize: 10, color: colors.accent, fontWeight: '600' },

  card:         { backgroundColor: colors.card, borderRadius: 18, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: colors.border },
  cardRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardLabel:    { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: colors.muted },
  cardMeta:     { fontSize: 11, color: colors.muted },
  cardTitle:    { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 16 },

  exercises:    { gap: 10, marginBottom: 4 },
  exRow:        { flexDirection: 'row', alignItems: 'center', gap: 10 },
  exNum:        { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.accent + '20', alignItems: 'center', justifyContent: 'center' },
  exNumText:    { fontSize: 11, fontWeight: '700', color: colors.accent },
  exName:       { flex: 1, fontSize: 14, color: colors.text },
  exDetail:     { fontSize: 13, color: colors.muted },
  more:         { fontSize: 13, color: colors.accent, marginTop: 4 },

  cta:          { flexDirection: 'row', backgroundColor: colors.cta, borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  ctaText:      { fontSize: 15, fontWeight: '700', color: colors.ctaText },

  emptyCard:    { alignItems: 'center', paddingVertical: 36 },
  emptyTitle:   { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 6 },
  emptySub:     { fontSize: 14, color: colors.muted, marginBottom: 20, textAlign: 'center' },
  emptyBtn:     { backgroundColor: colors.accent + '20', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  emptyBtnText: { fontSize: 14, fontWeight: '600', color: colors.accent },

  summaryRow:     { flexDirection: 'row', gap: 10 },
  summaryCard:    { flex: 1, backgroundColor: colors.card, borderRadius: 16, padding: 14, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: colors.border },
  summaryAction:  { borderColor: colors.accent + '40', backgroundColor: colors.accent + '08' },
  summaryNum:     { fontSize: 18, fontWeight: '800', color: colors.text },
  summaryLabel:   { fontSize: 11, color: colors.muted, fontWeight: '500' },
});
