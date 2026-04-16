import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/api';
import { colors } from '@/theme';
import { useActionSheet } from '@/context/ActionSheetContext';
import { useT } from '@/i18n';

export default function PrivacyScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const { tr, lang } = useT();
  const { confirm: confirmSheet } = useActionSheet();

  const [current,  setCurrent]  = useState('');
  const [next,     setNext]     = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [pwSaving, setPwSaving] = useState(false);

  const [deleteText, setDeleteText] = useState('');
  const [deleting,   setDeleting]   = useState(false);

  const CONFIRM_WORD = lang === 'de' ? 'LÖSCHEN' : 'DELETE';

  async function handleChangePassword() {
    if (next !== confirm) {
      Alert.alert('', tr('psec_pw_mismatch'));
      return;
    }
    if (next.length < 6) {
      Alert.alert('', tr('psec_pw_short'));
      return;
    }
    setPwSaving(true);
    try {
      await api.auth.changePassword(current, next);
      Alert.alert('', tr('psec_pw_success'));
      setCurrent(''); setNext(''); setConfirm('');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setPwSaving(false);
    }
  }

  async function doDelete() {
    setDeleting(true);
    try {
      await api.account.delete();
      await logout();
      router.replace('/welcome');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setDeleting(false);
    }
  }

  async function handleDeleteAccount() {
    if (deleteText.toUpperCase() !== CONFIRM_WORD) return;
    const ok = await confirmSheet({
      title: tr('psec_delete'),
      message: tr('psec_delete_msg'),
      confirmText: tr('psec_delete'),
      cancelText: lang === 'de' ? 'Abbrechen' : 'Cancel',
      destructive: true,
    });
    if (ok) doDelete();
  }

  const canDelete = deleteText.toUpperCase() === CONFIRM_WORD && !deleting;

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.title}>
          {lang === 'de' ? 'Datenschutz' : 'Privacy'}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={s.sub}>
          {lang === 'de'
            ? 'Verwalte dein Passwort und deine Kontodaten'
            : 'Manage your password and account data'}
        </Text>

        <Text style={s.sectionLabel}>{tr('psec_pw_section')}</Text>
        <View style={s.card}>
          <TextInput
            style={s.input}
            value={current}
            onChangeText={setCurrent}
            placeholder={tr('psec_pw_current')}
            placeholderTextColor={colors.muted}
            secureTextEntry
            autoCapitalize="none"
          />
          <TextInput
            style={s.input}
            value={next}
            onChangeText={setNext}
            placeholder={tr('psec_pw_new')}
            placeholderTextColor={colors.muted}
            secureTextEntry
            autoCapitalize="none"
          />
          <TextInput
            style={s.input}
            value={confirm}
            onChangeText={setConfirm}
            placeholder={tr('psec_pw_confirm')}
            placeholderTextColor={colors.muted}
            secureTextEntry
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={[s.saveBtn, (pwSaving || !current || !next || !confirm) && s.saveBtnDisabled]}
            onPress={handleChangePassword}
            disabled={pwSaving || !current || !next || !confirm}
            activeOpacity={0.8}
          >
            {pwSaving
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={s.saveBtnText}>{tr('psec_pw_save')}</Text>}
          </TouchableOpacity>
        </View>

        <Text style={s.sectionLabel}>{tr('psec_data_section')}</Text>
        <View style={s.dangerCard}>
          <Text style={s.deleteMsg}>{tr('psec_delete_msg')}</Text>
          <TextInput
            style={[s.input, s.deleteInput]}
            value={deleteText}
            onChangeText={setDeleteText}
            placeholder={tr('psec_delete_confirm')}
            placeholderTextColor={colors.muted}
            autoCapitalize="characters"
          />
          <TouchableOpacity
            style={[s.deleteBtn, !canDelete && s.deleteBtnDisabled]}
            onPress={handleDeleteAccount}
            disabled={!canDelete}
            activeOpacity={0.8}
          >
            {deleting
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={s.deleteBtnText}>{tr('psec_delete')}</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000' },

  header: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: 20,
    paddingTop:        24,
    paddingBottom:     16,
    gap:               4,
  },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  title:   { fontSize: 28, fontWeight: '800', color: colors.text },

  scroll:  { paddingHorizontal: 20, paddingBottom: 40 },
  sub:     { fontSize: 14, color: colors.muted, marginBottom: 22, lineHeight: 20 },

  sectionLabel: {
    fontSize:      11,
    fontWeight:    '800',
    color:         colors.muted,
    letterSpacing: 1.5,
    marginLeft:    4,
    marginBottom:  8,
    marginTop:     4,
  },

  card: {
    backgroundColor: '#0d0d0d',
    borderRadius:    16,
    borderWidth:     1.5,
    borderColor:     colors.border,
    padding:         16,
    gap:             12,
    marginBottom:    22,
  },
  dangerCard: {
    backgroundColor: '#0d0d0d',
    borderRadius:    16,
    borderWidth:     1.5,
    borderColor:     colors.accent + '55',
    padding:         16,
    gap:             12,
    marginBottom:    22,
  },

  input: {
    backgroundColor:   '#141416',
    borderWidth:       1,
    borderColor:       colors.border,
    borderRadius:      12,
    paddingHorizontal: 14,
    paddingVertical:   13,
    fontSize:          15,
    color:             colors.text,
  },
  deleteInput: { borderColor: colors.accent + '60' },

  saveBtn: {
    backgroundColor: colors.accent,
    borderRadius:    12,
    paddingVertical: 14,
    alignItems:      'center',
    marginTop:       2,
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText:     { fontSize: 15, fontWeight: '800', color: '#fff' },

  deleteMsg: { fontSize: 14, color: colors.muted, lineHeight: 21 },

  deleteBtn: {
    borderWidth:     1.5,
    borderColor:     colors.accent,
    borderRadius:    12,
    paddingVertical: 14,
    alignItems:      'center',
    marginTop:       2,
  },
  deleteBtnDisabled: { opacity: 0.4 },
  deleteBtnText:     { fontSize: 15, fontWeight: '800', color: colors.accent },
});
