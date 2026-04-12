import { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/api';
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
};

const DIFFICULTY_COLOR: Record<string, string> = {
  beginner:     '#4CAF50',
  intermediate: '#F59E0B',
  advanced:     '#E94560',
};

const STATUS_LABEL: Record<string, { en: string; de: string }> = {
  active:    { en: 'ACTIVE',    de: 'AKTIV'       },
  queued:    { en: 'QUEUED',    de: 'IN WARTESCHLANGE' },
  paused:    { en: 'PAUSED',    de: 'PAUSIERT'    },
  completed: { en: 'COMPLETED', de: 'ABGESCHLOSSEN' },
};

export default function PlansTab() {
  const router = useRouter();
  const { lang } = useT();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading,  setLoading]  = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api.programs.list()
      .then(setPrograms)
      .catch(() => setPrograms([]))
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

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <View style={s.header}>
        <Text style={s.title}>
          {lang === 'de' ? 'Meine ' : 'My '}
          <Text style={s.accent}>{lang === 'de' ? 'Pläne' : 'Plans'}</Text>
        </Text>
        <Text style={s.sub}>
          {lang === 'de'
            ? 'Tippe einen Plan, um Status & Details zu sehen'
            : 'Tap any plan to see status and details'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {programs.length === 0 ? null : (
          programs.map(prog => {
            const iconName = ICON_MAP[prog.icon || ''] || 'barbell-outline';
            const diffColor = DIFFICULTY_COLOR[(prog.difficulty || '').toLowerCase()] || colors.accent;
            const statusLabel = STATUS_LABEL[prog.status]?.[lang] || prog.status.toUpperCase();
            return (
              <TouchableOpacity
                key={prog.id}
                style={[s.programCard, { borderColor: diffColor }]}
                activeOpacity={0.8}
                onPress={() => router.push({ pathname: '/program', params: { id: prog.id } } as any)}
              >
                <View style={s.programHead}>
                  <Ionicons name={iconName} size={22} color={diffColor} />
                  <Text style={s.programName} numberOfLines={1}>{prog.name}</Text>
                  {prog.ai_generated && <Ionicons name="sparkles" size={14} color={diffColor} />}
                </View>

                <View style={s.programMeta}>
                  <Text style={[s.programStatus, { color: diffColor }]}>{statusLabel}</Text>
                  <Text style={s.programDot}>·</Text>
                  <Text style={s.programWeeks}>
                    {lang === 'de'
                      ? `Woche ${prog.current_week}/${prog.total_weeks}`
                      : `Week ${prog.current_week}/${prog.total_weeks}`}
                  </Text>
                </View>

                {/* Progress bar */}
                <View style={s.progressTrack}>
                  <View style={[
                    s.progressFill,
                    { width: `${Math.min(100, (prog.current_week / prog.total_weeks) * 100)}%` as any, backgroundColor: diffColor }
                  ]} />
                </View>
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

  header: { paddingHorizontal: 28, paddingTop: 24, paddingBottom: 16 },
  title:  { fontSize: 28, fontWeight: '800', color: colors.text },
  accent: { color: colors.accent },
  sub:    { fontSize: 14, color: colors.muted, marginTop: 6 },

  scroll: { paddingHorizontal: 20, paddingBottom: 40, gap: 12 },

  // Program card
  programCard:    { backgroundColor: '#0d0d0d', borderRadius: 14, borderWidth: 1.5, padding: 16, gap: 10 },
  programHead:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  programName:    { flex: 1, fontSize: 16, fontWeight: '700', color: colors.text },
  programMeta:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  programStatus:  { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  programDot:     { fontSize: 12, color: colors.muted },
  programWeeks:   { fontSize: 12, color: colors.muted },
  progressTrack:  { height: 4, backgroundColor: '#1a1a1a', borderRadius: 2, overflow: 'hidden' },
  progressFill:   { height: 4, borderRadius: 2 },
});
