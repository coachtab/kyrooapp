import { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { api, clearApiCache } from '@/api';
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
  const [data,       setData]       = useState<TrackData | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const d = await api.tracking.today();
      setData(d);
    } catch {
      setData({ habits: [], streak: 0 });
    }
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    clearApiCache();
    try { await fetchData(); } finally { setRefreshing(false); }
  }, [fetchData]);

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
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.center}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    </SafeAreaView>
  );

  const locale     = lang === 'de' ? 'de-DE' : 'en-US';
  const doneHabits = data?.habits.filter(h => h.completed).length ?? 0;
  const total      = data?.habits.length ?? 0;
  const progress   = total > 0 ? doneHabits / total : 0;
  const allDone    = total > 0 && doneHabits === total;

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} colors={[colors.accent]} />}
      >

        {/* Header — Ochy centered bold */}
        <Text style={s.title}>
          Your <Text style={s.accent}>daily</Text> check-in
        </Text>
        <Text style={s.date}>
          {new Date().toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric' })}
        </Text>

        {/* Progress bar */}
        {total > 0 && (
          <View style={s.progressBlock}>
            <View style={s.progressRow}>
              <Text style={s.progressLabel}>{doneHabits}/{total} habits</Text>
              <Text style={[s.progressPct, allDone && s.progressDone]}>
                {allDone ? 'All done!' : `${Math.round(progress * 100)}%`}
              </Text>
            </View>
            <View style={s.barTrack}>
              <View style={[s.barFill, { width: `${Math.round(progress * 100)}%` as any }]} />
            </View>
          </View>
        )}

        {/* Habits — Ochy clean list rows */}
        {total > 0 && (
          <>
            <Text style={s.sectionTitle}>Habits</Text>
            {data!.habits.map(h => (
              <TouchableOpacity
                key={h.id}
                style={s.habitRow}
                onPress={() => toggleHabit(h.id)}
                activeOpacity={0.7}
              >
                <View style={[s.check, h.completed && s.checkDone]}>
                  {h.completed && <Ionicons name="checkmark" size={14} color={colors.bg} />}
                </View>
                <Text style={[s.habitName, h.completed && s.habitNameDone]}>{h.name}</Text>
                <Ionicons name="chevron-forward" size={14} color={colors.border} />
              </TouchableOpacity>
            ))}
          </>
        )}

        {total === 0 && (
          <View style={s.emptyBlock}>
            <Ionicons name="checkmark-done-outline" size={48} color={colors.muted} style={{ opacity: 0.5, marginBottom: 12 }} />
            <Text style={s.emptyText}>No habits to track yet.</Text>
          </View>
        )}

        {/* Mood — Ochy style */}
        <Text style={[s.sectionTitle, { marginTop: 32 }]}>
          How are you <Text style={s.accent}>feeling</Text>?
        </Text>
        <View style={s.moods}>
          {MOODS.map((m, i) => (
            <TouchableOpacity
              key={i}
              style={[s.moodBtn, data?.mood === i && s.moodActive]}
              onPress={() => saveMood(i)}
              activeOpacity={0.7}
            >
              <Text style={s.moodEmoji}>{m.emoji}</Text>
              <Text style={[s.moodLabel, data?.mood === i && s.moodLabelActive]}>
                {m.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 28, paddingTop: 40, paddingBottom: 60 },

  // Header
  title:  { fontSize: 28, fontWeight: '800', color: colors.text, textAlign: 'center' },
  accent: { color: colors.accent },
  date:   { fontSize: 14, color: colors.muted, textAlign: 'center', marginTop: 6, marginBottom: 32 },

  // Progress
  progressBlock: { marginBottom: 32 },
  progressRow:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { fontSize: 13, color: colors.muted, fontWeight: '500' },
  progressPct:   { fontSize: 13, fontWeight: '700', color: colors.accent },
  progressDone:  { color: colors.accent },
  barTrack:      { height: 6, backgroundColor: colors.card, borderRadius: 3, overflow: 'hidden' },
  barFill:       { height: 6, backgroundColor: colors.cta, borderRadius: 3 },

  // Section
  sectionTitle:  { fontSize: 13, fontWeight: '700', color: colors.muted, letterSpacing: 1, marginBottom: 12, textTransform: 'uppercase' },

  // Habits — Ochy list rows
  habitRow:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 14 },
  check:         { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  checkDone:     { backgroundColor: colors.cta, borderColor: colors.cta },
  habitName:     { flex: 1, fontSize: 16, color: colors.text, fontWeight: '500' },
  habitNameDone: { textDecorationLine: 'line-through', color: colors.muted },

  // Empty
  emptyBlock:    { alignItems: 'center', marginTop: 24, marginBottom: 24 },
  emptyText:     { fontSize: 15, color: colors.muted },

  // Mood
  moods:          { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  moodBtn:        { alignItems: 'center', gap: 6, paddingVertical: 12, paddingHorizontal: 4, borderRadius: 14, borderWidth: 1.5, borderColor: 'transparent', flex: 1 },
  moodActive:     { borderColor: colors.accent, backgroundColor: colors.accent + '15' },
  moodEmoji:      { fontSize: 28 },
  moodLabel:      { fontSize: 10, color: colors.muted, fontWeight: '500' },
  moodLabelActive:{ color: colors.accent, fontWeight: '700' },
});
