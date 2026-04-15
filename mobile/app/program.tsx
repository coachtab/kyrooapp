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
  training_days?:  string[] | null;
  vacation_start?: string | null;
  vacation_end?:   string | null;
}

const DAY_KEYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
const DAY_SHORT_EN: Record<string, string> = { Monday:'Mon', Tuesday:'Tue', Wednesday:'Wed', Thursday:'Thu', Friday:'Fri', Saturday:'Sat', Sunday:'Sun' };
const DAY_SHORT_DE: Record<string, string> = { Monday:'Mo', Tuesday:'Di', Wednesday:'Mi', Thursday:'Do', Friday:'Fr', Saturday:'Sa', Sunday:'So' };

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
          <View style={{ flex: 1 }}>
            <Text style={[s.statusLabel, { color: diffColor }]}>{statusLabel}</Text>
            <Text style={s.title} numberOfLines={2}>{program.name}</Text>
          </View>
          <Ionicons name={iconName} size={28} color={diffColor} style={{ marginRight: 12 }} />
          <TouchableOpacity
            onPress={() => router.replace('/(tabs)/plans' as any)}
            style={s.closeBtn}
            hitSlop={12}
          >
            <Ionicons name="close" size={22} color={colors.text} />
          </TouchableOpacity>
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

        {/* Schedule + vacation — only while the program is active or paused */}
        {!isCompleted && (
          <ScheduleCard
            program={program}
            diffColor={diffColor}
            lang={lang}
            onUpdated={fetchProgram}
          />
        )}

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

// ── Schedule + vacation card ──────────────────────────────────────────────
const APP_FONT_STACK =
  '"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

const DATE_INPUT_STYLE: any = {
  boxSizing:       'border-box',
  display:         'block',
  width:           '100%',
  maxWidth:        '100%',
  minWidth:        0,
  padding:         '14px',
  fontSize:        '16px',
  fontWeight:      500,
  lineHeight:      '1.2',
  color:           '#F5F5F5',
  backgroundColor: '#141416',
  border:          '1.5px solid #2A2A2E',
  borderRadius:    '12px',
  marginBottom:    '14px',
  fontFamily:      APP_FONT_STACK,
  colorScheme:     'dark',
  outline:         'none',
  WebkitAppearance:'none',
  appearance:      'none',
};

interface ScheduleCardProps {
  program:   Program;
  diffColor: string;
  lang:      'en' | 'de';
  onUpdated: () => void;
}
function ScheduleCard({ program, diffColor, lang, onUpdated }: ScheduleCardProps) {
  const [busy, setBusy] = useState(false);
  const [localDays, setLocalDays] = useState<string[]>(program.training_days ?? []);
  const [formOpen, setFormOpen] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const defaultEnd = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const [breakStart, setBreakStart] = useState(today);
  const [breakEnd,   setBreakEnd]   = useState(defaultEnd);
  const shortMap = lang === 'de' ? DAY_SHORT_DE : DAY_SHORT_EN;

  useEffect(() => { setLocalDays(program.training_days ?? []); }, [program.training_days]);

  const toggleDay = async (day: string) => {
    const next = localDays.includes(day)
      ? localDays.filter(d => d !== day)
      : [...localDays, day];
    if (next.length === 0) {
      Alert.alert('', lang === 'de' ? 'Du brauchst mindestens einen Tag.' : 'You need at least one day.');
      return;
    }
    setLocalDays(next);
    setBusy(true);
    try {
      await api.programs.setSchedule(program.id, next);
      onUpdated();
    } catch (err: any) {
      Alert.alert('', err.message);
      setLocalDays(program.training_days ?? []);
    } finally {
      setBusy(false);
    }
  };

  // Normalise any server date value (YYYY-MM-DD, full ISO timestamp, or Date)
  // down to a plain YYYY-MM-DD string — the form inputs want that shape.
  const toDateOnly = (v: string | Date | null | undefined): string => {
    if (!v) return '';
    if (v instanceof Date) return v.toISOString().slice(0, 10);
    return String(v).slice(0, 10);
  };
  const vacStart = toDateOnly(program.vacation_start as any);
  const vacEnd   = toDateOnly(program.vacation_end as any);

  const onVacation = !!(vacStart && vacEnd);
  const vacationActive = onVacation && vacStart <= today && today <= vacEnd;

  // Short, clean range: "Apr 15 – 22" when same month, "Apr 28 – May 5" otherwise.
  const formatRange = (startIso: string, endIso: string): string => {
    const locale = lang === 'de' ? 'de-DE' : 'en-US';
    const s = new Date(`${startIso}T00:00:00`);
    const e = new Date(`${endIso}T00:00:00`);
    if (isNaN(+s) || isNaN(+e)) return `${startIso} → ${endIso}`;
    const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();
    const monthFmt = new Intl.DateTimeFormat(locale, { month: 'short' });
    if (sameMonth) {
      return lang === 'de'
        ? `${s.getDate()}.–${e.getDate()}. ${monthFmt.format(s)}`
        : `${monthFmt.format(s)} ${s.getDate()} – ${e.getDate()}`;
    }
    const startShort = new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(s);
    const endShort   = new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(e);
    return `${startShort} – ${endShort}`;
  };

  const openBreakForm = () => {
    const t = new Date().toISOString().slice(0, 10);
    setBreakStart(t);
    setBreakEnd(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
    setFormOpen(true);
  };

  const saveBreak = async () => {
    if (!breakStart || !breakEnd || breakEnd < breakStart) {
      Alert.alert('', lang === 'de'
        ? 'Das End-Datum muss nach dem Start-Datum liegen.'
        : 'The end date must be after the start date.');
      return;
    }
    setBusy(true);
    try {
      await api.programs.setVacation(program.id, breakStart, breakEnd);
      setFormOpen(false);
      onUpdated();
    } catch (err: any) {
      Alert.alert('', err.message);
    } finally {
      setBusy(false);
    }
  };

  const clearVacation = async () => {
    setBusy(true);
    try {
      await api.programs.setVacation(program.id, null, null);
      onUpdated();
    } catch (err: any) {
      Alert.alert('', err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[sched.card, { borderColor: diffColor + '40' }]}>
      <Text style={sched.sectionLabel}>{lang === 'de' ? 'PLAN & PAUSEN' : 'SCHEDULE & BREAKS'}</Text>

      <Text style={sched.hint}>
        {lang === 'de' ? 'Tippe, um Trainingstage zu ändern' : 'Tap to change your training days'}
      </Text>

      <View style={sched.daysRow}>
        {DAY_KEYS.map(day => {
          const active = localDays.includes(day);
          return (
            <TouchableOpacity
              key={day}
              style={[
                sched.dayChip,
                active && { backgroundColor: diffColor, borderColor: diffColor },
                busy && { opacity: 0.6 },
              ]}
              onPress={() => !busy && toggleDay(day)}
              activeOpacity={0.75}
            >
              <Text style={[sched.dayChipText, active && { color: '#fff' }]}>
                {shortMap[day]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={sched.divider} />

      {onVacation ? (
        <View style={sched.vacationActive}>
          <Ionicons name="pause-circle-outline" size={20} color={diffColor} />
          <View style={{ flex: 1 }}>
            <Text style={[sched.vacationTitle, { color: diffColor }]}>
              {vacationActive
                ? (lang === 'de' ? 'Pause läuft' : 'Break in progress')
                : (lang === 'de' ? 'Pause geplant' : 'Break scheduled')}
            </Text>
            <Text style={sched.vacationDates}>
              {formatRange(vacStart, vacEnd)}
            </Text>
          </View>
          <TouchableOpacity onPress={clearVacation} disabled={busy}>
            <Text style={[sched.vacationClear, { color: diffColor }]}>
              {lang === 'de' ? 'Löschen' : 'Clear'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        !formOpen ? (
          <TouchableOpacity
            style={[sched.vacationBtn, { borderColor: diffColor }]}
            onPress={openBreakForm}
            disabled={busy}
            activeOpacity={0.8}
          >
            <Ionicons name="pause-circle-outline" size={20} color={diffColor} />
            <Text style={[sched.vacationBtnText, { color: diffColor }]}>
              {lang === 'de' ? 'Pause einplanen' : 'Schedule a break'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={[sched.breakForm, { borderColor: diffColor + '55' }]}>
            <View style={sched.breakFormHeader}>
              <Ionicons name="pause-circle-outline" size={18} color={diffColor} />
              <Text style={[sched.breakFormTitle, { color: diffColor }]}>
                {lang === 'de' ? 'Pause einplanen' : 'Schedule a break'}
              </Text>
              <TouchableOpacity onPress={() => setFormOpen(false)} hitSlop={10}>
                <Ionicons name="close" size={18} color={colors.muted} />
              </TouchableOpacity>
            </View>
            <Text style={sched.breakFormSub}>
              {lang === 'de'
                ? 'Urlaub, Krankheit, Reise — wähle den Zeitraum.'
                : 'Vacation, sickness, travel — pick the range.'}
            </Text>

            <Text style={sched.modalLabel}>{lang === 'de' ? 'VON' : 'FROM'}</Text>
            {Platform.OS === 'web' ? (
              <input
                type="date"
                value={breakStart}
                min={today}
                aria-label={lang === 'de' ? 'Start-Datum' : 'Start date'}
                title={lang === 'de' ? 'Start-Datum' : 'Start date'}
                placeholder={lang === 'de' ? 'Start-Datum' : 'Start date'}
                onChange={(e: any) => setBreakStart(e.target.value)}
                style={DATE_INPUT_STYLE}
              />
            ) : (
              <Text style={sched.nativeNotice}>{breakStart}</Text>
            )}

            <Text style={sched.modalLabel}>{lang === 'de' ? 'BIS' : 'TO'}</Text>
            {Platform.OS === 'web' ? (
              <input
                type="date"
                value={breakEnd}
                min={breakStart}
                aria-label={lang === 'de' ? 'End-Datum' : 'End date'}
                title={lang === 'de' ? 'End-Datum' : 'End date'}
                placeholder={lang === 'de' ? 'End-Datum' : 'End date'}
                onChange={(e: any) => setBreakEnd(e.target.value)}
                style={DATE_INPUT_STYLE}
              />
            ) : (
              <Text style={sched.nativeNotice}>{breakEnd}</Text>
            )}

            <View style={sched.modalActions}>
              <TouchableOpacity
                style={[sched.modalBtn, sched.modalBtnSecondary]}
                onPress={() => setFormOpen(false)}
                activeOpacity={0.8}
              >
                <Text style={sched.modalBtnSecondaryText}>
                  {lang === 'de' ? 'Abbrechen' : 'Cancel'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[sched.modalBtn, { backgroundColor: diffColor }, busy && { opacity: 0.6 }]}
                onPress={saveBreak}
                disabled={busy}
                activeOpacity={0.85}
              >
                <Text style={sched.modalBtnPrimaryText}>
                  {busy
                    ? (lang === 'de' ? 'Speichern…' : 'Saving…')
                    : (lang === 'de' ? 'Bestätigen' : 'Confirm')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )
      )}
    </View>
  );
}

const sched = StyleSheet.create({
  card: {
    backgroundColor: '#0d0d0d',
    borderRadius:    16,
    borderWidth:     1.5,
    padding:         16,
    marginBottom:    14,
  },
  sectionLabel: {
    fontSize:      11,
    fontWeight:    '800',
    letterSpacing: 1.5,
    color:         colors.muted,
    marginBottom:  6,
  },
  hint: { fontSize: 12, color: colors.muted, marginBottom: 12 },

  daysRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    gap:            6,
    marginBottom:   14,
  },
  dayChip: {
    flex:            1,
    paddingVertical: 10,
    borderRadius:    10,
    borderWidth:     1.5,
    borderColor:     colors.border,
    backgroundColor: '#141416',
    alignItems:      'center',
  },
  dayChipText: { fontSize: 12, fontWeight: '800', color: colors.muted },

  divider: { height: 1, backgroundColor: colors.border, marginBottom: 14 },

  vacationBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'center',
    gap:               8,
    paddingVertical:   12,
    borderRadius:      12,
    borderWidth:       1.5,
  },
  vacationBtnText: { fontSize: 14, fontWeight: '800' },

  vacationActive: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           12,
  },
  vacationTitle: { fontSize: 13, fontWeight: '800' },
  vacationDates: { fontSize: 12, color: colors.muted, marginTop: 2 },
  vacationClear: { fontSize: 12, fontWeight: '800' },

  // ── Inline break form ────────────────────────────────────────────────
  breakForm: {
    backgroundColor: '#141416',
    borderRadius:    14,
    borderWidth:     1.5,
    padding:         16,
  },
  breakFormHeader: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           8,
    marginBottom:  4,
  },
  breakFormTitle: {
    flex:       1,
    fontSize:   14,
    fontWeight: '800',
  },
  breakFormSub: {
    fontSize:     12,
    color:        colors.muted,
    lineHeight:   17,
    marginBottom: 14,
  },
  modalLabel: {
    fontSize:      10,
    fontWeight:    '800',
    letterSpacing: 1.3,
    color:         colors.muted,
    marginBottom:  6,
  },
  nativeNotice: {
    fontSize:          15,
    color:             colors.text,
    backgroundColor:   '#141416',
    borderWidth:       1,
    borderColor:       colors.border,
    borderRadius:      12,
    paddingHorizontal: 14,
    paddingVertical:   12,
    marginBottom:      14,
  },
  modalActions: {
    flexDirection: 'row',
    gap:           10,
    marginTop:     10,
  },
  modalBtn: {
    flex:            1,
    paddingVertical: 14,
    borderRadius:    12,
    alignItems:      'center',
    justifyContent:  'center',
  },
  modalBtnSecondary: {
    backgroundColor: '#141416',
    borderWidth:     1.5,
    borderColor:     colors.border,
  },
  modalBtnSecondaryText: {
    fontSize:   14,
    fontWeight: '800',
    color:      colors.muted,
  },
  modalBtnPrimaryText: {
    fontSize:   14,
    fontWeight: '800',
    color:      '#fff',
  },
});

const s = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: '#000' },
  scroll:        { padding: 20, paddingBottom: 48 },

  // Header
  header:        { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  backBtn:       { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  closeBtn: {
    width:           36,
    height:          36,
    borderRadius:    18,
    borderWidth:     1.5,
    borderColor:     colors.border,
    backgroundColor: '#0d0d0d',
    alignItems:      'center',
    justifyContent:  'center',
  },
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
