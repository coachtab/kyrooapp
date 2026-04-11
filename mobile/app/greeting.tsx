import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme';

export default function Greeting() {
  const router = useRouter();

  return (
    <View style={s.root}>
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>

        {/* Center — greeting */}
        <View style={s.center}>
          <Text style={s.text}>Hi, it's <Text style={s.accent}>Kyroo</Text>!</Text>
          <Text style={s.wave}>👋</Text>
        </View>

        {/* Bottom-right — "Next >" */}
        <TouchableOpacity
          style={s.next}
          activeOpacity={0.7}
          onPress={() => router.replace('/(tabs)')}
        >
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
  },
  safe: {
    flex: 1,
  },

  center: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
  },
  text: {
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

  next: {
    flexDirection:  'row',
    alignItems:     'center',
    alignSelf:      'flex-end',
    gap:            4,
    paddingHorizontal: 28,
    paddingBottom:  16,
  },
  nextText: {
    fontSize:   17,
    fontWeight: '600',
    color:      '#FFFFFF',
  },
});
