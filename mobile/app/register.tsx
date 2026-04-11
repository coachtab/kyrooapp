import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/api';
import { colors } from '@/theme';
import { useT } from '@/i18n';

export default function Register() {
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
      await api.auth.register(email.trim(), password);
      router.replace({ pathname: '/verify-email', params: { email: email.trim() } } as any);
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
          <Text style={s.title}>Sign Up</Text>
        </View>

        {/* Divider — "With a mail address" */}
        <View style={s.divider}>
          <View style={s.line} />
          <Text style={s.divLabel}>With a mail address</Text>
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

        {/* CTA — "Continue" */}
        <TouchableOpacity style={[s.cta, loading && s.disabled]} onPress={submit} disabled={loading}>
          <Text style={s.ctaText}>{loading ? 'Creating account...' : 'Continue'}</Text>
        </TouchableOpacity>

        {/* Legal */}
        <Text style={s.legal}>
          By continuing, you agree to Kyroo's{' '}
          <Text style={s.legalLink} onPress={() => router.push('/privacy-policy')}>Privacy Policy</Text> and{' '}
          <Text style={s.legalLink} onPress={() => router.push('/terms')}>Terms and Conditions</Text>
        </Text>

        {/* Footer */}
        <Text style={s.footer}>
          Already have an account?{' '}
          <Text style={s.footerLink} onPress={() => router.push('/login')}>Login</Text>
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

  // Legal
  legal:     { fontSize: 13, color: '#888', lineHeight: 20, marginTop: 14 },
  legalLink: { color: '#FFFFFF', textDecorationLine: 'underline' },

  // Footer
  footer:     { textAlign: 'center', color: '#888', fontSize: 14, marginTop: 16 },
  footerLink: { color: '#FFFFFF', textDecorationLine: 'underline', fontWeight: '600' },
});
