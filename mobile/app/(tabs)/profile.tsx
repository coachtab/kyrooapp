import { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, ActivityIndicator, Platform, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { api, clearApiCache } from '@/api';
import { colors } from '@/theme';
import { useT } from '@/i18n';

export default function ProfileTab() {
  const router = useRouter();
  const { user, token, logout, login } = useAuth();
  const { tr, lang } = useT();
  const [editing,    setEditing]    = useState(false);
  const [name,       setName]       = useState(user?.name || '');
  const [saving,     setSaving]     = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Always fetch fresh profile stats whenever the tab comes into focus
  const fetchProfile = useCallback(async () => {
    if (!token) return;
    try {
      const fresh = await api.profile.get(token);
      await login(token, fresh);
    } catch {}
  }, [token, login]);

  useFocusEffect(useCallback(() => {
    fetchProfile();
  }, [fetchProfile]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    clearApiCache();
    try { await fetchProfile(); } finally { setRefreshing(false); }
  }, [fetchProfile]);

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

  const stats = user?.stats;
  const displayName = user?.name || user?.email?.split('@')[0] || 'Athlete';
  const initials = displayName
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <View style={s.header}>
        <Text style={s.title}>
          {lang === 'de' ? 'Profil' : 'Profile'}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} colors={[colors.accent]} />}
      >

        {/* User card */}
        <View style={s.userCard}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
          <View style={s.userInfo}>
            {editing ? (
              <View style={s.editRow}>
                <TextInput
                  style={s.nameInput}
                  value={name}
                  onChangeText={setName}
                  placeholder={tr('profile_tap_name')}
                  placeholderTextColor={colors.muted}
                  autoFocus
                />
                <TouchableOpacity style={s.saveBtn} onPress={save} disabled={saving}>
                  {saving
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Ionicons name="checkmark" size={18} color="#fff" />
                  }
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={() => setEditing(true)} activeOpacity={0.7}>
                <Text style={s.userName} numberOfLines={1}>{displayName}</Text>
              </TouchableOpacity>
            )}
            <Text style={s.userEmail} numberOfLines={1}>{user?.email}</Text>
          </View>
          {user?.is_premium && (
            <View style={s.proBadge}>
              <Text style={s.proBadgeText}>PRO</Text>
            </View>
          )}
        </View>

        {/* Stats row */}
        <View style={s.statsRow}>
          <View style={s.statCard}>
            <Text style={s.statNum}>{stats?.total_workouts ?? 0}</Text>
            <Text style={s.statLabel}>{tr('profile_workouts')}</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statNum}>{stats?.streak ?? 0}</Text>
            <Text style={s.statLabel}>{tr('profile_streak')}</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statNum}>{stats?.total_plans ?? 0}</Text>
            <Text style={s.statLabel}>{tr('profile_plans')}</Text>
          </View>
        </View>

        {/* Menu list */}
        <View style={s.menuList}>
          <MenuRow
            label={lang === 'de' ? 'Profil bearbeiten' : 'Edit Profile'}
            onPress={() => setEditing(true)}
          />
          <MenuRow
            label={lang === 'de' ? 'Abo' : 'Subscription'}
            value={user?.is_premium ? tr('profile_plan_pro') : tr('profile_plan_free')}
            accent={user?.is_premium}
            onPress={() => {}}
          />
          <MenuRow
            label={lang === 'de' ? 'Benachrichtigungen' : 'Notifications'}
            onPress={() => router.push('/notifications' as any)}
          />
          <MenuRow
            label={lang === 'de' ? 'Sprache' : 'Language'}
            value={lang === 'de' ? 'Deutsch' : 'English'}
            onPress={() => router.push('/language' as any)}
          />
          <MenuRow
            label={lang === 'de' ? 'Datenschutz & Sicherheit' : 'Privacy & Security'}
            onPress={() => router.push('/privacy')}
          />
          <MenuRow
            label={lang === 'de' ? 'Hilfe & FAQ' : 'Help & FAQ'}
            onPress={() => router.push('/help')}
          />
          <MenuRow
            label={lang === 'de' ? 'Nutzungsbedingungen' : 'Terms & Privacy'}
            onPress={() => router.push('/terms')}
          />
        </View>

        {/* Logout */}
        <TouchableOpacity style={s.logoutBtn} onPress={confirmLogout} activeOpacity={0.8}>
          <Text style={s.logoutText}>{tr('profile_logout')}</Text>
        </TouchableOpacity>

        <Text style={s.version}>{tr('profile_version')}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuRow({ label, value, accent, onPress }: {
  label: string; value?: string; accent?: boolean; onPress?: () => void;
}) {
  return (
    <TouchableOpacity style={rs.row} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
      <Text style={rs.label}>{label}</Text>
      <View style={{ flex: 1 }} />
      {value && <Text style={[rs.value, accent && rs.valueAccent]}>{value}</Text>}
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </TouchableOpacity>
  );
}

const rs = StyleSheet.create({
  row:        { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 12 },
  label:      { fontSize: 15, color: colors.text, fontWeight: '600' },
  value:      { fontSize: 13, color: colors.muted },
  valueAccent:{ color: colors.accent, fontWeight: '700' },
});

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#000' },

  // Header — matches Home + My Plans
  header: { paddingHorizontal: 28, paddingTop: 24, paddingBottom: 16 },
  title:  { fontSize: 28, fontWeight: '800', color: colors.text },

  scroll: { paddingHorizontal: 20, paddingBottom: 40 },

  // User card
  userCard: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             14,
    backgroundColor: '#0d0d0d',
    borderRadius:    16,
    borderWidth:     1.5,
    borderColor:     colors.border,
    padding:         16,
    marginBottom:    14,
  },
  avatar: {
    width:           56,
    height:          56,
    borderRadius:    28,
    backgroundColor: '#1a1a1a',
    borderWidth:     1.5,
    borderColor:     colors.border,
    alignItems:      'center',
    justifyContent:  'center',
  },
  avatarText: {
    fontSize:   18,
    fontWeight: '800',
    color:      colors.text,
    letterSpacing: 1,
  },
  userInfo: { flex: 1, minWidth: 0 },
  userName: {
    fontSize:     17,
    fontWeight:   '800',
    color:        colors.text,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color:    colors.muted,
  },
  editRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nameInput: { flex: 1, fontSize: 17, fontWeight: '800', color: colors.text, paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: colors.accent },
  saveBtn:   { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },

  proBadge:    { backgroundColor: colors.accent, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  proBadgeText:{ fontSize: 10, fontWeight: '800', color: '#fff', letterSpacing: 1 },

  // Stats row — 3 cards
  statsRow:  {
    flexDirection: 'row',
    gap:           10,
    marginBottom:  14,
  },
  statCard: {
    flex:             1,
    backgroundColor:  '#0d0d0d',
    borderRadius:     14,
    borderWidth:      1.5,
    borderColor:      colors.border,
    paddingVertical:  18,
    alignItems:       'center',
  },
  statNum:   { fontSize: 24, fontWeight: '800', color: colors.accent, lineHeight: 28 },
  statLabel: { fontSize: 11, color: colors.muted, marginTop: 4, fontWeight: '600' },

  // Menu list
  menuList: { marginTop: 4 },

  // Logout — outlined accent button
  logoutBtn: {
    borderWidth:     1.5,
    borderColor:     colors.accent,
    borderRadius:    14,
    paddingVertical: 16,
    alignItems:      'center',
    marginTop:       24,
  },
  logoutText: {
    fontSize:   16,
    fontWeight: '700',
    color:      colors.accent,
  },

  version: { fontSize: 12, color: colors.muted, marginTop: 20, textAlign: 'center' },
});
