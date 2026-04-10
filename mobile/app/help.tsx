import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/theme';
import { useT } from '@/i18n';
import { BackArrow } from './_components';

interface FaqItem { q: string; a: string }

const FAQ_EN: FaqItem[] = [
  {
    q: 'What is Kyroo?',
    a: 'Kyroo is an AI-powered fitness platform that creates personalised training programs based on your goals, fitness level, and weekly schedule. Answer a short questionnaire and get a full program instantly.',
  },
  {
    q: 'How do I start a program?',
    a: 'Go to the Plans tab, browse the available plans, and tap the one that matches your goal. Read the overview, then tap "Start Plan" to fill in your profile. Your program is built instantly.',
  },
  {
    q: 'Can I have more than one program?',
    a: 'Yes. You can create as many programs as you like. Only one can be active at a time — the others are queued or paused. Switch between them any time from your Profile.',
  },
  {
    q: 'What happens to my current program when I start a new one?',
    a: 'It gets paused automatically. You can resume it any time from the "My Programs" section in your Profile. No progress is lost.',
  },
  {
    q: 'What does the streak counter mean?',
    a: "Your streak tracks how many consecutive days you've logged at least one habit. Check in daily on the Track tab to keep it going.",
  },
  {
    q: 'How do I track my workouts?',
    a: 'Use the Track tab to check off habits and log your daily mood. Your active program shows today\'s session automatically.',
  },
  {
    q: 'Is my data safe?',
    a: 'Yes. Your data is stored securely and never sold or shared with third parties. You can delete your account and all associated data at any time from Profile → Privacy & Security.',
  },
  {
    q: 'How do I upgrade to Pro?',
    a: 'Tap your plan type (Free / Kyroo Pro) on the Profile tab to open the subscription screen. You can upgrade, downgrade, or cancel at any time.',
  },
  {
    q: 'I found a bug — how do I report it?',
    a: "Email us at support@kyroo.app with a short description of what happened and we'll fix it as quickly as possible.",
  },
];

const FAQ_DE: FaqItem[] = [
  {
    q: 'Was ist Kyroo?',
    a: 'Kyroo ist eine KI-gestützte Fitnessplattform, die personalisierte Trainingsprogramme basierend auf deinen Zielen, deinem Fitnessniveau und deinem Wochenplan erstellt. Beantworte einen kurzen Fragebogen und erhalte sofort ein vollständiges Programm.',
  },
  {
    q: 'Wie starte ich ein Programm?',
    a: 'Gehe zum Pläne-Tab, stöbere in den verfügbaren Plänen und tippe auf den Plan, der deinem Ziel entspricht. Lies die Übersicht und tippe dann auf „Plan starten", um dein Profil auszufüllen. Dein Programm wird sofort erstellt.',
  },
  {
    q: 'Kann ich mehr als ein Programm haben?',
    a: 'Ja. Du kannst beliebig viele Programme erstellen. Nur eines kann gleichzeitig aktiv sein — die anderen sind in der Warteschlange oder pausiert. Wechsle jederzeit in deinem Profil zwischen ihnen.',
  },
  {
    q: 'Was passiert mit meinem aktuellen Programm, wenn ich ein neues starte?',
    a: 'Es wird automatisch pausiert. Du kannst es jederzeit im Bereich „Meine Programme" in deinem Profil fortsetzen. Kein Fortschritt geht verloren.',
  },
  {
    q: 'Was bedeutet der Serienzähler?',
    a: 'Deine Serie zeigt, wie viele aufeinanderfolgende Tage du mindestens eine Gewohnheit abgehakt hast. Check täglich im Tracking-Tab ein, um sie am Laufen zu halten.',
  },
  {
    q: 'Wie tracke ich meine Trainings?',
    a: 'Nutze den Tracking-Tab, um Gewohnheiten abzuhaken und deine tägliche Stimmung zu erfassen. Dein aktives Programm zeigt automatisch die heutige Einheit an.',
  },
  {
    q: 'Sind meine Daten sicher?',
    a: 'Ja. Deine Daten werden sicher gespeichert und niemals verkauft oder an Dritte weitergegeben. Du kannst dein Konto und alle zugehörigen Daten jederzeit unter Profil → Datenschutz & Sicherheit löschen.',
  },
  {
    q: 'Wie upgrade ich auf Pro?',
    a: 'Tippe im Profil-Tab auf deinen Plantyp (Kostenlos / Kyroo Pro), um den Abonnement-Bildschirm zu öffnen. Du kannst jederzeit upgraden, downgraden oder kündigen.',
  },
  {
    q: 'Ich habe einen Fehler gefunden — wie melde ich ihn?',
    a: 'Schreib uns eine E-Mail an support@kyroo.app mit einer kurzen Beschreibung des Problems und wir beheben es so schnell wie möglich.',
  },
];

export default function HelpScreen() {
  const router = useRouter();
  const { tr, lang } = useT();
  const [open, setOpen] = useState<number | null>(null);

  const faq = lang === 'de' ? FAQ_DE : FAQ_EN;

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <TouchableOpacity style={s.back} onPress={() => router.back()}>
          <BackArrow />
        </TouchableOpacity>

        <Text style={s.title}>
          {tr('help_title')} <Text style={s.accent}>{tr('help_accent')}</Text>
        </Text>
        <Text style={s.sub}>{tr('help_sub')}</Text>

        {/* FAQ accordion */}
        <View style={s.list}>
          {faq.map((item, i) => {
            const isOpen = open === i;
            return (
              <View key={i} style={[s.item, isOpen && s.itemOpen]}>
                <TouchableOpacity
                  style={s.question}
                  onPress={() => setOpen(isOpen ? null : i)}
                  activeOpacity={0.75}
                >
                  <Text style={[s.qText, isOpen && s.qTextOpen]}>{item.q}</Text>
                  <Text style={[s.chevron, isOpen && s.chevronOpen]}>›</Text>
                </TouchableOpacity>
                {isOpen && (
                  <View style={s.answer}>
                    <Text style={s.aText}>{item.a}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Support footer */}
        <View style={s.supportCard}>
          <Text style={s.supportLabel}>{tr('help_support')}</Text>
          <TouchableOpacity onPress={() => Linking.openURL('mailto:support@kyroo.app')}>
            <Text style={s.supportEmail}>{tr('help_email')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: colors.bg },
  scroll:      { padding: 20, paddingBottom: 48 },
  back:        { marginBottom: 20 },
  title:       { fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: 6 },
  accent:      { color: colors.accent },
  sub:         { fontSize: 14, color: colors.muted, marginBottom: 28, lineHeight: 21 },

  list:        { gap: 8 },
  item:        { backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.border },
  itemOpen:    { borderColor: colors.accent + '50' },
  question:    { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  qText:       { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },
  qTextOpen:   { color: colors.accent },
  chevron:     { fontSize: 22, color: colors.muted, transform: [{ rotate: '0deg' }] },
  chevronOpen: { transform: [{ rotate: '90deg' }] },
  answer:      { paddingHorizontal: 16, paddingBottom: 16, paddingTop: 0 },
  aText:       { fontSize: 14, color: colors.muted, lineHeight: 22 },

  supportCard: { marginTop: 32, backgroundColor: colors.card, borderRadius: 16, padding: 20,
                 alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  supportLabel:{ fontSize: 14, color: colors.muted, marginBottom: 8, textAlign: 'center' },
  supportEmail:{ fontSize: 15, fontWeight: '700', color: colors.accent },
});
