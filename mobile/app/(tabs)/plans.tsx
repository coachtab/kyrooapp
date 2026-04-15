import { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api, clearApiCache } from '@/api';
import { colors } from '@/theme';
import { useT } from '@/i18n';

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

// ── Program row — tap the card to open, tap the button to start/pause ─────
function ProgramCard({
  prog, diffColor, statusLabel, iconName, lang, onTap, onStatusChange,
}: {
  prog: Program;
  diffColor: string;
  statusLabel: string;
  iconName: React.ComponentProps<typeof Ionicons>['name'];
  lang: 'en' | 'de';
  onTap: () => void;
  onStatusChange: (status: 'active' | 'paused') => void;
}) {
  const isCompleted = prog.status === 'completed';
  const canPause    = prog.status === 'active';

  return (
    <View style={cs.wrap}>
      <TouchableOpacity
        style={[
          cs.card,
          { borderColor: isCompleted ? '#4CAF50' + '80' : diffColor },
          isCompleted && { backgroundColor: '#0a1a0e' },
        ]}
        activeOpacity={0.85}
        onPress={onTap}
      >
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

        {!isCompleted && (
          <View style={cs.actionRow}>
            <TouchableOpacity
              style={[cs.actionBtn, { backgroundColor: diffColor }]}
              onPress={(e) => { e.stopPropagation?.(); onStatusChange(canPause ? 'paused' : 'active'); }}
              activeOpacity={0.85}
            >
              <Ionicons name={canPause ? 'pause' : 'play'} size={14} color="#fff" />
              <Text style={cs.actionBtnText}>
                {canPause
                  ? (lang === 'de' ? 'Pausieren' : 'Pause')
                  : prog.status === 'paused'
                    ? (lang === 'de' ? 'Fortsetzen' : 'Resume')
                    : (lang === 'de' ? 'Starten' : 'Start')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={cs.openBtn}
              onPress={(e) => { e.stopPropagation?.(); onTap(); }}
              activeOpacity={0.75}
            >
              <Text style={[cs.openBtnText, { color: diffColor }]}>
                {lang === 'de' ? 'Ansehen' : 'Open'}
              </Text>
              <Ionicons name="chevron-forward" size={14} color={diffColor} />
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
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

  // Action buttons (primary start/pause + secondary open)
  actionRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           10,
    marginTop:     4,
  },
  actionBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               6,
    paddingHorizontal: 14,
    paddingVertical:   9,
    borderRadius:      10,
  },
  actionBtnText: { fontSize: 13, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
  openBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               4,
    paddingHorizontal: 10,
    paddingVertical:   9,
    marginLeft:        'auto',
  },
  openBtnText: { fontSize: 13, fontWeight: '700' },

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
});

export default function PlansTab() {
  const router = useRouter();
  const { lang } = useT();
  const [programs,   setPrograms]   = useState<Program[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPrograms = useCallback(async () => {
    try {
      const list = await api.programs.list();
      setPrograms(list);
    } catch {
      setPrograms([]);
    }
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    fetchPrograms().finally(() => setLoading(false));
  }, [fetchPrograms]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    clearApiCache();
    try { await fetchPrograms(); } finally { setRefreshing(false); }
  }, [fetchPrograms]);

  useFocusEffect(load);

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
            ? 'Tippe auf einen Plan, um ihn zu öffnen'
            : 'Tap a plan to open it'}
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
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} colors={[colors.accent]} />}
        >
          {programs.map(prog => {
            const iconName = ICON_MAP[prog.icon || ''] || 'barbell-outline';
            const diffColor = DIFFICULTY_COLOR[(prog.difficulty || '').toLowerCase()] || colors.accent;
            const statusLabel = STATUS_LABEL[prog.status]?.[lang] || prog.status.toUpperCase();
            return (
              <ProgramCard
                key={prog.id}
                prog={prog}
                diffColor={diffColor}
                statusLabel={statusLabel}
                iconName={iconName}
                lang={lang}
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
