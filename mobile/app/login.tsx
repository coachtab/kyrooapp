import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/api';
import { colors } from '@/theme';
import { useT } from '@/i18n';

function AppleLogo({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="#FFFFFF">
      <Path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </Svg>
  );
}

function GoogleLogo({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <Path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <Path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <Path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </Svg>
  );
}

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
          <AppleLogo size={22} />
          <Text style={s.socialText}>{tr('login_apple')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.social}>
          <GoogleLogo size={22} />
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
