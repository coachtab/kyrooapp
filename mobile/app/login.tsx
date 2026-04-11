import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/api';
import { colors } from '@/theme';

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
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const submit = async () => {
    setError(''); setLoading(true);
    try {
      const data = await api.auth.login(email.trim(), password);
      await login(data.token, data.user);
      router.replace('/greeting');
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        {/* Back + title — left-aligned row */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={s.title}>Welcome Back</Text>
        </View>

        {/* Divider — "Sign in with email" */}
        <View style={s.divider}>
          <View style={s.line} />
          <Text style={s.divLabel}>Sign in with email</Text>
          <View style={s.line} />
        </View>

        {/* Email */}
        <Text style={s.label}>Email Address</Text>
        <TextInput
          style={s.input}
          placeholder="Email Address"
          placeholderTextColor="#666"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        {/* Password */}
        <Text style={s.label}>Password</Text>
        <TextInput
          style={s.input}
          placeholder="Password"
          placeholderTextColor="#666"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          onSubmitEditing={submit}
        />

        {error ? <Text style={s.error}>{error}</Text> : null}

        {/* CTA — "Login" */}
        <TouchableOpacity style={[s.cta, loading && s.disabled]} onPress={submit} disabled={loading}>
          <Text style={s.ctaText}>{loading ? 'Signing in...' : 'Login'}</Text>
        </TouchableOpacity>

        {/* Divider — "or" */}
        <View style={s.divider}>
          <View style={s.line} />
          <Text style={s.divLabel}>or</Text>
          <View style={s.line} />
        </View>

        {/* Social buttons — real brand logos */}
        <TouchableOpacity style={s.social}>
          <AppleLogo size={22} />
          <Text style={s.socialText}>Continue with Apple</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[s.social, s.socialGoogle]}>
          <GoogleLogo size={22} />
          <Text style={s.socialText}>Continue with Google</Text>
        </TouchableOpacity>

        {/* Forgot password */}
        <Text style={s.forgot}>
          Forgot password?{' '}
          <Text style={s.forgotLink} onPress={() => router.push('/reset')}>Click here</Text>
        </Text>

        {/* Footer */}
        <Text style={s.footer}>
          Don't have an account?{' '}
          <Text style={s.footerLink} onPress={() => router.push('/register')}>Register here</Text>
        </Text>

      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#000' },
  scroll: { paddingHorizontal: 28, paddingTop: 12, paddingBottom: 40 },

  // Header
  header:   { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 24 },
  title:    { fontSize: 28, fontWeight: '800', color: '#FFFFFF' },

  // Divider
  divider:  { flexDirection: 'row', alignItems: 'center', gap: 14, marginVertical: 20 },
  line:     { flex: 1, height: 1, backgroundColor: '#333' },
  divLabel: { fontSize: 13, color: '#888' },

  // Form
  label:    { fontSize: 14, color: '#FFFFFF', fontWeight: '700', marginBottom: 8 },
  input:    { borderWidth: 1, borderColor: '#333', borderRadius: 10, padding: 16, fontSize: 16, color: '#FFFFFF', marginBottom: 16 },
  error:    { color: colors.error, fontSize: 13, textAlign: 'center', marginBottom: 8 },

  // CTA
  cta:      { backgroundColor: colors.cta, borderRadius: 12, paddingVertical: 17, alignItems: 'center', marginTop: 4 },
  ctaText:  { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
  disabled: { opacity: 0.6 },

  // Social
  social:      { borderWidth: 1, borderColor: '#333', borderRadius: 12, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 },
  socialGoogle:{ backgroundColor: '#1a1610' },
  socialText:  { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },

  // Forgot
  forgot:     { textAlign: 'center', color: '#888', fontSize: 14, marginTop: 16 },
  forgotLink: { color: '#FFFFFF', fontWeight: '600', textDecorationLine: 'underline' },

  // Footer
  footer:     { textAlign: 'center', color: '#888', fontSize: 14, marginTop: 12 },
  footerLink: { color: '#FFFFFF', fontWeight: '600', textDecorationLine: 'underline' },
});
