import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/theme';
import { useT } from '@/i18n';

export default function Welcome() {
  const router = useRouter();
  const { tr } = useT();
  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        <Text style={s.watermark}>K</Text>
        <View style={s.hero}>
          <Text style={s.brand}>{tr('welcome_brand')}</Text>
          <Text style={s.h1}>{tr('welcome_h1a')} <Text style={s.accent}>{tr('welcome_h1b')}</Text></Text>
          <Text style={s.h1}>{tr('welcome_h1c')}</Text>
          <Text style={s.sub}>{tr('welcome_sub')}</Text>
        </View>
        <View style={s.actions}>
          <TouchableOpacity style={s.cta} onPress={() => router.push('/register')}>
            <Text style={s.ctaText}>{tr('welcome_cta')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.outline} onPress={() => router.push('/login')}>
            <Text style={s.outlineText}>{tr('welcome_login')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: colors.bg },
  container:   { flex: 1, paddingHorizontal: 24, paddingBottom: 40, justifyContent: 'flex-end' },
  watermark:   { position: 'absolute', top: '12%', alignSelf: 'center', fontSize: 220, fontWeight: '900', color: colors.text, opacity: 0.05 },
  hero:        { marginBottom: 48 },
  brand:       { fontSize: 13, fontWeight: '700', letterSpacing: 6, color: colors.accent, textAlign: 'center', marginBottom: 12 },
  h1:          { fontSize: 36, fontWeight: '800', color: colors.text, lineHeight: 44, textAlign: 'center' },
  accent:      { color: colors.accent },
  sub:         { color: colors.muted, fontSize: 15, lineHeight: 23, marginTop: 16, textAlign: 'center' },
  actions:     { gap: 12 },
  cta:         { backgroundColor: colors.cta, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  ctaText:     { fontSize: 17, fontWeight: '700', color: colors.bg },
  outline:     { borderWidth: 1.5, borderColor: colors.border, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  outlineText: { fontSize: 17, fontWeight: '600', color: colors.text },
});
