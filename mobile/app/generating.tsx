import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Platform, Easing } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/api';
import { colors } from '@/theme';
import { useT } from '@/i18n';

const DIFFICULTY_COLOR: Record<string, string> = {
  beginner:     '#4CAF50',
  intermediate: '#F59E0B',
  advanced:     '#E94560',
};

const STEPS_EN = [
  { icon: 'person-outline',       label: 'Analysing your answers'  },
  { icon: 'fitness-outline',      label: 'Picking the right exercises' },
  { icon: 'calendar-outline',     label: 'Structuring your weeks'  },
  { icon: 'sparkles-outline',     label: 'Finalising your plan'    },
] as const;

const STEPS_DE = [
  { icon: 'person-outline',       label: 'Analysiere deine Antworten' },
  { icon: 'fitness-outline',      label: 'Wähle die passenden Übungen' },
  { icon: 'calendar-outline',     label: 'Strukturiere deine Wochen'   },
  { icon: 'sparkles-outline',     label: 'Finalisiere deinen Plan'     },
] as const;

export default function Generating() {
  const { questionnaireId, difficulty } = useLocalSearchParams<{ questionnaireId: string; difficulty?: string }>();
  const router = useRouter();
  const { lang } = useT();

  const accent = DIFFICULTY_COLOR[(difficulty || '').toLowerCase()] || colors.accent;
  const STEPS = lang === 'de' ? STEPS_DE : STEPS_EN;

  const [currentStep, setCurrentStep] = useState(0);
  const [apiDone,     setApiDone]     = useState(false);
  const [programId,   setProgramId]   = useState<number | null>(null);

  const progress = useRef(new Animated.Value(0)).current;
  const pulse    = useRef(new Animated.Value(1)).current;
  const spin     = useRef(new Animated.Value(0)).current;

  const nativeDriver = Platform.OS !== 'web';

  // Call the backend as soon as the screen mounts
  useEffect(() => {
    api.programs.generate(Number(questionnaireId))
      .then(result => {
        setProgramId(result.id);
        setApiDone(true);
      })
      .catch(() => {
        setApiDone(true);
      });
  }, [questionnaireId]);

  // Pulse animation on logo
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: nativeDriver }),
        Animated.timing(pulse, { toValue: 1,    duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: nativeDriver }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 1200, easing: Easing.linear, useNativeDriver: nativeDriver })
    ).start();
  }, []);

  // Step progression — each step takes ~4s
  useEffect(() => {
    const STEP_DURATION = 4000;
    const interval = setInterval(() => {
      setCurrentStep(s => {
        if (s < STEPS.length - 1) return s + 1;
        return s;
      });
    }, STEP_DURATION);
    return () => clearInterval(interval);
  }, [STEPS.length]);

  // Progress bar fills smoothly to match step progression
  useEffect(() => {
    const target = ((currentStep + 1) / STEPS.length) * 100;
    Animated.timing(progress, {
      toValue: target,
      duration: 3800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [currentStep]);

  // Navigate once BOTH the API is done AND the last step is active
  useEffect(() => {
    if (!apiDone) return;
    if (currentStep < STEPS.length - 1) return;

    const t = setTimeout(() => {
      if (programId) {
        router.replace({ pathname: '/program', params: { id: programId } } as any);
      } else {
        router.replace('/(tabs)/plans');
      }
    }, 800);
    return () => clearTimeout(t);
  }, [apiDone, currentStep, programId]);

  const progressWidth = progress.interpolate({
    inputRange:  [0, 100],
    outputRange: ['0%', '100%'],
  });

  const rotate = spin.interpolate({
    inputRange:  [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={s.root}>
      <View style={s.center}>

        {/* Pulsing logo with orbiting ring */}
        <View style={s.logoWrap}>
          <Animated.View
            style={[
              s.orbit,
              { borderColor: accent + '30', borderTopColor: accent, transform: [{ rotate }] },
            ]}
          />
          <Animated.View style={[s.logo, { backgroundColor: accent + '15', borderColor: accent, transform: [{ scale: pulse }] }]}>
            <Text style={[s.logoText, { color: accent }]}>K</Text>
          </Animated.View>
        </View>

        {/* Headline */}
        <Text style={s.headline}>
          {lang === 'de' ? 'Erstelle' : 'Building'}{' '}
          <Text style={{ color: accent }}>
            {lang === 'de' ? 'deinen Plan' : 'your plan'}
          </Text>
        </Text>
        <Text style={s.sub}>
          {lang === 'de'
            ? 'Unsere KI baut gerade ein individuelles Programm für dich'
            : 'Our AI is crafting a program tailored just for you'}
        </Text>

        {/* Progress bar */}
        <View style={s.progressTrack}>
          <Animated.View style={[s.progressFill, { width: progressWidth, backgroundColor: accent }]} />
        </View>

        {/* Step checklist */}
        <View style={s.stepList}>
          {STEPS.map((step, i) => {
            const done    = i < currentStep;
            const active  = i === currentStep;
            const pending = i > currentStep;
            return (
              <View key={i} style={s.stepRow}>
                <View style={[
                  s.stepIcon,
                  done    && { backgroundColor: accent, borderColor: accent },
                  active  && { borderColor: accent, backgroundColor: accent + '15' },
                  pending && { borderColor: colors.border },
                ]}>
                  {done ? (
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  ) : active ? (
                    <Animated.View style={{ transform: [{ rotate }] }}>
                      <Ionicons name="sync-outline" size={14} color={accent} />
                    </Animated.View>
                  ) : (
                    <Ionicons name={step.icon} size={13} color={colors.muted} />
                  )}
                </View>
                <Text style={[
                  s.stepLabel,
                  done    && { color: colors.text },
                  active  && { color: accent, fontWeight: '700' },
                  pending && { color: colors.muted },
                ]}>
                  {step.label}
                </Text>
              </View>
            );
          })}
        </View>

      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },

  // Logo
  logoWrap: {
    width:          140,
    height:         140,
    alignItems:     'center',
    justifyContent: 'center',
    marginBottom:   32,
  },
  orbit: {
    position:     'absolute',
    width:        140,
    height:       140,
    borderRadius: 70,
    borderWidth:  2,
  },
  logo: {
    width:          90,
    height:         90,
    borderRadius:   45,
    alignItems:     'center',
    justifyContent: 'center',
    borderWidth:    1.5,
  },
  logoText: {
    fontSize:   42,
    fontWeight: '900',
  },

  // Headline
  headline: {
    fontSize:   26,
    fontWeight: '800',
    color:      colors.text,
    textAlign:  'center',
    marginBottom: 8,
  },
  sub: {
    fontSize:   14,
    color:      colors.muted,
    textAlign:  'center',
    marginBottom: 32,
    lineHeight: 21,
  },

  // Progress bar
  progressTrack: {
    width:        '100%' as any,
    maxWidth:     360,
    height:       6,
    backgroundColor: '#1a1a1a',
    borderRadius: 3,
    overflow:     'hidden',
    marginBottom: 32,
  },
  progressFill: {
    height:       6,
    borderRadius: 3,
  },

  // Step checklist
  stepList: {
    width:    '100%' as any,
    maxWidth: 360,
    gap:      14,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           14,
  },
  stepIcon: {
    width:          28,
    height:         28,
    borderRadius:   14,
    borderWidth:    1.5,
    alignItems:     'center',
    justifyContent: 'center',
  },
  stepLabel: {
    fontSize:   15,
    fontWeight: '500',
    flex:       1,
  },
});
