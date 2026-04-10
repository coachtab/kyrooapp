import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/api';
import { colors } from '@/theme';
import { useT } from '@/i18n';
import { BackArrow } from './_components';

export default function PrivacyScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const { tr } = useT();

  // Change password state
  const [current,  setCurrent]  = useState('');
  const [next,     setNext]     = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [pwSaving, setPwSaving] = useState(false);

  // Delete account state
  const [deleteText, setDeleteText] = useState('');
  const [deleting,   setDeleting]   = useState(false);

  const CONFIRM_WORD = tr('psec_delete_confirm').includes('DELETE') ? 'DELETE' : 'LÖSCHEN';

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
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setPwSaving(false);
    }
  }

  function handleDeleteAccount() {
    Alert.alert(
      tr('psec_delete'),
      tr('psec_delete_msg'),
      [
        { text: tr('profile_cancel'), style: 'cancel' },
        {
          text: tr('psec_delete'),
          style: 'destructive',
          onPress: async () => {
            if (deleteText.toUpperCase() !== CONFIRM_WORD) {
              Alert.alert('', tr('psec_delete_confirm'));
              return;
            }
            setDeleting(true);
            try {
              await api.account.delete();
              Alert.alert('', tr('psec_delete_done'), [
                { text: 'OK', onPress: () => { logout(); router.replace('/'); } },
              ]);
            } catch (err: any) {
              Alert.alert('Error', err.message);
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={s.back} onPress={() => router.back()}>
          <BackArrow />
        </TouchableOpacity>

        <Text style={s.title}>
          {tr('psec_title')} <Text style={s.accent}>{tr('psec_accent')}</Text>
        </Text>

        {/* ── Change password ── */}
        <View style={s.card}>
          <Text style={s.sectionLabel}>{tr('psec_pw_section')}</Text>

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
            style={[s.input, { marginBottom: 0 }]}
            value={confirm}
            onChangeText={setConfirm}
            placeholder={tr('psec_pw_confirm')}
            placeholderTextColor={colors.muted}
            secureTextEntry
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={[s.saveBtn, pwSaving && s.saveBtnDisabled]}
            onPress={handleChangePassword}
            disabled={pwSaving || !current || !next || !confirm}
            activeOpacity={0.8}
          >
            {pwSaving
              ? <ActivityIndicator color={colors.bg} size="small" />
              : <Text style={s.saveBtnText}>{tr('psec_pw_save')}</Text>
            }
          </TouchableOpacity>
        </View>

        {/* ── Delete account ── */}
        <View style={s.dangerCard}>
          <Text style={s.sectionLabel}>{tr('psec_data_section')}</Text>
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
            style={[s.deleteBtn, (deleting || deleteText.toUpperCase() !== CONFIRM_WORD) && s.deleteBtnDisabled]}
            onPress={handleDeleteAccount}
            disabled={deleting || deleteText.toUpperCase() !== CONFIRM_WORD}
            activeOpacity={0.8}
          >
            {deleting
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={s.deleteBtnText}>{tr('psec_delete')}</Text>
            }
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: colors.bg },
  scroll:  { padding: 20, paddingBottom: 48 },
  back:    { marginBottom: 20 },
  title:   { fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: 28 },
  accent:  { color: colors.accent },

  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
    gap: 12,
  },
  dangerCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.accent + '40',
    gap: 12,
  },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: colors.muted, marginBottom: 4 },

  input: {
    backgroundColor: colors.card2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: colors.text,
    marginBottom: 0,
  },
  deleteInput: { borderColor: colors.accent + '50' },

  saveBtn: {
    backgroundColor: colors.cta,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: colors.bg },

  deleteMsg: { fontSize: 14, color: colors.muted, lineHeight: 21 },

  deleteBtn: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  deleteBtnDisabled: { opacity: 0.4 },
  deleteBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
