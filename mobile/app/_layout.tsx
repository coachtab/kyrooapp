import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, Text } from 'react-native';
import { AuthProvider } from '@/context/AuthContext';
import { ActionSheetProvider } from '@/context/ActionSheetContext';
import { I18nProvider } from '@/i18n';
import { colors } from '@/theme';

// Default every <Text> to DM Sans. The font itself is loaded via
// <link> in +html.tsx, so we only need to tell React Native Web which
// family to use. On native the family name falls through to the OS.
const defaultTextProps = (Text as any).defaultProps ?? {};
(Text as any).defaultProps = {
  ...defaultTextProps,
  style: [{ fontFamily: '"DM Sans", sans-serif' }, defaultTextProps.style],
};

export default function RootLayout() {
  return (
    <I18nProvider>
      <AuthProvider>
        <ActionSheetProvider>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg }, animation: Platform.OS === 'web' ? 'none' : 'slide_from_right' }} />
        </ActionSheetProvider>
      </AuthProvider>
    </I18nProvider>
  );
}
