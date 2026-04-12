import { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Platform, Alert, Animated, PanResponder } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api, ProgramStatus } from '@/api';
import { colors } from '@/theme';
import { useT } from '@/i18n';
import { translateFocus, translateDayName, translateExercise, translateRest } from '@/i18n/programTranslations';

interface Exercise { name: string; sets: number; reps: string; rest?: string; notes?: string }
interface Day      { day_number: number; name: string; focus: string; exercises: Exercise[] }
interface Program  {
  id: number;
  name: string;
  category?: string;
  icon?: string;
  difficulty?: string;
  weeks: number;
  week: number;
  days_per_week: number;
  status: ProgramStatus;
  ai_generated?: boolean;
  days: Day[];
}

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
};

const DIFFICULTY_COLOR: Record<string, string> = {
  beginner:     '#4CAF50',
  intermediate: '#F59E0B',
  advanced:     '#E94560',
};

const STATUS_LABEL: Record<string, { en: string; de: string }> = {
  active:    { en: 'ACTIVE',    de: 'AKTIV'            },
  queued:    { en: 'QUEUED',    de: 'IN WARTESCHLANGE' },
  paused:    { en: 'PAUSED',    de: 'PAUSIERT'         },
  completed: { en: 'COMPLETED', de: 'ABGESCHLOSSEN'    },
};

export default function ProgramScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const { tr, lang } = useT();
  const [program,  setProgram]  = useState<Program | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [updating, setUpdating] = useState(false);
  const [openDay,  setOpenDay]  = useState<number | null>(0);

  const load = useCallback(() => {
    setLoading(true);
    const fetcher = params.id
      ? api.programs.get(Number(params.id))
      : api.programs.current();
    fetcher
      .then(setProgram)
      .catch(() => setProgram(null))
      .finally(() => setLoading(false));
  }, [params.id]);

  useEffect(load, [load]);

  const changeStatus = async (next: ProgramStatus, confirmMsg?: string) => {
    if (!program) return;
    const doChange = async () => {
      setUpdating(true);
      try {
        await api.programs.setStatus(program.id, next);
        setProgram({ ...program, status: next });
      } catch {}
      finally { setUpdating(false); }
    };
    if (!confirmMsg) return doChange();
    if (Platform.OS === 'web') {
      if (window.confirm(confirmMsg)) doChange();
    } else {
      Alert.alert('', confirmMsg, [
        { text: lang === 'de' ? 'Abbrechen' : 'Cancel', style: 'cancel' },
        { text: 'OK', onPress: doChange },
      ]);
    }
  };

  if (loading) return (
    <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={colors.accent} size="large" />
    </View>
  );

  if (!program) return (
    <SafeAreaView style={s.safe}>
      <View style={s.empty}>
        <Ionicons name="barbell-outline" size={52} color={colors.muted} style={{ opacity: 0.5, marginBottom: 16 }} />
        <Text style={s.emptyTitle}>{tr('program_no_prog')}</Text>
        <Text style={s.emptySub}>{tr('program_no_sub')}</Text>
        <TouchableOpacity style={s.cta} onPress={() => router.replace('/(tabs)')}>
          <Text style={s.ctaText}>{tr('program_browse')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  const iconName = ICON_MAP[program.icon || ''] || 'barbell-outline';
  const diffColor = DIFFICULTY_COLOR[(program.difficulty || '').toLowerCase()] || colors.accent;
  const statusLabel = STATUS_LABEL[program.status]?.[lang] || program.status.toUpperCase();
  const progressPct = Math.min(100, Math.round((program.week / program.weeks) * 100));

  // Swipe gesture hint for start/pause
  const SwipeableCard = ({ children }: { children: React.ReactNode }) => {
    const dragX = useRef(new Animated.Value(0)).current;
    const SWIPE_THRESHOLD = 80;

    const canStart = program.status === 'queued' || program.status === 'paused';
    const canPause = program.status === 'active';

    const panResponder = useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy),
        onPanResponderMove: (_, g) => {
          // Left swipe (negative dx) → start, right swipe → pause
          if (g.dx < 0 && canStart) dragX.setValue(Math.max(g.dx, -160));
          else if (g.dx > 0 && canPause) dragX.setValue(Math.min(g.dx, 160));
        },
        onPanResponderRelease: (_, g) => {
          if (g.dx < -SWIPE_THRESHOLD && canStart) {
            Animated.timing(dragX, { toValue: -160, duration: 150, useNativeDriver: false }).start(() => {
              dragX.setValue(0);
              changeStatus('active',
                lang === 'de' ? 'Aktuelles aktives Programm wird pausiert. Fortfahren?' : 'Your current active program will be paused. Continue?'
              );
            });
          } else if (g.dx > SWIPE_THRESHOLD && canPause) {
            Animated.timing(dragX, { toValue: 160, duration: 150, useNativeDriver: false }).start(() => {
              dragX.setValue(0);
              changeStatus('paused');
            });
          } else {
            Animated.spring(dragX, { toValue: 0, useNativeDriver: false, friction: 6 }).start();
          }
        },
      })
    ).current;

    const startOpacity = dragX.interpolate({ inputRange: [-160, -20, 0], outputRange: [1, 0.3, 0], extrapolate: 'clamp' });
    const pauseOpacity = dragX.interpolate({ inputRange: [0, 20, 160], outputRange: [0, 0.3, 1], extrapolate: 'clamp' });

    return (
      <View style={s.swipeWrap}>
        {/* Background hints */}
        {canStart && (
          <Animated.View style={[s.swipeHint, s.swipeHintStart, { backgroundColor: diffColor, opacity: startOpacity }]}>
            <Ionicons name="play" size={22} color="#fff" />
            <Text style={s.swipeHintText}>{lang === 'de' ? 'Starten' : 'Start'}</Text>
          </Animated.View>
        )}
        {canPause && (
          <Animated.View style={[s.swipeHint, s.swipeHintPause, { backgroundColor: diffColor + '50', opacity: pauseOpacity }]}>
            <Ionicons name="pause" size={22} color={diffColor} />
            <Text style={[s.swipeHintText, { color: diffColor }]}>{lang === 'de' ? 'Pausieren' : 'Pause'}</Text>
          </Animated.View>
        )}

        <Animated.View style={{ transform: [{ translateX: dragX }] }} {...panResponder.panHandlers}>
          {children}
        </Animated.View>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[s.statusLabel, { color: diffColor }]}>{statusLabel}</Text>
            <Text style={s.title} numberOfLines={2}>{program.name}</Text>
          </View>
          <Ionicons name={iconName} size={28} color={diffColor} />
        </View>

        {/* Stats + progress — swipeable: left=start, right=pause */}
        <SwipeableCard>
          <View style={[s.statsCard, { borderColor: diffColor }]}>
            <View style={s.statsRow}>
              <View style={s.stat}>
                <Text style={[s.statNum, { color: diffColor }]}>{program.week}</Text>
                <Text style={s.statLabel}>{lang === 'de' ? 'Woche' : 'Week'}</Text>
              </View>
              <View style={s.statDivider} />
              <View style={s.stat}>
                <Text style={[s.statNum, { color: diffColor }]}>{program.weeks}</Text>
                <Text style={s.statLabel}>{lang === 'de' ? 'Gesamt' : 'Total'}</Text>
              </View>
              <View style={s.statDivider} />
              <View style={s.stat}>
                <Text style={[s.statNum, { color: diffColor }]}>{program.days_per_week}</Text>
                <Text style={s.statLabel}>{lang === 'de' ? 'Pro Woche' : 'Per week'}</Text>
              </View>
            </View>
            <View style={s.progressTrack}>
              <View style={[s.progressFill, { width: `${progressPct}%` as any, backgroundColor: diffColor }]} />
            </View>
            <Text style={s.progressText}>{progressPct}%</Text>
          </View>
        </SwipeableCard>

        {/* Swipe hint */}
        {(program.status === 'queued' || program.status === 'paused') && (
          <Text style={s.swipeTip}>
            {lang === 'de' ? '← Wische nach links, um zu starten' : '← Swipe left to start'}
          </Text>
        )}
        {program.status === 'active' && (
          <Text style={s.swipeTip}>
            {lang === 'de' ? 'Wische nach rechts, um zu pausieren →' : 'Swipe right to pause →'}
          </Text>
        )}

        {/* Status action buttons */}
        <View style={s.actions}>
          {program.status === 'queued' && (
            <TouchableOpacity
              style={[s.actionBtn, { backgroundColor: diffColor }, updating && s.disabled]}
              onPress={() => changeStatus('active',
                lang === 'de' ? 'Aktuelles aktives Programm wird pausiert. Fortfahren?' : 'Your current active program will be paused. Continue?'
              )}
              disabled={updating}
            >
              <Ionicons name="play" size={18} color="#fff" />
              <Text style={s.actionText}>{lang === 'de' ? 'Starten' : 'Start'}</Text>
            </TouchableOpacity>
          )}
          {program.status === 'active' && (
            <TouchableOpacity
              style={[s.actionBtn, { backgroundColor: diffColor + '20', borderColor: diffColor, borderWidth: 1.5 }, updating && s.disabled]}
              onPress={() => changeStatus('paused')}
              disabled={updating}
            >
              <Ionicons name="pause" size={18} color={diffColor} />
              <Text style={[s.actionText, { color: diffColor }]}>{lang === 'de' ? 'Pausieren' : 'Pause'}</Text>
            </TouchableOpacity>
          )}
          {program.status === 'paused' && (
            <TouchableOpacity
              style={[s.actionBtn, { backgroundColor: diffColor }, updating && s.disabled]}
              onPress={() => changeStatus('active',
                lang === 'de' ? 'Aktuelles aktives Programm wird pausiert. Fortfahren?' : 'Your current active program will be paused. Continue?'
              )}
              disabled={updating}
            >
              <Ionicons name="play" size={18} color="#fff" />
              <Text style={s.actionText}>{lang === 'de' ? 'Fortsetzen' : 'Continue'}</Text>
            </TouchableOpacity>
          )}
          {(program.status === 'active' || program.status === 'paused') && (
            <TouchableOpacity
              style={[s.actionBtn, { backgroundColor: '#0d0d0d', borderColor: colors.border, borderWidth: 1.5 }, updating && s.disabled]}
              onPress={() => changeStatus('completed',
                lang === 'de' ? 'Dieses Programm als abgeschlossen markieren?' : 'Mark this program as completed?'
              )}
              disabled={updating}
            >
              <Ionicons name="checkmark-done" size={18} color={colors.muted} />
              <Text style={[s.actionText, { color: colors.muted }]}>{lang === 'de' ? 'Fertig' : 'Complete'}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Days */}
        <Text style={s.sectionLabel}>{tr('program_schedule')}</Text>
        {program.days?.map((day, i) => (
          <View key={i} style={[s.dayCard, { borderColor: diffColor + '40' }]}>
            <TouchableOpacity style={s.dayHeader} onPress={() => setOpenDay(openDay === i ? null : i)}>
              <View style={[s.dayNum, { backgroundColor: diffColor + '20', borderColor: diffColor + '60' }]}>
                <Text style={[s.dayNumText, { color: diffColor }]}>{day.day_number}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.dayName}>{translateDayName(day.name, lang)}</Text>
                <Text style={s.dayFocus}>{translateFocus(day.focus, lang)}</Text>
              </View>
              <Ionicons name={openDay === i ? 'chevron-up' : 'chevron-down'} size={16} color={colors.muted} />
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

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: '#000' },
  scroll:        { padding: 20, paddingBottom: 48 },

  // Header
  header:        { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  backBtn:       { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  statusLabel:   { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 2 },
  title:         { fontSize: 22, fontWeight: '800', color: colors.text },

  // Swipeable wrapper + hints
  swipeWrap:     { marginBottom: 8, position: 'relative' },
  swipeHint:     { position: 'absolute', top: 0, bottom: 14, width: 120, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 6 },
  swipeHintStart:{ right: 0 },
  swipeHintPause:{ left: 0 },
  swipeHintText: { fontSize: 13, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  swipeTip:      { fontSize: 12, color: colors.muted, textAlign: 'center', marginBottom: 20, fontStyle: 'italic' },

  // Stats card
  statsCard:     { backgroundColor: '#0d0d0d', borderRadius: 16, borderWidth: 1.5, padding: 18, marginBottom: 14 },
  statsRow:      { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  stat:          { flex: 1, alignItems: 'center' },
  statNum:       { fontSize: 26, fontWeight: '800' },
  statLabel:     { fontSize: 11, color: colors.muted, marginTop: 2 },
  statDivider:   { width: 1, height: 32, backgroundColor: colors.border },
  progressTrack: { height: 6, backgroundColor: '#1a1a1a', borderRadius: 3, overflow: 'hidden' },
  progressFill:  { height: 6, borderRadius: 3 },
  progressText:  { fontSize: 11, color: colors.muted, textAlign: 'right', marginTop: 6 },

  // Actions
  actions:       { flexDirection: 'row', gap: 10, marginBottom: 28 },
  actionBtn:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 12, paddingVertical: 14 },
  actionText:    { fontSize: 14, fontWeight: '700', color: '#fff' },
  disabled:      { opacity: 0.5 },

  // Schedule
  sectionLabel:  { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: colors.muted, marginBottom: 12 },
  dayCard:       { backgroundColor: '#0d0d0d', borderRadius: 14, marginBottom: 10, borderWidth: 1 },
  dayHeader:     { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  dayNum:        { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  dayNumText:    { fontSize: 14, fontWeight: '800' },
  dayName:       { fontSize: 15, fontWeight: '700', color: colors.text },
  dayFocus:      { fontSize: 12, color: colors.muted, marginTop: 2 },
  exList:        { borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: 14, paddingBottom: 8 },
  exRow:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 10 },
  exBorder:      { borderBottomWidth: 1, borderBottomColor: colors.border },
  exName:        { fontSize: 14, color: colors.text, flex: 1 },
  exRight:       { alignItems: 'flex-end' },
  exSets:        { fontSize: 14, color: colors.muted, fontWeight: '600' },
  exRest:        { fontSize: 11, color: colors.muted, marginTop: 2 },
  rest:          { padding: 12, fontSize: 14, color: colors.muted, fontStyle: 'italic' },

  // Empty
  empty:         { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyTitle:    { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 8 },
  emptySub:      { fontSize: 15, color: colors.muted, textAlign: 'center', marginBottom: 32 },
  cta:           { backgroundColor: colors.cta, borderRadius: 14, paddingVertical: 16, paddingHorizontal: 32, alignItems: 'center' },
  ctaText:       { fontSize: 16, fontWeight: '700', color: '#fff' },
});
