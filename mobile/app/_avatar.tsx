import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { colors } from '@/theme';

export function AvatarButton() {
  const router = useRouter();
  const { user } = useAuth();

  const displayName = user?.name || user?.email?.split('@')[0] || '';
  const initials = displayName
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  return (
    <TouchableOpacity
      style={av.btn}
      activeOpacity={0.8}
      onPress={() => router.push('/(tabs)/profile' as any)}
    >
      <Text style={av.text}>{initials}</Text>
    </TouchableOpacity>
  );
}

const av = StyleSheet.create({
  btn: {
    width:           34,
    height:          34,
    borderRadius:    17,
    backgroundColor: '#2C2C2E',
    alignItems:      'center',
    justifyContent:  'center',
  },
  text: {
    fontSize:      12,
    fontWeight:    '800',
    color:         colors.text,
    letterSpacing: 0.5,
  },
});
