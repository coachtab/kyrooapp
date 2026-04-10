import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
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

  useEffect(() => {
    api.tracking.today()
      .then(setData)
      .catch(() => setData({ habits: [], streak: 0 }))
      .finally(() => setLoading(false));
  }, []);

  const moods = ['😴', '😐', '🙂', '😄', '🔥'];

  if (loading) return (
    <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={colors.accent} size="large" />
    </View>
  );

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return tr('home_morning');
    if (h < 18) return tr('home_afternoon');
    return tr('home_evening');
  };

  return (
    <SafeAreaView style={s.safe}>
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
              {data.program && <Text style={s.cardMeta}>Week {data.program.week} · Day {data.program.day}</Text>}
            </View>
            <Text style={s.cardTitle}>{data.workout.name}</Text>
            <View style={s.exercises}>
              {data.workout.exercises.slice(0, 4).map((ex, i) => (
                <View key={i} style={s.exRow}>
                  <Text style={s.exName}>{ex.name}</Text>
                  <Text style={s.exDetail}>{ex.sets} × {ex.reps}</Text>
                </View>
              ))}
              {data.workout.exercises.length > 4 && (
                <Text style={s.more}>+{data.workout.exercises.length - 4} more</Text>
              )}
            </View>
            <TouchableOpacity style={s.cta} onPress={() => router.push('/program')}>
              <Text style={s.ctaText}>{tr('home_view_prog')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={[s.card, s.emptyCard]} onPress={() => router.push('/(tabs)/plans')}>
            <Text style={s.emptyEmoji}>🏋️</Text>
            <Text style={s.emptyTitle}>{tr('home_no_prog')}</Text>
            <Text style={s.emptySub}>{tr('home_no_prog_sub')}</Text>
          </TouchableOpacity>
        )}

        {/* Mood check */}
        <View style={s.card}>
          <Text style={s.cardLabel}>{tr('home_mood_label')}</Text>
          <View style={s.moods}>
            {moods.map((m, i) => (
              <TouchableOpacity
                key={i}
                style={[s.moodBtn, data?.mood === i && s.moodActive]}
                onPress={() => api.tracking.saveMood(i).then(() => setData(d => d ? { ...d, mood: i } : d))}
              >
                <Text style={s.moodEmoji}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Habits */}
        {(data?.habits?.length ?? 0) > 0 && (
          <View style={s.card}>
            <Text style={s.cardLabel}>{tr('home_habits_label')}</Text>
            <View style={s.habits}>
              {data!.habits.map(h => (
                <TouchableOpacity
                  key={h.id}
                  style={[s.habitRow, h.completed && s.habitDone]}
                  onPress={() => api.tracking.toggleHabit(h.id).then(r =>
                    setData(d => d ? { ...d, habits: d.habits.map(x => x.id === h.id ? { ...x, completed: r.completed } : x) } : d)
                  )}
                >
                  <View style={[s.check, h.completed && s.checkDone]}>
                    {h.completed && <Text style={s.checkMark}>✓</Text>}
                  </View>
                  <Text style={[s.habitName, h.completed && s.habitNameDone]}>{h.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
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
  cardTitle:    { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 14 },
  exercises:    { gap: 8 },
  exRow:        { flexDirection: 'row', justifyContent: 'space-between' },
  exName:       { fontSize: 14, color: colors.text },
  exDetail:     { fontSize: 14, color: colors.muted },
  more:         { fontSize: 13, color: colors.accent, marginTop: 4 },
  cta:          { backgroundColor: colors.cta, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  ctaText:      { fontSize: 15, fontWeight: '700', color: colors.bg },
  emptyCard:    { alignItems: 'center', paddingVertical: 32 },
  emptyEmoji:   { fontSize: 40, marginBottom: 12 },
  emptyTitle:   { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 6 },
  emptySub:     { fontSize: 14, color: colors.muted },
  moods:        { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  moodBtn:      { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.card2, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  moodActive:   { borderColor: colors.accent, backgroundColor: colors.accent + '20' },
  moodEmoji:    { fontSize: 24 },
  habits:       { gap: 10, marginTop: 10 },
  habitRow:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  habitDone:    { opacity: 0.7 },
  check:        { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  checkDone:    { backgroundColor: colors.cta, borderColor: colors.cta },
  checkMark:    { fontSize: 12, color: colors.bg, fontWeight: '800' },
  habitName:    { fontSize: 15, color: colors.text },
  habitNameDone:{ textDecorationLine: 'line-through', color: colors.muted },
});
