import { Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/theme';

const bgImage = require('../assets/welcome-bg.png');

export default function Welcome() {
  const router = useRouter();

  return (
    <View style={s.root}>

      {/* Background image — full bleed */}
      <Image
        source={bgImage}
        style={[StyleSheet.absoluteFill, Platform.OS === 'web' && { width: '100%', height: '100%' } as any]}
        resizeMode="cover"
      />

      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>

        {/* Title + subtitle — upper area */}
        <View style={s.top}>
          <Text style={s.title}>Welcome to <Text style={s.accent}>Kyroo</Text></Text>
          <Text style={s.subtitle}>AI-powered training plans{'\n'}built around you</Text>
        </View>

        {/* Spacer */}
        <View style={s.spacer} />

        {/* Two buttons at bottom — 1:1 Ochy */}
        <View style={s.buttons}>
          <TouchableOpacity style={s.signUp} activeOpacity={0.85} onPress={() => router.push('/register')}>
            <Text style={s.signUpText}>Sign Up</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.login} activeOpacity={0.7} onPress={() => router.push('/login')}>
            <Text style={s.loginText}>Login</Text>
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: '#000',
  },

  safe: {
    flex:              1,
    paddingHorizontal: 28,
    maxWidth:          500,
    alignSelf:         'center',
    width:             '100%' as any,
  },

  top: {
    marginTop: 48,
  },
  title: {
    fontSize:   32,
    fontWeight: '800',
    color:      '#FFFFFF',
    textAlign:  'center',
    marginBottom: 16,
  },
  accent: {
    color: colors.accent,
  },
  subtitle: {
    fontSize:   17,
    color:      'rgba(255,255,255,0.7)',
    textAlign:  'center',
    lineHeight: 24,
  },

  spacer: {
    flex: 1,
  },

  buttons: {
    gap:           12,
    paddingBottom:  8,
  },
  signUp: {
    backgroundColor: colors.cta,
    borderRadius:    14,
    paddingVertical: 18,
    alignItems:      'center',
  },
  signUpText: {
    fontSize:   18,
    fontWeight: '700',
    color:      '#FFFFFF',
  },
  login: {
    borderWidth:     1.5,
    borderColor:     'rgba(255,255,255,0.4)',
    borderRadius:    14,
    paddingVertical: 18,
    alignItems:      'center',
  },
  loginText: {
    fontSize:   18,
    fontWeight: '600',
    color:      '#FFFFFF',
  },
});
