import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '@/api';
import { colors } from '@/theme';
import { useT } from '@/i18n';
import t from '@/i18n/translations';

export default function Generating() {
  const { questionnaireId } = useLocalSearchParams<{ questionnaireId: string }>();
  const router = useRouter();
  const { lang } = useT();
  const [msgIdx, setMsgIdx] = useState(0);
  const spin  = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  const MESSAGES: readonly string[] = t[lang].generating_messages as readonly string[];
  const HEADLINE: string = t[lang].generating_headline as string;

  const nativeDriver = Platform.OS !== 'web';

  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 1800, useNativeDriver: nativeDriver })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.12, duration: 900, useNativeDriver: nativeDriver }),
        Animated.timing(pulse, { toValue: 1,    duration: 900, useNativeDriver: nativeDriver }),
      ])
    ).start();

    const timer = setInterval(() => setMsgIdx(i => (i + 1) % MESSAGES.length), 1600);

    const run = async () => {
      try {
        await api.programs.generate(Number(questionnaireId));
        clearInterval(timer);
        router.replace('/program');
      } catch {
        clearInterval(timer);
        router.replace('/program');
      }
    };
    run();

    return () => clearInterval(timer);
  }, []);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={s.container}>
      <Animated.View style={[s.ring, { transform: [{ rotate }] }]}>
        <View style={s.ringInner} />
      </Animated.View>

      <Animated.View style={[s.logo, { transform: [{ scale: pulse }] }]}>
        <Text style={s.logoText}>K</Text>
      </Animated.View>

      <Text style={s.headline}>{HEADLINE}</Text>
      <Text style={s.msg}>{MESSAGES[msgIdx]}</Text>

      <View style={s.dots}>
        {[0, 1, 2].map(i => (
          <View key={i} style={[s.dot, msgIdx % 3 === i && s.dotActive]} />
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 32 },
  ring:      { position: 'absolute', width: 200, height: 200, borderRadius: 100, borderWidth: 2, borderColor: colors.accent + '40', borderTopColor: colors.accent },
  ringInner: { width: '100%', height: '100%' },
  logo:      { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.accent + '20', alignItems: 'center', justifyContent: 'center', marginBottom: 48, borderWidth: 1, borderColor: colors.accent + '40' },
  logoText:  { fontSize: 52, fontWeight: '900', color: colors.accent },
  headline:  { fontSize: 30, fontWeight: '800', color: colors.text, textAlign: 'center', marginBottom: 16, lineHeight: 38 },
  msg:       { fontSize: 15, color: colors.muted, textAlign: 'center', marginBottom: 28 },
  dots:      { flexDirection: 'row', gap: 8 },
  dot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.accent },
});
