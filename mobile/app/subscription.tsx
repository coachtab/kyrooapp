import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { colors } from '@/theme';
import { useT } from '@/i18n';

interface SubItem {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconBg: string;
  name: string;
  detail: string;
  status: string;
  statusColor?: string;
  price?: string;
}

export default function SubscriptionScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { lang } = useT();
  const isPro = user?.is_premium;

  const items: SubItem[] = isPro
    ? [
        {
          icon:      'sparkles',
          iconBg:    colors.accent,
          name:      'Kyroo Pro',
          detail:    lang === 'de' ? 'Monatliches Abo' : 'Monthly plan',
          status:    lang === 'de' ? 'Aktiv' : 'Active',
          statusColor: '#30D158',
          price:     '9,99 €',
        },
      ]
    : [
        {
          icon:      'sparkles-outline',
          iconBg:    '#2C2C2E',
          name:      'Kyroo Free',
          detail:    lang === 'de' ? 'Kostenloser Plan' : 'Free plan',
          status:    lang === 'de' ? 'Aktuell' : 'Current',
          statusColor: colors.muted,
        },
      ];

  // Features comparison
  const features = [
    {
      label: lang === 'de' ? 'KI-Pläne' : 'AI plans',
      free: lang === 'de' ? '5/Mt' : '5/mo',
      pro: '∞',
    },
    {
      label: lang === 'de' ? 'Ernährungsplan' : 'Nutrition plan',
      free: '—',
      pro: '✓',
    },
    {
      label: lang === 'de' ? 'Trainingsplan anpassen' : 'Edit schedule',
      free: '✓',
      pro: '✓',
    },
    {
      label: lang === 'de' ? 'Pause einplanen' : 'Schedule breaks',
      free: '✓',
      pro: '✓',
    },
    {
      label: lang === 'de' ? 'Gewicht tracken' : 'Weight tracking',
      free: '✓',
      pro: '✓',
    },
    {
      label: lang === 'de' ? 'Premium-Artikel' : 'Premium articles',
      free: '—',
      pro: '✓',
    },
  ];

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.backBtn} />
        <Text style={s.headerTitle}>
          {lang === 'de' ? 'Abonnements' : 'Subscriptions'}
        </Text>
        <TouchableOpacity
          onPress={() => router.replace('/(tabs)/profile' as any)}
          style={s.closeBtn}
          hitSlop={12}
        >
          <Ionicons name="close" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} bounces={false} overScrollMode="never">

        {/* Status label */}
        <Text style={s.statusHeader}>
          {isPro
            ? (lang === 'de' ? 'Aktiv' : 'Active')
            : (lang === 'de' ? 'Verfügbar' : 'Available')}
        </Text>

        {/* Subscription rows — Apple style */}
        <View style={s.group}>
          {items.map((item, i) => (
            <View key={i} style={[s.row, i < items.length - 1 && s.rowBorder]}>
              <View style={[s.iconWrap, { backgroundColor: item.iconBg }]}>
                <Ionicons name={item.icon} size={20} color="#fff" />
              </View>
              <View style={s.rowText}>
                <Text style={s.rowName}>{item.name}</Text>
                <Text style={s.rowDetail}>{item.detail}</Text>
                <Text style={[s.rowStatus, { color: item.statusColor || colors.muted }]}>
                  {item.status}
                </Text>
              </View>
              {item.price && <Text style={s.price}>{item.price}</Text>}
              <Ionicons name="chevron-forward" size={16} color={colors.muted} />
            </View>
          ))}
        </View>

        {/* Upgrade CTA — shown when free */}
        {!isPro && (
          <TouchableOpacity style={s.upgradeBtn} activeOpacity={0.85}>
            <Ionicons name="sparkles" size={18} color="#fff" />
            <Text style={s.upgradeBtnText}>
              {lang === 'de' ? 'Auf Kyroo Pro upgraden' : 'Upgrade to Kyroo Pro'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Feature comparison */}
        <Text style={s.sectionLabel}>
          {lang === 'de' ? 'FUNKTIONEN' : 'FEATURES'}
        </Text>
        <View style={s.group}>
          {/* Table header */}
          <View style={[s.featureRow, s.rowBorder]}>
            <Text style={[s.featureLabel, { fontWeight: '700' }]}> </Text>
            <Text style={s.featureCol}>Free</Text>
            <Text style={[s.featureCol, { color: colors.accent, fontWeight: '700' }]}>Pro</Text>
          </View>
          {features.map((f, i) => (
            <View key={i} style={[s.featureRow, i < features.length - 1 && s.rowBorder]}>
              <Text style={s.featureLabel}>{f.label}</Text>
              <Text style={s.featureCol}>{f.free}</Text>
              <Text style={[s.featureCol, { color: colors.accent }]}>{f.pro}</Text>
            </View>
          ))}
        </View>

        {/* Manage / restore */}
        <View style={[s.group, { marginTop: 20 }]}>
          <TouchableOpacity style={[s.linkRow, s.rowBorder]}>
            <Text style={s.linkText}>
              {lang === 'de' ? 'Käufe wiederherstellen' : 'Restore purchases'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.linkRow}>
            <Text style={s.linkText}>
              {lang === 'de' ? 'Abo verwalten' : 'Manage subscription'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={s.disclaimer}>
          {lang === 'de'
            ? 'Abonnements verlängern sich automatisch, sofern sie nicht mindestens 24 Stunden vor Ende der aktuellen Laufzeit gekündigt werden.'
            : 'Subscriptions automatically renew unless cancelled at least 24 hours before the end of the current period.'}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#000', overflow: 'hidden' },

  header: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: 16,
    paddingTop:        8,
    paddingBottom:     12,
  },
  backBtn: { width: 36, height: 36 },
  closeBtn: {
    width:           36,
    height:          36,
    borderRadius:    18,
    backgroundColor: '#2C2C2E',
    alignItems:      'center',
    justifyContent:  'center',
  },
  headerTitle: {
    fontSize:   16,
    fontWeight: '600',
    color:      colors.text,
  },

  scroll: { paddingHorizontal: 20, paddingBottom: 40, overflow: 'hidden' },

  statusHeader: {
    fontSize:     13,
    fontWeight:   '600',
    color:        colors.muted,
    marginBottom: 8,
    paddingLeft:  4,
  },

  // Apple grouped list
  group: {
    backgroundColor: '#1C1C1E',
    borderRadius:    14,
    overflow:        'hidden',
    marginBottom:    20,
  },
  row: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: 16,
    paddingVertical:   14,
    gap:               12,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#3A3A3C',
  },
  iconWrap: {
    width:        38,
    height:       38,
    borderRadius: 10,
    alignItems:   'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1, minWidth: 0 },
  rowName: {
    fontSize:   15,
    fontWeight: '600',
    color:      colors.text,
  },
  rowDetail: {
    fontSize: 12,
    color:    colors.muted,
    marginTop: 1,
  },
  rowStatus: {
    fontSize:   12,
    fontWeight: '500',
    marginTop:  2,
  },
  price: {
    fontSize:     15,
    fontWeight:   '500',
    color:        colors.muted,
    marginRight:  4,
  },

  // Upgrade CTA
  upgradeBtn: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             8,
    backgroundColor: colors.accent,
    borderRadius:    14,
    paddingVertical: 16,
    marginBottom:    24,
  },
  upgradeBtnText: {
    fontSize:   16,
    fontWeight: '700',
    color:      '#fff',
  },

  // Feature comparison
  sectionLabel: {
    fontSize:      12,
    fontWeight:    '600',
    color:         colors.muted,
    marginLeft:    4,
    marginBottom:  6,
  },
  featureRow: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: 16,
    paddingVertical:   13,
  },
  featureLabel: {
    flex:     1,
    fontSize: 14,
    color:    colors.text,
  },
  featureCol: {
    width:      50,
    fontSize:   14,
    fontWeight: '600',
    color:      colors.muted,
    textAlign:  'center',
  },

  // Manage links
  linkRow: {
    paddingHorizontal: 16,
    paddingVertical:   15,
  },
  linkText: {
    fontSize:   15,
    color:      '#0A84FF',
  },

  disclaimer: {
    fontSize:   11,
    color:      colors.muted,
    textAlign:  'center',
    lineHeight: 16,
    marginTop:  16,
    paddingHorizontal: 12,
  },
});
