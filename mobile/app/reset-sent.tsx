import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/theme';

export default function ResetSent() {
  const router = useRouter();
  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        <View style={s.icon}><Text style={s.emoji}>✉️</Text></View>
        <Text style={s.title}>Check your <Text style={s.accent}>inbox</Text></Text>
        <Text style={s.sub}>We've sent a password reset link to your email.</Text>
        <TouchableOpacity style={s.cta} onPress={() => router.replace('/login')}>
          <Text style={s.ctaText}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  icon:      { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.accent + '20', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  emoji:     { fontSize: 32 },
  title:     { fontSize: 28, fontWeight: '800', color: colors.text, textAlign: 'center' },
  accent:    { color: colors.accent },
  sub:       { color: colors.muted, fontSize: 15, lineHeight: 23, marginTop: 12, textAlign: 'center' },
  cta:       { backgroundColor: colors.cta, borderRadius: 14, paddingVertical: 16, paddingHorizontal: 48, marginTop: 32 },
  ctaText:   { fontSize: 17, fontWeight: '700', color: colors.bg },
});
