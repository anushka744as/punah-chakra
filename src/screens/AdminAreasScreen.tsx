import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../theme/theme';
import { useAppData } from '../data/AppDataContext';
import {
  AreaRequest,
  fetchAreaRequests,
  markAreaRequestPincodesSeen,
} from '../services/api';

export const AdminAreasScreen = ({ navigation }: any) => {
  const { serviceablePincodes, addServiceablePincode } = useAppData();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<AreaRequest[]>([]);
  const [selectedPin, setSelectedPin] = useState<string | null>(null);



  const load = useCallback(async () => {
    const [r] = await Promise.all([
      fetchAreaRequests().catch(() => []),
    ]);
    setRequests(r);
    markAreaRequestPincodesSeen(r.map(x => x.pincode)); // opening this page clears the Areas badge
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // Pincodes people asked for, with how many asked — what the admin cares about when deciding
  // where to expand.
  const demand = Object.entries(
    requests.reduce<Record<string, number>>((acc, r) => {
      if (serviceablePincodes.includes(r.pincode)) return acc; // already served now
      acc[r.pincode] = (acc[r.pincode] || 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]);

  const visibleRequests = selectedPin ? requests.filter(r => r.pincode === selectedPin) : requests;

  const startService = (pin: string) =>
    Alert.alert(`Start service in ${pin}?`, 'This makes the pincode serviceable, so donors there can book pickups.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Add pincode',
        onPress: async () => {
          try {
            await addServiceablePincode(pin);
          } catch (err: any) {
            Alert.alert('Could not add', err?.message || 'Try again.');
          }
        },
      },
    ]);

  const openMap = (r: AreaRequest) => {
    if (r.latitude == null || r.longitude == null) return;
    Linking.openURL(`https://www.google.com/maps?q=${r.latitude},${r.longitude}`).catch(() => {});
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Icon name="arrow-left" size={24} color={theme.colors.surface} />
        </TouchableOpacity>
        <Text style={styles.title}>Pincode requests</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={theme.colors.primary} />
      ) : (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <View style={styles.heroTile}>
              <Text style={styles.heroLabel}>PINCODES ASKED</Text>
              <Text style={styles.heroNum}>{demand.length}</Text>
            </View>
            <View style={styles.heroTile}>
              <Text style={styles.heroLabel}>TOTAL REQUESTS</Text>
              <Text style={styles.heroNum}>{requests.length}</Text>
            </View>
          </View>
          <Text style={styles.hint}>Pincodes people tried to book from but we don't serve yet. Tap "Start service" to add one.</Text>

          {requests.length === 0 ? (
            <View style={styles.emptyBox}>
              <Icon name="map-marker-check-outline" size={44} color={theme.colors.primary} />
              <Text style={styles.empty}>No requests yet.</Text>
            </View>
          ) : (
            <>
              <Text style={styles.section}>Most requested</Text>
              {demand.map(([pin, count]) => (
                <TouchableOpacity
                  key={pin}
                  style={[styles.card, selectedPin === pin && styles.cardSelected]}
                  activeOpacity={0.85}
                  onPress={() => setSelectedPin(selectedPin === pin ? null : pin)}
                >
                  <View style={styles.pinBadge}>
                    <Icon name="map-marker-radius" size={20} color={theme.colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{pin}</Text>
                    <Text style={styles.cardSub}>{count} request{count === 1 ? '' : 's'}</Text>
                  </View>
                  <TouchableOpacity style={styles.startBtn} onPress={() => startService(pin)} activeOpacity={0.8}>
                    <Text style={styles.startBtnText}>Start service</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
              <View style={[styles.filterRow, { marginTop: theme.spacing.sm }]}>
                <Text style={styles.section}>
                  {selectedPin ? `Requests for ${selectedPin} (${visibleRequests.length})` : 'Individual requests'}
                </Text>
                {selectedPin && (
                  <TouchableOpacity onPress={() => setSelectedPin(null)} style={styles.clearChip} activeOpacity={0.8}>
                    <Text style={styles.clearChipText}>Show all</Text>
                  </TouchableOpacity>
                )}
              </View>
              {!selectedPin && demand.length > 0 && <Text style={styles.hint}>Tap a pincode above to see only its requests.</Text>}
              {visibleRequests.map(r => (
                <View key={r.id} style={styles.card}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{r.full_name || 'Unnamed donor'} · {r.pincode}</Text>
                    {!!r.phone && <Text style={styles.cardSub}>{r.phone}</Text>}
                    {!!r.address && <Text style={styles.cardSub} numberOfLines={2}>{r.address}</Text>}
                    <Text style={styles.cardMeta}>{new Date(r.created_at).toLocaleDateString('en-IN')}</Text>
                  </View>
                  {r.latitude != null && r.longitude != null && (
                    <TouchableOpacity onPress={() => openMap(r)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Icon name="map-marker" size={24} color={theme.colors.primary} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </>
          )}


        </ScrollView>
      )}
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
  tabs: { flexDirection: 'row', marginHorizontal: theme.spacing.md, gap: theme.spacing.sm },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  tabActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  tabText: { fontSize: 13, fontFamily: theme.fonts.bodySemiBold, color: theme.colors.textSecondary },
  tabTextActive: { color: theme.colors.surface },
  content: { padding: theme.spacing.md, gap: theme.spacing.sm, paddingBottom: theme.spacing.xxl },
  section: { fontSize: 16, fontFamily: theme.fonts.bodyBold, color: theme.colors.text },
  hint: { fontSize: 13, fontFamily: theme.fonts.body, color: theme.colors.textSecondary },
  empty: { textAlign: 'center', color: theme.colors.textSecondary, fontFamily: theme.fonts.body },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { backgroundColor: theme.colors.primaryContainer, borderRadius: theme.radius.full, paddingHorizontal: 12, paddingVertical: 6 },
  chipText: { fontSize: 12, fontFamily: theme.fonts.bodySemiBold, color: theme.colors.primary },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
  },
  cardSelected: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryContainer },
  filterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  clearChip: { backgroundColor: theme.colors.primaryContainer, borderRadius: theme.radius.full, paddingHorizontal: 12, paddingVertical: 6 },
  clearChipText: { fontSize: 12, fontFamily: theme.fonts.bodyBold, color: theme.colors.primary },
  hero: { flexDirection: 'row', gap: 10 },
  heroTile: { flex: 1, backgroundColor: theme.colors.surface, borderRadius: 18, borderWidth: 1, borderColor: theme.colors.border, paddingVertical: 14, paddingHorizontal: 12 },
  heroLabel: { fontSize: 10, letterSpacing: 0.8, fontFamily: theme.fonts.bodyBold, color: theme.colors.textSecondary },
  heroNum: { fontSize: 30, fontFamily: theme.fonts.bodyBold, color: theme.colors.text, marginTop: 4 },
  emptyBox: { alignItems: 'center', gap: 8, paddingVertical: 40 },
  pinBadge: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.primaryContainer, alignItems: 'center', justifyContent: 'center' },
  startBtn: { backgroundColor: theme.colors.primary, borderRadius: theme.radius.full, paddingHorizontal: 14, paddingVertical: 8 },
  startBtnText: { fontSize: 12, fontFamily: theme.fonts.bodyBold, color: theme.colors.surface },
  cardTitle: { fontSize: 14, fontFamily: theme.fonts.bodySemiBold, color: theme.colors.text },
  cardSub: { fontSize: 13, fontFamily: theme.fonts.body, color: theme.colors.textSecondary, marginTop: 2 },
  cardMeta: { fontSize: 12, fontFamily: theme.fonts.body, color: theme.colors.textSecondary, marginTop: 4 },
  form: { gap: theme.spacing.sm, marginBottom: theme.spacing.sm },
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: theme.fonts.body,
    color: theme.colors.text,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.full,
    paddingVertical: 12,
  },
  addBtnText: { fontSize: 14, fontFamily: theme.fonts.bodySemiBold, color: theme.colors.surface },
});
