import { Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/theme';

const bgImage = require('../assets/welcome-bg.png');

export default function Welcome() {
  const router = useRouter();

  return (
    <View style={s.root}>

      {/* Background image — full bleed, centered */}
      {Platform.OS === 'web' ? (
        <Image
          source={bgImage}
          style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' } as any]}
          resizeMode="cover"
        />
      ) : (
        <Image
          source={bgImage}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      )}

      {/* Dark overlay for text legibility */}
      <View style={s.overlay} />

      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>

        {/* Headline — white, bold, centered, near top */}
        <Text style={s.headline}>
          Your <Text style={s.accent}>training</Text>{'\n'}
          journey starts here!
        </Text>

        {/* Spacer — image fills here */}
        <View style={s.spacer} />

        {/* CTA — full-width, pinned at bottom */}
        <TouchableOpacity style={s.cta} activeOpacity={0.85} onPress={() => router.push('/register')}>
          <Text style={s.ctaText}>Let's Start!</Text>
        </TouchableOpacity>

        {/* Login link below */}
        <TouchableOpacity style={s.login} activeOpacity={0.7} onPress={() => router.push('/login')}>
          <Text style={s.loginText}>Already have an account? <Text style={s.loginLink}>Login</Text></Text>
        </TouchableOpacity>

      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: '#000',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },

  safe: {
    flex:              1,
    paddingHorizontal: 28,
    maxWidth:          500,
    alignSelf:         'center',
    width:             '100%' as any,
  },

  headline: {
    fontSize:   28,
    fontWeight: '800',
    color:      '#FFFFFF',
    textAlign:  'center',
    lineHeight: 38,
    marginTop:  32,
  },
  accent: {
    color: colors.accent,
  },

  spacer: {
    flex: 1,
  },

  cta: {
    backgroundColor: colors.cta,
    borderRadius:    14,
    paddingVertical: 18,
    alignItems:      'center',
  },
  ctaText: {
    fontSize:   18,
    fontWeight: '700',
    color:      '#FFFFFF',
  },

  login: {
    paddingVertical: 16,
    alignItems:      'center',
  },
  loginText: {
    fontSize: 14,
    color:    colors.muted,
  },
  loginLink: {
    color:      '#FFFFFF',
    fontWeight: '600',
  },
});
