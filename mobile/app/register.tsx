import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/api';
import { colors } from '@/theme';
import { BackArrow, Divider } from './_components';

export default function Register() {
  const router = useRouter();
  const { login } = useAuth();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const submit = async () => {
    setError(''); setLoading(true);
    try {
      const data = await api.auth.register(email.trim(), password);
      await login(data.token, data.user);
      router.replace('/(tabs)');
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()}><BackArrow /></TouchableOpacity>
          <Text style={s.title}>Sign Up</Text>
        </View>
        <Divider label="With a mail address" />
        <View style={s.form}>
          <View>
            <Text style={s.label}>Email Address</Text>
            <TextInput style={s.input} placeholder="Email Address" placeholderTextColor={colors.muted} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          </View>
          <View>
            <Text style={s.label}>Password</Text>
            <TextInput style={s.input} placeholder="Choose a password (min. 6 chars)" placeholderTextColor={colors.muted} value={password} onChangeText={setPassword} secureTextEntry onSubmitEditing={submit} />
          </View>
          {error ? <Text style={s.error}>{error}</Text> : null}
          <TouchableOpacity style={[s.cta, loading && s.disabled]} onPress={submit} disabled={loading}>
            <Text style={s.ctaText}>{loading ? 'Creating account…' : 'Continue'}</Text>
          </TouchableOpacity>
        </View>
        <Text style={s.legal}>By continuing, you agree to Kyroo's Privacy Policy and Terms and Conditions</Text>
        <Divider label="or" />
        <View style={s.socials}>
          <TouchableOpacity style={s.social}><Text style={s.socialText}>Continue with Apple</Text></TouchableOpacity>
          <TouchableOpacity style={s.social}><Text style={s.socialText}>Continue with Google</Text></TouchableOpacity>
        </View>
        <Text style={s.footer}>Already have an account?{'  '}
          <Text style={s.link} onPress={() => router.push('/login')}>Login</Text>
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: colors.bg },
  scroll:     { padding: 24, paddingBottom: 40 },
  header:     { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
  title:      { fontSize: 26, fontWeight: '800', color: colors.text },
  label:      { fontSize: 12, color: colors.muted, fontWeight: '500', letterSpacing: 0.5, marginBottom: 6 },
  input:      { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 16, fontSize: 16, color: colors.text },
  form:       { gap: 12 },
  error:      { color: colors.error, fontSize: 13, textAlign: 'center' },
  cta:        { backgroundColor: colors.cta, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  ctaText:    { fontSize: 17, fontWeight: '700', color: colors.bg },
  disabled:   { opacity: 0.6 },
  legal:      { fontSize: 12, color: colors.muted, textAlign: 'center', lineHeight: 18, marginVertical: 8 },
  socials:    { gap: 10 },
  social:     { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  socialText: { fontSize: 16, fontWeight: '600', color: colors.text },
  footer:     { textAlign: 'center', color: colors.muted, fontSize: 14, marginTop: 24 },
  link:       { color: colors.accent, fontWeight: '600' },
});
