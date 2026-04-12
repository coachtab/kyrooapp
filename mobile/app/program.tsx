import { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Platform, Alert, Animated, PanResponder, RefreshControl } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api, ProgramStatus, clearApiCache } from '@/api';
import { colors } from '@/theme';
import { useT } from '@/i18n';
import { translateFocus, translateDayName, translateExercise, translateRest } from '@/i18n/programTranslations';

interface Exercise { name: string; sets: number; reps: string; rest?: string; notes?: string }
interface Day      { day_number: number; name: string; focus: string; exercises: Exercise[] }
interface SampleMeal { when?: string; name?: string; kcal?: number }
interface Nutrition {
  calories_per_day?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  meal_frequency?: string;
  sample_meals?: SampleMeal[];
  notes?: string;
}
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
  nutrition?: Nutrition | null;
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
  flower: 'flower-outline',
  body:   'accessibility-outline',
  trophy: 'trophy-outline',
  shield: 'shield-checkmark-outline',
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
  const [program,    setProgram]    = useState<Program | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [updating,   setUpdating]   = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [openDay,    setOpenDay]    = useState<number | null>(0);

  const fetchProgram = useCallback(async () => {
    try {
      const p = params.id
        ? await api.programs.get(Number(params.id))
        : await api.programs.current();
      setProgram(p);
    } catch {
      setProgram(null);
    }
  }, [params.id]);

  const load = useCallback(() => {
    setLoading(true);
    fetchProgram().finally(() => setLoading(false));
  }, [fetchProgram]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    clearApiCache();
    try { await fetchProgram(); } finally { setRefreshing(false); }
  }, [fetchProgram]);

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
  const isCompleted = program.status === 'completed';
  const baseColor = DIFFICULTY_COLOR[(program.difficulty || '').toLowerCase()] || colors.accent;
  const diffColor = isCompleted ? '#4CAF50' : baseColor;
  const statusLabel = STATUS_LABEL[program.status]?.[lang] || program.status.toUpperCase();
  const progressPct = isCompleted ? 100 : Math.min(100, Math.round((program.week / program.weeks) * 100));

  // Swipe gesture hint for start/pause
  const SwipeableCard = ({ children }: { children: React.ReactNode }) => {
    const dragX = useRef(new Animated.Value(0)).current;
    const SWIPE_THRESHOLD = 80;

    // Any non-completed plan can be started (active plans stay active — no-op).
    // Only currently-active plans can be paused.
    const canStart = program.status !== 'completed';
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
              changeStatus('active');
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
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} colors={[colors.accent]} />}
      >

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

        {/* Completion hero — replaces swipe card when program is completed */}
        {isCompleted && (
          <View style={s.completionHero}>
            <View style={s.trophyCircle}>
              <Ionicons name="trophy" size={56} color="#4CAF50" />
            </View>
            <Text style={s.completionTitle}>
              {lang === 'de' ? 'Programm ' : 'Program '}
              <Text style={{ color: '#4CAF50' }}>{lang === 'de' ? 'abgeschlossen!' : 'completed!'}</Text>
            </Text>
            <Text style={s.completionSub}>
              {lang === 'de'
                ? `Du hast alle ${program.weeks} Wochen geschafft. Großartige Arbeit!`
                : `You finished all ${program.weeks} weeks. Amazing work!`}
            </Text>
            <View style={s.completionBadges}>
              <View style={s.completionBadge}>
                <Ionicons name="calendar" size={14} color="#4CAF50" />
                <Text style={s.completionBadgeText}>{program.weeks} {lang === 'de' ? 'Wochen' : 'weeks'}</Text>
              </View>
              <View style={s.completionBadge}>
                <Ionicons name="checkmark-done" size={14} color="#4CAF50" />
                <Text style={s.completionBadgeText}>100%</Text>
              </View>
            </View>
          </View>
        )}

        {/* Stats + progress — swipeable: left=start, right=pause */}
        {!isCompleted && (
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
        )}

        {/* Swipe hint */}
        {!isCompleted && (program.status === 'queued' || program.status === 'paused') && (
          <Text style={s.swipeTip}>
            {lang === 'de' ? '← Wische nach links, um zu starten' : '← Swipe left to start'}
          </Text>
        )}
        {!isCompleted && program.status === 'active' && (
          <Text style={s.swipeTip}>
            {lang === 'de' ? 'Wische nach rechts, um zu pausieren →' : 'Swipe right to pause →'}
          </Text>
        )}

        {/* Status action buttons */}
        <View style={s.actions}>
          {program.status === 'queued' && (
            <TouchableOpacity
              style={[s.actionBtn, { backgroundColor: diffColor }, updating && s.disabled]}
              onPress={() => changeStatus('active')}
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
              onPress={() => changeStatus('active')}
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

        {/* Nutrition — only shown when Claude returned a nutrition block (body-comp plans) */}
        {program.nutrition && (
          <View style={s.nutritionSection}>
            <Text style={s.sectionLabel}>
              {lang === 'de' ? 'ERNÄHRUNG' : 'NUTRITION'}
            </Text>

            {/* Macro grid */}
            <View style={[s.macroCard, { borderColor: diffColor + '40' }]}>
              <View style={s.macroRow}>
                <View style={s.macroItem}>
                  <Text style={[s.macroNum, { color: diffColor }]}>{program.nutrition.calories_per_day ?? '—'}</Text>
                  <Text style={s.macroLabel}>{lang === 'de' ? 'kcal / Tag' : 'kcal / day'}</Text>
                </View>
                <View style={s.macroDivider} />
                <View style={s.macroItem}>
                  <Text style={[s.macroNum, { color: diffColor }]}>{program.nutrition.protein_g ?? '—'}g</Text>
                  <Text style={s.macroLabel}>{lang === 'de' ? 'Protein' : 'Protein'}</Text>
                </View>
                <View style={s.macroDivider} />
                <View style={s.macroItem}>
                  <Text style={[s.macroNum, { color: diffColor }]}>{program.nutrition.carbs_g ?? '—'}g</Text>
                  <Text style={s.macroLabel}>{lang === 'de' ? 'Kohlenhydrate' : 'Carbs'}</Text>
                </View>
                <View style={s.macroDivider} />
                <View style={s.macroItem}>
                  <Text style={[s.macroNum, { color: diffColor }]}>{program.nutrition.fat_g ?? '—'}g</Text>
                  <Text style={s.macroLabel}>{lang === 'de' ? 'Fett' : 'Fat'}</Text>
                </View>
              </View>

              {program.nutrition.meal_frequency && (
                <Text style={s.mealFrequency}>{program.nutrition.meal_frequency}</Text>
              )}
            </View>

            {/* Sample meals */}
            {Array.isArray(program.nutrition.sample_meals) && program.nutrition.sample_meals.length > 0 && (
              <>
                <Text style={s.sampleMealsLabel}>
                  {lang === 'de' ? 'BEISPIEL-MAHLZEITEN' : 'SAMPLE MEALS'}
                </Text>
                <View style={s.mealList}>
                  {program.nutrition.sample_meals.map((m, i) => (
                    <View key={i} style={s.mealRow}>
                      <View style={[s.mealDot, { backgroundColor: diffColor }]} />
                      <View style={{ flex: 1 }}>
                        {m.when && <Text style={[s.mealWhen, { color: diffColor }]}>{m.when.toUpperCase()}</Text>}
                        <Text style={s.mealName} numberOfLines={2}>{m.name}</Text>
                      </View>
                      {m.kcal != null && <Text style={s.mealKcal}>{m.kcal} kcal</Text>}
                    </View>
                  ))}
                </View>
              </>
            )}

            {program.nutrition.notes && (
              <View style={[s.notesBox, { borderColor: diffColor + '40', backgroundColor: diffColor + '10' }]}>
                <Ionicons name="bulb-outline" size={16} color={diffColor} />
                <Text style={[s.notesText, { color: colors.text }]}>{program.nutrition.notes}</Text>
              </View>
            )}
          </View>
        )}

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

  // Completion hero — replaces swipe card on completed programs
  completionHero: {
    backgroundColor:  '#0a1a0e',
    borderWidth:      1.5,
    borderColor:      '#4CAF50' + '60',
    borderRadius:     18,
    padding:          28,
    alignItems:       'center',
    marginBottom:     16,
  },
  trophyCircle: {
    width:            96,
    height:           96,
    borderRadius:     48,
    backgroundColor:  '#4CAF50' + '18',
    borderWidth:      2,
    borderColor:      '#4CAF50',
    alignItems:       'center',
    justifyContent:   'center',
    marginBottom:     20,
  },
  completionTitle: {
    fontSize:         24,
    fontWeight:       '800',
    color:            colors.text,
    textAlign:        'center',
    marginBottom:     8,
  },
  completionSub: {
    fontSize:         14,
    color:            colors.muted,
    textAlign:        'center',
    marginBottom:     18,
    lineHeight:       21,
  },
  completionBadges: {
    flexDirection:    'row',
    gap:              10,
  },
  completionBadge: {
    flexDirection:    'row',
    alignItems:       'center',
    gap:              6,
    backgroundColor:  '#4CAF50' + '18',
    borderWidth:      1,
    borderColor:      '#4CAF50' + '50',
    borderRadius:     10,
    paddingHorizontal: 12,
    paddingVertical:   6,
  },
  completionBadgeText: {
    fontSize:         12,
    fontWeight:       '700',
    color:            '#4CAF50',
  },

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

  // Nutrition
  nutritionSection:{ marginBottom: 20 },
  macroCard:       { backgroundColor: '#0d0d0d', borderRadius: 16, borderWidth: 1.5, padding: 16, marginBottom: 14 },
  macroRow:        { flexDirection: 'row', alignItems: 'center' },
  macroItem:       { flex: 1, alignItems: 'center' },
  macroNum:        { fontSize: 18, fontWeight: '800' },
  macroLabel:      { fontSize: 10, color: colors.muted, marginTop: 3, fontWeight: '600' },
  macroDivider:    { width: 1, height: 26, backgroundColor: colors.border },
  mealFrequency:   { fontSize: 12, color: colors.muted, textAlign: 'center', marginTop: 12, fontStyle: 'italic' },

  sampleMealsLabel:{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: colors.muted, marginBottom: 10, marginTop: 4 },
  mealList:        { gap: 8, marginBottom: 12 },
  mealRow:         { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#0d0d0d', borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 12 },
  mealDot:         { width: 8, height: 8, borderRadius: 4 },
  mealWhen:        { fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 2 },
  mealName:        { fontSize: 14, color: colors.text, fontWeight: '500', lineHeight: 18 },
  mealKcal:        { fontSize: 12, color: colors.muted, fontWeight: '600' },

  notesBox:        { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 6 },
  notesText:       { flex: 1, fontSize: 13, lineHeight: 19 },
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
