import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { Platform, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { colors } from '@/theme';

// Placeholder intro video + poster — swap for '/intro.mp4' and '/intro-poster.jpg'
// once the real files are at mobile/public/ (build-web.js copies public/ → dist/).
const INTRO_VIDEO_SRC  = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
const INTRO_POSTER_SRC = 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&h=1800&fit=crop&q=85&auto=format';

export default function Index() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [phase,   setPhase]   = useState<'loading' | 'splash' | 'greeting'>('loading');
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

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

  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.muted = false;
      videoRef.current.play().catch(() => {
        // If unmuted autoplay fails for any reason, fall back to muted
        if (videoRef.current) {
          videoRef.current.muted = true;
          videoRef.current.play().catch(() => {});
        }
      });
    }
    setPlaying(true);
  };

  const handleNext = () => router.replace('/welcome');

  // Phase 0 — Loading
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

  // Phase 2 — Intro video with poster + play button
  return (
    <View style={s.root}>
      {Platform.OS === 'web' ? (
        <video
          ref={videoRef}
          src={INTRO_VIDEO_SRC}
          poster={INTRO_POSTER_SRC}
          preload="metadata"
          playsInline
          controls={playing}
          onEnded={() => setPlaying(false)}
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            width: '100%', height: '100%',
            objectFit: 'cover',
            backgroundColor: '#000',
          }}
        />
      ) : (
        <View style={s.nativePlaceholder} />
      )}

      {!playing && (
        <>
          {/* Dim overlay over the poster */}
          <View style={s.overlay} pointerEvents="none" />

          {/* Centered play button */}
          <View style={s.playWrap} pointerEvents="box-none">
            <TouchableOpacity
              style={s.playBtn}
              activeOpacity={0.85}
              onPress={handlePlay}
            >
              <Ionicons name="play" size={44} color="#fff" style={{ marginLeft: 5 }} />
            </TouchableOpacity>
          </View>
        </>
      )}

      <SafeAreaView style={s.safe} edges={['top', 'bottom']} pointerEvents="box-none">
        <View style={{ flex: 1 }} />
        <View style={s.bottomRow} pointerEvents="box-none">
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
  safe: { ...StyleSheet.absoluteFillObject },

  nativePlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },

  playWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems:     'center',
    justifyContent: 'center',
  },
  playBtn: {
    width:           96,
    height:          96,
    borderRadius:    48,
    backgroundColor: 'rgba(233, 69, 96, 0.92)',
    borderWidth:     3,
    borderColor:     'rgba(255,255,255,0.9)',
    alignItems:      'center',
    justifyContent:  'center',
    shadowColor:     '#000',
    shadowOpacity:   0.5,
    shadowRadius:    20,
    shadowOffset:    { width: 0, height: 6 },
  },

  bottomRow: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: 20,
    paddingBottom:     16,
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
