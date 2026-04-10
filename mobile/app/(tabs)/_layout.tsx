import { Tabs } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/theme';
import { useT } from '@/i18n';

function KyrooTabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { tr } = useT();
  const tabs = [
    { name: 'index',    labelKey: 'tab_home'    as const },
    { name: 'plans',    labelKey: 'tab_plans'   as const },
    { name: 'tracking', labelKey: 'tab_track'   as const },
    { name: 'profile',  labelKey: 'tab_profile' as const },
  ];
  return (
    <View style={[s.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {tabs.map((tab, i) => {
        const active = state.index === i;
        return (
          <TouchableOpacity key={tab.name} style={s.tab} onPress={() => navigation.navigate(tab.name)}>
            <View style={[s.dot, active && s.dotActive]}>
              <View style={[s.inner, active && s.innerActive]} />
            </View>
            <Text style={[s.label, active && s.labelActive]}>{tr(tab.labelKey)}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs tabBar={props => <KyrooTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index"    options={{ title: 'Home' }} />
      <Tabs.Screen name="plans"    options={{ title: 'Plans' }} />
      <Tabs.Screen name="tracking" options={{ title: 'Track' }} />
      <Tabs.Screen name="profile"  options={{ title: 'Profile' }} />
    </Tabs>
  );
}

const s = StyleSheet.create({
  bar:         { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.bg },
  tab:         { alignItems: 'center', gap: 4, paddingHorizontal: 12 },
  dot:         { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.muted, alignItems: 'center', justifyContent: 'center' },
  dotActive:   { borderColor: colors.accent },
  inner:       { width: 6, height: 6, borderRadius: 3, backgroundColor: 'transparent' },
  innerActive: { backgroundColor: colors.accent },
  label:       { fontSize: 10, fontWeight: '500', color: colors.muted },
  labelActive: { color: colors.accent },
});
