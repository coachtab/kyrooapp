import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '@/api';
import { colors } from '@/theme';
import { useT } from '@/i18n';

interface TrackData {
  habits: { id: number; name: string; completed: boolean }[];
  mood?: number;
  streak: number;
  workout?: { name: string; exercises: { name: string; sets: number; reps: string }[] };
}

export default function TrackingTab() {
  const { tr, lang } = useT();
  const [data,    setData]    = useState<TrackData | null>(null);
  const [loading, setLoading] = useState(true);

  const moods = [
    { emoji: '😴', labelKey: 'mood_exhausted' as const },
    { emoji: '😐', labelKey: 'mood_meh'       as const },
    { emoji: '🙂', labelKey: 'mood_good'      as const },
    { emoji: '😄', labelKey: 'mood_great'     as const },
    { emoji: '🔥', labelKey: 'mood_fire'      as const },
  ];

  useEffect(() => {
    api.tracking.today()
      .then(setData)
      .catch(() => setData({ habits: [], streak: 0 }))
      .finally(() => setLoading(false));
  }, []);

  const toggleHabit = async (id: number) => {
    const res = await api.tracking.toggleHabit(id);
    setData(d => d ? { ...d, habits: d.habits.map(h => h.id === id ? { ...h, completed: res.completed } : h) } : d);
  };

  const saveMood = async (i: number) => {
    await api.tracking.saveMood(i);
    setData(d => d ? { ...d, mood: i } : d);
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
  const progress    = totalHabits > 0 ? doneHabits / totalHabits : 0;
  const locale      = lang === 'de' ? 'de-DE' : 'en-US';

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.title}>{tr('track_title')} <Text style={s.accent}>{tr('track_accent')}</Text></Text>
        <Text style={s.date}>{new Date().toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric' })}</Text>

        {/* Streak + progress */}
        <View style={s.statsRow}>
          <View style={s.statCard}>
            <Text style={s.statNum}>{data?.streak ?? 0}</Text>
            <Text style={s.statLabel}>{tr('track_streak')}</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statNum}>{doneHabits}/{totalHabits}</Text>
            <Text style={s.statLabel}>{tr('track_habits_done')}</Text>
          </View>
        </View>

        {/* Progress bar */}
        {totalHabits > 0 && (
          <View style={s.card}>
            <View style={s.progressHeader}>
              <Text style={s.cardLabel}>{tr('track_progress')}</Text>
              <Text style={s.progressPct}>{Math.round(progress * 100)}%</Text>
            </View>
            <View style={s.bar}>
              <View style={[s.fill, { flex: progress }]} />
              <View style={{ flex: 1 - progress }} />
            </View>
          </View>
        )}

        {/* Mood */}
        <View style={s.card}>
          <Text style={s.cardLabel}>{tr('track_mood_label')}</Text>
          <View style={s.moods}>
            {moods.map((m, i) => (
              <TouchableOpacity key={i} style={[s.moodBtn, data?.mood === i && s.moodActive]} onPress={() => saveMood(i)}>
                <Text style={s.moodEmoji}>{m.emoji}</Text>
                <Text style={[s.moodLabel, data?.mood === i && s.moodLabelActive]}>{tr(m.labelKey)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Habits */}
        {totalHabits > 0 && (
          <View style={s.card}>
            <Text style={s.cardLabel}>{tr('track_habits')}</Text>
            <View style={s.habits}>
              {data!.habits.map(h => (
                <TouchableOpacity key={h.id} style={s.habitRow} onPress={() => toggleHabit(h.id)}>
                  <View style={[s.check, h.completed && s.checkDone]}>
                    {h.completed && <Text style={s.checkMark}>✓</Text>}
                  </View>
                  <Text style={[s.habitName, h.completed && s.habitDone]}>{h.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Today's workout */}
        {data?.workout && (
          <View style={s.card}>
            <Text style={s.cardLabel}>{tr('track_workout')}</Text>
            <Text style={s.workoutName}>{data.workout.name}</Text>
            {data.workout.exercises.map((ex, i) => (
              <View key={i} style={s.exRow}>
                <Text style={s.exName}>{ex.name}</Text>
                <Text style={s.exDetail}>{ex.sets} × {ex.reps}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: colors.bg },
  scroll:         { padding: 20, paddingBottom: 40 },
  title:          { fontSize: 26, fontWeight: '800', color: colors.text },
  accent:         { color: colors.accent },
  date:           { fontSize: 14, color: colors.muted, marginTop: 4, marginBottom: 20 },
  statsRow:       { flexDirection: 'row', gap: 12, marginBottom: 14 },
  statCard:       { flex: 1, backgroundColor: colors.card, borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  statNum:        { fontSize: 28, fontWeight: '800', color: colors.text },
  statLabel:      { fontSize: 12, color: colors.muted, marginTop: 4 },
  card:           { backgroundColor: colors.card, borderRadius: 18, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: colors.border },
  cardLabel:      { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: colors.muted, marginBottom: 12 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  progressPct:    { fontSize: 12, fontWeight: '700', color: colors.accent },
  bar:            { height: 8, flexDirection: 'row', backgroundColor: colors.card2, borderRadius: 4 },
  fill:           { height: 8, backgroundColor: colors.cta, borderRadius: 4 },
  moods:          { flexDirection: 'row', justifyContent: 'space-between' },
  moodBtn:        { alignItems: 'center', gap: 4, padding: 8, borderRadius: 12, borderWidth: 1, borderColor: 'transparent' },
  moodActive:     { borderColor: colors.accent, backgroundColor: colors.accent + '15' },
  moodEmoji:      { fontSize: 26 },
  moodLabel:      { fontSize: 9, color: colors.muted, fontWeight: '500' },
  moodLabelActive:{ color: colors.accent },
  habits:         { gap: 12 },
  habitRow:       { flexDirection: 'row', alignItems: 'center', gap: 12 },
  check:          { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  checkDone:      { backgroundColor: colors.cta, borderColor: colors.cta },
  checkMark:      { fontSize: 13, color: colors.bg, fontWeight: '800' },
  habitName:      { fontSize: 15, color: colors.text, flex: 1 },
  habitDone:      { textDecorationLine: 'line-through', color: colors.muted },
  workoutName:    { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12 },
  exRow:          { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border },
  exName:         { fontSize: 14, color: colors.text },
  exDetail:       { fontSize: 14, color: colors.muted },
});
