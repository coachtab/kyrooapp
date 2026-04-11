import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme';
import { useT } from '@/i18n';

interface Section { title: string; body: string }

const SECTIONS_EN: Section[] = [
  {
    title: 'Introduction',
    body: 'Kyroo ("we", "us", "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your personal data when you use the Kyroo mobile application and website (kyroo.de).',
  },
  {
    title: 'Data We Collect',
    body: 'We collect only what is necessary to provide the service:\n\n• Email address — for account creation and communication\n• Name — for personalisation\n• Fitness preferences — goals, experience level, training frequency\n• Workout and habit tracking data — to track your progress\n• Mood logs — to help you monitor your wellbeing\n\nWe do NOT collect your location, contacts, photos, or any data beyond what is listed above.',
  },
  {
    title: 'How We Use Your Data',
    body: '• To create and manage your account\n• To generate personalised training programs\n• To track your workouts, habits, and streaks\n• To send you account-related emails (verification, password reset)\n• To improve the app experience\n\nWe never sell, rent, or share your personal data with third parties for marketing purposes.',
  },
  {
    title: 'Data Storage & Security',
    body: 'Your data is stored on secure servers hosted in Germany. Passwords are hashed using bcrypt and never stored in plain text. All communication between your device and our servers is encrypted via TLS/SSL (HTTPS). We follow industry-standard security practices to protect your data.',
  },
  {
    title: 'Third-Party Services',
    body: 'We use the following third-party services:\n\n• Anthropic (Claude AI) — to generate personalised training programs. Only your fitness preferences are shared, never your email or personal identity.\n• Gmail SMTP — to send transactional emails (verification, password reset).\n\nNo analytics or advertising SDKs are included in the app.',
  },
  {
    title: 'Your Rights (GDPR)',
    body: 'If you are located in the European Economic Area (EEA), you have the following rights under the General Data Protection Regulation (GDPR):\n\n• Right of access — request a copy of your personal data\n• Right to rectification — correct inaccurate data\n• Right to erasure — delete your account and all associated data\n• Right to data portability — receive your data in a structured format\n• Right to object — opt out of certain data processing\n\nYou can exercise your right to erasure directly in the app under Profile → Privacy & Security → Delete Account. For all other requests, email us at support@kyroo.de.',
  },
  {
    title: 'Data Retention',
    body: 'We retain your data for as long as your account is active. When you delete your account, all personal data is permanently removed from our servers within 30 days. Anonymised, aggregated data (e.g. total user count) may be retained for statistical purposes.',
  },
  {
    title: 'Cookies & Local Storage',
    body: 'The Kyroo web app uses local storage (not cookies) to store your authentication token for session persistence. No tracking cookies are used. No third-party cookies are set.',
  },
  {
    title: 'Children\'s Privacy',
    body: 'Kyroo is not intended for children under 16 years of age. We do not knowingly collect personal data from children. If you believe a child has provided us with personal data, please contact us and we will delete it.',
  },
  {
    title: 'Changes to This Policy',
    body: 'We may update this Privacy Policy from time to time. We will notify you of material changes via the app or email. The "Last updated" date at the top of this page will be revised accordingly.',
  },
  {
    title: 'Contact',
    body: 'If you have questions about this Privacy Policy or your personal data, contact us at:\n\nsupport@kyroo.de\n\nWe respond to all enquiries within 48 hours.',
  },
];

const SECTIONS_DE: Section[] = [
  {
    title: 'Einleitung',
    body: 'Kyroo („wir", „uns", „unser") verpflichtet sich zum Schutz deiner Privatsphäre. Diese Datenschutzerklärung erläutert, wie wir deine personenbezogenen Daten erheben, verwenden und schützen, wenn du die Kyroo-App und Website (kyroo.de) nutzt.',
  },
  {
    title: 'Welche Daten wir erheben',
    body: 'Wir erheben nur, was zur Bereitstellung des Dienstes erforderlich ist:\n\n• E-Mail-Adresse — für Kontoerstellung und Kommunikation\n• Name — zur Personalisierung\n• Fitnesspräferenzen — Ziele, Erfahrungsstufe, Trainingshäufigkeit\n• Workout- und Gewohnheitsdaten — zur Fortschrittsverfolgung\n• Stimmungsprotokolle — zur Überwachung deines Wohlbefindens\n\nWir erheben KEINE Standort-, Kontakt-, Foto- oder sonstigen Daten über das Aufgelistete hinaus.',
  },
  {
    title: 'Wie wir deine Daten verwenden',
    body: '• Zur Erstellung und Verwaltung deines Kontos\n• Zur Erstellung personalisierter Trainingsprogramme\n• Zur Verfolgung deiner Workouts, Gewohnheiten und Serien\n• Zum Versand kontobezogener E-Mails (Verifizierung, Passwort-Zurücksetzung)\n• Zur Verbesserung der App\n\nWir verkaufen, vermieten oder teilen deine Daten niemals mit Dritten zu Marketingzwecken.',
  },
  {
    title: 'Datenspeicherung & Sicherheit',
    body: 'Deine Daten werden auf sicheren Servern in Deutschland gespeichert. Passwörter werden mit bcrypt gehasht und niemals im Klartext gespeichert. Die gesamte Kommunikation zwischen deinem Gerät und unseren Servern ist per TLS/SSL (HTTPS) verschlüsselt. Wir befolgen branchenübliche Sicherheitspraktiken.',
  },
  {
    title: 'Drittanbieter-Dienste',
    body: 'Wir nutzen folgende Drittanbieter:\n\n• Anthropic (Claude AI) — zur Erstellung personalisierter Trainingsprogramme. Nur deine Fitnesspräferenzen werden geteilt, niemals deine E-Mail oder persönliche Identität.\n• Gmail SMTP — zum Versand transaktionaler E-Mails.\n\nKeine Analyse- oder Werbe-SDKs sind in der App enthalten.',
  },
  {
    title: 'Deine Rechte (DSGVO)',
    body: 'Als Nutzer im Europäischen Wirtschaftsraum (EWR) hast du folgende Rechte gemäß der Datenschutz-Grundverordnung (DSGVO):\n\n• Auskunftsrecht — Kopie deiner personenbezogenen Daten anfordern\n• Recht auf Berichtigung — fehlerhafte Daten korrigieren\n• Recht auf Löschung — Konto und alle zugehörigen Daten löschen\n• Recht auf Datenübertragbarkeit — Daten in strukturiertem Format erhalten\n• Widerspruchsrecht — bestimmter Datenverarbeitung widersprechen\n\nDein Löschungsrecht kannst du direkt in der App unter Profil → Datenschutz & Sicherheit → Konto löschen ausüben. Für alle anderen Anfragen schreibe an support@kyroo.de.',
  },
  {
    title: 'Datenaufbewahrung',
    body: 'Wir speichern deine Daten, solange dein Konto aktiv ist. Wenn du dein Konto löschst, werden alle personenbezogenen Daten innerhalb von 30 Tagen dauerhaft von unseren Servern entfernt. Anonymisierte, aggregierte Daten (z.B. Gesamtnutzerzahl) können für statistische Zwecke aufbewahrt werden.',
  },
  {
    title: 'Cookies & lokale Speicherung',
    body: 'Die Kyroo-Webapp nutzt lokale Speicherung (keine Cookies) zur Speicherung deines Authentifizierungstokens. Es werden keine Tracking-Cookies und keine Drittanbieter-Cookies verwendet.',
  },
  {
    title: 'Datenschutz für Kinder',
    body: 'Kyroo ist nicht für Kinder unter 16 Jahren bestimmt. Wir erheben wissentlich keine personenbezogenen Daten von Kindern. Falls du glaubst, dass ein Kind uns personenbezogene Daten übermittelt hat, kontaktiere uns bitte und wir werden diese löschen.',
  },
  {
    title: 'Änderungen dieser Richtlinie',
    body: 'Wir können diese Datenschutzerklärung von Zeit zu Zeit aktualisieren. Über wesentliche Änderungen informieren wir dich über die App oder per E-Mail. Das Datum „Zuletzt aktualisiert" oben auf dieser Seite wird entsprechend angepasst.',
  },
  {
    title: 'Kontakt',
    body: 'Bei Fragen zu dieser Datenschutzerklärung oder deinen personenbezogenen Daten kontaktiere uns unter:\n\nsupport@kyroo.de\n\nWir beantworten alle Anfragen innerhalb von 48 Stunden.',
  },
];

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const { lang } = useT();
  const sections = lang === 'de' ? SECTIONS_DE : SECTIONS_EN;

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Back */}
        <TouchableOpacity style={s.back} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
          <Text style={s.backText}>Back</Text>
        </TouchableOpacity>

        <Text style={s.title}>Privacy Policy</Text>
        <Text style={s.updated}>Last updated: April 11, 2026</Text>

        {sections.map((sec, i) => (
          <View key={i} style={s.section}>
            <Text style={s.sectionTitle}>{sec.title}</Text>
            <Text style={s.sectionBody}>{sec.body}</Text>
          </View>
        ))}

        <View style={s.footer}>
          <Text style={s.footerText}>support@kyroo.de</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: '#000' },
  scroll:       { paddingHorizontal: 28, paddingTop: 12, paddingBottom: 48 },

  back:         { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 24 },
  backText:     { fontSize: 14, color: '#888' },

  title:        { fontSize: 28, fontWeight: '800', color: '#FFFFFF', marginBottom: 4 },
  updated:      { fontSize: 12, color: '#666', marginBottom: 32, fontStyle: 'italic' },

  section:      { marginBottom: 28 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', marginBottom: 8 },
  sectionBody:  { fontSize: 14, color: '#999', lineHeight: 22 },

  footer:       { marginTop: 8, paddingTop: 24, borderTopWidth: 1, borderTopColor: '#222', alignItems: 'center' },
  footerText:   { fontSize: 14, fontWeight: '600', color: colors.accent },
});
