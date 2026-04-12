import { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Animated, PanResponder, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Line } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '@/api';
import { colors } from '@/theme';
import { useT } from '@/i18n';

// White glove pointing hand — classic cartoon style
function GloveHand({ size = 42 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {/* Cuff */}
      <Path d="M28 78 L28 92 L72 92 L72 78 Z" fill="#FFFFFF" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
      {/* Palm */}
      <Path d="M26 52 Q26 80 50 80 Q74 80 74 52 L74 40 Q74 32 66 32 Q58 32 58 40 L58 30 Q58 20 50 20 Q42 20 42 30 L42 38 Q42 30 34 30 Q26 30 26 40 Z"
        fill="#FFFFFF" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
      {/* Extended index finger */}
      <Path d="M42 38 L42 10 Q42 4 50 4 Q58 4 58 10 L58 36"
        fill="#FFFFFF" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
      {/* Glove lines (stitching on back of hand) */}
      <Line x1="36" y1="60" x2="42" y2="70" stroke="#000" strokeWidth="2" strokeLinecap="round" />
      <Line x1="48" y1="58" x2="52" y2="72" stroke="#000" strokeWidth="2" strokeLinecap="round" />
      <Line x1="62" y1="60" x2="58" y2="72" stroke="#000" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

interface Program {
  id: number;
  name: string;
  category?: string;
  icon?: string;
  difficulty?: string;
  total_weeks: number;
  current_week: number;
  status: 'active' | 'queued' | 'paused' | 'completed';
  ai_generated?: boolean;
  created_at: string;
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

// ── Swipeable program row ──────────────────────────────────────────────────
function SwipeableProgramCard({
  prog, diffColor, statusLabel, iconName, lang, onTap, onStatusChange, showDemo,
}: {
  prog: Program;
  diffColor: string;
  statusLabel: string;
  iconName: React.ComponentProps<typeof Ionicons>['name'];
  lang: 'en' | 'de';
  onTap: () => void;
  onStatusChange: (status: 'active' | 'paused') => void;
  showDemo: boolean;
}) {
  const dragX = useRef(new Animated.Value(0)).current;
  const demoX = useRef(new Animated.Value(0)).current;
  const demoOpacity = useRef(new Animated.Value(0)).current;
  const SWIPE_THRESHOLD = 70;

  const isCompleted = prog.status === 'completed';
  // Any non-completed plan can be started (active plans stay active — no-op).
  // Only currently-active plans can be paused.
  const canStart = !isCompleted;
  const canPause = prog.status === 'active';

  // Demo animation — glove hand swipes left-right to teach the gesture
  useEffect(() => {
    if (!showDemo) return;
    const direction = canStart ? -1 : canPause ? 1 : 0;
    if (direction === 0) return;

    Animated.sequence([
      Animated.delay(400),
      Animated.timing(demoOpacity, { toValue: 1, duration: 300, useNativeDriver: false }),
      Animated.timing(demoX, { toValue: direction * 100, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
      Animated.delay(300),
      Animated.timing(demoOpacity, { toValue: 0, duration: 400, useNativeDriver: false }),
    ]).start();
  }, [showDemo]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderGrant: () => { dragX.setValue(0); },
      onPanResponderMove: (_, g) => {
        if (g.dx < 0 && canStart) dragX.setValue(Math.max(g.dx, -140));
        else if (g.dx > 0 && canPause) dragX.setValue(Math.min(g.dx, 140));
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx < -SWIPE_THRESHOLD && canStart) {
          Animated.timing(dragX, { toValue: -140, duration: 150, useNativeDriver: false }).start(() => {
            dragX.setValue(0);
            onStatusChange('active');
          });
        } else if (g.dx > SWIPE_THRESHOLD && canPause) {
          Animated.timing(dragX, { toValue: 140, duration: 150, useNativeDriver: false }).start(() => {
            dragX.setValue(0);
            onStatusChange('paused');
          });
        } else {
          Animated.spring(dragX, { toValue: 0, useNativeDriver: false, friction: 6 }).start();
        }
      },
    })
  ).current;

  const startOpacity = dragX.interpolate({ inputRange: [-140, -15, 0], outputRange: [1, 0.25, 0], extrapolate: 'clamp' });
  const pauseOpacity = dragX.interpolate({ inputRange: [0, 15, 140],   outputRange: [0, 0.25, 1], extrapolate: 'clamp' });

  return (
    <View style={cs.wrap}>
      {/* Background hints */}
      {canStart && (
        <Animated.View style={[cs.hint, cs.hintRight, { backgroundColor: diffColor, opacity: startOpacity }]}>
          <Ionicons name="play" size={20} color="#fff" />
          <Text style={cs.hintText}>{lang === 'de' ? 'Starten' : 'Start'}</Text>
        </Animated.View>
      )}
      {canPause && (
        <Animated.View style={[cs.hint, cs.hintLeft, { backgroundColor: diffColor + '60', opacity: pauseOpacity }]}>
          <Ionicons name="pause" size={20} color={diffColor} />
          <Text style={[cs.hintText, { color: diffColor }]}>{lang === 'de' ? 'Pause' : 'Pause'}</Text>
        </Animated.View>
      )}

      {/* Card */}
      <Animated.View
        style={{ transform: [{ translateX: dragX }] }}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={[
            cs.card,
            { borderColor: isCompleted ? '#4CAF50' + '80' : diffColor },
            isCompleted && { backgroundColor: '#0a1a0e' },
          ]}
          activeOpacity={0.85}
          onPress={onTap}
        >
          {/* Completed ribbon — corner badge */}
          {isCompleted && (
            <View style={cs.completedBadge}>
              <Ionicons name="trophy" size={12} color="#fff" />
              <Text style={cs.completedBadgeText}>{lang === 'de' ? 'GESCHAFFT' : 'DONE'}</Text>
            </View>
          )}

          <View style={cs.head}>
            <Ionicons name={isCompleted ? 'checkmark-circle' : iconName} size={22} color={isCompleted ? '#4CAF50' : diffColor} />
            <Text style={[cs.name, isCompleted && cs.nameCompleted]} numberOfLines={1}>{prog.name}</Text>
            {prog.ai_generated && !isCompleted && <Ionicons name="sparkles" size={14} color={diffColor} />}
          </View>
          <View style={cs.meta}>
            <Text style={[cs.status, { color: isCompleted ? '#4CAF50' : diffColor }]}>{statusLabel}</Text>
            <Text style={cs.dot}>·</Text>
            <Text style={cs.weeks}>
              {isCompleted
                ? (lang === 'de' ? `${prog.total_weeks} Wochen abgeschlossen` : `${prog.total_weeks} weeks finished`)
                : lang === 'de'
                  ? `Woche ${prog.current_week}/${prog.total_weeks}`
                  : `Week ${prog.current_week}/${prog.total_weeks}`}
            </Text>
          </View>
          <View style={cs.track}>
            <View style={[
              cs.fill,
              {
                width: `${isCompleted ? 100 : Math.min(100, (prog.current_week / prog.total_weeks) * 100)}%` as any,
                backgroundColor: isCompleted ? '#4CAF50' : diffColor,
              },
            ]} />
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Demo hand — floats above the card showing the swipe direction */}
      {showDemo && (canStart || canPause) && (
        <Animated.View
          pointerEvents="none"
          style={[
            cs.demoHand,
            {
              opacity: demoOpacity,
              transform: [{ translateX: demoX }, { rotate: canPause ? '90deg' : '-90deg' }],
            },
          ]}
        >
          <GloveHand size={46} />
        </Animated.View>
      )}
    </View>
  );
}

const cs = StyleSheet.create({
  wrap:       { position: 'relative', marginBottom: 12 },
  hint:       { position: 'absolute', top: 0, bottom: 0, width: 110, borderRadius: 14, alignItems: 'center', justifyContent: 'center', gap: 4 },
  hintRight:  { right: 0 },
  hintLeft:   { left: 0 },
  hintText:   { fontSize: 12, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },

  card:       { backgroundColor: '#0d0d0d', borderRadius: 14, borderWidth: 1.5, padding: 16, gap: 10, overflow: 'hidden' },
  head:       { flexDirection: 'row', alignItems: 'center', gap: 10 },
  name:       { flex: 1, fontSize: 16, fontWeight: '700', color: colors.text },
  nameCompleted: { color: colors.muted, textDecorationLine: 'line-through' },

  // Completed ribbon — corner badge
  completedBadge: {
    position:        'absolute',
    top:             0,
    right:           0,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 10,
    paddingVertical:   5,
    borderBottomLeftRadius: 10,
    flexDirection:   'row',
    alignItems:      'center',
    gap:             4,
  },
  completedBadgeText: { fontSize: 10, fontWeight: '800', color: '#fff', letterSpacing: 1 },
  meta:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  status:     { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  dot:        { fontSize: 12, color: colors.muted },
  weeks:      { fontSize: 12, color: colors.muted },
  track:      { height: 4, backgroundColor: '#1a1a1a', borderRadius: 2, overflow: 'hidden' },
  fill:       { height: 4, borderRadius: 2 },

  demoHand:   { position: 'absolute', top: '50%', left: '50%', marginLeft: -23, marginTop: -23 },
});

export default function PlansTab() {
  const router = useRouter();
  const { lang } = useT();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [showDemo, setShowDemo] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.programs.list()
      .then(setPrograms)
      .catch(() => setPrograms([]))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(load);

  // Show swipe demo once — persisted in AsyncStorage
  useEffect(() => {
    if (loading || programs.length === 0) return;
    (async () => {
      const seen = await AsyncStorage.getItem('plans_swipe_demo_seen');
      if (!seen) {
        setShowDemo(true);
        await AsyncStorage.setItem('plans_swipe_demo_seen', '1');
        setTimeout(() => setShowDemo(false), 3000);
      }
    })();
  }, [loading, programs.length]);

  const handleStatusChange = async (progId: number, next: 'active' | 'paused') => {
    try {
      await api.programs.setStatus(progId, next);
      load();
    } catch {}
  };

  if (loading) return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.center}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <View style={s.header}>
        <Text style={s.title}>
          {lang === 'de' ? 'Meine ' : 'My '}
          <Text style={s.accent}>{lang === 'de' ? 'Pläne' : 'Plans'}</Text>
        </Text>
        <Text style={s.sub}>
          {lang === 'de'
            ? 'Wische nach links zum Starten, nach rechts zum Pausieren'
            : 'Swipe left to start, swipe right to pause'}
        </Text>
      </View>

      {programs.length === 0 ? (
        <View style={s.emptyWrap}>
          <View style={s.emptyCircle}>
            <Ionicons name="barbell" size={72} color={colors.accent} />
          </View>
          <Text style={s.emptyIntro}>
            {lang === 'de'
              ? 'Du hast noch keinen Trainingsplan. Kyroo baut dir mit KI einen persönlichen Plan — basierend auf deinem Level, deiner Zeit und deinen Zielen.'
              : "You don't have a training plan yet. Kyroo uses AI to build one tailored to your level, your time, and your goals."}
          </Text>
          <Text style={s.emptyHeadline}>
            {lang === 'de' ? 'Bereit, deinen ersten Plan zu erstellen?' : 'Ready to build your first plan?'}
          </Text>
          <TouchableOpacity style={s.startBtn} onPress={() => router.push('/(tabs)')} activeOpacity={0.85}>
            <Text style={s.startBtnText}>{lang === 'de' ? 'Starten!' : 'Start!'}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          {programs.map((prog, index) => {
            const iconName = ICON_MAP[prog.icon || ''] || 'barbell-outline';
            const diffColor = DIFFICULTY_COLOR[(prog.difficulty || '').toLowerCase()] || colors.accent;
            const statusLabel = STATUS_LABEL[prog.status]?.[lang] || prog.status.toUpperCase();
            return (
              <SwipeableProgramCard
                key={prog.id}
                prog={prog}
                diffColor={diffColor}
                statusLabel={statusLabel}
                iconName={iconName}
                lang={lang}
                showDemo={showDemo && index === 0}
                onTap={() => router.push({ pathname: '/program', params: { id: prog.id } } as any)}
                onStatusChange={next => handleStatusChange(prog.id, next)}
              />
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: { paddingHorizontal: 28, paddingTop: 24, paddingBottom: 16 },
  title:  { fontSize: 28, fontWeight: '800', color: colors.text },
  accent: { color: colors.accent },
  sub:    { fontSize: 14, color: colors.muted, marginTop: 6 },

  scroll: { paddingHorizontal: 20, paddingBottom: 40 },

  // Empty state
  emptyWrap:      { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingBottom: 40 },
  emptyCircle:    {
    width:           140,
    height:          140,
    borderRadius:    70,
    backgroundColor: colors.accent + '18',
    borderWidth:     2,
    borderColor:     colors.accent + '50',
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    32,
  },
  emptyIntro:     { fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  emptyHeadline:  { fontSize: 18, fontWeight: '700', color: colors.text, textAlign: 'center', marginBottom: 32, lineHeight: 26 },
  startBtn:       { backgroundColor: colors.cta, borderRadius: 14, paddingVertical: 17, paddingHorizontal: 64, alignItems: 'center' },
  startBtnText:   { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
});
