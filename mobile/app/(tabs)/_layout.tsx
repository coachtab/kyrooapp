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
    <View style={[s.outer, { paddingBottom: Math.min(insets.bottom, 14) || 4 }]}>
      <View style={s.pill}>
        {TABS.map((tab, i) => {
          const active = state.index === i;
          return (
            <TouchableOpacity
              key={tab.name}
              style={s.tab}
              onPress={() => navigation.navigate(tab.name)}
              activeOpacity={0.7}
            >
              <View style={[s.iconWrap, active && s.iconWrapActive]}>
                <Ionicons
                  name={active ? tab.iconActive : tab.icon}
                  size={20}
                  color={active ? colors.accent : '#8E8E93'}
                />
              </View>
              <Text style={[s.label, active && s.labelActive]}>
                {tr(tab.labelKey)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
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
  outer: {
    backgroundColor:   '#000',
    paddingHorizontal: 16,
  },
  pill: {
    flexDirection:     'row',
    justifyContent:    'space-around',
    alignItems:        'center',
    backgroundColor:   '#1C1C1E',
    borderRadius:      28,
    borderWidth:       1,
    borderColor:       '#3A3A3C',
    paddingVertical:   5,
    paddingHorizontal: 6,
  },
  tab: {
    flex:        1,
    alignItems:  'center',
    gap:         2,
  },
  iconWrap: {
    width:          36,
    height:         36,
    borderRadius:   18,
    alignItems:     'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: '#3A3A3C',
  },
  label: {
    fontSize:   9,
    fontWeight: '500',
    color:      '#8E8E93',
  },
  labelActive: {
    color:      colors.accent,
    fontWeight: '600',
  },
});
