import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { colors } from '@/theme';

export default function Index() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [phase, setPhase] = useState<'splash' | 'greeting'>('splash');

  useEffect(() => {
    const t = setTimeout(() => setPhase('greeting'), 1500);
    return () => clearTimeout(t);
  }, []);

  const handleNext = () => {
    if (isLoading) return;
    if (user) {
      router.replace('/(tabs)');
      return;
    }
    AsyncStorage.getItem('onboarded').then(val => {
      router.replace(val ? '/welcome' : '/onboarding');
    });
  };

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

  // Phase 2 — "Hi, it's Kyroo!" + wave + "Next >"
  return (
    <View style={s.root}>
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        <View style={s.center}>
          <Text style={s.greeting}>
            Hi, it's <Text style={s.accent}>Kyroo</Text>!
          </Text>
          <Text style={s.wave}>👋</Text>
        </View>

        <TouchableOpacity style={s.next} activeOpacity={0.7} onPress={handleNext}>
          <Text style={s.nextText}>Next</Text>
          <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </SafeAreaView>
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

  safe: {
    flex:  1,
    width: '100%' as any,
  },

  // Splash logo
  logo: {
    fontSize:      28,
    fontWeight:    '800',
    color:         '#FFFFFF',
    letterSpacing: 6,
  },
  logoK: {
    color: colors.accent,
  },

  // Greeting
  center: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
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

  // Next
  next: {
    flexDirection:     'row',
    alignItems:        'center',
    alignSelf:         'flex-end',
    gap:               4,
    paddingHorizontal: 28,
    paddingBottom:     16,
  },
  nextText: {
    fontSize:   17,
    fontWeight: '600',
    color:      '#FFFFFF',
  },
});
