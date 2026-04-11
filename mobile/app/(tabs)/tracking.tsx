import { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/api';
import { colors } from '@/theme';
import { useT } from '@/i18n';

interface TrackData {
  habits: { id: number; name: string; completed: boolean }[];
  mood?: number;
  streak: number;
}

const MOODS = [
  { emoji: '😴', label: 'Exhausted' },
  { emoji: '😐', label: 'Meh'       },
  { emoji: '🙂', label: 'Good'      },
  { emoji: '😄', label: 'Great'     },
  { emoji: '🔥', label: 'On fire'   },
];

export default function TrackingTab() {
  const { tr, lang } = useT();
  const [data,    setData]    = useState<TrackData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api.tracking.today()
      .then(setData)
      .catch(() => setData({ habits: [], streak: 0 }))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(load);

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
  const allDone     = totalHabits > 0 && doneHabits === totalHabits;

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <Text style={s.title}>
          {tr('track_title')} <Text style={s.accent}>{tr('track_accent')}</Text>
        </Text>
        <Text style={s.date}>
          {new Date().toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric' })}
        </Text>

        {/* Stats row */}
        <View style={s.statsRow}>
          <View style={s.statCard}>
            <Ionicons name="flame" size={22} color={colors.accent} />
            <Text style={s.statNum}>{data?.streak ?? 0}</Text>
            <Text style={s.statLabel}>{tr('track_streak')}</Text>
          </View>
          <View style={s.statCard}>
            <Ionicons name="checkmark-done" size={22} color={allDone ? colors.accent : colors.muted} />
            <Text style={s.statNum}>{doneHabits}<Text style={s.statTotal}>/{totalHabits}</Text></Text>
            <Text style={s.statLabel}>{tr('track_habits_done')}</Text>
          </View>
        </View>

        {/* Progress bar */}
        {totalHabits > 0 && (
          <View style={s.card}>
            <View style={s.progressHeader}>
              <Text style={s.cardLabel}>{tr('track_progress')}</Text>
              <Text style={[s.progressPct, allDone && s.progressPctDone]}>
                {allDone ? '🎉 All done!' : `${Math.round(progress * 100)}%`}
              </Text>
            </View>
            <View style={s.barTrack}>
              <View style={[s.barFill, { width: `${Math.round(progress * 100)}%` as any }]} />
            </View>
          </View>
        )}

        {/* Habits */}
        <View style={s.card}>
          <Text style={s.cardLabel}>{tr('track_habits')}</Text>
          {totalHabits === 0 ? (
            <Text style={s.empty}>No habits set up yet.</Text>
          ) : (
            <View style={s.habits}>
              {data!.habits.map(h => (
                <TouchableOpacity key={h.id} style={s.habitRow} onPress={() => toggleHabit(h.id)} activeOpacity={0.7}>
                  <View style={[s.check, h.completed && s.checkDone]}>
                    {h.completed && <Ionicons name="checkmark" size={14} color={colors.bg} />}
                  </View>
                  <Text style={[s.habitName, h.completed && s.habitDone]}>{h.name}</Text>
                  {h.completed && <Ionicons name="checkmark-circle" size={16} color={colors.accent} style={{ opacity: 0.6 }} />}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Mood */}
        <View style={s.card}>
          <Text style={s.cardLabel}>{tr('track_mood_label')}</Text>
          <View style={s.moods}>
            {MOODS.map((m, i) => (
              <TouchableOpacity
                key={i}
                style={[s.moodBtn, data?.mood === i && s.moodActive]}
                onPress={() => saveMood(i)}
                activeOpacity={0.7}
              >
                <Text style={s.moodEmoji}>{m.emoji}</Text>
                <Text style={[s.moodLabel, data?.mood === i && s.moodLabelActive]}>{m.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: colors.bg },
  scroll:          { padding: 20, paddingBottom: 40 },
  title:           { fontSize: 26, fontWeight: '800', color: colors.text },
  accent:          { color: colors.accent },
  date:            { fontSize: 14, color: colors.muted, marginTop: 4, marginBottom: 20 },

  statsRow:        { flexDirection: 'row', gap: 12, marginBottom: 14 },
  statCard:        { flex: 1, backgroundColor: colors.card, borderRadius: 16, padding: 16, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: colors.border },
  statNum:         { fontSize: 28, fontWeight: '800', color: colors.text },
  statTotal:       { fontSize: 18, fontWeight: '600', color: colors.muted },
  statLabel:       { fontSize: 11, color: colors.muted },

  card:            { backgroundColor: colors.card, borderRadius: 18, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: colors.border },
  cardLabel:       { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: colors.muted, marginBottom: 12 },

  progressHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  progressPct:     { fontSize: 13, fontWeight: '700', color: colors.accent },
  progressPctDone: { color: colors.accent },
  barTrack:        { height: 10, backgroundColor: colors.card2, borderRadius: 5, overflow: 'hidden' },
  barFill:         { height: 10, backgroundColor: colors.cta, borderRadius: 5 },

  habits:          { gap: 12 },
  habitRow:        { flexDirection: 'row', alignItems: 'center', gap: 12 },
  check:           { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  checkDone:       { backgroundColor: colors.cta, borderColor: colors.cta },
  habitName:       { flex: 1, fontSize: 15, color: colors.text, fontWeight: '500' },
  habitDone:       { textDecorationLine: 'line-through', color: colors.muted },
  empty:           { fontSize: 14, color: colors.muted, textAlign: 'center', paddingVertical: 8 },

  moods:           { flexDirection: 'row', justifyContent: 'space-between' },
  moodBtn:         { alignItems: 'center', gap: 5, padding: 10, borderRadius: 14, borderWidth: 1.5, borderColor: 'transparent', flex: 1, marginHorizontal: 2 },
  moodActive:      { borderColor: colors.accent, backgroundColor: colors.accent + '15' },
  moodEmoji:       { fontSize: 26 },
  moodLabel:       { fontSize: 9, color: colors.muted, fontWeight: '500', textAlign: 'center' },
  moodLabelActive: { color: colors.accent },
});
