import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/api';
import { colors } from '@/theme';
import { useT } from '@/i18n';

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();
  const { tr } = useT();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const submit = async () => {
    setError(''); setLoading(true);
    try {
      const data = await api.auth.login(email.trim(), password);
      await login(data.token, data.user);
      router.replace('/(tabs)');
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        {/* Back */}
        <TouchableOpacity style={s.back} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={colors.muted} />
          <Text style={s.backText}>Back</Text>
        </TouchableOpacity>

        {/* Title — Ochy centered bold */}
        <Text style={s.title}>Welcome <Text style={s.accent}>Back</Text></Text>

        {/* Divider */}
        <View style={s.divider}>
          <View style={s.line} /><Text style={s.divLabel}>{tr('login_divider')}</Text><View style={s.line} />
        </View>

        {/* Form */}
        <Text style={s.label}>{tr('login_email')}</Text>
        <TextInput
          style={s.input}
          placeholder={tr('login_email')}
          placeholderTextColor={colors.muted}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={s.label}>{tr('login_password')}</Text>
        <TextInput
          style={s.input}
          placeholder={tr('login_password')}
          placeholderTextColor={colors.muted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          onSubmitEditing={submit}
        />

        <TouchableOpacity onPress={() => router.push('/reset')} style={{ alignSelf: 'flex-end', marginTop: 4 }}>
          <Text style={s.link}>{tr('login_forgot')}</Text>
        </TouchableOpacity>

        {error ? <Text style={s.error}>{error}</Text> : null}

        {/* CTA — Ochy full-width */}
        <TouchableOpacity style={[s.cta, loading && s.disabled]} onPress={submit} disabled={loading}>
          <Text style={s.ctaText}>{loading ? tr('login_loading') : tr('login_submit')}</Text>
        </TouchableOpacity>

        {/* Divider */}
        <View style={s.divider}>
          <View style={s.line} /><Text style={s.divLabel}>or</Text><View style={s.line} />
        </View>

        {/* Social — Ochy bordered buttons */}
        <TouchableOpacity style={s.social}>
          <Ionicons name="logo-apple" size={19} color={colors.text} />
          <Text style={s.socialText}>{tr('login_apple')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.social}>
          <Ionicons name="logo-google" size={17} color={colors.text} />
          <Text style={s.socialText}>{tr('login_google')}</Text>
        </TouchableOpacity>

        <Text style={s.footer}>
          {tr('login_footer')}{'  '}
          <Text style={s.link} onPress={() => router.push('/register')}>{tr('login_register')}</Text>
        </Text>

      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: colors.bg },
  scroll:     { paddingHorizontal: 28, paddingTop: 16, paddingBottom: 40 },

  back:       { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 24, alignSelf: 'flex-start' },
  backText:   { fontSize: 14, color: colors.muted },

  title:      { fontSize: 30, fontWeight: '800', color: colors.text, textAlign: 'center', marginBottom: 8 },
  accent:     { color: colors.accent },

  divider:    { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 20 },
  line:       { flex: 1, height: 1, backgroundColor: colors.border },
  divLabel:   { fontSize: 12, color: colors.muted },

  label:      { fontSize: 14, color: colors.text, fontWeight: '700', marginBottom: 8, marginTop: 4 },
  input:      { borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 16, fontSize: 16, color: colors.text, marginBottom: 12 },
  link:       { color: colors.accent, fontWeight: '600', fontSize: 13 },
  error:      { color: colors.error, fontSize: 13, textAlign: 'center', marginTop: 8 },

  cta:        { backgroundColor: colors.cta, borderRadius: 14, paddingVertical: 17, alignItems: 'center', marginTop: 16 },
  ctaText:    { fontSize: 17, fontWeight: '700', color: colors.ctaText },
  disabled:   { opacity: 0.6 },

  social:     { borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 10 },
  socialText: { fontSize: 16, fontWeight: '600', color: colors.text },

  footer:     { textAlign: 'center', color: colors.muted, fontSize: 14, marginTop: 24 },
});
