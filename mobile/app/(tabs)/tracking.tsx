import { useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, clearApiCache } from '@/api';
import { useAuth } from '@/context/AuthContext';
import { colors } from '@/theme';
import { useT } from '@/i18n';
import { AvatarButton } from '../_avatar';

interface Workout {
  name:      string;
  exercises: { name: string; sets: number; reps: string }[];
}

interface TrackData {
  habits:  { id: number; name: string; completed: boolean }[];
  mood?:   number | null;
  program?:{ name: string; week: number; day: number };
  workout?: Workout;
}

const LIME        = '#C6F436';
const WEIGHT_KEY  = 'kyroo.weightLog.v1';
const DAY_KEYS_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_KEYS_DE = ['Mo',  'Di',  'Mi',  'Do',  'Fr',  'Sa',  'So' ];

// Energy cell colors — darker→brighter red gradient for filled, dark for empty
const ENERGY_FILL = ['#4B1220', '#7A1A2D', '#C12840', '#C12840', '#C12840'];
const ENERGY_EMPTY = '#1a1a1c';

type HabitKind =
  | 'drink' | 'eat' | 'sleep' | 'stretch' | 'walk' | 'train' | 'focus'
  | 'read' | 'journal' | 'sun' | 'cold' | 'greens' | 'coffee' | 'supp' | 'weigh' | 'other';

const HABIT_LABEL_EN: Record<HabitKind, string> = {
  drink: 'Drink', eat: 'Eat', sleep: 'Sleep', stretch: 'Stretch',
  walk: 'Walk', train: 'Train', focus: 'Focus', read: 'Read',
  journal: 'Write', sun: 'Sun', cold: 'Cold', greens: 'Greens',
  coffee: 'Coffee', supp: 'Supp', weigh: 'Weigh', other: 'Habit',
};
const HABIT_LABEL_DE: Record<HabitKind, string> = {
  drink: 'Trinken', eat: 'Essen', sleep: 'Schlaf', stretch: 'Dehnen',
  walk: 'Gehen', train: 'Trainieren', focus: 'Fokus', read: 'Lesen',
  journal: 'Schreiben', sun: 'Sonne', cold: 'Kalt', greens: 'Grünes',
  coffee: 'Kaffee', supp: 'Vitamine', weigh: 'Wiegen', other: 'Gewohnheit',
};

function kindForHabit(name: string): HabitKind {
  const n = name.toLowerCase();
  if (/water|trink|hydrat|wasser/.test(n))                    return 'drink';
  if (/protein|eiweiß|eiweiss|meal|mahlzeit|food|essen/.test(n)) return 'eat';
  if (/sleep|schlaf|bed/.test(n))                             return 'sleep';
  if (/stretch|dehn|mobilit|mobility/.test(n))                return 'stretch';
  if (/walk|steps|gehen|schritte/.test(n))                    return 'walk';
  if (/run|lauf|cardio|workout|train|übung/.test(n))          return 'train';
  if (/meditat|mind|breath|atem|focus|fokus/.test(n))         return 'focus';
  if (/read|lesen|book|buch/.test(n))                         return 'read';
  if (/journal|tagebuch|write|schreib/.test(n))               return 'journal';
  if (/sun|sonne|light|licht/.test(n))                        return 'sun';
  if (/cold|shower|dusche|kalt/.test(n))                      return 'cold';
  if (/fruit|veg|obst|gemüse|gemuse|green/.test(n))           return 'greens';
  if (/coffee|kaffee|caffeine/.test(n))                       return 'coffee';
  if (/vitamin|supplement|supp/.test(n))                      return 'supp';
  if (/weigh|wiege/.test(n))                                  return 'weigh';
  return 'other';
}

const KIND_ICON: Record<HabitKind, React.ComponentProps<typeof Ionicons>['name']> = {
  drink:   'water-outline',
  eat:     'nutrition-outline',
  sleep:   'moon-outline',
  stretch: 'body-outline',
  walk:    'walk-outline',
  train:   'barbell-outline',
  focus:   'leaf-outline',
  read:    'book-outline',
  journal: 'create-outline',
  sun:     'sunny-outline',
  cold:    'snow-outline',
  greens:  'leaf-outline',
  coffee:  'cafe-outline',
  supp:    'medkit-outline',
  weigh:   'scale-outline',
  other:   'ellipse-outline',
};

const KIND_COLOR: Record<HabitKind, string> = {
  drink:   '#3B82F6', // blue
  eat:     '#F59E0B', // amber
  sleep:   '#8B5CF6', // violet
  stretch: '#14B8A6', // teal
  walk:    '#10B981', // emerald
  train:   '#E94560', // accent red
  focus:   '#A78BFA', // light violet
  read:    '#60A5FA', // sky
  journal: '#EC4899', // pink
  sun:     '#FBBF24', // yellow
  cold:    '#22D3EE', // cyan
  greens:  '#84CC16', // lime-green
  coffee:  '#B45309', // coffee brown
  supp:    '#F43F5E', // rose
  weigh:   '#94A3B8', // slate
  other:   '#6B7280', // gray
};

interface WeightEntry { date: string; kg: number }

export default function TrackingTab() {
  const router = useRouter();
  const { user } = useAuth();
  const { lang } = useT();
  const [data,       setData]       = useState<TrackData | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab,        setTab]        = useState<'weight' | 'records'>('weight');
  const [weightLog,  setWeightLog]  = useState<WeightEntry[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const d = await api.tracking.today();
      setData(d as TrackData);
    } catch {
      setData({ habits: [] });
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

  // Load weight log on mount — seed with profile weight if empty
  useEffect(() => {
    AsyncStorage.getItem(WEIGHT_KEY).then(raw => {
      let log: WeightEntry[] = [];
      if (raw) {
        try { log = JSON.parse(raw); } catch {}
      }
      if (log.length === 0 && user?.weight_kg) {
        log = [{ date: new Date().toISOString().slice(0, 10), kg: Number(user.weight_kg) }];
        AsyncStorage.setItem(WEIGHT_KEY, JSON.stringify(log));
      }
      setWeightLog(log);
    });
  }, [user?.weight_kg]);

  const addWeightEntry = async () => {
    const prompt = lang === 'de' ? 'Neues Gewicht (kg)' : 'New weight (kg)';
    let input: string | null = null;
    if (Platform.OS === 'web') {
      input = window.prompt(prompt, String(weightLog.at(-1)?.kg ?? user?.weight_kg ?? ''));
    } else {
      // Simple alert-based input for native
      input = await new Promise<string | null>(resolve => {
        Alert.prompt?.(prompt, undefined, [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
          { text: 'Save',   onPress: (v) => resolve(v ?? null) },
        ], 'plain-text', String(weightLog.at(-1)?.kg ?? user?.weight_kg ?? ''));
      });
    }
    const kg = Number(String(input).replace(',', '.'));
    if (!kg || isNaN(kg) || kg < 20 || kg > 400) return;
    const next = [...weightLog, { date: new Date().toISOString().slice(0, 10), kg }].slice(-8);
    setWeightLog(next);
    await AsyncStorage.setItem(WEIGHT_KEY, JSON.stringify(next));
  };

  const toggleHabit = async (id: number) => {
    const res = await api.tracking.toggleHabit(id);
    setData(d => d ? { ...d, habits: d.habits.map(h => h.id === id ? { ...h, completed: res.completed } : h) } : d);
  };

  const saveEnergy = async (level: number) => {
    await api.tracking.saveMood(level - 1);
    setData(d => d ? { ...d, mood: level - 1 } : d);
  };

  if (loading) return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.center}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    </SafeAreaView>
  );

  const habits     = data?.habits ?? [];
  const doneHabits = habits.filter(h => h.completed).length;
  const total      = habits.length;
  const energy     = (data?.mood ?? -1) + 1;
  const workout    = data?.workout;
  const allHabitsDone = total > 0 && doneHabits === total;
  const workoutDone   = allHabitsDone && !!workout;
  const estMinutes    = workout ? Math.max(30, Math.min(75, (workout.exercises?.length ?? 6) * 8)) : 0;

  // This week
  const now       = new Date();
  const jsDay     = now.getDay();
  const todayIdx  = jsDay === 0 ? 6 : jsDay - 1;
  const streak    = user?.stats?.streak ?? 0;
  const completedDays = new Set<number>();
  for (let i = 1; i <= Math.min(streak, todayIdx); i++) completedDays.add(todayIdx - i);
  if (allHabitsDone) completedDays.add(todayIdx);
  const dayLabels = lang === 'de' ? DAY_KEYS_DE : DAY_KEYS_EN;

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <View style={s.header}>
        <Text style={s.title}>{lang === 'de' ? 'Tracking' : 'Track'}</Text>
        <AvatarButton />
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} colors={[colors.accent]} />}
      >

        {/* ── TODAY ─────────────────────────────────── */}
        <Text style={s.sectionLabel}>{lang === 'de' ? 'HEUTE' : 'TODAY'}</Text>
        <TouchableOpacity
          style={s.todayCard}
          activeOpacity={0.8}
          onPress={() => workout ? router.push('/program') : router.push('/(tabs)')}
        >
          <View style={[s.todayIcon, !workoutDone && s.todayIconPending]}>
            <Ionicons
              name={workoutDone ? 'checkmark' : (workout ? 'barbell-outline' : 'add')}
              size={22}
              color={workoutDone ? '#000' : colors.text}
            />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={s.todayTitle} numberOfLines={1}>
              {workoutDone
                ? (lang === 'de' ? 'Training abgeschlossen' : 'Workout completed')
                : workout
                  ? (lang === 'de' ? 'Heutiges Training' : "Today's workout")
                  : (lang === 'de' ? 'Kein Training geplant' : 'No workout planned')}
            </Text>
            <Text style={s.todaySub} numberOfLines={1}>
              {workout
                ? `${workout.name} · ${estMinutes} min`
                : (lang === 'de' ? 'Erstelle einen Plan, um loszulegen' : 'Create a plan to get started')}
            </Text>
          </View>
        </TouchableOpacity>

        {/* ── DAILY HABITS ─────────────────────────── */}
        {total > 0 && (
          <>
            <View style={s.sectionRow}>
              <Text style={s.sectionHead}>{lang === 'de' ? 'Tägliche Gewohnheiten' : 'Daily habits'}</Text>
              <Text style={s.sectionCount}>{doneHabits}/{total}</Text>
            </View>
            <View style={s.habitsGrid}>
              {habits.map(h => {
                const kind  = kindForHabit(h.name);
                const icon  = KIND_ICON[kind];
                const color = KIND_COLOR[kind];
                const label = (lang === 'de' ? HABIT_LABEL_DE : HABIT_LABEL_EN)[kind];
                return (
                  <View key={h.id} style={s.habitCol}>
                    <View
                      style={[
                        s.habitKindPanel,
                        h.completed && { backgroundColor: color + '22', borderColor: color + '88' },
                      ]}
                    >
                      <Text
                        style={[s.habitKind, h.completed && { color }]}
                        numberOfLines={1}
                      >
                        {label}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[
                        s.habitCard,
                        h.completed && { backgroundColor: color + '1A', borderColor: color },
                      ]}
                      onPress={() => toggleHabit(h.id)}
                      activeOpacity={0.75}
                    >
                      <Ionicons
                        name={icon}
                        size={26}
                        color={h.completed ? color : color + 'AA'}
                      />
                      {h.completed && (
                        <View style={[s.habitBadge, { backgroundColor: color }]}>
                          <Ionicons name="checkmark" size={10} color="#000" />
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* ── ENERGY LEVEL ─────────────────────────── */}
        <View style={s.sectionRow}>
          <Text style={s.sectionHead}>{lang === 'de' ? 'Energielevel' : 'Energy level'}</Text>
          <Text style={s.sectionCount}>{energy}/5</Text>
        </View>
        <View style={s.energyRow}>
          {[1, 2, 3, 4, 5].map(level => {
            const active = level <= energy;
            return (
              <TouchableOpacity
                key={level}
                style={[
                  s.energyCell,
                  { backgroundColor: active ? ENERGY_FILL[level - 1] : ENERGY_EMPTY },
                ]}
                onPress={() => saveEnergy(level)}
                activeOpacity={0.75}
              />
            );
          })}
        </View>
        <View style={s.energyLabels}>
          <Text style={s.energyEnd}>{lang === 'de' ? 'Niedrig' : 'Low'}</Text>
          <Text style={[s.energyEnd, { color: '#3B82F6' }]}>{lang === 'de' ? 'Hoch' : 'High'}</Text>
        </View>

        {/* ── THIS WEEK ────────────────────────────── */}
        <Text style={[s.sectionLabel, { marginTop: 28 }]}>
          {lang === 'de' ? 'DIESE WOCHE' : 'THIS WEEK'}
        </Text>
        <View style={s.weekRow}>
          {dayLabels.map((label, i) => {
            const isToday    = i === todayIdx;
            const isComplete = completedDays.has(i);
            const isFuture   = i > todayIdx;
            return (
              <View key={i} style={s.dayCol}>
                <Text style={[s.dayLabel, isToday && s.dayLabelToday]}>{label}</Text>
                <View
                  style={[
                    s.dayRing,
                    isComplete && s.dayRingDone,
                    isToday    && !isComplete && s.dayRingToday,
                    isFuture   && s.dayRingFuture,
                  ]}
                >
                  {isComplete && <Ionicons name="checkmark" size={14} color={LIME} />}
                </View>
              </View>
            );
          })}
        </View>

        {/* ── PROGRESS ─────────────────────────────── */}
        <View style={[s.sectionRow, { marginTop: 28 }]}>
          <Text style={s.sectionHead}>{lang === 'de' ? 'Fortschritt' : 'Progress'}</Text>
          <View style={s.toggleWrap}>
            <TouchableOpacity
              style={[s.toggleBtn, tab === 'weight' && s.toggleBtnActive]}
              onPress={() => setTab('weight')}
              activeOpacity={0.8}
            >
              <Text style={[s.toggleText, tab === 'weight' && s.toggleTextActive]}>
                {lang === 'de' ? 'Gewicht' : 'Weight'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.toggleBtn, tab === 'records' && s.toggleBtnActive]}
              onPress={() => setTab('records')}
              activeOpacity={0.8}
            >
              <Text style={[s.toggleText, tab === 'records' && s.toggleTextActive]}>
                {lang === 'de' ? 'Rekorde' : 'Records'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {tab === 'weight'
          ? <WeightChart log={weightLog} onAdd={addWeightEntry} lang={lang} />
          : (
            <View style={s.progressCard}>
              <View style={s.emptyState}>
                <Ionicons name="trophy-outline" size={32} color={colors.muted} />
                <Text style={s.emptyText}>
                  {lang === 'de' ? 'Persönliche Bestleistungen kommen bald' : 'Personal records coming soon'}
                </Text>
              </View>
            </View>
          )}

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Weight chart ────────────────────────────────────
function WeightChart({ log, onAdd, lang }: { log: WeightEntry[]; onAdd: () => void; lang: 'en' | 'de' }) {
  if (log.length === 0) {
    return (
      <TouchableOpacity style={s.progressCard} onPress={onAdd} activeOpacity={0.85}>
        <View style={s.emptyState}>
          <Ionicons name="scale-outline" size={32} color={colors.muted} />
          <Text style={s.emptyText}>
            {lang === 'de' ? 'Tippe, um dein erstes Gewicht zu erfassen' : 'Tap to log your first weight'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  const latest = log[log.length - 1].kg;
  const first  = log[0].kg;
  const delta  = latest - first;
  const deltaStr = `${delta >= 0 ? '+' : ''}${delta.toFixed(1)} kg`;
  const deltaColor = delta < 0 ? LIME : delta > 0 ? colors.accent : colors.muted;

  // Chart geometry
  const W = 300;
  const H = 120;
  const pad = { l: 10, r: 10, t: 14, b: 22 };
  const n   = Math.max(log.length, 2);
  const vals = log.map(e => e.kg);
  // If only one point, fake a flat baseline
  const minV = Math.min(...vals) - 0.5;
  const maxV = Math.max(...vals) + 0.5;
  const span = Math.max(maxV - minV, 1);
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;

  const points = log.map((e, i) => {
    const x = pad.l + (log.length === 1 ? innerW / 2 : (i / (log.length - 1)) * innerW);
    const y = pad.t + (1 - (e.kg - minV) / span) * innerH;
    return { x, y };
  });
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  return (
    <View style={s.progressCard}>
      <View style={s.progressHead}>
        <View style={{ flex: 1 }}>
          <Text style={s.weightBig}>
            {latest.toFixed(1)}
            <Text style={s.weightUnit}> kg</Text>
          </Text>
        </View>
        <Text style={[s.weightDelta, { color: deltaColor }]}>{deltaStr}</Text>
      </View>

      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
        <Line x1={pad.l} y1={H - pad.b} x2={W - pad.r} y2={H - pad.b} stroke="#1f1f22" strokeWidth={1} />
        <Path d={pathD} stroke={colors.accent} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={3.5} fill={colors.accent} />
        ))}
      </Svg>

      <View style={s.weekLabelsRow}>
        {log.map((_, i) => (
          <Text
            key={i}
            style={[s.weekLabel, i === log.length - 1 && s.weekLabelActive]}
          >
            W{i + 1}
          </Text>
        ))}
      </View>

      <TouchableOpacity style={s.addWeightBtn} onPress={onAdd} activeOpacity={0.8}>
        <Ionicons name="add" size={16} color={colors.accent} />
        <Text style={s.addWeightText}>
          {lang === 'de' ? 'Gewicht protokollieren' : 'Log weight'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 28, paddingTop: 24, paddingBottom: 16 },
  title:  { fontSize: 28, fontWeight: '800', color: colors.text },

  scroll: { paddingHorizontal: 20, paddingBottom: 40 },

  sectionLabel: {
    fontSize:      11,
    fontWeight:    '800',
    color:         colors.muted,
    letterSpacing: 1.5,
    marginLeft:    4,
    marginBottom:  10,
    marginTop:     4,
  },
  sectionRow: {
    flexDirection:    'row',
    justifyContent:   'space-between',
    alignItems:       'center',
    marginTop:        24,
    marginBottom:     12,
    marginHorizontal: 4,
  },
  sectionHead:  { fontSize: 15, fontWeight: '700', color: '#A8C5FF' },
  sectionCount: { fontSize: 13, fontWeight: '600', color: colors.muted },

  // ── Today card ─────────────────────────────
  todayCard: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             14,
    backgroundColor: '#0d0d0d',
    borderRadius:    16,
    borderWidth:     1.5,
    borderColor:     colors.border,
    padding:         16,
  },
  todayIcon: {
    width:           38,
    height:          38,
    borderRadius:    10,
    backgroundColor: LIME,
    alignItems:      'center',
    justifyContent:  'center',
  },
  todayIconPending: { backgroundColor: '#1a1a1c' },
  todayTitle:       { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 2 },
  todaySub:         { fontSize: 13, color: colors.muted },

  // ── Habits grid ────────────────────────────
  habitsGrid: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           8,
  },
  habitCol: { alignItems: 'center', gap: 5 },
  habitKindPanel: {
    paddingHorizontal: 6,
    paddingVertical:   2,
    borderRadius:      6,
    backgroundColor:   '#0d0d0d',
    borderWidth:       1,
    borderColor:       colors.border,
  },
  habitKindPanelDone: {
    backgroundColor: '#0f1505',
    borderColor:     LIME + '66',
  },
  habitKind: {
    fontSize:      8,
    fontWeight:    '800',
    color:         colors.muted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  habitKindDone: { color: LIME },
  habitCard: {
    width:           62,
    height:          62,
    backgroundColor: '#0d0d0d',
    borderRadius:    14,
    borderWidth:     1.5,
    borderColor:     colors.border,
    alignItems:      'center',
    justifyContent:  'center',
  },
  habitCardDone: {
    borderColor:     LIME + '66',
    backgroundColor: '#0f1505',
  },
  habitBadge: {
    position:        'absolute',
    top:             6,
    right:           6,
    width:           16,
    height:          16,
    borderRadius:    8,
    backgroundColor: LIME,
    alignItems:      'center',
    justifyContent:  'center',
  },

  // ── Energy level ───────────────────────────
  energyRow: {
    flexDirection: 'row',
    gap:           8,
  },
  energyCell: {
    flex:         1,
    height:       54,
    borderRadius: 10,
  },
  energyLabels: {
    flexDirection:    'row',
    justifyContent:   'space-between',
    marginTop:        8,
    marginHorizontal: 2,
  },
  energyEnd: { fontSize: 12, color: colors.muted, fontWeight: '600' },

  // ── This week ──────────────────────────────
  weekRow: {
    flexDirection:     'row',
    justifyContent:    'space-between',
    paddingHorizontal: 4,
  },
  dayCol:        { alignItems: 'center', gap: 10, flex: 1 },
  dayLabel:      { fontSize: 12, color: colors.muted, fontWeight: '600' },
  dayLabelToday: { color: colors.accent },
  dayRing: {
    width:          36,
    height:         36,
    borderRadius:   18,
    borderWidth:    2,
    borderColor:    '#2a2a2e',
    alignItems:     'center',
    justifyContent: 'center',
  },
  dayRingDone:   { borderColor: LIME },
  dayRingToday:  { borderColor: colors.accent },
  dayRingFuture: { borderColor: '#1f1f22' },

  // ── Progress card ──────────────────────────
  toggleWrap: {
    flexDirection:   'row',
    backgroundColor: '#141416',
    borderRadius:    10,
    padding:         3,
    borderWidth:     1,
    borderColor:     colors.border,
  },
  toggleBtn: {
    paddingHorizontal: 14,
    paddingVertical:   6,
    borderRadius:      7,
  },
  toggleBtnActive:  { backgroundColor: '#fff' },
  toggleText:       { fontSize: 12, fontWeight: '700', color: colors.muted },
  toggleTextActive: { color: '#000' },

  progressCard: {
    backgroundColor: '#0d0d0d',
    borderRadius:    16,
    borderWidth:     1.5,
    borderColor:     colors.border,
    padding:         18,
    minHeight:       220,
  },
  progressHead: {
    flexDirection:  'row',
    alignItems:     'flex-start',
    justifyContent: 'space-between',
    marginBottom:   8,
  },
  weightBig:   { fontSize: 38, fontWeight: '800', color: colors.text, letterSpacing: -1 },
  weightUnit:  { fontSize: 16, fontWeight: '700', color: colors.muted },
  weightDelta: { fontSize: 13, fontWeight: '800', marginTop: 10 },

  weekLabelsRow: {
    flexDirection:    'row',
    justifyContent:   'space-between',
    marginTop:        4,
    paddingHorizontal: 8,
  },
  weekLabel:       { fontSize: 11, color: colors.muted, fontWeight: '600' },
  weekLabelActive: { color: colors.text, fontWeight: '800' },

  addWeightBtn: {
    flexDirection:   'row',
    alignItems:      'center',
    alignSelf:       'center',
    gap:             6,
    marginTop:       14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius:    10,
    borderWidth:     1,
    borderColor:     colors.accent + '55',
  },
  addWeightText: { fontSize: 12, fontWeight: '700', color: colors.accent },

  emptyState: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    gap:            10,
    paddingVertical: 36,
  },
  emptyText: { fontSize: 12, color: colors.muted, textAlign: 'center', maxWidth: 240, lineHeight: 17 },
});
