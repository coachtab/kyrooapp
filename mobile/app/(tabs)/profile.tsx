import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/api';
import { colors } from '@/theme';
import { useT } from '@/i18n';
import type { Lang } from '@/i18n/translations';
import { ProgramCard } from '../_components';
import type { ProgramSummary } from '../_components';

// Render flag emoji using explicit Unicode scalar values so the Metro
// minifier never collapses or mangles the surrogate pairs.
// 🇬🇧 = Regional Indicator G (U+1F1EC) + Regional Indicator B (U+1F1E7)
// 🇩🇪 = Regional Indicator D (U+1F1E9) + Regional Indicator E (U+1F1EA)
const FLAG_GB = '\u{1F1EC}\u{1F1E7}'; // 🇬🇧
const FLAG_DE = '\u{1F1E9}\u{1F1EA}'; // 🇩🇪

// Fallback coloured badge shown when the device's emoji font does not
// support Regional Indicator sequences (some older Android versions).
function FlagIcon({ code }: { code: Lang }) {
  // UK flag colour scheme: navy + red
  // German flag colour scheme: black / red / gold
  const stripes = code === 'en'
    ? ['#012169', '#C8102E', '#FFFFFF']   // navy, red, white
    : ['#000000', '#DD0000', '#FFCE00'];  // black, red, gold

  return (
    <View style={fi.wrap}>
      {stripes.map((c, i) => (
        <View key={i} style={[fi.stripe, { backgroundColor: c }]} />
      ))}
      <View style={fi.overlay}>
        <Text style={fi.code}>{code.toUpperCase()}</Text>
      </View>
    </View>
  );
}

const fi = StyleSheet.create({
  wrap:    { width: 36, height: 24, borderRadius: 4, overflow: 'hidden' },
  stripe:  { flex: 1 },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  code:    { fontSize: 9, fontWeight: '800', color: '#fff', letterSpacing: 0.5,
             textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
});

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

  const confirmLogout = () =>
    Alert.alert(tr('profile_logout'), tr('profile_logout_msg'), [
      { text: tr('profile_cancel'), style: 'cancel' },
      { text: tr('profile_logout'), style: 'destructive', onPress: async () => {
        await logout();
        router.replace('/welcome');
      }},
    ]);

  const handleActivate = (prog: ProgramSummary) => {
    const hasActive = programs.some(p => p.status === 'active' && p.id !== prog.id);
    const doActivate = async () => {
      await api.programs.setStatus(prog.id, 'active');
      loadPrograms();
    };
    if (hasActive) {
      Alert.alert(
        prog.status === 'paused' ? tr('program_resume') : tr('program_activate'),
        lang === 'de'
          ? 'Dein aktuelles Programm wird pausiert.'
          : 'Your current program will be paused.',
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
      lang === 'de'
        ? 'Programm als abgeschlossen markieren?'
        : 'Mark this program as completed?',
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

  const LANGUAGES: { code: Lang; flag: string; label: string }[] = [
    { code: 'en', flag: FLAG_GB, label: tr('profile_lang_en') },
    { code: 'de', flag: FLAG_DE, label: tr('profile_lang_de') },
  ];

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={s.avatarWrap}>
          <View style={s.avatar}>
            <Text style={s.avatarLetter}>{(user?.name || user?.email || 'K')[0].toUpperCase()}</Text>
          </View>
          {user?.is_premium && (
            <View style={s.premiumBadge}>
              <Text style={s.premiumText}>PRO</Text>
            </View>
          )}
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

        {/* Stats */}
        {stats && (
          <View style={s.statsRow}>
            <View style={s.statCard}>
              <Text style={s.statNum}>{stats.total_workouts}</Text>
              <Text style={s.statLabel}>{tr('profile_workouts')}</Text>
            </View>
            <View style={s.statCard}>
              <Text style={s.statNum}>{stats.streak}</Text>
              <Text style={s.statLabel}>{tr('profile_streak')}</Text>
            </View>
            <View style={s.statCard}>
              <Text style={s.statNum}>{stats.total_plans}</Text>
              <Text style={s.statLabel}>{tr('profile_plans')}</Text>
            </View>
          </View>
        )}

        {/* My Programs */}
        <View style={s.menu}>
          <Text style={s.menuLabel}>{tr('profile_programs').toUpperCase()}</Text>
          {programs.length === 0 ? (
            <Text style={s.emptyPrograms}>{tr('profile_programs_empty')}</Text>
          ) : (
            programs.map(prog => (
              <ProgramCard
                key={prog.id}
                program={prog}
                onView={prog.status === 'active' ? () => router.push('/program') : undefined}
                onActivate={prog.status !== 'active' && prog.status !== 'completed'
                  ? () => handleActivate(prog) : undefined}
                onMarkDone={prog.status === 'active' ? () => handleMarkDone(prog) : undefined}
              />
            ))
          )}
        </View>

        {/* Language switcher */}
        <View style={s.menu}>
          <Text style={s.menuLabel}>{tr('profile_language').toUpperCase()}</Text>
          <View style={s.langRow}>
            {LANGUAGES.map(l => (
              <TouchableOpacity
                key={l.code}
                style={[s.langBtn, lang === l.code && s.langBtnActive]}
                onPress={() => setLang(l.code)}
              >
                <FlagIcon code={l.code} />
                <Text style={[s.langLabel, lang === l.code && s.langLabelActive]}>{l.label}</Text>
                {lang === l.code && <View style={s.langCheck}><Text style={s.langCheckMark}>✓</Text></View>}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Account menu */}
        <View style={s.menu}>
          <Text style={s.menuLabel}>{tr('profile_account')}</Text>
          <MenuItem icon="📧" label={tr('profile_email')} value={user?.email || ''} />
          <MenuItem icon="⭐" label={tr('profile_plan')} value={user?.is_premium ? tr('profile_plan_pro') : tr('profile_plan_free')} accent={user?.is_premium} />
          <MenuItem icon="🔔" label={tr('profile_notif')} onPress={() => {}} />
          <MenuItem icon="🔒" label={tr('profile_privacy')} onPress={() => router.push('/privacy')} />
        </View>

        <View style={s.menu}>
          <Text style={s.menuLabel}>{tr('profile_support')}</Text>
          <MenuItem icon="❓" label={tr('profile_help')} onPress={() => router.push('/help')} />
          <MenuItem icon="📝" label={tr('profile_terms')} onPress={() => router.push('/terms')} />
        </View>

        <TouchableOpacity style={s.logoutBtn} onPress={confirmLogout} activeOpacity={0.8}>
          <Text style={s.logoutText}>{tr('profile_logout')}</Text>
        </TouchableOpacity>

        <Text style={s.version}>{tr('profile_version')}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuItem({ icon, label, value, accent, onPress }: {
  icon: string; label: string; value?: string; accent?: boolean; onPress?: () => void;
}) {
  return (
    <TouchableOpacity style={mi.row} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
      <Text style={mi.icon}>{icon}</Text>
      <Text style={mi.label}>{label}</Text>
      <View style={{ flex: 1 }} />
      {value && <Text style={[mi.value, accent && mi.valueAccent]}>{value}</Text>}
      {onPress && <Text style={mi.arrow}>›</Text>}
    </TouchableOpacity>
  );
}

const mi = StyleSheet.create({
  row:         { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12 },
  icon:        { fontSize: 18, width: 28 },
  label:       { fontSize: 15, color: colors.text, fontWeight: '500' },
  value:       { fontSize: 14, color: colors.muted },
  valueAccent: { color: colors.accent, fontWeight: '600' },
  arrow:       { fontSize: 20, color: colors.muted, marginLeft: 4 },
});

const s = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: colors.bg },
  scroll:        { padding: 24, paddingBottom: 48, alignItems: 'center' },
  avatarWrap:    { position: 'relative', marginBottom: 16 },
  avatar:        { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.accent + '30', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.accent },
  avatarLetter:  { fontSize: 36, fontWeight: '800', color: colors.accent },
  premiumBadge:  { position: 'absolute', bottom: -4, right: -4, backgroundColor: colors.accent, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  premiumText:   { fontSize: 9, fontWeight: '800', color: '#fff', letterSpacing: 1 },
  displayName:   { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 4, textAlign: 'center' },
  email:         { fontSize: 14, color: colors.muted, marginBottom: 24 },
  editRow:       { flexDirection: 'row', gap: 10, marginBottom: 4, alignSelf: 'stretch' },
  input:         { flex: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, fontSize: 16, color: colors.text },
  saveBtn:       { backgroundColor: colors.cta, borderRadius: 12, paddingHorizontal: 20, justifyContent: 'center' },
  saveBtnText:   { fontSize: 15, fontWeight: '700', color: colors.bg },
  statsRow:      { flexDirection: 'row', gap: 10, marginBottom: 28, alignSelf: 'stretch' },
  statCard:      { flex: 1, backgroundColor: colors.card, borderRadius: 16, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  statNum:       { fontSize: 24, fontWeight: '800', color: colors.text },
  statLabel:     { fontSize: 11, color: colors.muted, marginTop: 2 },
  menu:          { alignSelf: 'stretch', marginBottom: 24 },
  emptyPrograms: { fontSize: 13, color: colors.muted, textAlign: 'center', paddingVertical: 20 },
  menuLabel:     { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: colors.muted, marginBottom: 8, marginLeft: 4 },
  langRow:       { flexDirection: 'row', gap: 10 },
  langBtn:       { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.border },
  langBtnActive: { borderColor: colors.accent, backgroundColor: colors.accent + '15' },
  langLabel:     { fontSize: 14, fontWeight: '600', color: colors.muted, flex: 1 },
  langLabelActive:{ color: colors.text },
  langCheck:     { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  langCheckMark: { fontSize: 11, color: colors.bg, fontWeight: '800' },
  logoutBtn:     { backgroundColor: colors.accent + '18', borderWidth: 1, borderColor: colors.accent + '60', borderRadius: 14, paddingVertical: 14, alignSelf: 'stretch', alignItems: 'center', marginTop: 8 },
  logoutText:    { fontSize: 16, fontWeight: '700', color: colors.accent },
  version:       { fontSize: 12, color: colors.muted, marginTop: 20 },
});
