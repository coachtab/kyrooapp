import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/api';
import { colors } from '@/theme';
import { useT } from '@/i18n';
import type { Lang } from '@/i18n/translations';
import { ProgramCard } from '../_components';
import type { ProgramSummary } from '../_components';

export default function ProfileTab() {
  const router = useRouter();
  const { user, token, logout, login } = useAuth();
  const { tr, lang, setLang } = useT();
  const [editing,  setEditing]  = useState(false);
  const [name,     setName]     = useState(user?.name || '');
  const [saving,   setSaving]   = useState(false);
  const [programs, setPrograms] = useState<ProgramSummary[]>([]);

  const loadPrograms = useCallback(() => {
    api.programs.list().then(setPrograms).catch(() => {});
  }, []);

  useEffect(() => { loadPrograms(); }, [loadPrograms]);

  const save = async () => {
    setSaving(true);
    try {
      const updated = await api.profile.update(name.trim());
      await login(token!, updated);
      setEditing(false);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmLogout = () => {
    const doLogout = async () => { await logout(); router.replace('/welcome'); };
    if (Platform.OS === 'web') {
      if (window.confirm(tr('profile_logout_msg'))) doLogout();
    } else {
      Alert.alert(tr('profile_logout'), tr('profile_logout_msg'), [
        { text: tr('profile_cancel'), style: 'cancel' },
        { text: tr('profile_logout'), style: 'destructive', onPress: doLogout },
      ]);
    }
  };

  const handleActivate = (prog: ProgramSummary) => {
    const hasActive = programs.some(p => p.status === 'active' && p.id !== prog.id);
    const doActivate = async () => {
      await api.programs.setStatus(prog.id, 'active');
      loadPrograms();
    };
    if (hasActive) {
      Alert.alert(
        prog.status === 'paused' ? tr('program_resume') : tr('program_activate'),
        lang === 'de' ? 'Dein aktuelles Programm wird pausiert.' : 'Your current program will be paused.',
        [
          { text: tr('profile_cancel'), style: 'cancel' },
          { text: prog.status === 'paused' ? tr('program_resume') : tr('program_activate'), onPress: doActivate },
        ]
      );
    } else {
      doActivate();
    }
  };

  const handleMarkDone = (prog: ProgramSummary) => {
    Alert.alert(
      tr('program_mark_done'),
      lang === 'de' ? 'Programm als abgeschlossen markieren?' : 'Mark this program as completed?',
      [
        { text: tr('profile_cancel'), style: 'cancel' },
        { text: tr('program_mark_done'), onPress: async () => {
            await api.programs.setStatus(prog.id, 'completed');
            loadPrograms();
          }
        },
      ]
    );
  };

  const stats = user?.stats;
  const firstName = user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'K';

  const LANGUAGES: { code: Lang; label: string }[] = [
    { code: 'en', label: tr('profile_lang_en') },
    { code: 'de', label: tr('profile_lang_de') },
  ];

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Avatar — centered, Ochy style */}
        <View style={s.avatarWrap}>
          <View style={s.avatar}>
            <Text style={s.avatarLetter}>{firstName[0].toUpperCase()}</Text>
          </View>
        </View>

        {/* Name / edit */}
        {editing ? (
          <View style={s.editRow}>
            <TextInput
              style={s.input}
              value={name}
              onChangeText={setName}
              placeholder={tr('profile_tap_name')}
              placeholderTextColor={colors.muted}
              autoFocus
            />
            <TouchableOpacity style={s.saveBtn} onPress={save} disabled={saving}>
              {saving ? <ActivityIndicator color={colors.bg} size="small" /> : <Text style={s.saveBtnText}>{tr('profile_save')}</Text>}
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={() => setEditing(true)}>
            <Text style={s.displayName}>{user?.name || tr('profile_tap_name')}</Text>
          </TouchableOpacity>
        )}
        <Text style={s.email}>{user?.email}</Text>
        {user?.is_premium && <Text style={s.proBadge}>PRO</Text>}

        {/* Stats */}
        {stats && (
          <View style={s.statsRow}>
            <Stat num={stats.total_workouts} label={tr('profile_workouts')} />
            <Stat num={stats.streak} label={tr('profile_streak')} />
            <Stat num={stats.total_plans} label={tr('profile_plans')} />
          </View>
        )}

        {/* Programs */}
        {programs.length > 0 && (
          <>
            <Text style={s.sectionTitle}>{tr('profile_programs').toUpperCase()}</Text>
            {programs.map(prog => (
              <ProgramCard
                key={prog.id}
                program={prog}
                onView={prog.status === 'active' ? () => router.push('/program') : undefined}
                onActivate={prog.status !== 'active' && prog.status !== 'completed' ? () => handleActivate(prog) : undefined}
                onMarkDone={prog.status === 'active' ? () => handleMarkDone(prog) : undefined}
              />
            ))}
          </>
        )}

        {/* Language — Ochy clean rows */}
        <Text style={[s.sectionTitle, { marginTop: 28 }]}>{tr('profile_language').toUpperCase()}</Text>
        {LANGUAGES.map(l => (
          <TouchableOpacity
            key={l.code}
            style={s.menuRow}
            onPress={() => setLang(l.code)}
            activeOpacity={0.7}
          >
            <Text style={s.menuLabel}>{l.label}</Text>
            {lang === l.code && <Ionicons name="checkmark" size={18} color={colors.accent} />}
          </TouchableOpacity>
        ))}

        {/* Account menu */}
        <Text style={[s.sectionTitle, { marginTop: 28 }]}>{tr('profile_account')}</Text>
        <MenuRow icon="mail-outline" label={tr('profile_email')} value={user?.email || ''} />
        <MenuRow icon="star-outline" label={tr('profile_plan')} value={user?.is_premium ? tr('profile_plan_pro') : tr('profile_plan_free')} accent={user?.is_premium} />
        <MenuRow icon="notifications-outline" label={tr('profile_notif')} onPress={() => {}} />
        <MenuRow icon="lock-closed-outline" label={tr('profile_privacy')} onPress={() => router.push('/privacy')} />

        <Text style={[s.sectionTitle, { marginTop: 28 }]}>{tr('profile_support')}</Text>
        <MenuRow icon="help-circle-outline" label={tr('profile_help')} onPress={() => router.push('/help')} />
        <MenuRow icon="document-text-outline" label={tr('profile_terms')} onPress={() => router.push('/terms')} />

        {/* Logout */}
        <TouchableOpacity style={s.logoutBtn} onPress={confirmLogout} activeOpacity={0.8}>
          <Text style={s.logoutText}>{tr('profile_logout')}</Text>
        </TouchableOpacity>

        <Text style={s.version}>{tr('profile_version')}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ num, label }: { num: number; label: string }) {
  return (
    <View style={s.statCard}>
      <Text style={s.statNum}>{num}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function MenuRow({ icon, label, value, accent, onPress }: {
  icon: React.ComponentProps<typeof Ionicons>['name']; label: string; value?: string; accent?: boolean; onPress?: () => void;
}) {
  return (
    <TouchableOpacity style={s.menuRow} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
      <Ionicons name={icon} size={18} color={colors.muted} />
      <Text style={s.menuLabel}>{label}</Text>
      <View style={{ flex: 1 }} />
      {value && <Text style={[s.menuValue, accent && s.menuValueAccent]}>{value}</Text>}
      {onPress && <Ionicons name="chevron-forward" size={16} color={colors.border} />}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: colors.bg },
  scroll:        { paddingHorizontal: 28, paddingTop: 40, paddingBottom: 60, alignItems: 'center' },

  // Avatar
  avatarWrap:    { marginBottom: 16 },
  avatar:        { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.accent + '25', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.accent },
  avatarLetter:  { fontSize: 32, fontWeight: '800', color: colors.accent },

  // Name
  displayName:   { fontSize: 24, fontWeight: '800', color: colors.text, textAlign: 'center', marginBottom: 4 },
  email:         { fontSize: 14, color: colors.muted, marginBottom: 4 },
  proBadge:      { fontSize: 10, fontWeight: '800', color: colors.accent, letterSpacing: 1.5, marginBottom: 4 },
  editRow:       { flexDirection: 'row', gap: 10, marginBottom: 4, alignSelf: 'stretch' },
  input:         { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, fontSize: 16, color: colors.text },
  saveBtn:       { backgroundColor: colors.cta, borderRadius: 12, paddingHorizontal: 20, justifyContent: 'center' },
  saveBtnText:   { fontSize: 15, fontWeight: '700', color: colors.ctaText },

  // Stats
  statsRow:      { flexDirection: 'row', gap: 10, marginTop: 20, marginBottom: 8, alignSelf: 'stretch' },
  statCard:      { flex: 1, alignItems: 'center', paddingVertical: 12 },
  statNum:       { fontSize: 22, fontWeight: '800', color: colors.text },
  statLabel:     { fontSize: 11, color: colors.muted, marginTop: 2 },

  // Section
  sectionTitle:  { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: colors.muted, alignSelf: 'flex-start', marginBottom: 8, marginTop: 8 },

  // Menu row — Ochy list style
  menuRow:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 12, alignSelf: 'stretch' },
  menuLabel:     { fontSize: 15, color: colors.text, fontWeight: '500' },
  menuValue:     { fontSize: 13, color: colors.muted },
  menuValueAccent:{ color: colors.accent, fontWeight: '600' },

  // Logout
  logoutBtn:     { borderWidth: 1, borderColor: colors.accent + '50', borderRadius: 14, paddingVertical: 15, alignSelf: 'stretch', alignItems: 'center', marginTop: 28 },
  logoutText:    { fontSize: 16, fontWeight: '700', color: colors.accent },

  version:       { fontSize: 12, color: colors.muted, marginTop: 20 },
});
