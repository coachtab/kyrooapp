import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme';
import { useT } from '@/i18n';

interface FaqItem { q: string; a: string }

const FAQ_EN: FaqItem[] = [
  { q: 'What is Kyroo?',
    a: 'Kyroo is an AI-powered fitness platform that creates personalised training programs based on your goals, fitness level, and weekly schedule. Answer a short questionnaire and get a full program instantly.' },
  { q: 'How do I start a program?',
    a: 'Go to the Home tab, browse the available plans, and tap the one that matches your goal. Read the overview, then tap "Create This Plan" to fill in your profile. Your program is built instantly.' },
  { q: 'Can I have more than one program?',
    a: 'Yes. You can create as many programs as you like and run several active at once. Manage them all from the My Plans tab.' },
  { q: 'How do I pause or resume a plan?',
    a: 'On the My Plans tab, swipe a plan right to pause it and left to start/resume it. Paused plans keep all their progress.' },
  { q: 'What does the streak counter mean?',
    a: "Your streak tracks how many consecutive days you've logged at least one habit. Check in daily on the Track tab to keep it going." },
  { q: 'How do I track my workouts?',
    a: 'Use the Track tab to check off habits and log your daily mood. Your active program shows today\'s session automatically.' },
  { q: 'Is my data safe?',
    a: 'Yes. Your data is stored securely and never sold or shared with third parties. You can delete your account and all associated data at any time from Profile → Privacy.' },
  { q: 'How do I upgrade to Pro?',
    a: 'Tap "Subscription" on the Profile tab to open the subscription screen. You can upgrade, downgrade, or cancel at any time.' },
  { q: 'I found a bug — how do I report it?',
    a: "Email us at support@kyroo.app with a short description of what happened and we'll fix it as quickly as possible." },
];

const FAQ_DE: FaqItem[] = [
  { q: 'Was ist Kyroo?',
    a: 'Kyroo ist eine KI-gestützte Fitnessplattform, die personalisierte Trainingsprogramme basierend auf deinen Zielen, deinem Fitnessniveau und deinem Wochenplan erstellt. Beantworte einen kurzen Fragebogen und erhalte sofort ein vollständiges Programm.' },
  { q: 'Wie starte ich ein Programm?',
    a: 'Gehe zum Home-Tab, stöbere in den verfügbaren Plänen und tippe auf den Plan, der deinem Ziel entspricht. Lies die Übersicht und tippe dann auf „Diesen Plan erstellen", um dein Profil auszufüllen. Dein Programm wird sofort erstellt.' },
  { q: 'Kann ich mehr als ein Programm haben?',
    a: 'Ja. Du kannst beliebig viele Programme erstellen und mehrere gleichzeitig aktiv laufen lassen. Verwalte sie alle im Tab „Meine Pläne".' },
  { q: 'Wie pausiere oder starte ich einen Plan?',
    a: 'Im Tab „Meine Pläne" wischst du einen Plan nach rechts, um ihn zu pausieren, und nach links, um ihn zu starten oder fortzusetzen. Pausierte Pläne behalten ihren Fortschritt.' },
  { q: 'Was bedeutet der Serienzähler?',
    a: 'Deine Serie zeigt, wie viele aufeinanderfolgende Tage du mindestens eine Gewohnheit abgehakt hast. Check täglich im Tracking-Tab ein, um sie am Laufen zu halten.' },
  { q: 'Wie tracke ich meine Trainings?',
    a: 'Nutze den Tracking-Tab, um Gewohnheiten abzuhaken und deine tägliche Stimmung zu erfassen. Dein aktives Programm zeigt automatisch die heutige Einheit an.' },
  { q: 'Sind meine Daten sicher?',
    a: 'Ja. Deine Daten werden sicher gespeichert und niemals verkauft oder an Dritte weitergegeben. Du kannst dein Konto und alle zugehörigen Daten jederzeit unter Profil → Datenschutz löschen.' },
  { q: 'Wie upgrade ich auf Pro?',
    a: 'Tippe im Profil-Tab auf „Abo", um den Abonnement-Bildschirm zu öffnen. Du kannst jederzeit upgraden, downgraden oder kündigen.' },
  { q: 'Ich habe einen Fehler gefunden — wie melde ich ihn?',
    a: 'Schreib uns eine E-Mail an support@kyroo.app mit einer kurzen Beschreibung des Problems und wir beheben es so schnell wie möglich.' },
];

export default function HelpScreen() {
  const router = useRouter();
  const { tr, lang } = useT();
  const [open, setOpen] = useState<number | null>(null);

  const faq = lang === 'de' ? FAQ_DE : FAQ_EN;

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.title}>
          {lang === 'de' ? 'Hilfe & FAQ' : 'Help & FAQ'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.sub}>{tr('help_sub')}</Text>

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
                  <Text style={[s.qText, isOpen && s.qTextOpen]} numberOfLines={isOpen ? undefined : 2}>
                    {item.q}
                  </Text>
                  <Ionicons
                    name={isOpen ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={isOpen ? colors.accent : colors.muted}
                  />
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

        <View style={s.supportCard}>
          <Ionicons name="mail-outline" size={22} color={colors.accent} />
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
  sub:     { fontSize: 14, color: colors.muted, marginBottom: 22, lineHeight: 20 },

  list: { gap: 10 },
  item: {
    backgroundColor: '#0d0d0d',
    borderRadius:    14,
    borderWidth:     1.5,
    borderColor:     colors.border,
    overflow:        'hidden',
  },
  itemOpen:    { borderColor: colors.accent + '60' },
  question:    { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  qText:       { flex: 1, fontSize: 15, fontWeight: '700', color: colors.text, lineHeight: 20 },
  qTextOpen:   { color: colors.accent },
  answer:      { paddingHorizontal: 16, paddingBottom: 16, paddingTop: 0 },
  aText:       { fontSize: 14, color: colors.muted, lineHeight: 22 },

  supportCard: {
    marginTop:       28,
    backgroundColor: '#0d0d0d',
    borderRadius:    16,
    padding:         22,
    alignItems:      'center',
    borderWidth:     1.5,
    borderColor:     colors.border,
    gap:             8,
  },
  supportLabel: { fontSize: 13, color: colors.muted, textAlign: 'center' },
  supportEmail: { fontSize: 16, fontWeight: '800', color: colors.accent },
});
