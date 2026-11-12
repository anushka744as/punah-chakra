import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../theme/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase, fetchUserNotifications, markAllNotificationsRead } from '../services/api';
import { formatTimeAgo } from '../utils/timeAgo';

interface AlertItem {
  id: string;
  tag: string;
  title: string;
  body: string;
  createdAt: string;
  timeAgo: string;
  unread: boolean;
}

// Icon + colours per alert type, so a glance tells a booking from a cancellation or a new drive.
const typeFor = (tag: string) => {
  const t = (tag || '').toUpperCase();
  if (t.includes('CANCEL')) { return { icon: 'close-circle-outline', color: theme.colors.error, bg: theme.colors.errorContainer, label: 'Cancelled', target: 'Home' }; }
  if (t.includes('DROP')) { return { icon: 'package-variant-closed', color: theme.colors.secondary, bg: theme.colors.secondaryContainer, label: 'Drop-off point', target: 'Drives' }; }
  if (t.includes('DRIVE')) { return { icon: 'calendar-star', color: theme.colors.secondary, bg: theme.colors.secondaryContainer, label: 'Collection drive', target: 'Drives' }; }
  if (t.includes('SCHEDULED') || t.includes('REMINDER')) { return { icon: 'calendar-check-outline', color: theme.colors.primary, bg: theme.colors.primaryContainer, label: 'Pickup', target: 'Home' }; }
  if (t.includes('LOGISTICS')) { return { icon: 'truck-fast-outline', color: theme.colors.primary, bg: theme.colors.primaryContainer, label: 'On the way', target: 'Home' }; }
  if (t.includes('UPDATE')) { return { icon: 'update', color: theme.colors.warning, bg: '#FEF3C7', label: 'Update', target: 'Home' }; }
  return { icon: 'bell-outline', color: theme.colors.primary, bg: theme.colors.primaryContainer, label: 'Alert', target: null as string | null };
};

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

const groupLabel = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  if (dayKey(d) === dayKey(now)) { return 'Today'; }
  if (dayKey(d) === dayKey(yesterday)) { return 'Yesterday'; }
  return 'Earlier';
};

export const NotificationsScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setItems([]); return; }
      const data = await fetchUserNotifications(user.id);
      // Remember which were unread *before* marking everything read, so new ones stay highlighted
      // for this visit.
      setItems((data || []).map((n: any) => ({
        id: n.id,
        tag: n.tag || 'UPDATE',
        title: n.title,
        body: n.body,
        createdAt: n.created_at,
        timeAgo: formatTimeAgo(n.created_at),
        unread: !(n.is_read || n.read),
      })));
      markAllNotificationsRead(user.id).catch(() => {});
    } catch {
      setItems([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load().finally(() => setLoading(false));
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const open = (target: string | null) => {
    if (!target) { return; }
    try { navigation.navigate('MainTabs', { screen: target }); } catch { /* stay on page */ }
  };

  const newCount = items.filter(i => i.unread).length;
  const sections: { label: string; rows: AlertItem[] }[] = [];
  items.forEach(i => {
    const label = groupLabel(i.createdAt);
    const last = sections[sections.length - 1];
    if (last && last.label === label) { last.rows.push(i); }
    else { sections.push({ label, rows: [i] }); }
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />

      {/* Top Header */}
      <View style={[styles.headerBar, { paddingTop: Math.max(insets.top, 14) }]}>
        <View style={styles.headerLeft}>
          {navigation.canGoBack() && (
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Icon name="arrow-left" size={24} color={theme.colors.surface} />
            </TouchableOpacity>
          )}
          <Image source={require('../assets/logo_transparent.png')} style={styles.headerLogoImg} resizeMode="contain" />
          <Text style={styles.headerTitle}>Alerts</Text>
        </View>
        <TouchableOpacity onPress={() => { try { navigation.navigate('MainTabs', { screen: 'Profile' }); } catch { navigation.navigate('Profile'); } }} activeOpacity={0.7}>
          <View style={styles.userAvatarCircle}>
            <Icon name="account-outline" size={20} color={theme.colors.surface} />
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}
      >
        <View style={styles.titleRow}>
          <Text style={styles.pageTitle}>Notifications</Text>
          {newCount > 0 && (
            <View style={styles.newPill}>
              <Text style={styles.newPillText}>{newCount} new</Text>
            </View>
          )}
        </View>
        <Text style={styles.pageSubtitle}>Pickups, drives and drop-off points, all in one place.</Text>

        {loading ? (
          <ActivityIndicator style={styles.loader} color={theme.colors.primary} />
        ) : items.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Icon name="bell-check-outline" size={34} color={theme.colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>You're all caught up</Text>
            <Text style={styles.emptyText}>Updates about your pickups, new collection drives and drop-off points will show up here.</Text>
          </View>
        ) : (
          sections.map(section => (
            <View key={section.label}>
              <Text style={styles.sectionLabel}>{section.label.toUpperCase()}</Text>
              {section.rows.map(n => {
                const t = typeFor(n.tag);
                return (
                  <TouchableOpacity
                    key={n.id}
                    style={[styles.card, n.unread && styles.cardUnread]}
                    activeOpacity={t.target ? 0.75 : 1}
                    onPress={() => open(t.target)}
                  >
                    <View style={[styles.iconBg, { backgroundColor: t.bg }]}>
                      <Icon name={t.icon} size={22} color={t.color} />
                    </View>
                    <View style={styles.content}>
                      <View style={styles.metaRow}>
                        <Text style={[styles.typeLabel, { color: t.color }]}>{t.label.toUpperCase()}</Text>
                        <View style={styles.timeWrap}>
                          {n.unread && <View style={styles.dot} />}
                          <Text style={styles.timeAgo}>{n.timeAgo}</Text>
                        </View>
                      </View>
                      <Text style={styles.cardTitle}>{n.title}</Text>
                      <Text style={styles.cardBody}>{n.body}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn: { marginRight: 8 },
  headerLogoImg: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.surface },
  headerTitle: { fontSize: 22, fontFamily: theme.fonts.bodyBold, color: theme.colors.surface, letterSpacing: -0.3 },
  userAvatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: { padding: 16, paddingBottom: 32 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  pageTitle: { fontSize: 28, fontFamily: theme.fonts.bodyBold, color: theme.colors.text },
  newPill: { backgroundColor: theme.colors.primary, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  newPillText: { fontSize: 12, fontFamily: theme.fonts.bodyBold, color: theme.colors.surface },
  pageSubtitle: { fontSize: 14, fontFamily: theme.fonts.body, color: theme.colors.textSecondary, marginBottom: 18 },
  loader: { marginTop: 40 },
  sectionLabel: {
    fontSize: 11,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.textSecondary,
    letterSpacing: 0.8,
    marginTop: 6,
    marginBottom: 10,
  },
  card: {
    flexDirection: 'row',
    gap: 14,
    padding: 14,
    borderRadius: 18,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 10,
  },
  cardUnread: { borderColor: theme.colors.primary, backgroundColor: '#F4FBF6' },
  iconBg: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  typeLabel: { fontSize: 10, fontFamily: theme.fonts.bodyBold, letterSpacing: 0.8 },
  timeWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.primary },
  timeAgo: { fontSize: 12, fontFamily: theme.fonts.bodySemiBold, color: theme.colors.textSecondary },
  cardTitle: { fontSize: 15, fontFamily: theme.fonts.bodyBold, color: theme.colors.text, marginBottom: 3 },
  cardBody: { fontSize: 13, fontFamily: theme.fonts.body, color: theme.colors.textSecondary, lineHeight: 19 },
  empty: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: { fontSize: 17, fontFamily: theme.fonts.bodyBold, color: theme.colors.text, marginBottom: 6 },
  emptyText: { fontSize: 14, fontFamily: theme.fonts.body, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 20 },
});
