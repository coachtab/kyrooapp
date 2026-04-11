import { useState, useCallback } from 'react';
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

  if (loading) return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.center}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    </SafeAreaView>
  );

  const firstName = user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'Athlete';

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Greeting — Ochy-style centered, bold, accent name */}
        <View style={s.greetingBlock}>
          <Text style={s.greeting}>
            Hi, <Text style={s.greetingAccent}>{firstName}</Text>!
          </Text>
          <Text style={s.wave}>👋</Text>
        </View>

        {/* Streak strip */}
        <View style={s.streakStrip}>
          <Ionicons name="flame" size={18} color={colors.accent} />
          <Text style={s.streakText}>
            <Text style={s.streakNum}>{data?.streak ?? 0}</Text> day streak
          </Text>
        </View>

        {/* Today's workout */}
        {data?.workout ? (
          <>
            <Text style={s.sectionTitle}>
              Today's <Text style={s.sectionAccent}>workout</Text>
            </Text>
            {data.program && (
              <Text style={s.meta}>
                {data.program.name} · Week {data.program.week}, Day {data.program.day}
              </Text>
            )}

            <Text style={s.workoutName}>{data.workout.name}</Text>

            <View style={s.exerciseList}>
              {data.workout.exercises.map((ex, i) => (
                <View key={i} style={s.exRow}>
                  <Text style={s.exName}>{ex.name}</Text>
                  <Text style={s.exDetail}>{ex.sets} × {ex.reps}</Text>
                  <Ionicons name="chevron-forward" size={14} color={colors.border} />
                </View>
              ))}
            </View>

            <TouchableOpacity style={s.cta} onPress={() => router.push('/program')} activeOpacity={0.85}>
              <Text style={s.ctaText}>View Program</Text>
            </TouchableOpacity>
          </>
        ) : (
          /* Empty state — Ochy "Hi, it's Kyroo!" style */
          <View style={s.emptyBlock}>
            <Ionicons name="barbell-outline" size={56} color={colors.accent} style={{ opacity: 0.6, marginBottom: 20 }} />
            <Text style={s.emptyTitle}>
              Ready to <Text style={s.sectionAccent}>start</Text>?
            </Text>
            <Text style={s.emptySub}>
              Pick a training plan and Kyroo builds{'\n'}your personalised program.
            </Text>
            <TouchableOpacity style={s.cta} onPress={() => router.push('/(tabs)/plans')} activeOpacity={0.85}>
              <Text style={s.ctaText}>Browse Plans</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 28, paddingTop: 40, paddingBottom: 60 },

  // Greeting
  greetingBlock: { alignItems: 'center', marginBottom: 8 },
  greeting:      { fontSize: 32, fontWeight: '800', color: colors.text, textAlign: 'center' },
  greetingAccent:{ color: colors.accent },
  wave:          { fontSize: 32, marginTop: 8 },

  // Streak
  streakStrip:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 40 },
  streakText:    { fontSize: 14, color: colors.muted },
  streakNum:     { fontWeight: '800', color: colors.text },

  // Section
  sectionTitle:  { fontSize: 26, fontWeight: '800', color: colors.text, textAlign: 'center', marginBottom: 4 },
  sectionAccent: { color: colors.accent },
  meta:          { fontSize: 13, color: colors.muted, textAlign: 'center', marginBottom: 20 },
  workoutName:   { fontSize: 18, fontWeight: '700', color: colors.text, textAlign: 'center', marginBottom: 24 },

  // Exercise list — Ochy clean rows
  exerciseList:  { marginBottom: 12 },
  exRow:         { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  exName:        { flex: 1, fontSize: 15, color: colors.text, fontWeight: '500' },
  exDetail:      { fontSize: 14, color: colors.muted, marginRight: 8 },

  // CTA — Ochy-style full-width
  cta:           { backgroundColor: colors.cta, borderRadius: 14, paddingVertical: 17, alignItems: 'center', marginTop: 24 },
  ctaText:       { fontSize: 17, fontWeight: '700', color: colors.ctaText },

  // Empty state
  emptyBlock:    { alignItems: 'center', marginTop: 40 },
  emptyTitle:    { fontSize: 28, fontWeight: '800', color: colors.text, textAlign: 'center', marginBottom: 12 },
  emptySub:      { fontSize: 15, color: colors.muted, textAlign: 'center', lineHeight: 22, marginBottom: 8 },
});
