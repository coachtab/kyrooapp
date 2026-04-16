import { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { api, clearApiCache } from '@/api';
import { colors, categoryColor, CATEGORY_GRADIENT } from '@/theme';
import { useActionSheet } from '@/context/ActionSheetContext';
import { useT } from '@/i18n';
import { AvatarButton } from '../_avatar';

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
  fire:   'flame',
  arm:    'barbell',
  bolt:   'flash',
  leaf:   'leaf',
  home:   'home',
  swim:   'water',
  flag:   'flag',
  run:    'walk',
  lift:   'fitness',
  zap:    'flash',
  flower: 'flower',
  body:   'accessibility',
  trophy: 'trophy',
  shield: 'shield-checkmark',
};

const STATUS_LABEL: Record<string, { en: string; de: string }> = {
  active:    { en: 'ACTIVE',    de: 'AKTIV'          },
  queued:    { en: 'QUEUED',    de: 'BEREIT'         },
  paused:    { en: 'PAUSED',    de: 'PAUSIERT'       },
  completed: { en: 'COMPLETED', de: 'ABGESCHLOSSEN'  },
};

const DEFAULT_GRADIENT: [string, string] = ['#6B7280', '#4B5563'];

export default function PlansTab() {
  const router = useRouter();
  const { lang } = useT();
  const [programs,   setPrograms]   = useState<Program[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { confirm } = useActionSheet();

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

  const handleDelete = async (progId: number, progName: string) => {
    const ok = await confirm({
      title: progName,
      message: lang === 'de' ? 'Endgültig löschen?' : 'Delete permanently?',
      confirmText: lang === 'de' ? 'Löschen' : 'Delete',
      cancelText: lang === 'de' ? 'Abbrechen' : 'Cancel',
      destructive: true,
    });
    if (ok) {
      try { await api.programs.delete(progId); clearApiCache(); load(); } catch {}
    }
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
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} colors={[colors.accent]} />}
      >
        {/* Title */}
        <View style={s.titleRow}>
          <Text style={s.title}>
            {lang === 'de' ? 'Meine Pläne' : 'My Plans'}
          </Text>
          <AvatarButton />
        </View>

        {programs.length === 0 ? (
          <View style={s.emptyWrap}>
            <View style={s.emptyCircle}>
              <Ionicons name="barbell" size={64} color={colors.accent} />
            </View>
            <Text style={s.emptyTitle}>
              {lang === 'de' ? 'Noch keine Pläne' : 'No plans yet'}
            </Text>
            <Text style={s.emptySub}>
              {lang === 'de'
                ? 'Erstelle deinen ersten Plan und Kyroo baut dir mit KI ein persönliches Programm.'
                : 'Create your first plan and Kyroo will build a personalised program with AI.'}
            </Text>
            <TouchableOpacity style={s.emptyBtn} onPress={() => router.push('/(tabs)')} activeOpacity={0.85}>
              <Text style={s.emptyBtnText}>{lang === 'de' ? 'Plan erstellen' : 'Create a plan'}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          programs.map(prog => {
            const cat       = (prog.category || '').toUpperCase();
            const gradient  = CATEGORY_GRADIENT[cat] || DEFAULT_GRADIENT;
            const iconName  = ICON_MAP[prog.icon || ''] || 'barbell';
            const isComplete = prog.status === 'completed';
            const canPause   = prog.status === 'active';
            const statusText = STATUS_LABEL[prog.status]?.[lang] || prog.status.toUpperCase();
            const progressPct = isComplete ? 100 : Math.min(100, Math.round((prog.current_week / prog.total_weeks) * 100));

            return (
              <TouchableOpacity
                key={prog.id}
                activeOpacity={0.92}
                onPress={() => router.push({ pathname: '/program', params: { id: prog.id } } as any)}
              >
                <LinearGradient
                  colors={isComplete ? ['#1a3a1a', '#0d260d'] : gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={s.card}
                >
                  {/* Top row — status pill + icon + delete */}
                  <View style={s.cardTop}>
                    <View style={s.statusPill}>
                      <View style={[s.statusDot, { backgroundColor: isComplete ? '#4CAF50' : '#fff' }]} />
                      <Text style={s.statusText}>{statusText}</Text>
                    </View>
                    <View style={s.cardTopRight}>
                      <Ionicons
                        name={isComplete ? 'checkmark-circle' : iconName}
                        size={34}
                        color="rgba(255,255,255,0.85)"
                      />
                      <TouchableOpacity
                        style={s.deleteBtn}
                        onPress={(e) => { e.stopPropagation?.(); handleDelete(prog.id, prog.name); }}
                        hitSlop={8}
                        activeOpacity={0.75}
                      >
                        <Ionicons name="close" size={14} color="rgba(255,255,255,0.9)" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Plan name */}
                  <Text style={s.cardName} numberOfLines={2}>{prog.name}</Text>

                  {/* Progress */}
                  <View style={s.progressRow}>
                    <Text style={s.progressLabel}>
                      {isComplete
                        ? (lang === 'de' ? 'Abgeschlossen' : 'Completed')
                        : lang === 'de'
                          ? `Woche ${prog.current_week} von ${prog.total_weeks}`
                          : `Week ${prog.current_week} of ${prog.total_weeks}`}
                    </Text>
                    <Text style={s.progressPct}>{progressPct}%</Text>
                  </View>
                  <View style={s.track}>
                    <View style={[s.fill, { width: `${progressPct}%` as any }]} />
                  </View>

                  {/* Action buttons */}
                  {!isComplete && (
                    <View style={s.actionRow}>
                      <TouchableOpacity
                        style={s.actionBtn}
                        onPress={(e) => { e.stopPropagation?.(); handleStatusChange(prog.id, canPause ? 'paused' : 'active'); }}
                        activeOpacity={0.85}
                      >
                        <Ionicons name={canPause ? 'pause' : 'play'} size={14} color="#fff" />
                        <Text style={s.actionBtnText}>
                          {canPause
                            ? (lang === 'de' ? 'Pausieren' : 'Pause')
                            : prog.status === 'paused'
                              ? (lang === 'de' ? 'Fortsetzen' : 'Resume')
                              : (lang === 'de' ? 'Starten' : 'Start')}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={s.openBtn}
                        onPress={(e) => { e.stopPropagation?.(); router.push({ pathname: '/program', params: { id: prog.id } } as any); }}
                        activeOpacity={0.75}
                      >
                        <Text style={s.openBtnText}>
                          {lang === 'de' ? 'Öffnen' : 'Open'}
                        </Text>
                        <Ionicons name="chevron-forward" size={14} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Completed badge */}
                  {isComplete && (
                    <View style={s.doneBadge}>
                      <Ionicons name="trophy" size={14} color="#4CAF50" />
                      <Text style={s.doneBadgeText}>{lang === 'de' ? 'Geschafft!' : 'Done!'}</Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },

  titleRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginBottom:   18,
    paddingLeft:    4,
  },
  title: {
    fontSize:   34,
    fontWeight: '800',
    color:      colors.text,
  },

  // ── Gradient card — full width ─────────────────────────────
  card: {
    borderRadius:   18,
    padding:        18,
    marginBottom:   12,
    overflow:       'hidden',
  },
  cardTop: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
    marginBottom:   12,
  },
  statusPill: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               6,
    backgroundColor:   'rgba(0,0,0,0.25)',
    paddingHorizontal: 10,
    paddingVertical:   4,
    borderRadius:      10,
  },
  statusDot:  { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '800', color: '#fff', letterSpacing: 1 },
  cardTopRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  deleteBtn: {
    width:           28,
    height:          28,
    borderRadius:    14,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.2)',
    alignItems:      'center',
    justifyContent:  'center',
  },
  cardName: {
    fontSize:   20,
    fontWeight: '800',
    color:      '#fff',
    lineHeight: 26,
    marginBottom: 14,
  },

  // Progress
  progressRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    marginBottom:   6,
  },
  progressLabel: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.75)' },
  progressPct:   { fontSize: 12, fontWeight: '800', color: '#fff' },
  track: {
    height:          5,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius:    3,
    overflow:        'hidden',
  },
  fill: {
    height:          5,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius:    3,
  },

  // Actions
  actionRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           10,
    marginTop:     14,
  },
  actionBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               6,
    backgroundColor:   'rgba(0,0,0,0.3)',
    paddingHorizontal: 16,
    paddingVertical:   10,
    borderRadius:      12,
    borderWidth:       1,
    borderColor:       'rgba(255,255,255,0.2)',
  },
  actionBtnText: { fontSize: 13, fontWeight: '800', color: '#fff' },
  openBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               4,
    marginLeft:        'auto',
    paddingHorizontal: 10,
    paddingVertical:   10,
  },
  openBtnText: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.85)' },

  // Completed
  doneBadge: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           6,
    marginTop:     14,
    alignSelf:     'flex-start',
  },
  doneBadgeText: { fontSize: 13, fontWeight: '800', color: '#4CAF50' },

  // ── Empty state ────────────────────────────────────────────
  emptyWrap: {
    alignItems:       'center',
    justifyContent:   'center',
    paddingHorizontal: 24,
    paddingTop:        60,
  },
  emptyCircle: {
    width:           120,
    height:          120,
    borderRadius:    60,
    backgroundColor: colors.accent + '18',
    borderWidth:     2,
    borderColor:     colors.accent + '50',
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    28,
  },
  emptyTitle: {
    fontSize:     18,
    fontWeight:   '800',
    color:        colors.text,
    marginBottom: 8,
  },
  emptySub: {
    fontSize:     14,
    color:        colors.muted,
    textAlign:    'center',
    lineHeight:   21,
    marginBottom: 28,
    maxWidth:     300,
  },
  emptyBtn: {
    backgroundColor:   colors.cta,
    borderRadius:      14,
    paddingVertical:   16,
    paddingHorizontal: 48,
  },
  emptyBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
});
