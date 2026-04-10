import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '@/api';
import { colors } from '@/theme';
import { useT } from '@/i18n';
import { translateFocus, translateDayName, translateExercise, translateRest } from '@/i18n/programTranslations';
import { Tag } from './_components';

interface Exercise { name: string; sets: number; reps: string; rest?: string; notes?: string }
interface Day      { day_number: number; name: string; focus: string; exercises: Exercise[] }
interface Program  { id: number; name: string; weeks: number; days_per_week: number; days: Day[] }

export default function ProgramScreen() {
  const router = useRouter();
  const { tr, lang } = useT();
  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);
  const [openDay, setOpenDay] = useState<number | null>(0);

  useEffect(() => {
    api.programs.current()
      .then(setProgram)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={colors.accent} size="large" />
    </View>
  );

  if (!program) return (
    <SafeAreaView style={s.safe}>
      <View style={s.empty}>
        <Text style={s.emptyEmoji}>📋</Text>
        <Text style={s.emptyTitle}>{tr('program_no_prog')}</Text>
        <Text style={s.emptySub}>{tr('program_no_sub')}</Text>
        <TouchableOpacity style={s.cta} onPress={() => router.replace('/(tabs)/plans')}>
          <Text style={s.ctaText}>{tr('program_browse')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Text style={s.backArrow}>‹</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.label}>{tr('program_label')}</Text>
            <Text style={s.title}>{program.name}</Text>
          </View>
        </View>

        {/* Meta */}
        <View style={s.metaRow}>
          <Tag>{`${program.weeks} ${tr('program_weeks')}`}</Tag>
          <Tag>{`${program.days_per_week}${tr('program_per_week')}`}</Tag>
          <Tag color={colors.cta}>{`${program.days?.length ?? 0} ${tr('program_sessions')}`}</Tag>
        </View>

        {/* Days */}
        <Text style={s.sectionLabel}>{tr('program_schedule')}</Text>
        {program.days?.map((day, i) => (
          <View key={i} style={s.dayCard}>
            <TouchableOpacity style={s.dayHeader} onPress={() => setOpenDay(openDay === i ? null : i)}>
              <View style={s.dayNum}>
                <Text style={s.dayNumText}>{day.day_number}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.dayName}>{translateDayName(day.name, lang)}</Text>
                <Text style={s.dayFocus}>{translateFocus(day.focus, lang)}</Text>
              </View>
              <Text style={s.chevron}>{openDay === i ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {openDay === i && (
              <View style={s.exList}>
                {day.exercises?.map((ex, j) => (
                  <View key={j} style={[s.exRow, j < day.exercises.length - 1 && s.exBorder]}>
                    <Text style={s.exName}>{translateExercise(ex.name, lang)}</Text>
                    <View style={s.exRight}>
                      <Text style={s.exSets}>{ex.sets} × {ex.reps}</Text>
                      {ex.rest && <Text style={s.exRest}>{ex.rest} {translateRest(lang)}</Text>}
                    </View>
                  </View>
                ))}
                {day.exercises?.length === 0 && (
                  <Text style={s.rest}>{tr('program_rest')}</Text>
                )}
              </View>
            )}
          </View>
        ))}

        <TouchableOpacity style={s.cta} onPress={() => router.replace('/(tabs)')}>
          <Text style={s.ctaText}>{tr('program_go_home')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: colors.bg },
  scroll:      { padding: 20, paddingBottom: 48 },
  header:      { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  backBtn:     { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  backArrow:   { fontSize: 28, color: colors.text, lineHeight: 32 },
  label:       { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: colors.muted },
  title:       { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 2 },
  metaRow:     { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 24 },
  sectionLabel:{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: colors.muted, marginBottom: 12 },
  dayCard:     { backgroundColor: colors.card, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  dayHeader:   { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  dayNum:      { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.accent + '20', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.accent + '40' },
  dayNumText:  { fontSize: 14, fontWeight: '800', color: colors.accent },
  dayName:     { fontSize: 15, fontWeight: '700', color: colors.text },
  dayFocus:    { fontSize: 12, color: colors.muted, marginTop: 2 },
  chevron:     { fontSize: 12, color: colors.muted },
  exList:      { borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: 16, paddingBottom: 8 },
  exRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 10 },
  exBorder:    { borderBottomWidth: 1, borderBottomColor: colors.border },
  exName:      { fontSize: 14, color: colors.text, flex: 1 },
  exRight:     { alignItems: 'flex-end' },
  exSets:      { fontSize: 14, color: colors.muted, fontWeight: '600' },
  exRest:      { fontSize: 11, color: colors.muted, marginTop: 2 },
  rest:        { padding: 12, fontSize: 14, color: colors.muted, fontStyle: 'italic' },
  empty:       { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyEmoji:  { fontSize: 52, marginBottom: 16 },
  emptyTitle:  { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 8 },
  emptySub:    { fontSize: 15, color: colors.muted, textAlign: 'center', marginBottom: 32 },
  cta:         { backgroundColor: colors.cta, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 16 },
  ctaText:     { fontSize: 17, fontWeight: '700', color: colors.bg },
});
