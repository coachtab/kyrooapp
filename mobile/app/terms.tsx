import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme';
import { useT } from '@/i18n';

interface Section { title: string; body: string }

const SECTIONS_EN: Section[] = [
  { title: 'Acceptance of Terms',
    body: 'By downloading or using the Kyroo app, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the app.' },
  { title: 'Description of Service',
    body: 'Kyroo is an AI-powered fitness platform that provides personalised training programs, habit tracking, and wellness guidance. The app is available in Free and Pro tiers with different feature sets.' },
  { title: 'User Accounts',
    body: 'You must provide a valid email address to create an account. You are responsible for maintaining the confidentiality of your credentials and for all activity that occurs under your account. You must be at least 16 years old to use Kyroo.' },
  { title: 'Subscription & Payments',
    body: 'Kyroo Pro is a paid subscription billed monthly. Your subscription renews automatically unless you cancel at least 24 hours before the renewal date. All payments are processed securely. Refunds are subject to applicable store policies.' },
  { title: 'Health Disclaimer',
    body: 'Kyroo provides general fitness guidance only and is not a substitute for professional medical advice. Consult a qualified healthcare provider before starting any exercise program, especially if you have a pre-existing medical condition or injury.' },
  { title: 'Intellectual Property',
    body: 'All content, features, and functionality of Kyroo — including training programs, text, graphics, and AI-generated material — are owned by or licensed to Kyroo and protected by applicable intellectual property laws.' },
  { title: 'Privacy & Data',
    body: 'We collect only the data necessary to provide the service: your email, name, and fitness preferences. We do not sell or share your personal data with third parties. Your data is stored securely with industry-standard encryption. See our Privacy settings to manage or delete your data.' },
  { title: 'GDPR — Your Rights',
    body: 'If you are located in the European Economic Area, you have the right to access, correct, or delete your personal data at any time. You can exercise these rights directly from the app (Profile → Privacy) or by emailing us at support@kyroo.app.' },
  { title: 'Termination',
    body: 'You may delete your account at any time from Profile → Privacy. We reserve the right to suspend or terminate accounts that violate these terms. Upon termination, all data associated with your account is permanently deleted.' },
  { title: 'Changes to Terms',
    body: 'We may update these terms from time to time. We will notify you of any material changes via the app or by email. Continued use of Kyroo after changes are posted constitutes your acceptance of the updated terms.' },
  { title: 'Contact',
    body: 'For questions about these terms, please contact us at support@kyroo.app. We are committed to responding to all enquiries within 48 hours.' },
];

const SECTIONS_DE: Section[] = [
  { title: 'Nutzungsbedingungen',
    body: 'Durch das Herunterladen oder die Nutzung der Kyroo-App stimmst du diesen Nutzungsbedingungen zu. Wenn du nicht einverstanden bist, nutze die App bitte nicht.' },
  { title: 'Leistungsbeschreibung',
    body: 'Kyroo ist eine KI-gestützte Fitnessplattform, die personalisierte Trainingsprogramme, Gewohnheitsverfolgung und Wellness-Anleitungen bereitstellt. Die App ist in einer kostenlosen und einer Pro-Version mit unterschiedlichem Funktionsumfang verfügbar.' },
  { title: 'Nutzerkonten',
    body: 'Zur Kontoerstellung ist eine gültige E-Mail-Adresse erforderlich. Du bist für die Vertraulichkeit deiner Zugangsdaten und alle Aktivitäten unter deinem Konto verantwortlich. Du musst mindestens 16 Jahre alt sein, um Kyroo zu nutzen.' },
  { title: 'Abonnement & Zahlungen',
    body: 'Kyroo Pro ist ein kostenpflichtiges Monatsabonnement. Das Abonnement verlängert sich automatisch, es sei denn, du kündigst mindestens 24 Stunden vor dem Verlängerungsdatum. Alle Zahlungen werden sicher verarbeitet. Rückerstattungen unterliegen den jeweiligen Store-Richtlinien.' },
  { title: 'Gesundheitshinweis',
    body: 'Kyroo bietet nur allgemeine Fitnessanleitungen und ist kein Ersatz für ärztlichen Rat. Konsultiere vor Beginn eines Trainingsprogramms einen Arzt, insbesondere wenn du eine vorbestehende Erkrankung oder Verletzung hast.' },
  { title: 'Geistiges Eigentum',
    body: 'Alle Inhalte, Funktionen und Merkmale von Kyroo — einschließlich Trainingsprogramme, Texte, Grafiken und KI-generiertes Material — sind Eigentum von Kyroo oder werden lizenziert und durch geltendes Recht geschützt.' },
  { title: 'Datenschutz & Daten',
    body: 'Wir erfassen nur die Daten, die zur Bereitstellung des Dienstes erforderlich sind: deine E-Mail-Adresse, deinen Namen und deine Fitnessziele. Wir verkaufen oder teilen deine persönlichen Daten nicht mit Dritten. Deine Daten werden sicher mit branchenüblicher Verschlüsselung gespeichert. Unter Profil → Datenschutz kannst du deine Daten verwalten oder löschen.' },
  { title: 'DSGVO — Deine Rechte',
    body: 'Wenn du dich im Europäischen Wirtschaftsraum befindest, hast du jederzeit das Recht, deine persönlichen Daten einzusehen, zu korrigieren oder zu löschen. Du kannst diese Rechte direkt in der App (Profil → Datenschutz) oder per E-Mail an support@kyroo.app ausüben.' },
  { title: 'Kündigung',
    body: 'Du kannst dein Konto jederzeit unter Profil → Datenschutz löschen. Wir behalten uns das Recht vor, Konten zu sperren oder zu kündigen, die gegen diese Bedingungen verstoßen. Nach der Kündigung werden alle mit deinem Konto verbundenen Daten dauerhaft gelöscht.' },
  { title: 'Änderungen der Bedingungen',
    body: 'Wir können diese Bedingungen von Zeit zu Zeit aktualisieren. Wir werden dich über wesentliche Änderungen über die App oder per E-Mail informieren. Die weitere Nutzung von Kyroo nach Veröffentlichung der Änderungen gilt als Zustimmung zu den aktualisierten Bedingungen.' },
  { title: 'Kontakt',
    body: 'Bei Fragen zu diesen Bedingungen wende dich bitte an support@kyroo.app. Wir sind bemüht, alle Anfragen innerhalb von 48 Stunden zu beantworten.' },
];

export default function TermsScreen() {
  const router = useRouter();
  const { tr, lang } = useT();
  const sections = lang === 'de' ? SECTIONS_DE : SECTIONS_EN;

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.title}>
          {lang === 'de' ? 'Nutzungsbedingungen' : 'Terms & Privacy'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.updated}>{tr('terms_last_updated')}</Text>

        <View style={s.card}>
          {sections.map((sec, i) => (
            <View
              key={i}
              style={[s.section, i < sections.length - 1 && s.sectionDivider]}
            >
              <Text style={s.sectionTitle}>{sec.title}</Text>
              <Text style={s.sectionBody}>{sec.body}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={s.contactBtn}
          onPress={() => Linking.openURL('mailto:support@kyroo.app')}
          activeOpacity={0.8}
        >
          <Ionicons name="mail-outline" size={16} color={colors.accent} />
          <Text style={s.contactText}>support@kyroo.app</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000' },

  header: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: 20,
    paddingTop:        24,
    paddingBottom:     16,
    gap:               4,
  },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  title:   { fontSize: 28, fontWeight: '800', color: colors.text },

  scroll:  { paddingHorizontal: 20, paddingBottom: 40 },
  updated: { fontSize: 12, color: colors.muted, marginBottom: 18, marginLeft: 2 },

  card: {
    backgroundColor: '#0d0d0d',
    borderRadius:    16,
    borderWidth:     1.5,
    borderColor:     colors.border,
    paddingHorizontal: 18,
    paddingVertical: 4,
  },
  section:        { paddingVertical: 18 },
  sectionDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  sectionTitle:   { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 8 },
  sectionBody:    { fontSize: 14, color: colors.muted, lineHeight: 22 },

  contactBtn: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             8,
    marginTop:       24,
    paddingVertical: 14,
    borderRadius:    12,
    borderWidth:     1.5,
    borderColor:     colors.accent,
  },
  contactText: { fontSize: 14, fontWeight: '800', color: colors.accent },
});
