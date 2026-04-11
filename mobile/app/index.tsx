import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/context/AuthContext';
import { colors } from '@/theme';

export default function Index() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [phase, setPhase] = useState<'splash' | 'greeting'>('splash');

  useEffect(() => {
    // Phase 1 → Phase 2 after 1.5s
    const t = setTimeout(() => setPhase('greeting'), 1500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (phase !== 'greeting') return;
    if (isLoading) return;

    if (user) {
      // Already logged in — go straight to tabs after short delay
      const t = setTimeout(() => router.replace('/(tabs)'), 1200);
      return () => clearTimeout(t);
    }

    // Not logged in — route after short delay
    const t = setTimeout(() => {
      AsyncStorage.getItem('onboarded').then(val => {
        router.replace(val ? '/welcome' : '/onboarding');
      });
    }, 2000);
    return () => clearTimeout(t);
  }, [phase, isLoading, user]);

  // Phase 1 — Splash: centered KYROO logo
  if (phase === 'splash') {
    return (
      <View style={s.root}>
        <Text style={s.logo}>
          <Text style={s.logoK}>K</Text>YROO
        </Text>
      </View>
    );
  }

  // Phase 2 — Greeting: "Hi, it's Kyroo!" + wave
  return (
    <View style={s.root}>
      <View style={s.center}>
        <Text style={s.greeting}>
          Hi, it's <Text style={s.accent}>Kyroo</Text>!
        </Text>
        <Text style={s.wave}>👋</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: '#000',
    alignItems:      'center',
    justifyContent:  'center',
  },

  // Splash logo
  logo: {
    fontSize:       28,
    fontWeight:     '800',
    color:          '#FFFFFF',
    letterSpacing:  6,
  },
  logoK: {
    color: colors.accent,
  },

  // Greeting
  center: {
    alignItems: 'center',
  },
  greeting: {
    fontSize:   32,
    fontWeight: '800',
    color:      '#FFFFFF',
    textAlign:  'center',
  },
  accent: {
    color: colors.accent,
  },
  wave: {
    fontSize:  36,
    marginTop: 16,
  },
});
