import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme';
import { useT } from '@/i18n';

export default function ResetSent() {
  const router = useRouter();
  const { lang } = useT();
  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        <View style={s.icon}><Text style={s.emoji}>✉️</Text></View>
        <Text style={s.title}>
          {lang === 'de'
            ? <>Schau in dein <Text style={s.accent}>Postfach</Text></>
            : <>Check your <Text style={s.accent}>inbox</Text></>}
        </Text>
        <Text style={s.sub}>
          {lang === 'de'
            ? 'Wir haben dir einen Link zum Zurücksetzen deines Passworts geschickt.'
            : "We've sent a password reset link to your email."}
        </Text>

        <View style={s.spamCard}>
          <Ionicons name="alert-circle-outline" size={18} color={colors.accent} />
          <Text style={s.spamText}>
            {lang === 'de'
              ? 'Keine Mail im Posteingang? Schau bitte auch in deinem Spam- oder Junk-Ordner nach — diese Mails landen manchmal dort.'
              : "Can't find it? Please also check your Spam or Junk folder — these emails sometimes land there."}
          </Text>
        </View>

        <TouchableOpacity style={s.cta} onPress={() => router.replace('/login')}>
          <Text style={s.ctaText}>
            {lang === 'de' ? 'Zurück zum Login' : 'Back to Login'}
          </Text>
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
  sub:       { color: colors.muted, fontSize: 15, lineHeight: 23, marginTop: 12, textAlign: 'center', marginBottom: 20 },

  spamCard: {
    flexDirection:     'row',
    alignItems:        'flex-start',
    gap:               10,
    backgroundColor:   'rgba(233, 69, 96, 0.08)',
    borderWidth:       1,
    borderColor:       'rgba(233, 69, 96, 0.35)',
    borderRadius:      12,
    paddingHorizontal: 14,
    paddingVertical:   12,
    maxWidth:          340,
  },
  spamText: { flex: 1, fontSize: 13, lineHeight: 19, color: '#E0E0E0' },

  cta:       { backgroundColor: colors.cta, borderRadius: 14, paddingVertical: 16, paddingHorizontal: 48, marginTop: 28 },
  ctaText:   { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
});
