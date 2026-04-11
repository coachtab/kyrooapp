import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme';

const blur = (px: number) =>
  Platform.OS === 'web' ? ({ filter: `blur(${px}px)` } as object) : {};

// ── Step data ─────────────────────────────────────────────────────────────────

const STEPS = [
  {
    tag:      'YOUR AI COACH',
    headline: ['Train smarter,', 'not harder.'],
    accent:   1,               // index of highlighted line
    sub:      'Kyroo builds personalised training plans around you — your goals, schedule, and fitness level.',
    choices:  null,
    icon:     'flash' as const,
  },
  {
    tag:      'STEP 1 OF 2',
    headline: ["What's your", 'main goal?'],
    accent:   1,
    sub:      null,
    choices:  [
      { label: 'Build strength',      icon: 'barbell-outline'   as const },
      { label: 'Lose weight',         icon: 'flame-outline'     as const },
      { label: 'Improve endurance',   icon: 'walk-outline'      as const },
      { label: 'General fitness',     icon: 'heart-outline'     as const },
    ],
  },
  {
    tag:      'STEP 2 OF 2',
    headline: ['How would you rate', 'your experience?'],
    accent:   1,
    sub:      null,
    choices:  [
      { label: 'Beginner',      sub: 'Just getting started',        icon: 'leaf-outline'    as const },
      { label: 'Intermediate',  sub: 'Training for 1–3 years',      icon: 'trending-up-outline' as const },
      { label: 'Advanced',      sub: 'Competitive or 3+ years',     icon: 'trophy-outline'  as const },
    ],
  },
];

const TOTAL_STEPS = STEPS.length;

// ── Component ─────────────────────────────────────────────────────────────────

export default function Onboarding() {
  const router  = useRouter();
  const [step,     setStep]     = useState(0);
  const [selected, setSelected] = useState<number | null>(null);

  const current = STEPS[step];
  const isFirst = step === 0;
  const isLast  = step === TOTAL_STEPS - 1;

  const next = async () => {
    if (isLast) {
      await AsyncStorage.setItem('onboarded', '1');
      router.replace('/welcome');
      return;
    }
    setSelected(null);
    setStep(s => s + 1);
  };

  const canAdvance = isFirst || selected !== null;

  return (
    <View style={s.root}>
      {/* Glow */}
      <View style={[s.orb, blur(80)]} />

      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>

        {/* Progress bar — shown on steps 1 and 2 */}
        {!isFirst && (
          <View style={s.progressTrack}>
            <View style={[s.progressFill, { flex: step / (TOTAL_STEPS - 1) }]} />
            <View style={{ flex: 1 - step / (TOTAL_STEPS - 1) }} />
          </View>
        )}

        {/* Back */}
        {!isFirst && (
          <TouchableOpacity style={s.back} onPress={() => { setSelected(null); setStep(s => s - 1); }}>
            <Ionicons name="chevron-back" size={20} color={colors.muted} />
            <Text style={s.backText}>Back</Text>
          </TouchableOpacity>
        )}

        {/* Content */}
        <View style={s.content}>
          <Text style={s.tag}>{current.tag}</Text>

          <Text style={s.headline}>
            {current.headline.map((line, i) => (
              <Text key={i}>
                {i === current.accent
                  ? <Text style={s.accentText}>{line}</Text>
                  : line}
                {i < current.headline.length - 1 ? '\n' : ''}
              </Text>
            ))}
          </Text>

          {current.sub && (
            <Text style={s.sub}>{current.sub}</Text>
          )}

          {/* Intro icon */}
          {isFirst && (
            <View style={s.introIcon}>
              <Ionicons name={current.icon!} size={72} color={colors.accent} style={{ opacity: 0.9 }} />
            </View>
          )}

          {/* Choice list */}
          {current.choices && (
            <View style={s.choices}>
              {current.choices.map((c, i) => (
                <TouchableOpacity
                  key={i}
                  style={[s.choice, selected === i && s.choiceActive]}
                  activeOpacity={0.75}
                  onPress={() => setSelected(i)}
                >
                  <Ionicons
                    name={c.icon}
                    size={20}
                    color={selected === i ? colors.accent : colors.muted}
                    style={s.choiceIcon}
                  />
                  <View style={s.choiceLabels}>
                    <Text style={[s.choiceLabel, selected === i && s.choiceLabelActive]}>
                      {c.label}
                    </Text>
                    {'sub' in c && c.sub ? (
                      <Text style={s.choiceSub}>{c.sub}</Text>
                    ) : null}
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={selected === i ? colors.accent : colors.border}
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={[s.cta, !canAdvance && s.ctaDisabled]}
          activeOpacity={0.85}
          onPress={next}
          disabled={!canAdvance}
        >
          <Text style={s.ctaText}>
            {isLast ? "Let's go" : isFirst ? 'Get started' : 'Continue'}
          </Text>
          <Ionicons name="arrow-forward" size={18} color={colors.ctaText} style={{ marginLeft: 6 }} />
        </TouchableOpacity>

        {/* Skip — intro screen only */}
        {isFirst && (
          <TouchableOpacity style={s.skip} onPress={next}>
            <Text style={s.skipText}>Skip intro</Text>
          </TouchableOpacity>
        )}

      </SafeAreaView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  orb: {
    position:        'absolute',
    width:           340,
    height:          340,
    top:             -100,
    alignSelf:       'center',
    borderRadius:    9999,
    backgroundColor: colors.accent,
    opacity:         0.12,
  },

  safe: {
    flex:              1,
    paddingHorizontal: 28,
    paddingBottom:     24,
  },

  // Progress
  progressTrack: {
    flexDirection:  'row',
    height:         3,
    borderRadius:   2,
    backgroundColor: colors.border,
    marginTop:      16,
    marginBottom:   8,
    overflow:       'hidden',
  },
  progressFill: {
    backgroundColor: colors.accent,
    borderRadius:    2,
  },

  // Back
  back: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            4,
    paddingVertical: 10,
    alignSelf:      'flex-start',
    marginBottom:   8,
  },
  backText: { fontSize: 14, color: colors.muted },

  // Content
  content: { flex: 1, justifyContent: 'center' },

  tag: {
    fontSize:      11,
    fontWeight:    '800',
    letterSpacing: 3,
    color:         colors.accent,
    marginBottom:  16,
  },

  headline: {
    fontSize:   36,
    fontWeight: '800',
    color:      colors.text,
    lineHeight: 44,
    marginBottom: 16,
  },
  accentText: { color: colors.accent },

  sub: {
    fontSize:   16,
    color:      colors.muted,
    lineHeight: 24,
    marginBottom: 32,
  },

  // Intro icon
  introIcon: {
    marginTop:  32,
    alignItems: 'center',
  },

  // Choices
  choices: { gap: 10, marginTop: 8 },
  choice: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: colors.card,
    borderRadius:    14,
    borderWidth:     1.5,
    borderColor:     colors.border,
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap:             12,
  },
  choiceActive: {
    borderColor:     colors.accent,
    backgroundColor: colors.accent + '12',
  },
  choiceIcon:   { width: 22 },
  choiceLabels: { flex: 1 },
  choiceLabel: {
    fontSize:   15,
    fontWeight: '600',
    color:      colors.text,
  },
  choiceLabelActive: { color: colors.accent },
  choiceSub: {
    fontSize:   12,
    color:      colors.muted,
    marginTop:  2,
  },

  // CTA
  cta: {
    flexDirection:   'row',
    backgroundColor: colors.cta,
    borderRadius:    14,
    paddingVertical: 17,
    alignItems:      'center',
    justifyContent:  'center',
  },
  ctaDisabled: { opacity: 0.35 },
  ctaText: {
    fontSize:   17,
    fontWeight: '700',
    color:      colors.ctaText,
  },

  // Skip
  skip: {
    alignItems:   'center',
    paddingTop:   14,
  },
  skipText: {
    fontSize: 14,
    color:    colors.muted,
  },
});
