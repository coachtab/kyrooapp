import { Tabs } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme';
import { useT } from '@/i18n';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const TABS: { name: string; labelKey: 'tab_home' | 'tab_plans' | 'tab_track' | 'tab_profile'; icon: IoniconsName; iconActive: IoniconsName }[] = [
  { name: 'index',    labelKey: 'tab_home',    icon: 'home-outline',        iconActive: 'home' },
  { name: 'plans',    labelKey: 'tab_plans',   icon: 'barbell-outline',     iconActive: 'barbell' },
  { name: 'tracking', labelKey: 'tab_track',   icon: 'stats-chart-outline', iconActive: 'stats-chart' },
  { name: 'profile',  labelKey: 'tab_profile', icon: 'person-outline',      iconActive: 'person' },
];

function KyrooTabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { tr } = useT();

  return (
    <View style={[s.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {TABS.map((tab, i) => {
        const active = state.index === i;
        return (
          <TouchableOpacity
            key={tab.name}
            style={s.tab}
            onPress={() => navigation.navigate(tab.name)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={active ? tab.iconActive : tab.icon}
              size={22}
              color={active ? colors.accent : colors.muted}
            />
            <Text style={[s.label, active && s.labelActive]}>
              {tr(tab.labelKey)}
            </Text>
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
  tab:         { alignItems: 'center', gap: 3, paddingHorizontal: 12 },
  label:       { fontSize: 10, fontWeight: '500', color: colors.muted },
  labelActive: { color: colors.accent, fontWeight: '600' },
});
