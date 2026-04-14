import { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme';

// Placeholder intro video — swap for /intro.mp4 once you drop the real file
// into mobile/public/intro.mp4 (build-web.js copies public/ → dist/).
const INTRO_VIDEO_SRC = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

export default function Greeting() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    // Autoplay muted on mount (browsers block unmuted autoplay)
    if (Platform.OS === 'web' && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, []);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setMuted(videoRef.current.muted);
    }
  };

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
          <Text style={s.placeholderText}>Intro video</Text>
        </View>
      )}

      {/* Dark overlay for legibility */}
      <View style={s.overlay} pointerEvents="none" />

      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        {/* Caption */}
        <View style={s.captionWrap}>
          <Text style={s.caption}>
            Hi, I'm <Text style={s.accent}>Kyroo</Text>
          </Text>
          <Text style={s.subcaption}>AI-powered fitness plans built around you.</Text>
        </View>

        {/* Bottom controls */}
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
          <TouchableOpacity
            style={s.next}
            activeOpacity={0.7}
            onPress={() => router.replace('/(tabs)')}
          >
            <Text style={s.nextText}>Next</Text>
            <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },

  nativePlaceholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  placeholderText: { color: colors.muted, fontSize: 14, fontWeight: '600' },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },

  safe: { flex: 1, justifyContent: 'space-between' },

  captionWrap: {
    paddingHorizontal: 28,
    paddingTop:        60,
    alignItems:        'center',
  },
  caption: {
    fontSize:   34,
    fontWeight: '800',
    color:      '#FFFFFF',
    textAlign:  'center',
  },
  accent:      { color: colors.accent },
  subcaption: {
    fontSize:   15,
    color:      '#E0E0E0',
    textAlign:  'center',
    marginTop:  10,
    maxWidth:   280,
  },

  bottomRow: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: 20,
    paddingBottom:     16,
    gap:               8,
  },
  muteBtn: {
    width:          40,
    height:         40,
    borderRadius:   20,
    backgroundColor:'rgba(0,0,0,0.5)',
    borderWidth:    1,
    borderColor:    'rgba(255,255,255,0.2)',
    alignItems:     'center',
    justifyContent: 'center',
  },
  next: {
    flexDirection:    'row',
    alignItems:       'center',
    gap:              4,
    paddingHorizontal: 18,
    paddingVertical:  10,
    borderRadius:     22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth:      1,
    borderColor:     'rgba(255,255,255,0.25)',
  },
  nextText: {
    fontSize:   15,
    fontWeight: '700',
    color:      '#FFFFFF',
  },
});
