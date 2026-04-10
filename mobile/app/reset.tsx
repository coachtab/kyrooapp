import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '@/api';
import { colors } from '@/theme';
import { BackArrow } from './_components';

export default function Reset() {
  const router = useRouter();
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try { await api.auth.forgotPassword(email.trim()); router.push('/reset-sent'); }
    finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()}><BackArrow /></TouchableOpacity>
          <Text style={s.title}>Reset <Text style={s.accent}>Password</Text></Text>
        </View>
        <Text style={s.sub}>Enter your email and we'll send you a link to reset your password.</Text>
        <Text style={s.label}>Email Address</Text>
        <TextInput style={s.input} placeholder="your@email.com" placeholderTextColor={colors.muted} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" onSubmitEditing={submit} />
        <TouchableOpacity style={[s.cta, loading && s.disabled]} onPress={submit} disabled={loading}>
          <Text style={s.ctaText}>{loading ? 'Sending…' : 'Send Reset Link'}</Text>
        </TouchableOpacity>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: colors.bg },
  scroll:  { padding: 24 },
  header:  { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  title:   { fontSize: 26, fontWeight: '800', color: colors.text },
  accent:  { color: colors.accent },
  sub:     { color: colors.muted, fontSize: 15, lineHeight: 23, marginBottom: 24 },
  label:   { fontSize: 12, color: colors.muted, fontWeight: '500', letterSpacing: 0.5, marginBottom: 6 },
  input:   { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 16, fontSize: 16, color: colors.text },
  cta:     { backgroundColor: colors.cta, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 16 },
  ctaText: { fontSize: 17, fontWeight: '700', color: colors.bg },
  disabled: { opacity: 0.6 },
});
