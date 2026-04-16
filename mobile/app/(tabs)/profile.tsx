import { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, ActivityIndicator, Platform, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useActionSheet } from '@/context/ActionSheetContext';
import { api, clearApiCache } from '@/api';
import { colors } from '@/theme';
import { useT } from '@/i18n';

export default function ProfileTab() {
  const router = useRouter();
  const { user, token, logout, login } = useAuth();
  const { tr, lang, setLang } = useT();
  const { confirm } = useActionSheet();
  const [editing,    setEditing]    = useState(false);
  const parts = (user?.name || '').split(' ');
  const [firstName,  setFirstName]  = useState(parts[0] || '');
  const [lastName,   setLastName]   = useState(parts.slice(1).join(' ') || '');
  const [saving,     setSaving]     = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!token) return;
    try {
      const fresh = await api.profile.get(token);
      await login(token, fresh);
    } catch {}
  }, [token, login]);

  useFocusEffect(useCallback(() => { fetchProfile(); }, [fetchProfile]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    clearApiCache();
    try { await fetchProfile(); } finally { setRefreshing(false); }
  }, [fetchProfile]);

  const openEdit = () => {
    const p = (user?.name || '').split(' ');
    setFirstName(p[0] || '');
    setLastName(p.slice(1).join(' ') || '');
    setEditing(true);
  };

  const save = async () => {
    const full = `${firstName.trim()} ${lastName.trim()}`.trim();
    if (!full) return;
    setSaving(true);
    try {
      const updated = await api.profile.update(full);
      await login(token!, updated);
      setEditing(false);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmLogout = async () => {
    const ok = await confirm({
      title: tr('profile_logout'),
      message: tr('profile_logout_msg'),
      confirmText: tr('profile_logout'),
      cancelText: lang === 'de' ? 'Abbrechen' : 'Cancel',
      destructive: true,
    });
    if (ok) { await logout(); router.replace('/welcome'); }
  };

  const stats = user?.stats;
  const displayName = user?.name || user?.email?.split('@')[0] || 'Athlete';
  const initials = displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} colors={[colors.accent]} />}
      >

        {/* Title */}
        <Text style={s.title}>{lang === 'de' ? 'Profil' : 'Profile'}</Text>

        {/* User card — tap to open Apple-style name editor */}
        {editing ? (
          <View style={s.nameEditor}>
            {/* Header: X — Name — ✓ */}
            <View style={s.neHeader}>
              <TouchableOpacity onPress={() => setEditing(false)} hitSlop={12} style={s.neHeaderBtn}>
                <Ionicons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
              <Text style={s.neTitle}>{lang === 'de' ? 'Name' : 'Name'}</Text>
              <TouchableOpacity onPress={save} disabled={saving} hitSlop={12} style={s.neHeaderBtn}>
                {saving
                  ? <ActivityIndicator color={colors.accent} size="small" />
                  : <Ionicons name="checkmark" size={22} color={colors.accent} />}
              </TouchableOpacity>
            </View>

            {/* Form rows */}
            <View style={s.neGroup}>
              <View style={s.neRow}>
                <Text style={s.neLabel}>{lang === 'de' ? 'Vorname' : 'First'}</Text>
                <TextInput
                  style={s.neInput}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder={lang === 'de' ? 'Vorname' : 'First name'}
                  placeholderTextColor="#48484A"
                  autoFocus
                  autoCapitalize="words"
                />
              </View>
              <View style={s.neDivider} />
              <View style={s.neRow}>
                <Text style={s.neLabel}>{lang === 'de' ? 'Nachname' : 'Last'}</Text>
                <TextInput
                  style={s.neInput}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder={lang === 'de' ? 'Nachname' : 'Last name'}
                  placeholderTextColor="#48484A"
                  autoCapitalize="words"
                />
              </View>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={s.userCard}
            activeOpacity={0.85}
            onPress={openEdit}
          >
            <View style={s.avatar}>
              <Text style={s.avatarText}>{initials}</Text>
            </View>
            <View style={s.userInfo}>
              <Text style={s.userName} numberOfLines={1}>{displayName}</Text>
              <Text style={s.userSub} numberOfLines={1}>
                {user?.email}
                {user?.is_premium && '  ·  PRO'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </TouchableOpacity>
        )}

        {/* Stats row */}
        <View style={s.statsRow}>
          <StatBox num={stats?.total_workouts ?? 0} label={tr('profile_workouts')} />
          <StatBox num={stats?.streak ?? 0} label={tr('profile_streak')} />
          <StatBox num={stats?.total_plans ?? 0} label={tr('profile_plans')} />
        </View>

        {/* ── Account section ─────────────────── */}
        <View style={s.section}>
          <MenuRow
            icon="person-outline"
            label={lang === 'de' ? 'Profil bearbeiten' : 'Edit Profile'}
            onPress={openEdit}
          />
          <MenuRow
            icon="card-outline"
            label={lang === 'de' ? 'Abo' : 'Subscription'}
            value={user?.is_premium ? 'PRO' : 'Free'}
            accent={user?.is_premium}
            onPress={() => router.push('/subscription' as any)}
            last
          />
        </View>

        {/* ── Preferences section ─────────────── */}
        <Text style={s.sectionLabel}>
          {lang === 'de' ? 'EINSTELLUNGEN' : 'PREFERENCES'}
        </Text>
        <View style={s.section}>
          <MenuRow
            icon="globe-outline"
            label={lang === 'de' ? 'Sprache' : 'Language'}
            onPress={() => {}}
            custom={
              <View style={s.langRow}>
                <TouchableOpacity
                  style={[s.langBtn, lang === 'en' && s.langBtnActive]}
                  onPress={() => setLang('en')}
                  activeOpacity={0.8}
                >
                  <Text style={[s.langBtnText, lang === 'en' && s.langBtnTextActive]}>EN</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.langBtn, lang === 'de' && s.langBtnActive]}
                  onPress={() => setLang('de')}
                  activeOpacity={0.8}
                >
                  <Text style={[s.langBtnText, lang === 'de' && s.langBtnTextActive]}>DE</Text>
                </TouchableOpacity>
              </View>
            }
          />
          <MenuRow
            icon="notifications-outline"
            label={lang === 'de' ? 'Benachrichtigungen' : 'Notifications'}
            onPress={() => router.push('/notifications' as any)}
            last
          />
        </View>

        {/* ── Support section ─────────────────── */}
        <Text style={s.sectionLabel}>
          {lang === 'de' ? 'SUPPORT' : 'SUPPORT'}
        </Text>
        <View style={s.section}>
          <MenuRow
            icon="shield-checkmark-outline"
            label={lang === 'de' ? 'Datenschutz' : 'Privacy & Security'}
            onPress={() => router.push('/privacy')}
          />
          <MenuRow
            icon="help-circle-outline"
            label={lang === 'de' ? 'Hilfe & FAQ' : 'Help & FAQ'}
            onPress={() => router.push('/help')}
          />
          <MenuRow
            icon="document-text-outline"
            label={lang === 'de' ? 'Nutzungsbedingungen' : 'Terms'}
            onPress={() => router.push('/terms')}
            last
          />
        </View>

        {/* Logout */}
        <TouchableOpacity style={s.logoutBtn} onPress={confirmLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={18} color={colors.accent} />
          <Text style={s.logoutText}>{tr('profile_logout')}</Text>
        </TouchableOpacity>

        <Text style={s.version}>{tr('profile_version')}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Stat box ──────────────────────────────────────────────────────────────
function StatBox({ num, label }: { num: number; label: string }) {
  return (
    <View style={s.statCard}>
      <Text style={s.statNum}>{num}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

// ── Menu row ──────────────────────────────────────────────────────────────
function MenuRow({ icon, label, value, accent, onPress, custom, last }: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value?: string;
  accent?: boolean;
  onPress?: () => void;
  custom?: React.ReactNode;
  last?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[rs.row, !last && rs.rowBorder]}
      onPress={custom ? undefined : onPress}
      activeOpacity={custom ? 1 : 0.7}
    >
      <Ionicons name={icon} size={20} color={colors.muted} style={rs.icon} />
      <Text style={rs.label}>{label}</Text>
      <View style={{ flex: 1 }} />
      {custom ?? (
        <>
          {value && <Text style={[rs.value, accent && rs.valueAccent]}>{value}</Text>}
          <Ionicons name="chevron-forward" size={16} color={colors.muted} />
        </>
      )}
    </TouchableOpacity>
  );
}

const rs = StyleSheet.create({
  row:         { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, gap: 12 },
  rowBorder:   { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#1f1f22' },
  icon:        { width: 22 },
  label:       { fontSize: 15, color: colors.text },
  value:       { fontSize: 13, color: colors.muted, marginRight: 4 },
  valueAccent: { color: colors.accent, fontWeight: '700' },
});

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#000' },
  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },

  title: {
    fontSize:     34,
    fontWeight:   '800',
    color:        colors.text,
    marginBottom: 18,
    paddingLeft:  4,
  },

  // User card — Apple Account style
  userCard: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             14,
    backgroundColor: '#1C1C1E',
    borderRadius:    16,
    padding:         16,
    marginBottom:    16,
  },
  avatar: {
    width:           52,
    height:          52,
    borderRadius:    26,
    backgroundColor: '#2C2C2E',
    alignItems:      'center',
    justifyContent:  'center',
  },
  avatarText: {
    fontSize:      17,
    fontWeight:    '800',
    color:         colors.text,
    letterSpacing: 1,
  },
  userInfo: { flex: 1, minWidth: 0 },
  userName: {
    fontSize:     16,
    fontWeight:   '700',
    color:        colors.text,
    marginBottom: 2,
  },
  userSub: {
    fontSize: 12,
    color:    colors.muted,
  },

  // ── Apple-style name editor ──────────────────────
  nameEditor: {
    backgroundColor: '#1C1C1E',
    borderRadius:    16,
    marginBottom:    16,
    overflow:        'hidden',
  },
  neHeader: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical:   14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#3A3A3C',
  },
  neHeaderBtn: {
    width:  36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  neTitle: {
    fontSize:   16,
    fontWeight: '600',
    color:      colors.text,
  },
  neGroup: {
    paddingHorizontal: 0,
  },
  neRow: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: 16,
    paddingVertical:   14,
  },
  neDivider: {
    height:           StyleSheet.hairlineWidth,
    backgroundColor:  '#3A3A3C',
    marginLeft:       16,
  },
  neLabel: {
    width:      70,
    fontSize:   15,
    color:      colors.text,
    fontWeight: '400',
  },
  neInput: {
    flex:            1,
    fontSize:        15,
    color:           colors.text,
    fontWeight:      '500',
    padding:         0,
    borderWidth:     0,
    backgroundColor: 'transparent',
    outlineStyle:    'none',
    outlineWidth:    0,
  } as any,

  // Stats row
  statsRow: {
    flexDirection: 'row',
    gap:           10,
    marginBottom:  20,
  },
  statCard: {
    flex:            1,
    backgroundColor: '#1C1C1E',
    borderRadius:    14,
    paddingVertical: 16,
    alignItems:      'center',
  },
  statNum:   { fontSize: 22, fontWeight: '800', color: colors.accent, lineHeight: 26 },
  statLabel: { fontSize: 10, color: colors.muted, marginTop: 3, fontWeight: '600', letterSpacing: 0.3 },

  // Sections — Apple grouped list style
  sectionLabel: {
    fontSize:      12,
    fontWeight:    '600',
    color:         colors.muted,
    marginLeft:    16,
    marginBottom:  6,
    marginTop:     4,
  },
  section: {
    backgroundColor: '#1C1C1E',
    borderRadius:    14,
    marginBottom:    20,
    overflow:        'hidden',
  },

  // Language toggle inline
  langRow: {
    flexDirection: 'row',
    gap:           6,
  },
  langBtn: {
    paddingHorizontal: 14,
    paddingVertical:   6,
    borderRadius:      8,
    backgroundColor:   '#2C2C2E',
  },
  langBtnActive: {
    backgroundColor: colors.accent,
  },
  langBtnText: {
    fontSize:   12,
    fontWeight: '800',
    color:      colors.muted,
  },
  langBtnTextActive: {
    color: '#fff',
  },

  // Logout
  logoutBtn: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             8,
    backgroundColor: '#1C1C1E',
    borderRadius:    14,
    paddingVertical: 16,
    marginTop:       4,
  },
  logoutText: {
    fontSize:   15,
    fontWeight: '600',
    color:      colors.accent,
  },

  version: { fontSize: 11, color: colors.muted, marginTop: 20, textAlign: 'center' },
});
