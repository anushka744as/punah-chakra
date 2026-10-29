import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, RefreshControl } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme/theme';
import { useAppData } from '../data/AppDataContext';
import { CollectionDrive, UpcomingPickupDay, fetchUpcomingDrives, fetchUpcomingAvailability } from '../services/api';
import { toDayKey } from '../utils/dayKey';

// Shown only while the admin hasn't added any real drives yet, so the page isn't blank.
const sampleDrives = (): CollectionDrive[] => {
  const inDays = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return toDayKey(d);
  };
  return [
    { id: 'sample-1', title: 'Diwali Clothes Drive', drive_date: inDays(5), time_window: '10:00 AM – 2:00 PM', location: 'Community Hall, Sector 15A, Noida', pincode: '201301', description: 'Bring clean, reusable clothes and blankets. Our team will sort and pass them on to local shelters.' },
    { id: 'sample-2', title: 'E-Waste Collection Day', drive_date: inDays(12), time_window: '11:00 AM – 4:00 PM', location: 'Sector 44 Market Parking, Noida', pincode: '201303', description: 'Old phones, chargers and small appliances accepted. Items are recycled responsibly.' },
    { id: 'sample-3', title: 'Books & Stationery Drive', drive_date: inDays(20), time_window: '9:00 AM – 1:00 PM', location: 'Public Library, Sector 62', pincode: null, description: 'Donate school books and stationery for children in need.' },
  ];
};

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
  const [pickupDays, setPickupDays] = useState<UpcomingPickupDay[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const areaPincode = profile?.pincode || '';

  const load = useCallback(async () => {
    if (areaPincode) fetchUpcomingAvailability(areaPincode).then(setPickupDays).catch(() => setPickupDays([]));
    else setPickupDays(null);
    try {
      setDrives(await fetchUpcomingDrives());
    } catch {
      setDrives([]);
    }
  }, [areaPincode]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const isSample = drives !== null && drives.length === 0;
  const list = drives === null ? [] : isSample ? sampleDrives() : drives;
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
        <Text style={styles.pageTitle}>Drives & Pickups</Text>
        <Text style={styles.pageSubtitle}>See when pickups are open in your area and upcoming collection drives.</Text>

        {/* Open pickup days the admin set for the donor's pincode */}
        <Text style={styles.sectionTitle}>Upcoming pickups in your area</Text>
        <View style={styles.pickupCard}>
          {!areaPincode ? (
            <TouchableOpacity onPress={() => navigation.navigate('Donate')} activeOpacity={0.7}>
              <Text style={styles.pickupEmptyText}>
                Check your pincode to see pickup days in your area. <Text style={styles.pickupLink}>Check now</Text>
              </Text>
            </TouchableOpacity>
          ) : pickupDays === null ? (
            <Text style={styles.pickupEmptyText}>Loading…</Text>
          ) : pickupDays.length === 0 ? (
            <Text style={styles.pickupEmptyText}>No open pickup days in the next two weeks for {areaPincode}. Check back soon.</Text>
          ) : (
            pickupDays.map((u, i) => {
              const [y, m, d] = u.day.split('-').map(Number);
              const label = new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
              return (
                <TouchableOpacity
                  key={u.day}
                  style={[styles.pickupRow, i > 0 && styles.pickupRowBorder]}
                  onPress={() => navigation.navigate('Donate')}
                  activeOpacity={0.7}
                >
                  <View style={styles.pickupIconBg}>
                    <Icon name="calendar-clock-outline" size={20} color={theme.colors.primaryDark} />
                  </View>
                  <View style={styles.pickupTextCol}>
                    <Text style={styles.pickupDay}>{label}</Text>
                    <Text style={styles.pickupMeta}>
                      {u.slots.length === 0 ? 'All time slots open' : `${u.slots.length} time slot${u.slots.length === 1 ? '' : 's'} open`} · {areaPincode}
                    </Text>
                  </View>
                  <Text style={styles.pickupLink}>BOOK</Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        <Text style={styles.sectionTitle}>Collection drives</Text>

        {isSample && (
          <View style={styles.sampleNote}>
            <Icon name="information-outline" size={16} color={theme.colors.primaryDark} />
            <Text style={styles.sampleNoteText}>These are sample drives. Real ones will appear here once announced.</Text>
          </View>
        )}

        {drives === null ? (
          <ActivityIndicator style={{ marginTop: 32 }} color={theme.colors.primary} />
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
                      {isSample && <Text style={styles.sampleTag}>SAMPLE</Text>}
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
  pickupCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 22,
  },
  pickupRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  pickupRowBorder: { borderTopWidth: 1, borderTopColor: theme.colors.border },
  pickupIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primaryContainer,
  },
  pickupTextCol: { flex: 1, marginLeft: 12 },
  pickupDay: { fontFamily: theme.fonts.bodySemiBold, fontSize: 15, color: theme.colors.text },
  pickupMeta: { fontFamily: theme.fonts.body, fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
  pickupLink: { fontFamily: theme.fonts.bodyBold, fontSize: 12, color: theme.colors.primary, letterSpacing: 0.5 },
  pickupEmptyText: { fontFamily: theme.fonts.body, fontSize: 13, color: theme.colors.textSecondary, paddingVertical: 12 },
  sampleNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.primaryContainer,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  sampleNoteText: { flex: 1, fontSize: 12, fontFamily: theme.fonts.body, color: theme.colors.primaryDark },
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
  sampleTag: { fontSize: 10, fontFamily: theme.fonts.bodyBold, color: theme.colors.textSecondary, letterSpacing: 0.8 },
  cardTitle: { fontSize: 16, fontFamily: theme.fonts.bodyBold, color: theme.colors.text, marginBottom: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  metaText: { flex: 1, fontSize: 13, fontFamily: theme.fonts.body, color: theme.colors.textSecondary },
  cardBody: { fontSize: 13, fontFamily: theme.fonts.body, color: theme.colors.textSecondary, marginTop: 6, lineHeight: 18 },
});
