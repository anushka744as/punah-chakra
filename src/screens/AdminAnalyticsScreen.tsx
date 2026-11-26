import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Modal,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../theme/theme';
import { AdminTabBar } from '../components/AdminTabBar';
import { DonationItem, fetchAllScheduledDonations, fetchUserCounts } from '../services/api';
import { orderState, pincodeOf } from '../utils/orderAnalytics';
import { toDayKey as dayKey } from '../utils/dayKey';

const RANGES: { key: string; label: string }[] = [
  { key: '7', label: '7 days' },
  { key: '30', label: '30 days' },
  { key: '90', label: '90 days' },
  { key: 'all', label: 'All time' },
];

const Dropdown = ({ label, value, options, selected, open, onToggle, onSelect }: {
  label: string;
  value: string;
  options: { key: string; label: string }[];
  selected: string;
  open: boolean;
  onToggle: () => void;
  onSelect: (key: string) => void;
}) => {
  const ref = useRef<View>(null);
  const [pos, setPos] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const press = () => {
    if (open) return onToggle();
    ref.current?.measureInWindow((x, y, w, h) => {
      setPos({ x, y, w, h });
      onToggle();
    });
  };
  return (
    <View style={styles.ddWrap}>
      <View ref={ref} collapsable={false}>
        <TouchableOpacity style={[styles.ddBtn, open && styles.ddBtnOpen]} onPress={press} activeOpacity={0.8}>
          <View style={{ flex: 1 }}>
            <Text style={styles.ddLabel}>{label.toUpperCase()}</Text>
            <Text style={styles.ddValue} numberOfLines={1}>{value}</Text>
          </View>
          <Icon name={open ? 'chevron-up' : 'chevron-down'} size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>
      <Modal visible={open} transparent animationType="fade" statusBarTranslucent onRequestClose={onToggle}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onToggle} />
        <View style={[styles.ddMenu, { position: 'absolute', left: pos.x, top: pos.y + pos.h + 4, width: pos.w }]}>
          <ScrollView style={{ maxHeight: 240 }} nestedScrollEnabled>
            {options.map(o => (
              <TouchableOpacity key={o.key} style={styles.ddItem} onPress={() => onSelect(o.key)} activeOpacity={0.7}>
                <Text style={[styles.ddItemText, selected === o.key && styles.ddItemOn]}>{o.label}</Text>
                {selected === o.key && <Icon name="check" size={16} color={theme.colors.primary} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

type Group = [string, { t: number; c: number; x: number }];

export const AdminAnalyticsScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<DonationItem[]>([]);
  const [users, setUsers] = useState({ total: 0, newThisWeek: 0 });
  const [range, setRange] = useState('30');
  const [pin, setPin] = useState('');
  const [cat, setCat] = useState('all');
  const [open, setOpen] = useState<'range' | 'cat' | null>(null);

  const load = useCallback(async () => {
    const [d, u] = await Promise.all([
      fetchAllScheduledDonations().catch(() => [] as DonationItem[]),
      fetchUserCounts().catch(() => ({ total: 0, newThisWeek: 0 })),
    ]);
    setRows(d);
    setUsers(u);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const cats = useMemo(() => [...new Set(rows.map(r => r.category).filter(Boolean))].sort(), [rows]);

  const stats = useMemo(() => {
    const from = range === 'all' ? 0 : Date.now() - Number(range) * 864e5;
    const list = rows.filter(
      d =>
        (!from || new Date(d.created_at || 0).getTime() >= from) &&
        (!pin || pincodeOf(d).includes(pin)) &&
        (cat === 'all' || d.category === cat)
    );
    const st = list.map(orderState);
    const count = (s: string) => st.filter(x => x === s).length;
    const total = list.length;
    const completed = count('completed');
    const cancelled = count('cancelled');
    const upcoming = count('upcoming');
    const kg = list.reduce(
      (s, d, i) => (st[i] === 'completed' ? s + Number(d.weight_kg || d.estimated_quantity_kg || 10) : s),
      0
    );
    const donors = new Set(list.map(d => d.donor_id)).size;

    const span = range === 'all' ? 14 : Math.min(Number(range), 14);
    const perDay = Array.from({ length: span }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (span - 1 - i));
      const key = dayKey(d);
      return { d, n: list.filter(x => x.created_at && dayKey(new Date(x.created_at)) === key).length };
    });

    const group = (keyFn: (d: DonationItem) => string | undefined): Group[] => {
      const g: Record<string, { t: number; c: number; x: number }> = {};
      list.forEach((d, i) => {
        const k = keyFn(d) || 'Other';
        const o = (g[k] = g[k] || { t: 0, c: 0, x: 0 });
        o.t++;
        if (st[i] === 'completed') o.c++;
        if (st[i] === 'cancelled') o.x++;
      });
      return Object.entries(g).sort((a, b) => b[1].t - a[1].t).slice(0, 8);
    };

    return { total, completed, cancelled, upcoming, kg, donors, perDay, byPin: group(pincodeOf), byCat: group(d => d.category) };
  }, [rows, range, pin, cat]);

  const pct = (n: number) => (stats.total ? `${Math.round((n / stats.total) * 100)}%` : '0%');
  const maxDay = Math.max(1, ...stats.perDay.map(x => x.n));
  const kgText = stats.kg >= 1000 ? `${(stats.kg / 1000).toFixed(2)} t` : `${stats.kg.toFixed(1)} kg`;

  const renderTable = (list: Group[]) =>
    list.length ? (
      <View>
        <View style={styles.tr}>
          <Text style={[styles.th, { flex: 1 }]} />
          <Text style={[styles.th, styles.num]}>Orders</Text>
          <Text style={[styles.th, styles.num]}>Done</Text>
          <Text style={[styles.th, styles.num]}>Cancel</Text>
        </View>
        {list.map(([k, v]) => (
          <View key={k} style={[styles.tr, styles.trLine]}>
            <Text style={[styles.tdName, { flex: 1 }]} numberOfLines={1}>{k}</Text>
            <Text style={[styles.td, styles.num]}>{v.t}</Text>
            <Text style={[styles.td, styles.num]}>{v.c}</Text>
            <Text style={[styles.td, styles.num]}>{v.x}</Text>
          </View>
        ))}
      </View>
    ) : (
      <Text style={styles.muted}>No orders for these filters.</Text>
    );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Icon name="arrow-left" size={24} color={theme.colors.surface} />
        </TouchableOpacity>
        <Text style={styles.title}>Analytics</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={theme.colors.primary} />
      ) : (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <View style={styles.heroTile}>
              <Text style={styles.heroLabel}>TOTAL ORDERS</Text>
              <Text style={styles.heroNum}>{stats.total}</Text>
            </View>
            <View style={styles.heroTile}>
              <Text style={styles.heroLabel}>COMPLETED</Text>
              <Text style={[styles.heroNum, { color: theme.colors.primaryDark }]}>{stats.completed}</Text>
              <Text style={[styles.heroPct, { color: theme.colors.primaryDark }]}>{pct(stats.completed)}</Text>
            </View>
            <View style={styles.heroTile}>
              <Text style={styles.heroLabel}>CANCELLED</Text>
              <Text style={[styles.heroNum, { color: theme.colors.error }]}>{stats.cancelled}</Text>
              <Text style={[styles.heroPct, { color: theme.colors.error }]}>{pct(stats.cancelled)}</Text>
            </View>
          </View>
          <Text style={styles.note}>Completed = pickup date passed without being cancelled.</Text>

          <View style={styles.ddRow}>
            <Dropdown
              label="Period"
              value={RANGES.find(r => r.key === range)?.label ?? ''}
              options={RANGES.map(r => ({ key: r.key, label: r.label }))}
              selected={range}
              open={open === 'range'}
              onToggle={() => setOpen(open === 'range' ? null : 'range')}
              onSelect={k => { setRange(k); setOpen(null); }}
            />
            <Dropdown
              label="Category"
              value={cat === 'all' ? 'All categories' : cat}
              options={['all', ...cats].map(c => ({ key: c, label: c === 'all' ? 'All categories' : c }))}
              selected={cat}
              open={open === 'cat'}
              onToggle={() => setOpen(open === 'cat' ? null : 'cat')}
              onSelect={k => { setCat(k); setOpen(null); }}
            />
          </View>

          <View style={styles.searchBox}>
            <Icon name="magnify" size={20} color={theme.colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              value={pin}
              onChangeText={t => setPin(t.replace(/\D/g, ''))}
              placeholder="Search pincode"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="number-pad"
              maxLength={6}
            />
            {!!pin && (
              <TouchableOpacity onPress={() => setPin('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Icon name="close-circle" size={18} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>More details</Text>
            <View style={styles.grid}>
              <View style={styles.mini}><Text style={styles.miniLabel}>UPCOMING</Text><Text style={styles.miniNum}>{stats.upcoming}</Text></View>
              <View style={styles.mini}><Text style={styles.miniLabel}>WASTE DIVERTED</Text><Text style={styles.miniNum}>{kgText}</Text></View>
              <View style={styles.mini}>
                <Text style={styles.miniLabel}>USERS IN APP</Text>
                <Text style={styles.miniNum}>{users.total}</Text>
                <Text style={styles.miniSub}>+{users.newThisWeek} this week</Text>
              </View>
              <View style={styles.mini}><Text style={styles.miniLabel}>ACTIVE DONORS</Text><Text style={styles.miniNum}>{stats.donors}</Text></View>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Orders per day</Text>
            <View style={styles.bars}>
              {stats.perDay.map((x, i) => (
                <View key={i} style={styles.barCol}>
                  <View style={[styles.bar, { height: Math.max(3, (x.n / maxDay) * 84) }]} />
                  <Text style={styles.barN}>{x.n}</Text>
                  <Text style={styles.barD}>{x.d.getDate()}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>By pincode</Text>
            {renderTable(stats.byPin)}
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>By category</Text>
            {renderTable(stats.byCat)}
          </View>
        </ScrollView>
      )}
      <AdminTabBar active="analytics" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: { fontSize: 20, fontFamily: theme.fonts.bodyBold, color: theme.colors.surface },
  content: { padding: theme.spacing.md, gap: theme.spacing.sm, paddingBottom: theme.spacing.xxl },
  hero: { flexDirection: 'row', gap: 10 },
  heroTile: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  heroLabel: { fontSize: 10, letterSpacing: 0.8, fontFamily: theme.fonts.bodyBold, color: theme.colors.textSecondary },
  heroNum: { fontSize: 30, fontFamily: theme.fonts.bodyBold, color: theme.colors.text, marginTop: 4 },
  heroPct: { fontSize: 12, fontFamily: theme.fonts.bodySemiBold },
  note: { fontSize: 12, fontFamily: theme.fonts.body, color: theme.colors.textSecondary },
  ddRow: { flexDirection: 'row', gap: 10 },
  ddWrap: { flex: 1 },
  ddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  ddBtnOpen: { borderColor: theme.colors.primary },
  ddLabel: { fontSize: 10, letterSpacing: 0.8, fontFamily: theme.fonts.bodyBold, color: theme.colors.textSecondary },
  ddValue: { fontSize: 14, fontFamily: theme.fonts.bodySemiBold, color: theme.colors.text },
  ddMenu: {
    backgroundColor: theme.colors.surface,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  ddItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 11 },
  ddItemText: { fontSize: 14, fontFamily: theme.fonts.body, color: theme.colors.text },
  ddItemOn: { fontFamily: theme.fonts.bodyBold, color: theme.colors.primary },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 12,
  },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 15, fontFamily: theme.fonts.body, color: theme.colors.text },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
  },
  cardTitle: { fontSize: 17, fontFamily: theme.fonts.bodyBold, color: theme.colors.text, marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  mini: { width: '47.5%', backgroundColor: theme.colors.primaryContainer, borderRadius: 16, padding: 12 },
  miniLabel: { fontSize: 10.5, letterSpacing: 0.8, fontFamily: theme.fonts.bodyBold, color: theme.colors.textSecondary },
  miniNum: { fontSize: 22, fontFamily: theme.fonts.bodyBold, color: theme.colors.text, marginTop: 2 },
  miniSub: { fontSize: 11, fontFamily: theme.fonts.body, color: theme.colors.textSecondary },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 130, marginTop: 4 },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 2 },
  bar: { width: '100%', maxWidth: 18, backgroundColor: theme.colors.primary, borderTopLeftRadius: 5, borderTopRightRadius: 5 },
  barN: { fontSize: 9, fontFamily: theme.fonts.body, color: theme.colors.text },
  barD: { fontSize: 9, fontFamily: theme.fonts.body, color: theme.colors.textSecondary },
  tr: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9 },
  trLine: { borderTopWidth: 1, borderTopColor: theme.colors.border },
  th: { fontSize: 11, fontFamily: theme.fonts.bodyBold, color: theme.colors.textSecondary },
  td: { fontSize: 14, fontFamily: theme.fonts.body, color: theme.colors.text },
  tdName: { fontSize: 14, fontFamily: theme.fonts.bodyBold, color: theme.colors.text },
  num: { width: 56, textAlign: 'right' },
  muted: { fontSize: 13, fontFamily: theme.fonts.body, color: theme.colors.textSecondary },
});
