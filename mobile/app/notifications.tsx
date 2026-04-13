import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme';
import { useT } from '@/i18n';

const STORAGE_KEY = 'kyroo.notifPrefs.v1';

interface Prefs {
  daily_reminder:  boolean;
  streak_alerts:   boolean;
  plan_milestones: boolean;
  plan_announcements: boolean;
}

const DEFAULTS: Prefs = {
  daily_reminder:     true,
  streak_alerts:      true,
  plan_milestones:    true,
  plan_announcements: false,
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { tr, lang } = useT();
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (raw) {
        try { setPrefs({ ...DEFAULTS, ...JSON.parse(raw) }); } catch {}
      }
    });
  }, []);

  const update = (key: keyof Prefs, value: boolean) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.title}>
          {lang === 'de' ? 'Benachrichtigungen' : 'Notifications'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.sub}>{tr('notif_sub')}</Text>

        <Text style={s.sectionLabel}>{tr('notif_section_daily')}</Text>
        <View style={s.card}>
          <Row
            label={tr('notif_daily_reminder')}
            desc={tr('notif_daily_desc')}
            value={prefs.daily_reminder}
            onChange={v => update('daily_reminder', v)}
          />
          <View style={s.divider} />
          <Row
            label={tr('notif_streak')}
            desc={tr('notif_streak_desc')}
            value={prefs.streak_alerts}
            onChange={v => update('streak_alerts', v)}
          />
        </View>

        <Text style={s.sectionLabel}>{tr('notif_section_plan')}</Text>
        <View style={s.card}>
          <Row
            label={tr('notif_plan_milestone')}
            desc={tr('notif_plan_milestone_desc')}
            value={prefs.plan_milestones}
            onChange={v => update('plan_milestones', v)}
          />
          <View style={s.divider} />
          <Row
            label={tr('notif_plan_new')}
            desc={tr('notif_plan_new_desc')}
            value={prefs.plan_announcements}
            onChange={v => update('plan_announcements', v)}
          />
        </View>

        <View style={s.noticeCard}>
          <Ionicons name="information-circle-outline" size={18} color={colors.muted} style={{ marginTop: 1 }} />
          <Text style={s.noticeText}>{tr('notif_web_notice')}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, desc, value, onChange }: {
  label: string; desc: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <View style={rs.row}>
      <View style={rs.textCol}>
        <Text style={rs.label}>{label}</Text>
        <Text style={rs.desc}>{desc}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: '#2a2a2e', true: colors.accent }}
        thumbColor="#fff"
        ios_backgroundColor="#2a2a2e"
      />
    </View>
  );
}

const rs = StyleSheet.create({
  row:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 14 },
  textCol: { flex: 1, minWidth: 0 },
  label:   { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 3 },
  desc:    { fontSize: 12, color: colors.muted, lineHeight: 17 },
});

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000' },

  header: {
    flexDirection:  'row',
    alignItems:     'center',
    paddingHorizontal: 20,
    paddingTop:     24,
    paddingBottom:  16,
    gap:            4,
  },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  title:   { fontSize: 28, fontWeight: '800', color: colors.text },

  scroll:  { paddingHorizontal: 20, paddingBottom: 40 },

  sub: { fontSize: 14, color: colors.muted, marginBottom: 22, lineHeight: 20 },

  sectionLabel: {
    fontSize:      11,
    fontWeight:    '800',
    color:         colors.muted,
    letterSpacing: 1.5,
    marginLeft:    4,
    marginBottom:  8,
    marginTop:     4,
  },

  card: {
    backgroundColor: '#0d0d0d',
    borderRadius:    16,
    borderWidth:     1.5,
    borderColor:     colors.border,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom:    18,
  },
  divider: { height: 1, backgroundColor: colors.border },

  noticeCard: {
    flexDirection:   'row',
    gap:             10,
    backgroundColor: '#0d0d0d',
    borderRadius:    14,
    borderWidth:     1,
    borderColor:     colors.border,
    padding:         14,
    marginTop:       6,
  },
  noticeText: { flex: 1, fontSize: 12, color: colors.muted, lineHeight: 18 },
});
