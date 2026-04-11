import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/theme';
import { useT } from '@/i18n';

// Web-only CSS blur helper — no-op on native
const blur = (px: number) =>
  Platform.OS === 'web' ? ({ filter: `blur(${px}px)` } as object) : {};

export default function Welcome() {
  const router = useRouter();
  const { tr } = useT();

  return (
    <View style={s.root}>

      {/* ── Atmospheric glow orbs ── */}
      <View style={[s.orb, s.orbTop,    blur(90)]} />
      <View style={[s.orb, s.orbBottom, blur(70)]} />

      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>

        {/* ── Brand mark ── */}
        <View style={s.brandRow}>
          <Text style={s.brand}>{tr('welcome_brand')}</Text>
        </View>

        {/* ── Concentric rings graphic ── */}
        <View style={s.graphic}>
          <View style={[s.ring, s.ring4]} />
          <View style={[s.ring, s.ring3]} />
          <View style={[s.ring, s.ring2]} />
          <View style={[s.ring, s.ring1]} />
          <View style={s.ringCore} />
        </View>

        {/* ── Hero copy ── */}
        <View style={s.hero}>
          <Text style={s.h1}>
            {tr('welcome_h1a')}{' '}
            <Text style={s.accent}>{tr('welcome_h1b')}</Text>
            {'\n'}{tr('welcome_h1c')}
          </Text>
          <Text style={s.sub}>{tr('welcome_sub')}</Text>
        </View>

        {/* ── CTAs ── */}
        <View style={s.actions}>
          <TouchableOpacity
            style={s.cta}
            activeOpacity={0.85}
            onPress={() => router.push('/register')}
          >
            <Text style={s.ctaText}>{tr('welcome_cta')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.outline}
            activeOpacity={0.7}
            onPress={() => router.push('/login')}
          >
            <Text style={s.outlineText}>{tr('welcome_login')}</Text>
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </View>
  );
}

const RING_BASE = 64;

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  // Glow orbs
  orb: {
    position:     'absolute',
    borderRadius: 9999,
  },
  orbTop: {
    width:           380,
    height:          380,
    top:             -120,
    alignSelf:       'center',
    backgroundColor: colors.accent,
    opacity:         0.14,
  },
  orbBottom: {
    width:           260,
    height:          260,
    bottom:          -60,
    right:           -60,
    backgroundColor: colors.cta,
    opacity:         0.10,
  },

  safe: {
    flex:              1,
    paddingHorizontal: 28,
    paddingBottom:     24,
  },

  // Brand
  brandRow: {
    alignItems:  'center',
    paddingTop:  12,
    marginBottom: 0,
  },
  brand: {
    fontSize:      13,
    fontWeight:    '800',
    letterSpacing: 8,
    color:         colors.accent,
  },

  // Rings
  graphic: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
  },
  ring: {
    position:     'absolute',
    borderRadius: 9999,
    borderWidth:  1.5,
    borderColor:  colors.accent,
  },
  ring1: { width: RING_BASE * 1,   height: RING_BASE * 1,   opacity: 0.90 },
  ring2: { width: RING_BASE * 2,   height: RING_BASE * 2,   opacity: 0.55 },
  ring3: { width: RING_BASE * 3.2, height: RING_BASE * 3.2, opacity: 0.28 },
  ring4: { width: RING_BASE * 4.6, height: RING_BASE * 4.6, opacity: 0.12 },
  ringCore: {
    width:           14,
    height:          14,
    borderRadius:    7,
    backgroundColor: colors.accent,
  },

  // Copy
  hero: {
    marginBottom: 36,
  },
  h1: {
    fontSize:   38,
    fontWeight: '800',
    color:      colors.text,
    lineHeight: 46,
    marginBottom: 16,
  },
  accent: {
    color: colors.accent,
  },
  sub: {
    fontSize:   15,
    color:      colors.muted,
    lineHeight: 23,
  },

  // Buttons
  actions: {
    gap: 12,
  },
  cta: {
    backgroundColor: colors.cta,
    borderRadius:    14,
    paddingVertical: 17,
    alignItems:      'center',
  },
  ctaText: {
    fontSize:   17,
    fontWeight: '700',
    color:      colors.bg,
  },
  outline: {
    borderWidth:     1.5,
    borderColor:     colors.border,
    borderRadius:    14,
    paddingVertical: 17,
    alignItems:      'center',
  },
  outlineText: {
    fontSize:   17,
    fontWeight: '600',
    color:      colors.text,
  },
});
