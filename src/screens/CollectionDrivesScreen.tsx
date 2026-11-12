import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, RefreshControl } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme/theme';
import { useAppData } from '../data/AppDataContext';
import { CollectionDrive, DropOffPoint, fetchUpcomingDrives, fetchActiveDropOffPoints } from '../services/api';
import { toDayKey } from '../utils/dayKey';

const shortDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

const parts = (iso: string) => {
  const d = new Date(`${iso}T00:00:00`);
  return {
    day: d.getDate(),
    month: d.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase(),
    weekday: d.toLocaleDateString('en-IN', { weekday: 'long' }),
  };
};

export const CollectionDrivesScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { profile } = useAppData();
  const [drives, setDrives] = useState<CollectionDrive[] | null>(null);
  const [dropOffs, setDropOffs] = useState<DropOffPoint[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    fetchActiveDropOffPoints().then(setDropOffs).catch(() => setDropOffs([]));
    try {
      setDrives(await fetchUpcomingDrives());
    } catch {
      setDrives([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const list = drives ?? [];
  const mine = profile?.pincode;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />

      {/* Top Header */}
      <View style={[styles.headerBar, { paddingTop: Math.max(insets.top, 14) }]}>
        <View style={styles.headerLeft}>
          <Image source={require('../assets/logo_transparent.png')} style={styles.headerLogoImg} resizeMode="contain" />
          <Text style={styles.headerTitle}>Drives</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('MainTabs', { screen: 'Profile' })} activeOpacity={0.7}>
          <View style={styles.userAvatarCircle}>
            <Icon name="account-outline" size={20} color={theme.colors.surface} />
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
          />
        }
      >
        <Text style={styles.pageTitle}>Collection Drives</Text>
        <Text style={styles.pageSubtitle}>Upcoming collection drives and drop-off points near you.</Text>

        <Text style={styles.sectionTitle}>Collection drives</Text>


        {drives === null ? (
          <ActivityIndicator style={{ marginTop: 32 }} color={theme.colors.primary} />
        ) : list.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No collection drives are scheduled right now. Check back soon.</Text>
          </View>
        ) : (
          list.map(d => {
            const p = parts(d.drive_date);
            const nearby = !!mine && d.pincode === mine;
            return (
              <View key={d.id} style={styles.driveCard}>
                <View style={styles.driveHeaderRow}>
                  <View style={styles.dateBox}>
                    <Text style={styles.dateDay}>{p.day}</Text>
                    <Text style={styles.dateMonth}>{p.month}</Text>
                  </View>
                  <View style={styles.driveContent}>
                    <View style={styles.topMetaRow}>
                      <Text style={styles.tagLabel}>{nearby ? 'IN YOUR AREA' : d.pincode ? `PINCODE ${d.pincode}` : 'ALL AREAS'}</Text>
                    </View>
                    <Text style={styles.cardTitle}>{d.title}</Text>
                    <View style={styles.metaRow}>
                      <Icon name="clock-outline" size={14} color={theme.colors.textSecondary} />
                      <Text style={styles.metaText}>{p.weekday}{d.time_window ? ` · ${d.time_window}` : ''}</Text>
                    </View>
                    <View style={styles.metaRow}>
                      <Icon name="map-marker-outline" size={14} color={theme.colors.textSecondary} />
                      <Text style={styles.metaText}>{d.location}</Text>
                    </View>
                    {!!d.description && <Text style={styles.cardBody}>{d.description}</Text>}
                  </View>
                </View>
              </View>
            );
          })
        )}

        <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Drop-off points</Text>
        {dropOffs === null ? (
          <ActivityIndicator style={{ marginVertical: 16 }} color={theme.colors.primary} />
        ) : dropOffs.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No drop-off points are open right now. Check back soon.</Text>
          </View>
        ) : (
          dropOffs.map(p => {
            const today = toDayKey(new Date());
            const upcoming = p.start_date > today;
            const nearby = !!mine && p.pincode === mine;
            const hours = p.open_time && p.close_time ? `${p.open_time} – ${p.close_time}` : p.open_time || p.close_time || null;
            return (
              <View key={p.id} style={styles.driveCard}>
                <View style={styles.driveHeaderRow}>
                  <View style={styles.dateBox}>
                    <Icon name="package-variant-closed" size={26} color={theme.colors.primary} />
                  </View>
                  <View style={styles.driveContent}>
                    <View style={styles.topMetaRow}>
                      <Text style={styles.tagLabel}>{nearby ? 'IN YOUR AREA' : p.pincode ? `PINCODE ${p.pincode}` : 'ALL AREAS'}</Text>
                      <Text style={[styles.statusTag, !upcoming && { color: theme.colors.primary }]}>{upcoming ? `OPENS ${shortDate(p.start_date).toUpperCase()}` : 'OPEN NOW'}</Text>
                    </View>
                    <Text style={styles.cardTitle}>{p.name}</Text>
                    <View style={styles.metaRow}>
                      <Icon name="map-marker-outline" size={14} color={theme.colors.textSecondary} />
                      <Text style={styles.metaText}>{p.address}</Text>
                    </View>
                    <View style={styles.metaRow}>
                      <Icon name="calendar-range" size={14} color={theme.colors.textSecondary} />
                      <Text style={styles.metaText}>{shortDate(p.start_date)} – {shortDate(p.end_date)}</Text>
                    </View>
                    {!!hours && (
                      <View style={styles.metaRow}>
                        <Icon name="clock-outline" size={14} color={theme.colors.textSecondary} />
                        <Text style={styles.metaText}>Daily {hours}</Text>
                      </View>
                    )}
                    {!!p.contact && (
                      <View style={styles.metaRow}>
                        <Icon name="phone-outline" size={14} color={theme.colors.textSecondary} />
                        <Text style={styles.metaText}>{p.contact}</Text>
                      </View>
                    )}
                    {!!p.description && <Text style={styles.cardBody}>{p.description}</Text>}
                  </View>
                </View>
              </View>
            );
          })
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
  pageTitle: { fontSize: 28, fontFamily: theme.fonts.bodyBold, color: theme.colors.text, marginBottom: 4 },
  pageSubtitle: { fontSize: 14, color: theme.colors.textSecondary, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontFamily: theme.fonts.bodyBold, color: theme.colors.text, marginBottom: 10 },
  emptyCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 22,
  },
  emptyText: { fontFamily: theme.fonts.body, fontSize: 13, color: theme.colors.textSecondary, paddingVertical: 12 },
  driveCard: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 14,
  },
  driveHeaderRow: { flexDirection: 'row', gap: 14 },
  dateBox: {
    width: 52,
    height: 58,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primaryContainer,
  },
  dateDay: { fontSize: 20, fontFamily: theme.fonts.bodyBold, color: theme.colors.primary },
  dateMonth: { fontSize: 11, fontFamily: theme.fonts.bodyBold, color: theme.colors.primary, letterSpacing: 0.5 },
  driveContent: { flex: 1 },
  topMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  tagLabel: { fontSize: 10, fontFamily: theme.fonts.bodyBold, color: theme.colors.primary, letterSpacing: 0.8 },
  statusTag: { fontSize: 10, fontFamily: theme.fonts.bodyBold, color: theme.colors.textSecondary, letterSpacing: 0.8 },
  cardTitle: { fontSize: 16, fontFamily: theme.fonts.bodyBold, color: theme.colors.text, marginBottom: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  metaText: { flex: 1, fontSize: 13, fontFamily: theme.fonts.body, color: theme.colors.textSecondary },
  cardBody: { fontSize: 13, fontFamily: theme.fonts.body, color: theme.colors.textSecondary, marginTop: 6, lineHeight: 18 },
});
