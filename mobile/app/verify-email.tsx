import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/api';
import { colors } from '@/theme';

export default function VerifyEmail() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [resent, setResent] = useState(false);
  const [sending, setSending] = useState(false);

  const resend = async () => {
    if (!email || sending) return;
    setSending(true);
    try {
      await api.auth.resendVerification(email);
      setResent(true);
    } catch {}
    finally { setSending(false); }
  };

  return (
    <View style={s.root}>
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        <View style={s.center}>
          <Ionicons name="mail-outline" size={64} color={colors.accent} style={{ marginBottom: 24 }} />
          <Text style={s.title}>Check your <Text style={s.accent}>email</Text></Text>
          <Text style={s.subtitle}>
            We sent an activation link to{'\n'}
            <Text style={s.emailText}>{email || 'your email'}</Text>
          </Text>
          <Text style={s.hint}>
            Click the link in the email to activate{'\n'}your account, then come back and log in.
          </Text>

          {resent ? (
            <Text style={s.resentText}>Email sent again!</Text>
          ) : (
            <TouchableOpacity onPress={resend} disabled={sending} style={s.resendBtn}>
              <Text style={s.resendText}>
                {sending ? 'Sending...' : "Didn't get it? Resend"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={s.loginBtn} activeOpacity={0.85} onPress={() => router.replace('/login')}>
          <Text style={s.loginBtnText}>Go to Login</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  safe: { flex: 1, paddingHorizontal: 28 },

  center: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
  },
  title: {
    fontSize:   28,
    fontWeight: '800',
    color:      '#FFFFFF',
    textAlign:  'center',
    marginBottom: 12,
  },
  accent: { color: colors.accent },
  subtitle: {
    fontSize:   16,
    color:      '#999',
    textAlign:  'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  emailText: {
    color:      '#FFFFFF',
    fontWeight: '600',
  },
  hint: {
    fontSize:   14,
    color:      '#666',
    textAlign:  'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  resendBtn: {
    paddingVertical: 10,
  },
  resendText: {
    fontSize: 14,
    color:    colors.accent,
    fontWeight: '600',
  },
  resentText: {
    fontSize: 14,
    color:    '#4CAF50',
    fontWeight: '600',
  },

  loginBtn: {
    backgroundColor: colors.cta,
    borderRadius:    14,
    paddingVertical: 18,
    alignItems:      'center',
    marginBottom:    16,
  },
  loginBtnText: {
    fontSize:   18,
    fontWeight: '700',
    color:      '#FFFFFF',
  },
});
