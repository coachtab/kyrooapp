import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { Platform, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { colors } from '@/theme';

// Placeholder intro video — swap for '/intro.mp4' once the real file is at
// mobile/public/intro.mp4 (build-web.js copies public/ → dist/).
const INTRO_VIDEO_SRC = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

export default function Index() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [phase, setPhase] = useState<'loading' | 'splash' | 'greeting'>('loading');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    if (isLoading) return;

    if (user) {
      router.replace('/(tabs)');
      return;
    }

    setPhase('splash');
    const t = setTimeout(() => setPhase('greeting'), 1500);
    return () => clearTimeout(t);
  }, [isLoading, user]);

  useEffect(() => {
    if (phase === 'greeting' && Platform.OS === 'web' && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [phase]);

  const handleNext = () => router.replace('/welcome');

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setMuted(videoRef.current.muted);
    }
  };

  // Phase 0 — Loading auth state or redirecting logged-in user
  if (phase === 'loading') return <View style={s.root} />;

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

  // Phase 2 — Greeting video (fullscreen, autoplay-muted, loop)
  return (
    <View style={s.root}>
      {Platform.OS === 'web' ? (
        <video
          ref={videoRef}
          src={INTRO_VIDEO_SRC}
          autoPlay
          muted
          loop
          playsInline
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            width: '100%', height: '100%',
            objectFit: 'cover',
            backgroundColor: '#000',
          }}
        />
      ) : (
        <View style={s.nativePlaceholder}>
          <Ionicons name="play-circle-outline" size={80} color={colors.muted} />
        </View>
      )}

      {/* Subtle bottom gradient for control legibility */}
      <View style={s.bottomScrim} pointerEvents="none" />

      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        <View style={{ flex: 1 }} />

        <View style={s.bottomRow}>
          {Platform.OS === 'web' && (
            <TouchableOpacity style={s.muteBtn} onPress={toggleMute} activeOpacity={0.7}>
              <Ionicons
                name={muted ? 'volume-mute' : 'volume-high'}
                size={20}
                color="#fff"
              />
            </TouchableOpacity>
          )}
          <View style={{ flex: 1 }} />
          <TouchableOpacity style={s.next} activeOpacity={0.75} onPress={handleNext}>
            <Text style={s.nextText}>Next</Text>
            <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
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
    alignItems:      'center',
    justifyContent:  'center',
  },

  // Splash logo
  logo: {
    fontSize:      28,
    fontWeight:    '800',
    color:         '#FFFFFF',
    letterSpacing: 6,
  },
  logoK: { color: colors.accent },

  // Greeting video
  safe: { flex: 1, width: '100%' as any },

  nativePlaceholder: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },

  bottomScrim: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    height: 180,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },

  bottomRow: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: 20,
    paddingBottom:     16,
    gap:               8,
  },
  muteBtn: {
    width:           40,
    height:          40,
    borderRadius:    20,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.22)',
    alignItems:      'center',
    justifyContent:  'center',
  },
  next: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               4,
    paddingHorizontal: 20,
    paddingVertical:   11,
    borderRadius:      24,
    backgroundColor:   'rgba(0,0,0,0.55)',
    borderWidth:       1,
    borderColor:       'rgba(255,255,255,0.28)',
  },
  nextText: {
    fontSize:   15,
    fontWeight: '700',
    color:      '#FFFFFF',
  },
});
